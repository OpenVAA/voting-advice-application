import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { supabaseAdapterMixin } from '../supabaseAdapter';

/**
 * Supabase implementation of the DataWriter.
 * Currently a stub -- all methods throw 'not implemented'.
 * Phase 26 fills in real implementations.
 */
export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter) {
  protected _preregister() {
    throw new Error('SupabaseDataWriter._preregister not implemented');
  }
  protected _checkRegistrationKey() {
    throw new Error('SupabaseDataWriter._checkRegistrationKey not implemented');
  }
  protected _register() {
    throw new Error('SupabaseDataWriter._register not implemented');
  }
  protected _login() {
    throw new Error('SupabaseDataWriter._login not implemented');
  }
  protected _logout() {
    throw new Error('SupabaseDataWriter._logout not implemented');
  }
  protected _getBasicUserData() {
    throw new Error('SupabaseDataWriter._getBasicUserData not implemented');
  }
  protected _requestForgotPasswordEmail() {
    throw new Error('SupabaseDataWriter._requestForgotPasswordEmail not implemented');
  }
  protected _resetPassword() {
    throw new Error('SupabaseDataWriter._resetPassword not implemented');
  }
  protected _setPassword() {
    throw new Error('SupabaseDataWriter._setPassword not implemented');
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
