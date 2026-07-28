import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000;
const PAGE_HEIGHT = 28000;

// Color mapping for different conjunction types
const COLOR_MAP = {
    'CC': 2,   // Blue - Coordinating Conjunctions
    'SC': 3,   // Green - Subordinating Conjunctions
    'RP': 4,   // Red - Relative Pronouns
    'CA': 5,   // Dark Yellow - Conjunctive Adverbs
    'TP': 6,   // Cyan - Two-Part Conjunctions
    'QW': 7,   // Magenta - Question Words
};

const TYPE_NAMES = {
    'CC': 'Coordinating Conjunctions',
    'SC': 'Subordinating Conjunctions',
    'RP': 'Relative Pronouns',
    'CA': 'Conjunctive Adverbs',
    'TP': 'Two-Part Conjunctions',
    'QW': 'Question Words'
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
\\red0\\green0\\blue255;      // 2: Blue - Coordinating Conjunctions
\\red0\\green128\\blue0;      // 3: Green - Subordinating Conjunctions
\\red255\\green0\\blue0;      // 4: Red - Relative Pronouns
\\red204\\green204\\blue0;    // 5: Dark Yellow - Conjunctive Adverbs
\\red0\\green255\\blue255;    // 6: Cyan - Two-Part Conjunctions
\\red255\\green0\\blue255;    // 7: Magenta - Question Words
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

function createLegend(stats) {
    let legend = `
\\pard\\plain\\fs24\\par
\\pard\\plain\\fs20\\par
{\\fs24\\b CONJUNCTION & CONNECTOR LEGEND:\\par}
\\pard\\plain\\fs20\\par
`;
    
    const colorMap = {
        'CC': 2,
        'SC': 3,
        'RP': 4,
        'CA': 5,
        'TP': 6,
        'QW': 7
    };
    
    // Use RTF bullet command instead of Unicode bullet
    let hasEntries = false;
    for (const [code, count] of Object.entries(stats)) {
        if (count > 0) {
            const colorCode = colorMap[code];
            const name = TYPE_NAMES[code];
            legend += `{\\cf${colorCode} \\bullet ${name} (${count})\\par}\n`;
            hasEntries = true;
        }
    }
    
    if (!hasEntries) {
        legend += `{\\fs20 No conjunctions found in the text.\\par}\n`;
    }
    
    return legend;
}

function processFile(inputPath, outputPath) {
    try {
        const text = readFileSync(inputPath, 'utf8');
        
        console.log('📖 Processing:', inputPath);
        console.log('📝 Text length:', text.length, 'characters');
        
        // Process markers: <CC text />, <SC text />, <RP text />, <CA text />, <TP text />, <QW text />
        const pattern = /<(CC|SC|RP|CA|TP|QW)\s*([^>]*?)\s*\/>/g;
        
        let result = '';
        let lastIndex = 0;
        let match;
        let found = 0;
        const stats = { CC: 0, SC: 0, RP: 0, CA: 0, TP: 0, QW: 0 };
        
        // Find all markers and process them
        while ((match = pattern.exec(text)) !== null) {
            // Add text before this marker
            if (match.index > lastIndex) {
                result += escapeRtf(text.substring(lastIndex, match.index));
            }
            
            // Get the conjunction type and content
            const code = match[1];
            const content = match[2].trim();
            const colorCode = COLOR_MAP[code];
            
            // Color the content
            result += `{\\cf${colorCode} ${escapeRtf(content)}}`;
            
            found++;
            stats[code]++;
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            result += escapeRtf(text.substring(lastIndex));
        }
        
        // Create legend
        const legend = createLegend(stats);
        
        // Create RTF
        const rtfContent = rtfHeader() + result + legend + rtfFooter();
        writeFileSync(outputPath, rtfContent, 'utf8');
        
        console.log(`✅ Processed ${found} marked sections`);
        console.log('\n📊 Conjunction Statistics:');
        if (stats.CC > 0) console.log(`  Coordinating Conjunctions: ${stats.CC}`);
        if (stats.SC > 0) console.log(`  Subordinating Conjunctions: ${stats.SC}`);
        if (stats.RP > 0) console.log(`  Relative Pronouns: ${stats.RP}`);
        if (stats.CA > 0) console.log(`  Conjunctive Adverbs: ${stats.CA}`);
        if (stats.TP > 0) console.log(`  Two-Part Conjunctions: ${stats.TP}`);
        if (stats.QW > 0) console.log(`  Question Words: ${stats.QW}`);
        console.log(`\n✅ Created: ${outputPath}`);
        console.log('\n🎨 Legend added at bottom of page');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node colorize_conjunctions.js <input.txt> <output.rtf>');
    console.error('\nInput file format with all conjunction types:');
    console.error('  <CC und />, <CC aber />, <CC oder />, <CC denn />, <CC sondern />');
    console.error('  <SC weil />, <SC dass />, <SC wenn />, <SC als />, <SC ob />');
    console.error('  <RP der />, <RP die />, <RP das />, <RP welche />');
    console.error('  <CA deshalb />, <CA trotzdem />, <CA jedoch />');
    console.error('  <TP sowohl...als auch />, <TP nicht nur...sondern auch />');
    console.error('  <QW wie />, <QW wo />, <QW was />, <QW warum />, <QW wann />');
    process.exit(1);
}

processFile(args[0], args[1]);