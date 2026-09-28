export const minPasswordLength = 8;
/** Number of character repetitions not allowed */
const repetitionLimit = 4;

export interface ValidationDetail {
  /** True if requirement is valid. Otherwise false */
  status: boolean;
  /** Message displayed to the user */
  message: string;
  /** Negative requirement, ie. something that is not allowed in the password */
  negative?: boolean;
  /** Requirement enforcement. Only used for negative requirements */
  enforced?: boolean;
}

export interface PasswordValidation {
  /** The whole password is valid */
  status: boolean;
  /** Details for each requirement */
  details: Record<string, ValidationDetail>;
}

/**
 * Checks if the given password repeats one character `repetitionLimit` times in a row.
 *
 * @param password - The password to check.
 * @returns `true` if the password contains such a repetition, `false` otherwise.
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

function isLetter(character: string): boolean {
  // Character is a letter if it is not the same when converted to upper or lower case
  return character.toLowerCase() !== character.toUpperCase();
}

/**
 * Checks if the given password contains a character that satisfies the given condition.
 *
 * @param password - The password to check.
 * @param condition - The condition to check for each character.
 * @returns `true` if the password contains a character that satisfies the condition, `false` otherwise.
 */
function containsCharacter(password: string, condition: (char: string) => boolean): boolean {
  return password.split('').some(condition);
}

/**
 * Validates the given password and username according to the defined rules.
 *
 * @param password - The password to validate.
 * @param username - The username the password must not contain.
 * @returns The validation details for each rule.
 */
function passwordValidation(password: string, username: string): Record<string, ValidationDetail> {
  // Construct the validation object with all requirements
  const result: Record<string, ValidationDetail> = {
    length: {
      status: password.length >= minPasswordLength,
      message: 'candidateApp.register.passwordValidation.length'
    },
    uppercase: {
      status: containsCharacter(password, (char) => isLetter(char) && char === char.toUpperCase()),
      message: 'candidateApp.register.passwordValidation.uppercase'
    },
    lowercase: {
      status: containsCharacter(password, (char) => isLetter(char) && char === char.toLowerCase()),
      message: 'candidateApp.register.passwordValidation.lowercase'
    },
    number: {
      status: containsCharacter(password, (char) => /[0-9]/.test(char)),
      message: 'candidateApp.register.passwordValidation.number'
    },
    symbol: {
      status: containsCharacter(password, (char) => !isLetter(char) && !/[0-9]/.test(char)),
      message: 'candidateApp.register.passwordValidation.symbol'
    },
    username: {
      status: username === '' || !password.toLowerCase().includes(username.toLowerCase()),
      message: 'candidateApp.register.passwordValidation.username',
      negative: true,
      enforced: true
    },
    repetition: {
      status: !checkRepetition(password),
      message: 'candidateApp.register.passwordValidation.repetition',
      negative: true
    }
  };

  return result;
}

/**
 * Checks if all enforced requirements are met in the given validation object.
 *
 * @param validation - The validation object to check.
 * @returns `true` if all enforced requirements are met, `false` otherwise.
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
 * @param password - The password to validate.
 * @param username - The username the password must not contain. Default: `''`
 * @returns `true` if the password is valid, `false` otherwise.
 */
export function validatePassword(password: string, username = ''): boolean {
  return isValid(passwordValidation(password, username));
}

/**
 * Validates the given password and username and returns a PasswordValidation object.
 * The PasswordValidation object contains the validation status and details for each requirement.
 *
 * @param password - The password to validate.
 * @param username - The username the password must not contain. Default: `''`
 * @returns The validation status and the details for each requirement.
 */
export function validatePasswordDetails(password: string, username = ''): PasswordValidation {
  const validation = passwordValidation(password, username);
  return {
    status: isValid(validation),
    details: validation
  };
}
