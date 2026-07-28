import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000;
const PAGE_HEIGHT = 28000;

// Color mapping for RTF
const COLOR_MAP = {
    'N': 2,  // Blue - Nominative
    'A': 3,  // Green - Akkusative
    'D': 4,  // Red - Dative
    'G': 5   // Dark Yellow - Genitive
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
\\red0\\green0\\blue255;      // 2: Blue - Nominative
\\red0\\green128\\blue0;      // 3: Green - Akkusative
\\red255\\green0\\blue0;      // 4: Red - Dative
\\red204\\green204\\blue0;    // 5: Dark Yellow - Genitive
}
\\viewkind4\\uc1\\pard\\lang1031\\f0\\fs24
`;
}

function rtfFooter() {
    return '}';
}

function escapeRtf(text) {
    let escaped = text.replace(/[\\{}]/g, '\\$&');
    
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

function createLegend() {
    return `
\\pard\\plain\\fs24\\par
\\pard\\plain\\fs20\\par
{\\fs24\\b LEGEND:\\par}
\\pard\\plain\\fs20\\par
{\\cf2 \\fs20 \\u9679? Blue = Nominative}\\par
{\\cf3 \\fs20 \\u9679? Green = Akkusative}\\par
{\\cf4 \\fs20 \\u9679? Red = Dative}\\par
{\\cf5 \\fs20 \\u9679? Dark Yellow = Genitive}\\par
`;
}

function processFile(inputPath, outputPath) {
    try {
        // Read the input file
        const text = readFileSync(inputPath, 'utf8');
        
        console.log('📖 Processing:', inputPath);
        console.log('📝 Text length:', text.length, 'characters');
        
        // Process markers: <N text />, <A text />, <D text />, <G text />
        const pattern = /<([NADG])\s*([^>]*?)\s*\/>/g;
        
        let result = '';
        let lastIndex = 0;
        let match;
        let found = 0;
        
        // Find all markers and process them
        while ((match = pattern.exec(text)) !== null) {
            // Add text before this marker
            if (match.index > lastIndex) {
                result += escapeRtf(text.substring(lastIndex, match.index));
            }
            
            // Get the case and content
            const caseCode = match[1];
            const content = match[2].trim();
            const colorCode = COLOR_MAP[caseCode];
            
            // Color the content
            result += `{\\cf${colorCode} ${escapeRtf(content)}}`;
            
            found++;
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            result += escapeRtf(text.substring(lastIndex));
        }
        
        // Add legend at the bottom
        const legend = createLegend();
        
        // Create RTF
        const rtfContent = rtfHeader() + result + legend + rtfFooter();
        writeFileSync(outputPath, rtfContent, 'utf8');
        
        console.log(`✅ Processed ${found} marked sections`);
        console.log(`✅ Created: ${outputPath}`);
        console.log('\n🎨 Legend added at bottom of page:');
        console.log('🔵 Blue = Nominative');
        console.log('🟢 Green = Akkusative');
        console.log('🔴 Red = Dative');
        console.log('🟡 Dark Yellow = Genitive');
        
        if (found === 0) {
            console.log('\n⚠️  No markers were processed!');
            console.log('Please check that your input file has markers like:');
            console.log('  <N Guten Tag />, <A meine Damen und Herren />.');
            console.log('  <N Ich /> lebe in <D Deutschland />.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node colorize_case.js <input.txt> <output.rtf>');
    console.error('\nInput file format:');
    console.error('  <N Guten Tag />, <A meine Damen und Herren />.');
    console.error('  <N Ich /> lebe in <D Deutschland />.');
    process.exit(1);
}

processFile(args[0], args[1]);