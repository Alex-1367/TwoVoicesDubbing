import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000
const PAGE_HEIGHT = 28000

// Load your word lists
const glueWords = JSON.parse(readFileSync('./german_glue_words.json', 'utf8'));

// Get colors from JSON
const C = glueWords.colors || {};

// Flatten conjunctions
const allConjunctions = [
  ...glueWords.conjunctions.coordinating,
  ...glueWords.conjunctions.subordinating
];

// Define all categories with colors
const wordCategories = [
  { words: glueWords.prepositions, color: C.preposition || 'blue', name: 'Preposition'},
  { words: glueWords.two_way_prepositions || [], color: C.two_way_preposition || 'darkblue', name: 'Two-way Prep'},
  { words: allConjunctions, color: C.conjunction || 'green', name: 'Conjunction'},
  { words: glueWords.comparison_words, color: C.comparison || 'darkgreen', name: 'Comparison'},
  { words: glueWords.separable_prefixes, color: C.separable_prefix || 'purple', name: 'Separable Prefix'},
  { words: glueWords.personal_pronouns, color: C.personal_pronoun || 'red', name: 'Personal Pronoun' },
  { words: glueWords.possessive_pronouns, color: C.possessive_pronoun || 'magenta', name: 'Possessive'},
  { words: glueWords.reflexive_pronouns, color: C.reflexive_pronoun || 'orange', name: 'Reflexive'},
  { words: glueWords.question_words, color: C.question_word || 'cyan', name: 'Question Word'},
  { words: glueWords.modal_particles, color: C.modal_particle || 'darkred', name: 'Particle'},
  { words: glueWords.determiners_articles, color: C.determiner_article || 'teal', name: 'Article/Det'},
  { words: glueWords.temporal_location_adverbs, color: C.temporal_location_adverb || 'brown', name: 'Temp/Loc Adv'},
  { words: glueWords.infinitive_markers, color: C.infinitive_marker || 'olive', name: 'Infinitive Marker'},
  { words: glueWords.da_wo_compounds || [], color: C.da_wo_compound || 'coral', name: 'Da/Wo-Comp'},
  { words: glueWords.negation_words || [], color: C.negation || 'gray', name: 'Negation'},
  { words: glueWords.modal_verbs || [], color: C.modal_verb || 'gold', name: 'Modal Verb'},
  { words: glueWords.verb_position_indicators?.main_clause_triggers || [], color: C.main_clause_trigger || 'lime', name: 'Main Clause Trigger'},
  { words: glueWords.verb_position_indicators?.subclause_position_triggers || [], color: C.subclause_trigger || 'darkorange', name: 'Subclause Trigger'},
  { words: glueWords.verb_position_indicators?.verb_at_end_markers || [], color: C.verb_at_end_marker || 'goldenrod', name: 'Verb-at-End Marker'},
  { words: glueWords.case_markers?.accusative_prepositions || [], color: C.accusative_preposition || 'lightblue', name: 'Accusative Prep'},
  { words: glueWords.case_markers?.dative_prepositions || [], color: C.dative_preposition || 'lightcoral', name: 'Dative Prep'},
  { words: glueWords.case_markers?.genitive_prepositions || [], color: C.genitive_preposition || 'plum', name: 'Genitive Prep'},
  { words: glueWords.case_markers?.accusative_articles || [], color: C.accusative_article || 'skyblue', name: 'Accusative Article'},
  { words: glueWords.case_markers?.dative_articles || [], color: C.dative_article || 'salmon', name: 'Dative Article'},
  { words: glueWords.fixed_preposition_verb_combos || [], color: C.fixed_preposition_verb || 'violet', name: 'Fixed Prep+Verb'},
  { words: glueWords.demonstrative_pronouns || [], color: C.demonstrative_pronoun || 'darkcyan', name: 'Demonstrative'},
  { words: glueWords.preposition_contractions || [], color: C.preposition_contraction || 'steelblue', name: 'Prep Contract'},
  { words: glueWords.orientation_adverbs?.direction || [], color: C.direction_adverb || 'lightseagreen', name: 'Direction Adv'},
  { words: glueWords.orientation_adverbs?.position || [], color: C.position_adverb || 'mediumturquoise', name: 'Position Adv'},
  { words: glueWords.orientation_adverbs?.location_relative || [], color: C.relative_location || 'turquoise', name: 'Relative Location'},
  { words: glueWords.comparative_quantifiers || [], color: C.comparative_quantifier || 'yellowgreen', name: 'Comparative Quantifier'},
  { words: glueWords.intensifiers || [], color: C.intensifier || 'khaki', name: 'Intensifier'},
  { words: glueWords.orientation_prepositions_extended || [], color: C.orientation_preposition || 'steelblue', name: 'Orientation Prep'},
  { words: glueWords.transition_words || [], color: C.transition_word || 'plum', name: 'Transition'},
  { words: glueWords.cause_effect_words || [], color: C.cause_effect_word || 'hotpink', name: 'Cause/Effect'},
  { words: glueWords.relative_pronouns || [], color: C.relative_pronoun || 'orchid', name: 'Relative Pronoun'},
  { words: glueWords.time_prepositions || [], color: C.time_preposition || 'lightsteelblue', name: 'Time Prep'},
  { words: glueWords.negation_placement || [], color: C.negation_placement || 'dimgray', name: 'Negation Placement'},
  { words: glueWords.comparative_adjectives || [], color: C.comparative_adjective || 'olivedrab', name: 'Comparative Adj'},
  { words: glueWords.werden_conjugations || [], color: C.werden_form || 'gold', name: 'Werden Form'},
  { words: glueWords.haben_sein_conjugations || [], color: C.haben_sein_form || 'gold', name: 'Haben/Sein Form'},
  { words: glueWords.modal_verbs_past || [], color: C.modal_past || 'gold', name: 'Modal Past'},
  { words: glueWords.tun_machen || [], color: C.tun_machen || 'gold', name: 'Tun/Machen'},
  { words: glueWords.indefinite_pronouns || [], color: C.indefinite_pronoun || 'mediumaquamarine', name: 'Indefinite Pronoun' }
];

