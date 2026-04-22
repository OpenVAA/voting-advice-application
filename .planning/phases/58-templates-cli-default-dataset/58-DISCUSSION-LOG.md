# Phase 58: Templates, CLI & Default Dataset - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 58-templates-cli-default-dataset
**Areas discussed:** Default template content, Portraits (GEN-09/10), CLI surface, e2e template + docs + teardown

---

## Default template content

### Q1: Party flavor in the default template?
| Option | Description | Selected |
|--------|-------------|----------|
| Finnish-real by name (Kokoomus, SDP, …) | 8 canonical Finnish parties | |
| Generic (Party A–H) | Letter-named placeholders | |
| Fantasy names | English invented parties | |

**User's choice:** Other — "Base on the gist of the Finnish names but don't use real ones"
**Interpretation:** Invented parties with Finnish cultural flavor, no real names.

### Q2: Exact entity counts for `default` template?
| Option | Description | Selected |
|--------|-------------|----------|
| 6 const / 8 parties / 40 cands / 20 q / 4 cats | Matches success criterion verbatim | |
| Fewer for speed (4/8/32/16/3) | Trims for NF-01 margin | |
| 13 const / 8 parties / 60 cands / 24 q / 4 cats | Finnish Eduskunta districts | |

**User's choice:** Other — "3 with 100 candidates, spread non-uniformly along parties"
**Interpretation:** 13 constituencies / 8 parties / 100 candidates (non-uniform distribution) / 24 questions / 4 categories.

### Q3: Default value of `generateTranslationsForAllLocales`?
| Option | Description | Selected |
|--------|-------------|----------|
| false — default-locale only | Fastest seed | |
| true — all supportedLocales (en/fi/sv/da) | Full multilingual first-run | ✓ |

**User's choice:** true — all supportedLocales

### Q4: Question mix across types?
| Option | Description | Selected |
|--------|-------------|----------|
| Mostly ordinal Likert + a few categorical (16/4) | Drives latent clustering | |
| Ordinal only (20 Likert) | Simplest | |
| Mixed everything (12 L / 4 cat / 2 mc / 1 bool / 1 num) | Full type coverage | |

**User's choice:** Other — "3 but no number"
**Interpretation:** Mixed everything minus number question type; exact split planner's call within "majority Likert, some categorical + multi-choice + 1 boolean" spirit (total 24 questions per Q2).

---

## Portraits (GEN-09/10)

### Q1: Where do the curated portrait images come from?
| Option | Description | Selected |
|--------|-------------|----------|
| thispersondoesnotexist.com (public domain) | AI-generated, no attribution | ✓ |
| Unsplash free license | Real portraits with attribution | |
| DiverseUI / open portrait libraries | Curated UI-design sets | |
| SVG placeholder avatars (initials) | No image files in repo | |

**User's choice:** thispersondoesnotexist.com
**User note:** "download 30"

### Q2: Batch size for the curated pool?
| Option | Description | Selected |
|--------|-------------|----------|
| ~20 portraits | 5 cycles over 100 cands | |
| ~40 portraits | Less visible repetition; more repo weight | |
| ~10 portraits | Bare minimum | |

**User's choice:** Other — "30"

### Q3: Portrait upload mechanics during seed?
| Option | Description | Selected |
|--------|-------------|----------|
| Service-role Storage upload to public-assets bucket | Matches production flow | ✓ |
| Embed base64 in candidates.image_id directly | Skip Storage | |
| Public URL to external host | No local upload | |

**User's choice:** Service-role Storage upload to public-assets bucket

### Q4: How does `seed:teardown` handle portrait files?
| Option | Description | Selected |
|--------|-------------|----------|
| Delete by key prefix | List bucket, match `${externalIdPrefix}*` | |
| Leave files; trust cleanup trigger | Schema trigger cascades on row delete | |
| `--dry-run` + prompt | Safer; breaks non-interactive usage | |

**User's choice:** Other — "Try with 2 and if it doesnt work, 1"
**Interpretation:** First try trigger-based cleanup; if orphan files remain, fall back to prefix-based deletion.

