// Password requirements
const minPasswordLength = 8;
const repetitionLimit = 4; // Number of character repetitions not allowed
const sequenceLimit = 4; // Number of characters in sequence not allowed

// Common patterns and sequences to avoid
// TODO: Localization
const avoidablePatterns = [
  'abcdefghijklmnopqrstuvwxyz', // Alphabetical sequence
  '01234567890', // Numerical sequence
  'qwertyuiopå', // Keyboard layout
  'asdfghjklöä',
  'zxcvbnm'
];

export interface ValidationDetail {
  status: boolean; // true if requirement is valid, false if invalid
  message: string; // message displayed to the user
  negative?: boolean; // negative requirement, i.e. something that is not allowed in the password
  enforced?: boolean; // requirement enforcement, only used for negative requirements
}

export interface PasswordValidation {
  status: boolean; // the whole password is valid
  details: Record<string, ValidationDetail>; // details for each requirement
}

/**
 * Checks if the given password contains any repeated characters.
 * The number of repeated characters is defined in the `repetitionLimit` variable.
 *
 * @param {string} password - The password to check.
 * @returns {boolean} `true` if the password contains repeated characters, `false` otherwise.
 */
function checkRepetition(password: string): boolean {
  for (let i = 0; i <= password.length - repetitionLimit; i++) {
    const substring = password.slice(i, i + repetitionLimit);
    if (new Set(substring).size === 1) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the given password contains any common sequences or keyboard patterns.
 * The patterns are defined in the `avoidablePatterns` array.
 *
 * @param {string} password - The password to check.
 * @returns {boolean} `true` if the password contains common keyboard patterns, `false` otherwise.
 */
function checkCommonPatterns(password: string): boolean {
  for (const pattern of avoidablePatterns) {
    for (let i = 0; i <= pattern.length - sequenceLimit; i++) {
      const substring = pattern.slice(i, i + sequenceLimit);
      if (password.includes(substring)) {
        return true;
      }
    }
  }

  return false;
}

function isLetter(character: string): boolean {
  // Character is a letter if it is not the same when converted to upper or lower case
  return character.toLowerCase() !== character.toUpperCase();
}

/**
 * Checks if the given password contains a character that satisfies the given condition.
 *
 * @param {string} password - The password to check.
 * @param {(char: string) => boolean} condition - The condition to check for each character.
 * @returns {boolean} `true` if the password contains a character that satisfies the condition, `false` otherwise.
 */
function containsCharacter(password: string, condition: (char: string) => boolean): boolean {
  for (const character of password) {
    if (condition(character)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates the given password and username according to the defined rules.
 *
 * @param {string} password - The password to validate.
 * @param {string} username - The username used to check that the password does not contain the username.
 * @returns {Record<string, ValidationDetail>} An object containing the validation details for each rule.
 */
function passwordValidation(password: string, username: string): Record<string, ValidationDetail> {
  // Construct the validation object with all requirements
  // TODO: Localization
  const result: Record<string, ValidationDetail> = {
    length: {
      status: password.length >= minPasswordLength,
      message: `At least ${minPasswordLength} characters`
    },
    uppercase: {
      status: containsCharacter(password, (char) => isLetter(char) && char === char.toUpperCase()),
      message: 'Uppercase letter'
    },
    lowercase: {
      status: containsCharacter(password, (char) => isLetter(char) && char === char.toLowerCase()),
      message: 'Lowercase letter'
    },
    number: {
      status: containsCharacter(password, (char) => !isNaN(Number(char))),
      message: 'Number'
    },
    symbol: {
      status: containsCharacter(password, (char) => !isLetter(char) && isNaN(Number(char))),
      message: 'Symbol'
    },
    username: {
      status: username === '' || !password.toLowerCase().includes(username.toLowerCase()),
      message: 'Avoid using username in password',
      negative: true,
      enforced: true
    },
    repetition: {
      status: !checkRepetition(password),
      message: 'Contains character repetition',
      negative: true
    },
    commonPatterns: {
      status: !checkCommonPatterns(password),
      message: 'Contains common sequences or keyboard patterns',
      negative: true
    }
  };

  return result;
}

/**
 * Checks if all enforced requirements are met in the given validation object.
 *
 * @param {Record<string, ValidationDetail>} validation - The validation object to check.
 * @returns {boolean} `true` if all enforced requirements are met, `false` otherwise.
 */
function isValid(validation: Record<string, ValidationDetail>): boolean {
  const enforcedRequirements = Object.values(validation).filter(
    (rule) => !rule.negative || (rule.negative && rule.enforced)
  );
  return Object.values(enforcedRequirements).every((rule) => rule.status);
}

/**
 * Validates the given password and returns whether the password is valid.
 *
 * @param {string} password - The password to validate.
 * @param {string} [username=''] - The username used to check that the password does not contain the username
 * @returns {boolean} `true` if the password is valid, `false` otherwise.
 */
export function validatePassword(password: string, username = ''): boolean {
  return isValid(passwordValidation(password, username));
}

/**
 * Validates the given password and username and returns a PasswordValidation object.
 * The PasswordValidation object contains the validation status and details for each requirement.
 *
 * @param {string} password - The password to validate.
 * @param {string} [username=''] - The username used to check that the password does not contain the username
 * @returns {PasswordValidation} An object containing the validation status and details.
 */
export function validatePasswordDetails(
  password: string,
  username = ''
): PasswordValidation {
  const validation = passwordValidation(password, username);
  const result: PasswordValidation = {
    status: isValid(validation),
    details: validation
  };
  return result;
}
