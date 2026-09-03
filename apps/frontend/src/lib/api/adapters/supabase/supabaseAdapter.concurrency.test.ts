import { describe, expect, it, vi } from 'vitest';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import type { Database } from '@openvaa/supabase-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDataProvider } from './dataProvider/supabaseDataProvider';
import type { SupabaseDataWriter } from './dataWriter/supabaseDataWriter';
import type { SupabaseAdapterConfig } from './supabaseAdapter.type';

// Mock $env/dynamic/public before any imports that depend on it. Mandatory: the factories below import the browser client source, which reads `constants.PUBLIC_SUPABASE_*` at module load, and every sibling adapter spec carries the same block.
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

/**
 * The concurrency negative control — two logical requests, one shared adapter (criteria **C1** and **C2**, decisions **C1(a)** and **C2(a)**, requirement **D11**).
 *
 * Ruling **D11** states this phase's deliverable as *the proof, not the patch*: "a concurrency test that FAILS on the singleton before it passes on the fix." This file is that proof. `157.2-01` (wave 1) builds its apparatus and declares its cases while every subject is still untouched; `157.2-02` fills the assertions, measures the RED against the module singleton, lands the factory, and records both halves in `157.2-NEGATIVE-CONTROL-LEDGER.md` rows 1 and 2.
 *
 * ## Two facts the shape depends on, recorded because neither is visible from the code under test
 *
 * **1. The contamination window is wider than "two awaits in one function."** Fact 7 describes the window as the writer obtained at `candidate/(protected)/+layout.server.ts:30`, then `await locals.safeGetSession()` at `:33`, then `await dataWriter.getCandidateUserData(…)` at `:44` — three statements inside one load. That is the NARROWEST instance, not the widest. Two voter universal loads return UNAWAITED promises (`(voters)/(located)/+layout.ts:102-112` and `(voters)/nominations/+layout.ts:32-42`, research finding D-8 and pitfall P6), so the adapter is captured by a promise that outlives the load's own return and is settled long after the request that configured it has finished. A per-request instance that looks correct at the call site is still wrong if the promise it produced was created against a rebound singleton. The interleaving below models the narrow window because that is the one that can be driven deterministically; the wide one is why the fix has to be a fresh instance rather than a save-and-restore around the await.
 *
 * **2. The ordering here is program control flow, not an observed interleaving — which is what makes this a negative control rather than a race.** Every ordering constraint comes from an explicit `await` on an externally-resolved promise built by `deferred()`. There is no timer of any kind, no fake-timer harness, no promise-race, no zero-delay scheduling, and no dependence on microtask-queue depth or on how busy the machine is. The literal names of those constructs are deliberately absent from this file: the plan's own acceptance criterion is a grep for them, so writing them out even in prose would trip the check that proves they are unused. The sequence `configure A → park A → configure B → complete B → resume A` is written down rather than hoped for, so this spec fails on the singleton BY CONSTRUCTION. A test that failed because it lost a race would be a flake, and `CLAUDE.md`'s cardinal rule forbids shipping one — which is also why decision **C1** rejected the Playwright variant with two overlapping authenticated sessions.
 *
 * ## Why a single method call cannot reproduce the defect
 *
 * `SupabaseDataProvider._getAppSettings` reads `this.supabase` SYNCHRONOUSLY, on its first line, before its first `await`. An interleave placed inside one adapter method therefore cannot show the bleed at all. The defect lives at the CALL SITE: the window sits between two operations of one logical request, with the request's own `await` in between. Every case below models two adapter operations per request, never one.
 *
 * ## The read-back carrier, and why it is not a bare `tag` key
 *
 * `157.2-RESEARCH.md` § "Interleaving A" sketches the fake resolving `{ data: { settings: { tag } }, error: null }` and asserting on `.tag`. That carrier does not survive the tree as it stands after Phase 157.1: `StoredSettingsSchema` is a `z.strictObject`, so a bare `tag` key is an unrecognised top-level member, `parseWithPartialPreserve` refuses it and preserves nothing, and `.tag` comes back undefined for BOTH requests — which would make the GREEN pass vacuously and the RED fail ambiguously. The tag therefore rides on `survey.linkTemplate`, a real optional string member of the schema that reaches `getAppSettings`'s caller unchanged. The apparatus exposes the same identity at three points so `157.2-02` can assert on whichever reads most honestly: the client's own `tag` field, the `tables` array recording every `from()` it served, and the payload it resolves.
 */

