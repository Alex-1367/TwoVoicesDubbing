import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000;
const PAGE_HEIGHT = 28000;

// Color mapping for tenses
const COLOR_MAP = {
    'Pr': 2,   // Blue - Präsens
    'Pf': 3,   // Green - Perfekt
    'Pm': 4,   // Red - Präteritum
    'Pp': 5,   // Dark Yellow - Plusquamperfekt
    'F1': 6,   // Cyan - Futur I
    'F2': 7,   // Magenta - Futur II
    'K1': 8,   // Orange - Konjunktiv I
    'K2': 9,   // Brown - Konjunktiv II
    'ZP': 10   // Teal - Zustandspassiv
};

// Tense names with RTF Unicode escapes (\\u228? for ä)
const TENSE_NAMES = {
    'Pr': 'Pr\\u228?sens',      // Präsens
    'Pf': 'Perfekt',
    'Pm': 'Pr\\u228?teritum',   // Präteritum
    'Pp': 'Plusquamperfekt',
    'F1': 'Futur I',
    'F2': 'Futur II',
    'K1': 'Konjunktiv I',
    'K2': 'Konjunktiv II',
    'ZP': 'Zustandspassiv'
};

function rtfHeader() {
    return `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1031
\\paperw${PAGE_WIDTH}\\paperh${PAGE_HEIGHT}
\\margl720\\margr720\\margt720\\margb720
\\widowctrl0\\ftnbj\\sectd\\sbkpage0\\linex0\\headery720\\footery720
\\pgndec\\pgwsxn${PAGE_WIDTH}\\pghsxn${PAGE_HEIGHT}\\marglsxn720\\margrsxn720\\margtsxn720\\margbsxn720
\\pard\\plain
\\widowctrl0
\\keepn
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\colortbl;
\\red0\\green0\\blue0;
\\red0\\green0\\blue255;      // 2: Blue - Präsens
\\red0\\green128\\blue0;      // 3: Green - Perfekt
\\red255\\green0\\blue0;      // 4: Red - Präteritum
\\red204\\green204\\blue0;    // 5: Dark Yellow - Plusquamperfekt
\\red0\\green255\\blue255;    // 6: Cyan - Futur I
\\red255\\green0\\blue255;    // 7: Magenta - Futur II
\\red255\\green165\\blue0;    // 8: Orange - Konjunktiv I
\\red165\\green42\\blue42;    // 9: Brown - Konjunktiv II
\\red0\\green128\\blue128;    // 10: Teal - Zustandspassiv
}
\\viewkind4\\uc1\\pard\\lang1031\\f0\\fs24
`;
}

function rtfFooter() {
    return '}';
}

function escapeRtf(text) {
    let escaped = text.replace(/[\\{}]/g, '\\$&');
    
    // Use RTF Unicode escape for special characters
    const charMap = {
        'ä': '\\u228?',
        'ö': '\\u246?',
        'ü': '\\u252?',
        'ß': '\\u223?',
        'Ä': '\\u196?',
        'Ö': '\\u214?',
        'Ü': '\\u220?',
        '„': '\\u8222?',
        '“': '\\u8220?',
        '”': '\\u8221?',
        '‚': '\\u8218?',
        '‘': '\\u8216?',
        '’': '\\u8217?',
        '«': '\\u171?',
        '»': '\\u187?',
        '–': '\\u8211?',
        '—': '\\u8212?'
    };
    
    for (const [char, replacement] of Object.entries(charMap)) {
        escaped = escaped.replace(new RegExp(char, 'g'), replacement);
    }
    
    escaped = escaped.replace(/\n/g, '\\par\n');
    return escaped;
}

function createLegend(stats) {
    let legend = `
\\pard\\plain\\fs24\\par
\\pard\\plain\\fs20\\par
{\\fs24\\b TENSE LEGEND:\\par}
\\pard\\plain\\fs20\\par
`;
    
    // Only add tenses that were found
    let hasTenses = false;
    
    for (const [code, count] of Object.entries(stats)) {
        if (count > 0) {
            const colorCode = COLOR_MAP[code];
            const name = TENSE_NAMES[code];
            // Use RTF bullet point with proper syntax
            legend += `{\\cf${colorCode} \\bullet ${name} (${count})\\par}\n`;
            hasTenses = true;
        }
    }
    
    if (!hasTenses) {
        legend += `{\\fs20 No tenses found in the text.\\par}\n`;
    }
    
    return legend;
}

function processFile(inputPath, outputPath) {
    try {
        const text = readFileSync(inputPath, 'utf8');
        
        console.log('📖 Processing:', inputPath);
        console.log('📝 Text length:', text.length, 'characters');
        
        // Process markers: <Pr text />, <Pf text />, etc.
        const pattern = /<(Pr|Pf|Pm|Pp|F1|F2|K1|K2|ZP)\s*([^>]*?)\s*\/>/g;
        
        let result = '';
        let lastIndex = 0;
        let match;
        let found = 0;
        const stats = { Pr: 0, Pf: 0, Pm: 0, Pp: 0, F1: 0, F2: 0, K1: 0, K2: 0, ZP: 0 };
        
        // Find all markers and process them
        while ((match = pattern.exec(text)) !== null) {
            // Add text before this marker
            if (match.index > lastIndex) {
                result += escapeRtf(text.substring(lastIndex, match.index));
            }
            
            // Get the tense and content
            const tenseCode = match[1];
            const content = match[2].trim();
            const colorCode = COLOR_MAP[tenseCode];
            
            // Color the content
            result += `{\\cf${colorCode} ${escapeRtf(content)}}`;
            
            found++;
            stats[tenseCode]++;
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            result += escapeRtf(text.substring(lastIndex));
        }
        
        // Create legend with only tenses that were found
        const legend = createLegend(stats);
        
        // Create RTF
        const rtfContent = rtfHeader() + result + legend + rtfFooter();
        writeFileSync(outputPath, rtfContent, 'utf8');
        
        console.log(`✅ Processed ${found} marked sections`);
        console.log('\n📊 Tense Statistics:');
        let hasStats = false;
        for (const [code, count] of Object.entries(stats)) {
            if (count > 0) {
                const colorNames = {
                    'Pr': '🔵',
                    'Pf': '🟢',
                    'Pm': '🔴',
                    'Pp': '🟡',
                    'F1': '🔷',
                    'F2': '🟣',
                    'K1': '🟠',
                    'K2': '🟤',
                    'ZP': '🩵'
                };
                // For console output, show proper umlauts
                const displayNames = {
                    'Pr': 'Präsens',
                    'Pf': 'Perfekt',
                    'Pm': 'Präteritum',
                    'Pp': 'Plusquamperfekt',
                    'F1': 'Futur I',
                    'F2': 'Futur II',
                    'K1': 'Konjunktiv I',
                    'K2': 'Konjunktiv II',
                    'ZP': 'Zustandspassiv'
                };
                console.log(`  ${colorNames[code]} ${displayNames[code]}: ${count}`);
                hasStats = true;
            }
        }
        if (!hasStats) {
            console.log('  No tenses found!');
        }
        console.log(`\n✅ Created: ${outputPath}`);
        console.log('\n🎨 Legend added at bottom of page (only showing tenses found)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node colorize_tenses.js <input.txt> <output.rtf>');
    console.error('\nInput file format:');
    console.error('  <Pr Guten Tag />, <Pf habe gemacht />');
    console.error('  <Pm war />, <F1 werde gehen />');
    process.exit(1);
}

processFile(args[0], args[1]);