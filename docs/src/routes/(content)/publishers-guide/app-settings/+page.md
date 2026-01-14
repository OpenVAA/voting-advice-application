# Application settings and features

> This section deals with configuring App Settings. For adding new ones, see [Adding new settings](/developers-guide/configuration/app-settings).

The application’s functionality is affected by different types of settings:

- App Settings, which can be edited in the Strapi dashboard at any time and, hence, also called dynamic settings
- Environmental variables, which can only be edited in the source code or the hosting platform
- Static settings, which can only be edited in the source code
- Built-in features but which cannot be easily enabled via settings

In addition to these, the application’s text contents and appearance can be changed in the [Customization](#customization) options.

Below, the dynamic App Settings are explained in detail as well as some features that must enabled otherwise. For more information about the environmental variables and static settings, see [Configuration](/developers-guide/configuration/intro) in the Developers’ Guide.

## App Settings

App Settings can be edited in the Strapi dashboard. When the application is created, they’re initialized with the default values set in the [dynamicSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts) file.

The settings control the following features.

### `survey`

Settings related to a user survey. If not defined, no survey will be shown.

- `linkTemplate`: The link to the survey. This is passed to the translation function, which will replace `{sessionId}` with the URL-encoded session id if available or an empty string otherwise.
- `showIn`: Where the survey prompt should be shown. The `resultsPopup` option means that the survey will be shown in a popup after a timeout starting when the user reaches the results page. Use `results.showSurveyPopup` to set the delay.

### `entityDetails`

Settings related to the entity details view, i.e. the pages for individual candidates and parties.

- `contents`: Which content tabs to show.
  - `candidate`: The content tabs to show for candidates. Possible values:
    - `info`: Basic information.
    - `opinions`: Answers to opinion questions.
  - `organization`: The content tabs to show for parties. Possible values:
    - `candidates`: The party’s candidates.
    - `info`
    - `opinions`
- `showMissingElectionSymbol`: Whether to show a marker for missing election symbol in entity details, e.g. 'Election Symbol: --', or hide missing items completely. The marker, if shown, is defined in the translations.
- `showMissingAnswers`: Whether to show a marker for missing answers in entity details as, e.g. 'Age: --', or hide missing items completely. The marker, if shown, is defined in the translations. This only applies to non-opinion questions.

### `header`

Settings related to the actions in the app header.

- `showFeedback`: Whether to show the feedback icon by default in the header.
- `showHelp`: Whether to show the help icon by default in the header.

### `headerStyle`

> These will be moved to App customization in the future.

Settings related to app header styling.

- `dark`: Background colors for the header in dark mode.
  - `bgColor`: Default background color of the header.
  - `overImgBgColor`: Background color of the header when it’s over an image.
- `light`: Background colors for the header in light mode.
  - `bgColor`: Default background color of the header.
  - `overImgBgColor`: Background color of the header when it’s over an image.
- `imgSize`: The size of the background image in the header. E.g. `cover`, `contain`, or specific sizes like `100% 50%`.
- `imgPosition`: The positioning of the background image in the header. E.g. `center`, `top`, `bottom`, `left`, `right`, or specific positions like `50% 25%`.

### `entities`

Settings controlling which entities are shown in the app.

- `hideIfMissingAnswers`: Settings controlling whether entites with missing answers should be shown. This is currently only supported for candidates.
  - `candidate`: Whether to hide candidates with missing answers in the app.
- `showAllNominations`: Whether to show the `/nominations` route on which all nominations in the app are shown.

### `matching`

Settings related to the matching algorithm.

- `minimumAnswers`: The minimum number of voter answers needed before matching results are available.
- `organizationMatching`: The method with which parties are matched. The options are:
  - `none`: no party matching is done
  - `answersOnly`: matching is only performed on the parties explicit answers
  - `impute`: missing party answers are substituted with an anwswer imputed from the party's candidates' answers.

### `questions`

Settings related to the question view.

- `categoryIntros`: Settings related to the optional category intro pages.
  - `allowSkip`: Whether to allow the user to skip the whole category.
  - `show`: Whether to show category intro pages before the first question of each category.
- `interactiveInfo`: Settings related to the interactive info view for each question.
  - `enabled`: Default `false`.
- `questionsIntro`: Settings related to the optional questions intro page, shown before going to questions.
  - `allowCategorySelection`: Whether to allow the user to select which categories to answer if there are more than one. NB. If the app has multiple elections with different question applicable to each, category selection may result in cases where the user does not select enough questions to get any results for one or more elections, regardless of the minimum number of answers required. In such cases, consider setting this to `false`.
  - `show`: Whether to show the questions intro page.
- `showCategoryTags`: Whether to show the category tag along the question text.
- `showResultsLink`: Whether to the link to results in the header when answering questions if enough answers are provided.

### `results`

Settings related to the results view.

- `cardContents`: Settings related to the contents of the entity cards in the results list and entity details.
  - `candidate`: The additional contents of candidate cards. NB. the order of the items has currently no effect. Possible values:
    - `submatches`: Show the entity's answer to a specific question. Only applies to the results list.
    - Question answer, defined by three properties:
      - `question`: The question's id.
      - `hideLabel`: Whether to hide the question label in the card.
      - `format`: How to format the answer. Possible values:
        - `default`: use the same format as in entity details.
        - `tag`: format the answers as a pill or tag.
- `organization`: The additional contents of party cards. NB. the order of the items has currently no effect. Possible values:
  - `candidates`: List the party's the top 3 candidates within it's card. Only applies to the results list.
  - `submatches`
  - Question answer
- `sections`: Which entity types to show in the results view. There must be at least one.
- `showFeedbackPopup`: If defined, a feedback popup will be shown on the next page load, when the user has reached the results section and the number of seconds given by this value has passed. The popup will not be shown, if the user has already given some feedback.
- `showSurveyPopup`: The delay in seconds after which a survey popup will be shown on the next page load, when the user has reached the results section. The popup will only be shown if the relevant `analytics.survey` settings are defined and if the user has not already opened the survey.

### `elections`

Settings related to election and constituency selection in VAAs with multiple elections. These have no effect if there is just one election.

- `disallowSelection`: If `true` all elections are selected by default.
- `showElectionTags`: Whether to show the election tags along the question text.
- `startFromConstituencyGroup`: If `true` and there are multiple elections, the constituency selection page with this `ConstituencyGroup` as the only option will be shown first and the possible election selection only afterwards. Only those elections that are applicable to the selected constituency or its ancestors are shown. Election selection will be bypassed the same way as normally.

### `access`

Settings related to access to the applications.

- `candidateApp`: If `true`, the Candidate App can be accessed.
- `answersLocked`: If `true`, candidates can no longer edit their answers.
- `voterApp`: If `true`, the Voter App can be accessed.
- `adminApp`: If `true`, the Admin App can be accessed.
- `underMaintenance`: If `true`, an under maintenance error page will be shown when attempting to access any part of the app.

### `notifications`

Settings related to important notifications shown to users.

- `candidateApp`: The notification shown to users of the Candidate App. Defined by the properties:
  - `show`: If `true`, the notification will be shown the next time the user loads the app.
  - `title`: The title of the notification.
  - `content`: The content of the notification.
  - `icon`: The `Icon.name` to display in the notification.
- `voterApp`: The notification shown to users of the Voter App.
