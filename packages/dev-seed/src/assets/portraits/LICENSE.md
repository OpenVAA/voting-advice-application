# Portrait Assets — Licensing Disclosure

**Source:** https://thispersondoesnotexist.com (AI-generated, StyleGAN-based)
**Count:** 30 portraits, `portrait-01.jpg` through `portrait-30.jpg`
**Purpose:** Candidate profile placeholders for the `@openvaa/dev-seed` default template. Local development + E2E testing only. NOT intended for production deployment.
**Generated on:** 2026-04-23 (one-off maintainer fetch via `packages/dev-seed/scripts/download-portraits.ts`)

## Legal Posture

`thispersondoesnotexist.com` does not publish an explicit license for its output. The generated images are AI-synthesized via StyleGAN and depict no real person. The copyright status of AI-generated images is legally unresolved in most jurisdictions as of 2026. This package **does not claim** a formal license on these images.

## Intended Use

- **Allowed:** Local development seeding; CI/CD test environments; contributor screenshots; internal demos of the OpenVAA framework.
- **NOT recommended:** Redistribution as a standalone image set; production deployment; marketing materials; any use where image licensing matters.

For production deployments of any OpenVAA-based VAA, the deploying party MUST substitute their own licensed candidate portraits — typically supplied by the candidates themselves via the candidate app upload flow (`apps/frontend/src/lib/candidate/.../profile`).

## Refreshing the Pool

Run `yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts` from the repo root. The script fetches 30 fresh portraits from the source, overwriting existing files. Commit the new `portrait-NN.jpg` files to lock the new pool for reproducibility. Each portrait is newly-generated per fetch — the source does not return a stable set.

## Switching Sources

If the ambiguous licensing posture becomes blocking (e.g. distribution of the repo to a jurisdiction with stricter AI-image rules), replace this set with a source that publishes an explicit permissive license:

- [Pexels](https://www.pexels.com/license/) — CC0-equivalent, with attribution appreciated but not required.
- [Unsplash](https://unsplash.com/license) — permissive for commercial + non-commercial use.
- [UIFaces](https://uifaces.co/) — open-source faces, check per-face license.

Switching sources is a template-level decision (new D-58-XX in CONTEXT.md). Do NOT swap sources unilaterally — discuss with maintainers first.
