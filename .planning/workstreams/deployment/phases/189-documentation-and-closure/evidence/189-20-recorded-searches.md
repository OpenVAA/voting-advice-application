# 189-20: the recorded searches of C-02, classified, and the closing greps

RECORDED=2026-11-21
RECORDED_BY=the plan executor of 189-20, from this checkout; every command below run on the closing tree at C02_HEAD, its output copied in full
GUARD_ADDED=no
    C-02 rules a recorded search, no permanent guard; none was added

## The locked search (C-02)

C02_COMMAND=git grep -n -i -E 'unverified|not yet observed|untested' -- ':!.planning'
C02_HEAD=f222fc457d4c0626991dc71590bd8a5e06b80350
C02_EXIT=0
C02_HITS=92
    92 lines in 30 files. The research counted 98 before the phase and 91 expected after it: the seven removals it named are gone (guide l.34 and l.93, the four "Not yet observed" sections, dns-mail l.310 and l.425), and the dated Observations row of 2026-11-20 in infra/envs/staging/supabase/README.md (plan 189-05's probe sitting, which names the probe check) is new, so 98 - 7 + 1 = 92
C02_CLASS_UnverifiedAnswers=40
    the frontend's `UnverifiedAnswers` type, the `UNVERIFIED_ANSWERS` sentinel `'unverified-answers'` and the prose and tests of the "unverified write" (a save whose read-back could not be validated). Not a statement about a deployed system
C02_CLASS_AuthUnverifiedSession=8
    the auth library's unverified session user (the nested `session.user` @supabase/ssr wraps in an insecure-use proxy), an unverified token before `getUser()` or the confirm page's post, and the fixture address `unverified@example.test`. Not a statement about a deployed system
C02_CLASS_ProbeCheckName=28
    the probe check `functions.identity-callback-unverified` (checks.mjs, probe-hosted.mjs, its tests), the local `unverified` header variable of its two calls (sources.mjs, probe-hosted.test.ts l.1474-1477), and four lines of the Supabase runbook that name the check: l.1671 (Step 23's description of the check) and the dated Observations rows l.1955, l.1958 and l.1986 (2026-11-11, 2026-11-11, 2026-11-20), which record the check's runs
C02_CLASS_TrufflehogResultClass=9
    trufflehog's `unverified` result class: the scanner config, the exclude-paths comment, the secret-scan job's comment in main.yaml and the guard test ciSecretScanFlags.test.ts
C02_CLASS_RepositoryGuardProse=5
    prose of the repository's own guards and tests: assert-grant-permission-enum.mjs and its fixture's expected violation ("untested surface"), assert-unit-test-coverage.mjs ("every declaration ... is unverified"), the a11y smoke spec ("an untested claim") and fetchJwksLeakSafe.test.ts ("merely going untested"). Not a statement about a deployed system
C02_CLASS_DatedObservationsRow=2
    infra/bootstrap/README.md l.1208 (2026-11-16, "Assuming the roles ... not yet observed", seen in the next rows: l.1209 run 44042442257 assumed the deploy role, l.1212 run 44104573552 the plan role) and l.1210 (2026-11-17, "A branch subject's refusal by either role is not yet observed", seen in l.1211: run 44088753527's wrong-subject job, success). Dated rows are the evidence record and were not edited
C02_UNCLASSIFIED=0

### Every hit and its class

- `.github/trufflehog-exclude-paths.txt:11` — TrufflehogResultClass
- `.github/trufflehog-exclude-paths.txt:26` — TrufflehogResultClass
- `.github/trufflehog-openvaa.yml:19` — TrufflehogResultClass
- `.github/trufflehog-openvaa.yml:20` — TrufflehogResultClass
- `.github/trufflehog-openvaa.yml:26` — TrufflehogResultClass
- `.github/workflows/main.yaml:115` — TrufflehogResultClass
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts:361` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:4` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:747` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:753` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:754` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:763` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:764` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:769` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:783` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:796` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:4` — UnverifiedAnswers
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:909` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:183` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:191` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:200` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:366` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:368` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:370` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:373` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/dataWriter.type.ts:377` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/universalDataWriter.ts:33` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/universalDataWriter.ts:43` — UnverifiedAnswers
- `apps/frontend/src/lib/api/base/universalDataWriter.ts:45` — UnverifiedAnswers
- `apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts:133` — RepositoryGuardProse
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:4` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:101` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:268` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:274` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:275` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:277` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:291` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:326` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:328` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:329` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:1514` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:1517` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:2` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:432` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:436` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:437` — UnverifiedAnswers
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:471` — UnverifiedAnswers
- `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts:26` — AuthUnverifiedSession
- `apps/frontend/src/lib/supabase/safeGetSession.ts:29` — AuthUnverifiedSession
- `apps/frontend/src/routes/admin/+layout.server.ts:16` — AuthUnverifiedSession
- `apps/frontend/src/routes/admin/layout.server.test.ts:38` — AuthUnverifiedSession
- `apps/frontend/src/routes/admin/password-reset/page.server.test.ts:25` — AuthUnverifiedSession
- `apps/frontend/src/routes/auth/confirm/+page.server.ts:8` — AuthUnverifiedSession
- `apps/frontend/src/routes/contestant/+layout.server.ts:16` — AuthUnverifiedSession
- `apps/frontend/src/routes/contestant/password-reset/page.server.test.ts:25` — AuthUnverifiedSession
- `infra/bootstrap/README.md:1208` — DatedObservationsRow
- `infra/bootstrap/README.md:1210` — DatedObservationsRow
- `infra/envs/staging/supabase/README.md:1671` — ProbeCheckName
- `infra/envs/staging/supabase/README.md:1955` — ProbeCheckName
- `infra/envs/staging/supabase/README.md:1958` — ProbeCheckName
- `infra/envs/staging/supabase/README.md:1986` — ProbeCheckName
- `infra/scripts/probe-hosted.mjs:75` — ProbeCheckName
- `infra/scripts/probe-hosted.mjs:80` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:280` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:681` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:934` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:939` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:940` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:943` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:945` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:946` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:949` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:951` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:952` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:955` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:957` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:958` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:1474` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:1475` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:1476` — ProbeCheckName
- `infra/scripts/probe-hosted.test.ts:1477` — ProbeCheckName
- `infra/scripts/probe/checks.mjs:474` — ProbeCheckName
- `infra/scripts/probe/sources.mjs:550` — ProbeCheckName
- `infra/scripts/probe/sources.mjs:584` — ProbeCheckName
- `infra/scripts/probe/sources.mjs:592` — ProbeCheckName
- `packages/dev-seed/tests/ciSecretScanFlags.test.ts:6` — TrufflehogResultClass
- `packages/dev-seed/tests/ciSecretScanFlags.test.ts:8` — TrufflehogResultClass
- `packages/dev-seed/tests/ciSecretScanFlags.test.ts:45` — TrufflehogResultClass
- `scripts/assert-grant-permission-enum.mjs:210` — RepositoryGuardProse
- `scripts/assert-unit-test-coverage.mjs:709` — RepositoryGuardProse
- `scripts/fixtures/grant-permission-enum/expected.violations:6` — RepositoryGuardProse
- `tests/tests/specs/a11y/a11y-smoke.spec.ts:134` — RepositoryGuardProse

### The search's full output

```text
.github/trufflehog-exclude-paths.txt:11:#   2x URI (unverified) -> tests/tests/utils/mailedLink.test.ts and
.github/trufflehog-exclude-paths.txt:26:# On the two test files: run 43405262494 (2026-11-13) reported two unverified URI findings,
.github/trufflehog-openvaa.yml:19:# from this detector is classified `unverified`. The trufflehog CLI's DEFAULT
.github/trufflehog-openvaa.yml:20:# result set is `verified,unverified,unknown` -- `--results` defaults to the
.github/trufflehog-openvaa.yml:26:# `notifyUnverifiedResults = false` and drops exactly this detector's findings
.github/workflows/main.yaml:115:          # No `--results`, no `--only-verified`: both drop unverified findings, which is the only class the
apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts:361:    it('surfaces a malformed payload as a typed failure and reports it once, rather than claiming an unverified success', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:4:import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:747:    it('returns the unverified signal when the read-back is malformed, and reports it exactly once', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:753:      // NOT `{}`: an unverified write and an entity with no answers are different facts and must not be the same value.
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:754:      expect(result).toBe(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:763:    it('returns the unverified signal when the read-back is genuinely absent', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:764:      // An absent read-back leaves the write exactly as unverified as a malformed one, so it resolves to the same signal. Absence is not a parse failure, so no record is emitted for it.
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:769:      expect(result).toBe(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:783:      expect(result).toBe(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:796:    it('still throws on an RPC error — a failed write is not an unverified one', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:4:import { UniversalDataWriter, UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:909:    return UNVERIFIED_ANSWERS;
apps/frontend/src/lib/api/base/dataWriter.type.ts:183:  // Setting data owned by the user NB. The answer setters (`updateAnswers`/`overwriteAnswers`) return only the updated `LocalizedAnswers` map for synchronization — or {@link UNVERIFIED_ANSWERS}, when the write succeeded but its read-back could not be validated — while the property setter (`updateEntityProperties`) returns the properties it wrote and no others, or says that a changed name was refused, and the nominations setter (`setEntityNominations`) returns the counts of what it stored, or says which of four named refusals it met.
apps/frontend/src/lib/api/base/dataWriter.type.ts:191:   * @returns A `Promise` resolving the updated `LocalizedAnswers` for the entity, or {@link UNVERIFIED_ANSWERS} when the write succeeded but its read-back could not be validated, or a `Response` containing either.
apps/frontend/src/lib/api/base/dataWriter.type.ts:200:   * @returns A `Promise` resolving the updated `LocalizedAnswers` for the entity, or {@link UNVERIFIED_ANSWERS} when the write succeeded but its read-back could not be validated, or a `Response` containing either.
apps/frontend/src/lib/api/base/dataWriter.type.ts:366: * The write is not in doubt — the RPC returned without an error. What is in doubt is the state the adapter is about to report as the entity's new answers, and reporting an unverified state as a verified one is what let a malformed read-back clear a candidate's edit buffer (fact 5). This says "the write happened, its result is unknown" instead.
apps/frontend/src/lib/api/base/dataWriter.type.ts:368: * A STRING rather than an empty object or a branded record. `LocalizedAnswers` is an open record keyed by question id, so any object-shaped sentinel could in principle collide with a real question id — `{ unverified: true }` is indistinguishable from an entity that answered a question called `unverified`. A string can never be a `LocalizedAnswers`, so the union narrows unambiguously and no collision is expressible. It also survives the `devalue` serialization boundary, which a `Symbol` would not (the reason decision **B1** rejected symbol branding).
apps/frontend/src/lib/api/base/dataWriter.type.ts:370:export type UnverifiedAnswers = 'unverified-answers';
apps/frontend/src/lib/api/base/dataWriter.type.ts:373: * What the answer setters resolve to: the validated answers map, or {@link UnverifiedAnswers}.
apps/frontend/src/lib/api/base/dataWriter.type.ts:377:export type SetAnswersResult = LocalizedAnswers | UnverifiedAnswers;
apps/frontend/src/lib/api/base/universalDataWriter.ts:33:  UnverifiedAnswers,
apps/frontend/src/lib/api/base/universalDataWriter.ts:43: * Greppable by name on purpose: `grep -rn 'UNVERIFIED_ANSWERS'` enumerates every site that produces or consumes an unverified write, which a bare string literal would not.
apps/frontend/src/lib/api/base/universalDataWriter.ts:45:export const UNVERIFIED_ANSWERS: UnverifiedAnswers = 'unverified-answers';
apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts:133:    // There is deliberately no neighbour BELOW 200: the WHATWG `Response` constructor rejects a status under 200 with a RangeError, so a 1xx is not constructible here -- and `fetch` never surfaces an informational response as a status either, so the case does not exist at runtime rather than merely going untested.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:4:import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:101: *   `RETURNS jsonb` of just the answers — NOT a candidate), or `UNVERIFIED_ANSWERS`, which the real adapter returns when the write succeeded but its read-back could not be validated; the fake's declared return is widened to match, so a case cannot inject a shape the adapter cannot produce.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:268:   * The unverified-save path.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:274:  describe('unverified answers read-back', () => {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:275:    it('Test 5: resolves a failure and preserves BOTH edit buffers when the writer reports an unverified write', async () => {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:277:      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:291:      // The exit is ahead of the property write too, so an unverified answers save does not half-commit.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:326:    it('Test 8: a save that does not touch answers is unaffected by the unverified path', async () => {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:328:      // Even with the writer primed to report an unverified answers write, a properties-only save never calls it.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:329:      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:1514:    it('resolves a failure before any property write when the answers write is unverified, and keeps everything', async () => {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:1517:      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:2:import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:432:      // Guards the nullish answer and the unverified signal the writer returns when the write succeeded but its read-back could not be validated.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:436:      // The exit is positioned BEFORE the merge and before the resets below, and that position is the whole point: `resetAnswers()` on the strength of an unverified read-back would discard the editor's typing. Keeping the buffer is recoverable, clearing it is not.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:437:      if (!updatedAnswers || updatedAnswers === UNVERIFIED_ANSWERS) return { type: 'failure' };
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:471:    // Reset only after a save that neither failed nor threw. BOTH resets are skipped on the unverified-answers path above — not just the answers one — because an unverified save leaves the property edits equally unconfirmed.
apps/frontend/src/lib/server/admin/requireAdminIdentity.ts:26: * Eight call sites reach it — the six `/api/admin/jobs/**` endpoints through `requireVerifiedAdmin`, and the two admin form actions through `requireAdminAction` — and the gate is only honest while all eight agree. Eight transcriptions of a two-step check are eight chances to keep one of the steps, which is exactly what happened before: the six endpoints tested a role off an unverified token while the two form actions verified a session and tested no role at all, so each family held one half of the check and neither held both.
apps/frontend/src/lib/supabase/safeGetSession.ts:29: * `getUser()` takes no token, so auth-js holds its storage lock, stops warning about the session's unverified user and removes a revoked session. Called that way it verifies the token storage holds at that moment, and refreshes a token inside the expiry margin first. So the session is read again after the verification, and a user is paired only with a token storage held both before and after it. When a refresh replaced the token, the call verifies the new session instead.
apps/frontend/src/routes/admin/+layout.server.ts:16: * `locals.safeGetSession()` returns two things: the session, and a user it verified separately with `getUser()`. The session's OWN nested user is wrapped in an insecure-use proxy by the auth library precisely because it is unverified. The verified one is already in scope in the same destructuring, so preferring it costs nothing and removes a warning-shaped footgun.
apps/frontend/src/routes/admin/layout.server.test.ts:38:    // The session's OWN nested user. `@supabase/ssr` wraps this in an insecure-use proxy because it is unverified; the projection must not read its id.
apps/frontend/src/routes/admin/password-reset/page.server.test.ts:25:  user: { id: 'user-1', email: 'unverified@example.test' }
apps/frontend/src/routes/auth/confirm/+page.server.ts:8: * The load also says whether the browser is signed in. A verified session makes the page say that continuing signs that account out, and offer Cancel, which leads to that account's app: the Admin App's home when the session's grants in this project open the Admin App and none opens the Contestant App (`isAdminOnlyInProject`), the Contestant App's home otherwise, a read of those grants that fails included. The page cannot name the account the link is for, because its token is unverified until the post, so nothing of either account is answered: no part of the session leaves the server, only whether there is one and where Cancel leads.
apps/frontend/src/routes/contestant/+layout.server.ts:16: * `locals.safeGetSession()` returns two things: the session, and a user it verified separately with `getUser()`. The session's OWN nested user is wrapped in an insecure-use proxy by the auth library precisely because it is unverified. The verified one is already in scope in the same destructuring, so preferring it costs nothing and removes a warning-shaped footgun.
apps/frontend/src/routes/contestant/password-reset/page.server.test.ts:25:  user: { id: 'user-1', email: 'unverified@example.test' }
infra/bootstrap/README.md:1208:| 2026-11-16 | Step 9, item 6: the plan role holds `ReadOnlyAccess` and `openvaa-plan-deny`, the deploy role the eleven policies of the step, both trusts `StringEquals` conditions on `aud`, the subject (`pull_request` for the plan role, the `staging` and `staging-destroy` environments for the deploy role), `repository_id` and `repository_owner_id`; the state bucket read back `AES256`, versioned and with all four public-access blocks, and both inventory asserts exited 0. Assuming the roles and AWS's evaluation of the two id claims are not yet observed.                                                                                                                    |
infra/bootstrap/README.md:1210:| 2026-11-17 | Infrastructure plan run 44042442267, on the same push: the `wrong-subject` job ended `failure` before either STS call. Its step runs under the runner's default `bash -e`, and `IFS=. read -r _ payload _ < "$token_file"` returns 1 at the end of a token file with no trailing newline, which ended the step at once, with no line printed (reproduced locally). A branch subject's refusal by either role is not yet observed.                                                                                                                                                                                                                                                 |
infra/envs/staging/supabase/README.md:1671:The two calls of `functions.identity-callback-unverified` carry no key at all, neither `apikey` nor
infra/envs/staging/supabase/README.md:1955:| 2026-11-11    | In the same state, `functions.identity-callback-unverified` passed: `identity-callback`, listed by the Management API with `verify_jwt` true after a `PATCH` of its metadata (status 200, version unchanged), answered the probe's two calls without `Authorization`, made with the publishable key in `apikey`, with its own 405 and 500. Whether the gateway admits a publishable key without `Authorization`, or the `PATCH` does not reach the gateway, has not been told apart.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
infra/envs/staging/supabase/README.md:1958:| 2026-11-11    | With every fault of the batched break still planted, the conformance probe, its `identity-callback` calls now made with no `apikey` and no `Authorization`, failed `functions.identity-callback-unverified`: the gateway answered 401 to the `GET` (expected the function's 405) and to the `POST {}` (expected its 500). With the red run before it, every check of the probe has been seen failing by its own planted fault on the throwaway. `db.postgres-major` passed in this run, which had no expectation override.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
infra/envs/staging/supabase/README.md:1986:| 2026-11-20    | At a read-only sitting the operator approved, the first probe run after the function deploy of 2026-11-19, the conformance probe (Step 23) passed every check on the persistent project: status 0, twenty-two `PASS` lines, no `FAIL` and no `COULD NOT RUN`, with the publishable key, the catalog role `postgres` through the session pooler (Step 15 item 2) and no service-role key. Among them `functions.verify-jwt` and `functions.identity-callback-unverified` passed, so the hosted `identity-callback` was deployed with `verify_jwt` as configured and, called with no key, answered 400 to a GET and 401 to a POST of an empty object. Its note again named the legacy keys enabled. The lines are in `189-05-staging-reads.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
infra/scripts/probe-hosted.mjs:75: *   functions.identity-callback-unverified
infra/scripts/probe-hosted.mjs:80: *                           unverified caller is refused with a fixed body and no detail.
infra/scripts/probe-hosted.test.ts:280:  { check: 'functions.identity-callback-unverified', marker: 'answered 401' },
infra/scripts/probe-hosted.test.ts:681:      'functions.identity-callback-unverified',
infra/scripts/probe-hosted.test.ts:934:  it('fails only functions.identity-callback-unverified when both calls answer 401', () => {
infra/scripts/probe-hosted.test.ts:939:    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
infra/scripts/probe-hosted.test.ts:940:    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('answered 401');
infra/scripts/probe-hosted.test.ts:943:  it('fails functions.identity-callback-unverified when the empty POST is not refused with the fixed body', () => {
infra/scripts/probe-hosted.test.ts:945:    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
infra/scripts/probe-hosted.test.ts:946:    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('400');
infra/scripts/probe-hosted.test.ts:949:  it('fails functions.identity-callback-unverified when the empty POST is answered with a detail-bearing 500', () => {
infra/scripts/probe-hosted.test.ts:951:    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
infra/scripts/probe-hosted.test.ts:952:    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('expected 401');
infra/scripts/probe-hosted.test.ts:955:  it('fails functions.identity-callback-unverified when the GET is answered 405 rather than with its bad_request result', () => {
infra/scripts/probe-hosted.test.ts:957:    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
infra/scripts/probe-hosted.test.ts:958:    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('expected 400');
infra/scripts/probe-hosted.test.ts:1474:    const unverified = stub.log.filter((r) => r.url === `${PROJECT_PREFIX}/functions/v1/identity-callback`);
infra/scripts/probe-hosted.test.ts:1475:    expect(unverified.map((r) => r.method).sort()).toEqual(['GET', 'POST']);
infra/scripts/probe-hosted.test.ts:1476:    expect(unverified.every((r) => r.authorization === undefined && r.apikey === undefined)).toBe(true);
infra/scripts/probe-hosted.test.ts:1477:    expect(unverified.find((r) => r.method === 'POST')?.body).toBe('{}');
infra/scripts/probe/checks.mjs:474:    name: 'functions.identity-callback-unverified',
infra/scripts/probe/sources.mjs:550:      const unverified = { Accept: 'application/json' };
infra/scripts/probe/sources.mjs:584:        { method: 'GET', endpoint: '/functions/v1/identity-callback', headers: unverified },
infra/scripts/probe/sources.mjs:592:          headers: { ...unverified, ...json },
packages/dev-seed/tests/ciSecretScanFlags.test.ts:6: * The `secret-scan` job runs trufflehog with exactly one argument, `--config=.github/trufflehog-openvaa.yml`, and carries a long comment saying that a result-type filter must never be added. A comment is not enough here, because the flag that would silence this gate is the tool's own most-copied documentation line: trufflehog's README GitHub Action example passes a `--results=verified,unknown` filter. That configuration sets `notifyUnverifiedResults = false` (pkg/engine/engine.go:327-341), and the repo-private `OpenVAACIEvidenceToken` detector deliberately carries no `verify:` block, so every finding it can ever produce is classified `unverified`. Pasting the README line therefore does not narrow the gate -- it turns the gate off for our own detector, and the build goes green while the scanner saw the secret. That is a silent green, the worst failure shape a gate has, and it is one search-and-paste away at all times.
packages/dev-seed/tests/ciSecretScanFlags.test.ts:8: * The CLI's DEFAULT result set is `verified,unverified,unknown`: the results flag defaults to the empty string (main.go:62), `parseResults` returns nil for empty input (main.go:1281-1284), and the engine then sets all three notify flags unconditionally (pkg/engine/engine.go:393-395). So the correct configuration is to pass no filter at all, and this file asserts that absence.
packages/dev-seed/tests/ciSecretScanFlags.test.ts:45: * Every spelling that drops unverified findings. The hidden one is still parsed (main.go:61), so it is still a live way to silence this gate.
scripts/assert-grant-permission-enum.mjs:210:          'equivalent, so a third level is untested surface in a security enum rather than a capability ' +
scripts/assert-unit-test-coverage.mjs:709:        'running, every declaration in the tree is unverified, which is the failure this guard ' +
scripts/fixtures/grant-permission-enum/expected.violations:6:grant_role_type: D-02 prohibition — the schema declaration carries a third role level 'owner'. The brief section 8.1(a) ruled two levels, admin and editor: the eight user types span only those, editor management is project.manage_editors with entity.invite_children as its entity-scope equivalent, so a third level is untested surface in a security enum rather than a capability anything grants.
tests/tests/specs/a11y/a11y-smoke.spec.ts:134:    // Scanned in BOTH themes, like every other entry. This drawer had been measured at 0 violations in light and dark; the `-dark` twin now holds that in CI rather than leaving it as an untested claim — and it confirms it, with the drawer opened and every filter row expanded in a dark context.
```

## The supplementary search (research open question 4)

C02S_ADOPTED=yes (addition to C-02, research open question 4)
    the locked pattern misses statements marked unobserved in other words ("untried", "has not been observed", "not measured"); this search is recorded beside it, not in its place
C02S_COMMAND=git grep -n -i -E 'untried|not been (observed|seen|measured|tried)|not (yet )?(observed|measured)|unobserved|unmeasured' -- infra apps/supabase/supabase/functions apps/supabase/supabase/config.toml apps/supabase/README.md .github apps/docs/src/routes docker-compose.dev.yml .env.example ':!*.test.ts'
C02S_HEAD=f222fc457d4c0626991dc71590bd8a5e06b80350
C02S_EXIT=0
C02S_HITS=3
C02S_CLASS_DatedObservationsRow=3
    infra/bootstrap/README.md l.1208 and l.1210 (the same two rows as the locked search, each seen in a later row) and infra/envs/staging/supabase/README.md l.1962 (2026-11-11: "That the dashboard delete dropped them is likely but has not been measured on its own", a cause the row leaves open; the policies' restoration is in the same row and in l.1963). The research's S21-S27 hits (four module comments and three lines of the authentication page) are gone: plans 189-12 to 189-16 rewrote them
C02S_UNCLASSIFIED=0

```text
infra/bootstrap/README.md:1208:| 2026-11-16 | Step 9, item 6: the plan role holds `ReadOnlyAccess` and `openvaa-plan-deny`, the deploy role the eleven policies of the step, both trusts `StringEquals` conditions on `aud`, the subject (`pull_request` for the plan role, the `staging` and `staging-destroy` environments for the deploy role), `repository_id` and `repository_owner_id`; the state bucket read back `AES256`, versioned and with all four public-access blocks, and both inventory asserts exited 0. Assuming the roles and AWS's evaluation of the two id claims are not yet observed.                                                                                                                    |
infra/bootstrap/README.md:1210:| 2026-11-17 | Infrastructure plan run 44042442267, on the same push: the `wrong-subject` job ended `failure` before either STS call. Its step runs under the runner's default `bash -e`, and `IFS=. read -r _ payload _ < "$token_file"` returns 1 at the end of a token file with no trailing newline, which ended the step at once, with no line printed (reproduced locally). A branch subject's refusal by either role is not yet observed.                                                                                                                                                                                                                                                 |
infra/envs/staging/supabase/README.md:1962:| 2026-11-11    | After the `private-assets` bucket had been deleted in the dashboard and its row inserted again with the migration's values, the drift check found `SCHEMA DRIFT`: the seven policies on `storage.objects` that name the bucket were missing, while the conformance probe passed. That the dashboard delete dropped them is likely but has not been measured on its own. Running the migration's seven `CREATE POLICY` statements in one transaction made the drift check clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
```

## The docs and infra surfaces, outside test and script files (DOCS-03)

DOCS_INFRA_COMMAND=git grep -n -i -E 'unverified|not yet observed|untested|untried|not been (observed|seen|measured|tried)|not (yet )?(observed|measured)|unobserved' -- apps/docs infra ':!*.test.ts' ':!*.mjs'
DOCS_INFRA_HITS=7
    every one a dated Observations row (`| 20NN-`) or a line naming the probe check `functions.identity-callback-unverified`; the same output filtered by `grep -v -E '^[^:]+:[0-9]+:\| 20[0-9]{2}-|identity-callback-unverified'` printed nothing (exit 1)
DOCS_INFRA_OTHER=0

```text
infra/bootstrap/README.md:1208 (dated row, 2026-11-16)
infra/bootstrap/README.md:1210 (dated row, 2026-11-17)
infra/envs/staging/supabase/README.md:1671 (the probe check's name, Step 23)
infra/envs/staging/supabase/README.md:1955 (dated row, 2026-11-11, the probe check)
infra/envs/staging/supabase/README.md:1958 (dated row, 2026-11-11, the probe check)
infra/envs/staging/supabase/README.md:1962 (dated row, 2026-11-11)
infra/envs/staging/supabase/README.md:1986 (dated row, 2026-11-20, the probe check)
```

## The closing greps

NO_CONSENT_GREP_HITS=0
    git grep -n -i -E "(no|not) consent (is )?(required|needed)|consent is not (required|needed)|does not (require|need) consent" -- apps/docs: no output, exit 1
RENDER_GREP_FILES=apps/docs/src/routes/+page.svelte scripts/fixtures/assert-test-keys-scope.input.txt
    git grep -n -E 'render\.example|render\.com|\bRender\b|fromGroup|envVarGroups|onrender|render\.yaml|Blueprint' -- ':!.planning' (189-01's command), exit 0, two lines: apps/docs/src/routes/+page.svelte:228 (the docs home's demo link, `onrender.com`) and scripts/fixtures/assert-test-keys-scope.input.txt:23 (`# @as render.example.yaml`, the fixture's path label). On this host `\b` in `git grep -E` matches nothing, so the same pattern was run with `-P` too: 34 lines, of which 32 are the English verb "Render" opening a TSDoc or comment in apps/, packages/ and the generated component pages, one is the vendored .yarn/releases/yarn-4.18.1.cjs, and the two above; with the verb excluded (`\bRender\b(?! (a|an|the|one|tree|DAG|links|nodes|input|output|comments|argument|templates|this|`))`, ':!.yarn'), `-P` prints the same two lines
FRONTEND_URL_HITS=0
    git grep -n FRONTEND_URL -- ':!.planning': no output, exit 1
UNOBSERVED_SECTIONS=0
    git grep -n -i -E '^#+ .*not yet observed' -- infra/README.md infra/bootstrap/README.md infra/envs/staging/aws/README.md infra/envs/staging/dns-mail/README.md infra/envs/staging/supabase/README.md: no output, exit 1
CLOSED_TODOS=6
    each under .planning/todos/completed/ with `status: completed` and `## Closed (phase 189)`, and none left under .planning/todos/pending/:
    2026-08-31-evaluate-self-hosted-posthog-log-sink.md
    2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md
    2026-09-02-deployment-guide-production-redirect-allowlist.md
    2026-09-18-document-supabase-api-limits-for-deployments.md
    2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md
    2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md
CALLER_LIMIT_TODO=.planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md
    the seventh absorbed todo, closed in phase 188: `completed: 2026-11-19`, `status: completed`, `## Closed (phase 188), 2026-11-19`
