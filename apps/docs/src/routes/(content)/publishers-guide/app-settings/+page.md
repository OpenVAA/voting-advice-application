# Application settings and features

> This section deals with configuring App Settings. For where they are stored and how to add new ones, see [App settings](/developers-guide/configuration/app-settings) in the Developers' Guide.

The application's functionality is affected by different types of settings:

- App Settings, which are stored per election project in the database and can be changed at any time; they are also called dynamic settings
- Environment variables, which can only be changed in the hosting platform or the deployment's configuration
- Static settings, which can only be changed in the source code

In addition to these, the application's text contents and appearance can be changed with [App customization](/developers-guide/configuration/app-customization).

Below, the dynamic App Settings are explained in detail. For more information about the environment variables and static settings, see [Configuration](/developers-guide/configuration/intro) in the Developers' Guide.

## App Settings

Every project starts with the default values set in the [dynamicSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts) file. A project's own values are stored in the `settings` column of its row in the `app_settings` database table and replace the defaults. There is no settings editor in the Admin App yet, so the values are changed in the database, for example in Supabase Studio or with a data import; your developer can do this for you.

A stored setting replaces only the default it names. For example, to change `results.showFeedbackPopup`, store that one value: the other values of the `results` group keep their defaults. Two things follow from this. A setting that is a list, such as `results.sections`, is replaced as a whole, so store the complete list. And leaving a setting out never switches a feature off, because the default then applies: store the value that disables it.

The settings and their types are documented in [dynamicSettings.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.type.ts). They control the following features.

### `survey`

Settings related to a user survey. If not defined, no survey will be shown. Not defined by default.

- `linkTemplate`: The link to the survey. This is passed to the translation function, which will replace `{sessionId}` with the URL-encoded session id if available or an empty string otherwise.
- `showIn`: Where the survey prompt should be shown: any of `frontpage`, `entityDetails`, `navigation` and `resultsPopup`. The `resultsPopup` option means that the survey will be shown in a popup after a timeout starting when the user reaches the results page. Use `results.showSurveyPopup` to set the delay.

### `entityDetails`

Settings related to the entity details view, i.e. the pages for individual candidates, parties and alliances.

- `contents`: Which content tabs to show.
  - `candidate`: The content tabs to show for candidates. Possible values:
    - `info`: Basic information.
    - `opinions`: Answers to opinion questions.
    - Default: `info` and `opinions`.
  - `organization`: The content tabs to show for parties. Possible values:
    - `info`
    - `opinions`
    - `children`: The party's candidates.
    - Default: `info`, `children` and `opinions`.
  - `alliance`: The content tabs to show for alliances. The same values as for parties; the `children` of an alliance are its member parties. Alliances have no answers of their own, so `opinions` is usually left out. Default: `info` and `children`.
- `showMissingElectionSymbol`: Whether to show a marker for a missing election symbol in entity details, e.g. 'Election Symbol: --', or hide missing items completely. Set separately for each entity type. The marker, if shown, is defined in the translations. Default: shown for candidates, hidden for parties.
- `showMissingAnswers`: Whether to show a marker for missing answers in entity details as, e.g. 'Age: --', or hide missing items completely. Set separately for each entity type. The marker, if shown, is defined in the translations. This only applies to non-opinion questions. Default: shown for candidates and parties.

### `header`

Settings related to the actions in the app header.

- `showFeedback`: Whether to show the feedback icon by default in the header. Default: `true`.
- `showHelp`: Whether to show the help icon by default in the header. Default: `true`.

### `headerStyle`

> These will be moved to App customization in the future.

Settings related to app header styling.

- `dark`: Background colors for the header in dark mode.
  - `bgColor`: Default background color of the header. Default: the theme's `base-300` colour.
  - `overImgBgColor`: Background color of the header when it's over an image. Default: `transparent`.
- `light`: Background colors for the header in light mode, with the same two settings and defaults.
- `imgSize`: The size of the background image in the header. E.g. `cover`, `contain`, or specific sizes like `100% 50%`. Default: `cover`.
- `imgPosition`: The positioning of the background image in the header. E.g. `center`, `top`, `bottom`, `left`, `right`, or specific positions like `50% 25%`. Default: `center`.

