# Data API

> See also the online doc [Data API and adapters](https://openvaa.org/developers-guide/frontend/data-api-and-adapters) (or [locally](</apps/docs/src/routes/(content)/developers-guide/frontend/data-api-and-adapters/+page.md>))

This directory contains the Data API implementation for the OpenVAA frontend, including:

- Data providers for reading public data
- Feedback writers for submitting feedback
- Data writers for authenticated data operations
- Supabase adapter for all data access. `adapters/` here holds only `apiRoute/` and `supabase/` -- there is no client-side local adapter. A local adapter for static data does still exist, but on the server side under `$lib/server/api/adapters/local/`, selected at runtime by `staticSettings.dataAdapter.type === 'local'`

The four modules at the root of this directory -- `dataProvider.ts`, `dataWriter.ts`, `adminWriter.ts` and `feedbackWriter.ts` -- are the only supported way in. Each exports a FACTORY (`createDataProvider`, `createDataWriter`, `createAdminWriter`, `createFeedbackWriter`) that takes a named `AdapterSource` and returns a fresh adapter for ONE request. There is no shared adapter instance: call the factory once per request (or per job).

See the documentation for detailed information on how the Data API works and how to use it.
