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
- **No row.** Nothing creates a settings row for a project. When there is none, the provider asks `project_open_for_voters`: for an open project it returns no overrides, and for a closed project it returns the default `access` settings with `voterApp` set to `false`, which shows the voter app's maintenance page.
- **Who can read it.** Anonymous visitors can read the row only while the project is open for voters. Signed-in users with a grant on the project can always read it, which lets them preview a closed project.

`StoredSettingsSchema` also accepts `analytics`, which is a static setting: a project can override it in the same column.

### Merging

The root layout loads the stored settings, and the app context merges the three sources in this order, each over the previous one:

1. the static settings,
2. the dynamic defaults from `dynamicSettings.ts`,
3. the stored settings.

The merge (`mergeAppSettings` in [`settings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/settings.ts)) replaces values **by top-level key**, and skips keys whose value is `null` or `undefined`. A stored `results` object therefore replaces the whole default `results` object: store every member of a top-level setting you change, not just the one member.

### Editing the stored settings

The Admin App has no settings editor. Write the `settings` column directly, for example in Supabase Studio, or include an `app_settings` row in a [data import](/developers-guide/backend/data-import-and-deletion). Inserting and updating the row needs the `project.edit_app_settings` permission on the project.

## Keys

The table lists every key path of `DynamicSettings` with its default in `dynamicSettings.ts`. "None" means the default leaves the key unset. For what each key does, see the doc comments in the type file or the [Publishers' Guide](/publishers-guide/app-settings).

| Key path                                          | Default                                    | Type and values                                                     |
| ------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `survey.linkTemplate`                             | none (`survey` is unset)                   | string; `{sessionId}` is replaced with the session id               |
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
| `access.candidateApp`                             | `true`                                     | boolean                                                             |
| `access.voterApp`                                 | `true`                                     | boolean                                                             |
| `access.adminApp`                                 | `true`                                     | boolean                                                             |
| `access.underMaintenance`                         | `false`                                    | boolean                                                             |
| `access.answersLocked`                            | `false`                                    | boolean                                                             |
| `notifications.candidateApp`                      | `null`                                     | a notification, or `null`                                           |
| `notifications.candidateApp.show`                 | none                                       | boolean                                                             |
| `notifications.candidateApp.title`                | none                                       | localized string                                                    |
| `notifications.candidateApp.content`              | none                                       | localized string                                                    |
| `notifications.candidateApp.icon`                 | none                                       | icon name; `important` when unset or unknown                        |
| `notifications.voterApp`                          | `null`                                     | a notification, or `null`                                           |
| `notifications.voterApp.show`                     | none                                       | boolean                                                             |
| `notifications.voterApp.title`                    | none                                       | localized string                                                    |
| `notifications.voterApp.content`                  | none                                       | localized string                                                    |
| `notifications.voterApp.icon`                     | none                                       | icon name                                                           |
| `candidateApp.questions.hideVideo`                | `false`                                    | boolean                                                             |
| `candidateApp.questions.hideHero`                 | `false`                                    | boolean                                                             |
| `preRegistration.enabled`                         | none (`preRegistration` is unset)          | boolean                                                             |

A question object in `results.cardContents` has `question` (the question's id), an optional `hideLabel` and an optional `format`: `default` or `tag`.

## Adding a new setting

For a static setting:

1. Add the type and its documentation to `StaticSettings` in [`staticSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).
2. Add the value to [`staticSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

For a dynamic setting:

1. Add the type and its documentation to `DynamicSettings` in [`dynamicSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.type.ts).
2. Add the default to [`dynamicSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts).
3. Add the key to `StoredSettingsSchema` in [`storedSettings.schema.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/schemas/storedSettings.schema.ts), as an optional member. The schema is strict, so a stored value that carries a key the schema does not know loses the whole top-level setting that contains it.

The frontend imports the settings from the built `@openvaa/app-shared` package, so the package must be rebuilt after a change. `yarn dev` runs a watcher that does this; see [Running the development environment](/developers-guide/development/running-the-development-environment).
