# App settings

> This page is the developers' reference: where app settings come from, every key with its default, and how to add a setting. The [Publishers' Guide](/publishers-guide/app-settings) explains what the settings do in plain language.

App settings live in the [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/app-shared/src/settings) package, in two layers:

- **Static settings** are fixed when the app is built. They are typed by `StaticSettings` and set in [`staticSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts). See [Static settings](/developers-guide/configuration/static-settings).
- **Dynamic settings** can be changed per project while the app runs. They are typed by `DynamicSettings` in [`dynamicSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.type.ts), and their shipped defaults are in [`dynamicSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts). The type file documents every key; this page lists them.

## Where the values come from

### Stored settings

Each project can override the dynamic settings in the `settings` column of its row in the `app_settings` table ([`106-app-settings.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/106-app-settings.sql)). The table holds one row per project, and the column defaults to an empty object.

The Supabase data provider's `getAppSettings` reads the row:

- **Validation.** The stored value is checked against `StoredSettingsSchema` ([`storedSettings.schema.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/schemas/storedSettings.schema.ts)). Every member is optional, and the schema is strict at every level. When the value does not match, the top-level members that fail (for example a whole `results` object with one unknown key in it) are dropped and logged as an error, and the other members are kept.
- **Notifications.** The `title` and `content` of the two notifications are stored as locale objects and returned as strings in the requested locale.
- **No row.** Nothing creates a settings row for a project, and an anonymous visitor cannot read the row of a project that is closed for voters. When the provider reads no row, it asks `project_open_for_voters`. For an open project it returns no overrides. For a closed project it returns the shipped `access` defaults with `voterApp` set to `false`, which shows the voter app's maintenance page, together with five stored values it reads through the database function `contestant_app_public_config`: `access.contestantApp`, `access.answersLocked`, the served entity types (`contestantApp.entityTypes`), the registration matrix (`contestantApp.registrationModes`) and the tracking switch (`analytics.trackEvents`, `false` when none is stored). The five values are validated like a readable row. Nothing else that is stored is honoured for that caller: `access.underMaintenance`, `access.nominationsLocked` and every other stored setting stay at their shipped defaults.
- **Who can read it.** Anonymous visitors can read the row only while the project is open for voters. Signed-in users with a grant on the project can always read it, which lets them preview a closed project.

`analytics.trackEvents` is a dynamic setting like the others; it decides whether usage events other than the page-view count are collected. The analytics provider is not a setting: it is chosen by the server environment variable `ANALYTICS_PROVIDER`, so a stored row cannot name one. A stored `analytics` member that carries any other key fails validation and is dropped.

### Merging

The root layout loads the stored settings, and the app context merges the three sources in this order, each over the previous one:

1. the static settings,
2. the dynamic defaults from `dynamicSettings.ts`,
3. the stored settings.

The merge (`mergeAppSettings` in [`settings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/settings.ts)) merges the sources **member by member at every depth**:

- where both sides hold an object, the two are merged, so a stored `results: { showFeedbackPopup: 60 }` changes that one member and leaves the other members of `results` at their defaults;
- a list or a scalar is **replaced whole** and never combined, so a stored `results.sections` is the complete list of sections;
- a top-level key whose value is `null` or `undefined` is ignored. Below the top level `undefined` is ignored and `null` replaces the default, which is how a notification is stored as absent.

Leaving a member out therefore never removes it: to switch a feature off, store the value that disables it (for example `0` for the two popup delays under `results`).

### Editing the stored settings

The Admin App has no settings editor. Write the `settings` column directly, for example in Supabase Studio, or include an `app_settings` row in a [data import](/developers-guide/backend/data-import-and-deletion). Inserting and updating the row needs the `project.edit_app_settings` permission on the project, which project admins and project editors both hold. That permission is therefore also what sets the nominations lock described below.

## Keys

