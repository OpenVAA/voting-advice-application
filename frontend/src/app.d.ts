import type { DPReturnType } from '$lib/api/base/dataProvider.type';
import type { CandidateUserData } from '$lib/api/base/dataWriter.type';
import type { Database } from '@openvaa/supabase-types';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
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

      // Voter App
      nominationData?: DPReturnType['nominations'] | Promise<Error>;

      // Candidate App
      candidateUserData?: CandidateUserData<true>;

      // Supabase session data
      session?: Session | null;
      user?: User | null;
    }
    interface PageState {
      resultsShowEntity?: {
        entityType: EntityType;
        entityId: Id;
        nominationId?: Id;
      };
    }
    interface Error {
      message: string;
      description?: string;
      emoji?: string;
    }
    // interface Platform {}
  }
}

export {};
