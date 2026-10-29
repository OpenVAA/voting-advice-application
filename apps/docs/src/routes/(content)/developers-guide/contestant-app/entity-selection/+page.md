# Entity selection and the entity routes

One signed-in user of the Contestant App may edit several entities in a project: candidates, organizations or both. The URL names the entity being edited, the app root decides what a user who names none gets, and the user changes entity from the menu without signing out.

## The entity URL

Every page that shows or edits an entity lives under two route params, below the `(protected)` group:

```
/contestant/<entityType>/<entityId>            the entity's home
/contestant/<entityType>/<entityId>/nominations
/contestant/<entityType>/<entityId>/profile
/contestant/<entityType>/<entityId>/questions
/contestant/<entityType>/<entityId>/questions/<questionId>
/contestant/<entityType>/<entityId>/preview
```

The settings page is not among them: the account's address and its password belong to the user, not to an entity. It has one address, `/contestant/settings` (`ContestantAppSettings`), directly below the `(protected)` group, behind the same gates as every protected page, and a user with no entity, one or several reaches it alike. The menu of an entity's pages, the entity's home and the "nothing to edit" view link to it, and its Return leads to the app root. The settings address under an entity, `/contestant/<entityType>/<entityId>/settings`, still answers: its server load redirects it with 307 to `/contestant/settings`.

Both params are guarded by a matcher, so a malformed segment is answered with SvelteKit's own 404 and never reaches a load:

- `entityType` by [`servedEntityType`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/params/servedEntityType.ts), which accepts `candidate` and `organization`. It checks the vocabulary, not what the project serves: `contestantApp.entityTypes` is read by the load.
- `entityId` by [`uuid`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/params/uuid.ts), which accepts the canonical textual form of a uuid.

The route keys are in `ROUTE` (see [Routing](/developers-guide/frontend/routing)). `ContestantAppEntityHome` is an entity's home, and `ContestantAppHome` is the app root, `/contestant`, which carries no entity. A route built with `getRoute.current(...)` on an entity page keeps the current page's two params, so a link between the pages of one entity does not have to name it.