---

## CLI surface

### Q1: Commands surface?
| Option | Description | Selected |
|--------|-------------|----------|
| Package commands + root `dev:reset-with-data` only | Minimal root surface | |
| Also add root `dev:seed` + `dev:seed:teardown` aliases | Full root shortcuts | ✓ |
| Package-only (no root alias) | Clean boundary | |

**User's choice:** Also add root `dev:seed` and `dev:seed:teardown` aliases

### Q2: How does `--template` resolve name-vs-path?
| Option | Description | Selected |
|--------|-------------|----------|
| Try built-in name first; fall back to filesystem path | Name-first with path fallback | ✓ |
| Explicit flag: `--template <name>` vs `--template-file <path>` | Two flags, zero ambiguity | |
| Path always; built-in names are shorthands resolved internally | | |

**User's choice:** Try built-in name first; fall back to filesystem path

### Q3: How does the CLI load a `.ts` / `.js` / `.json` template file?
| Option | Description | Selected |
|--------|-------------|----------|
| tsx runner handles .ts+.js; JSON via fs.readFile+JSON.parse | Reuse existing tsx | ✓ |
| `jiti` for unified loading | Unified loader; new dep | |
| .ts/.js only; JSON unsupported | Drops TMPL-06 | |

**User's choice:** tsx runner handles .ts + .js; JSON via fs.readFile + JSON.parse

### Q4: Error handling + `--help` + summary output shape?
| Option | Description | Selected |
|--------|-------------|----------|
| Structured: fail-fast with actionable messages; table on success | Full DX polish | ✓ |
| Minimal: console.error + process.exit(1); silent success | Smallest surface | |
| JSON output mode (-o json) + human mode | CI-ready machine output | |

**User's choice:** Structured: fail-fast with actionable messages; success prints table

---

## e2e template + docs + teardown

### Q1: How is the `e2e` built-in template authored?
| Option | Description | Selected |
|--------|-------------|----------|
| Audit Playwright specs; hand-write template to match | Highest fidelity; most upfront | ✓ |
| Mechanically port JSON fixtures | Field-for-field translation | |
| Phase 59 picks — defer | Out of Phase 58 scope | |

**User's choice:** Audit Playwright specs for testIds + relational assertions

### Q2: `dev:reset-with-data` composition?
| Option | Description | Selected |
|--------|-------------|----------|
| `yarn supabase:reset && yarn dev:seed --template default` | Two-step chain | ✓ |
| Single shell script with error handling | Explicit bash script | |
| Node script orchestrating via child_process.execSync | Cross-platform safe | |

**User's choice:** `yarn supabase:reset && yarn dev:seed --template default`

### Q3: Teardown safety — prefix check strictness?
| Option | Description | Selected |
|--------|-------------|----------|
| Strict: shape-check rows before delete | Paranoid; prevents accidental deletion | |
| Permissive: delete everything with the prefix | Trust the prefix as the contract | ✓ |
| `--dry-run` flag (opt-in) | Orthogonal; lists before delete | |

**User's choice:** Permissive: delete everything with the prefix

### Q4: Where do DX-01 + DX-04 docs live?
| Option | Description | Selected |
|--------|-------------|----------|
| README + CLAUDE.md + JSDoc | Three doc homes | ✓ |
| CLAUDE.md + JSDoc only | No package README | |
| Dedicated `docs/seed-templates.md` | Standalone authoring guide | |

**User's choice:** Option 1 (README + CLAUDE.md + JSDoc)
**User note:** "mark for later that the docs package needs to be udpated" — recorded in deferred section.

---

## Deferred Ideas

- `apps/docs/` (SvelteKit docs site) update for dev-seed template authoring — future housekeeping milestone
- JSON output mode for CLI (`--output json`)
- `--dry-run` flag for `seed:teardown`
- Mechanical port of JSON fixtures to e2e template
- Strict shape-check teardown
- Non-portrait media seeding
- Storage-upload retries / idempotency
- Template editor UI / generator
