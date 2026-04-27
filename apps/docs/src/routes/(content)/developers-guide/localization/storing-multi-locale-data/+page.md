# Storing multi-locale data

The data model expects single-locale data to be displayed by most frontend components and when transferred between modules. The backend as well as Admin and Candidate Apps, however, deal with multi-locale data.

Some common such data types are defined in the [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/localized.type.ts) module. The types prefixed with `Localized` are multi-locale versions of the basic data types.
