import type { DPReturnType } from '$lib/api/base/dataProvider.type';
import type { CandidateUserData } from '$lib/api/base/dataWriter.type';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  namespace App {
    interface Locals {
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
      /** The jwt auth token */
      token?: string;
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
