---
created: 2026-08-26T19:30:00.000Z
title: The docs site still loads Inter from fonts.googleapis.com
area: privacy / frontend
severity: minor
source: Phase 146 (D-13 A; threat T-146-06, disposition accept)
files:
  - apps/docs/src/app.html
---

## Problem

Phase 146 vendored Inter into `apps/frontend/static/fonts/` and made
`packages/app-shared/src/settings/staticSettings.ts` default `font.url` to the same-origin
`/fonts/inter.css`. `apps/docs/src/app.html:9-11` carries its **own** hardcoded `<link>` to
`fonts.googleapis.com` and is not routed through `staticSettings` at all, so the docs site
still contacts a third-party font host on every page load.

D-13 A scoped Phase 146 to the VAA frontend deliberately. The threat register records this as
`T-146-06`, severity low, disposition **accept**, on the explicit condition — discharged in
`146-09` — that it be recorded as known-remaining rather than quietly absorbed into a
repo-wide "self-hosted Inter" claim it does not support.

## Solution

Apply the same vendoring: copy the four woff2 files plus `inter.css` and `OFL.txt` into the
docs app's static directory (or share them from a package), replace the `<link>` in
`app.html`, and confirm with a request trace that no `fonts.googleapis.com` or
`fonts.gstatic.com` request remains.

`apps/frontend/static/fonts/README.md` records the provenance, licence and exact
`@fontsource` version the frontend vendored, and is the reference for keeping the two copies
identical.

## Why it was not folded into Phase 146

Out of scope by decision, not by oversight. Phase 146's precedent — and this project's — is
to file adjacent work rather than pad a phase with it. Recorded as known-remaining in
`.planning/ROADMAP.md` § Phase 146 and in
`.planning/phases/146-*/146-NEGATIVE-CONTROL.md` § *Residue*.
