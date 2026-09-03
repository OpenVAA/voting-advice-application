import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataWriter, UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
// Imported from the module rather than the `$lib/auth` barrel on purpose: the barrel also re-exports `getUserData`, which reaches `$lib/api/dataWriter` and back to this file.
import { ADMIN_ROLES, CANDIDATE_ROLES, hasAnyRole } from '$lib/auth/roles';
import { buildRoute, ROUTE } from '$lib/routes';
import { constants } from '$lib/utils/constants';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import { answersOf, imageOf, parseAnswersColumn, parseImageColumn } from '../utils/parseJsonbColumn';
import { toDataObject } from '../utils/toDataObject';
import type { Enums, Json } from '@openvaa/supabase-types';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  BasicUserData,
  CandidateUserData,
  CheckRegistrationData,
  DWReturnType,
  GetCandidateUserDataOptions,
  LocalizedCandidateData,
  SetAnswersOptions,
  SetAnswersResult,
  SetPropertiesOptions
} from '$lib/api/base/dataWriter.type';
import type { SupabaseAdapterConfig } from '../supabaseAdapter.type';

/**
 * The file extensions a candidate upload may end up carrying in its Storage object path.
 *
 * ## Why a whitelist rather than the uploader's own suffix
 *
 * The path used to be built as `` `${projectId}/candidates/${id}/${crypto.randomUUID()}.${file.name.split('.').pop() ?? 'jpg'}` ``, and `file.name` is fully controlled by the uploading candidate. `split('.').pop()` cannot yield a `..` segment — the result contains no dot by construction — so classic traversal was blocked, but it CAN contain a `/`: a file named `a.b/c/d` yields `"/d"` and a path of `…/<uuid>./d`, letting the uploader place objects at chosen sub-paths inside the prefix. It can also be arbitrarily long, or carry control characters, `%`, `?`, `#` or non-ASCII, any of which can confuse a Storage RLS policy or a later parser written against the expected `<project>/candidates/<id>/<uuid>.<ext>` shape. The extension is additionally copied verbatim into the stored `{ path }`, which `parseImageColumn`/`storageUrl` later turn into a public URL.
 *
 * Deriving the extension from a fixed set makes the produced path a member of a small, known language regardless of what was uploaded.
 */
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

/**
 * Supabase implementation of the DataWriter.
 * Auth methods use Supabase GoTrue via `this.supabase.auth`.
 * Cookie-based sessions are used -- the Supabase client attaches the session JWT automatically.
 */
