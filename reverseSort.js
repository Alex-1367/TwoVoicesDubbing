import { existsSync, readFileSync, copyFileSync, writeFileSync } from 'fs';
import path from 'path';

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
    console.error('Error: Please provide a filename');
    console.error('Usage: node sort_dictionary.js <filename>');
    process.exit(1);
}

if (!existsSync(filename)) {
    console.error(`Error: File '${filename}' not found`);
    process.exit(1);
}

// Read the file
const content = readFileSync(filename, 'utf8');

// Split into lines and filter out empty lines
const lines = content.split('\n').filter(line => line.trim() !== '');

if (lines.length === 0) {
    console.error('Error: File is empty');
    process.exit(1);
}

// Extract header (first line)
const header = lines[0];
const dataLines = lines.slice(1);

console.log(`Processing ${dataLines.length} lines...`);

// Function to get sort key (ignoring articles and "to")
function getSortKey(english) {
    // Trim and convert to lowercase
    let key = english.trim().toLowerCase();
    
    // Remove "to " at the beginning (for infinitives)
    key = key.replace(/^to\s+/, '');
    
    // Remove articles "a ", "an ", "the " at the beginning
    key = key.replace(/^(a|an|the)\s+/, '');
    
    return key;
}

// Sort the data lines
dataLines.sort((a, b) => {
    const englishA = a.split(';')[0];
    const englishB = b.split(';')[0];
    
    const keyA = getSortKey(englishA);
    const keyB = getSortKey(englishB);
    
    return keyA.localeCompare(keyB);
});

// Create backup
const backupFile = filename + '.backup';
copyFileSync(filename, backupFile);
console.log(`Backup created: ${backupFile}`);

// Write the sorted content back to the original file
const output = [header, ...dataLines].join('\n');
writeFileSync(filename, output, 'utf8');

console.log(`✓ Sorting complete! ${dataLines.length} lines sorted.`);
console.log(`✓ Original file updated: ${filename}`);