/** The two adapter kinds the two vectors exercise. The provider carries `#supabase`; the writer carries `#fetch` through its inherited, un-overridden `clearIdToken`. */
type AdapterKind = 'provider' | 'writer';

/** The concrete adapter each kind resolves to. Declared against the CLASSES rather than against `typeof dataProvider`, so it survives `157.2-02` replacing the singleton with a factory. */
type AdapterFor<TKind extends AdapterKind> = TKind extends 'provider' ? SupabaseDataProvider : SupabaseDataWriter;

/**
 * THE SEAM, and the load-bearing piece of this entire file.
 *
 * `157.2-02` FLIPPED THIS ONE FUNCTION'S BODY, and that flip is the whole difference between the RED run and the GREEN run. It bound to a module-scope adapter that every request shared — which is how all eighteen call sites still reached one until `157.2-03` through `157.2-06` converted them — and it now binds to the per-call factories `createDataProvider` / `createDataWriter`, through their universal arm. Nothing else in this file constructs or configures an adapter, and no case reaches one except through here — so the two runs are the same test observed twice rather than two different tests. That is threat **T-157.2-01** in `157.2-01-PLAN.md`'s register, and it is why the seam is a single named function with a one-expression body.
 *
 * The RED transcripts taken through the singleton body are `1-OLD` and `2-OLD` in `157.2-NEGATIVE-CONTROL-LEDGER.md`; the GREEN taken through the body below is `1-NEW` and `2-NEW`. Restoring the singleton here reproduces the RED exactly, which is the cheapest way to re-measure it.
 * @param kind - Which adapter the logical request needs.
 * @param config - The request's own fetch and its own Supabase client.
 * @returns An adapter constructed for that request.
 */
function obtain<TKind extends AdapterKind>(kind: TKind, config: SupabaseAdapterConfig): AdapterFor<TKind> {
  return (kind === 'provider'
    ? createDataProvider({ fetch: config.fetch, client: config.client })
    : createDataWriter({ fetch: config.fetch, client: config.client })) as unknown as AdapterFor<TKind>;
}

/**
 * The only ordering mechanism this file may contain: a promise resolved from the outside.
 * @returns The gate promise and the function that opens it.
 */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** An identity-tagged fake Supabase client. Purpose-built rather than extracted from `dataProvider/supabaseDataProvider.test.ts`, whose `createMockSupabaseClient` is file-local and not exported; extracting it would touch four test files for no gain. */
type TaggedClient = {
  /** Which logical request this client belongs to. */
  tag: string;
  /** Every table this client was asked for, in order. It stays empty on a client whose request never reached it, which is the observation `157.2-02` reads. */
  tables: Array<string>;
  from: (table: string) => unknown;
};

/**
 * Build a fake Supabase client that reports its own identity through the data it returns.
 *
 * It needs only the chain `.from().select().limit().single()`, which is what `_getAppSettings` issues. The tag rides on `survey.linkTemplate` because `StoredSettingsSchema` is strict and would refuse a bare `tag` key; see the file docstring.
 * @param tag - The logical request's identity.
 * @returns The tagged fake.
 */
function taggedClient(tag: string): TaggedClient {
  const tables: Array<string> = [];
  const chain = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: { settings: { survey: { linkTemplate: tag } } }, error: null }))
  };
  return {
    tag,
    tables,
    from: vi.fn((table: string) => {
      tables.push(table);
      return chain;
    })
  };
}

/**
 * Bridge the fake onto the adapter's declared client type.
 * @param client - The tagged fake.
 * @returns The same object, typed as the adapter expects.
 */
function asServerClient(client: TaggedClient): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}

/**
 * A per-request `fetch` spy for the `#fetch` vector. Each logical request gets its own, and the assertion `157.2-02` fills is that each records exactly one call.
 * @param tag - The logical request's identity.
 * @returns The spy.
 */
