import { get, writable } from 'svelte/store';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthContext } from './authContext.type';

// Mock page store - controls page.data.session for tests
const mockPageStore = writable<{ data: { session?: unknown; user?: unknown } }>({
  data: { session: null }
});

// Mock $app/stores
vi.mock('$app/stores', () => ({
  page: mockPageStore
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock svelte context functions
let contextStore: Map<symbol, unknown>;
vi.mock('svelte', async () => {
  const actual = await vi.importActual('svelte');
  contextStore = new Map();
  return {
    ...(actual as object),
    hasContext: (key: symbol) => contextStore.has(key),
    setContext: (key: symbol, value: unknown) => {
      contextStore.set(key, value);
      return value;
    },
    getContext: (key: symbol) => contextStore.get(key)
  };
});

// Mock dataWriter
const mockDataWriter = {
  init: vi.fn(),
  logout: vi.fn().mockResolvedValue({ type: 'success' }),
  setPassword: vi.fn().mockResolvedValue({ type: 'success' }),
  requestForgotPasswordEmail: vi.fn().mockResolvedValue({ type: 'success' }),
  resetPassword: vi.fn().mockResolvedValue({ type: 'success' })
};

vi.mock('$lib/api/dataWriter', () => ({
  dataWriter: Promise.resolve(mockDataWriter)
}));

// Mock logger
vi.mock('$lib/utils/logger', () => ({
  logDebugError: vi.fn()
}));

// Mock @openvaa/app-shared for prepareDataWriter
vi.mock('@openvaa/app-shared', () => ({
  staticSettings: { dataAdapter: { type: 'supabase' } }
}));

describe('authContext', () => {
  beforeEach(() => {
    contextStore = new Map();
    mockPageStore.set({ data: { session: null } });
    vi.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('derives false when page.data.session is null', async () => {
      const { initAuthContext } = await import('./authContext');

      mockPageStore.set({ data: { session: null } });
      const ctx = initAuthContext();

      expect(get(ctx.isAuthenticated)).toBe(false);
    });

    it('derives true when page.data.session exists', async () => {
      const { initAuthContext } = await import('./authContext');

      mockPageStore.set({
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'user-1', email: 'test@example.com' }
          }
        }
      });
      const ctx = initAuthContext();

      expect(get(ctx.isAuthenticated)).toBe(true);
    });

    it('reactively updates when session changes', async () => {
      const { initAuthContext } = await import('./authContext');

      mockPageStore.set({ data: { session: null } });
      const ctx = initAuthContext();

      expect(get(ctx.isAuthenticated)).toBe(false);

      // Simulate session becoming active
      mockPageStore.set({
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'user-1', email: 'test@example.com' }
          }
        }
      });

      expect(get(ctx.isAuthenticated)).toBe(true);
    });
  });

  describe('AuthContext type', () => {
    it('does not have authToken property', async () => {
      const { initAuthContext } = await import('./authContext');
      const ctx: AuthContext = initAuthContext();

      expect('authToken' in ctx).toBe(false);
      expect('isAuthenticated' in ctx).toBe(true);
    });
  });

  describe('logout', () => {
    it('calls dataWriter.logout successfully', async () => {
      const { initAuthContext } = await import('./authContext');
      const ctx = initAuthContext();

      await ctx.logout();

      expect(mockDataWriter.logout).toHaveBeenCalledWith({ authToken: '' });
    });
  });

  describe('setPassword', () => {
    it('calls dataWriter.setPassword with empty authToken and currentPassword', async () => {
      const { initAuthContext } = await import('./authContext');
      const ctx = initAuthContext();

      await ctx.setPassword({ password: 'newPassword123' });

      expect(mockDataWriter.setPassword).toHaveBeenCalledWith({
        password: 'newPassword123',
        authToken: '',
        currentPassword: ''
      });
    });
  });
});
