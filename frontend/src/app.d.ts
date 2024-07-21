// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type {CandidateData, ConstituencyData, ElectionData, NominationData} from '$lib/_vaa-data';

// and what to do when importing types
declare namespace App {
  interface Locals {
    currentLocale: string;
    route: string;
    preferredLocale?: string;
  }
  interface PageData {
    // For _test route
    constituenciesData?: Promise<ConstituencyData[]>;
    electionsData?: Promise<Array<ElectionData>>;
    /** Nominations and entities are packaged into one `Promise` because they're both needed at the same time, and staggered updates (e.g., nominations updated before candidates) may cause errors */
    nominationsData?: Promise<{
      candidates: Array<CandidateData>;
      nominations: NominationData[];
    }>;
    constituencyId?: string; // Should be string | Array<string>
    electionId?: string; // Should be string | Array<string>

    // Most of these properties are required so we don't need unnecessary
    // null checks every time we use them. We'll initiliaze the Array types
    // as empty arrays in the global data load /+layout.server.ts
    appSettings?: Partial<AppSettings>;
    candidates?: Promise<CandidateProps[]>;
    categoryId?: string;
    election?: ElectionProps;
    entityId?: string;
    entityType?: EntityType;
    parties?: Promise<PartyProps[]>;
    questionId?: string;
    // `setQuestionAsFirst` will be set to `true` on the `/(voter)/questions/[questionId]` route if a `start` search param is present (regardless of its value)
    setQuestionAsFirst?: boolean;
    opinionQuestions?: Promise<QuestionProps[]>;
    // TODO: This is a temporary fix for the candidate app and will be corrected when this branc is merged into main
    opinionQuestionsSync?: QuestionProps[];
    infoQuestions?: Promise<QuestionProps[]>;
    i18n: {
      currentLocale: string;
      preferredLocale?: string;
      route: string;
    };
  }
  // interface Error {}
  // interface Platform {}
}