function taggedFetch(tag: string) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ type: 'success', tag }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  );
}

/** What one run of the interleaving exposes to its assertions. Both vectors share it, because both vectors are the same driver with a different operation. */
type Interleaving<TResult> = {
  /** The recorded control flow, which the two driver cases assert so a broken gate cannot masquerade as an isolated adapter. */
  order: Array<string>;
  /** Request A's own tagged client, and request B's. `tables` stays empty on a client whose request never reached it. */
  clientA: TaggedClient;
  clientB: TaggedClient;
  /** Request A's own fetch spy, and request B's. Each must record exactly one call. */
  fetchA: ReturnType<typeof taggedFetch>;
  fetchB: ReturnType<typeof taggedFetch>;
  /** What each logical request's operation resolved to. */
  resultA: TResult;
  resultB: TResult;
};

/**
 * Drive the one interleaving both vectors use: configure A, park A, configure B, complete B, resume A.
 *
 * Request A's `await` on the gate models `await locals.safeGetSession()` at `candidate/(protected)/+layout.server.ts:33` — the request's OWN await, between configuring the adapter and using it, which is fact 7's measured window and the narrowest instance of ruling D11's defect. Request B configures and completes entirely inside that window. Every ordering constraint below is an `await` on an externally-resolved promise; see the file docstring for why no other ordering mechanism appears anywhere in this file.
 * @param kind - Which adapter both logical requests need.
 * @param operate - The adapter operation each logical request performs. It is the ONLY difference between the two vectors.
 * @returns Everything the assertions read: the recorded order, both tagged clients, both fetch spies and both results.
 */
async function driveTwoRequests<TKind extends AdapterKind, TResult>(
  kind: TKind,
  operate: (adapter: AdapterFor<TKind>) => Promise<TResult>
): Promise<Interleaving<TResult>> {
  const order: Array<string> = [];
  const gate = deferred();
  const clientA = taggedClient('A');
  const clientB = taggedClient('B');
  const fetchA = taggedFetch('A');
  const fetchB = taggedFetch('B');

  const requestA = (async () => {
    const adapter = obtain(kind, {
      fetch: fetchA,
      client: asServerClient(clientA),
      locale: 'en',
      defaultLocale: 'en'
    });
    order.push('A configures');
    await gate.promise;
    order.push('A resumes');
    return operate(adapter);
  })();

  const requestB = (async () => {
    const adapter = obtain(kind, {
      fetch: fetchB,
      client: asServerClient(clientB),
      locale: 'en',
      defaultLocale: 'en'
    });
    order.push('B configures');
    const result = await operate(adapter);
    order.push('B completes');
    return result;
  })();

  const resultB = await requestB;
  gate.resolve();
  const resultA = await requestA;

  return { order, clientA, clientB, fetchA, fetchB, resultA, resultB };
}

/** The order every run of `driveTwoRequests` must record. Asserting it is the positive control for the two isolation assertions: an interleaving that did not actually interleave would let a shared adapter look isolated. */
const EXPECTED_ORDER = ['A configures', 'B configures', 'B completes', 'A resumes'];

