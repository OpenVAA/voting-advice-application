# `@openvaa/strapi-admin-tools`: OpenVAA admin tools plugin for Strapi

> NB! The name of the plugin in Strapi is `openvaa-admin-tools`.

The plugin combines Strapi admin functions needed by the OpenVAA voting advice application.

## Status: preliminary

Only some of the custom functions are currently contained in the plugin. Functions that should be migrated from the `@openvaa/strapi` include:

- Mock data generation
- Loading default settings and customization
- Candidate registration
- Candidate preregistration

## Installation

The plugin is a local plugin and not currently published as an NPM package.

It is enabled by default in `@openvaa/strapi`’s [plugin config](backend/vaa-strapi/config/plugins.ts):

```ts
export default ({ env }) => {
  return {
    // Other plugins
    'openvaa-admin-tools': {
      enabled: true,
      resolve: 'src/plugins/openvaa-admin-tools',
    },
  };
};
```

## Developing

1. Enable [hot-reloading](/docs/docker-setup-guide.md#hot-reloading) in Strapi.
2. Watch plugin source for edits by running `yarn workspace @openvaa/strapi-admin-tools watch`.

> NB! Before merging it’s safest to also try the plugin in the production environment as well, because some (unstable) Strapi function may not work there. To do that set `services.strapi.build.target=production` in [docker-compose](/backend/vaa-strapi/docker-compose.dev.yml).

## Usage

The plugin functions are accessed via the Strapi Admin UI. There are currenlty two types of functions:

1. Registration email functions which appear on the right-hand column in the Content manager Candidate list view and single Candidate view.
2. Data import and deletion which are accessed via the admin tool page, which is opened with the jigsaw icon in the main navigation.

The services can also be invoked like any other plugins services with, e.g., `strapi.plugin('openvaa-admin-tools').service('data').import(data)`.

## Functions

### Registration email

#### Send the registration email to a single Candidate

- UI: Content manager > Candidates > Edit view
- Component: [RegistrationEmailToOne](admin/src/components/RegistrationEmailToOne.tsx)
- Service: [`email.sendEmail`](server/src/services/email.ts)
- API: `/openvaa-admin-tools/send-email`

Sends a registration link email with customizable content and subject to the Candidate.

Throws if the content does not include the link placeholder.

#### Send the registration email to all unregistered Candidates

- UI: Content manager > Candidates > List view
- Component: [RegistrationEmailToAll](admin/src/components/RegistrationEmailToAll.tsx)
- Service: [`email.sendEmailToUnregistered`](server/src/services/email.ts)
- API: `/openvaa-admin-tools//send-email-to-unregistered`
- Required permission: `plugin::openvaa-admin-tools.send-email`

Sends a registration link email with customizable content and subject to all unregisterd Candidates.

Throws if the content does not include the link placeholder.

### Import and delete data

The `externalId` is a private field that all collection types have which is used to store a stable id which can be referenced instead of the `documentId` in the import and delete functions.

#### Import any data in JSON format

- UI: OpenVAA Admin Tools page
- Component: [ImportData](admin/src/components/ImportData.tsx)
- Service: [`data.import`](server/src/services/data.ts)
- API: `/openvaa-admin-tools/import-data`
- Required permission: `plugin::openvaa-admin-tools.import-data`

Import data into Strapi or update existing data based on `externalId` or `documentId` if provided. The data is supplied as `Array`s of `ImportData` objects collected by their collection name.

See the instructions in the component for further info.

#### Delete any data by its `externalId`

- UI: OpenVAA Admin Tools page
- Component: [DeleteData](admin/src/components/DeleteData.tsx)
- Service: [`data.delete`](server/src/services/data.ts)
- API: `/openvaa-admin-tools/delete-data`
- Required permission: `plugin::openvaa-admin-tools.import-data`

Delete data based on `externalId`s. Objects whose `externalId`s (specified by collection) start with the provided, case-sensitive prefixes will be deleted. Mostly useful for deleting mock data which is generated with `externalId`s starting with `mock-`.

See the instructions in the component for further info.

#### Find any data using `filters`

- UI: OpenVAA Admin Tools page
- Component: [FindData](admin/src/components/FindData.tsx)
- Service: [`data.find`](server/src/services/data.ts)
- API: `/openvaa-admin-tools/find-data`
- Required permission: `plugin::openvaa-admin-tools.import-data`

Find any data accesible by the data tools by providing arbitrary filters.

See the instructions in the component for further info.

#### Send email to selected Candidates

- UI: OpenVAA Admin Tools page
- Component: [SendEmail](admin/src/components/SendEmail.tsx)
- Services:
  - [`data.findCandidates`](server/src/services/data.ts)
  - [`email.sendEmail`](server/src/services/email.ts)
- APIs:
  - `/openvaa-admin-tools/find-candidates`
  - `/openvaa-admin-tools/send-email`
- Required permissions:
  - `plugin::openvaa-admin-tools.import-data`
  - `plugin::openvaa-admin-tools.send-email`

A tool that combines searching for Candidates to build an editable list to whom to send emails.

See the instructions in the component for further info.

## Access control

In addition to the specified permissions, all routes require `admin::isAuthenticatedAdmin`, see [route policies](server/src/routes/admin/index.ts).
