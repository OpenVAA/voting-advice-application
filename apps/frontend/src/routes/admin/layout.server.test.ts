/**
 * The two subtree server loaders' returned session PROJECTION (phase 158, D10 criterion 13).
 *
 * Everything a server load returns is serialised into the hydration payload in the HTML body. Until this spec, `routes/admin/+layout.server.ts` and `routes/candidate/+layout.server.ts` each returned `locals.safeGetSession()`'s whole `Session` — `access_token`, **`refresh_token`**, `expires_at` and the full `user` record — so a REFRESH TOKEN sat in the document of every authenticated admin page and every authenticated candidate page. `158-ADMIN-BASELINE.md` measured that shape at this phase's HEAD rather than assuming it.
 *
 * The remedy is the projection the root server loader's docstring already sanctions: `{ userId, expiresAt }`, and never the token-bearing object. Both consumers need EXISTENCE only — `authContext`'s `$derived(!!page.data.session)` and `getUserData`'s ancestor pre-check `if (!parentData.session)` — so the narrowing is invisible to them and visible to anyone reading the document body.
 *
 * BOTH loads are driven here, from one file, on purpose: they are byte-identical up to their application names, and a spec that pinned only one would let the other drift into a second idiom for one problem.
 *
 * The loads are driven DIRECTLY with a fake request context. No server is stood up; the only surface either load touches is `locals.safeGetSession`.
 */

import { describe, expect, it } from 'vitest';
import { load as adminLoad } from './+layout.server';
import { load as candidateLoad } from '../candidate/+layout.server';
import type { getUserData } from '$lib/auth/getUserData';

/** The exact member list the projection is allowed to carry. An adjacent extra member fails by name against this array. */
const PROJECTION_MEMBERS = ['expiresAt', 'userId'];

/** Members a reintroduction would most plausibly add back. Each is asserted absent BY NAME rather than by a single spot-check. */
const FORBIDDEN_MEMBERS = ['access_token', 'refresh_token', 'user', 'provider_token', 'token_type'];

/**
 * The two loads' event surfaces are typed against DIFFERENT generated route ids, so neither is assignable to the other and no single `typeof` names both. The erased signature below is the intersection they genuinely share: the one member either load touches. The compile-level coupling that matters is not lost by the erasure — it is asserted directly, at the bottom of this file, from each load's own `ReturnType`.
 */
type FakeEvent = { locals: { safeGetSession: () => Promise<{ session: unknown; user: unknown }> } };
type LoadFn = (event: FakeEvent) => Promise<{ session: unknown }>;

/** A fake `Session`, carrying the members the real one carries, so an over-broad projection has something to leak. */
function fakeSession({ expiresAt, nestedUserId }: { expiresAt?: number; nestedUserId: string }) {
  return {
    access_token: 'fake-access-token-value',
    refresh_token: 'fake-refresh-token-value',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    // The session's OWN nested user. `@supabase/ssr` wraps this in an insecure-use proxy because it is unverified; the projection must not read its id.
    user: { id: nestedUserId, email: 'nested@example.test' }
  };
}

/**
 * The minimum request context either load touches.
 *
 * Every call builds its own object, so nothing is shared between invocations — which is what the concurrency case below leans on.
 */
function makeEvent(result: { session: unknown; user: unknown }) {
  return { locals: { safeGetSession: async () => result } };
}

function authenticatedEvent({
  verifiedUserId,
  nestedUserId = 'nested-user-id',
  expiresAt
}: {
  verifiedUserId: string;
  nestedUserId?: string;
  expiresAt?: number;
}) {
  return makeEvent({
    session: fakeSession({ expiresAt, nestedUserId }),
    user: { id: verifiedUserId, email: 'verified@example.test' }
  });
}

const LOADS: Array<[string, LoadFn]> = [
  ['routes/admin/+layout.server.ts', adminLoad as unknown as LoadFn],
  ['routes/candidate/+layout.server.ts', candidateLoad as unknown as LoadFn]
];

