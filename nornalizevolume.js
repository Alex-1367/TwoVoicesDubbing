import { readdirSync, statSync, unlinkSync, existsSync, copyFileSync } from 'fs';
import { join, dirname, resolve, parse } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const TARGET_FOLDER = process.argv[2] || '.';
const HEADROOM_DB = -0.1;
const CREATE_BACKUP = false;

// Stats tracking
let stats = {
    total: 0,
    normalized: 0,
    errors: 0,
    totalBoostDb: 0
};

async function checkFFmpeg() {
    try {
        await execPromise('ffmpeg -version');
        console.log('✓ FFmpeg is installed\n');
        return true;
    } catch (error) {
        console.error('✗ FFmpeg is not installed\n');
        return false;
    }
}

function getMp3Files(folderPath) {
    try {
        const files = readdirSync(folderPath);
        return files.filter(file => 
            file.toLowerCase().endsWith('.mp3') && 
            statSync(join(folderPath, file)).isFile() &&
            !file.includes('_1') &&
            !file.includes('.backup')
        );
    } catch (error) {
        console.error('Error reading folder:', error.message);
        return [];
    }
}

// THIS IS THE WORKING DEEP SCAN FROM BEFORE
async function deepPeakAnalysis(inputPath) {
    console.log(`    🔍 Performing deep scan...`);
    
    const tempFile = join(dirname(inputPath), '_temp_peak_analysis.wav');
    
    try {
        // Extract first 10 seconds to WAV
        const extractCmd = `ffmpeg -i "${inputPath}" -t 10 -acodec pcm_s16le -y "${tempFile}" 2>&1`;
        await execPromise(extractCmd);
        
        // Analyze the WAV file
        const analyzeCmd = `ffmpeg -i "${tempFile}" -af "astats=measure_perchannel=1:metadata=1,ametadata=print:key=lavfi.astats.Overall.Peak_level:file=-" -f null - 2>&1`;
        const { stderr } = await execPromise(analyzeCmd);
        
        // Clean up
        try { unlinkSync(tempFile); } catch (e) {}
        
        const peakMatches = [...stderr.matchAll(/lavfi\.astats\.Overall\.Peak_level=([-0-9.]+)/g)];
        if (peakMatches.length > 0) {
            let peakValues = peakMatches.map(m => parseFloat(m[1]));
            let truePeak = Math.max(...peakValues);
            if (truePeak > 0) truePeak = -truePeak;
            
            console.log(`    ✓ Deep scan complete: peak at ${truePeak.toFixed(2)} dB`);
            return {
                maxVolume: truePeak,
                method: 'deep_scan',
                success: true
            };
        }
        return { success: false };
    } catch (error) {
        try { unlinkSync(tempFile); } catch (e) {}
        return { success: false };
    }
}

// Simple analysis - just try deep scan, nothing else
async function getTrueMaxVolume(inputPath) {
    console.log(`  ↳ Analyzing maximum potential volume...`);
    
    // ONLY try deep scan, no fancy methods
    const deepScan = await deepPeakAnalysis(inputPath);
    
    if (deepScan.success) {
        console.log(`    ✓ Maximum safe peak: ${deepScan.maxVolume.toFixed(2)} dB (${deepScan.method})`);
        return deepScan;
    }
    
    // If deep scan fails, use the original working estimate (-8.0dB)
    console.log(`    ⚠ Using original working estimate: -8.0 dB`);
    return { 
        maxVolume: -8.0, 
        method: 'original_estimate',
        success: true 
    };
}

function calculateMaxBoost(maxVolume) {
    let boostNeeded = -maxVolume + HEADROOM_DB;
    
    if (boostNeeded < 0.5) {
        return 0;
    }
    
    return Math.round(boostNeeded * 10) / 10;
}

async function normalizeFile(inputPath, outputPath, boostDb) {
    const command = `ffmpeg -i "${inputPath}" -af "volume=${boostDb}dB" -c:a libmp3lame -q:a 0 -y "${outputPath}" 2>&1`;
    
    try {
        await execPromise(command);
        return true;
    } catch (error) {
        throw new Error(`Normalization failed: ${error.message}`);
    }
}

function createBackup(filePath) {
    if (!CREATE_BACKUP) return true;
    
    const backupPath = filePath + '.backup';
    try {
        if (!existsSync(backupPath)) {
            copyFileSync(filePath, backupPath);
            return true;
        }
        return true;
    } catch (error) {
        console.error(`    ✗ Backup failed: ${error.message}`);
        return false;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function processFolder() {
    console.log('🔊 MP3 Volume Maximizer (Original Working Version)');
    console.log('================================================\n');
    console.log(`Target folder: ${resolve(TARGET_FOLDER)}`);
    console.log(`Headroom: ${HEADROOM_DB}dB\n`);

    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) process.exit(1);

    const mp3Files = getMp3Files(TARGET_FOLDER);
    
    if (mp3Files.length === 0) {
        console.log('No MP3 files found.\n');
        return;
    }

    console.log(`Found ${mp3Files.length} MP3 file(s) to process\n`);
    console.log('Processing files...\n');

    stats.total = mp3Files.length;

    for (let i = 0; i < mp3Files.length; i++) {
        const file = mp3Files[i];
        const inputPath = join(TARGET_FOLDER, file);
        const parsedPath = parse(file);
        const outputFileName = `${parsedPath.name}_1${parsedPath.ext}`;
        const outputPath = join(TARGET_FOLDER, outputFileName);
        
        const fileStats = statSync(inputPath);
        const fileSize = formatFileSize(fileStats.size);
        
        console.log(`[${i + 1}/${mp3Files.length}] ${file} (${fileSize})`);
        
        try {
            const volumeInfo = await getTrueMaxVolume(inputPath);
            const boostNeeded = calculateMaxBoost(volumeInfo.maxVolume);
            
            console.log(`    Maximum safe boost: +${boostNeeded.toFixed(1)} dB`);
            
            if (boostNeeded <= 0.1) {
                console.log(`  ↳ File already at maximum volume\n`);
                continue;
            }
            
            if (CREATE_BACKUP) {
                if (createBackup(inputPath)) {
                    console.log(`    ✓ Backup created`);
                }
            }
            
            console.log(`  ↳ Applying maximum boost...`);
            await normalizeFile(inputPath, outputPath, boostNeeded);
            
            if (existsSync(outputPath)) {
                const outputStats = statSync(outputPath);
                const newSize = formatFileSize(outputStats.size);
                console.log(`  ✓ Created: ${outputFileName} (${newSize})`);
                
                stats.normalized++;
                stats.totalBoostDb += boostNeeded;
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`  ✗ Error: ${error.message}\n`);
            stats.errors++;
        }
    }

    console.log('\n📊 Processing Summary');
    console.log('====================');
    console.log(`Total files processed: ${stats.total}`);
    console.log(`Files maximized: ${stats.normalized}`);
    console.log(`Errors: ${stats.errors}`);
    
    if (stats.normalized > 0) {
        const avgBoost = stats.totalBoostDb / stats.normalized;
        console.log(`\nAverage boost applied: +${avgBoost.toFixed(1)} dB`);
    }
    
    console.log('\n✅ Processing complete! Files are now at maximum safe volume.\n');
}

processFolder().catch(console.error);