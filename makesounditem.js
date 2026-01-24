// save as: generate-audio.mjs (or .js with "type": "module" in package.json)
import axios from 'axios';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const INPUT_CSV = 'e-a.csv'; // Your CSV file
const OUTPUT_DIR = 'bilingual_audio';
const PAUSE_DURATION = 1.5; // seconds between German and English

async function parseCSVFromFile(filePath) {
    try {
        const csvContent = await fs.readFile(filePath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        const vocabulary = [];
        
        // Skip header if present
        const startIndex = lines[0].startsWith('German,English') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            // Simple CSV parsing (handles most cases)
            // Find first comma that's not inside parentheses
            let commaIndex = -1;
            let inParentheses = false;
            
            for (let j = 0; j < line.length; j++) {
                if (line[j] === '(') inParentheses = true;
                else if (line[j] === ')') inParentheses = false;
                else if (line[j] === ',' && !inParentheses) {
                    commaIndex = j;
                    break;
                }
            }
            
            if (commaIndex === -1) {
                console.warn(`No comma found in line: ${line}`);
                continue;
            }
            
            const german = line.substring(0, commaIndex).trim();
            const english = line.substring(commaIndex + 1).trim();
            
            vocabulary.push({ german, english });
        }
        
        return vocabulary;
    } catch (error) {
        console.error(`Error reading CSV file ${filePath}:`, error.message);
        throw error;
    }
}

async function downloadTTS(text, language, filename) {
    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`;
        
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = createWriteStream(filename);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading TTS for "${text.substring(0, 30)}...":`, error.message);
        throw error;
    }
}

async function createSilence(duration, outputFile) {
    const command = `ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t ${duration} -c:a libmp3lame -b:a 64k "${outputFile}" -y`;
    
    try {
        await execPromise(command);
    } catch (error) {
        console.error('Error creating silence:', error);
        // Create empty file as fallback
        await fs.writeFile(outputFile, Buffer.from([]));
    }
}

async function combineAudio(germanFile, silenceFile, englishFile, outputFile) {
    const command = `ffmpeg -i "concat:${germanFile}|${silenceFile}|${englishFile}" -c copy "${outputFile}" -y`;
    
    try {
        await execPromise(command);
    } catch (error) {
        console.error('Error combining audio:', error);
        throw error;
    }
}

