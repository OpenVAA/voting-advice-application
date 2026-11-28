/**
 * Static --help output for `yarn workspace @openvaa/dev-seed seed`.
 * documents every flag + lists built-in templates + points to the custom-template authoring README.
 *
 * The built-in template list is HARDCODED here rather than derived from BUILT_IN_TEMPLATES to keep `--help` fast (no module import) and to avoid coupling help output to the template map's initialization order.
 * ⚠ Adding a built-in => update this file in the same commit.
 */

export const USAGE = `Usage: yarn workspace @openvaa/dev-seed seed [options]

Seeds the active local Supabase with template-driven synthetic data
(candidates, organizations, elections, questions, nominations, portraits).

Options:
  -t, --template <name-or-path>    Template to apply. Built-in names resolve first;
                                    paths ending in .ts/.js/.json load from filesystem.
                                    [default: default]
      --seed <integer>              Override template.seed for deterministic RNG.
      --external-id-prefix <str>    Override generator's external_id prefix
                                    (default 'seed_'). To remove rows seeded
                                    under it later, pass the SAME value to
                                    seed:teardown, whose flag is --prefix
                                    (--external-id-prefix is accepted too).
      --project-id <uuid>           Seed into this project instead of the
                                    template's projectId (default
                                    00000000-0000-0000-0000-000000000001).
                                    Required for a non-local host: pass the
                                    deployment's public_project_id.
      --allow-remote                Permit a non-local Supabase host for this
                                    invocation; requires --project-id. Without
                                    it the service-role client only accepts
                                    localhost, 127.0.0.0/8, [::1],
                                    host.docker.internal, kong and
                                    supabase_kong_<project>.
  -h, --help                        Show this help and exit.

Built-in templates:
  default              Finnish-flavored election, 5 constituencies / 8 organizations /
                       327 candidates / 26 questions, every locale in LOCALES
                       (currently en, fi, sv).
  e2e/base             Canonical Playwright base dataset, single-locale.
  perm-*               Settings/topology-permutation fixtures
                       (see packages/dev-seed/src/templates/index.ts).
  smoke                1001 candidates + 1001 nominations in one project, no auth
                       user; for a hosted project (--allow-remote --project-id),
                       prefix smoke_.

Custom templates:
  See packages/dev-seed/README.md for a worked authoring example
  (fixed[] + count, locale fan-out, latent overrides).

Environment:
  SUPABASE_URL                      Supabase instance URL (e.g. http://127.0.0.1:54321)
                                    Falls back to PUBLIC_SUPABASE_URL when unset.
  SUPABASE_SERVICE_ROLE_KEY         Service-role key for bypassing RLS
                                    (from \`yarn db:status\`, never committed).
  DEV_SEED_ALLOW_REMOTE             Set to 1 (or true) to permit a non-local host,
                                    like --allow-remote, and also requires
                                    --project-id. Set it per invocation,
                                    never in the repo-root \`.env\`.
  The repo-root \`.env\` file is auto-loaded at startup, so variables defined there
  (PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) take effect without \`export\`.
`;
