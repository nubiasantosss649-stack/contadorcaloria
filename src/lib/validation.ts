/**
 * Form validators. They return a translation key (or null when valid) so that
 * error messages stay localized and are never hard-coded in components.
 */
export const MIN_PASSWORD_LENGTH = 8;

// Pragmatic check: something@something.tld, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ValidationErrorKey =
  | 'auth.errors.emailRequired'
  | 'auth.errors.emailInvalid'
  | 'auth.errors.passwordRequired'
  | 'auth.errors.passwordTooShort'
  | 'auth.errors.passwordsDontMatch'
  | 'auth.errors.nameRequired';

export function validateEmail(email: string): ValidationErrorKey | null {
  const value = email.trim();
  if (!value) return 'auth.errors.emailRequired';
  if (!EMAIL_PATTERN.test(value)) return 'auth.errors.emailInvalid';
  return null;
}

export function validatePassword(
  password: string,
  { checkLength = true } = {},
): ValidationErrorKey | null {
  if (!password) return 'auth.errors.passwordRequired';
  if (checkLength && password.length < MIN_PASSWORD_LENGTH) return 'auth.errors.passwordTooShort';
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationErrorKey | null {
  return password === confirmation ? null : 'auth.errors.passwordsDontMatch';
}

export function validateName(name: string): ValidationErrorKey | null {
  return name.trim() ? null : 'auth.errors.nameRequired';
}
