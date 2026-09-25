/**
 * The results leaf's two load guards, pinned as pure functions of the params and the URL.
 *
 * Phase 165 D-10 KEEPS both guards through the route split. The discussion document's starred option was to delete them and let SvelteKit's own 404 answer, but that rested on the params becoming REQUIRED — and D-08 keeps all four optional, so both malformed shapes stay routable and both guards keep their reason to exist. Deleting them would also remove the second layer of the phase's only V5 input-validation control (threat T-165-02): the `etPl` / `etSg` matchers are the first layer, and the matcher-fallthrough 404 below is what catches the segment that slips past them.
 *
 * The guards read nothing but `params` and `url`, so driving `load` directly is the cheapest instrument that actually exercises them — no browser, no data layer, no context.
 *
 * ## Correctness invariants — the distinct ways this file could hand back a false pass
 *
 * 1. **A guard that never throws looks identical to a guard that was never called.** Both produce "no error observed". So every positive case asserts the THROWN STATUS CODE — 404, or 307 with its target — and never merely that something was thrown. A bare `expect(...).toThrow()` here would pass against a `load` that threw for an unrelated reason, and against one whose guard had been deleted if the harness itself threw first.
 * 2. **A redirect target that force-fills the plural is a navigation loop, not a fix.** `/results/{e}` → `/results/{e}/candidates` is exactly the force-fill the Post-88-02 loop fix removed, and the guard's own doc-comment records it. So the 307 rows assert the target's SHAPE — that it carries no plural the incoming URL did not carry — rather than asserting only the status code. A guard that redirected to a force-filled URL would satisfy a status-only assertion.
 * 3. **The negative row is what keeps the positive rows from being vacuous.** A `load` that threw unconditionally would satisfy every positive row in this file. The well-formed full-entity shape is therefore asserted to RESOLVE, which is the only row that can fail if the guards become indiscriminate.
 * 4. **`redirect()` and `error()` both throw, and a thrown redirect is not an error.** `isRedirect` / `isHttpError` are not on the test surface here, so the two are told apart by shape — a redirect carries `status` + `location`, an error carries `status` + `body`. Matching on shape rather than on `instanceof` also keeps the file from passing because SvelteKit changed a class name.
 * 5. **The search string must survive both guards.** A guard that dropped `?electionId=…` would strand the voter's AVAILABLE-array selection, and the resulting URL would then be bounced again by the election-tab loader's GUARD 1. Asserted on the redirect rows.
 */

import { describe, expect, it } from 'vitest';
import { load } from './+page';

/** The persistent search params a real results URL always carries. Non-empty on purpose: invariant 5 cannot be observed against an empty search string. */
const SEARCH = '?electionId=el-1&constituencyId=c-1';

/** Drive `load` with the minimum SvelteKit surface the guards touch. They read `params` and `url` and nothing else. */
function runLoad(params: Record<string, string | undefined>) {
  return load({
    params,
    url: new URL(`https://vaa.test/results${SEARCH}`)
  } as unknown as Parameters<typeof load>[0]);
}

/** A thrown SvelteKit redirect: `status` + `location`. */
type ThrownRedirect = { status: number; location: string };
/** A thrown SvelteKit http error: `status` + `body`. */
type ThrownError = { status: number; body?: unknown };

/**
 * Run `load` and return what it threw, or `null` when it resolved.
 *
 * Returning rather than asserting keeps invariant 1 enforceable at the call site: each row decides for itself what the throw had to BE.
 */
async function capture(params: Record<string, string | undefined>): Promise<unknown> {
  try {
    await runLoad(params);
  } catch (thrown) {
    return thrown;
  }
  return null;
}

/** Narrow a captured throw to a redirect, failing loudly when it is anything else. */
function asRedirect(thrown: unknown): ThrownRedirect {
  const candidate = thrown as Partial<ThrownRedirect>;
  expect(
    typeof candidate?.status === 'number' && typeof candidate?.location === 'string',
    `expected load to throw a redirect (status + location); got ${JSON.stringify(thrown)}`
  ).toBe(true);
  return candidate as ThrownRedirect;
}

/** Narrow a captured throw to an http error, failing loudly when it is a redirect or anything else. */
function asHttpError(thrown: unknown): ThrownError {
  const candidate = thrown as Partial<ThrownRedirect> & Partial<ThrownError>;
  expect(
    typeof candidate?.status === 'number' && typeof candidate?.location !== 'string',
    `expected load to throw an http error (status, no location); got ${JSON.stringify(thrown)}`
  ).toBe(true);
  return candidate as ThrownError;
}

