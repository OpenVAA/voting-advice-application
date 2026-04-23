/**
 * Static --help output for `yarn workspace @openvaa/dev-seed seed:teardown`.
 * CLI-04 / D-58-13.
 *
 * The text documents the `--prefix` override, the two env vars the CLI
 * depends on, and the D-58-17 permissive-prefix contract. Listed flags
 * stay in sync with `packages/dev-seed/src/cli/teardown.ts`'s parseArgs
 * options block.
 */

export const TEARDOWN_USAGE = `Usage: yarn workspace @openvaa/dev-seed seed:teardown [options]

Remove every row whose external_id starts with the configured prefix
(default 'seed_') from the 10 supported content tables. Bootstrap rows
in accounts / projects / app_settings / storage_config are preserved.

Also removes candidate portrait files from the public-assets Storage bucket
(Path 2 explicit cleanup — deterministic, does not rely on the async
pg_net AFTER-DELETE trigger).

Options:
      --prefix <str>                external_id prefix to match. Must be at
                                    least 2 characters to prevent accidental
                                    mass-delete. [default: seed_]
  -h, --help                        Show this help and exit.

Environment:
  SUPABASE_URL                      Supabase instance URL (e.g. http://127.0.0.1:54321)
  SUPABASE_SERVICE_ROLE_KEY         Service-role key for bypassing RLS
  Both are set automatically by \`supabase start\`.

Permissive by design (D-58-17):
  seed:teardown trusts the external_id prefix as the contract. It does NOT
  shape-check individual rows. Users who mix hand-curated data with the same
  prefix will have it deleted by teardown. Use a distinct prefix for
  hand-curated data to keep it safe.
`;
