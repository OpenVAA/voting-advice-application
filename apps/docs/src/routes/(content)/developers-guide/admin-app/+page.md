# Admin app

The Admin App, under `/admin`, holds tools for the people who run an election's VAA. At the time of writing it has three working tools, all of them experimental features built on language models: argument condensation, question info generation and a jobs monitor for both.

## Access

- **Availability.** The app is shown only when the data adapter supports it and the `access.adminApp` app setting is on; otherwise its layout shows a "not supported" or "not accessible" message.
- **Login.** `/admin/login` posts to its own server action, which signs in with the shared `passwordLogin` helper (the same one the [Candidate App login](/developers-guide/candidate-app/login-and-password-reset#login) uses). The user's access token must carry one of `ADMIN_GRANTS`: an `admin` grant at `global`, `account` or `project` scope. Any other user is signed out again.
- **Protected pages.** The pages under the `admin/(protected)` route group load the user's data and require the role `admin`; otherwise they sign the user out and return to the login page.
- **Actions and endpoints.** Each tool's form action, and each `/api/admin/jobs/**` endpoint, verifies the session with the auth server and then checks the admin role again before doing any work.

The role is worked out from the access token's grants. A user who also holds an `editor` grant on a candidate is given the role `candidate`, not `admin`.

The database's row-level security decides what an admin may read or write (see [Authentication and authorisation](/developers-guide/backend/authentication)). The Admin App has no editor for app settings or app customization; those are changed in the database.

## Tools

The home page, `/admin`, links to the tools. A fourth link, factor analysis, is shown disabled and has no page.

Both generation tools run as jobs. Starting one records a job, runs it on the server with the admin's own session and stores the generated results in the questions' `custom_data`. They call OpenAI through `@openvaa/llm`, with the API key from the `LLM_OPENAI_API_KEY` server variable; without it a job fails.

### Argument condensation

`/admin/argument-condensation` condenses the comments candidates wrote with their answers to a question into short lists of arguments, such as the arguments for and against. The admin chooses an election and the questions, or all opinion questions applicable to the election. The work is done by the [`@openvaa/argument-condensation`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/argument-condensation) package.

### Question info

`/admin/question-info` generates background for questions: definitions of the terms a question uses, info sections, or both. The admin chooses an election, the questions, the language and the operations, and may add section topics, custom instructions and context for the questions. The work is done by the [`@openvaa/question-info`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/question-info) package.

### Jobs

`/admin/jobs` shows the running and finished jobs with their progress and messages, and lets the admin abort one job or all of them. The list of running jobs is kept in the frontend server's memory, so it is lost when the server restarts and is not shared between server instances. Each finished, failed or aborted job is also written to the `admin_jobs` table.

## Packages

- [`@openvaa/llm`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/llm): the language-model wrapper both tools use.
- [`@openvaa/argument-condensation`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/argument-condensation): condensing arguments.
- [`@openvaa/question-info`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/question-info): generating question info.

Each package's README describes its own design.
