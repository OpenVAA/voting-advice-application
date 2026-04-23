/**
 * Static --help output for `yarn workspace @openvaa/dev-seed seed`.
 * D-58-13: documents every flag + lists built-in templates + points to the
 * custom-template authoring README.
 *
 * The built-in template list is HARDCODED here rather than derived from
 * BUILT_IN_TEMPLATES to keep `--help` fast (no module import) and to avoid
 * coupling help output to Plan 06's template map initialization order.
 * Plan 06 adds new built-ins => update this file in the same commit.
 */

export const USAGE = `Usage: yarn workspace @openvaa/dev-seed seed [options]

Seeds the active local Supabase with template-driven synthetic data
(candidates, parties, elections, questions, nominations, portraits).

Options:
  -t, --template <name-or-path>    Template to apply. Built-in names resolve first;
                                    paths ending in .ts/.js/.json load from filesystem.
                                    [default: default]
      --seed <integer>              Override template.seed for deterministic RNG.
      --external-id-prefix <str>    Override generator's external_id prefix
                                    (default 'seed_'). Teardown filters on this.
  -h, --help                        Show this help and exit.

Built-in templates:
  default   Finnish-flavored election, 13 constituencies / 8 parties /
            100 candidates / 24 questions, 4-locale (en/fi/sv/da).
  e2e       Matches Playwright spec assertions, single-locale.

Custom templates:
  See packages/dev-seed/README.md for a worked authoring example
  (fixed[] + count, locale fan-out, latent overrides).

Environment:
  SUPABASE_URL                      Supabase instance URL (e.g. http://127.0.0.1:54321)
                                    Falls back to PUBLIC_SUPABASE_URL when unset.
  SUPABASE_SERVICE_ROLE_KEY         Service-role key for bypassing RLS
                                    (from \`yarn supabase:status\`, never committed).
  The repo-root \`.env\` file is auto-loaded at startup, so variables defined there
  (PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) take effect without \`export\`.
`;