describe.each(LOADS)('%s — the returned session projection', (_name, load) => {
  it('returns exactly one member, `session`, and that member carries exactly the declared projection members', async () => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'verified-user-id', expiresAt: 1893456000 }));

    expect(Object.keys(data as object)).toEqual(['session']);
    const projection = (data as { session: Record<string, unknown> }).session;
    // The key SET is enumerated and compared, so an adjacent extra member fails by name rather than being missed by a spot-check.
    expect(Object.keys(projection).sort()).toEqual(PROJECTION_MEMBERS);
  });

  it.each(FORBIDDEN_MEMBERS)('does not carry `%s` into the payload', async (member) => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'verified-user-id', expiresAt: 1893456000 }));
    const projection = (data as { session: Record<string, unknown> }).session;

    expect(member in projection).toBe(false);
    // Belt and braces: the whole serialised payload must not contain the fake credential values either, which catches a member nested one level down.
    expect(JSON.stringify(data)).not.toContain('fake-access-token-value');
    expect(JSON.stringify(data)).not.toContain('fake-refresh-token-value');
  });

  it('takes the identifier from the separately VERIFIED user, not from the session’s nested user', async () => {
    const data = await load(
      authenticatedEvent({
        verifiedUserId: 'id-from-the-verified-user',
        nestedUserId: 'id-from-the-sessions-nested-user',
        expiresAt: 1893456000
      })
    );

    expect((data as { session: { userId: string } }).session.userId).toBe('id-from-the-verified-user');
  });

  it('passes the expiry through by identity — not re-derived from a clock, not rounded, not converted', async () => {
    const knownExpiry = 1893456000;
    const data = await load(authenticatedEvent({ verifiedUserId: 'u', expiresAt: knownExpiry }));

    expect((data as { session: { expiresAt: number | null } }).session.expiresAt).toBe(knownExpiry);
  });

  it('carries the null form when the session reports no expiry', async () => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'u', expiresAt: undefined }));

    expect((data as { session: { expiresAt: number | null } }).session.expiresAt).toBeNull();
  });

  it('returns the null form for `session` when there is no session at all', async () => {
    const data = await load(makeEvent({ session: null, user: null }));

    expect(Object.keys(data as object)).toEqual(['session']);
    expect((data as { session: unknown }).session).toBeNull();
    // The consumers read truthiness, so the null form is what makes both of them treat this as unauthenticated.
    expect(Boolean((data as { session: unknown }).session)).toBe(false);
  });

  it('returns the null form when a session exists but the verifying user call did not return a user', async () => {
    const data = await load(makeEvent({ session: fakeSession({ nestedUserId: 'nested', expiresAt: 1 }), user: null }));

    expect((data as { session: unknown }).session).toBeNull();
  });

  it('resolves its session from its own request on every call — one request’s identifier never appears in another’s payload', async () => {
    const [first, second] = await Promise.all([
      load(authenticatedEvent({ verifiedUserId: 'request-one-user', expiresAt: 111 })),
      load(authenticatedEvent({ verifiedUserId: 'request-two-user', expiresAt: 222 }))
    ]);

    expect((first as { session: { userId: string } }).session.userId).toBe('request-one-user');
    expect((second as { session: { userId: string } }).session.userId).toBe('request-two-user');
    expect((first as { session: { expiresAt: number } }).session.expiresAt).toBe(111);
    expect((second as { session: { expiresAt: number } }).session.expiresAt).toBe(222);
    // Two independent objects, not one shared module-level cell handed out twice.
    expect((first as { session: unknown }).session).not.toBe((second as { session: unknown }).session);
  });
});

/**
 * The identity helper's structural ancestor-data type, read off the SHIPPED signature rather than re-declared here.
 *
 * Re-declaring it would let the copy and the original drift apart, which is the whole class of defect this phase removes. `ParentData` below therefore walks the exported function's own parameter types.
 */
type ParentData = Awaited<ReturnType<NonNullable<NonNullable<Parameters<typeof getUserData>[1]>['parent']>>>;

/** `true` when `TShape` is accepted where the helper’s ancestor data is expected. */
type Accepts<TShape> = TShape extends ParentData ? true : false;

describe('getUserData’s structural ancestor-data type still names a REQUIRED member', () => {
  it('rejects a bare boolean, a string and a number where a session is expected', () => {
    // Compile-level assertions. Each line fails `yarn typecheck` if the type is relaxed to an optional or unconstrained member — the property the narrowing had to preserve.
    const rejectsBareBoolean: Accepts<{ session: true }> = false;
    const rejectsString: Accepts<{ session: 'yes' }> = false;
    const rejectsNumber: Accepts<{ session: 1 }> = false;

    expect([rejectsBareBoolean, rejectsString, rejectsNumber]).toEqual([false, false, false]);
  });

  it('rejects a projection missing the required identifier, and accepts the one the loads return', () => {
    const rejectsExpiryOnly: Accepts<{ session: { expiresAt: number | null } }> = false;
    const acceptsTheProjection: Accepts<{ session: { userId: string; expiresAt: number | null } }> = true;
    const acceptsTheNullForm: Accepts<{ session: null }> = true;

    expect([rejectsExpiryOnly, acceptsTheProjection, acceptsTheNullForm]).toEqual([false, true, true]);
  });

  /**
   * The producer-to-consumer coupling, asserted at COMPILE time from each load's own return type rather than from a re-declaration.
   *
   * These two lines are what the erased `LoadFn` above gives up and takes back: if either load widens its payload back to the whole `Session`, or narrows past the member the helper requires, the assignment below stops compiling and `yarn typecheck` names this line.
   */
  it('both loads’ own return types are accepted where the helper expects its ancestor data', () => {
    const adminPayloadSatisfiesTheHelper: Accepts<Awaited<ReturnType<typeof adminLoad>>> = true;
    const candidatePayloadSatisfiesTheHelper: Accepts<Awaited<ReturnType<typeof candidateLoad>>> = true;

    expect([adminPayloadSatisfiesTheHelper, candidatePayloadSatisfiesTheHelper]).toEqual([true, true]);
  });
});