The table lists every key path of `DynamicSettings` with its default in `dynamicSettings.ts`. "None" means the default leaves the key unset. For what each key does, see the doc comments in the type file or the [Publishers' Guide](/publishers-guide/app-settings).

| Key path                                          | Default                                    | Type and values                                                     |
| ------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `survey.linkTemplate`                             | none (`survey` is unset)                   | string; `{sessionId}` becomes the visit id when events carry it     |
| `survey.showIn`                                   | none                                       | array of `frontpage`, `entityDetails`, `navigation`, `resultsPopup` |
| `entityDetails.contents.candidate`                | `['info', 'opinions']`                     | array of `info`, `opinions`                                         |
| `entityDetails.contents.organization`             | `['info', 'children', 'opinions']`         | array of `info`, `opinions`, `children`                             |
| `entityDetails.contents.alliance`                 | `['info', 'children']`                     | array of `info`, `opinions`, `children`; optional                   |
| `entityDetails.showMissingElectionSymbol`         | `{ candidate: true, organization: false }` | boolean per entity type                                             |
| `entityDetails.showMissingAnswers`                | `{ candidate: true, organization: true }`  | boolean per entity type                                             |
| `header.showFeedback`                             | `true`                                     | boolean                                                             |
| `header.showHelp`                                 | `true`                                     | boolean                                                             |
| `headerStyle.dark.bgColor`                        | `'var(--color-base-300)'`                  | CSS colour                                                          |
| `headerStyle.dark.overImgBgColor`                 | `'transparent'`                            | CSS colour                                                          |
| `headerStyle.light.bgColor`                       | `'var(--color-base-300)'`                  | CSS colour                                                          |
| `headerStyle.light.overImgBgColor`                | `'transparent'`                            | CSS colour                                                          |
| `headerStyle.imgSize`                             | `'cover'`                                  | CSS `background-size`                                               |
| `headerStyle.imgPosition`                         | `'center'`                                 | CSS `background-position`                                           |
| `entities.hideIfMissingAnswers.candidate`         | `true`                                     | boolean                                                             |
| `entities.hideIfMissingAnswers.organization`      | `false`                                    | boolean                                                             |
| `entities.showAllNominations`                     | `true`                                     | boolean                                                             |
| `matching.minimumAnswers`                         | `5`                                        | number                                                              |
| `matching.organizationMatching`                   | `'impute'`                                 | `none`, `answersOnly` or `impute`                                   |
| `questions.categoryIntros.allowSkip`              | `true`                                     | boolean                                                             |
| `questions.categoryIntros.show`                   | `true`                                     | boolean                                                             |
| `questions.interactiveInfo.enabled`               | `false`                                    | boolean                                                             |
| `questions.questionsIntro.allowCategorySelection` | `true`                                     | boolean                                                             |
| `questions.questionsIntro.show`                   | `true`                                     | boolean                                                             |
| `questions.showCategoryTags`                      | `true`                                     | boolean                                                             |
| `questions.showResultsLink`                       | `true`                                     | boolean                                                             |
| `results.cardContents.candidate`                  | `['submatches']`                           | array of `submatches` or a question object                          |
| `results.cardContents.organization`               | `['children']`                             | array of `submatches`, `children` or a question object              |
| `results.cardContents.alliance`                   | `['children']`                             | array of `submatches`, `children` or a question object; optional    |
| `results.sections`                                | `['candidate', 'organization']`            | array of `candidate`, `organization`, `alliance`; at least one      |
| `results.showFeedbackPopup`                       | `180`                                      | seconds                                                             |
| `results.showSurveyPopup`                         | `500`                                      | seconds                                                             |
| `elections.disallowSelection`                     | `false`                                    | boolean                                                             |
| `elections.showElectionTags`                      | `true`                                     | boolean                                                             |
| `elections.startFromConstituencyGroup`            | none (`undefined`)                         | constituency group id                                               |
| `access.contestantApp`                            | `true`                                     | boolean                                                             |
| `access.voterApp`                                 | `true`                                     | boolean                                                             |
| `access.adminApp`                                 | `true`                                     | boolean                                                             |
| `access.underMaintenance`                         | `false`                                    | boolean                                                             |
| `access.answersLocked`                            | `false`                                    | boolean                                                             |
| `access.nominationsLocked`                        | `false`                                    | boolean                                                             |
| `notifications.contestantApp`                     | `null`                                     | a notification, or `null`                                           |
| `notifications.contestantApp.show`                | none                                       | boolean                                                             |
| `notifications.contestantApp.title`               | none                                       | localized string                                                    |
| `notifications.contestantApp.content`             | none                                       | localized string                                                    |
| `notifications.contestantApp.icon`                | none                                       | icon name; `important` when unset or unknown                        |
| `notifications.voterApp`                          | `null`                                     | a notification, or `null`                                           |
| `notifications.voterApp.show`                     | none                                       | boolean                                                             |
| `notifications.voterApp.title`                    | none                                       | localized string                                                    |
| `notifications.voterApp.content`                  | none                                       | localized string                                                    |
| `notifications.voterApp.icon`                     | none                                       | icon name                                                           |
| `contestantApp.questions.hideVideo`               | `false`                                    | boolean                                                             |
| `contestantApp.questions.hideHero`                | `false`                                    | boolean                                                             |
| `contestantApp.entityTypes`                       | `['candidate']`                            | array of `candidate`, `organization`; at least one                  |
| `contestantApp.registrationModes.candidate`       | `[]`                                       | array of `identity_provider`, `email`, `code`                       |
| `contestantApp.registrationModes.organization`    | `[]`                                       | array of `identity_provider`, `email`, `code`                       |
| `analytics.trackEvents`                           | `false`                                    | boolean; collect events other than the page-view count              |

A question object in `results.cardContents` has `question` (the question's id), an optional `hideLabel` and an optional `format`: `default` or `tag`.

### Hiding entities with missing answers

`entities.hideIfMissingAnswers` has one key for each entity type the Contestant App serves, and each key hides entities of that type from voters while they lack an answer:

- `candidate` hides a candidate who has not answered every opinion question addressed to candidates.
- `organization` hides an organization that has not answered every opinion question addressed to organizations. An organization that is asked no opinion question lacks none and is shown.

The voter app applies both keys when it builds its lists, in [`nominationAndQuestionState.svelte.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts). The Contestant App reads the key of the edited entity's type through `isHiddenIfMissingAnswers` in [`hideIfMissingAnswers.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts), to warn a user whose entity is hidden.

### The nominations lock

`access.nominationsLocked` bars an entity's own users from adding, changing or removing its nominations. It is the one app setting the database itself enforces:

- **In the database.** The nomination policies in [`302-rls.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/302-rls.sql) ask `private.project_nominations_locked(project_id)`, which reads the stored value from the project's settings row. Only the JSON boolean `true` locks. A project with no settings row, or a row without the key, is unlocked, and an id that names no project is locked.
- **In the frontend.** The contestant context exposes it as the reactive accessor `nominationsLocked`. While it is on, the [nominations view](/developers-guide/contestant-app/home-and-tasks#the-nominations-view) shows a note saying that nominations can no longer be changed, the [nomination editor](/developers-guide/contestant-app/defining-nominations) is closed and every address of it leads to the view, and the home's first task of an entity with no nomination leads to the view as well.
- **Whom it binds.** The four policies for an entity's own users ask it: `entity_insert_nominations`, `entity_insert_parent_nominations`, `entity_update_nominations` and `entity_delete_nominations`. The admin policies, which ask `project.edit_nominations`, do not.
- **Who sets it.** Anyone who may write the settings row: a holder of `project.edit_app_settings`, which includes project editors.

`access.answersLocked` is enforced by the database for an entity's own editor. While it is on, the entity's self-update policies, its nomination policies and the entity-scope storage write refuse every write of the entity's editor, and `upsert_answers` and `set_entity_nominations` refuse it with SQLSTATE `42501` and `<function>: answers are locked in this project`. A project editor and a project admin still write. In the app it closes the nomination editor in the same way, and the nominations view then shows a note of its own.

### The contestant app's entity types and registration modes

`contestantApp.entityTypes` lists the entity types the Contestant App serves, and `contestantApp.registrationModes` is a map from entity type to the registration modes allowed for that type. By default the app serves candidates only and every row of the map is empty, so the app offers sign-in only.

- **Canonical lists.** `StoredSettingsSchema` collapses a repeated value and orders each list: `candidate`, `organization` for the types, and `identity_provider`, `email`, `code` for the modes. A list that names a value twice or out of order therefore reads the same as the canonical one.
- **An unserved row.** A row of `contestantApp.registrationModes` for a type that `contestantApp.entityTypes` does not list is stored and ignored on read.
- **One bad value.** An empty `entityTypes`, an unknown type, an unknown mode or an unknown row fails validation. The stored `contestantApp` group is then dropped as a whole, `contestantApp.questions` included, its shipped defaults apply and the failure is logged with the path of the offending member.
- **Accessors, never raw keys.** Code reads the two settings through the accessors in [`contestantAppConfig.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/contestantAppConfig.ts), exported by `@openvaa/app-shared`: `getServedEntityTypes`, `getEffectiveRegistrationModes`, `isRegistrationModeAllowed`, `isRegistrationModeAllowedForAnyType`, `isAnyRegistrationAllowed` and `getContestantAppNameKey`. They apply the defaults and the unserved-row rule, and they accept merged settings, a provider's raw answer and an empty object alike.

## Adding a new setting

For a static setting:

1. Add the type and its documentation to `StaticSettings` in [`staticSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).
2. Add the value to [`staticSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

For a dynamic setting:

1. Add the type and its documentation to `DynamicSettings` in [`dynamicSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.type.ts).
2. Add the default to [`dynamicSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts).
3. Add the key to `StoredSettingsSchema` in [`storedSettings.schema.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/schemas/storedSettings.schema.ts), as an optional member. The schema is strict, so a stored value that carries a key the schema does not know loses the whole top-level setting that contains it.

The frontend imports the settings from the built `@openvaa/app-shared` package, so the package must be rebuilt after a change. `yarn dev` runs a watcher that does this; see [Running the development environment](/developers-guide/development/running-the-development-environment).
