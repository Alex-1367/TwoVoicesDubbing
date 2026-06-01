import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000
const PAGE_HEIGHT = 28000

// Load your word lists
const glueWords = JSON.parse(readFileSync('./german_glue_words.json', 'utf8'));

// Flatten conjunctions
const allConjunctions = [
  ...glueWords.conjunctions.coordinating,
  ...glueWords.conjunctions.subordinating
];

// Define all categories with colors
const wordCategories = [
  { words: glueWords.prepositions, color: 'blue', name: 'Preposition', caseInsensitive: true },
  { words: glueWords.two_way_prepositions || [], color: 'darkblue', name: 'Two-way Prep', caseInsensitive: true },
  { words: allConjunctions, color: 'green', name: 'Conjunction', caseInsensitive: true },
  { words: glueWords.comparison_words, color: 'darkgreen', name: 'Comparison', caseInsensitive: true },
  { words: glueWords.separable_prefixes, color: 'purple', name: 'Separable Prefix', caseInsensitive: true },
  { words: glueWords.personal_pronouns, color: 'red', name: 'Personal Pronoun', caseInsensitive: false },
  { words: glueWords.possessive_pronouns, color: 'magenta', name: 'Possessive', caseInsensitive: true },
  { words: glueWords.reflexive_pronouns, color: 'orange', name: 'Reflexive', caseInsensitive: true },
  { words: glueWords.question_words, color: 'cyan', name: 'Question Word', caseInsensitive: true },
  { words: glueWords.modal_particles, color: 'darkred', name: 'Particle', caseInsensitive: true },
  { words: glueWords.determiners_articles, color: 'teal', name: 'Article/Det', caseInsensitive: true },
  { words: glueWords.temporal_location_adverbs, color: 'brown', name: 'Temp/Loc Adv', caseInsensitive: true },
  { words: glueWords.infinitive_markers, color: 'olive', name: 'Infinitive Marker', caseInsensitive: true },
  { words: glueWords.da_wo_compounds || [], color: 'coral', name: 'Da/Wo-Comp', caseInsensitive: true },
  { words: glueWords.negation_words || [], color: 'gray', name: 'Negation', caseInsensitive: true },
  { words: glueWords.modal_verbs || [], color: 'gold', name: 'Modal Verb', caseInsensitive: true },
  {
    words: (glueWords.verb_position_indicators?.main_clause_triggers || []),
    color: 'lime', name: 'Main Clause Trigger', caseInsensitive: true
  },
  {
    words: (glueWords.verb_position_indicators?.subclause_position_triggers || []),
    color: 'darkorange', name: 'Subclause Trigger', caseInsensitive: true
  },
  {
    words: (glueWords.verb_position_indicators?.verb_at_end_markers || []),
    color: 'goldenrod', name: 'Verb-at-End Marker', caseInsensitive: true
  },
  {
    words: (glueWords.case_markers?.accusative_prepositions || []),
    color: 'lightblue', name: 'Accusative Prep', caseInsensitive: true
  },
  {
    words: (glueWords.case_markers?.dative_prepositions || []),
    color: 'lightcoral', name: 'Dative Prep', caseInsensitive: true
  },
  {
    words: (glueWords.case_markers?.genitive_prepositions || []),
    color: 'plum', name: 'Genitive Prep', caseInsensitive: true
  },
  {
    words: (glueWords.case_markers?.accusative_articles || []),
    color: 'skyblue', name: 'Accusative Article', caseInsensitive: true
  },
  {
    words: (glueWords.case_markers?.dative_articles || []),
    color: 'salmon', name: 'Dative Article', caseInsensitive: true
  },
  {
    words: (glueWords.fixed_preposition_verb_combos || []),
    color: 'violet', name: 'Fixed Prep+Verb', caseInsensitive: true
  },
  // NEW CATEGORIES (ONLY ADDITIONS - NO DELETIONS)
  {
    words: (glueWords.orientation_adverbs?.direction || []),
    color: 'lightseagreen', name: 'Direction Adv', caseInsensitive: true
  },
  {
    words: (glueWords.orientation_adverbs?.position || []),
    color: 'mediumturquoise', name: 'Position Adv', caseInsensitive: true
  },
  {
    words: (glueWords.orientation_adverbs?.location_relative || []),
    color: 'turquoise', name: 'Relative Location', caseInsensitive: true
  },
  {
    words: (glueWords.comparative_quantifiers || []),
    color: 'yellowgreen', name: 'Comparative Quantifier', caseInsensitive: true
  },
  {
    words: (glueWords.intensifiers || []),
    color: 'khaki', name: 'Intensifier', caseInsensitive: true
  },
  {
    words: (glueWords.orientation_prepositions_extended || []),
    color: 'steelblue', name: 'Orientation Prep', caseInsensitive: true
  },
  {
    words: (glueWords.transition_words || []),
    color: 'plum', name: 'Transition', caseInsensitive: true
  },
  {
    words: (glueWords.cause_effect_words || []),
    color: 'hotpink', name: 'Cause/Effect', caseInsensitive: true
  },
  {
    words: (glueWords.relative_pronouns || []),
    color: 'orchid', name: 'Relative Pronoun', caseInsensitive: true
  },
  {
    words: (glueWords.time_prepositions || []),
    color: 'lightsteelblue', name: 'Time Prep', caseInsensitive: true
  },
  {
    words: (glueWords.negation_placement || []),
    color: 'dimgray', name: 'Negation Placement', caseInsensitive: true
  },
  {
    words: (glueWords.comparative_adjectives || []),
    color: 'olivedrab', name: 'Comparative Adj', caseInsensitive: true
  }
];