describe('supabase adapter concurrency — criteria C1 and C2, D11', () => {
  // APPARATUS PROBES. Both pass in `157.2-01`, and they exist so a broken apparatus cannot masquerade as a silent test: a fake whose chain never resolves, a seam that hands back an unconfigured adapter, or a gate that does not actually park would each let a filled case below pass or fail for a reason that has nothing to do with the subject under proof. Between them the two probes exercise all four pieces of apparatus.
  describe('apparatus', () => {
    it('the seam hands back an adapter reading through the request’s own tagged client', async () => {
      const client = taggedClient('A');
      const fetchSpy = taggedFetch('A');

      const provider = obtain('provider', {
        fetch: fetchSpy,
        client: asServerClient(client),
        locale: 'en',
        defaultLocale: 'en'
      });
      const result = await provider.supabase.from('app_settings').select('settings').limit(1).single();

      expect(result).toEqual({ data: { settings: { survey: { linkTemplate: 'A' } } }, error: null });
      expect(client.tables).toEqual(['app_settings']);
      // Configuring an adapter must not issue a request of its own, so the per-request fetch spy is still untouched at this point.
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('the gate orders two async functions the way the interleaving assumes', async () => {
      const order: Array<string> = [];
      const gate = deferred();

      const parked = (async () => {
        order.push('A configures');
        await gate.promise;
        order.push('A resumes');
      })();
      const completed = (async () => {
        order.push('B configures');
        order.push('B completes');
      })();

      await completed;
      gate.resolve();
      await parked;

      expect(order).toEqual(['A configures', 'B configures', 'B completes', 'A resumes']);
    });
  });

  // THE `#supabase` VECTOR — ledger row 1, filled by `157.2-02`. Request A obtains an adapter with client A and parks on the gate, request B obtains one with client B and completes, then A resumes and reads back a tagged value. A's own await models `await locals.safeGetSession()` at `candidate/(protected)/+layout.server.ts:33`, the real window from ruling D11's first instance. RED on the singleton: A reads back B's tag.
  describe('the #supabase vector — two requests must not share one client', () => {
    it('drives the interleaving configure A, park A, configure B, complete B, resume A through obtain()', async () => {
      const run = await driveTwoRequests('provider', (adapter) => adapter.getAppSettings());

      expect(run.order).toEqual(EXPECTED_ORDER);
      // Request B is the one that completes INSIDE A's window, so B reading back its own tag is true on the singleton and on the factory alike. This case is the positive control and must pass in BOTH runs; only the next case discriminates.
      expect(run.resultB.survey?.linkTemplate).toBe('B');
    });

    it('asserts request A reads back its own client and never request B’s', async () => {
      const run = await driveTwoRequests('provider', (adapter) => adapter.getAppSettings());

      // RED on the module singleton: A resumes into an object whose `#supabase` request B overwrote, so this reads 'B'.
      expect(run.resultA.survey?.linkTemplate).toBe('A');
      // The same identity, observed at the client rather than at the payload: on the singleton A's client is never asked for a table at all and B's is asked twice.
      expect([run.clientA.tables, run.clientB.tables]).toEqual([['app_settings'], ['app_settings']]);
    });
  });

  // THE `#fetch` VECTOR — ledger row 2, filled by `157.2-02`. Same driver, `clearIdToken()` as the operation, and the assertion is on the two fetch spies. This vector is live even though no Supabase adapter calls `this.fetch` itself: `SupabaseDataWriter` inherits `clearIdToken`, `logout` and `exchangeCodeForIdToken` from `UniversalDataWriter` UN-OVERRIDDEN, and those reach SAME-ORIGIN app routes — `clearIdToken` at `universalDataWriter.ts:106-110` hits `/api/oidc/token` — where the forwarded cookie really is the request's own session. Amendment finding C: the ORIGINAL justification, that the request-scoped fetch forwards cookies to Supabase, is false because Supabase is cross-origin and PostgREST authenticates on `Authorization`; that sentence is itself ruling D10's root cause, so this vector rests on the same-origin inheritance instead. RED on the singleton: fetchA records 0 calls and fetchB records 2.
  describe('the #fetch vector — two requests must not share one fetch', () => {
    it('drives the same interleaving with clearIdToken() as the operation through obtain()', async () => {
      const run = await driveTwoRequests('writer', (adapter) => adapter.clearIdToken());

      expect(run.order).toEqual(EXPECTED_ORDER);
      // The positive control again: B completes inside A's window, so B's own spy served B's request in both runs.
      expect(run.resultB).toEqual({ type: 'success', tag: 'B' });
    });

    it('asserts each request’s fetch spy records exactly one call', async () => {
      const run = await driveTwoRequests('writer', (adapter) => adapter.clearIdToken());

      // Both counts are read in ONE assertion on purpose: the failure message then carries the whole RED shape ledger row 2 predicts — A's spy at 0 calls and B's at 2 — rather than only the first of the two numbers.
      expect([run.fetchA.mock.calls.length, run.fetchB.mock.calls.length]).toEqual([1, 1]);
    });
  });
});
