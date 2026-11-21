/**
 * @file caller-limit.smoke.ts.
 *
 * The per-caller limit of the `account-access` Edge Function is in force on the deployed project: within 31 `check-code` calls, each with a fresh code no invitation holds, the function refuses this caller with 429, its fixed refusal body and a `Retry-After` of 1 to 600 seconds.
 *
 * It runs only behind the deployed smoke gate, which has already proved the served build, the Supabase ref and the project. The Supabase URL, the anon key and the project id are read from the page the application serves. The calls carry no client-address header: Cloudflare, in front of the hosted function, sets it to the caller's own address.
 *
 * Its one write: the function keeps one `caller:` throttle row for that address, which a later take deletes once its 10-minute window has passed. Its side effect: for up to 10 minutes after a run, `check-code`, `request-link` and `request-recovery` refuse that address with 429 on the project, so a sign-in-link mail requested from it in that window is refused.
 *
 * Tracing is off for this file because the calls' headers carry the anon key. The test prints the calls admitted and the wait, and nothing else.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { checkCodeRequest, checkCodeTargetFrom, freshCheckCode, probeCallerLimit } from '../utils/callerLimitProbe';
import { extractServedEnv, extractServedProjectId } from '../utils/deployedTarget';
import type { ProbeAnswer, ProbeResult } from '../utils/callerLimitProbe';

test.use({ trace: 'off' });

test('the per-caller limit of account-access refuses this caller with 429 and a Retry-After', async ({ request }) => {
  const served = await request.get('/');
  expect(served.ok()).toBe(true);
  const html = await served.text();
  const target = checkCodeTargetFrom(extractServedEnv(html), extractServedProjectId(html));
  const post = async (code: string): Promise<ProbeAnswer> => {
    const call = checkCodeRequest(target, code);
    const response = await request.post(call.url, { headers: call.headers, data: call.data });
    return {
      status: response.status(),
      bodyText: await response.text(),
      retryAfter: response.headers()['retry-after'] ?? null
    };
  };
  const result = await probeCallerLimit(post, freshCheckCode);
  expect(result, result.ok ? 'the per-caller limit refused this caller' : result.reason).toMatchObject({ ok: true });
  // The hard assertion above has proved `ok: true`, so the result is the refusal's.
  const { admitted, retryAfterSeconds } = result as Extract<ProbeResult, { ok: true }>;
  console.log(`caller_limit_admitted=${admitted}`);
  console.log(`caller_limit_retry_after=${retryAfterSeconds}`);
});
