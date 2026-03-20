# App Customization

App customization includes settings that do not affect the functionality of the app, such as, publisher logo, front page image, translation overrides and frequently asked questions of the candidate app. App customization is loaded from the backend via the Data API.

## Adding New Customization Options

1. Add the new option to `AppCustomization` type in [global.d.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/types/global.d.ts).
2. Add the option to the backend (database column or configuration).
3. Update the relevant `DataProvider` implementation to fetch and return the new option.
