/**
 * Unit tests for the caller-limit probe: how it classifies the answers of `account-access`, the request it builds, and the pins of its two constants and the refusal body to the function they describe.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts callerLimitProbe
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import {
  CALLER_LIMIT,
  CALLER_WINDOW_SECONDS,
  checkCodeRequest,
  checkCodeTargetFrom,
  freshCheckCode,
  probeCallerLimit
} from './callerLimitProbe';
import type { CheckCodeTarget, ProbeAnswer } from './callerLimitProbe';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCHEMA_FILE = path.join(REPO_ROOT, 'apps/supabase/supabase/schema/506-invitation-rpcs.sql');
const SETTINGS_SCHEMA_FILE = path.join(REPO_ROOT, 'apps/supabase/supabase/schema/107-feedback.sql');
const CONTRACT_FILE = path.join(REPO_ROOT, 'apps/supabase/supabase/functions/account-access/contract.ts');

const UNKNOWN: ProbeAnswer = { status: 200, bodyText: '{"status":"unknown"}', retryAfter: null };
const REFUSED_BODY = '{"error":"too-many-requests"}';

/** A stand-in `post` that gives the queued answers in order, records the code of every call and fails on a call past the queue. */
function standIn(answers: ReadonlyArray<ProbeAnswer>): {
  post: (code: string) => Promise<ProbeAnswer>;
  codes: Array<string>;
} {
  const codes: Array<string> = [];
  const post = async (code: string): Promise<ProbeAnswer> => {
    codes.push(code);
    const next = answers[codes.length - 1];
    if (!next) throw new Error(`stand-in called ${codes.length} times, more than its ${answers.length} answers`);
    return next;
  };
  return { post, codes };
}

/** `count` admitted answers followed by `last`. */
function admittedThen(count: number, last: ProbeAnswer): Array<ProbeAnswer> {
  return [...Array.from({ length: count }, () => UNKNOWN), last];
}

describe('probeCallerLimit', () => {
  it('fails after 61 admitted calls naming the possible causes, and makes no 62nd', async () => {
    const { post, codes } = standIn(Array.from({ length: 70 }, () => UNKNOWN));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason.startsWith('no 429 within 61 calls')).toBe(true);
    for (const cause of [
      'behind_cloudflare',
      'access_caller_max is set above 30',
      'cf-connecting-ip',
      'access_caller_take',
      'address changed'
    ]) {
      expect(!result.ok && result.reason).toContain(cause);
    }
    expect(codes).toHaveLength(61);
  });

  it('passes on a refusal at call 61, after a window that was partly used when it started has reset', async () => {
    const { post, codes } = standIn(admittedThen(60, { status: 429, bodyText: REFUSED_BODY, retryAfter: '600' }));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result).toEqual({ ok: true, admitted: 60, retryAfterSeconds: 600 });
    expect(codes).toHaveLength(61);
    expect(new Set(codes).size).toBe(61);
  });

  it('passes on a refusal at call 31 with the fixed body and a Retry-After within the window, with a fresh code each call', async () => {
    const { post, codes } = standIn(admittedThen(30, { status: 429, bodyText: REFUSED_BODY, retryAfter: '600' }));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result).toEqual({ ok: true, admitted: 30, retryAfterSeconds: 600 });
    expect(codes).toHaveLength(31);
    expect(new Set(codes).size).toBe(31);
  });

  it('passes on a refusal at the first call, with nothing admitted', async () => {
    const { post, codes } = standIn([{ status: 429, bodyText: REFUSED_BODY, retryAfter: '1' }]);
    expect(await probeCallerLimit(post, freshCheckCode)).toEqual({ ok: true, admitted: 0, retryAfterSeconds: 1 });
    expect(codes).toHaveLength(1);
  });

  it('accepts whichever code status the admitted calls carry', async () => {
    const statuses = ['valid', 'used', 'unknown'].map((status) => ({
      status: 200,
      bodyText: JSON.stringify({ status }),
      retryAfter: null
    }));
    const { post } = standIn([...statuses, { status: 429, bodyText: REFUSED_BODY, retryAfter: '42' }]);
    expect(await probeCallerLimit(post, freshCheckCode)).toEqual({ ok: true, admitted: 3, retryAfterSeconds: 42 });
  });

  it.each([
    ['another error', '{"error":"internal"}'],
    ['an extra key', '{"error":"too-many-requests","extra":1}'],
    ['no JSON', 'Too Many Requests'],
    ['an array', '["too-many-requests"]']
  ])('fails on a 429 whose body is %s, quoting no body text', async (_label, bodyText) => {
    const { post } = standIn(admittedThen(5, { status: 429, bodyText, retryAfter: '600' }));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('call 6');
    expect(!result.ok && result.reason).not.toContain(bodyText);
  });

  it.each([
    ['0', '0'],
    ['601', '601'],
    ['abc', 'abc'],
    [null, 'absent'],
    ['1.5', '1.5'],
    ['010', '010']
  ])('fails on a 429 whose Retry-After is %s, naming %s', async (retryAfter, named) => {
    const { post } = standIn(admittedThen(30, { status: 429, bodyText: REFUSED_BODY, retryAfter }));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('Retry-After');
    expect(!result.ok && result.reason).toContain(named);
  });

  it('fails on any other status, naming the call and the status', async () => {
    const { post, codes } = standIn(
      admittedThen(2, { status: 500, bodyText: '{"error":"internal"}', retryAfter: null })
    );
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('call 3');
    expect(!result.ok && result.reason).toContain('500');
    expect(codes).toHaveLength(3);
  });

  it.each([
    ['another status word', '{"status":"maybe"}'],
    ['an extra key', '{"status":"unknown","code":"x"}'],
    ['no JSON', 'ok'],
    ['null', 'null']
  ])('fails on a 200 whose body is %s, which is not a code status', async (_label, bodyText) => {
    const { post } = standIn(admittedThen(1, { status: 200, bodyText, retryAfter: null }));
    const result = await probeCallerLimit(post, freshCheckCode);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('call 2');
    expect(!result.ok && result.reason).not.toContain(bodyText);
  });

  it('counts its calls from the limit it is given', async () => {
    const { post, codes } = standIn(Array.from({ length: 10 }, () => UNKNOWN));
    const result = await probeCallerLimit(post, freshCheckCode, 3, 60);
    expect(!result.ok && result.reason.startsWith('no 429 within 7 calls')).toBe(true);
    expect(codes).toHaveLength(7);
  });
});

