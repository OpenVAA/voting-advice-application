import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { supabaseAdapterMixin } from '../supabaseAdapter';

/**
 * Supabase implementation of the DataProvider.
 * Currently a stub -- all methods throw 'not implemented'.
 * Phase 25 fills in real implementations.
 */
export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider) {
  protected _getAppSettings() {
    throw new Error('SupabaseDataProvider._getAppSettings not implemented');
  }
  protected _getAppCustomization() {
    throw new Error('SupabaseDataProvider._getAppCustomization not implemented');
  }
  protected _getElectionData() {
    throw new Error('SupabaseDataProvider._getElectionData not implemented');
  }
  protected _getConstituencyData() {
    throw new Error('SupabaseDataProvider._getConstituencyData not implemented');
  }
  protected _getNominationData() {
    throw new Error('SupabaseDataProvider._getNominationData not implemented');
  }
  protected _getEntityData() {
    throw new Error('SupabaseDataProvider._getEntityData not implemented');
  }
  protected _getQuestionData() {
    throw new Error('SupabaseDataProvider._getQuestionData not implemented');
  }
}
