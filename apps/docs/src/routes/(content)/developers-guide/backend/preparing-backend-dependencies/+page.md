> **Note:** This page documents the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release.

# Preparing backend dependencies

The backend module depends on `@openvaa/app-shared` and you need to build it prior to using `@openvaa/strapi` directly (no need if you use it via Docker):

```bash
yarn workspace @openvaa/app-shared install
yarn workspace @openvaa/app-shared build
```
