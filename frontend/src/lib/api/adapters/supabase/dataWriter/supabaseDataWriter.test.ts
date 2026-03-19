import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $env/dynamic/public before any imports that depend on it
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

import { SupabaseDataWriter } from './supabaseDataWriter';

/**
 * Creates a mock Supabase client with auth methods as vi.fn() stubs.
 */
function createMockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn()
    }
  };
}

describe('SupabaseDataWriter', () => {
  let writer: SupabaseDataWriter;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    writer = new SupabaseDataWriter();
    writer.init({
      fetch: vi.fn(),
      serverClient: mockSupabase as any
    });
  });

  describe('login', () => {
    it('calls signInWithPassword and returns success', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

      const result = await writer.login({ username: 'test@example.com', password: 'pass' });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass'
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error with Supabase error message on failure', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      });

      await expect(writer.login({ username: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid login credentials'
      );
    });
  });

  describe('logout (via backendLogout)', () => {
    it('calls signOut with scope local and returns success', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await writer.backendLogout({ authToken: '' });

      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase signOut failure', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Session not found' }
      });

      await expect(writer.backendLogout({ authToken: '' })).rejects.toThrow('Session not found');
    });
  });

  describe('logout (public override)', () => {
    it('calls signOut directly without posting to universal logout route', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await writer.logout({ authToken: '' });

      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(result).toEqual({ type: 'success' });
    });
  });

  describe('requestForgotPasswordEmail', () => {
    it('calls resetPasswordForEmail with redirectTo containing auth/callback', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      const result = await writer.requestForgotPasswordEmail({ email: 'test@example.com' });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('candidate/auth/callback')
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'User not found' }
      });

      await expect(writer.requestForgotPasswordEmail({ email: 'bad@example.com' })).rejects.toThrow('User not found');
    });
  });

  describe('setPassword', () => {
    it('calls updateUser with new password, ignoring currentPassword and authToken', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

      const result = await writer.setPassword({
        password: 'newpass',
        authToken: '',
        currentPassword: ''
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Password too short' }
      });

      await expect(
        writer.setPassword({ password: 'x', authToken: '', currentPassword: '' })
      ).rejects.toThrow('Password too short');
    });
  });

  describe('resetPassword', () => {
    it('calls updateUser with new password, ignoring code param', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });

      const result = await writer.resetPassword({ password: 'newpass', code: '' });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws Error on Supabase failure', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Session expired' }
      });

      await expect(writer.resetPassword({ password: 'newpass', code: '' })).rejects.toThrow('Session expired');
    });
  });
});
