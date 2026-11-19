# Lens: Docs and comments · ID prefix `DOC`

**Applies when** the PR adds or changes code comments, the documentation site (`apps/docs/`), a README, `CLAUDE.md` or a skill — and also whenever it changes a behaviour, setting, route, schema object, package API or deployment step that documentation describes, even if no doc file is in the diff. It also applies whenever the PR adds a source file or substantially rewrites one, for `doc-top-down`.

## List

Each documented subject the PR touches: _subject_ → _the page or file that describes it_ (found by grep at `$HEAD_SHA`) → _edited in the PR?_ → _still true?_.

## Evaluate (criterion slugs)

- `doc-comment-hygiene`: the judgement half of CLAUDE.md § Comment Hygiene. A comment describes the code as it is now, to a reader coming to it cold: no narrative of what the code used to do or how a defect was found, no planning references beyond the bare form the section allows, nothing addressed to the reviewer unless tagged `[PR review]`, and no comment where the code could explain itself. The deterministic half is `yarn assert:comment-hygiene`; read every touched comment for what a grep cannot catch.
- `doc-tsdoc`: exported symbols carry TSDoc, per the code style guide.
- `doc-top-down`: a file reads top-down. It opens with its main symbol, usually the export the file is named after, followed by that symbol's dependencies, each placed after its first consumer and in the same consumer-first order, so a reader meets every name before its definition. At least the main export carries a docstring unless it is completely trivial. Exception: small types, especially the type of a function's arguments or of a class constructor's options, may sit above their consumer. Judge only files the PR added or substantially rewrote. In a file the PR only touched, raise new code that breaks the order, not the order the file already had. Recommend the reordering itself; when the file is also too large, the split belongs to `G-split-files`.
- `doc-site`: **the documentation site is edited to match.** For each behaviour, setting, route, schema object, package API or deployment step the PR adds or changes, grep `apps/docs/src/routes/(content)/` for the pages describing it, then either find the matching edit in the diff or name the page that is now wrong or missing. Both guides count: the developers' guide (architecture, packages, backend, contributing) and the publishers' guide (settings, features, the admin app, deployment), where every new setting must appear. A new feature with no page describing it is a finding when publishers need to know it exists. Check that new pages are reachable from the site's navigation and that any content `yarn docs:prepare` generates was regenerated.
- `doc-guides`: in-repo READMEs (`packages/*/README.md`, `apps/frontend/src/lib/*/README.md`, `tests/README.md`) still describe the code.
- `doc-agent-docs`: a change to something `CLAUDE.md` or a skill states updates it in the same PR. A skill's `targets:` are directories (`.claude/scripts/audit-skill-drift.sh` skips files), and its links resolve (`bash .claude/scripts/audit-skill-links.sh <skill>`).
- `doc-svelte-warning-format`: an accepted Svelte warning uses the `// svelte-warning: accepted — <rationale>` format from CLAUDE.md, placed directly above the line.

## Where to look

`apps/docs/src/routes/(content)/developers-guide/`, `apps/docs/src/routes/(content)/publishers-guide/`, `apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md`, `.claude/skills/README.md`.

## Promote to

`.agents/code-review-checklist.md` (the documentation items); CLAUDE.md § Comment Hygiene.