export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter) {
  /**
   * @param config - This request's own client, its `fetch` and the locales it extracts JSONB in.
   *
   * Declared explicitly rather than inherited: the mixin's construct signature erases its parameter types, so without this signature an adapter built from any argument at all would typecheck.
   */
  constructor(config: SupabaseAdapterConfig) {
    super(config);
  }

  ////////////////////////////////////////////////////////////////////
  // AUTH METHODS
  ////////////////////////////////////////////////////////////////////

  protected async _login({ username, password }: { username: string; password: string }) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email: username,
      password
    });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _logout() {
    // In the browser, call the server-side logout endpoint to clear httpOnly cookies.
    // Client-side signOut alone cannot remove httpOnly cookies set by createServerClient.
    if (typeof window !== 'undefined') {
      // reason: the endpoint is named by route key, never assembled from the current URL. The earlier implementation read the locale off `window.location.pathname`, which returns 'candidate' for an unprefixed candidate route and produced a doubled path; a constant cannot go wrong that way. The endpoint clears cookies and returns json, so it carries no locale prefix.
      await fetch(ROUTE.CandAppAuthLogout, { method: 'POST' });
    }
    const { error } = await this.supabase.auth.signOut({ scope: 'local' });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  /**
   * Override the public `logout` to skip UniversalDataWriter's dual POST+backendLogout pattern.
   * Supabase handles everything via `signOut` -- no separate client-side POST is needed.
   */
  async logout(): DWReturnType<DataApiActionResult> {
    return this._logout();
  }

  protected async _requestForgotPasswordEmail({ email }: { email: string }) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      // The mail link has to come back to THIS origin, and it has to carry the reader's locale so the page they land on speaks the language they asked in. The builder names the endpoint by route key and hands the result to Paraglide, which prefixes every non-base locale and leaves the base one unprefixed; the auth service's redirect allowlist admits both forms. Sending an unprefixed URL, as this did before, sent every non-base-locale reader to a base-locale page.
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}${buildRoute('CandAppAuthCallback')}`
    });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _resetPassword({ password }: { password: string; code: string }) {
    // Called after recovery session is established via auth callback.
    // The `code` param is unused; Supabase uses the recovery session.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _setPassword({ password }: { password: string }) {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    // Future-reference note. `auth.updateUser({ password })` rotates the access token. The browser-side `createBrowserClient` instance is expected to adopt the new token via its internal storage listener, but under some Playwright timings the next PostgREST call from `SupabaseDataWriter` was observed to send a stale/empty JWT, producing `auth.uid() = NULL` and a 406 "Cannot coerce" on the subsequent ToU UPDATE (RLS denies, 0 rows returned).
    // A targeted `await this.supabase.auth.refreshSession()` here would force the in-memory client to re-read the freshly-issued session before the caller proceeds, which should harmlessly close that race. It is deliberately NOT added, for two measured reasons:
    //  (a) the live failure did not reproduce under 20× repeat-each once the user-visible error surface was in place — only Inbucket polling flake remained;
    //  (b) `refreshSession()` issues an extra network round-trip on every password set/reset, and rare edge cases (e.g. expired refresh token, network partition) could turn a working setPassword into a thrown error.
    // If the 406 reappears, add `await this.supabase.auth.refreshSession()` here (and mirror in `_resetPassword` / `_register` above) and re-verify.
    return { type: 'success' as const };
  }

  ////////////////////////////////////////////////////////////////////
  // REGISTRATION METHODS
  ////////////////////////////////////////////////////////////////////

  protected async _preregister({
    body
  }: {
    body: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      nominations: Array<{ electionId: string; constituencyId: string }>;
    };
  }): DWReturnType<DataApiActionResult> {
    // Resolve projectId from the first nomination's electionId
    const { data: election, error: electionError } = await this.supabase
      .from('elections')
      .select('project_id')
      .eq('id', body.nominations[0].electionId)
      .single();
    if (electionError || !election)
      throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

    // identifier is intentionally ignored -- Supabase uses email-based invite, not personal ID.
    const { error } = await this.supabase.functions.invoke('invite-candidate', {
      body: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        projectId: election.project_id
      }
    });

    if (error) throw new Error(`invite-candidate: ${error.message}`);
    return { type: 'success' as const };
  }

  protected async _checkRegistrationKey(_opts: { registrationKey: string }): DWReturnType<CheckRegistrationData> {
    // Supabase uses invite-based registration, not registration keys.
    // This method satisfies the abstract contract but is not used.
    throw new Error('checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.');
  }

  protected async _register({ password }: { password: string }) {
    // Invite session already established by auth callback's verifyOtp.
    // Just set the password to complete registration.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  ////////////////////////////////////////////////////////////////////
  // USER DATA METHODS
  ////////////////////////////////////////////////////////////////////

  protected async _getBasicUserData(): DWReturnType<BasicUserData> {
    // THE VERIFYING ROUND-TRIP, AND IT COMES FIRST. `getSession()` alone reads the session straight out of the configured storage — the request's `sb-*` cookies — and checks only its SELF-REPORTED `expires_at`; `@supabase/auth-js` wraps the `user` it returns in an insecure-use proxy for exactly that reason. Nothing on that path checks a signature, so the `user_roles` claim decoded below is attacker-suppliable unless the token it is decoded from has been verified first. `getUser()` is that check: it sends the stored access token to Supabase Auth, which validates it, so a session that survives this call is one whose access token is genuine.
    //
    // The ORDER — verify, then read — is the same one `hooks.server.ts`'s `safeGetSession` uses, and it is what lets `requireVerifiedAdmin` gate the six `/api/admin/jobs/**` endpoints on a role rather than on a claim. `user` is taken from HERE rather than from `session.user` so the returned identity is the verified one and never the proxy.
    const {
      data: { user },
      error: userError
    } = await this.supabase.auth.getUser();
    if (userError || !user) throw new Error('No active session');

    const {
      data: { session },
      error
    } = await this.supabase.auth.getSession();
    if (error || !session) throw new Error('No active session');

    // Decode the VERIFIED access token to extract the `user_roles` custom claim. The decode is a read of a token the line above proved genuine, not a substitute for checking it.
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const userRoles: Array<{
      role: Enums<'user_role_type'>;
      scope_type: Enums<'role_scope_type'>;
      scope_id: string;
    }> = payload.user_roles ?? [];

    // Determine role from JWT claims, against the ONE declaration of each role set. Both sets used to be inlined here as a third copy of the arrays the two login gates carried, which is how a role added to one gate silently fails to reach the other.
    let role: 'candidate' | 'admin' | null = null;
    if (hasAnyRole(userRoles, CANDIDATE_ROLES)) {
      role = 'candidate';
    } else if (hasAnyRole(userRoles, ADMIN_ROLES)) {
      role = 'admin';
    }

    // Language from user_metadata or default
    const language = (user.user_metadata?.language as string) ?? 'en';

    return {
      id: user.id,
      email: user.email ?? '',
      username: user.email ?? '',
      role,
      settings: { language }
    };
  }

  protected async _getCandidateUserData<TNominations extends boolean | undefined>({
    loadNominations,
    locale
  }: GetCandidateUserDataOptions<TNominations>): DWReturnType<CandidateUserData<TNominations>> {
    // Get basic user data first
    const user = await this._getBasicUserData();

    // Get candidate entity data via RPC
    const { data: entityRow, error } = await this.supabase
      .rpc('get_candidate_user_data', { p_entity_type: 'candidate' })
      .single();
    if (error || !entityRow) throw new Error(`Failed to load candidate data: ${error?.message ?? 'no data'}`);

    // Transform row to LocalizedCandidateData using established utilities
    const defaultLocale = 'en';
    const effectiveLocale = locale ?? defaultLocale;
    const mapped = toDataObject(entityRow as Record<string, unknown>, effectiveLocale, defaultLocale);

    const candidate: LocalizedCandidateData = {
      ...mapped,
      type: ENTITY_TYPE.Candidate,
      id: entityRow.id,
      // 157.1-04 D-DISC-3: the candidate reading their OWN stored answers collapses malformed to empty here, deliberately. Research flagged this as the same severity class as the post-RPC read-back below and instructed the planner to name the choice rather than silently widen scope: it is a CALL site, not one of the six PARSE sites the phase scoped, and branching it on `.status` would be a UI decision with no ruling behind it. What made the collapse acceptable is that partial preserve (A2) now keeps the good question ids instead of wiping the blob over one bad answer, and the degradation is reported at `error` (C5(b)) rather than `warn`.
      answers:
        answersOf(parseAnswersColumn(entityRow.answers, { column: 'candidates.answers', id: entityRow.id })) ?? {},
      termsOfUseAccepted: entityRow.terms_of_use_accepted ?? null,
      image: imageOf(
        parseImageColumn(entityRow.image, constants.PUBLIC_SUPABASE_URL, {
          column: 'candidates.image',
          id: entityRow.id
        })
      )
    } as LocalizedCandidateData;

    // Load nominations if requested
    let nominations: CandidateUserData<TNominations>['nominations'];
    if (loadNominations) {
      const { data: nomData, error: nomError } = await this.supabase
        .from('nominations')
        .select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id')
        .eq('candidate_id', entityRow.id);

      if (nomError) throw new Error(`Failed to load nominations: ${nomError.message}`);

      const nominationsList = (nomData ?? []).map((n) => ({
        // `entityType` + `entityId` are part of the NominationData shape. These raw partial nominations are surfaced on `userData` (consumed directly by the candidate profile page) and are intentionally NOT fed to DataRoot.provideNominationData — they carry no entity graph, so doing so throws `No matching entity found for nomination`.
        entityType: ENTITY_TYPE.Candidate,
        entityId: candidate.id,
        electionId: n.election_id,
        constituencyId: n.constituency_id,
        electionRound: n.election_round ?? 1,
        electionSymbol: n.election_symbol ?? '',
        id: n.id
      }));

      nominations = {
        nominations: nominationsList,
        entities: {}
      } as CandidateUserData<TNominations>['nominations'];
    } else {
      nominations = undefined as CandidateUserData<TNominations>['nominations'];
    }

    return { user, candidate, nominations } as CandidateUserData<TNominations>;
  }

  ////////////////////////////////////////////////////////////////////
  // ANSWER/PROPERTY METHODS
  ////////////////////////////////////////////////////////////////////

  /**
   * Resolve the project a candidate belongs to, which is the first segment of every Storage object path this adapter writes.
   * @param id - The candidate's id.
   * @returns The candidate's `project_id`.
   */
  async #resolveProjectId(id: string): Promise<string> {
    const { data: candidateRow, error } = await this.supabase
      .from('candidates')
      .select('project_id')
      .eq('id', id)
      .single();
    if (error || !candidateRow)
      throw new Error(`Failed to fetch candidate project_id: ${error?.message ?? 'not found'}`);
    return candidateRow.project_id;
  }

  /**
   * Upload one candidate-supplied file to the `public-assets` bucket and return the object path it was stored at.
   *
   * ONE helper for BOTH upload sites. `_setAnswers` and `_updateEntityProperties` carried this block byte for byte, which is precisely how a path sanitizer applied to one copy would silently have left the other unsanitized. The extension is chosen from {@link ALLOWED_IMAGE_EXTENSIONS} rather than taken from the upload, so the returned path is always `<project>/candidates/<id>/<uuid>.<known-ext>` no matter what the candidate named their file.
   * @param options.projectId - The candidate's project, resolved by {@link SupabaseDataWriter.resolveProjectId}.
   * @param options.id - The candidate's id.
   * @param options.file - The uploaded file. Its `name` is attacker-controlled and is used only to CHOOSE from the whitelist.
   * @returns The Storage object path, safe to persist in an image column.
   */
  async #uploadCandidateFile({ projectId, id, file }: { projectId: string; id: string; file: File }): Promise<string> {
    const suffix = file.name.split('.').pop()?.toLowerCase() ?? '';
    const ext = ALLOWED_IMAGE_EXTENSIONS.has(suffix) ? suffix : 'jpg';
    const storagePath = `${projectId}/candidates/${id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await this.supabase.storage
      .from('public-assets')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    return storagePath;
  }

  protected async _setAnswers({
    target: { type, id },
    answers,
    overwrite
  }: SetAnswersOptions & { overwrite: boolean }): DWReturnType<SetAnswersResult> {
    if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);

    // Process answers: detect File objects and upload to Storage
    const processedAnswers: Record<string, unknown> = {};
    let projectId: string | null = null;

    for (const [questionId, answer] of Object.entries(answers)) {
      if (answer === null) {
        processedAnswers[questionId] = null;
        continue;
      }
      // Check if answer value contains a File object (SSR-safe guard)
      if (answer?.value != null && typeof File !== 'undefined' && answer.value instanceof File) {
        // Lazily fetch project_id for Storage path construction, once per call rather than once per file.
        projectId ??= await this.#resolveProjectId(id);
        const storagePath = await this.#uploadCandidateFile({ projectId, id, file: answer.value as File });
        // Replace File with StoredImage-compatible path object
        processedAnswers[questionId] = { ...answer, value: { path: storagePath } };
      } else {
        processedAnswers[questionId] = answer;
      }
    }

    // Call upsert_answers RPC
    const { data, error } = await this.supabase.rpc('upsert_answers', {
      p_entity_id: id,
      // reason: processedAnswers is jsonb-safe at runtime (File values already replaced with { path } in the loop above); LocalizedAnswer.value's static AnswerValue/File union can't be expressed as Json without a runtime transform.
      p_answers: processedAnswers as Json,
      p_overwrite: overwrite
    });
    if (error) throw new Error(`setAnswers: ${error.message}`);
    // The RPC hands back the whole answers blob it just wrote, which is the same unvalidated jsonb shape a read returns, so it is validated on the way back in rather than asserted.
    //
    // A status BRANCH, not a collapse (decision **B3**, requirement **D8**). The previous form coalesced the outcome's value to an empty object, turning a malformed read-back into an empty answers map — TRUTHY, and therefore indistinguishable from an entity that legitimately has no answers. Downstream that empty map passed the store's nullish guard, was merged, and then the candidate's edit buffer was cleared on the strength of it: the write had succeeded, but the state being reported as the entity's new answers was never verified (fact 5). Ledger row 4.
    //
    // `absent` joins `malformed` deliberately. From the caller's point of view they are the same fact — the adapter cannot confirm what was stored — and only `ok` licenses a caller to treat the write as verified. `answersOf` is NOT used here for that reason: this is one of the three sites that acts on `.status` rather than collapsing it.
    //
    // The `error` record naming the column, the row id and the issue paths is emitted inside `parseAnswersColumn`, so nothing is logged here; adding a second record would double-report one failure, and an interpolated one would break decision C4's NOTE 1.
    const readBack = parseAnswersColumn(data, { column: 'upsert_answers.result', id });
    if (readBack.status === 'ok') return readBack.value;
    return UNVERIFIED_ANSWERS;
  }

  protected async _updateEntityProperties({
    target: { id },
    properties: { termsOfUseAccepted, image }
  }: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    const updateFields: Record<string, unknown> = {};
    if (termsOfUseAccepted !== undefined) {
      updateFields.terms_of_use_accepted = termsOfUseAccepted;
    }

    // Handle image upload to Supabase Storage
    if (image !== undefined) {
      if (image === null) {
        updateFields.image = null;
      } else {
        const imageWithFile = image as ImageWithFile;
        if (imageWithFile.file && typeof File !== 'undefined' && imageWithFile.file instanceof File) {
          // Upload image file to Storage. The same two helpers `_setAnswers` uses: the block was byte-for-byte duplicated between the two methods, which is how a sanitizer applied to one copy would have missed the other.
          const projectId = await this.#resolveProjectId(id);
          updateFields.image = { path: await this.#uploadCandidateFile({ projectId, id, file: imageWithFile.file }) };
        } else if (image.url) {
          // Image already has a URL (no file to upload), keep as-is
          updateFields.image = image;
        }
      }
    }

    // NOTHING TO WRITE: READ THE STORED PROPERTIES BACK rather than fabricating a return value. This used to be `return { termsOfUseAccepted: undefined } as unknown as LocalizedCandidateData` — an object that is not a `LocalizedCandidateData` at all (no `id`, no `type`), laundered through a double cast. The caller SPREADS the result into the stored candidate (`candidateUserDataState.svelte.ts`, "merge them into the existing candidate so `id` and the other static fields survive"), so the no-op path wrote `termsOfUseAccepted: undefined` over the acceptance it had just read. Returning the row as stored means the merge is a no-op too, which is what "nothing was updated" should mean, and it costs one `select` on a path that does no work anyway.
    const columns = 'terms_of_use_accepted, image';
    const { data, error } =
      Object.keys(updateFields).length === 0
        ? await this.supabase.from('candidates').select(columns).eq('id', id).single()
        : await this.supabase.from('candidates').update(updateFields).eq('id', id).select(columns).single();
    if (error) throw new Error(`updateEntityProperties: ${error.message}`);
    // reason: class 4 — the declared return type is wrong for BOTH branches and has been since before this phase. The method returns only the two properties it owns, which the caller documents and relies on ("the property setter returns ONLY the changed properties — NOT the whole candidate"), while `LocalizedCandidateData` also requires `id` and the static fields. Aligning the declared type is an app-wide change to a published contract; the cast is bridged here and named rather than hidden.
    return {
      termsOfUseAccepted: data.terms_of_use_accepted ?? null,
      image: imageOf(parseImageColumn(data.image, constants.PUBLIC_SUPABASE_URL, { column: 'candidates.image', id }))
    } as unknown as LocalizedCandidateData;
  }
}
