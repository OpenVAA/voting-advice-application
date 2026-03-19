import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DWReturnType, WithAuth } from '$lib/api/base/dataWriter.type';

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
  protected _setAnswers() {
    throw new Error('SupabaseDataWriter._setAnswers not implemented');
  }
  protected _updateEntityProperties() {
    throw new Error('SupabaseDataWriter._updateEntityProperties not implemented');
  }
  protected _updateQuestion() {
    throw new Error('SupabaseDataWriter._updateQuestion not implemented');
  }
  protected _insertJobResult() {
    throw new Error('SupabaseDataWriter._insertJobResult not implemented');
  }
}
