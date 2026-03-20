# Troubleshooting

If you can't find an answer to your problem below, feel free to reach us via Github [Discussions](https://github.com/OpenVAA/voting-advice-application/discussions).

## Commit error: 'Husky not found'

Try running `npx husky install`.

If that doesn't work, you may need to add these lines to the start of the untracked `/.husky/_/husky.sh` file:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

## Commit error: 'TypeError: Cannot read properties of undefined (reading 'font')' error when running `/generateTranslationKeyType.ts`

Try running `yarn build:app-shared` first.

## Supabase: Backend services not starting

Try running `yarn dev:reset` to reset the database. If that doesn't help, stop all services with `supabase stop` and restart with `supabase start` in the `apps/supabase/` directory.

## Supabase: Database connection issues

Check that ports 54321-54324 are not in use by another process. Supabase port configuration is in `apps/supabase/supabase/config.toml`.

## Supabase: Seed data not loading

Run `yarn dev:reset` which runs `supabase db reset`, applying all migrations and executing `apps/supabase/supabase/seed.sql`.

## Frontend: Candidate registration fails with 'Bad Request' error

The `email` property is required for a `Candidate`. If it is not set, registration will result in a 'Bad Request' error.

## Frontend: Server error when trying to access frontend

It takes a moment for Supabase services to fully start. If you just ran `yarn dev`, wait a few seconds and try again. Check `supabase status` to verify all services are running.

## Playwright: `TimeoutError` when locating elements and running the tests locally

Elements are currently located mostly by their translated labels with hardcoded locales, which match those in the mock data. If, however, the `supportedLocales` you have set in [staticSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) differ from the ones used by the tests, many of them will fail.
