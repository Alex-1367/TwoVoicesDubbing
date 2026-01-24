// combine-audio.mjs
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const INPUT_DIR = 'bilingual_audio';
const OUTPUT_FILE = 'combined_vocabulary.mp3';
const SILENCE_DURATION = 2.5; // seconds between files
const SILENCE_FILE = 'silence_2s.mp3';

async function createSilence(duration, outputFile) {
    const command = `ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t ${duration} -c:a libmp3lame -b:a 64k "${outputFile}" -y`;
    
    try {
        await execPromise(command);
        console.log(`✓ Created ${duration}s silence file`);
        return true;
    } catch (error) {
        console.error('Error creating silence:', error);
        return false;
    }
}

async function getSortedAudioFiles(directory) {
    try {
        const files = await fs.readdir(directory);
        
        // Filter for word_XXX.mp3 files and sort numerically
        const audioFiles = files
            .filter(file => file.match(/^word_\d+\.mp3$/i))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)[0]);
                const numB = parseInt(b.match(/\d+/)[0]);
                return numA - numB;
            })
            .map(file => path.join(directory, file));
        
        console.log(`Found ${audioFiles.length} audio files`);
        return audioFiles;
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

async function createConcatList(audioFiles, silenceFile) {
    const concatListFile = 'concat_list.txt';
    const lines = [];
    
    for (let i = 0; i < audioFiles.length; i++) {
        lines.push(`file '${audioFiles[i]}'`);
        
        // Add silence after each file except the last one
        if (i < audioFiles.length - 1) {
            lines.push(`file '${silenceFile}'`);
        }
    }
    
    await fs.writeFile(concatListFile, lines.join('\n'), 'utf-8');
    console.log(`Created concat list with ${lines.length} entries`);
    return concatListFile;
}

async function combineAllAudio(audioFiles, concatListFile, outputFile) {
    const command = `ffmpeg -f concat -safe 0 -i "${concatListFile}" -c copy "${outputFile}" -y`;
    
    console.log('Combining audio files...');
    console.log(`This may take a while for ${audioFiles.length} files...`);
    
    try {
        const { stdout, stderr } = await execPromise(command);
        console.log('✓ Successfully combined all audio files');
        return true;
    } catch (error) {
        console.error('Error combining audio:', error.stderr || error.message);
        return false;
    }
}

async function calculateTotalDuration(audioFiles, silenceDuration) {
    const getDurationCommand = (file) => 
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`;
    
    let totalDuration = 0;
    
    for (const file of audioFiles) {
        try {
            const { stdout } = await execPromise(getDurationCommand(file));
            const duration = parseFloat(stdout.trim());
            if (!isNaN(duration)) {
                totalDuration += duration;
            }
        } catch (error) {
            console.warn(`Could not get duration for ${file}:`, error.message);
        }
    }
    
    // Add silence durations (between each file)
    totalDuration += (audioFiles.length - 1) * silenceDuration;
    
    return totalDuration;
}

async function cleanupFiles(files) {
    for (const file of files) {
        try {
            await fs.unlink(file);
            console.log(`✓ Cleaned up: ${file}`);
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

async function main() {
    console.log('🎵 Audio File Combiner');
    console.log('='.repeat(40));
    
    // Check for ffmpeg
    try {
        await execPromise('ffmpeg -version');
        await execPromise('ffprobe -version');
    } catch (error) {
        console.error('❌ Error: ffmpeg and ffprobe are required.');
        console.log('Please install ffmpeg first:');
        console.log('- Ubuntu/Debian: sudo apt install ffmpeg');
        console.log('- macOS: brew install ffmpeg');
        console.log('- Windows: Download from https://ffmpeg.org/');
        process.exit(1);
    }
    
    // Get sorted audio files
    const audioFiles = await getSortedAudioFiles(INPUT_DIR);
    
    if (audioFiles.length === 0) {
        console.error(`❌ No audio files found in ${INPUT_DIR}`);
        console.log('Make sure you have word_XXX.mp3 files in that directory');
        process.exit(1);
    }
    
    // Create silence file
    console.log(`\nCreating ${SILENCE_DURATION}s silence interval...`);
    const silenceCreated = await createSilence(SILENCE_DURATION, SILENCE_FILE);
    if (!silenceCreated) {
        console.error('Failed to create silence file');
        process.exit(1);
    }
    
    // Calculate total duration
    console.log('\nCalculating total duration...');
    const totalDuration = await calculateTotalDuration(audioFiles, SILENCE_DURATION);
    const minutes = Math.floor(totalDuration / 60);
    const seconds = Math.round(totalDuration % 60);
    console.log(`Estimated total duration: ${minutes}m ${seconds}s`);
    
    // Create concat list
    console.log('\nCreating concatenation list...');
    const concatListFile = await createConcatList(audioFiles, SILENCE_FILE);
    
    // Combine all files
    console.log('\nCombining audio files...');
    const success = await combineAllAudio(audioFiles, concatListFile, OUTPUT_FILE);
    
    if (success) {
        console.log('\n' + '='.repeat(40));
        console.log(`✅ SUCCESS!`);
        console.log(`📁 Output file: ${OUTPUT_FILE}`);
        console.log(`🎵 ${audioFiles.length} vocabulary items combined`);
        console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);
        console.log(`⏸️  Interval: ${SILENCE_DURATION}s between items`);
        
        // Cleanup temp files
        await cleanupFiles([SILENCE_FILE, concatListFile]);
        
        console.log('\n🎧 Ready for listening!');
    } else {
        console.error('\n❌ Failed to combine audio files');
        process.exit(1);
    }
}

// Run the script
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('combine')) {
    main().catch(console.error);
}

export { combineAllAudio, getSortedAudioFiles };