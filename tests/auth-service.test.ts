const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  resend: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  exchangeCodeForSession: jest.fn(),
  verifyOtp: jest.fn(),
  updateUser: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
};
const mockRpc = jest.fn();

// Getter: imports are hoisted above the mock objects, so resolve them lazily.
jest.mock('@/lib/supabase', () => ({
  get supabase() {
    return { auth: mockAuth, rpc: mockRpc };
  },
}));
jest.mock('expo-linking', () => ({
  createURL: (path: string, options?: { queryParams?: Record<string, string> }) =>
    `caloriafacil://${path.replace(/^\//, '')}${
      options?.queryParams ? `?${new URLSearchParams(options.queryParams).toString()}` : ''
    }`,
}));

import { authService, mapAuthError, parseAuthRedirect } from '@/services/auth-service';

beforeEach(() => jest.clearAllMocks());

describe('sign up', () => {
  it('sends trimmed data, the chosen language and the confirmation redirect', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null, user: { id: 'u1' } }, error: null });
    const result = await authService.signUp(' Ana ', ' ana@example.com ', 'secret123', 'pt-BR');
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secret123',
      options: {
        data: { display_name: 'Ana', language: 'pt-BR' },
        emailRedirectTo: 'caloriafacil://auth/callback',
      },
    });
    expect(result).toEqual({ ok: true, data: { needsConfirmation: true } });
  });

  it('reports when no confirmation is needed (session returned)', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    await expect(authService.signUp('A', 'a@b.co', 'secret123', 'en-US')).resolves.toEqual({
      ok: true,
      data: { needsConfirmation: false },
    });
  });

  it('maps weak password errors', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: {},
      error: { code: 'weak_password', message: 'weak' },
    });
    await expect(authService.signUp('A', 'a@b.co', '12345678', 'en-US')).resolves.toMatchObject({
      ok: false,
      code: 'weak_password',
    });
  });
});

describe('sign in', () => {
  it('signs in with trimmed email', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(authService.signIn(' a@b.co ', 'pw')).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' });
  });

  it('maps invalid credentials and unconfirmed email', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      error: { code: 'invalid_credentials', status: 400 },
    });
    await expect(authService.signIn('a@b.co', 'x')).resolves.toMatchObject({
      code: 'invalid_credentials',
    });
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      error: { code: 'email_not_confirmed', status: 400 },
    });
    await expect(authService.signIn('a@b.co', 'x')).resolves.toMatchObject({
      code: 'email_not_confirmed',
    });
  });
});

describe('password recovery', () => {
  it('sends the reset email with a recovery redirect', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await authService.sendPasswordReset('a@b.co');
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.co', {
      redirectTo: 'caloriafacil://auth/callback?next=reset-password',
    });
  });

  it('exchanges the PKCE code from the email link', async () => {
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null });
    const result = await authService.completeRedirect(
      'caloriafacil://auth/callback?next=reset-password&code=abc',
    );
    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(result).toEqual({ ok: true, data: { next: 'reset-password', recovery: true } });
  });

  it('verifies token_hash links (custom email templates)', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: null });
    const result = await authService.completeRedirect(
      'caloriafacil://auth/callback?token_hash=h1&type=signup',
    );
    expect(mockAuth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'h1', type: 'signup' });
    expect(result).toEqual({ ok: true, data: { next: null, recovery: false } });
  });

  it('rejects expired or malformed links', async () => {
    await expect(
      authService.completeRedirect(
        'caloriafacil://auth/callback#error=access_denied&error_description=Email+link+is+invalid',
      ),
    ).resolves.toMatchObject({ ok: false, code: 'link_invalid' });
    await expect(
      authService.completeRedirect('caloriafacil://auth/callback'),
    ).resolves.toMatchObject({
      ok: false,
      code: 'link_invalid',
    });
  });

  it('updates the password', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: { code: 'same_password' } });
    await expect(authService.updatePassword('secret123')).resolves.toMatchObject({
      code: 'same_password',
    });
  });
});

describe('logout and account deletion', () => {
  it('signs out locally', async () => {
    await authService.signOut();
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('deletes the account through the database function, then clears the session', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await expect(authService.deleteAccount()).resolves.toEqual({ ok: true, data: undefined });
    expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('keeps the session when deletion fails', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'boom' } });
    await expect(authService.deleteAccount()).resolves.toMatchObject({ ok: false });
    expect(mockAuth.signOut).not.toHaveBeenCalled();
  });

  it('OAuth providers are prepared but not enabled yet', async () => {
    await expect(authService.signInWithProvider('apple')).resolves.toMatchObject({
      ok: false,
      code: 'not_available',
    });
  });
});

describe('helpers', () => {
  it('parses query and hash parameters', () => {
    expect(parseAuthRedirect('app://cb?code=1&next=reset-password#type=recovery')).toEqual({
      code: '1',
      tokenHash: null,
      type: 'recovery',
      next: 'reset-password',
      error: null,
    });
    expect(parseAuthRedirect('app://cb?type=evil').type).toBeNull();
  });

  it('maps rate limits and network errors', () => {
    expect(mapAuthError({ status: 429 })).toMatchObject({ code: 'rate_limited' });
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toMatchObject({
      code: 'rate_limited',
    });
    expect(mapAuthError({ name: 'AuthRetryableFetchError' })).toMatchObject({ code: 'network' });
  });
});
