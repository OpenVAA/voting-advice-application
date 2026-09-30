/**
 * Locality guard for the service-role admin client.
 *
 * Covers the host allowlist, the refusal message and its secrecy, both opt-outs, the `createServiceRoleClient` factory and the constructor enforcement that delegates to it (with `createClient` mocked, so nothing connects), and a drift gate proving every SUPABASE_URL the repository's local, E2E and CI wiring uses is accepted.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALLOW_REMOTE_SUPABASE_ENV, assertLocalSupabaseUrl, isLocalSupabaseUrl } from '../src/localSupabaseUrl';
import { createServiceRoleClient, SupabaseAdminClient } from '../src/supabaseAdminClient';

const createClientMock = vi.hoisted(() => vi.fn((..._args: Array<unknown>) => ({})));

vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

const REFUSAL_MARKER = 'Refusing to use the service-role key against non-local Supabase host';
const REMOTE_URL = 'https://abcdefghijklmnop.supabase.co';

let savedOptOut: string | undefined;

beforeEach(() => {
  savedOptOut = process.env[ALLOW_REMOTE_SUPABASE_ENV];
  // A developer shell that exports the opt-out must not mask a failing refusal.
  delete process.env[ALLOW_REMOTE_SUPABASE_ENV];
  createClientMock.mockClear();
});

afterEach(() => {
  if (savedOptOut === undefined) delete process.env[ALLOW_REMOTE_SUPABASE_ENV];
  else process.env[ALLOW_REMOTE_SUPABASE_ENV] = savedOptOut;
});

describe('isLocalSupabaseUrl', () => {
  it.each([
    'http://localhost:54321',
    'http://LOCALHOST:54321',
    'https://localhost:54321',
    'http://user:pw@localhost:54321',
    'http://127.0.0.1:54321',
    'http://127.1.2.3:54321',
    'http://127.1:54321',
    'http://[::1]:54321',
    'http://[0:0:0:0:0:0:0:1]:54321',
    'http://host.docker.internal:54321',
    'http://kong:8000',
    'http://supabase_kong_openvaa-local:8000'
  ])('accepts %s', (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(true);
  });

  it.each([
    REMOTE_URL,
    'http://localhost.evil.example:54321',
    'http://127.0.0.1.nip.io:54321',
    'http://localhost@evil.example:54321',
    'http://localhost.:54321',
    'http://0.0.0.0:54321',
    'http://[::ffff:127.0.0.1]:54321',
    'http://10.0.0.5:54321',
    'http://192.168.1.10:54321',
    'http://kong.example.com:8000',
    'not a url',
    ''
  ])('refuses %j', (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(false);
  });
});

describe('assertLocalSupabaseUrl', () => {
  it('names the refused host and both opt-outs', () => {
    expect(() => assertLocalSupabaseUrl(REMOTE_URL)).toThrow(REFUSAL_MARKER);
    let message = '';
    try {
      assertLocalSupabaseUrl(REMOTE_URL);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('abcdefghijklmnop.supabase.co');
    expect(message).toContain('--allow-remote');
    expect(message).toContain('DEV_SEED_ALLOW_REMOTE');
  });

  it('never echoes URL userinfo', () => {
    expect(() => assertLocalSupabaseUrl('https://user:s3cret-sentinel@remote.example')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('s3cret-sentinel') })
    );
    expect(() => assertLocalSupabaseUrl('https://user:s3cret-sentinel@remote.example')).toThrow('remote.example');
  });

  it('does not echo an unparseable value', () => {
    expect(() => assertLocalSupabaseUrl('garbage-sentinel value')).toThrow(REFUSAL_MARKER);
    expect(() => assertLocalSupabaseUrl('garbage-sentinel value')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('garbage-sentinel') })
    );
  });

  it('never throws for a local URL, whatever the environment', () => {
    for (const value of [undefined, '', '0', '1']) {
      if (value === undefined) delete process.env[ALLOW_REMOTE_SUPABASE_ENV];
      else process.env[ALLOW_REMOTE_SUPABASE_ENV] = value;
      expect(() => assertLocalSupabaseUrl('http://127.0.0.1:54321')).not.toThrow();
      expect(() => assertLocalSupabaseUrl('http://127.0.0.1:54321', { allowRemote: false })).not.toThrow();
    }
  });

  it('is suppressed by { allowRemote: true }', () => {
    expect(() => assertLocalSupabaseUrl(REMOTE_URL, { allowRemote: true })).not.toThrow();
  });

  it.each(['1', 'true', ' TRUE '])('is suppressed by DEV_SEED_ALLOW_REMOTE=%j', (value) => {
    process.env[ALLOW_REMOTE_SUPABASE_ENV] = value;
    expect(() => assertLocalSupabaseUrl(REMOTE_URL)).not.toThrow();
  });

  it.each(['0', 'false', '', 'yes'])('is not suppressed by DEV_SEED_ALLOW_REMOTE=%j', (value) => {
    process.env[ALLOW_REMOTE_SUPABASE_ENV] = value;
    expect(() => assertLocalSupabaseUrl(REMOTE_URL)).toThrow(REFUSAL_MARKER);
  });

  it('exposes the opt-out variable name', () => {
    expect(ALLOW_REMOTE_SUPABASE_ENV).toBe('DEV_SEED_ALLOW_REMOTE');
  });
});

describe('createServiceRoleClient', () => {
  it('refuses a non-local URL before createClient runs, without leaking the key', () => {
    let message = '';
    try {
      createServiceRoleClient(REMOTE_URL, 'svc-key-sentinel');
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain(REFUSAL_MARKER);
    expect(message).not.toContain('svc-key-sentinel');
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('builds a session-less client for a local URL', () => {
    createServiceRoleClient('http://127.0.0.1:54321', 'svc-key');
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0]).toEqual([
      'http://127.0.0.1:54321',
      'svc-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    ]);
  });

  it('accepts a non-local URL with the allowRemote option', () => {
    createServiceRoleClient(REMOTE_URL, 'svc-key', { allowRemote: true });
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0]?.[0]).toBe(REMOTE_URL);
  });

  it('accepts a non-local URL with the environment opt-out', () => {
    process.env[ALLOW_REMOTE_SUPABASE_ENV] = '1';
    createServiceRoleClient(REMOTE_URL, 'svc-key');
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0]?.[0]).toBe(REMOTE_URL);
  });

  it('returns the client createClient built', () => {
    const sentinel = { sentinel: true };
    createClientMock.mockReturnValueOnce(sentinel);
    expect(createServiceRoleClient('http://127.0.0.1:54321', 'svc-key')).toBe(sentinel);
  });
});

describe('SupabaseAdminClient constructor', () => {
  it('refuses a non-local URL before createClient runs, without leaking the key', () => {
    let message = '';
    try {
      new SupabaseAdminClient(REMOTE_URL, 'svc-key-sentinel');
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain(REFUSAL_MARKER);
    expect(message).not.toContain('svc-key-sentinel');
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('passes a local URL through to createClient unchanged', () => {
    new SupabaseAdminClient('http://127.0.0.1:54321', 'svc-key');
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0]).toEqual(['http://127.0.0.1:54321', 'svc-key', expect.anything()]);
  });

  it('accepts a non-local URL with the allowRemote option', () => {
    new SupabaseAdminClient(REMOTE_URL, 'svc-key', undefined, { allowRemote: true });
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0]?.[0]).toBe(REMOTE_URL);
  });

  it('accepts a non-local URL with the environment opt-out', () => {
    process.env[ALLOW_REMOTE_SUPABASE_ENV] = '1';
    new SupabaseAdminClient(REMOTE_URL, 'svc-key');
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it('constructs with the module defaults', () => {
    expect(() => new SupabaseAdminClient()).not.toThrow();
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});

describe('repository wiring drift gate', () => {
  function read(path: string): string {
    return readFileSync(resolve(REPO_ROOT, path), 'utf8');
  }
  function capture(text: string, pattern: RegExp): Array<string> {
    return [...text.matchAll(pattern)].map((m) => m[1]);
  }

  const apiSection = read('apps/supabase/supabase/config.toml')
    .split(/^\[/m)
    .find((section) => section.startsWith('api]'));

  const sources: Record<string, Array<string>> = {
    '.env.example': capture(read('.env.example'), /^(?:PUBLIC_)?SUPABASE_URL=(\S+)$/gm),
    'tests/scripts/e2e-run.sh': capture(
      read('tests/scripts/e2e-run.sh'),
      /^SUPABASE_URL="\$\{SUPABASE_URL:-([^}]+)\}"$/gm
    ),
    'docker-compose.dev.yml': capture(
      read('docker-compose.dev.yml'),
      /PUBLIC_SUPABASE_URL:\s*\$\{PUBLIC_SUPABASE_URL:-([^}]+)\}/g
    ),
    'config.toml [api] port': capture(apiSection ?? '', /^port\s*=\s*(\d+)/gm).map(
      (port) => `http://127.0.0.1:${port}`
    ),
    'client default literals': [
      'packages/dev-seed/src/supabaseAdminClient.ts',
      'tests/tests/utils/supabaseAdminClient.ts'
    ].flatMap((path) => capture(read(path), /process\.env\.SUPABASE_URL \?\? '([^']+)'/g)),
    'visual-container forward': capture(read('tests/scripts/visual-container.sh'), /"54321:([^:"]+):54321"/g).map(
      (host) => `http://${host}:54321`
    ),
    'seed.sql supabase_url': capture(read('apps/supabase/supabase/seed.sql'), /\('supabase_url',\s*'([^']+)'\)/g)
  };

  it.each(Object.keys(sources))('%s yields at least one URL', (source) => {
    expect(sources[source].length).toBeGreaterThan(0);
  });

  it.each(Object.entries(sources).flatMap(([source, urls]) => urls.map((url) => [source, url])))(
    '%s: %s passes the guard',
    (_source, url) => {
      expect(isLocalSupabaseUrl(url)).toBe(true);
    }
  );
});
