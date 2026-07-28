import { readFileSync, writeFileSync } from 'fs';

const PAGE_WIDTH = 8000;
const PAGE_HEIGHT = 28000;

// ===== CONFIGURATION =====
// Set how many example words to show per category
// 0 = none, 3 = show 3 examples, 10 = show 10 examples, -1 = show all
const EXAMPLES_TO_SHOW = 5;
// =========================

// Load your word lists
const glueWords = JSON.parse(readFileSync('./german_glue_words.json', 'utf8'));

// Get colors from JSON
const C = glueWords.colors || {};

// Get example words for each category from the actual word lists
function getExampleWords(categoryKey, count) {
  if (count === 0) return { words: [], total: 0 };
  
  let words = [];
  
  // Map category keys to actual word lists from glueWords
  const wordLists = {
    'Preposition': glueWords.prepositions || [],
    'Two-way Prep': glueWords.two_way_prepositions || [],
    'Conjunction': [...(glueWords.conjunctions?.coordinating || []), ...(glueWords.conjunctions?.subordinating || [])],
    'Comparison': glueWords.comparison_words || [],
    'Separable Prefix': glueWords.separable_prefixes || [],
    'Personal Pronoun': glueWords.personal_pronouns || [],
    'Possessive': glueWords.possessive_pronouns || [],
    'Reflexive': glueWords.reflexive_pronouns || [],
    'Question Word': glueWords.question_words || [],
    'Particle': glueWords.modal_particles || [],
    'Article/Det': glueWords.determiners_articles || [],
    'Temp/Loc Adv': glueWords.temporal_location_adverbs || [],
    'Infinitive Marker': glueWords.infinitive_markers || [],
    'Da/Wo-Comp': glueWords.da_wo_compounds || [],
    'Negation': glueWords.negation_words || [],
    'Modal Verb': glueWords.modal_verbs || [],
    'Main Clause Trigger': glueWords.verb_position_indicators?.main_clause_triggers || [],
    'Subclause Trigger': glueWords.verb_position_indicators?.subclause_position_triggers || [],
    'Verb-at-End Marker': glueWords.verb_position_indicators?.verb_at_end_markers || [],
    'Accusative Prep': glueWords.case_markers?.accusative_prepositions || [],
    'Dative Prep': glueWords.case_markers?.dative_prepositions || [],
    'Genitive Prep': glueWords.case_markers?.genitive_prepositions || [],
    'Accusative Article': glueWords.case_markers?.accusative_articles || [],
    'Dative Article': glueWords.case_markers?.dative_articles || [],
    'Fixed Prep+Verb': glueWords.fixed_preposition_verb_combos || [],
    'Demonstrative': glueWords.demonstrative_pronouns || [],
    'Prep Contract': glueWords.preposition_contractions || [],
    'Direction Adv': glueWords.orientation_adverbs?.direction || [],
    'Position Adv': glueWords.orientation_adverbs?.position || [],
    'Relative Location': glueWords.orientation_adverbs?.location_relative || [],
    'Comparative Quantifier': glueWords.comparative_quantifiers || [],
    'Intensifier': glueWords.intensifiers || [],
    'Orientation Prep': glueWords.orientation_prepositions_extended || [],
    'Transition': glueWords.transition_words || [],
    'Cause/Effect': glueWords.cause_effect_words || [],
    'Relative Pronoun': glueWords.relative_pronouns || [],
    'Time Prep': glueWords.time_prepositions || [],
    'Negation Placement': glueWords.negation_placement || [],
    'Comparative Adj': glueWords.comparative_adjectives || [],
    'Werden Form': glueWords.werden_conjugations || [],
    'Haben/Sein Form': glueWords.haben_sein_conjugations || [],
    'Modal Past': glueWords.modal_verbs_past || [],
    'Tun/Machen': glueWords.tun_machen || [],
    'Indefinite Pronoun': glueWords.indefinite_pronouns || [],
    'Konjunktiv II': glueWords.konjunktiv_ii_forms ? Object.values(glueWords.konjunktiv_ii_forms).flat() : []
  };
  
  words = wordLists[categoryKey] || [];
  
  if (words.length === 0) return { words: [], total: 0 };
  
  const total = words.length;
  
  // Determine how many to show
  let showCount;
  if (count === -1) {
    showCount = total; // show all
  } else {
    showCount = Math.min(count, total);
  }
  
  // Take first N words
  const selected = words.slice(0, showCount);
  return { words: selected, total: total };
}

