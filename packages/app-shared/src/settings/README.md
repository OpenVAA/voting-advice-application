# Settings

> See also the online docs:
>
> - [Static settings](https://openvaa.org/developers-guide/configuration/static-settings) (or [locally](</apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md>))
> - [App Settings](https://openvaa.org/developers-guide/configuration/app-settings) (or [locally](</apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md>))

This directory contains the configuration system for OpenVAA, including both static and dynamic settings.

## Files

- `staticSettings.ts` - Hardcoded values like colors, fonts, supported locales, etc.
- `dynamicSettings.ts` - Runtime-configurable values like election data and feature flags
- `staticSettings.schema.ts` - The strict schema the build validates the static settings with
- `resolveStaticSettings.ts` - The merge of an instance overlay over the static settings and its validation, run by the build

A deployment overlays the static settings without editing `staticSettings.ts`, with `instance/staticSettings.json` at the repository root. The package build merges it over `staticSettings.ts` with `resolveStaticSettings` and fails when the result does not satisfy `StaticSettingsSchema`. See [`instance/README.md`](/instance/README.md).

See the documentation links above for detailed information on how to use and customize these settings.

When editing the settings, make sure to update the documentation.