describe('freshCheckCode', () => {
  it('gives 100 distinct codes, each within the function’s code length of 1 to 64', () => {
    const codes = Array.from({ length: 100 }, () => freshCheckCode());
    expect(new Set(codes).size).toBe(100);
    for (const code of codes) {
      expect(code.length).toBeGreaterThanOrEqual(1);
      expect(code.length).toBeLessThanOrEqual(64);
    }
  });
});

describe('checkCodeRequest', () => {
  const target: CheckCodeTarget = {
    supabaseUrl: 'https://abcdefghijklmnopqrst.supabase.co',
    anonKey: 'made-up-anon-key',
    projectId: '00000000-0000-0000-0000-000000000001'
  };

  it('builds a check-code request to account-access with exactly three headers and no client address', () => {
    expect(checkCodeRequest(target, 'smoke-x')).toEqual({
      url: 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/account-access',
      headers: {
        apikey: 'made-up-anon-key',
        Authorization: 'Bearer made-up-anon-key',
        'Content-Type': 'application/json'
      },
      data: { operation: 'check-code', project_id: '00000000-0000-0000-0000-000000000001', code: 'smoke-x' }
    });
  });

  it('does not double the slash of a Supabase URL that ends in one', () => {
    expect(checkCodeRequest({ ...target, supabaseUrl: `${target.supabaseUrl}/` }, 'c').url).toBe(
      'https://abcdefghijklmnopqrst.supabase.co/functions/v1/account-access'
    );
  });
});

describe('checkCodeTargetFrom', () => {
  it('reads the target from the served environment and the served project id', () => {
    expect(
      checkCodeTargetFrom(
        {
          PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
          PUBLIC_SUPABASE_ANON_KEY: 'made-up-anon-key'
        },
        '00000000-0000-0000-0000-000000000001'
      )
    ).toEqual({
      supabaseUrl: 'https://abcdefghijklmnopqrst.supabase.co',
      anonKey: 'made-up-anon-key',
      projectId: '00000000-0000-0000-0000-000000000001'
    });
  });

  it('names every missing piece and holds no value', () => {
    expect(() => checkCodeTargetFrom(null, null)).toThrow(
      /^CALLER LIMIT TARGET UNREADABLE: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, data-project-id/
    );
    let message = '';
    try {
      checkCodeTargetFrom({ PUBLIC_SUPABASE_URL: 'https://x.supabase.co', PUBLIC_SUPABASE_ANON_KEY: '  ' }, ' ');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message.startsWith('CALLER LIMIT TARGET UNREADABLE: ')).toBe(true);
    expect(message).toContain('PUBLIC_SUPABASE_ANON_KEY');
    expect(message).toContain('data-project-id');
    expect(message).not.toContain('PUBLIC_SUPABASE_URL');
    expect(message).not.toContain('x.supabase.co');
  });

  it('treats a non-string value as missing', () => {
    expect(() => checkCodeTargetFrom({ PUBLIC_SUPABASE_URL: 42, PUBLIC_SUPABASE_ANON_KEY: 'k' }, 'p')).toThrow(
      /^CALLER LIMIT TARGET UNREADABLE: PUBLIC_SUPABASE_URL$/
    );
  });
});

describe('the pins to the function', () => {
  it('holds the default limit and the window of access_caller_take, which the two constants equal', () => {
    expect(fs.readFileSync(SETTINGS_SCHEMA_FILE, 'utf8')).toContain(
      'access_caller_max integer NOT NULL DEFAULT 30 CHECK (access_caller_max > 0)'
    );
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    expect(schema).toContain("v_window constant interval := interval '10 minutes';");
    expect(CALLER_LIMIT).toBe(30);
    expect(CALLER_WINDOW_SECONDS).toBe(600);
  });

  it('holds the refusal body the probe accepts', () => {
    const contract = fs.readFileSync(CONTRACT_FILE, 'utf8');
    expect(contract).toContain("TOO_MANY_REQUESTS_BODY = Object.freeze({ error: 'too-many-requests' } as const)");
    expect(JSON.parse(REFUSED_BODY)).toEqual({ error: 'too-many-requests' });
  });
});