// Define all categories with their colors and labels
const CATEGORIES = [
  { label: 'Preposition', color: C.preposition || 'blue' },
  { label: 'Two-way Prep', color: C.two_way_preposition || 'darkblue' },
  { label: 'Conjunction', color: C.conjunction || 'green' },
  { label: 'Comparison', color: C.comparison || 'darkgreen' },
  { label: 'Separable Prefix', color: C.separable_prefix || 'purple' },
  { label: 'Personal Pronoun', color: C.personal_pronoun || 'red' },
  { label: 'Possessive', color: C.possessive_pronoun || 'magenta' },
  { label: 'Reflexive', color: C.reflexive_pronoun || 'orange' },
  { label: 'Question Word', color: C.question_word || 'cyan' },
  { label: 'Particle', color: C.modal_particle || 'darkred' },
  { label: 'Article/Det', color: C.determiner_article || 'teal' },
  { label: 'Temp/Loc Adv', color: C.temporal_location_adverb || 'brown' },
  { label: 'Infinitive Marker', color: C.infinitive_marker || 'olive' },
  { label: 'Da/Wo-Comp', color: C.da_wo_compound || 'coral' },
  { label: 'Negation', color: C.negation || 'gray' },
  { label: 'Modal Verb', color: C.modal_verb || 'gold' },
  { label: 'Main Clause Trigger', color: C.main_clause_trigger || 'lime' },
  { label: 'Subclause Trigger', color: C.subclause_trigger || 'darkorange' },
  { label: 'Verb-at-End Marker', color: C.verb_at_end_marker || 'goldenrod' },
  { label: 'Accusative Prep', color: C.accusative_preposition || 'lightblue' },
  { label: 'Dative Prep', color: C.dative_preposition || 'lightcoral' },
  { label: 'Genitive Prep', color: C.genitive_preposition || 'plum' },
  { label: 'Accusative Article', color: C.accusative_article || 'skyblue' },
  { label: 'Dative Article', color: C.dative_article || 'salmon' },
  { label: 'Fixed Prep+Verb', color: C.fixed_preposition_verb || 'violet' },
  { label: 'Demonstrative', color: C.demonstrative_pronoun || 'darkcyan' },
  { label: 'Prep Contract', color: C.preposition_contraction || 'steelblue' },
  { label: 'Direction Adv', color: C.direction_adverb || 'lightseagreen' },
  { label: 'Position Adv', color: C.position_adverb || 'mediumturquoise' },
  { label: 'Relative Location', color: C.relative_location || 'turquoise' },
  { label: 'Comparative Quantifier', color: C.comparative_quantifier || 'yellowgreen' },
  { label: 'Intensifier', color: C.intensifier || 'khaki' },
  { label: 'Orientation Prep', color: C.orientation_preposition || 'steelblue' },
  { label: 'Transition', color: C.transition_word || 'plum' },
  { label: 'Cause/Effect', color: C.cause_effect_word || 'hotpink' },
  { label: 'Relative Pronoun', color: C.relative_pronoun || 'orchid' },
  { label: 'Time Prep', color: C.time_preposition || 'lightsteelblue' },
  { label: 'Negation Placement', color: C.negation_placement || 'dimgray' },
  { label: 'Comparative Adj', color: C.comparative_adjective || 'olivedrab' },
  { label: 'Werden Form', color: C.werden_form || 'gold' },
  { label: 'Haben/Sein Form', color: C.haben_sein_form || 'gold' },
  { label: 'Modal Past', color: C.modal_past || 'gold' },
  { label: 'Tun/Machen', color: C.tun_machen || 'gold' },
  { label: 'Indefinite Pronoun', color: C.indefinite_pronoun || 'mediumaquamarine' },
  { label: 'Konjunktiv II', color: C.konjunktiv_ii || 'gold' }
];

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
    'olivedrab': 36, 'darkcyan': 37, 'mediumaquamarine': 38
  };
  return colorMap[color] || 1;
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
    'Ü': '\\u220?'
  };

  for (const [char, replacement] of Object.entries(charMap)) {
    escaped = escaped.replace(new RegExp(char, 'g'), replacement);
  }

  escaped = escaped.replace(/\n/g, '\\par\n');
  return escaped;
}

