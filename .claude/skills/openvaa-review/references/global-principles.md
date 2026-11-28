# Global principles

Every lens evaluates its slice against these as well as its own criteria. Cite a principle by slug (`G-reuse`, …) in a finding's `criterion` field.

The team's bias is **less code, fewer concepts, one place for each rule**. A PR that adds 40 lines to reuse something is better than one that adds 400 to build something parallel, even if the parallel thing is locally nicer.

| Slug | Principle | What a violation looks like |
| --- | --- | --- |
| `G-reuse` | Reuse what exists. If it doesn't quite fit, generalise it rather than write a sibling. | A new util, context method, component or RPC that does 80% of what an existing one does, with the difference hardcoded. |
| `G-single-source` | One source of truth for business logic and predicates. | The same condition spelt out in two or more places, or a second place deciding something a canonical owner already decides. The owners: `$lib/routes` for paths, `staticSettings` / `dynamicSettings` for configuration, `user_can` for authority, `COLUMN_MAP` / `PROPERTY_MAP` for row mapping, `@openvaa/data` for relations between data objects, `t()` for copy, `SENSITIVE_EVENTS` for analytics sensitivity, and the all-of rule for public visibility (project open, nomination confirmed, every linked entity confirmed). |
| `G-less-code` | Aim for less code, not more. Tests and docs are exempt. Nothing is deployed yet, so no back-compat shims. | New abstraction layers with one caller; options nobody varies; defensive branches for states the types already rule out; a `?? legacyDefault`. The conciseness lens measures the whole PR against this. |
| `G-dry` | Don't repeat yourself. | Copy-pasted blocks differing in one identifier; parallel switch statements over the same union. |
| `G-split-files` | Split complex files into smaller ones collected in the same folder. | A file that grew past ~400 lines or mixes several concerns (types + constants + component + helpers), when the PR added a significant share of that. |
| `G-strict-types` | No `any`. An unavoidable escape is `@ts-expect-error` with its reason. | `any`, `as unknown as`, a non-null `!` on a value the types say can be missing, a cast the adapter casts guard (`assert:adapter-casts`) would catch. |
| `G-invariants` | The CLAUDE.md invariants and `.agents/code-review-checklist.md` are the floor. | A breach of § Context Destructuring Rule, § Results Navigation Invariants, § Comment Hygiene, § E2E Hard Rule, the `PUBLIC_PROJECT_ID` no-fallback rule, or a checklist item. Cite the section. |

Tests live **next to the code they test** (`foo.ts` + `foo.test.ts`, `foo.svelte.ts` + `foo.svelte.test.ts`). E2E specs live under `tests/tests/`, and pgTAP under `apps/supabase/supabase/tests/`. A test placed anywhere else is a tests-lens finding.

## Scope rules for all lenses

- **Judge what the PR introduced or extended.** A pre-existing wart is out of scope unless the PR copied it or built new code on top of it, which spreads it. Say which case applies.
- **Repo rules are the floor.** `CLAUDE.md` and `.agents/code-review-checklist.md` already ran before review (`/openvaa-pr`). If you see one broken anyway, report it and cite the checklist section and item, or the CLAUDE.md section. That is valuable signal that the pre-review gate leaked.
- **Suggest the concrete alternative.** "Could reuse existing code" is not a finding. "Extend `Expander` (`apps/frontend/src/lib/components/expander/`) with a `title` snippet instead of the new `InfoToggle`" is. If you can't name the thing to reuse, you haven't verified it exists.
- **Everything is fixed by default.** A finding is something to change, not something to weigh: the review posts it with a recommended fix, and `/openvaa-review fix` applies that fix unless the reviewer ticks otherwise. So raise only what you would have fixed, and make the recommended option the one you would apply unattended. Two fields place a finding in one of the comment's three blocks:
  - `needs_decision: true` puts it in **Decisions needed**. Set it only when the fixes you offer lead to genuinely different outcomes a reviewer has to choose between (a product behaviour, a policy, a scope, a cost against a benefit) and you could not defend picking one unattended. Write the choice as one question in `decision`, and give every route as an option. A narrow patch versus the general refactor of the same outcome is not a decision: recommend one.
  - `severity: critical` puts it in **Critical**: it breaks a CLAUDE.md invariant, a checklist item or WCAG 2.1 AA; adds a second source of truth for business logic; bypasses authority or project scoping; leaks sensitive analytics; or will force a rewrite once someone builds on it. Its `detail` is shown open, so it says plainly what went wrong and, when a gate (a checklist item, an `assert:*` script, a test) should have caught it, which one.
  - Everything else is `severity: normal` and lands in **Fixed by default**. Most findings are here.
- **Stack slices.** When the PR is a slice of a `ship-review-stack` stack, intermediate states are not expected to build or pass. Never raise a red slice CI, a missing file that a higher slice adds, or a slice's size.

## Lens ownership

When an issue touches several lenses, the most specific lens owns it and the others leave it alone. The consolidator still merges whatever slips through, but each duplicate costs a verifier pass.

| Issue | Owner | Not |
| --- | --- | --- |
| A component forks or bypasses an existing one | components | complexity-reuse |
| A context destructure or a `dataRoot` read alias | components | routes, data-structure-rot |
| A tracked URL read in a `load`, View Transition names, focus after navigation | routes | components, accessibility |
| Domain logic reimplemented in an app, or data-object logic that should be a method | domain-packages | complexity-reuse, conciseness |
| An RPC, trigger or policy duplicating an existing one; RLS shape | database | complexity-reuse, cross-cutting |
| Authority disagreeing across layers; project scoping; visibility; settings merit | cross-cutting | database, server, behaviour |
| Edge Function and SvelteKit server internals | server | database |
| An affordance bypassing the context → adapter chain | behaviour | components, complexity-reuse |
| Event coverage, the event schema, sensitivity, consent gates | analytics | cross-cutting, behaviour |
| A type, settings shape or predicate growing patchwork fields | data-structure-rot | complexity-reuse |
| The same shape repeated 3+ times across the diff | common-patterns | complexity-reuse |
| A name, a naming pair or a cross-layer rename | nomenclature | data-structure-rot |
| Copy, catalogues, content locale, formatting | i18n | components, cross-cutting |
| Keyboard, accessible names, contrast, live regions, axe scan reach | accessibility | components, design |
| Comment wording, TSDoc, the docs site, READMEs, agent docs; the top-down order within a file | docs-comments | every other lens |
| A test that pins, a test gap, a guard that blocks change, the E2E paradigm | tests | every other lens |
| The PR's overall size, and cuts no other lens owns | conciseness | (others' cuts are cross-referenced, not duplicated) |
| A dependency added, upgraded or misplaced | dependencies | complexity-reuse |
| Application logic or a utility duplicating code elsewhere, when none of the above fits | complexity-reuse | |

<!-- skill-link-allow: foo.svelte.test.ts -->
<!-- skill-link-allow: foo.svelte.ts -->
<!-- skill-link-allow: foo.test.ts -->
<!-- skill-link-allow: foo.ts -->
