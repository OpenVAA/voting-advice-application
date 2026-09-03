# @openvaa/dev-seed

Template-driven dev data generator for OpenVAA local development.

Populates a freshly-reset local Supabase with realistic OpenVAA data
(candidates, organizations, elections, questions, nominations, portraits) in one
command. Designed for contributor ergonomics: a `{}` template produces a valid
trivial dataset; the `default` template produces a browseable Finnish-flavored
VAA demo across four locales.

## Quick Start

```bash
# From repo root
yarn db:reset-with-data            # db reset + default template (DB only)
yarn db:seed --template e2e/base   # E2E test data for manual Playwright runs
yarn db:seed:teardown              # remove all seed_-prefixed rows + portraits
```

`yarn db:reset-with-data` is the fast path for a fresh local DB state — it
composes `yarn db:reset` (runs migrations + `seed.sql` bootstrap) with
`yarn db:seed --template default` in one step. It touches the
database only; for a full-stack reset that also wipes the vite cache and
relaunches, use `yarn dev:reset-with-data`.

## Commands

| Command                                                 | What it does                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `yarn db:reset-with-data`                               | `yarn db:reset && yarn db:seed --template default` (composed; DB only)                |
| `yarn db:seed --template <name-or-path>`                | Seed a local Supabase with the named built-in or the filesystem template              |
| `yarn db:seed:teardown`                                 | Delete every generator-produced row (prefix `seed_`) + clean portrait Storage objects |
| `yarn workspace @openvaa/dev-seed seed --help`          | Full flag reference                                                                   |
| `yarn workspace @openvaa/dev-seed seed:teardown --help` | Teardown flag reference                                                               |

The `db:seed*` scripts bubble up from root `package.json` so contributors
never have to type `yarn workspace @openvaa/dev-seed ...` for common operations.

## Flag Reference

### `seed` (primary command)

| Flag                              | Type   | Default       | Purpose                                                                                     |
| --------------------------------- | ------ | ------------- | ------------------------------------------------------------------------------------------- |
| `-t`, `--template <name-or-path>` | string | `default`     | Built-in name (`default`, `e2e/base`, `perm-*`) OR filesystem path (`./my.ts`, `/abs.json`) |
| `--seed <integer>`                | number | from template | Faker RNG seed override (determinism)                                                       |
| `--external-id-prefix <str>`      | string | `seed_`       | Override for the `external_id` prefix on every row (teardown filter contract)               |
| `-h`, `--help`                    | flag   | —             | Show help and exit                                                                          |

Template argument resolution (name-first, path-fallback):

1. Starts with `./`, `/`, or `../` → treat as filesystem path.
2. Ends in `.ts`, `.js`, or `.json` → treat as filesystem path.
3. Otherwise → look up as a built-in template name.
4. Built-in lookup miss → error lists built-ins and suggests path form.

### `seed:teardown`

| Flag             | Type   | Default | Purpose                                           |
| ---------------- | ------ | ------- | ------------------------------------------------- |
| `--prefix <str>` | string | `seed_` | `external_id` prefix to match. Must be ≥ 2 chars. |
| `-h`, `--help`   | flag   | —       | Show help and exit                                |

Teardown is permissive by design: it trusts the `external_id` prefix
as the contract and does NOT shape-check individual rows. A user who mixes
hand-curated data with the same prefix gets it deleted. Use a distinct prefix
for hand-curated data to keep it safe. The 2-char minimum (T-58-07-02) prevents
accidental mass-delete from a single-character prefix.

## Built-in Templates

### `default`

A realistic Finnish-flavored parliamentary election:

- 1 election, 1 constituency group, 5 constituencies (invented Finnish-flavored
  names — NOT real electoral districts)
