import { readdirSync, statSync } from 'fs';
import { join, basename, resolve, parse } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const TARGET_FOLDER = process.argv[2] || '.'; // Use provided folder path or current directory
const VOLUME_MULTIPLIER = 2; // Increase volume by 3x (300%)

// Check if ffmpeg is installed
async function checkFFmpeg() {
    try {
        await execPromise('ffmpeg -version');
        console.log('✓ FFmpeg is installed');
        return true;
    } catch (error) {
        console.error('✗ FFmpeg is not installed. Please install FFmpeg first:');
        console.error('  - macOS: brew install ffmpeg');
        console.error('  - Ubuntu/Debian: sudo apt-get install ffmpeg');
        console.error('  - Windows: Download from https://ffmpeg.org/download.html');
        return false;
    }
}

// Get all MP3 files in the folder
function getMp3Files(folderPath) {
    try {
        const files = readdirSync(folderPath);
        return files.filter(file => 
            file.toLowerCase().endsWith('.mp3') && 
            statSync(join(folderPath, file)).isFile()
        );
    } catch (error) {
        console.error('Error reading folder:', error.message);
        return [];
    }
}

// Process a single MP3 file - FIXED VERSION
async function processMp3File(inputPath, outputPath, multiplier) {
    const volumeFilter = `volume=${multiplier}`;
    // Using libmp3lame encoder instead of libmp3wrap
    const command = `ffmpeg -i "${inputPath}" -af "${volumeFilter}" -c:a libmp3lame -q:a 2 -y "${outputPath}" 2>&1`;
    
    try {
        console.log(`Processing: ${basename(inputPath)}`);
        const { stdout, stderr } = await execPromise(command);
        console.log(`✓ Created: ${basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`✗ Error processing ${basename(inputPath)}:`);
        console.error(error.message);
        return false;
    }
}

// Main function
async function main() {
    console.log('=== MP3 Volume Booster ===');
    console.log(`Target folder: ${resolve(TARGET_FOLDER)}`);
    console.log(`Volume multiplier: ${VOLUME_MULTIPLIER}x (${VOLUME_MULTIPLIER * 100}%)`);
    console.log('------------------------');
    
    // Check if ffmpeg is available
    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
        process.exit(1);
    }
    
    // Get MP3 files
    const mp3Files = getMp3Files(TARGET_FOLDER);
    
    if (mp3Files.length === 0) {
        console.log('No MP3 files found in the specified folder.');
        return;
    }
    
    console.log(`Found ${mp3Files.length} MP3 file(s)`);
    console.log('------------------------');
    
    // Process each file
    let successCount = 0;
    let failCount = 0;
    
    for (const file of mp3Files) {
        const inputPath = join(TARGET_FOLDER, file);
        const parsedPath = parse(file);
        const outputFileName = `${parsedPath.name}_louder${parsedPath.ext}`;
        const outputPath = join(TARGET_FOLDER, outputFileName);
        
        const success = await processMp3File(inputPath, outputPath, VOLUME_MULTIPLIER);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    console.log('------------------------');
    console.log('Processing complete!');
    console.log(`✓ Successfully processed: ${successCount} file(s)`);
    if (failCount > 0) {
        console.log(`✗ Failed: ${failCount} file(s)`);
    }
}

// Run the script
main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});

// Run the script
main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});