### `entities`

Settings controlling which entities are shown in the app.

- `hideIfMissingAnswers`: Settings controlling whether entities with missing answers should be shown, set separately for candidates and for parties.
  - `candidate`: Whether to hide candidates who have not answered every statement posed to candidates. Default: `true`.
  - `organization`: Whether to hide parties that have not answered every statement posed to parties. Default: `false`.
- `showAllNominations`: Whether to show the `/nominations` route on which all nominations in the app are shown. Default: `true`.

### `matching`

Settings related to the matching algorithm.

- `minimumAnswers`: The minimum number of voter answers needed before matching results are available. Default: `5`.
- `organizationMatching`: The method with which parties are matched. The options are:
  - `none`: no party matching is done
  - `answersOnly`: matching is only performed on the parties' explicit answers
  - `impute`: missing party answers are substituted with an answer imputed from the party's candidates' answers. This is the default.

### `questions`

Settings related to the question view.

- `categoryIntros`: Settings related to the optional category intro pages.
  - `allowSkip`: Whether to allow the user to skip the whole category. Default: `true`.
  - `show`: Whether to show category intro pages before the first question of each category. Default: `true`.
- `interactiveInfo`: Settings related to the interactive info view for each question.
  - `enabled`: Whether the interactive info view is enabled. Default: `false`.
- `questionsIntro`: Settings related to the optional questions intro page, shown before going to questions.
  - `allowCategorySelection`: Whether to allow the user to select which categories to answer if there are more than one. NB. If the app has multiple elections with different questions applicable to each, category selection may result in cases where the user does not select enough questions to get any results for one or more elections, regardless of the minimum number of answers required. In such cases, consider setting this to `false`. Default: `true`.
  - `show`: Whether to show the questions intro page. Default: `true`.
- `showCategoryTags`: Whether to show the category tag along the question text. Default: `true`.
- `showResultsLink`: Whether to show the link to results in the header when answering questions if enough answers are provided. Default: `true`.

### `results`

Settings related to the results view.

- `cardContents`: Settings related to the contents of the entity cards in the results list and entity details. NB. The order of the items currently has no effect.
  - `candidate`: The additional contents of candidate cards. Default: `submatches`. Possible values:
    - `submatches`: Show the matching scores for each question category.
    - Question answer: Show the entity's answer to a specific question. Only applies to the results list. Defined by three properties:
      - `question`: The question's id.
      - `hideLabel`: Whether to hide the question label in the card.
      - `format`: How to format the answer. Possible values:
        - `default`: use the same format as in entity details.
        - `tag`: format the answers as a pill or tag.
  - `organization`: The additional contents of party cards. Default: `children`. Possible values:
    - `children`: List the party's candidates within its card. Only applies to the results list.
    - `submatches`
    - Question answer
  - `alliance`: The additional contents of alliance cards, with the same values as for parties; `children` lists the alliance's member parties. Default: `children`.
- `sections`: Which entity types to show in the results view: any of `candidate`, `organization` and `alliance`. There must be at least one. Default: candidates and parties.
- `showFeedbackPopup`: The delay in seconds after which a feedback popup will be shown on the next page load, when the user has reached the results section. The popup will not be shown if the user has already given some feedback. Set it to `0` to disable the popup; if it is left out, the default applies. Default: `180`.
- `showSurveyPopup`: The delay in seconds after which a survey popup will be shown on the next page load, when the user has reached the results section. The popup will only be shown if `survey.showIn` includes `resultsPopup` and if the user has not already opened the survey. Set it to `0` to disable the popup; if it is left out, the default applies. Default: `500`.

### `elections`

Settings related to election and constituency selection in VAAs with multiple elections. These have no effect if there is just one election.

- `disallowSelection`: If `true`, all elections are selected by default. Default: `false`.
- `showElectionTags`: Whether to show the election tags along the question text. Default: `true`.
- `startFromConstituencyGroup`: If set to the id of a `ConstituencyGroup` and there are multiple elections, the constituency selection page with this group as the only option will be shown first and the possible election selection only afterwards. Only those elections that are applicable to the selected constituency or its ancestors are shown. Election selection will be bypassed the same way as normally. Not set by default.