- 8 organizations (invented — Blue Coalition, Green Wing, Social Democrats Union,
  Rural Alliance, People's Movement, Red Front, Coastal Party, Values Coalition)
- 327 candidates non-uniformly distributed across organizations (weights
  `[61, 56, 49, 43, 38, 33, 26, 21]` — sorted descending, realistic feel)
- 26 questions (18 ordinal Likert + 5 single-choice categorical + 1 boolean +
  1 number + 1 multiple-choice categorical) across 4 opinion categories
- All 4 locales populated (`generateTranslationsForAllLocales: true` —
  en / fi / sv / da)
- Seed `42` (deterministic — same run produces byte-identical rows)
- 327 portraits cycled from the committed `src/assets/portraits/` pool
  (30 images, public-domain AI-generated — see
  [`src/assets/portraits/LICENSE.md`](./src/assets/portraits/LICENSE.md))

Candidate answers are clustered via the latent-factor emitter (see phase 57)
(`ctx.answerEmitter ??= latentAnswerEmitter(template)`) — organizations get
per-centroid positions in latent space and candidates sample around their
organization's centroid. Matching / political-compass plots show visible clustering
out of the box.

### `e2e/base`

Matches what Playwright specs in `tests/tests/specs/` depend on — same testIds,
same relational wiring contracts. Single-locale
(`generateTranslationsForAllLocales: false`) because Playwright specs generally
test a single locale and 4× JSONB expansion is pure overhead.

The invocation name is `e2e/base`, not a bare `e2e` — the bare name was retired
when the canonical base dataset moved under `src/templates/e2e/`, and
`--template e2e` now errors with the built-in list.

### `perm-*` and `show-feedback-survey`

Minimal-data settings- and topology-permutation fixtures consumed by the
Playwright suite — 28 of the 30 built-ins. Each carries its own distinct
`externalIdPrefix` so per-perm setup and teardown never share a prefix and
cannot race each other in a parallel run. They are E2E fixtures rather than a
demo dataset: seed one only when you are reproducing the spec that owns it. The
authoritative list is the `BUILT_IN_TEMPLATES` map in
[`src/templates/index.ts`](./src/templates/index.ts), which is also what
`--help` points at, so this README never carries a second copy to drift.

## Authoring Custom Templates

Custom templates are plain TypeScript, JavaScript, or JSON files. The
`--template` flag loads any file with a `.ts`, `.js`, or `.json` extension OR
any path starting with `./`, `/`, or `../`.

### Worked example: mixing `fixed[]` + `count` (TMPL-03)

Create a file `my-template.ts`:

```ts
import type { Template } from '@openvaa/dev-seed';

const template: Template = {
  seed: 100, // deterministic — same seed = same rows
  externalIdPrefix: 'demo_', // teardown filters on this
  generateTranslationsForAllLocales: false, // single-locale; expand to true for full 4-locale

  elections: {
    count: 0, // suppress synthetic; fixed[] fully describes
    fixed: [
      {
        external_id: 'election_2026',
        name: { en: 'My Demo Election' },
        election_date: '2026-11-01',
        election_type: 'general'
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [{ external_id: 'cg_1', name: { en: 'Districts' } }]
  },

  constituencies: {
    count: 5 // 5 synthetic constituencies — names generated
  },

  organizations: {
    count: 4, // 4 total
    fixed: [
      // — 2 hand-authored, 2 synthetic
      { external_id: 'org_a', name: { en: 'Alpha Party' }, color: '#2546a8' },
      { external_id: 'org_b', name: { en: 'Beta Party' }, color: '#a82525' }
    ]
  },

  candidates: {
    count: 20 // 20 synthetic candidates
  },

  question_categories: {
    count: 2
  },

  questions: {
    count: 8
  },

  nominations: {
    count: 20
  }
};

export default template;
```

Run it:

```bash
yarn db:seed --template ./my-template.ts
```

Check the terminal summary for the rows-per-table breakdown and elapsed time.

### TMPL-03 mixing rule

When both `count` and `fixed` are provided on a collection:

- `fixed[]` rows are emitted verbatim (your hand-authored content).
- The generator fills the remaining `count - fixed.length` rows synthetically.
- Example: `{ count: 8, fixed: [...2 entries...] }` produces 2 hand-authored +
  6 synthetic = 8 total.
- Set `count: 0` with a populated `fixed[]` when you want ONLY hand-authored
  rows and no synthetic filler (this is what the `default` template does for
  elections / constituencies / organizations / question_categories).

### Overrides (advanced)

For per-table logic beyond `fixed[]` (e.g. non-uniform distribution, custom
type rotation), ship an `Overrides` map alongside the template and invoke the
pipeline programmatically:

```ts
import { runPipeline, type Overrides, type Template } from '@openvaa/dev-seed';

const template: Template = {
  /* ... */
};

const overrides: Overrides = {
  candidates: (_fragment, ctx) => {
    // Full control — return rows directly from the function.
    // Reads ctx.faker, ctx.refs.organizations, ctx.externalIdPrefix.
    // See packages/dev-seed/src/templates/defaults/candidates-override.ts
    // for the built-in `default` template's non-uniform distribution.
    return [
      /* your rows */
    ];
  }
};

await runPipeline(template, overrides);
```

The built-in `default` template ships its own overrides
(`candidates-override.ts` for the `[61, 56, 49, 43, 38, 33, 26, 21]` organization
weighting; `questions-override.ts` for the question-type mix) and
wires them via `BUILT_IN_OVERRIDES` (see
[`src/templates/index.ts`](./src/templates/index.ts)).

### Template shape reference

Every `Template` field is documented via JSDoc on the
[`Template` TypeScript type](./src/template/types.ts). Hover over `Template`
in your IDE to see field-level docs. Key top-level fields:

- `seed: number` — deterministic RNG seed (NF-04).
- `refDate: string` — ISO datetime anchoring every generated date; defaults to
  the exported `SEED_REF_DATE`. Dates are drawn relative to this anchor rather
  than to the system clock, so the same seed emits the same dates on any
  calendar day.
- `externalIdPrefix: string` — teardown filter + row prefix (GEN-04).
- `projectId: string` — bootstrap project UUID (defaults to seed.sql bootstrap).
- `generateTranslationsForAllLocales: boolean` — 4-locale expansion
  (en / fi / sv / da per `staticSettings.supportedLocales`).
- `latent: { dimensions, eigenvalues, centroids, spread, loadings, noise }` —
  latent-factor emitter config (see phase 57).
- Per-entity `{ count?, fixed? }` fragments for each of the 12 non-system
  public tables: `elections`, `constituency_groups`, `constituencies`,
  `organizations`, `alliances`, `factions`, `candidates`, `question_categories`,
  `questions`, `nominations`, `app_settings`, `feedback`.

## Environment

Requires:

- `SUPABASE_URL` (e.g. `http://127.0.0.1:54321`) — set automatically by
  `supabase start`.
- `SUPABASE_SERVICE_ROLE_KEY` — set automatically by `supabase start`;
  readable via `yarn db:status`.

Missing env → `seed` exits 1 with an actionable message: the `Writer`
constructor enforces both at construction time (NF-02), before any client is
built. **`seed:teardown` does not go through the `Writer`** — it constructs
`SupabaseAdminClient` directly, and that module falls back to
`http://localhost:54321` and the published Supabase CLI demo service-role key
when either variable is unset. So an unset environment makes teardown act on the
local instance rather than fail; it never makes it act on nothing.

Both CLIs also fall back to `PUBLIC_SUPABASE_URL` when `SUPABASE_URL` is unset,
and auto-load the repo-root `.env`. See the warning under Security Notes: that
fallback is the frontend's variable, so what is in your `.env` decides what these
commands act on.

## Security Notes

**Custom templates execute developer-authored code.** Passing `--template <path>`
with a `.ts` or `.js` file loads the module via dynamic `import()`, which
executes any top-level code in the file. This is the SAME trust model as
`tsx` / `ts-node`: do NOT pass `--template` with paths to untrusted files.
JSON templates (`.json` extension) parse as pure data and cannot execute code
(T-58-05-02).

**These commands act on whatever `SUPABASE_URL` names, and nothing checks that it
is local.** Both CLIs auto-load the repo-root `.env` and, when `SUPABASE_URL` is
unset, fall back to `PUBLIC_SUPABASE_URL` — the _deployed frontend's_ variable.
A repo-root `.env` pointing at a staging or production Supabase therefore
silently retargets both `db:seed` and `db:seed:teardown` at it, using a
service-role client that bypasses RLS. `db:seed:teardown` is the one that hurts:
it deletes every row whose `external_id` matches the prefix across 10 content
tables.

The guards that do exist, so you know what you are relying on:

- The `external_id` prefix scopes teardown; nothing outside it is touched.
- `assertTeardownPrefix` refuses a prefix shorter than 2 characters, which is
  what stops a `LIKE '%'`-adjacent mass delete (T-58-07-02).
- `accounts`, `projects`, `feedback` and `app_settings` are not in the teardown
  set at all, so bootstrap rows survive.

There is **no locality check** among them. Before running either command, confirm
what `SUPABASE_URL` resolves to — `yarn db:status` prints the local one. This is
a local-development and CI tool; it is not intended to run against production.

**Custom templates run with that same service-role client.** The two facts
compose: a template is developer-authored code, and it executes against whatever
instance the environment names.

## Troubleshooting

**`Error: SUPABASE_URL env var is required but not set.`**
Run `yarn db:start` first.

**`Error: Cannot reach Supabase at http://127.0.0.1:54321. Is 'supabase start' running?`**
Check `yarn db:status`. If services are down, run `yarn db:start`.

**`Unknown template: 'foo'. Built-in templates: default, e2e/base, perm-1e1cg1co, ...`**
Either use a known built-in name — the message lists all 30 — or pass a
filesystem path starting with `./`, `/`, or `../` (or a path ending in
`.ts` / `.js` / `.json`). Note `e2e/base`: a bare `e2e` is the retired name and
lands here.

**`Template validation failed: template.candidates.count: Expected number, received string`**
The field path tells you the offending key. Fix the type and re-run.
Zod errors (TMPL-09) include field paths for every violation.

**Teardown leaves rows behind.**
Check the `external_id` prefix — teardown filters on `external_id LIKE ${prefix}%`.
If your rows use a different prefix, pass `--prefix <your-prefix>`. The
2-char minimum guard (T-58-07-02) prevents accidental mass-delete from a
single-character prefix.

**Portrait upload fails mid-run.**
Storage upload failure is a seed-blocking error (not a warning) — the run
aborts (exit 1). Re-run after fixing the Storage bucket state
(`yarn db:reset` is the safest way to return to a clean slate).

## Related Docs

- `@openvaa/dev-seed` pipeline foundations — see phase 56
- Latent-factor answer model — see phase 57
- Templates, CLI and default dataset — see phase 58
- Portrait licensing: [`./src/assets/portraits/LICENSE.md`](./src/assets/portraits/LICENSE.md)
- CLAUDE.md, "Seeding local data" — short snippet in root `CLAUDE.md` Common
  Workflows section (DX-04 entry point for AI pair-programmers).
