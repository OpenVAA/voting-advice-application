# Lens: Domain packages · ID prefix `PKG`

**Applies when** the PR changes `packages/core`, `packages/data`, `packages/matching`, `packages/filters` or `packages/app-shared`, adds a new package, or adds app code that works over data-model objects: computing matches, filtering entities, walking nominations, elections, constituencies or questions, or deriving a property of an entity.

## List

Each package change as _package_ → _symbol_ → _what changed_ → _consumers_. Then each piece of app code that reasons about data-model objects: _file:line_ → _what it computes_ → _objects it reads_.

## Evaluate (criterion slugs)

- `pkg-single-source`: data objects are accessed by reference and never copied or re-serialised into parallel shapes; missing values are empty literals; every object carries `root`. Flag spreads or maps that build a second representation of a `DataObject` for the UI.
- `pkg-elevate-method`: **logic about data-model objects belongs on the objects.** A predicate, derivation or relation walk over a `Candidate`, `Organization`, `Nomination`, `Question`, `Election` or `Constituency` written in app code is a candidate for a method or getter on its class in `@openvaa/data`, or in `packages/app-shared/src/data/` when it needs app-level types. Examples: "is this nomination in the voter's elections", "the alliance's member organizations", "does this question apply to this constituency". The finding names the class, the method signature and the call sites that would use it. Such logic collects in `apps/frontend/src/lib/utils/entities.ts`, `matches.ts`, `getAllianceSummary.ts`, `organizationMatching.ts`, context getters and `$derived` blocks.
- `pkg-missing-value`: `MISSING_VALUE` from `@openvaa/core` in matching contexts, `MISSING_FILTER_VALUE` in filters, `undefined` or empty literals elsewhere. `null`, `0` or `''` used as a sentinel is the finding.
- `pkg-subdimensions`: a new or changed question type declares its matching dimensions correctly — categorical questions create subdimensions — and distance stays normalised to 0–100%. Check the variant's matching interface against its siblings in `packages/data/src/objects/questions/variants/`.
- `pkg-instanceof`: `instanceof` across package boundaries has broken before (commit 87efe19a). Prefer the discriminant (`objectType`, `filterType`) or an exported type guard.
- `pkg-paradigm`: a new package follows `@openvaa/core`'s shape — the same `package.json` scripts and `exports`, a `tsconfig.json` extending `@openvaa/shared-config/ts`, a `tsup.config.ts`, a flat barrel, no `.js` extensions on relative imports, `workspace:^` plus a tsconfig reference for each internal dependency. The dependency flow is `core → data / matching / filters → app-shared → apps`, with no import going upward. `app-shared` stays ESM-only.

## Where to look

`packages/README.md`, `packages/core/src/index.ts`, `packages/data/src/objects/`, `packages/app-shared/src/data/`, and the frontend utilities named above.

## Not a finding

Logic that depends on UI-only state — routes, display strings for the locale, layout, the voter's ephemeral selections. Then the method is the pure part and the app keeps the rest: propose that split rather than moving the whole thing.

## Promote to

`.claude/skills/data/SKILL.md`, `.claude/skills/matching/SKILL.md`, `.claude/skills/filters/SKILL.md`; `packages/README.md`.
