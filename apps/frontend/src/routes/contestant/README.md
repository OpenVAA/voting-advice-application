# Contestant Routes

> See also the online docs:
>
> - [Contestant app](https://openvaa.org/developers-guide/contestant-app/pre-registration-and-invitation) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md>))
> - [Registration](https://openvaa.org/developers-guide/contestant-app/registration) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md>))
> - [Login and password reset](https://openvaa.org/developers-guide/contestant-app/login-and-password-reset) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md>))
> - [Entity selection and the entity routes](https://openvaa.org/developers-guide/contestant-app/entity-selection) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md>))
> - [The home, the tasks and the nominations view](https://openvaa.org/developers-guide/contestant-app/home-and-tasks) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md>))
> - [Defining nominations](https://openvaa.org/developers-guide/contestant-app/defining-nominations) (or [locally](</apps/docs/src/routes/(content)/developers-guide/contestant-app/defining-nominations/+page.md>))
> - [Routing](https://openvaa.org/developers-guide/frontend/routing) (or [locally](</apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md>))

This directory contains the routes of the Contestant App, where the editors of candidates and organizations register, sign in, and manage their entity's profile and answers.

- The pages that need no session are directly here: the entry screens below, `preregister`, `help` and `privacy`.
- The pages that need a signed-in user are under `(protected)/`. Its server load reads the user-level data, asks the gate list, and then reads the list of the entities the user edits.

- `(protected)/+page.*` is the app root, `/contestant`. It redirects a user who edits one entity to that entity's home, lets a user who edits several choose one, and tells a user who edits none that there is nothing to edit.
- `(protected)/[entityType=servedEntityType]/[entityId=uuid]/` holds the pages of one entity. Its server load checks the entity the URL names against the user's list and then reads it, with its nominations. An entity with no nomination is served and stays signed in.
  - Directly in it are the pages every entity can open: its home (`+page.svelte`), which lists the entity's tasks, `nominations`, which shows the entity's nominations and leads into the editor, and `settings`.
  - `nominations/+layout.ts` states the facts the nominations view and the editor both rest on, from what the parent loads read: whether the nominations may be edited, which elections admit the entity's type, and which of its nominations the editor manages.
  - `nominations/(edit)/` is the nomination editor: `elections`, `constituencies` and `details`. The election step's address is the editor's entry. The group's load (`(edit)/+layout.ts`) is its guard: while either lock is on, or no election admits the entity's type, it redirects to the nominations view. It serves an entity with no nomination as it serves one that has some, which is why the group is outside `(nominated)/`. Each step's own page load reads the selection from the address and forwards to the step that has something to choose.
  - `(nominated)/` holds the pages that open only while the entity has a nomination: `profile`, `questions` with `questions/[questionId]`, and `preview`. The group's server load redirects an entity with no nomination to its home. It runs once per entry to the group.
  - `(nominated)/preview/+page.server.ts` decides the preview's own rule on every arrival: an entity with an unanswered required info question or opinion question is redirected to its home.
  - No layout load of the entity routes signs anyone out, and none reads the URL: the `(nominated)` load and the editor's guard read the parent data and the two entity params, and the nominations tree's load the parent data alone. The preview's page load reads no URL either; the page loads of the editor's three steps do, for the selection.
- `(protected)/[...page=contestantEntityPage]/` resolves a path that names an entity page without an entity, such as `/contestant/profile`: to the same page under the user's single entity, or to the app root.

What is left for an entity to do, which of its pages are open and where each button that continues leads are read from one state, `taskState` on the contestant context, computed by `taskStateOf` in `$lib/contestant/tasks`. No page, layout or menu holds a rule of its own.

## The entry flow

| Route              | Route key                     | Screen                                                                                    |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `login`            | `ContestantAppLogin`          | the login screen: "Sign in with email", and "Register" when a registration mode is listed |
| `login/email`      | `ContestantAppSignIn`         | the sign-in screen: a form posted to its server action, and a button that mails a link    |
| `register`         | `ContestantAppRegister`       | the registration screen: the modes `listedRegistrationModes` lists                        |
| `register/email`   | `ContestantAppRegisterEmail`  | the address for a held registration code nobody has claimed                               |
| `register/sign-in` | `ContestantAppRegisterSignIn` | the sign-in of the holder of a held claimed code, posted to its server action             |
| `email-sent`       | `ContestantAppEmailSent`      | the held link request, its count and "Send again"                                         |
| `forgot-password`  | `ContestantAppForgotPassword` | a recovery link asked for; open to a signed-in user too                                   |
| `password-reset`   | `ContestantAppResetPassword`  | a new password for a signed-in user; its server load redirects a visitor with no session  |

- **What the screens share** is the contestant context's `entryFlow`: a checked code, the one link request that can be repeated, both, or nothing. It is in memory only, so a reload empties it, and `register/email`, `register/sign-in` and `email-sent` then render nothing and lead to the registration screen or the login screen.
- **The guard of the registration pages.** `register`, `register/email` and `register/sign-in` each have a server load that calls `refuseUnlessRegistrationOffered` from `$lib/server/contestant/registrationGuard`: the first needs any listed mode, the other two the code mode. `register/sign-in`'s form action asks `isRegistrationOffered` itself before anything else.
- **The entry routes.** The first six rows are the Contestant App's `entryRoutes` in `$lib/routes/appGates.ts`: the server hook sends a caller who has a session from them to the app root. `forgot-password` and `password-reset` are not listed.
- **The gates.** `(protected)/+layout.server.ts` asks `firstNeededGate` of `$lib/contestant/gates` with the user-level data before it reads any entity. The gates, in order: `setPassword`, for an account with no password, and `termsOfUse`. The layout renders the first needed gate's view in place of the page.

See the documentation for detailed information on user management and routing.
