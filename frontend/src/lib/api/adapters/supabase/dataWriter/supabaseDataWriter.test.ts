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
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn(),
    storage: {
      from: vi.fn()
    },
    functions: {
      invoke: vi.fn()
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
        p_entity_id: 'entity-1',
        p_answers: mockAnswers,
        p_overwrite: false
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
        p_entity_id: 'entity-1',
        answers: mockAnswers,
        p_overwrite: true
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
          p_entity_id: 'entity-1',
          p_overwrite: false
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

  describe('register', () => {
    it('calls updateUser with password to complete registration', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
      const result = await writer.register({ password: 'newpass' });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws on Supabase error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'Weak password' }
      });
      await expect(writer.register({ password: 'x' })).rejects.toThrow('Weak password');
    });
  });

  describe('getBasicUserData', () => {
    it('extracts user data from session and JWT claims', async () => {
      const payload = { user_roles: [{ role: 'candidate', scope_type: 'candidate', scope_id: 'uuid1' }] };
      const mockJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
            access_token: mockJwt
          }
        },
        error: null
      });

      const result = await writer.getBasicUserData({ authToken: '' });
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('cand@test.com');
      expect(result.username).toBe('cand@test.com');
      expect(result.role).toBe('candidate');
      expect(result.settings.language).toBe('fi');
    });

    it('returns admin role for project_admin', async () => {
      const payload = { user_roles: [{ role: 'project_admin', scope_type: 'project', scope_id: 'proj1' }] };
      const mockJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-2', email: 'admin@test.com', user_metadata: {} },
            access_token: mockJwt
          }
        },
        error: null
      });

      const result = await writer.getBasicUserData({ authToken: '' });
      expect(result.role).toBe('admin');
    });

    it('returns null role when no recognized roles', async () => {
      const payload = { user_roles: [] };
      const mockJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-3', email: 'nobody@test.com', user_metadata: {} },
            access_token: mockJwt
          }
        },
        error: null
      });

      const result = await writer.getBasicUserData({ authToken: '' });
      expect(result.role).toBeNull();
    });

    it('defaults language to en when not in user_metadata', async () => {
      const payload = { user_roles: [] };
      const mockJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-4', email: 'test@test.com', user_metadata: {} },
            access_token: mockJwt
          }
        },
        error: null
      });

      const result = await writer.getBasicUserData({ authToken: '' });
      expect(result.settings.language).toBe('en');
    });

    it('throws when no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(writer.getBasicUserData({ authToken: '' })).rejects.toThrow('No active session');
    });
  });

  describe('getCandidateUserData', () => {
    /** Helper to set up a mock session with candidate role JWT. */
    function setupCandidateSession() {
      const payload = { user_roles: [{ role: 'candidate', scope_type: 'candidate', scope_id: 'cand-1' }] };
      const mockJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
            access_token: mockJwt
          }
        },
        error: null
      });
    }

    it('calls get_candidate_user_data RPC and returns structured data', async () => {
      setupCandidateSession();

      const entityRow = {
        id: 'cand-1',
        project_id: 'proj-1',
        name: { en: 'Test Candidate' },
        short_name: null,
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: { q1: { value: 3 } },
        terms_of_use_accepted: '2024-01-01T00:00:00Z',
        first_name: 'Test',
        last_name: 'Candidate',
        organization_id: null
      };

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: entityRow, error: null })
      });

      const result = await writer.getCandidateUserData({
        authToken: '',
        loadNominations: false,
        locale: 'en'
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_candidate_user_data', {
        p_entity_type: 'candidate'
      });
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('cand@test.com');
      expect(result.candidate.id).toBe('cand-1');
      expect(result.candidate.firstName).toBe('Test');
      expect(result.candidate.lastName).toBe('Candidate');
      expect(result.candidate.answers).toEqual({ q1: { value: 3 } });
      expect(result.nominations).toBeUndefined();
    });

    it('loads nominations when loadNominations=true', async () => {
      setupCandidateSession();

      const entityRow = {
        id: 'cand-1',
        project_id: 'proj-1',
        name: { en: 'Test Candidate' },
        short_name: null,
        info: null,
        color: null,
        image: null,
        sort_order: 1,
        subtype: null,
        custom_data: null,
        answers: {},
        terms_of_use_accepted: null,
        first_name: 'Test',
        last_name: 'Candidate',
        organization_id: null
      };

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: entityRow, error: null })
      });

      // Mock nominations query
      const nomData = [
        {
          id: 'nom-1',
          election_id: 'elec-1',
          constituency_id: 'const-1',
          election_round: 1,
          election_symbol: '42',
          parent_nomination_id: null,
          entity_type: 'candidate'
        }
      ];
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: nomData, error: null })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await writer.getCandidateUserData({
        authToken: '',
        loadNominations: true,
        locale: 'en'
      });

      expect(result.nominations).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('nominations');
    });

    it('throws if RPC returns empty/error', async () => {
      setupCandidateSession();

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });

      await expect(
        writer.getCandidateUserData({
          authToken: '',
          loadNominations: false,
          locale: 'en'
        })
      ).rejects.toThrow('Failed to load candidate data: Not found');
    });
  });

  describe('preregisterWithApiToken (invite-candidate)', () => {
    it('calls invite-candidate Edge Function with correct params', async () => {
      // Mock elections table lookup for projectId resolution
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { project_id: 'proj-1' }, error: null })
        })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, candidateId: 'cand-1', userId: 'user-1' },
        error: null
      });

      const result = await writer.preregisterWithApiToken({
        body: {
          firstName: 'Test',
          lastName: 'User',
          identifier: '1990-01-01',
          email: 'test@example.com',
          nominations: [{ electionId: 'elec-1', constituencyId: 'const-1' }]
        },
        authToken: ''
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('elections');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('invite-candidate', {
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          projectId: 'proj-1'
        }
      });
      expect(result).toEqual({ type: 'success' });
    });

    it('throws when elections query fails', async () => {
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
        })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(
        writer.preregisterWithApiToken({
          body: {
            firstName: 'Test',
            lastName: 'User',
            identifier: '',
            email: 'test@example.com',
            nominations: [{ electionId: 'bad-id', constituencyId: 'const-1' }]
          },
          authToken: ''
        })
      ).rejects.toThrow('Failed to resolve project for election');
    });

    it('throws when Edge Function returns error', async () => {
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { project_id: 'proj-1' }, error: null })
        })
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Forbidden' }
      });

      await expect(
        writer.preregisterWithApiToken({
          body: {
            firstName: 'A',
            lastName: 'B',
            identifier: '',
            email: 'a@b.com',
            nominations: [{ electionId: 'e1', constituencyId: 'c1' }]
          },
          authToken: ''
        })
      ).rejects.toThrow('invite-candidate');
    });
  });

  describe('sendEmail (send-email)', () => {
    it('calls send-email Edge Function with correct params', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, sent: 2, failed: 0, results: [] },
        error: null
      });

      const result = await writer.sendEmail({
        authToken: '',
        templates: { en: { subject: 'Hello', body: 'World' } },
        recipientUserIds: ['user-1', 'user-2'],
        from: 'admin@test.com',
        dryRun: false
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          templates: { en: { subject: 'Hello', body: 'World' } },
          recipient_user_ids: ['user-1', 'user-2'],
          from: 'admin@test.com',
          dry_run: false
        }
      });
      expect(result).toEqual({ type: 'success', sent: 2, failed: 0, results: [] });
    });

    it('throws when Edge Function returns error', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Missing Authorization header' }
      });

      await expect(
        writer.sendEmail({
          authToken: '',
          templates: { en: { subject: 'S', body: 'B' } },
          recipientUserIds: ['u1']
        })
      ).rejects.toThrow('send-email');
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
