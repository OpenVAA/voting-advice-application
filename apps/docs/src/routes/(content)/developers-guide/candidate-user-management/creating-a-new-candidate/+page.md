# Creating a New Candidate

A candidate can log in to the candidate app either by having the admin give them a registration key, registering an account for them, or using pre-registration.

### Using Registration Key

To use the registration code, you need to navigate to the Strapi's admin area (http://localhost:1337), select the "Content Manager" tab, and choose the "Candidates" tab from the dropdown. If a candidate you want to log in as doesn't exist yet, you can use the "Create new entry" button to create one.

Afterward, edit the desired candidate and choose a secure and random value for the registrationKey field. Then, save the change by clicking the "Save" button. The chosen registrationKey should be shared, and then the candidate can navigate to http://localhost:5173/candidate/register to create their account.

### Manually

To create the user manually, you need to navigate to the Strapi's admin area (http://localhost:1337), select the "Content Manager" tab, and choose the "User" tab from the dropdown.

You can create a new user using the "Create new entry" button. The following fields should be set:

- username (any desired username)
- email (any desired email, it'll be used for logging in)
- password (any strong password)
- confirmed => True
- blocked => False
- role => Authenticated
- candidate => the desired candidate the user is linked to

Then, use the "Save" button and you should be able to log in as the candidate at http://localhost:5173/candidate.

### Pre-Registration

In the pre-registration process, anyone can use their bank identity to register as a candidate. When the Voter App is published, those registered users who can be matched to actual candidates in the election can be confirmed to be shown in the app.

This requires a subscription to an identity service provider to work. It is enabled with the `preRegistration.enabled` static setting.

The feature is partially supported.

The documentation is TBA but one can read the notes from the two PRs in which was built:

- [Initial PR 687](https://github.com/OpenVAA/voting-advice-application/pull/687)
- [Enhancement PR 703](https://github.com/OpenVAA/voting-advice-application/pull/703)