function generateLegendPage() {
  let rtf = rtfHeader();
  
  // Title - smaller header (fs18)
  rtf += `\\pard\\plain\\fs18\\b COLOR LEGEND - GERMAN GLUE WORDS\\par\\par\\fs16\\b0\n`;
  
  // Format: colored category name + example words
  rtf += `\\pard\\plain\\fs16\\tx2000\\tx6000\n`;
  
  for (const cat of CATEGORIES) {
    const colorCode = getColorCode(cat.color);
    const label = cat.label;
    const result = getExampleWords(cat.label, EXAMPLES_TO_SHOW);
    const examples = result.words;
    const total = result.total;
    
    // Colored category name
    rtf += `{\\cf${colorCode} ${escapeRtf(label)}}`;
    rtf += `\\tab `;
    
    if (examples.length > 0) {
      // Show examples
      let exampleStr = examples.join(', ');
      
      // Add "..." if we're not showing all
      if (EXAMPLES_TO_SHOW !== -1 && EXAMPLES_TO_SHOW > 0 && total > EXAMPLES_TO_SHOW) {
        exampleStr += ` ... (${total} total)`;
      } else if (EXAMPLES_TO_SHOW === -1) {
        // Show all - no "..." needed
        exampleStr += ` (${total} words)`;
      }
      
      rtf += `${escapeRtf(exampleStr)}`;
    }
    rtf += `\\par\n`;
  }
  
  // Add total count at the bottom
  rtf += `\\par\\par{\\fs14 Total categories: ${CATEGORIES.length}}\\par\n`;
  const showText = EXAMPLES_TO_SHOW === -1 ? 'all' : EXAMPLES_TO_SHOW;
  rtf += `{\\fs14 Showing ${showText} example word${EXAMPLES_TO_SHOW === 1 ? '' : 's'} per category}\\par\n`;
  
  rtf += rtfFooter();
  return rtf;
}

// Main function
function generateLegend(outputPath) {
  try {
    console.log('📖 Generating legend page...');
    console.log(`📝 Loading categories from german_glue_words.json`);
    const showText = EXAMPLES_TO_SHOW === -1 ? 'all' : EXAMPLES_TO_SHOW;
    console.log(`📊 Showing ${showText} example words per category`);
    
    const legendRtf = generateLegendPage();
    writeFileSync(outputPath, legendRtf, 'utf8');
    
    console.log(`✅ Created legend: ${outputPath}`);
    console.log(`📊 Total categories: ${CATEGORIES.length}`);
    console.log('\n🎨 Each category name is colorized with example words');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ENOENT')) {
      console.error('   Make sure german_glue_words.json exists in the current directory');
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node generate_legend.js <output.rtf>');
  console.error('Example: node generate_legend.js legend.rtf');
  console.error('\nTo change number of example words, edit EXAMPLES_TO_SHOW at the top:');
  console.error('  EXAMPLES_TO_SHOW = 0   (no examples)');
  console.error('  EXAMPLES_TO_SHOW = 3   (show 3 examples)');
  console.error('  EXAMPLES_TO_SHOW = 10  (show 10 examples)');
  console.error('  EXAMPLES_TO_SHOW = -1  (show all examples)');
  process.exit(1);
}

generateLegend(args[0]);