function buildMultiWordRegex(wordList, caseInsensitive) {
  if (!wordList || wordList.length === 0) return null;
  const sorted = [...wordList].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('|');
  return new RegExp(`(${pattern})`, caseInsensitive ? 'gi' : 'g');
}

function buildSingleWordRegex(wordList, caseInsensitive) {
  if (!wordList || wordList.length === 0) return null;
  const sorted = [...wordList].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('|');
  return new RegExp(`\\b(${pattern})\\b`, caseInsensitive ? 'gi' : 'g');
}

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
\\red0\\green0\\blue255;
\\red0\\green128\\blue0;
\\red255\\green0\\blue0;
\\red255\\green0\\blue255;
\\red255\\green128\\blue0;
\\red0\\green255\\blue255;
\\red128\\green0\\blue0;
\\red0\\green128\\blue128;
\\red165\\green42\\blue42;
\\red128\\green128\\blue0;
\\red210\\green105\\blue30;
\\red255\\green215\\blue0;
\\red218\\green165\\blue32;
\\red173\\green216\\blue230;
\\red240\\green128\\blue128;
\\red135\\green206\\blue235;
\\red250\\green128\\blue114;
\\red238\\green130\\blue238;
\\red50\\green205\\blue50;
\\red0\\green0\\blue128;
\\red128\\green0\\blue128;
\\red255\\green165\\blue0;
\\red105\\green105\\blue105;
\\red32\\green178\\blue170;
\\red72\\green209\\blue204;
\\red64\\green224\\blue208;
\\red154\\green205\\blue50;
\\red240\\green230\\blue140;
\\red70\\green130\\blue180;
\\red221\\green160\\blue221;
\\red255\\green105\\blue180;
\\red218\\green112\\blue214;
\\red176\\green196\\blue222;
\\red105\\green105\\blue105;
\\red107\\green142\\blue35;
}
\\viewkind4\\uc1\\pard\\lang1031\\f0\\fs24
`;
}

function rtfFooter() { return '}'; }

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
    '«': '\\u171?',
    '»': '\\u187?',
    '–': '\\u8211?',
    '—': '\\u8212?'
  };

  for (const [char, replacement] of Object.entries(charMap)) {
    escaped = escaped.replace(new RegExp(char, 'g'), replacement);
  }

  // THIS IS THE WORKING LINE - DO NOT CHANGE
  escaped = escaped.replace(/\n/g, '\\par\n');
  return escaped;
}

function getColorCode(color) {
  const colorMap = {
    'blue': 2, 'green': 3, 'red': 4, 'magenta': 5, 'orange': 6,
    'cyan': 7, 'darkred': 8, 'teal': 9, 'brown': 10, 'olive': 11,
    'darkorange': 12, 'gold': 13, 'goldenrod': 14, 'lightblue': 15,
    'lightcoral': 16, 'skyblue': 17, 'salmon': 18, 'violet': 19,
    'lime': 20, 'darkblue': 21, 'purple': 22, 'coral': 23, 'gray': 24,
    'lightseagreen': 25, 'mediumturquoise': 26, 'turquoise': 27,
    'yellowgreen': 28, 'khaki': 29, 'steelblue': 30, 'plum': 31,
    'hotpink': 32, 'orchid': 33, 'lightsteelblue': 34, 'dimgray': 35,
    'olivedrab': 36
  };
  return colorMap[color] || 1;
}

function highlightText(text, categoryRules) {
  let matches = [];

  categoryRules.forEach(({ words, color, name, caseInsensitive }) => {
    if (!words || words.length === 0) return;

    let regex;
    if (name === 'Fixed Prep+Verb') {
      regex = buildMultiWordRegex(words, caseInsensitive);
    } else {
      regex = buildSingleWordRegex(words, caseInsensitive);
    }
    if (!regex) return;

    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        word: match[0],
        color,
        name
      });
    }
  });

  matches.sort((a, b) => a.start !== b.start ? a.start - b.start : b.end - a.end);
  let filtered = [];
  let lastEnd = -1;
  for (let m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  let rtf = '';
  let lastIdx = 0;
  for (let m of filtered) {
    if (m.start > lastIdx) {
      rtf += escapeRtf(text.substring(lastIdx, m.start));
    }
    const colorCode = getColorCode(m.color);
    rtf += `{\\cf${colorCode} ${escapeRtf(m.word)}}`;
    lastIdx = m.end;
  }
  if (lastIdx < text.length) {
    rtf += escapeRtf(text.substring(lastIdx));
  }
  return rtf;
}

function processFile(inputPath, outputPath) {
  const text = readFileSync(inputPath, 'utf8');
  const highlighted = highlightText(text, wordCategories);
  const rtfContent = rtfHeader() + highlighted + rtfFooter();
  writeFileSync(outputPath, rtfContent, 'utf8');
  console.log(`✅ Created: ${outputPath}`);
  console.log(`Page size: ${PAGE_WIDTH} x ${PAGE_HEIGHT} twips`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node highlight_deutsch_glue.js <input.txt> <output.rtf>');
  process.exit(1);
}

processFile(args[0], args[1]);