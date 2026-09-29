---
quick_id: 260922-dd8
phase: quick-260922-dd8
plan: 01
status: complete
subsystem: frontend
tags: [tailwind, tailwind-merge, clsx, concatClass, QuestionChoices, refactor]
completed: 2026-09-22
branch: integration/ship-12-squash
commits:
  - ba924b985 feat(260922-dd8): add a cn helper over clsx + tailwind-merge, configured for this theme
  - a6668d573 refactor(260922-dd8): implement concatClass over cn, behind a self-merge sweep
  - 976090e94 refactor(260922-dd8): name the QuestionChoices display-mode dimming and apply it via cn
  - 884df28de docs(260922-dd8): correct convention 3 for the merge semantics, satisfy comment hygiene
key-files:
  created:
    - apps/frontend/src/lib/utils/components.test.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts
  modified:
    - apps/frontend/package.json
    - yarn.lock
    - apps/frontend/src/lib/utils/components.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - .claude/skills/components/SKILL.md
tech-stack:
  added: [clsx@^2.1.1, tailwind-merge@^3.7.0]
---

# Quick item 260922-dd8: Refactor condition classes in QuestionChoices — Summary

`concatClass` is now implemented over a new `cn` (`clsx` + a `tailwind-merge` instance configured for this repo's replaced theme), and `QuestionChoices`'s display-mode dimming moved out of two scoped pseudo-class rules into a named const applied from a visible predicate.

## What was done

- **`cn`** added to `apps/frontend/src/lib/utils/components.ts`: `twMerge(clsx(...))` over an `extendTailwindMerge` instance. `clsx@^2.1.1` and `tailwind-merge@^3.7.0` are now declared dependencies of `apps/frontend` (`clsx` added no new resolution — it was already in `yarn.lock` as a dependency of `svelte` itself; only `tailwind-merge@3.7.0` was fetched). The registry confirmed the plan's version claim: `latest` is `3.7.0` and **there is no tailwind-merge v4**.
- **`concatClass`** reimplemented over `cn`, keeping its argument order (component's own classes first, caller's last) so the caller wins a conflict, and keeping its four documented behaviours and its inferred return type.
- **`QuestionChoices.svelte`**: the two scoped rules that styled an option neither the voter nor the entity picked are gone; their class set is `UNPICKED_DOT` (plus `UNPICKED_DOT_CHECKBOX`), applied in base + override form. The third rule (`input.entitySelected:disabled:not(:checked)`) and both `class:entitySelected` directives remain.

## The merge configuration is load-bearing, and here is the evidence

Run against a **default-configured `twMerge`** first, **4 of the 20 cases were RED** — measured, not predicted:

| Case | Default-config result | Kind |
|---|---|---|
| `cn('gap-md', 'gap-lg')` | both survived | false negative |
| `cn('p-2', 'p-md')` | both survived | false negative |
| `cn('pl-safelgl', 'pl-0')` | both survived | false negative |
| `cn('border-md', 'border-neutral')` | **`border-md` DROPPED** | false positive — the live `Toggle.svelte` defect |

The other 16 cases were green under the default config. The configuration extends the `spacing` **theme** scale with `app.css`'s word names (so every spacing-driven group picks them up in one place) and adds this project's t-shirt border-width names to the `border-w*` class groups.

## Self-merge identity sweep (Task 2 Group B)

- Population **derived from source at run time: 55** literal class strings passed as the second argument to `concatClass` under `apps/frontend/src`. Not hardcoded; the count is reported, not asserted.
- It found **one divergence**: `HeroEmoji.svelte` lost `truncate` to a later `text-clip` in its own string.
- **Fixed by configuration, per the plan's routing table — not escalated.** `truncate` is a COMPOSITE utility (`overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`), so a single-property utility cannot safely subsume it; evicting it silently takes the `overflow: hidden` too. It now has its own class group and is out of `text-overflow`.

**Group A before/after:** cases 1-6 were GREEN before the reimplementation and are green after (the equivalence proof for the 77 call sites); case 7 — the caller wins a conflict — was RED before (`['h-16','h-32']`) and is green now.

## The `<open_decision>` trip condition DID NOT FIRE

`concatClass` keeps the merging `cn`. The written fallback (plain `clsx` composition with merging `cn` in `QuestionChoices` alone) was **not** taken. No finding was a class this repo uses that tailwind-merge cannot be taught to group correctly *and* whose drop changes what renders.

## Component test cases: which were red before

Written against the unmodified component first; the split was exactly as predicted.

| Case | Before |
|---|---|
| 2 — answer mode, all inputs full size and enabled | **GREEN** |
| 1 — display mode, only the unpicked option dimmed | RED |
| 3 — nothing selected, EVERY option dimmed | RED |
| 4 — multi mode, unselected checkbox dimmed + `rounded-sm` | RED |
| 5 — the override is real (`h-16` present, `h-32` absent) | RED |

One expectation of **mine** was wrong and was corrected, not the component: `border-lg` was initially listed as a full-size discriminator. It is a border **width** and the dimmed const's `border-none` is a border **style** — different properties, so both correctly survive, which is also what the old `@apply border-none` did. A sixth case now pins that coexistence explicitly rather than hiding it as an absence.

## The divergence recorder — outcome

**The recorder ARMED, and the answer is NOT an empty list.**

- Full harvest: `tests/e2e-runs/260922-dd8-armed/cc-divergences.txt`.
- `ARMED` markers observed: **server = 1, client = 35**. The Task 4c assertion exited **0**.
- **Distinct divergent `(own, caller, dropped)` records: 6.**

A note on the harvest, because it nearly produced a false "empty" finding: a plain `grep` over the run directory finds only the **server** channel. Playwright inlines `text/plain` attachments into a **base64 zip embedded in `html/index.html`**, so the browser channel is invisible to `grep` and had to be decoded. The first pass showed zero client markers; decoding the report revealed 35. An "empty list" reported from the plain grep alone would have been wrong.

| # | dropped | caller | Disposition |
|---|---|---|---|
| 1 | `h-full` | `bg-base-300 h-dvh` | **Intended caller override** (SuccessMessage/ErrorMessage) |
| 2 | `justify-start` | `justify-center` | **Intended caller override** (Button) |
| 3 | `justify-start` | `justify-center` | **Intended caller override** (Button, other variant) |
| 4 | `min-w-touch` | `min-w-full sm:min-w-[12rem]` | **Intended caller override** (Button) |
| 5 | `px-0` | `px-10` | **Intended caller override** (Tabs) |
| 6 | `border-sm` | *(empty)* | **Recorded, no config change, not a trip** |

Records 1-5 are the merge doing exactly what the argument ordering was chosen for. In each, both classes were always in the same group, so exactly one has always applied — previously whichever Tailwind emitted later. This is a **determinisation** in the caller's favour, not a new loss.

Record 6 is the interesting one, and it is **not** a caller override — `caller` is empty, so it is a component losing a token from its **own** string:

- Source: `ElectionSymbol.svelte`, which builds its class string dynamically in a `$derived.by` rather than passing a literal. That is precisely why the static self-merge sweep could not see it, and precisely the gap the recorder was built to close. **The instrumentation earned its keep here.**
- **Measured:** `--border-width-sm` is not defined in `app.css`, and `.border-sm` is **absent from the production CSS bundle** — as is the neighbouring `border-color-[var(--line-color)]`. Both are **dead classes**: they never produced a rule, so removing one changes nothing rendered.
- It was deliberately **not** "fixed" by adding `sm` to the merge configuration: that would teach the config a scale value `app.css` does not define — making the configuration lie about the theme — to preserve a token that emits no CSS. The dead classes in `ElectionSymbol.svelte` are a **pre-existing source-hygiene item, out of scope, handed back rather than fixed**.

### The honest bound — this residual is NOT fully closed

The recorder covers **the paths the E2E suite exercises**. That is wider than the self-merge sweep's reach into cross-string pairs, but it is **not exhaustive over all `(component, caller)` pairs**. Server-side coverage is broad (every SSR render on every spec); browser-side coverage is bounded to the **voter** composition root, where `forensicCapture` is registered `auto: true` — candidate, perm and admin specs have no console capture, so a pair formed only on a client-only render reached exclusively by those specs is not harvested, as is any pair on a code path no spec walks.

### The recorder is gone

Deleted, with its import and call site. The removal gate — `grep -rq CC_DIVERGENCE_RECORDER apps/ …`, exit status read directly — **exits clean**. It existed only in the working tree and is **in no commit**; `components.ts` is byte-identical to its Task 2 committed state. The clean E2E run carries no recorder markers.

## Gates — all on the tree with the recorder removed

| Gate | Result |
|---|---|
| `yarn lint:check` | **exit 0** |
| `yarn test:unit` (root) | **exit 0** — 3,288 tests passed |
| `yarn workspace @openvaa/frontend build` + generated-CSS check | **exit 0** — all dimmed-branch utilities (`m-8 h-16 w-16 border-none outline-2 rounded-sm`) present in the bundle |
| `bash .claude/scripts/audit-skill-links.sh components` | **exit 0** (30 checked, 0 dangling) |
| Full E2E suite, clean tree — `tests/e2e-runs/260922-dd8` | **165 passed / 0 failed / 0 flaky / 0 did-not-run**, playwright exit 0, preflight successes 1 |
| Full E2E suite, armed — `tests/e2e-runs/260922-dd8-armed` | **165 passed / 0 failed / 0 flaky / 0 did-not-run**, playwright exit 0, preflight successes 1 |

Every gate's exit status was read directly; none was piped into `grep`, `head` or `tee`. That mattered once: an early `yarn lint` piped into `tail` reported `0` while ESLint had found 2 errors.

## The skill re-check DID require an edit

Convention 3 of `.claude/skills/components/SKILL.md` said a caller's `class` is "concatenated" with the component's own. That now **understates** `concatClass`. It was corrected in the same commit: the function merges, the caller wins a conflict, a class *can* now be dropped, and the configuration is coupled to `app.css`'s `@theme` block. Its measured counts (60 / 66 files) are unchanged, since no file gained or lost a `concatClass` call. `SKILL.md` was added to the files touched, as the plan's gate 4 anticipated.

## Known stubs

None.

## Deviations from plan

1. **[Rule 1 — Bug] `truncate` misgrouping.** Found by the Task 2 sweep; fixed by extending the merge configuration, which is the plan's own routing for a configuration-fixable divergence.
2. **[Rule 3 — Blocking] Comment-hygiene rule 2 (D-A4).** `yarn lint:check` rejected every wrapped comment line this item added (98 violations, all mine). The comments were reflowed to one line per paragraph; no prose changed.
3. **[Rule 3 — Blocking] A literal `<style>` token inside a script-block JSDoc** made the Svelte parser report "`<script>` was left open", failing `typecheck` with 8 cascading errors. Rephrased.
4. **Test scaffolding:** `import.meta.url` is not a `file:` URL under this project's `conditions: ['browser']` vitest config, so the sweep resolves its source root from the vitest root with an `existsSync` guard that fails loudly rather than yielding an empty population.

## Outstanding — NOT performed

The plan's **`<human-check>` was not performed**: it requires visually confirming that display-mode unpicked options still render as small dots on the connecting line, and that `Toggle`'s 1px border is still present. That is a pixel judgement no automated check in this repo makes, and I did not make it.

What *does* bear on it: the mounted-DOM cases pin the exact class set of every branch; the generated-CSS check proves each dimmed utility is a real rule in the production bundle; `cn('border-md','border-neutral')` — the assertion the merge configuration exists for — is green; and the full E2E suite is clean twice. None of that is a look at the screen.

## Self-Check: PASSED

- `apps/frontend/src/lib/utils/components.ts` — FOUND
- `apps/frontend/src/lib/utils/components.test.ts` — FOUND
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` — FOUND
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts` — FOUND
- `tests/e2e-runs/260922-dd8-armed/cc-divergences.txt` — FOUND
- `apps/frontend/src/lib/utils/CC_DIVERGENCE_RECORDER.ts` — ABSENT (required)
- Commits ba924b985, a6668d573, 976090e94, 884df28de — all FOUND in `git log`
