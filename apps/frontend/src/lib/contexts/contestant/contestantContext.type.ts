import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  BasicUserData,
  DataWriter,
  DesiredNomination,
  EntityNomination,
  NominationContest,
  NominationParentOption,
  RequestPasswordRecoveryOptions,
  RequestSignInLinkOptions,
  SetEntityNominationsResult,
  UserEntity
} from '$lib/api/base/dataWriter.type';
import type { EntryFlow, EntryHeldCode, EntryLinkRequest } from '$lib/contestant/entryFlow';
import type { NextStep, Task, TaskState } from '$lib/contestant/tasks';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { QuestionBlocks } from '../utils/questionBlockState.type';
import type { ContestantUserDataState } from './contestantUserDataState.type';

export type ContestantContext = AppContext &
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
    /**
     * Whether the question lists and blocks were rolled up for a loaded entity with at least one selected election. While it is `false` an empty list means "not loaded yet"; once it is `true` an empty list means the entity is asked no such question. It is written together with the lists, so the two never disagree. A reactive accessor: read `ctx.questionsReady`, never destructure.
     */
    questionsReady: boolean;

    ////////////////////////////////////////////////////////////////////
    // Wrappers for DataWriter methods NB. These automatically handle authentication
    ////////////////////////////////////////////////////////////////////

    /**
     * Ask what a registration code names. A stable function, safe to destructure.
     * @param code - The code as the user gave it.
     * @returns A `Promise` resolving to `'valid'`, `'used'` or `'unknown'`, and rejecting when the request fails.
     */
    checkInvitationCode: (opts: { code: string }) => ReturnType<DataWriter['checkInvitationCode']>;
    /**
     * Ask for a sign-in link to be mailed. A stable function, safe to destructure. A screen does not call it: it calls `sendEntryLink`, which keeps the request's outcome from the screen.
     * @param opts - The locale of the mail, and an address, a registration code or both.
     * @returns A `Promise` resolving when the request was received, which says nothing of whether a mail is sent, and rejecting when the request fails.
     */
    requestSignInLink: (opts: RequestSignInLinkOptions) => ReturnType<DataWriter['requestSignInLink']>;
    /**
     * Ask for a password-recovery link to be mailed. A stable function, safe to destructure. A screen does not call it: it calls `sendEntryLink`, which keeps the request's outcome from the screen.
     * @param opts - The address to mail and the locale of the mail.
     * @returns A `Promise` resolving when the request was received, which says nothing of whether the address has an account nor of whether a mail is sent, and rejecting when the request fails.
     */
    requestPasswordRecovery: (
      opts: RequestPasswordRecoveryOptions
    ) => ReturnType<DataWriter['requestPasswordRecovery']>;
    /**
     * Logout the user and redirect to the login page.
     * @returns A `Promise` resolving when the redirection is complete.
     */
    logout: () => Promise<void>;
    /**
     * Record the signed-in user’s acceptance of the terms of use for the served project. Recording an acceptance that already exists is not an error.
     * @returns A `Promise` resolving to an `DataApiActionResult` object, and rejecting when the write fails.
     */
    acceptTermsOfUse: () => Promise<DataApiActionResult>;
    /**
     * Write the whole set of nominations of the entity the route names, in one call: a stored nomination the set leaves out is removed. A stable function, safe to destructure, which reads the selected entity when it is called.
     * @param nominations - Every nomination the entity is to have.
     * @returns A `Promise` resolving to what was stored or to a named refusal, and rejecting when the route names no entity the user is listed with or the write fails. A rejection's message can hold the backend's own text: the caller logs it and shows a message of its own.
     */
    setEntityNominations: (nominations: ReadonlyArray<DesiredNomination>) => Promise<SetEntityNominationsResult>;
    /**
     * Read the entities the entity the route names may stand under, each with the contests asked about at which it is nominated. A stable function, safe to destructure, which reads the selected entity and the locale when it is called.
     * @param contests - The elections and constituencies to say of each option whether it is nominated there.
     * @returns A `Promise` resolving to the options, or to `undefined` when the read is refused, and rejecting when the route names no entity the user is listed with or the read fails.
     */
    getNominationParentOptions: (
      contests: ReadonlyArray<NominationContest>
    ) => Promise<Array<NominationParentOption> | undefined>;
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
    // Other properties specific to ContestantContext
    ////////////////////////////////////////////////////////////////////

    /**
     * An extended reactive object that holds all data owned by the user.
     *
     * NB. Before using the object, its `init` method must be called with the initial `ContestantUserData`.
     */
    userData: ContestantUserDataState;
    /**
     * The signed-in user, as the load of the protected tree read it, or `undefined` on a page outside that tree.
     *
     * A reactive accessor derived from page data: read it as `contestantCtx.user` inside the tracking scope and never destructure it.
     */
    user: BasicUserData | undefined;
    /**
     * The entities the signed-in user edits, of the types the project serves. Empty when the page data holds no list: on a page outside the protected tree, and while the user must pass a gate.
     *
     * A reactive accessor derived from page data: read it as `contestantCtx.entities` inside the tracking scope and never destructure it.
     */
    entities: ReadonlyArray<UserEntity>;
    /**
     * The entry of `entities` that the route's `entityType` and `entityId` params name together, or `undefined` when the route names no entity or names one that is not in the list.
     *
     * A reactive accessor derived from page data and the route params: read it as `contestantCtx.selectedEntity` inside the tracking scope and never destructure it.
     */
    selectedEntity: UserEntity | undefined;
    /**
     * The built route that "home" leads to from the current page: the home of the entity the route's `entityType` and `entityId` params name together, and the app root on a page whose route names no entity. The rule is `contestantHomeRoute` in `$lib/routes`.
     *
     * A reactive accessor derived from the route params: read it as `contestantCtx.homeRoute` inside the tracking scope and never destructure it.
     */
    homeRoute: string;
    /**
     * Holds the ID token claims.
     */
    idTokenClaims: { firstName: string; lastName: string } | undefined;

    ////////////////////////////////////////////////////////////////////
    // The entry flow: what is kept between the screens that lead to a mailed link
    ////////////////////////////////////////////////////////////////////

    /**
     * What the entry flow holds: a checked registration code with its status, the one link request the "email sent" screen can repeat, both, or `undefined` when nothing is held. It is kept in the memory of this context instance alone, so it is gone when the tab reloads, and it is cleared on logout.
     *
     * A reactive accessor replaced wholesale on every change: read it as `contestantCtx.entryFlow` inside the tracking scope and never destructure it.
     */
    readonly entryFlow: EntryFlow | undefined;
    /**
     * Hold a checked registration code with its status for the screen that uses it next. A request held before is removed. A stable function, safe to destructure.
     * @param code - The code and what the check answered for it.
     */
    holdEntryCode: (code: EntryHeldCode) => void;
    /**
     * Ask for a link to be mailed, and hold the request so that it can be repeated. The origin decides which request is made: a password-recovery link for the forgot-password page, a sign-in link for every other origin. A stable function, safe to destructure.
     *
     * The returned promise tells its caller nothing of the outcome: it resolves alike when the request succeeded, when it failed, and when it had not answered within the settle bound, and nothing of an answer is kept. A screen awaits it and moves on.
     * @param request - Where the request is made from, and the address, the registration code or both that it is made with.
     * @returns A `Promise` that resolves to nothing once the request has settled or the bound has passed, and never rejects.
     */
    sendEntryLink: (request: EntryLinkRequest) => Promise<void>;
    /**
     * Repeat the held link request and hold it again with the time it settled. Does nothing when no request is held. A stable function, safe to destructure.
     * @returns A `Promise` that resolves as that of `sendEntryLink` does, and never rejects.
     */
    resendEntryLink: () => Promise<void>;
    /**
     * Forget everything the entry flow holds. For a screen that ends the flow by signing the user in. A stable function, safe to destructure.
     */
    clearEntryFlow: () => void;

    /**
     * Whether the answers can be edited.
     */
    answersLocked: boolean;
    /**
     * Whether an entity's own users are barred from adding or changing its nominations. A reactive accessor over the app setting `access.nominationsLocked`, which the database enforces: read `ctx.nominationsLocked`, never destructure.
     */
    nominationsLocked: boolean;
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
     * The nominations of the entity on the page, as the entity-level load read them: an empty list for an entity with none, and `undefined` on a page whose data holds no entity.
     *
     * A reactive accessor derived from page data: read it as `contestantCtx.nominations` inside the tracking scope and never destructure it. It follows the load and not the store, so it changes when that load reruns.
     */
    nominations: ReadonlyArray<EntityNomination> | undefined;
    /**
     * The state of the tasks of the entity the route names: its tasks, the next step, whether the preview is open, whether every status is decided (`known`) and whether every task is complete (`allComplete`). Whether the entity has a nomination is read from the page data; the counts are read from the store and the question lists, and only while the store holds the entity the route names and `questionsReady` is true. The rules are `taskStateOf` in `$lib/contestant/tasks`.
     *
     * A reactive accessor replaced wholesale on every change: read it as `contestantCtx.taskState` inside the tracking scope and never destructure it.
     */
    taskState: TaskState;
    /**
     * The tasks of the entity the route names, in order: `taskState.tasks`. Empty on a page that names no entity the user edits. A task has no status while the facts it rests on are not loaded.
     *
     * A reactive accessor: read it as `contestantCtx.tasks` inside the tracking scope and never destructure it.
     */
    tasks: ReadonlyArray<Task>;
    /**
     * The first incomplete task and where it leads: `taskState.nextStep`. `undefined` when no task is incomplete and while the state is not known.
     *
     * A reactive accessor: read it as `contestantCtx.nextStep` inside the tracking scope and never destructure it.
     */
    nextStep: NextStep | undefined;
    /**
     * Whether the entity's preview can be opened: `taskState.previewOpen`. The entity has a nomination, and no required info question and no opinion question is unanswered. False while the state is not known.
     *
     * A reactive accessor: read it as `contestantCtx.previewOpen` inside the tracking scope and never destructure it.
     */
    previewOpen: boolean;
    /**
     * Whether every task the entity has is complete: `taskState.allComplete`. It has a nomination, no required info question and no opinion question is unanswered and, while the entity's name can still be edited, every name field its type requires is saved. False for an entity with no nomination, and false while the state is not known: with no entity loaded, and before the entity's question lists are.
     *
     * A reactive accessor: read it as `contestantCtx.profileComplete` inside the tracking scope and never destructure it.
     */
    profileComplete: boolean;
    /**
     * A locally stored value set to `true` when the user has completed the preregistration process.
     * Can be used to prompt the user to log in instead of preregistering again.
     */
    isPreregistered: boolean;
  };
