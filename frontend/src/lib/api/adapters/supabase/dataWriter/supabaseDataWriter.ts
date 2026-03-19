import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  DWReturnType,
  LocalizedAnswers,
  SetAnswersOptions,
  SetPropertiesOptions,
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

  protected _preregister() {
    throw new Error('SupabaseDataWriter._preregister not implemented');
  }
  protected async _register({ password }: { password: string }) {
    // Invite session already established by auth callback's verifyOtp.
    // Just set the password to complete registration.
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { type: 'success' as const };
  }
  protected _getBasicUserData() {
    throw new Error('SupabaseDataWriter._getBasicUserData not implemented');
  }
  protected _getCandidateUserData() {
    throw new Error('SupabaseDataWriter._getCandidateUserData not implemented');
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
  protected _updateQuestion() {
    throw new Error('SupabaseDataWriter._updateQuestion not implemented');
  }
  protected _insertJobResult() {
    throw new Error('SupabaseDataWriter._insertJobResult not implemented');
  }
}