/** The four route shapes this file pins, one row each. */
const ROWS = [
  {
    name: 'matcher fallthrough — a segment that matched neither matcher lands on `id` alone',
    params: { electionTab: 'el-1', entityTab: undefined, entity: undefined, id: 'invalidplural' },
    outcome: 'error-404'
  },
  {
    name: 'entity without id',
    params: { electionTab: 'el-1', entityTab: 'candidates', entity: 'candidate', id: undefined },
    outcome: 'redirect-307'
  },
  {
    name: 'id without entity',
    params: { electionTab: 'el-1', entityTab: 'candidates', entity: undefined, id: 'cand-1' },
    outcome: 'redirect-307'
  },
  {
    name: 'well-formed full entity shape',
    params: { electionTab: 'el-1', entityTab: 'candidates', entity: 'candidate', id: 'cand-1' },
    outcome: 'resolves'
  }
] as const;

describe('results leaf +page.ts — the two guards D-10 keeps (T-165-02, T-165-03)', () => {
  it('the row table covers all four shapes, so no case is silently missing', () => {
    // Non-vacuity: a truncated table would make the describe below pass by running fewer rows than the guards have branches. Four is the measured truth — one 404 branch, two 307 branches, one fall-through.
    expect(ROWS).toHaveLength(4);
    expect(ROWS.filter((row) => row.outcome === 'redirect-307')).toHaveLength(2);
    expect(ROWS.filter((row) => row.outcome === 'resolves')).toHaveLength(1);
  });

  it('a matcher fallthrough is a 404, asserted on the STATUS CODE and not on the fact of a throw', async () => {
    const row = ROWS[0];
    const thrown = await capture(row.params);
    expect(thrown, 'load resolved for a matcher-fallthrough URL — the 404 guard did not fire').not.toBeNull();
    // Invariant 1: the status code, not merely that something was thrown.
    expect(asHttpError(thrown).status).toBe(404);
  });

  it.each(ROWS.filter((row) => row.outcome === 'redirect-307'))(
    '$name redirects 307 to a list shape that carries no force-filled plural',
    async ({ params }) => {
      const thrown = await capture(params);
      expect(thrown, 'load resolved for a half-present drawer URL — the coupling guard did not fire').not.toBeNull();
      const { status, location } = asRedirect(thrown);

      // Invariant 1.
      expect(status).toBe(307);

      // Invariant 2: the target is the LIST shape — the `entity` and `id` segments are gone.
      expect(location).toBe(`/results/${params.electionTab}/${params.entityTab}${SEARCH}`);
      expect(location, 'the redirect target still carries a drawer segment').not.toMatch(
        /\/(candidate|organization|alliance)(\/|$|\?)/
      );

      // Invariant 5: the persistent search params survive.
      expect(location).toContain(SEARCH);
    }
  );

  it('an entity-without-id URL with NO plural in it redirects without inventing one', async () => {
    // Invariant 2 at its sharpest. This is the exact shape the Post-88-02 loop fix is about: with no `entityTab` on the way in, a guard that appended `/candidates` would emit a URL that the tab-implication logic then navigates away from, and back.
    const thrown = await capture({ electionTab: 'el-1', entityTab: undefined, entity: 'candidate', id: undefined });
    const { status, location } = asRedirect(thrown);
    expect(status).toBe(307);
    expect(location).toBe(`/results/el-1${SEARCH}`);
    expect(location, 'the guard force-filled a plural the incoming URL did not carry').not.toMatch(
      /\/(candidates|organizations|alliances)/
    );
  });

  it('the well-formed full entity shape passes both guards untouched', async () => {
    // Invariant 3: the row that fails if the guards become indiscriminate.
    const row = ROWS[3];
    const thrown = await capture(row.params);
    expect(thrown, `load threw for a well-formed drawer URL: ${JSON.stringify(thrown)}`).toBeNull();
    await expect(runLoad(row.params)).resolves.toEqual({});
  });

  it('the bare list shapes pass both guards untouched', async () => {
    // D-08 keeps all four params optional, so these are real render shapes rather than malformed URLs, and a guard that rejected them would break the picker and the implied-tab case.
    expect(
      await capture({ electionTab: undefined, entityTab: undefined, entity: undefined, id: undefined })
    ).toBeNull();
    expect(await capture({ electionTab: 'el-1', entityTab: undefined, entity: undefined, id: undefined })).toBeNull();
    expect(
      await capture({ electionTab: 'el-1', entityTab: 'organizations', entity: undefined, id: undefined })
    ).toBeNull();
  });

  it('the cross-type shape stays routable, because D-09 forbids canonicalisation', async () => {
    // No current emitter produces `organizations/candidate/{id}` (derived in `165-NEGATIVE-CONTROL.md` § 6), so it is not in the E2E enumeration — but D-09 forbids redirecting it and D-10 keeps the params optional, so it must still LOAD. This row is what stops "nothing emits it" from drifting into "so we may as well reject it".
    expect(
      await capture({ electionTab: 'el-1', entityTab: 'organizations', entity: 'candidate', id: 'cand-1' })
    ).toBeNull();
  });
});
