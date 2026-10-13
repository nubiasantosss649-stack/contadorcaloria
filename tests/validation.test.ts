import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

describe('validation', () => {
  it('validates emails', () => {
    expect(validateEmail('')).toBe('auth.errors.emailRequired');
    expect(validateEmail('   ')).toBe('auth.errors.emailRequired');
    expect(validateEmail('maria')).toBe('auth.errors.emailInvalid');
    expect(validateEmail('maria@site')).toBe('auth.errors.emailInvalid');
    expect(validateEmail('maria @site.com')).toBe('auth.errors.emailInvalid');
    expect(validateEmail(' maria@site.com ')).toBeNull();
  });

  it('validates passwords', () => {
    expect(validatePassword('')).toBe('auth.errors.passwordRequired');
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      'auth.errors.passwordTooShort',
    );
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    // Sign-in must not enforce the length rule (older accounts may differ).
    expect(validatePassword('abc', { checkLength: false })).toBeNull();
  });

  it('validates confirmation and name', () => {
    expect(validatePasswordConfirmation('secret123', 'secret124')).toBe(
      'auth.errors.passwordsDontMatch',
    );
    expect(validatePasswordConfirmation('secret123', 'secret123')).toBeNull();
    expect(validateName('  ')).toBe('auth.errors.nameRequired');
    expect(validateName('Ana')).toBeNull();
  });
});
