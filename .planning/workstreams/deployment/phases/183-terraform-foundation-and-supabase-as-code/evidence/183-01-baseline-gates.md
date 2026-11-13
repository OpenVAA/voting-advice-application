# Baseline of the three repository gates (183-01)

Taken after the ignore-entries commit and before any other change of this phase, on a tree with no
uncommitted tracked change before and after each gate. Gates ran one after another, each in the
background with its log and exit status written to files under `$TMPDIR`, with a private
`TURBO_CACHE_DIR`.

- `node --version`: v24.21.0
- `yarn --version`: 4.18.1
- `terraform version` (first line): Terraform v1.14.7
- Commit at which this plan started: 621fe08a48d451937b8c5eaa62999f282cfab94d
- Attempt: 01-2 20261018T202029Z.bfbaaffa0

| Gate | Exit status | Date (UTC) | HEAD before | HEAD after | Tree before and after | First red link |
| --- | --- | --- | --- | --- | --- | --- |
| lint:check | 0 | 2026-10-18 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | 0/0 | none |
| format:check | 0 | 2026-10-18 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | 0/0 | none |
| test:unit | 0 | 2026-10-18 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 | 0/0 | none |
| format:check after infra/ | 0 | 2026-10-18 | be1e9c18d3df39ba4f947fcd02abaf0e69db0ab7 | be1e9c18d3df39ba4f947fcd02abaf0e69db0ab7 | 0/0 | none |

The row `format:check after infra/` was taken in a separate attempt, after the commit that added the
first Terraform root: Attempt: 01-3 20261018T202510Z.be1e9c18d. Its status equals the baseline
`format:check` status, so Prettier leaves the Terraform files alone and `.prettierignore` needed no
change.

All three gates are green at the baseline, so no red gate stops plan 183-13 from observing its red
controls through the chain. `test:unit` includes the Docker build wiring spec
(`packages/dev-seed/tests/ciDockerImageBuildGate.test.ts`, 7 passed), the only gate that reads the
edited `.dockerignore`.

## After the first root

`infra/envs/staging/aws/.terraform` after `init -backend=false` with `TF_PLUGIN_CACHE_DIR` set (the
provider is a symlink into the plugin cache, so the directory itself holds almost nothing):

- `du -sh infra/envs/staging/aws/.terraform`: 0B
- `du -shL infra/envs/staging/aws/.terraform`: 763M

The AWS provider lock pins `hashicorp/aws` 6.68.0 under `constraints = "~> 6.60"`, with `h1:` hashes
for linux_amd64, darwin_arm64 and darwin_amd64. The newest release the range admitted on 2026-10-18
was 6.69.1, so the exact constraint `6.68.0` was set for `terraform providers lock` and then put back.
