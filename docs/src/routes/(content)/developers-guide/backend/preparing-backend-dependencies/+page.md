# Preparing backend dependencies

The backend module depends on `@openvaa/app-shared` and you need to build it prior to using `@openvaa/strapi` directly (no need if you use it via Docker):

```bash
yarn workspace @openvaa/app-shared install
yarn workspace @openvaa/app-shared build
```
