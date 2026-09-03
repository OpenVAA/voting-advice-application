# Inter — Vendored Font Assets

**Source:** [`@fontsource/inter@5.3.0`](https://www.npmjs.com/package/@fontsource/inter) (`github.com/fontsource/font-files`, `fonts/google/inter`), taken verbatim — never added as a dependency
**Count:** 4 `.woff2` files (Inter 400 + 700, `latin` + `latin-ext`, style `normal`) plus `OFL.txt` and `inter.css`
**Purpose:** The application serves its own typeface from its own origin (VGATE-05), so no page load discloses the visitor's IP and user-agent to a third-party font host — and so the blocking `e2e-visual` CI job has no public-internet dependency for fonts (VGATE-04)
**Vendored on:** 2026-08-26, via `npm pack @fontsource/inter@5.3.0` (phase 146, plan `146-05`)

## Provenance

| File                               |  Bytes | sha256                                                             |
| ---------------------------------- | -----: | ------------------------------------------------------------------ |
| `inter-latin-400-normal.woff2`     | 23,664 | `8909904ab6c872eb994093482a88a28eca2cd95912d7b6fecd72103b0dc07edc` |
| `inter-latin-700-normal.woff2`     | 24,356 | `6f56409fd3d64bb85f7d070bce20749db2d66b6d63cec586cc22d1c761be2491` |
| `inter-latin-ext-400-normal.woff2` | 35,000 | `6744a7f509ebc6ab220a6cd4ea77e898adf014f03d88dcda5d45d8a9feefb4e9` |
| `inter-latin-ext-700-normal.woff2` | 36,244 | `143f9504f1377012aa3e39c90c4354ef429cb0494b9ac0e1437f1a81e5412236` |

The two `latin` digests are **identical to the bytes Google Fonts itself serves** for
`css2?family=Inter:wght@400` and `css2?family=Inter:wght@700` (measured by live fetch in phase 146
research, § N-1). The provenance is therefore re-verifiable **offline**: re-run
`shasum -a 256 *.woff2` against this table, with no network and no trust in the npm registry required.

Delivery note (§ N-1): the previous default requested **both** weights in one `css2` call, for which
Google serves a single **variable** face. These four files are the corresponding **static** instances.
The switch is variable-to-static, and the resulting pixel delta is measured in `146-06` and recorded in
`146-VISUAL-NOISE-LEDGER.md` — it is not assumed to be zero.

## Licence

Inter is licensed under the **SIL Open Font License, Version 1.1**. The licence text and the upstream
copyright notice — `Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)` — are
reproduced verbatim and unmodified in [`./OFL.txt`](./OFL.txt), in the same directory as the bytes they
cover, as OFL 1.1 § 2 requires of any redistribution. No Reserved Font Name is declared by the upstream
notice, so the family is served under its own name `Inter`. The font software is redistributed as a
component of this application and is not sold on its own (OFL 1.1 § 5).

## Refreshing

```bash
npm pack @fontsource/inter@<version>          # byte source only — do NOT `yarn add` it
tar -xzf fontsource-inter-<version>.tgz
cp package/files/inter-latin-{,ext-}{400,700}-normal.woff2 apps/frontend/static/fonts/
cp package/LICENSE                                         apps/frontend/static/fonts/OFL.txt
shasum -a 256 apps/frontend/static/fonts/*.woff2           # update the table above
```

`inter.css`'s `unicode-range` values come from the tarball's `package/unicode.json`, **not** from its
per-subset CSS files, which omit them (§ N-5) — four rules with no ranges would shadow each other and
basic-Latin glyphs would come from the wrong file. `latin-ext` is declared before `latin` to match
Google's own emission order, and `src` lists `woff2` only, as Google's response does.

Adding `@fontsource/inter` as a real dependency is **prohibited**: it would inject its own `@font-face`
rules, bypassing `staticSettings.font.url` entirely and making a downstream override load two fonts.
That setting stays the single customization point — `apps/frontend/src/routes/+layout.svelte` still
falls back to the Google URL and still emits the `fonts.gstatic.com` preconnects for an operator who
overrides back to it.

## Why these four and no others

`apps/frontend/src/app.css:93` sets `--font-weight-*: initial` and re-declares only `normal: 400` and
`bold: 700`. Tailwind v4 therefore emits **no** `font-medium` or `font-semibold` utility at all, so the
source's 15 such usages are dead classes, and there are zero italic usages. Weights 400 + 700 across
`latin` + `latin-ext` is the complete rendering surface; vendoring weight 500, 600, any italic face or a
variable face would smuggle a visual design change into a test-infrastructure change.

The 15 dead weight classes are a **deferred** design decision with a todo filed in `146-09` (D-09), not
an oversight.
