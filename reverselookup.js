// reverse-lookup.js
import { promises as fs } from 'fs';
import { join } from 'path';

// Configuration
const INPUT_DIR = './csv';
const OUTPUT_DIR = './reversy';
const HEADER = 'English;German\n';

async function processFiles() {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        const files = await fs.readdir(INPUT_DIR);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        if (csvFiles.length === 0) {
            console.log('No CSV files found in input directory');
            return;
        }

        console.log(`Found ${csvFiles.length} CSV files to process`);

        // Use a Map for deduplication (key: lowercase english, value: original translation)
        const translationMap = new Map();

        for (const file of csvFiles) {
            const filePath = join(INPUT_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            
            const lines = content.split('\n').slice(1);
            
            lines.forEach(line => {
                if (line.trim()) {
                    const [german, english] = line.split(';');
                    if (german && english) {
                        const englishTrimmed = english.trim();
                        const germanTrimmed = german.trim();
                        const englishLower = englishTrimmed.toLowerCase();
                        
                        // Only add if we haven't seen this English word before
                        if (!translationMap.has(englishLower)) {
                            translationMap.set(englishLower, {
                                english: englishTrimmed,  // Keep original capitalization
                                german: germanTrimmed
                            });
                        } else {
                            console.log(`⚠️  Duplicate found: "${englishTrimmed}" (keeping first occurrence)`);
                        }
                    }
                }
            });
        }

        // Convert Map values to array
        const allTranslations = Array.from(translationMap.values());
        console.log(`\nTotal unique translations: ${allTranslations.length} (${translationMap.size} unique English words)`);

        // Sort by English word (case-insensitive for sorting)
        allTranslations.sort((a, b) => a.english.toLowerCase().localeCompare(b.english.toLowerCase()));

        // Group by first letter (using the actual first character for grouping)
        const groupedByLetter = {};
        for (const translation of allTranslations) {
            const firstLetter = translation.english[0].toUpperCase();
            if (!groupedByLetter[firstLetter]) {
                groupedByLetter[firstLetter] = [];
            }
            groupedByLetter[firstLetter].push(translation);
        }

        // Create files for letters A-Z
        let fileCount = 0;
        let totalEntriesWritten = 0;
        
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            
            if (groupedByLetter[letter] && groupedByLetter[letter].length > 0) {
                // Prepare content for this letter
                let content = HEADER;
                
                // Sort entries within each letter (case-insensitive)
                groupedByLetter[letter].sort((a, b) => 
                    a.english.toLowerCase().localeCompare(b.english.toLowerCase())
                );
                
                groupedByLetter[letter].forEach(translation => {
                    content += `${translation.english};${translation.german}\n`;
                });

                // Write to file
                const outputFile = join(OUTPUT_DIR, `En-${letter}.csv`);
                await fs.writeFile(outputFile, content);
                console.log(`Created ${outputFile} with ${groupedByLetter[letter].length} entries`);
                totalEntriesWritten += groupedByLetter[letter].length;
                fileCount++;
            } else {
                // Create empty file for letters with no words
                const outputFile = join(OUTPUT_DIR, `En-${letter}.csv`);
                await fs.writeFile(outputFile, HEADER);
                console.log(`Created empty file for letter ${letter}`);
                fileCount++;
            }
        }

        console.log(`\n✅ Reverse lookup completed!`);
        console.log(`   - Processed ${csvFiles.length} files`);
        console.log(`   - Found ${translationMap.size} unique English words`);
        console.log(`   - Created ${fileCount} files in ${OUTPUT_DIR}`);
        console.log(`   - Total entries written: ${totalEntriesWritten}`);

    } catch (error) {
        console.error('Error processing files:', error);
    }
}

// Run the script
processFiles();