async function generateAudioForWord(german, english, index) {
    console.log(`Processing ${index + 1}: ${german.substring(0, 40)}...`);
    
    const tempDir = 'temp_audio';
    await fs.mkdir(tempDir, { recursive: true });
    
    const germanFile = path.join(tempDir, `temp_${index}_de.mp3`);
    const englishFile = path.join(tempDir, `temp_${index}_en.mp3`);
    const silenceFile = path.join(tempDir, `temp_silence_${index}.mp3`);
    const outputFile = path.join(OUTPUT_DIR, `word_${String(index + 1).padStart(3, '0')}.mp3`);
    
    try {
        // Step 1: Download German and English audio
        await Promise.all([
            downloadTTS(german, 'de', germanFile),
            downloadTTS(english, 'en', englishFile)
        ]);
        
        // Step 2: Create silence
        await createSilence(PAUSE_DURATION, silenceFile);
        
        // Step 3: Combine all files
        await combineAudio(germanFile, silenceFile, englishFile, outputFile);
        
        console.log(`✓ Created: ${path.basename(outputFile)}`);
        return { success: true, file: outputFile, german, english };
    } catch (error) {
        console.error(`✗ Failed: ${german.substring(0, 30)}...`, error.message);
        return { success: false, error: error.message, german, english };
    } finally {
        // Clean up temp files
        try {
            await Promise.all([
                fs.unlink(germanFile).catch(() => {}),
                fs.unlink(englishFile).catch(() => {}),
                fs.unlink(silenceFile).catch(() => {})
            ]);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

export async function generateAudioFromCSV(csvFilePath = INPUT_CSV) {
    console.log('🎧 German-English Audio Generator\n');
    
    // Check for ffmpeg
    try {
        await execPromise('ffmpeg -version');
    } catch (error) {
        console.error('❌ Error: ffmpeg is required but not installed.');
        console.log('Please install ffmpeg first:');
        console.log('- macOS: brew install ffmpeg');
        console.log('- Ubuntu/Debian: sudo apt install ffmpeg');
        console.log('- Windows: Download from https://ffmpeg.org/');
        process.exit(1);
    }
    
    // Check if CSV file exists
    try {
        await fs.access(csvFilePath);
    } catch (error) {
        console.error(`❌ Error: CSV file "${csvFilePath}" not found.`);
        console.log('Please make sure the file exists in the current directory.');
        process.exit(1);
    }
    
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Parse CSV from file
    console.log(`Reading vocabulary from: ${csvFilePath}`);
    const vocabulary = await parseCSVFromFile(csvFilePath);
    
    console.log(`Found ${vocabulary.length} vocabulary items\n`);
    
    // Generate audio for each word
    const results = [];
    let successCount = 0;
    
    for (let i = 0; i < vocabulary.length; i++) {
        const item = vocabulary[i];
        const result = await generateAudioForWord(item.german, item.english, i);
        results.push(result);
        
        if (result.success) successCount++;
        
        // Rate limiting to avoid being blocked
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Progress indicator
        if ((i + 1) % 10 === 0 || i === vocabulary.length - 1) {
            console.log(`Progress: ${i + 1}/${vocabulary.length} (${Math.round((i + 1) / vocabulary.length * 100)}%)`);
        }
    }
    
    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Generation Complete!`);
    console.log(`📊 Success: ${successCount}/${vocabulary.length}`);
    console.log(`📁 Output directory: ${path.resolve(OUTPUT_DIR)}`);
    
    // Save manifest file
    const manifest = {
        generated: new Date().toISOString(),
        sourceFile: csvFilePath,
        total: vocabulary.length,
        successful: successCount,
        failed: vocabulary.length - successCount,
        pauseDuration: PAUSE_DURATION,
        items: results.map((r, i) => ({
            index: i + 1,
            german: vocabulary[i].german,
            english: vocabulary[i].english,
            success: r.success,
            file: r.success ? `word_${String(i + 1).padStart(3, '0')}.mp3` : null,
            error: r.error || null
        }))
    };
    
    await fs.writeFile(
        path.join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    // Save failed items for retry
    const failedItems = results.filter(r => !r.success);
    if (failedItems.length > 0) {
        const failedCsv = failedItems.map((r, i) => 
            `${vocabulary[results.indexOf(r)].german},${vocabulary[results.indexOf(r)].english}`
        ).join('\n');
        
        await fs.writeFile(
            path.join(OUTPUT_DIR, 'failed_items.csv'),
            `German,English\n${failedCsv}`
        );
        console.log(`❌ Failed items saved: ${path.join(OUTPUT_DIR, 'failed_items.csv')}`);
    }
    
    console.log(`📄 Manifest saved: ${path.join(OUTPUT_DIR, 'manifest.json')}`);
    console.log('\n🎯 All done! Ready for your language learning!');
    
    return {
        total: vocabulary.length,
        successful: successCount,
        failed: vocabulary.length - successCount,
        outputDir: OUTPUT_DIR
    };
}

// Export other functions if needed
export { parseCSVFromFile, generateAudioForWord };

// DEBUG - Check what's happening
console.log('DEBUG INFO:');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// FIX: Compare without extensions
const scriptPath = new URL(import.meta.url).pathname;
const argvPath = process.argv[1];

// Remove extensions for comparison
const normalizePath = (p) => p.replace(/\.(js|mjs|cjs)$/, '');

if (normalizePath(scriptPath) === normalizePath(argvPath)) {
    console.log('✅ Running main function...');
    const csvFile = process.argv[2] || INPUT_CSV;
    generateAudioFromCSV(csvFile).catch(console.error);
} else {
    console.log('⚠️  Not running automatically (being imported)');
}