function buildMultiWordRegex(wordList) {
  if (!wordList || wordList.length === 0) return null;
  const sorted = [...wordList].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('|');
  return new RegExp(`(${pattern})`, 'g');
}

function buildSingleWordRegex(wordList) {
  if (!wordList || wordList.length === 0) return null;
  const sorted = [...wordList].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('|');
  return new RegExp(`\\b(${pattern})\\b`, 'g');
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
\\red0\\green139\\blue139;     
\\red102\\green205\\blue170; 
}
\\viewkind4\\uc1\\pard\\lang1031\\f0\\fs24
`;
}

function rtfFooter() { return '}'; }

function escapeRtf(text) {
  let escaped = text.replace(/[\\{}]/g, '\\$&');

  const charMap = {
    '©': '\\u169?',
    '®': '\\u174?',
    '•': '\\u8226?',
    '○': '\\u9675?',
    '§': '\\u167?',
    '¶': '\\u182?',
    '†': '\\u8224?',
    '‡': '\\u8225?',
    '™': '\\u8482?',
    '€': '\\u8364?',
    '£': '\\u163?',
    '¥': '\\u165?',
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
    'olivedrab': 36,
    'darkcyan': 37,
    'mediumaquamarine': 38
  };
  return colorMap[color] || 1;
}

function highlightText(sourceText, text, categoryRules) {
  let matches = [];

  categoryRules.forEach(({ words, color, name }) => {
    if (!words || words.length === 0) return;

    let regex;
    if (name === 'Fixed Prep+Verb') {
      regex = buildMultiWordRegex(words);
    } else {
      regex = buildSingleWordRegex(words);
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
      const sourceSegment = getOriginalSegment(sourceText, text, lastIdx, m.start);
      rtf += escapeRtf(sourceSegment);
    }
    const originalWord = getOriginalSegment(sourceText, text, m.start, m.end);
    const colorCode = getColorCode(m.color);
    rtf += `{\\cf${colorCode} ${escapeRtf(originalWord)}}`;
    lastIdx = m.end;
  }
  if (lastIdx < text.length) {
    const remainingSegment = getOriginalSegment(sourceText, text, lastIdx, text.length);
    rtf += escapeRtf(remainingSegment);
  }
  return rtf;
}

function getOriginalSegment(sourceText, lowerText, lowerStart, lowerEnd) {
  return sourceText.substring(lowerStart, lowerEnd);
}
function processFile(inputPath, outputPath) {
  const text = readFileSync(inputPath, 'utf8');
  const lowercasedText = text.toLowerCase();
  const highlighted = highlightText(text, lowercasedText, wordCategories);
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