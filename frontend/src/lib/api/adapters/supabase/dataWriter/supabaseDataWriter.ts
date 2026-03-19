import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import { constants } from '$lib/utils/constants';
import { toDataObject } from '../utils/toDataObject';
import { parseStoredImage } from '../utils/storageUrl';
import type {
  BasicUserData,
  CandidateUserData,
  DWReturnType,
  GetCandidateUserDataOptions,
  InsertJobResultOptions,
  LocalizedAnswers,
  LocalizedCandidateData,
  SendEmailOptions,
  SendEmailResult,
  SetAnswersOptions,
  SetPropertiesOptions,
  SetQuestionOptions,
  UpdatedEntityProps,
  WithAuth
} from '$lib/api/base/dataWriter.type';

/**
 * Supabase implementation of the DataWriter.
 * Auth methods use Supabase GoTrue via `this.supabase.auth`.
 * Non-auth methods are stubs until their respective phases implement them.
 */
export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter) {
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
    const { error } = await this.supabase.auth.signOut({ scope: 'local' });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  /**
   * Override the public `logout` to skip UniversalDataWriter's dual POST+backendLogout pattern.
   * Supabase handles everything via `signOut` -- no separate client-side POST is needed.
   */
  async logout(_opts: WithAuth): DWReturnType<DataApiActionResult> {
    return this._logout();
  }

  protected async _requestForgotPasswordEmail({ email }: { email: string }) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/candidate/auth/callback`
    });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _resetPassword({ password }: { password: string; code: string }) {
    // Called after recovery session is established via auth callback.
    // The `code` param is a Strapi-era artifact; Supabase uses the recovery session.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  protected async _setPassword({ password }: { password: string; currentPassword: string; authToken: string }) {
    // currentPassword and authToken are WithAuth compatibility shims -- ignored by Supabase.
    // Supabase verifies the active session via cookies automatically.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }

  ////////////////////////////////////////////////////////////////////
  // STUB METHODS (not yet implemented)
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
  } & WithAuth): DWReturnType<DataApiActionResult> {
    // Resolve projectId from the first nomination's electionId
    const { data: election, error: electionError } = await this.supabase
      .from('elections')
      .select('project_id')
      .eq('id', body.nominations[0].electionId)
      .single();
    if (electionError || !election)
      throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

    // identifier is intentionally ignored -- Supabase uses email-based invite, not personal ID.
    // authToken is ignored -- the Supabase client automatically includes the session JWT.
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
  protected async _register({ password }: { password: string }) {
    // Invite session already established by auth callback's verifyOtp.
    // Just set the password to complete registration.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }
  protected async _getBasicUserData(_opts: WithAuth): DWReturnType<BasicUserData> {
    const {
      data: { session },
      error
    } = await this.supabase.auth.getSession();
    if (error || !session) throw new Error('No active session');

    const user = session.user;

    // Decode JWT access token to extract user_roles custom claim
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles ?? [];

    // Determine role from JWT claims
    let role: 'candidate' | 'admin' | null = null;
    if (userRoles.some((r) => r.role === 'candidate' || r.role === 'party')) {
      role = 'candidate';
    } else if (userRoles.some((r) => ['project_admin', 'account_admin', 'super_admin'].includes(r.role))) {
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
    const user = await this._getBasicUserData({ authToken: '' });

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
      id: entityRow.id,
      answers: (entityRow.answers as LocalizedAnswers) ?? {},
      termsOfUseAccepted: entityRow.terms_of_use_accepted ?? null,
      image: parseStoredImage(entityRow.image as any, constants.PUBLIC_SUPABASE_URL)
    } as LocalizedCandidateData;

    // Load nominations if requested
    let nominations: CandidateUserData<TNominations>['nominations'];
    if (loadNominations) {
      const { data: nomData, error: nomError } = await this.supabase
        .from('nominations')
        .select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id')
        .eq('candidate_id', entityRow.id);

      if (nomError) throw new Error(`Failed to load nominations: ${nomError.message}`);

      const nominationsList = (nomData ?? []).map((n: any) => ({
        electionId: n.election_id,
        constituencyId: n.constituency_id,
        electionRound: n.election_round ?? 1,
        electionSymbol: n.election_symbol ?? '',
        id: n.id
      }));

      nominations = { nominations: nominationsList, entities: {} } as CandidateUserData<TNominations>['nominations'];
    } else {
      nominations = undefined as CandidateUserData<TNominations>['nominations'];
    }

    return { user, candidate, nominations } as CandidateUserData<TNominations>;
  }
  protected async _setAnswers({
    target: { type, id },
    answers,
    overwrite
  }: SetAnswersOptions & { overwrite: boolean }): DWReturnType<LocalizedAnswers> {
    if (type !== ENTITY_TYPE.Candidate)
      throw new Error(`Unsupported entity type for setting answers: ${type}`);

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
        // Lazily fetch project_id for Storage path construction
        if (!projectId) {
          const { data: candidateRow, error: fetchError } = await this.supabase
            .from('candidates')
            .select('project_id')
            .eq('id', id)
            .single();
          if (fetchError || !candidateRow)
            throw new Error(`Failed to fetch candidate project_id: ${fetchError?.message ?? 'not found'}`);
          projectId = candidateRow.project_id;
        }
        const file = answer.value as File;
        const ext = file.name.split('.').pop() ?? 'jpg';
        const storagePath = `${projectId}/candidates/${id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await this.supabase.storage
          .from('public-assets')
          .upload(storagePath, file, { cacheControl: '3600', upsert: true });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        // Replace File with StoredImage-compatible path object
        processedAnswers[questionId] = { ...answer, value: { path: storagePath } };
      } else {
        processedAnswers[questionId] = answer;
      }
    }

    // Call upsert_answers RPC
    const { data, error } = await this.supabase.rpc('upsert_answers', {
      entity_id: id,
      answers: processedAnswers,
      overwrite
    });
    if (error) throw new Error(`setAnswers: ${error.message}`);
    return (data as unknown as LocalizedAnswers) ?? {};
  }
  protected async _updateEntityProperties({
    target: { id },
    properties: { termsOfUseAccepted }
  }: SetPropertiesOptions): DWReturnType<UpdatedEntityProps> {
    const { data, error } = await this.supabase
      .from('candidates')
      .update({ terms_of_use_accepted: termsOfUseAccepted })
      .eq('id', id)
      .select('terms_of_use_accepted')
      .single();
    if (error) throw new Error(`updateEntityProperties: ${error.message}`);
    return { termsOfUseAccepted: data.terms_of_use_accepted ?? null };
  }
  protected async _updateQuestion({
    id,
    data: { customData }
  }: SetQuestionOptions): DWReturnType<DataApiActionResult> {
    if (!customData || typeof customData !== 'object')
      throw new Error(`Expected a customData object but got type: ${typeof customData}`);

    const { error } = await this.supabase.rpc('merge_custom_data', {
      question_id: id,
      patch: customData
    });
    if (error) throw new Error(`updateQuestion: ${error.message}`);
    return { type: 'success' as const };
  }

  protected async _sendEmail({
    templates,
    recipientUserIds,
    from,
    dryRun
  }: SendEmailOptions): DWReturnType<SendEmailResult> {
    const { data, error } = await this.supabase.functions.invoke('send-email', {
      body: {
        templates,
        recipient_user_ids: recipientUserIds,
        from,
        dry_run: dryRun
      }
    });

    if (error) throw new Error(`send-email: ${error.message}`);
    return {
      type: 'success' as const,
      sent: data.sent,
      failed: data.failed,
      results: data.results
    };
  }

  protected async _insertJobResult({ data }: InsertJobResultOptions): DWReturnType<DataApiActionResult> {
    // Resolve project_id from election_id (AdminJobRecord doesn't include project_id
    // but the admin_jobs table requires it for RLS)
    const { data: election, error: electionError } = await this.supabase
      .from('elections')
      .select('project_id')
      .eq('id', data.electionId)
      .single();
    if (electionError || !election)
      throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

    const { error } = await this.supabase.from('admin_jobs').insert({
      project_id: election.project_id,
      job_id: data.jobId,
      job_type: data.jobType,
      election_id: data.electionId,
      author: data.author,
      end_status: data.endStatus,
      start_time: data.startTime ?? null,
      end_time: data.endTime ?? null,
      input: data.input ?? null,
      output: data.output ?? null,
      messages: data.messages ?? null,
      metadata: data.metadata ?? null
    });
    if (error) throw new Error(`insertJobResult: ${error.message}`);
    return { type: 'success' as const };
  }
}
