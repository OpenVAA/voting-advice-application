# Phase 137 — Discussion Log

**Date:** 2026-08-13
**Mode:** batch / text (single written question document)

> Human reference only. Not consumed by researcher / planner / executor — they read `137-CONTEXT.md`.

## How this discussion ran

Rather than an interactive turn-by-turn flow, the discussion was conducted as a single written
document: `137-DISCUSSION-QUESTIONS.md`. It was grounded in a live codebase scout that produced
ten verified findings (F1–F10), each with file:line evidence, and framed 15 questions across four
areas with a recommended option per question.

The document set its own answering rule up front:

> "write your pick after each `➜ Answer:` line (letter, or free text). Anything you leave blank
> I'll take the **Recommended** option for."

## Answers received

| Question | Area | Answer | Source |
|---|---|---|---|
| Q1.1 Identity marker | Identity | D (composite; `/@fs` probe load-bearing) | recommended default |
| Q1.2 Non-dev server support | Identity | A (dev-only) | recommended default |
| Q1.3 Derived or hardcoded | Identity | A (derive at runtime) | recommended default |
| Q2.1 Where preflight runs | Enforcement | B (`globalSetup`) | recommended default |
| Q2.2 Gate CI too | Enforcement | A (yes; delete CI's blind loop) | recommended default |
| Q2.3 Wait or fail fast | Enforcement | B (poll ~30 s) | recommended default |
| Q3.1 Any bypass | Failure behaviour | none (confirmed) | recommended default |
| Q3.2 `strictPort: true` | Failure behaviour | A (add it) ⚠️ | recommended default |
| Q3.3 Failure message + `lsof` | Failure behaviour | include `lsof` line | recommended default |
| Q3.4 Change default port | Scope | A (out of scope; deferred) | recommended default |
| **Q4.1 Staging the foreign server** | **Evidence** | **B — throwaway minimal Vite project** | **explicit operator answer** |
| Q4.2 Demonstrating old blindness | Evidence | A (throwaway retired-check script) | recommended default |
| Q4.3 Where evidence lives | Evidence | B (`137-NEGATIVE-CONTROL.md`) | recommended default |
| Q4.4 Scope of INTEG-06 grep | Docs | confirmed (live docs only) | recommended default |
| Q4.5 Doc split | Docs | confirmed | recommended default |
| "Anything else" | — | left blank | — |

**One explicit divergence from the recommendation:** Q4.1. The recommendation was **C** (both the
live sibling container *and* a scripted throwaway project); the operator chose **B** — the
reproducible throwaway project alone. Captured as D-11, with a planning note that the staged
project must still reproduce the redirect-to-locale shape so the composite check's redirect clause
is genuinely exercised.

## Items flagged for operator attention

- **Q3.2 / D-08 (`strictPort: true`)** — the questions document explicitly marked this
  "⚠️ *This one changes daily dev UX for everyone*" and said "this is genuinely your call on dev
  ergonomics, and I'd rather you decide than assume." It was left blank and therefore resolved to
  the recommended **A (add it)** under the document's stated blank-answer rule. CONTEXT.md D-08
  instructs the planner to raise it as a `checkpoint:decision` before implementing, so there is a
  second, explicit opportunity to reverse it before it lands.

## Scope creep redirected

Three items were kept out of scope and recorded as deferred ideas in CONTEXT.md: moving the
default local E2E port off 5173; an `/api/__identity` app endpoint; a `kit.version.name` build
stamp. The latter two only become relevant if E2E ever targets a preview/built server.

## Claude's discretion

CI poll ceiling; preflight module layout; exact doc wording within the agreed split; how the
known-app-name set is sourced (subject to nothing being hardcoded).