The profile, the questions pages and the preview open only while the entity has a nomination; see [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks#which-pages-need-a-nomination).

## The two loads

Two server loads decide who the user is and which entity they edit. Each takes its data from the request's own Supabase client.

| Load         | File                                                                                                                                                                                                                       | Reads                                                                                                                                                    | Reruns when                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| User level   | The protected group's [`+layout.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/+layout.server.ts>)                                            | The session, the user-level data, the pending gate if any, and the list of the entities the user edits, filtered to the entity types the project serves. | The selected entity changes, the app root included. |
| Entity level | The entity routes' [`+layout.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts>) | The entity the URL names, with its nominations, and the question data of the elections it is nominated in.                                               | The selected entity changes.                        |

The user-level load returns `{ gate, user }` while a gate such as the terms of use is pending, and `{ gate: null, user, entities }` otherwise. The entity-level load awaits it, checks that the entity the URL names is in `entities`, and only then reads the entity.

**Neither load reads the URL tracked.** Both read the `entityType` and `entityId` params and nothing else of the request's location: no `url` property and no `route`. A navigation between the pages of one entity therefore reruns neither, and no entity data is read again. The user-level load reads the two params for the dependency alone, so that the list and the entity are always read in the same request chain. Each load has a test beside it, `layout.tracking.test.ts`, that fails on any other tracked read.

These loads sign a signed-in user out only when the user-level data, the entity list or the entity cannot be read (`loginFailed`). A request without a session is redirected to the login page.

An entity with no nomination is not signed out. The entity-level load serves it with its empty list of nominations and with question data that holds no question, and it reaches its home, where "Define your nomination" is its first task. See [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks).

## The app root's three outcomes

The root, the protected group's [`+page.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/+page.server.ts>), decides on the user-level list alone:

| The user edits     | Outcome                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exactly one entity | A redirect to that entity's home. Such a user never sees the selection.                                                                                                 |
| Several entities   | The profile selection screen: one card per entity, grouped by entity type with candidates first, each card linking to that entity's home.                               |
| No entity          | The "nothing to edit" view: the email address the user is signed in with, the support block, a link to the settings page and a logout button. The user stays signed in. |

While a gate is pending the root redirects nowhere and the gate's view is shown at the root. The root signs nobody out.

The "nothing to edit" view offers no way into the pages of an entity. It links to the settings page, where the password is changed and a pending address replaced, because that page belongs to the user rather than to an entity.

## A path that names no entity

A request for an entity page without the entity, such as `/contestant/profile` or `/contestant/questions/<questionId>`, is served by the resolver route, the rest segment `[...page=contestantEntityPage]` of the protected group, in its [`+page.server.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts>). Its matcher admits exactly the entity sub-paths the app has, so any other path under the app is a 404.

- A user who edits exactly one entity is redirected to the same page under that entity.
- Any other user is redirected to the app root.

Every target is built from a route key. A question segment that is not a plain id leads to the app root, and the query string of the request is not carried over, so nothing of the requested path reaches the target unchecked.

## An entity the user may not edit

The URL never decides what is served: the user's own list does, and the read that follows runs under the user's own row-level security. A URL that names an entity the user does not edit is answered by one redirect to the app root, with the same status and the same target whether the entity belongs to another user, is of a type the project does not serve, is named under the wrong type, is no longer listed or does not exist. Nobody is signed out over it, and nothing in the answer differs by whether the id exists.

## The context

`getContestantContext()` exposes four user-level accessors, each derived from page data and the route params:

| Accessor         | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `user`           | The signed-in user.                                                                                                      |
| `entities`       | The entities the user edits, of the served types.                                                                        |
| `selectedEntity` | The entity the `entityType` and `entityId` params name, when the user edits it.                                          |
| `homeRoute`      | The route "home" leads to from the current page: the selected entity's home, or the app root when no entity is selected. |

All four are reactive accessors: read them as `contestantCtx.user`, never destructured. See [Contexts](/developers-guide/frontend/contexts). The accessors of the entity's tasks and nominations (`taskState`, `tasks`, `nextStep`, `previewOpen` and `nominations`) are described in [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks#on-the-context).

## What an entity's pages show

The home, the nominations view, the profile, the questions pages and the preview serve a candidate and an organization alike. Everything that differs between the two types is read from one descriptor per type, `entityDescriptorOf(type)` in [`entityDescriptor.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/entityDescriptor.ts): the name fields, the labels and sentences, whether a colour is offered, and what the preview adds or leaves out. A page asks the descriptor and never the type.

### The profile

| Part of the profile | Candidate                                | Organization                                                           |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Name fields         | First name and last name, one text each. | Name and short name, each with one value per supported locale.         |
| Required            | Both names, while they are editable.     | The name in the frontend's default locale, while the name is editable. |
| Image               | Portrait.                                | Logo.                                                                  |
| Colour              | Not offered.                             | A hex colour, typed or chosen with the colour picker.                  |

**When a name is editable** is one rule for every name field of both types, `nameState` in [`nameRule.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/nameRule.ts): the fields are editable while the entity is unconfirmed and `access.answersLocked` is off, and read-only otherwise. A confirmed entity's names are read-only whether or not answers are locked, and the nominations lock plays no part. The database holds the same line by itself: once an entity is confirmed it refuses a changed name or short name from the entity's own editor; see [Row-level security and column grants](/developers-guide/backend/authentication#row-level-security-and-column-grants).

An entity can be confirmed while its user has the profile open. The next save of a changed name is then refused by the database. The page's other edits of that save are stored, the name fields turn read-only, and a message above the Save button says so. `ContestantUserDataState.save()` reports this outcome as `nameRefused`.

**The colour is stored as chosen and adjusted when read.** The profile stores `{ normal: '#rrggbb' }` and nothing else, and the field shows that value. An editor's colour therefore replaces both theme colours: a dark-theme colour stored with the entity, for example by an administrator or an import, is removed when the editor saves a colour, and the dark-theme colour is then derived from the new one. Wherever the colour is painted, in the preview and in the voter app, it first passes through `ensureColors` in [`ensureColors.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/color/ensureColors.ts), which adjusts it for contrast, derives the dark-theme colour when none is stored and drops a value that is not a colour. A page must therefore read the editable colour from the user data (`userData.current?.entity.color`) and never from `selectedEntity` or `entities`, which hold the adjusted one.

### The questions

An entity is asked the opinion questions addressed to its type. A project may address every opinion question to another type, so an entity that is asked none is not an error: its questions pages show a page that says there is nothing to answer, and its menu and its home leave the questions entry out. The pages decide this through `opinionQuestionsStateOf`, because the list of questions is also empty before it is loaded; see [Contexts](/developers-guide/frontend/contexts#an-empty-list-that-is-not-yet-loaded).

### The preview

The preview gives the `EntityDetails` component the entity's own row, so an unconfirmed entity previews itself in full. For an organization the card begins with a line that shows how the party is marked beside its candidates, and the `children` tab is left out through the component's `excludeTabs` property, because the Contestant App does not load the organization's candidates.

## Switching

On an entity's pages the menu's first group is titled with the selected entity, as its type and its name. For a user who edits several entities the group ends with a switch item that leads to the app root, where the selection screen is shown again. A user who edits one entity has no switch item.

Switching is a navigation, not a sign-out. The entity layout leaves the entity when it is torn down, and the next entity's data is loaded by the entity-level load.

## Drafts

An unsaved answer is kept in `localStorage` under a key of its own for each signed-in user and entity, built by `editedAnswersKey` as `contestantContext-userData-editedAnswers-<userId>-<entityType>-<entityId>`. A draft of one entity is never shown on, or saved to, another: saving writes the selected entity's row alone. An organization can have several editors, who may share a browser, so when an entity is loaded the drafts any other user left in the browser are removed before the user's own is restored: an editor is never shown, and never saves, answers someone else typed.

The editors' prompt is the one they have for any navigation. Leaving the profile or a question editor with an unsaved change, by the switch item or any other link, raises one native confirmation. Declining keeps the editor, the change and the draft; confirming an in-app navigation discards the draft. A full page load away from the editor, such as a reload or a typed URL, leaves the draft in storage, and it is shown again when the user returns to that entity. Logging out removes every draft.

## The database functions

The frontend reads the user's entities through three functions, described in full in [Which entity a user is](/developers-guide/backend/authentication#which-entity-a-user-is):

- `get_user_entities(p_project_id)` lists the entities the caller edits, as one JSON object with an `entities` array, beside `password_set`, which says whether the caller's own account holds a password.
- `get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` returns the editable row of one of them, or no row.
- `get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` returns the nominations of one of them as a JSON array, empty for an entity with none, or `NULL` for an entity the caller does not edit.

An entity is listed exactly when the one-entity read returns it. The root and the entity-level load rely on that: the root redirects to an entity the list holds, and the entity-level load redirects back to the root when the read finds no row, so a disagreement between the two functions would loop. A `NULL` from the nominations read is the same outcome as no row. It is never taken for an empty list, which says that the user's own entity has no nomination.

## Grants and the token

All three functions find the caller's entities from the grants table. The first two read the entity tables under row-level security, which reads the grants in the access token. A grant written after the token was issued is therefore fully served once the token refreshes. Until then:

- an entity that is not publicly visible is neither listed nor readable;
- an entity that is publicly visible is listed and readable, and every write to it is refused;
- a grant that was removed stops being listed at once, although the token still carries it.

The app has no flow yet that grants an entity to a user who is already signed in. A flow that does must refresh the session before its first read or write.

## In tests

The shape of an entity URL is stated once for the E2E suite, in [`contestantEntityUrl.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/tests/utils/contestantEntityUrl.ts): `contestantUrlRe(subPath)` asserts the URL of an entity page, `contestantHomeUrlRe()` an entity's home and `contestantAppRootUrlRe()` the app root, and `buildEntityLessRoute` builds the path the resolver redirects from.
