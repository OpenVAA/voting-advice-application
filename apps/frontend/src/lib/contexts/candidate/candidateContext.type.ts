import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { QuestionBlocks } from '../utils/questionBlockStore.type';
import type { CandidateUserDataStore } from './candidateUserDataStore.type';

export type CandidateContext = AppContext &
  AuthContext & {
    ////////////////////////////////////////////////////////////////////
    // Properties matching those in the VoterContext
    ////////////////////////////////////////////////////////////////////

    /**
     * Whether `Election`s can be selected.
     */
    electionsSelectable: boolean;
    /**
     * Whether `Constituency`s can be selected.
     */
    constituenciesSelectable: boolean | undefined;
    /**
     * The `Id`s ... TODO
     */
    preregistrationElectionIds: Array<Id>;
    /**
     * The `Id`s ... TODO
     */
    preregistrationConstituencyIds: { [electionId: Id]: Id };
    /**
     * The `Election`s selected or implied in the pregistration process.
     */
    preregistrationElections: Array<Election>;
    /**
     * The data for the preregistration `Nomination`s derived from selected `Constituency`s and `Election`s.
     */
    preregistrationNominations: Array<{
      electionId: Id;
      constituencyId: Id;
    }>;
    /**
     * The `Election`s the `Candidate` is nominated in.
     */
    selectedElections: Array<Election>;
    /**
     * The `Constituency`s the `Candidate` is nominated in.
     */
    selectedConstituencies: Array<Constituency>;
    /**
     * The non-opinion `QuestionCategory`s applicable to the selected `Election`s and `Constituency`s.
     * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
     */
    infoQuestionCategories: Array<QuestionCategory>;
    /**
     * The non-opinion `Question`s applicable to the selected `Election`s and `Constituency`s.
     */
    infoQuestions: Array<AnyQuestionVariant>;
    /**
     * The matching `QuestionCategory`s applicable to the selected `Election`s and `Constituency`s.
     * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
     */
    opinionQuestionCategories: Array<QuestionCategory>;
    /**
     * The matching `Question`s applicable to the selected `Election`s and `Constituency`s.
     */
    opinionQuestions: Array<AnyQuestionVariant>;
    /**
     * The applicable opinion `Question`s applicable to the selected `Election`s and `Constituency`s.
     */
    questionBlocks: QuestionBlocks;

    ////////////////////////////////////////////////////////////////////
    // Wrappers for DataWriter methods
    // NB. These automatically handle authentication
    ////////////////////////////////////////////////////////////////////

    /**
     * Check whether the registration key is valid.
     * @param registrationKey - The registration key to check.
     * @returns A `Promise` resolving to an `DataApiActionResult` object.
     */
    checkRegistrationKey: (opts: { registrationKey: string }) => ReturnType<DataWriter['checkRegistrationKey']>;
    /**
     * Activate an already registered user with the provided registration key and password.
     * @param registrationKey - The registration key to check.
     * @param password - The user's password.
     * @returns A `Promise` resolving to an `DataApiActionResult` object.
     */
    register: (opts: { registrationKey: string; password: string }) => ReturnType<DataWriter['register']>;
    /**
     * Logout the user and redirect to the login page.
     * @returns A `Promise` resolving when the redirection is complete.
     */
    logout: () => Promise<void>;
    /**
     * Exchange an authorization code for an ID token.
     * @param authorizationCode - An authorization code received from an IdP.
     * @param redirectUri - A redirect URI used to obtain the authorization code.
     * @returns A `Promise` resolving when the redirection is complete.
     */
    exchangeCodeForIdToken: (opts: {
      authorizationCode: string;
      codeVerifier: string;
      redirectUri: string;
    }) => Promise<void>;
    /**
     * Create a candidate with a nomination or nominations, then emails a registration link.
     * Expects a valid ID token in the cookies.
     * @param email - Email.
     * @param electionIds - Election IDs.
     * @param constituencyId - Constituency ID.
     * @returns A `Promise` resolving when the redirection is complete.
     */
    preregister: (opts: {
      email: string;
      nominations: Array<{ electionId: Id; constituencyId: Id }>;
      extra: {
        emailTemplate: {
          subject: string;
          text: string;
          html: string;
        };
      };
    }) => Promise<void>;
    /**
     * Clear the OIDC ID token.
     */
    clearIdToken: () => Promise<void>;

    ////////////////////////////////////////////////////////////////////
    // Other properties specific to CandidateContext
    ////////////////////////////////////////////////////////////////////

    /**
     * An extended reactive object that holds all data owned by the user.
     *
     * NB. Before using the object, its `init` method must be called with the initial `CandidateUserData`.
     */
    userData: CandidateUserDataStore;
    /**
     * Holds the ID token claims.
     */
    idTokenClaims: { firstName: string; lastName: string } | undefined;
    /**
     * Holds the user's email so it can be prefilled during password changes.
     */
    newUserEmail: string | undefined;
    /**
     * Whether the answers can be edited.
     */
    answersLocked: boolean;
    /**
     * Required info `Question`s.
     */
    requiredInfoQuestions: Array<AnyQuestionVariant>;
    /**
     * The required info `Question`s that are yet to be answered.
     */
    unansweredRequiredInfoQuestions: Array<AnyQuestionVariant>;
    /**
     * The opinion `Question`s that are yet to be answered.
     */
    unansweredOpinionQuestions: Array<AnyQuestionVariant>;
    /**
     * Whether the profile is fully complete.
     */
    profileComplete: boolean;
    /**
     * A locally stored value set to `true` when the user has completed the preregistration process.
     * Can be used to prompt the user to log in instead of preregistering again.
     */
    isPreregistered: boolean;
  };
