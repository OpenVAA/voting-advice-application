import type { createAdminWriter } from '$lib/api/adminWriter';
import type { BasicUserData, DataWriter } from '$lib/api/base/dataWriter.type';
import type { EntryFlow, EntryLinkRequest } from '$lib/auth/entryFlow';
import type { AppContext } from '../app';
import type { AuthContext } from '../auth';
import type { JobStates } from './jobStates.type';

/**
 * The admin writer these wrappers forward to, named by the factory that builds one per call rather than by any instance.
 */
type AdminWriter = ReturnType<typeof createAdminWriter>;

export type AdminContext = AppContext &
  AuthContext & {
    /**
     * User data for the admin user.
     */
    userData: BasicUserData | undefined;
    /**
     * Logout the user. It rejects when the sign-out failed, in which case the session may still be alive. It shows nothing itself: the failure is held in `logoutFailed`, and the next attempt clears it as it starts.
     * @returns A Promise resolving when logout is complete.
     */
    logout: () => Promise<void>;
    /**
     * Whether the last sign-out failed, which is what the Admin App's layout shows a message for. A reactive accessor: read it as `ctx.logoutFailed`, never destructure.
     */
    readonly logoutFailed: boolean;
    /**
     * Forget the failed sign-out, as the message's Close does and as the layout does once the session has gone.
     */
    clearLogoutFailure: () => void;
    /**
     * What the forgot-password and "email sent" pages keep between them: the one link request the "email sent" page can repeat. A reactive accessor replaced whole on every write: read it as `ctx.entryFlow`, never destructure.
     */
    readonly entryFlow: EntryFlow | undefined;
    /**
     * Ask for a mailed link. A request from the forgot-password page with an address asks for a recovery link made for the Admin App, in the context's locale; any other request asks nothing. It resolves alike for a request that succeeded, failed or never answered, once it has settled or its bound has passed, and then holds the request.
     */
    sendEntryLink: (request: EntryLinkRequest) => Promise<void>;
    /**
     * Repeat exactly the held request, if there is one.
     */
    resendEntryLink: () => Promise<void>;
    /**
     * Let the entry flow go.
     */
    clearEntryFlow: () => void;
    /**
     * Stores and utilities for handling admin jobs.
     */
    jobs: JobStates;

    ////////////////////////////////////////////////////////////////////
    // Wrappers for writer methods. `updateQuestion` and `insertJobResult` are admin-writer methods; the rest are DataWriter methods.
    ////////////////////////////////////////////////////////////////////

    updateQuestion(opts: Parameters<AdminWriter['updateQuestion']>[0]): ReturnType<AdminWriter['updateQuestion']>;

    getActiveJobs(opts: Parameters<DataWriter['getActiveJobs']>[0]): ReturnType<DataWriter['getActiveJobs']>;

    getPastJobs(opts: Parameters<DataWriter['getPastJobs']>[0]): ReturnType<DataWriter['getPastJobs']>;

    startJob(opts: Parameters<DataWriter['startJob']>[0]): ReturnType<DataWriter['startJob']>;

    getJobProgress(opts: Parameters<DataWriter['getJobProgress']>[0]): ReturnType<DataWriter['getJobProgress']>;

    abortJob(opts: Parameters<DataWriter['abortJob']>[0]): ReturnType<DataWriter['abortJob']>;

    abortAllJobs(): ReturnType<DataWriter['abortAllJobs']>;

    insertJobResult(opts: Parameters<AdminWriter['insertJobResult']>[0]): ReturnType<AdminWriter['insertJobResult']>;
  };
