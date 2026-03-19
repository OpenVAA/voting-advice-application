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
    },
    rpc: vi.fn(),
    from: vi.fn(),
    storage: {
      from: vi.fn()
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

  describe('updateAnswers (merge mode)', () => {
    it('calls upsert_answers RPC with overwrite=false', async () => {
      const mockAnswers = { q1: { value: 3 }, q2: { value: 'text' } };
      const returnedAnswers = { q1: { value: 3 }, q2: { value: 'text' }, q3: { value: 1 } };
      mockSupabase.rpc.mockResolvedValue({ data: returnedAnswers, error: null });

      const result = await writer.updateAnswers({
        authToken: '',
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', {
        entity_id: 'entity-1',
        answers: mockAnswers,
        overwrite: false
      });
      expect(result).toEqual(returnedAnswers);
    });
  });

  describe('overwriteAnswers (overwrite mode)', () => {
    it('calls upsert_answers RPC with overwrite=true', async () => {
      const mockAnswers = { q1: { value: 5 } };
      mockSupabase.rpc.mockResolvedValue({ data: mockAnswers, error: null });

      const result = await writer.overwriteAnswers({
        authToken: '',
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_answers', {
        entity_id: 'entity-1',
        answers: mockAnswers,
        overwrite: true
      });
      expect(result).toEqual(mockAnswers);
    });
  });

  describe('updateAnswers with File upload', () => {
    it('uploads File objects to Storage and replaces with path in answers', async () => {
      const mockFile = new File(['image-data'], 'photo.png', { type: 'image/png' });
      const mockAnswers = {
        'q-text': { value: 'hello' },
        'q-image': { value: mockFile, info: 'My photo' }
      };

      // Mock candidate project_id lookup
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { project_id: 'proj-1' }, error: null })
        })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      // Mock storage upload
      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });

      // Mock upsert_answers RPC
      const expectedAnswers = {
        'q-text': { value: 'hello' },
        'q-image': {
          value: { path: expect.stringMatching(/^proj-1\/candidates\/entity-1\/.*\.png$/) },
          info: 'My photo'
        }
      };
      mockSupabase.rpc.mockResolvedValue({ data: expectedAnswers, error: null });

      const result = await writer.updateAnswers({
        authToken: '',
        target: { type: 'candidate', id: 'entity-1' },
        answers: mockAnswers
      });

      // Verify storage upload was called
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('public-assets');
      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringMatching(/^proj-1\/candidates\/entity-1\/.*\.png$/),
        mockFile,
        { cacheControl: '3600', upsert: true }
      );

      // Verify RPC was called with path object instead of File
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'upsert_answers',
        expect.objectContaining({
          entity_id: 'entity-1',
          overwrite: false
        })
      );
    });
  });

  describe('updateAnswers error handling', () => {
    it('throws on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(
        writer.updateAnswers({
          authToken: '',
          target: { type: 'candidate', id: 'entity-1' },
          answers: { q1: { value: 1 } }
        })
      ).rejects.toThrow('setAnswers: RPC failed');
    });

    it('throws on Storage upload error', async () => {
      const mockFile = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

      // Mock candidate project_id lookup
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { project_id: 'proj-1' }, error: null })
        })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      // Mock storage upload failure
      const uploadMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Bucket full' } });
      mockSupabase.storage.from.mockReturnValue({ upload: uploadMock });

      await expect(
        writer.updateAnswers({
          authToken: '',
          target: { type: 'candidate', id: 'entity-1' },
          answers: { 'q-img': { value: mockFile } }
        })
      ).rejects.toThrow('Image upload failed: Bucket full');
    });
  });

  describe('updateEntityProperties', () => {
    it('updates termsOfUseAccepted via PostgREST', async () => {
      const timestamp = '2024-01-15T10:00:00.000Z';
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { terms_of_use_accepted: timestamp },
              error: null
            })
          })
        })
      });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await writer.updateEntityProperties({
        authToken: '',
        target: { type: 'candidate', id: 'entity-1' },
        properties: { termsOfUseAccepted: timestamp }
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('candidates');
      expect(updateMock).toHaveBeenCalledWith({ terms_of_use_accepted: timestamp });
      expect(result).toEqual({ termsOfUseAccepted: timestamp });
    });

    it('throws on PostgREST error', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Row not found' }
            })
          })
        })
      });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(
        writer.updateEntityProperties({
          authToken: '',
          target: { type: 'candidate', id: 'bad-id' },
          properties: { termsOfUseAccepted: 'now' }
        })
      ).rejects.toThrow('updateEntityProperties: Row not found');
    });
  });
});