### `access`

Settings related to access to the applications.

- `contestantApp`: If `true`, the Candidate App can be accessed. Default: `true`.
- `voterApp`: If `true`, the Voter App can be accessed. Default: `true`.
- `adminApp`: If `true`, the Admin App can be accessed. Default: `true`.
- `underMaintenance`: If `true`, an under maintenance error page will be shown when attempting to access any part of the app. Default: `false`.
- `answersLocked`: If `true`, candidates and parties can no longer edit their answers. Default: `false`.
- `nominationsLocked`: If `true`, candidates and parties can no longer add or change their own nominations. Administrators and project editors still can. Default: `false`.

### `notifications`

Settings related to important notifications shown to users. Neither notification is set by default.

- `contestantApp`: The notification shown to users of the Candidate App. Defined by the properties:
  - `show`: If `true`, the notification will be shown the next time the user loads the app.
  - `title`: The title of the notification, in each language.
  - `content`: The content of the notification, in each language.
  - `icon`: The name of the icon to display in the notification. Default: `important`.
- `voterApp`: The notification shown to users of the Voter App, with the same properties.

### `contestantApp`

Settings related to the Candidate App.

- `questions`: Settings related to the question view in the Candidate App.
  - `hideVideo`: Whether to hide possible video content for questions in the Candidate App. Default: `false`.
  - `hideHero`: Whether to hide possible hero content for questions in the Candidate App. Default: `false`.
- `entityTypes`: Whom the app serves: `candidate`, `organization` (parties) or both. There must be at least one. Default: `candidate` only.
- `registrationModes`: The ways of registering that are allowed, set separately for `candidate` and for `organization`. Each of the two is a list of any of the modes below. Default: both lists are empty, so nothing is allowed.
  - `identity_provider`: The person identifies with a bank identity and an account is created for them. With it allowed for candidates, a candidate is created; with it allowed for parties, a party is created, whose name the person then enters. Where both are allowed, the registration page asks which to register. The person then gives the email address they will sign in with and confirms it by a link sent to it.
  - `email`: Registration with the email address an invitation was sent for: the person asks for a sign-in link to it.
  - `code`: Registration with a registration code the person has been given.

The app names itself after `entityTypes`: "Candidate app" when it serves candidates, "Party app" when it serves parties and "Candidate and party app" when it serves both. To give it a name of your own, override the three texts `dynamic.contestantAppName.candidate`, `dynamic.contestantAppName.organization` and `dynamic.contestantAppName.candidateAndOrganization` with [App customization](/developers-guide/configuration/app-customization); the app shows the one that matches the setting. A text stored under the former single name `dynamic.contestantAppName` is ignored.

What the login page offers follows `registrationModes`:

- With nothing declared, the app is the "Candidate app" with sign-in only: the login page offers to sign in and no way to register.
- An invitation for a candidate or a party created by an administrator works only under a mode allowed here for its entity type: an invitation sent to an email address needs `email`, and one with a registration code needs `code`. With nothing declared, such invitations cannot be used until a mode is allowed. Invitations of project editors and administrators do not depend on this setting.
- While answers are locked (`access.answersLocked`), no way to register is offered, whatever is set here.
- A mode is offered when it is allowed for a type that `entityTypes` lists. Modes listed for a type the app does not serve have no effect.
- `identity_provider` also needs the identity provider's environment variables to be set on the server, both for the app and for the `identity-callback` function; see [Bank authentication (OIDC)](/developers-guide/contestant-app/bank-authentication) for their names. The setting alone decides what the login page shows: without that configuration the page still offers registration with the identity provider, and it fails when the visitor starts identification.
- "Register" leads to a registration page that lists the allowed modes, and only those, to choose from.
- The sign-in page also offers to email a sign-in link when `email` or `identity_provider` is allowed for a served type, for a person who has no password yet.
- Each list is stored as a whole, as explained above: name every mode you want to allow for a type.
