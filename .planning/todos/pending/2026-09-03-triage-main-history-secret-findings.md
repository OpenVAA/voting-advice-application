# Triage the ~21 trufflehog findings in `origin/main`'s history

**Filed:** 2026-09-03 (Phase 163, from the first observed secret-scan run)

**Evidence:** GitHub Actions run `33751423659` on `ci-evidence/163-gates`. A FULL-HISTORY
trufflehog scan reported **26 unverified findings, 0 verified**. Scanning only the pushed
tree (2,870 files) reports **5**:

| n | detector | path | assessment |
|---|---|---|---|
| 3 | FlatIO | `yarn.lock` | false positive - dependency integrity hashes |
| 1 | Gitlab | `.yarn/releases/yarn-4.13.0.cjs` | false positive - vendored Yarn bundle |
| 1 | PrivateKey | `tests/tests/support/mock-oidc-key.pem` | throwaway mock-OIDC fixture |

The remaining **~21 are in commits already on `origin/main`** and were not introduced by
this branch. Detectors seen in the run's warnings include FlatIO, Box, CloudflareApiToken,
CloudflareGlobalApiKey and Gitlab.

**Why this is filed rather than fixed:** Phase 163 rescoped the gate to scan only the
commits a push introduces, so the gate is usable and criterion 3 is observable. That
deliberately leaves history unexamined. `verified_secrets: 0` is reassuring but NOT proof
of safety - trufflehog only verifies detectors that have a `verify:` endpoint, and an
unverified finding is "not checked", not "not a secret".

**What to do:** scan `origin/main`'s history, classify each finding, and for anything real,
rotate the credential and record it. Reproduce the population with:

    docker run --rm -v "$PWD:/repo:ro" ghcr.io/trufflesecurity/trufflehog:3.97.2 \
      git file:///repo --no-update --json

Extract only `DetectorName` and the file path - do NOT print raw values.

**Note:** this is a PUBLIC repository, so any genuinely-leaked credential in history should
be treated as disclosed and rotated regardless of whether the commit is later removed.
