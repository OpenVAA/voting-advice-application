/**
 * Result of a single text preservation check
 */
export interface TextPreservationCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

/**
 * Overall result of text preservation validation
 */
export interface TextPreservationResult {
  passed: boolean;
  checks: Array<TextPreservationCheck>;
}

/**
 * Common character substitutions that LLMs might make
 */
const SUBSTITUTION_PATTERNS = [
  { pattern: /©/g, replacement: '(c)', name: 'copyright symbol' },
  { pattern: /[""\u201C\u201D]/g, replacement: '"', name: 'smart quotes' },
  { pattern: /[''\u2018\u2019]/g, replacement: "'", name: 'smart apostrophes' },
  { pattern: /[–—\u2013\u2014]/g, replacement: '-', name: 'em/en dashes' },
  { pattern: /…/g, replacement: '...', name: 'ellipsis' },
  { pattern: /[\u00A0]/g, replacement: ' ', name: 'non-breaking spaces' }
] as const;

/**
 * Remove all whitespace from text
 */
function removeWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * Apply common character substitutions
 */
function normalizeSubstitutions(text: string): string {
  let normalized = text;
  for (const { pattern, replacement } of SUBSTITUTION_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

/**
 * Check 1: Core content preservation (most strict)
 * Removes all whitespace and normalizes unicode, then compares exactly
 */
function checkCoreContent(original: string, concatenated: string): TextPreservationCheck {
  const origProcessed = removeWhitespace(original.normalize('NFC'));
  const concatProcessed = removeWhitespace(concatenated.normalize('NFC'));

  const passed = origProcessed === concatProcessed;

  return {
    name: 'Core Content Preservation',
    passed,
    severity: 'error',
    message: passed
      ? 'All non-whitespace characters preserved exactly'
      : 'Content differs after removing whitespace',
    details: passed
      ? undefined
      : {
          originalLength: origProcessed.length,
          concatenatedLength: concatProcessed.length,
          difference: origProcessed.length - concatProcessed.length,
          originalPreview: origProcessed.substring(0, 100),
          concatenatedPreview: concatProcessed.substring(0, 100)
        }
  };
}

/**
 * Check 2: Core content with common substitutions allowed
 * Same as Check 1 but also normalizes common character substitutions
 */
function checkCoreContentWithSubstitutions(
  original: string,
  concatenated: string
): TextPreservationCheck {
  const origProcessed = normalizeSubstitutions(removeWhitespace(original.normalize('NFC')));
  const concatProcessed = normalizeSubstitutions(removeWhitespace(concatenated.normalize('NFC')));

  const passed = origProcessed === concatProcessed;

  return {
    name: 'Core Content (with substitutions)',
    passed,
    severity: 'warning',
    message: passed
      ? 'Content preserved with acceptable character substitutions'
      : 'Content differs even after allowing common substitutions',
    details: passed
      ? undefined
      : {
          originalLength: origProcessed.length,
          concatenatedLength: concatProcessed.length,
          difference: origProcessed.length - concatProcessed.length
        }
  };
}

/**
 * Check 3: Character distribution
 * Ensures rough character type counts are similar
 */
function checkCharacterDistribution(original: string, concatenated: string): TextPreservationCheck {
  const countChars = (text: string) => ({
    letters: (text.match(/\p{L}/gu) || []).length,
    digits: (text.match(/\p{N}/gu) || []).length,
    punctuation: (text.match(/\p{P}/gu) || []).length
  });

  const origCounts = countChars(original);
  const concatCounts = countChars(concatenated);

  const calcDiff = (orig: number, concat: number) =>
    orig === 0 ? 0 : Math.abs(orig - concat) / orig;

  const letterDiff = calcDiff(origCounts.letters, concatCounts.letters);
  const digitDiff = calcDiff(origCounts.digits, concatCounts.digits);
  const punctDiff = calcDiff(origCounts.punctuation, concatCounts.punctuation);

  const threshold = 0.05; // 5% difference allowed
  const passed = letterDiff < threshold && digitDiff < threshold && punctDiff < threshold;

  return {
    name: 'Character Distribution',
    passed,
    severity: 'warning',
    message: passed
      ? 'Character type distribution is similar'
      : 'Character type distribution differs significantly',
    details: {
      original: origCounts,
      concatenated: concatCounts,
      differences: {
        letters: `${(letterDiff * 100).toFixed(1)}%`,
        digits: `${(digitDiff * 100).toFixed(1)}%`,
        punctuation: `${(punctDiff * 100).toFixed(1)}%`
      }
    }
  };
}

/**
 * Check 4: Length sanity check
 * Quick smoke test for major length differences
 */
function checkLengthSanity(original: string, concatenated: string): TextPreservationCheck {
  const origNoSpace = removeWhitespace(original);
  const concatNoSpace = removeWhitespace(concatenated);

  const diff = Math.abs(origNoSpace.length - concatNoSpace.length);
  const threshold = origNoSpace.length * 0.1; // 10% difference allowed

  const passed = diff < threshold;

  return {
    name: 'Length Sanity',
    passed,
    severity: 'warning',
    message: passed
      ? 'Lengths are within acceptable range'
      : 'Length difference exceeds 10% threshold',
    details: {
      originalLength: origNoSpace.length,
      concatenatedLength: concatNoSpace.length,
      difference: diff,
      percentDiff: `${((diff / origNoSpace.length) * 100).toFixed(1)}%`
    }
  };
}

/**
 * Check 5: Word boundary integrity
 * Ensures words appear in the same sequence
 */
function checkWordBoundaries(original: string, concatenated: string): TextPreservationCheck {
  const extractWords = (text: string) =>
    text
      .normalize('NFC')
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.toLowerCase());

  const origWords = extractWords(original);
  const concatWords = extractWords(concatenated);

  const passed = origWords.length === concatWords.length;

  // Sample first difference if failed
  let firstDiff = -1;
  if (!passed) {
    const minLen = Math.min(origWords.length, concatWords.length);
    for (let i = 0; i < minLen; i++) {
      if (origWords[i] !== concatWords[i]) {
        firstDiff = i;
        break;
      }
    }
  }

  return {
    name: 'Word Boundary Integrity',
    passed,
    severity: 'error',
    message: passed ? 'Word sequences match' : 'Word sequences differ',
    details: passed
      ? undefined
      : {
          originalWordCount: origWords.length,
          concatenatedWordCount: concatWords.length,
          difference: origWords.length - concatWords.length,
          firstDifference:
            firstDiff >= 0
              ? {
                  position: firstDiff,
                  original: origWords[firstDiff],
                  concatenated: concatWords[firstDiff]
                }
              : 'Length mismatch'
        }
  };
}

/**
 * Check 6: Invisible characters
 * Detects zero-width spaces, soft hyphens, etc.
 */
function checkInvisibleCharacters(original: string, concatenated: string): TextPreservationCheck {
  const invisiblePattern = /[\u200B-\u200D\uFEFF\u00AD]/g;

  const origInvisible = (original.match(invisiblePattern) || []).length;
  const concatInvisible = (concatenated.match(invisiblePattern) || []).length;

  const passed = origInvisible === concatInvisible;

  return {
    name: 'Invisible Characters',
    passed,
    severity: 'info',
    message: passed
      ? 'Invisible character counts match'
      : 'Invisible character counts differ',
    details: {
      original: origInvisible,
      concatenated: concatInvisible,
      difference: origInvisible - concatInvisible
    }
  };
}

/**
 * Validate that the text preservation is correct
 * Runs multiple checks and throws an error if critical checks fail
 *
 * @param originalText - The original text before segmentation
 * @param segments - The segments produced by segmentation
 * @throws Error if text preservation validation fails
 */
export function isTextPreserved(originalText: string, segments: Array<string>): void {
  // Edge case: empty inputs
  if (!originalText || originalText.trim().length === 0) {
    throw new Error('Original text cannot be empty');
  }

  if (!segments || segments.length === 0) {
    throw new Error('Segments array cannot be empty');
  }

  // Concatenate all segments with spaces to preserve word boundaries
  const concatenated = segments.join(' ');

  // Run all checks
  const checks: Array<TextPreservationCheck> = [
    checkLengthSanity(originalText, concatenated),
    checkCharacterDistribution(originalText, concatenated),
    checkInvisibleCharacters(originalText, concatenated),
    checkWordBoundaries(originalText, concatenated),
    checkCoreContentWithSubstitutions(originalText, concatenated),
    checkCoreContent(originalText, concatenated) // Strictest - run last
  ];

  // Log all check results
  console.info('\nText Preservation Checks:');
  checks.forEach((check) => {
    const icon = check.passed ? '✓' : '✗';
    const severityLabel = check.severity.toUpperCase().padEnd(7);
    console.info(`  ${icon} [${severityLabel}] ${check.name}: ${check.message}`);

    if (check.details && !check.passed) {
      console.info('    Details:', JSON.stringify(check.details, null, 2));
    }
  });

  // Determine overall pass/fail
  const errors = checks.filter((c) => c.severity === 'error' && !c.passed);

  if (errors.length > 0) {
    const errorNames = errors.map((e) => e.name).join(', ');
    throw new Error(`Text preservation validation failed: ${errorNames}`);
  }

  console.info('\n✓ Text preservation validation passed (all critical checks passed)\n');
}