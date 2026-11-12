import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { SupabaseDatabase } from '$lib/api/adapters/supabase/supabaseAdapter.type';
import type { DPReturnType } from '$lib/api/base/dataProvider.type';
import type { BasicUserData, ContestantUserData, UserEntity } from '$lib/api/base/dataWriter.type';

// See https://kit.svelte.dev/docs/types#app for information about these interfaces and what to do when importing types
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<SupabaseDatabase>;
      safeGetSession(): Promise<{
        session: Session | null;
        user: User | null;
      }>;
      currentLocale: string;
      preferredLocale?: string;
    }
    interface PageData {
      // Globally used data
      appCustomizationData?: DPReturnType['appCustomization'] | Promise<Error>;
      appSettingsData?: DPReturnType['appSettings'] | Promise<Error>;
      constituencyData?: DPReturnType['constituencies'] | Promise<Error>;
      electionData?: DPReturnType['elections'] | Promise<Error>;
      questionData?: DPReturnType['questions'] | Promise<Error>;
      /** Whether an analytics relay is active and in which modes, from the root loads. */
      analytics?: AnalyticsProjection;

      // Voter App
      nominationData?: DPReturnType['nominations'] | Promise<Error>;

      // Contestant App
      contestantUserData?: ContestantUserData<true>;
      /** The signed-in user, from the load of the Contestant App's protected tree. */
      user?: BasicUserData;
      /** The entities the signed-in user edits, of the types the project serves, from the same load. */
      entities?: Array<UserEntity>;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageState {}
    interface Error {
      message: string;
      description?: string;
      emoji?: string;
    }
    // interface Platform {}
  }
}

export {};
