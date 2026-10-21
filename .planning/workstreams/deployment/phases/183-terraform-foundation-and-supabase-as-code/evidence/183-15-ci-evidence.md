# 183-15 CI evidence: the `infra-validate` job

Attempt: 15-1 20261021T105258Z.18fdcd6ca

## What would be published

**Status of this manifest: ready for the operator's review (Task 2).** Nothing has been pushed. Every scan finding below is on the list the operator accepted on 2026-10-21; no scan stops the task.

Why this is a second attempt. The first attempt of Task 1 (`15-1 20261021T084738Z.59d6affae`, commits `b263b1cd9a18bf6028228b375f87661eec4e2edb` / `514f4a3c6da2e583991feac0b64f2c96ee5810d8`) stopped on three scan findings. On 2026-10-21 the operator ruled (option (a)) that the plan's stop rules accept exactly those classified findings, by path and kind, and the plan was amended in commit `18fdcd6ca3a61738e8103343eace6d773a5dd460`. Every other stop rule is unchanged and nothing built or scanned was narrowed. This attempt rebuilt both commits from the new `HEAD` and reran every scan; the earlier commits are superseded and no confirmation given for them counts.

### The two commits

| Branch | Commit (full) | Parent |
|--------|---------------|--------|
| `ci-evidence/183-infra-validate` (green) | `b0c910e9f350465f83482ef31db3b7f55a4d3bc4` | `59f8dacdd1e22a9dde7f45b2f5dbf65c174e5677` (`origin/main`) |
| `ci-evidence/183-infra-validate-red` (red) | `a58cb0ad73b659e73da9402d9ba3d1ff2eb94b2d` | `59f8dacdd1e22a9dde7f45b2f5dbf65c174e5677` (`origin/main`) |

- Built from `HEAD` `18fdcd6ca3a61738e8103343eace6d773a5dd460` (branch `feat/deployment-terraform-supabase`), with a temporary index: `git read-tree HEAD`, then `.planning` and `.bg-shell` removed from that index. `origin/main` was fetched first, without a credential, by its HTTPS address.
- Tracked tree sample before: clean (`git status --porcelain --untracked-files=no` printed nothing). After: clean. `HEAD` before and after: `18fdcd6ca3a61738e8103343eace6d773a5dd460`, unchanged.
- The green tree holds 3251 files.
- **The tree is the committed tree of this branch, so a push publishes everything that phases 181 and 182 (and every earlier unmerged phase on this branch) have committed on it, not only the Terraform code of phase 183.** The list below has 4192 lines (2408 added, 1208 deleted, 184 modified, 392 renamed).
- `git diff --name-only <green> <red>` lists exactly two files: `infra/envs/example/aws/main.tf` and `infra/envs/example/aws/variables.tf`.
  - `variables.tf`: line 3 `type        = string` becomes `type   =   string`, which `terraform fmt -check` rejects (checked locally with Terraform 1.14.7: exit 3).
  - `main.tf`: an appended `output "evidence_undeclared_variable"` block whose value is `var.not_declared_in_this_root`, which `terraform validate` rejects. It is itself formatted (local `terraform fmt -check` exit 0), so the formatting step fails on `variables.tf` alone.
- Both commits touch non-Markdown paths relative to `origin/main`, so `paths-ignore` does not swallow the run.

Files that differ from `origin/main` on the green branch, by top-level directory (a rename is counted under its new path; the full list is below):

| Top-level | Total | Added | Modified | Renamed | Deleted |
|-----------|-------|-------|----------|---------|---------|
| `(root)` | 19 | 6 | 12 | 0 | 1 |
| `.agents/` | 1 | 0 | 1 | 0 | 0 |
| `.changeset/` | 2 | 2 | 0 | 0 | 0 |
| `.claude/` | 105 | 105 | 0 | 0 | 0 |
| `.github/` | 10 | 3 | 7 | 0 | 0 |
| `.husky/` | 1 | 0 | 1 | 0 | 0 |
| `.yarn/` | 2 | 1 | 0 | 0 | 1 |
| `apps/` | 1964 | 1576 | 0 | 388 | 0 |
| `backend/` | 263 | 0 | 0 | 0 | 263 |
| `docs/` | 192 | 1 | 0 | 0 | 191 |
| `frontend/` | 740 | 0 | 0 | 0 | 740 |
| `infra/` | 75 | 75 | 0 | 0 | 0 |
| `packages/` | 422 | 258 | 159 | 0 | 5 |
| `scripts/` | 108 | 106 | 0 | 2 | 0 |
| `security/` | 1 | 1 | 0 | 0 | 0 |
| `tests/` | 287 | 274 | 4 | 2 | 7 |

### What the remote holds, and the push command

Read with `git -c credential.helper= ls-remote https://github.com/OpenVAA/voting-advice-application.git refs/heads/ci-evidence/183-infra-validate refs/heads/ci-evidence/183-infra-validate-red` (no credential), exit 0 with no output:

- `ci-evidence/183-infra-validate`: none (the remote does not hold the branch)
- `ci-evidence/183-infra-validate-red`: none

Push command, with a lease on each branch (an empty expected value means the branch must not exist yet):

```
git push --force-with-lease=ci-evidence/183-infra-validate: --force-with-lease=ci-evidence/183-infra-validate-red: origin ci-evidence/183-infra-validate ci-evidence/183-infra-validate-red
```

### Scan results (whole tree of each commit)

A finding is recorded as a path and a kind, never as a value. The green and red trees gave the same results. "Accepted" means the finding is on the list of the operator's ruling of 2026-10-21, matched by path and by the kind observed here.

1. **Private-key headers** (`git grep -I -l -e 'BEGIN [A-Z ]*PRIVATE KEY'`): 2 findings, both accepted. No stop.
   - `packages/dev-tools/src/pem-to-jwk.ts` (grep hits on lines 61 and 67; line 62 holds a third header pattern the grep's character class does not match): header text inside regular expressions and an error message. The file holds no key material (no base64 key-body line). Absent from `origin/main`. Accepted kind: header text in a regex / error message, no key.
   - `tests/tests/support/mock-oidc-key.pem`: a 28-line `PRIVATE KEY` PEM, the test-only key of the mock OIDC issuer, negated in `.gitignore` (line 17) as tracked on purpose and listed in `.github/trufflehog-exclude-paths.txt` (in the green tree too). Absent from `origin/main`. Accepted kind: test-only mock OIDC key. (`.gitignore` names a second tracked file, `tests/tests/support/mock-oidc-cert.pem`, a certificate, which holds no private-key header.)
2. **Environment files** (file name starting `.env`, other than `.env.example`, `.env.sample`, `.env.template`): 0 findings.
3. **AWS access key ids** (`git grep -I -n -E '(AKIA|ASIA)[0-9A-Z]{16}'`): 1 finding, accepted. No stop.
   - `.yarn/releases/yarn-4.18.1.cjs` line 150 (a single line of 223 093 bytes): a key-shaped 20-character substring of encoded data in the vendored Yarn release, not a key. Absent from `origin/main` (which vendors `yarn-4.6.0.cjs`); the path matches `^\.yarn/releases/.*\.cjs$` in `.github/trufflehog-exclude-paths.txt`. Accepted kind: key-shaped substring in the vendored Yarn release.
4. **Terraform files**: 0 forbidden paths (no `.planning/`, `.tfstate`, `.tfstate.`, `.tfplan`, `.auto.tfvars`, `tfplan`, `backend_override.tf` or `.terraform/`). Nine `terraform.tfvars` / `example.tfvars` files, read with `git show`: 4 assignments whose name holds `token`, none of them a secret value (each is a feature flag or a rate number), and 2 addresses, both allowed. No stop; the same classification the first attempt gave, which the operator read.
   - `infra/envs/example/supabase/terraform.tfvars` line 16 `enable_access_token_hook` (boolean); line 26 `rate_limit_token_refresh` (a number).
   - `infra/envs/scratch/supabase/terraform.tfvars` line 12 `enable_access_token_hook` (boolean).
   - `infra/envs/staging/supabase/terraform.tfvars` line 14 `enable_access_token_hook` (boolean).
   - `infra/envs/example/supabase/terraform.tfvars` line 39: an address on `vaa.example.org`, a subdomain of `example.org`.
   - `infra/envs/staging/dns-mail/terraform.tfvars` line 13: `dmarc_agg@vali.email`, the allowed DMARC report address.
   - `infra/bootstrap/terraform.tfvars` holds no address, so the 183-R2 condition does not arise (plan 183-14's `14-3` attempt does not exist yet).
5. **The repository's own scan**: ran locally before the push. trufflehog **3.95.2** on the workstation; the workflow pins **3.97.9**. Range `origin/main`..green, with `--config=.github/trufflehog-openvaa.yml --exclude-paths=.github/trufflehog-exclude-paths.txt --no-update --fail --github-actions`, both files taken from the green tree. trufflehog cannot open a linked worktree (its `.git` is a file), so it ran on a throwaway clone in the session scratch directory holding `origin/main` and the green commit only. **Exit status 183: 0 verified, 2 unverified findings**, both detector `URI`, both accepted:
   - `apps/supabase/supabase/functions/account-access/signInLink.test.ts` line 31
   - `tests/tests/utils/mailedLink.test.ts` line 75

   Both are dummy `user:<dummy>@host` test inputs that the code under test must refuse. No other finding. **CI's `secret-scan` job is expected to conclude `failure` on the green run for these two lines** (it runs the same detectors over the same range), so the green run's run-level conclusion is expected to be `failure` even if `infra-validate` succeeds. That does not affect the evidence, which is read at job level for `infra-validate`.

### Files that differ from `origin/main` (green branch)

`git diff --name-status origin/main ci-evidence/183-infra-validate`, every line (Git reported that exhaustive rename detection was skipped for too many files; the list is Git's default output):

```
M	.agents/code-review-checklist.md
A	.changeset/README.md
A	.changeset/config.json
A	.claude/scripts/audit-skill-drift.sh
A	.claude/scripts/audit-skill-links.sh
A	.claude/scripts/audit-skill-routing.sh
A	.claude/skills/BOUNDARIES.md
A	.claude/skills/README.md
A	.claude/skills/components/SKILL.md
A	.claude/skills/components/context-reactivity.md
A	.claude/skills/data/SKILL.md
A	.claude/skills/data/extension-patterns.md
A	.claude/skills/data/object-model.md
A	.claude/skills/database/SKILL.md
A	.claude/skills/database/extension-patterns.md
A	.claude/skills/database/rls-policy-map.md
A	.claude/skills/database/schema-reference.md
A	.claude/skills/filters/SKILL.md
A	.claude/skills/filters/extension-patterns.md
A	.claude/skills/matching/SKILL.md
A	.claude/skills/matching/algorithm-reference.md
A	.claude/skills/matching/extension-patterns.md
A	.claude/skills/recommended-skills/SKILL.md
A	.claude/skills/ship-review-stack/SKILL.md
A	.claude/skills/ship-review-stack/sources/build-rename-commit.sh
A	.claude/skills/ship-review-stack/sources/build-slice.sh
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.expected.sh
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.expected.sql
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.expected.svelte
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.expected.ts
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.input.sh
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.input.sql
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.input.svelte
A	.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.input.ts
A	.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs
A	.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh
A	.claude/skills/ship-review-stack/sources/slice-overlap-matrix.sh
A	.claude/skills/ship-review-stack/sources/verify-commit-taxonomy.sh
A	.claude/skills/ship-review-stack/sources/verify-identity.sh
A	.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/context-orchestration.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/layout-overlay-registry.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/matching-integration.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/migration-inventory-and-order.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/page-navigation-and-transitions.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/persistent-rune-stores.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/reactive-contexts.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/001-appsettings-native-rune/appSettingsRuneContext.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/002-dataroot-native-rune/dataRootRuneContext.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/003-voter-answer-store-rune/runePersistedState.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/003-voter-answer-store-rune/voterAnswerRuneStore.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/004-matchstore-integration/runes-test-page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/005-candidate-answer-store-rune/candidateAnswerRuneStore.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/005-candidate-answer-store-rune/runePersistedState.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/006-layout-overlay-rune/MockRoute.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/006-layout-overlay-rune/SettingsOverlay.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/006-layout-overlay-rune/layoutSettingsRune.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/006-layout-overlay-rune/page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/007-context-orchestration-end-to-end/CanonicalConsumer.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/007-context-orchestration-end-to-end/DestructureTrapConsumer.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/007-context-orchestration-end-to-end/layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/007-context-orchestration-end-to-end/page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/007-context-orchestration-end-to-end/voterRuneContext.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/008-ssr-hydration-runes/appSettingsVariantA.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/008-ssr-hydration-runes/appSettingsVariantB.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/008-ssr-hydration-runes/layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/008-ssr-hydration-runes/page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/010-adjacent-store-bridges/page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/010-adjacent-store-bridges/popupRuneStore.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/012-getroute-rune/getRouteRuneStore.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/012-getroute-rune/layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/012-getroute-rune/nested-page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/012-getroute-rune/page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/012-getroute-rune/spike012Context.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/LedgerPanel.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/mountLedger.svelte.ts
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/questions/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/questions/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/questions/[questionId]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/questions/category/[categoryId]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/results/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/results/[[electionTab]]/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/results/[[electionTab]]/KeyedInner.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/013-nav-mount-forensics/code/results/[[electionTab]]/[[entityTab]]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/questions/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/questions/MainContentMock.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/questions/QuestionActionsMock.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014a-nested-layout-promotion/code/questions/[questionId]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014b-single-page-url-keyed/code/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014b-single-page-url-keyed/code/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014b-single-page-url-keyed/code/questions/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014b-single-page-url-keyed/code/questions/QuestionBody.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/014b-single-page-url-keyed/code/questions/[[questionId]]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/015-view-transitions-api/code/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/015-view-transitions-api/code/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/015-view-transitions-api/code/questions/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/015-view-transitions-api/code/questions/[[questionId]]/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/016-focus-and-a11y-during-transitions/code/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/016-focus-and-a11y-during-transitions/code/+page.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/016-focus-and-a11y-during-transitions/code/questions/+layout.svelte
A	.claude/skills/spike-findings-voting-advice-application-gsd/sources/016-focus-and-a11y-during-transitions/code/questions/[[questionId]]/+page.svelte
M	.dockerignore
M	.env.example
A	.git-blame-ignore-revs
A	.gitattributes
M	.github/PULL_REQUEST_TEMPLATE
M	.github/dependabot.yml
A	.github/trufflehog-exclude-paths.txt
A	.github/trufflehog-openvaa.yml
M	.github/workflows/claude-code-review.yml
M	.github/workflows/claude-solve-issue.yml
M	.github/workflows/claude.yml
M	.github/workflows/docs.yml
M	.github/workflows/main.yaml
A	.github/workflows/release.yml
M	.gitignore
M	.husky/pre-commit
M	.lintstagedrc.json
M	.prettierignore
A	.yarn/releases/yarn-4.18.1.cjs
D	.yarn/releases/yarn-4.6.0.cjs
M	.yarnrc.yml
M	CLAUDE.md
A	PRE-SHIP-REFACTORING.md
M	README.md
A	ROADMAP.md
R100	docs/.gitignore	apps/docs/.gitignore
R100	docs/.npmrc	apps/docs/.npmrc
R100	docs/.prettierignore	apps/docs/.prettierignore
A	apps/docs/README.md
A	apps/docs/eslint.config.js
A	apps/docs/mdsvex.config.js
A	apps/docs/package.json
R100	docs/prettier.config.mjs	apps/docs/prettier.config.mjs
A	apps/docs/scripts/check-research-quotes.ts
R079	docs/scripts/docs-scripts.config.ts	apps/docs/scripts/docs-scripts.config.ts
R094	docs/scripts/generate-all-docs-and-validate.ts	apps/docs/scripts/generate-all-docs-and-validate.ts
R077	docs/scripts/generate-component-docs.ts	apps/docs/scripts/generate-component-docs.ts
R097	docs/scripts/generate-navigation-config.ts	apps/docs/scripts/generate-navigation-config.ts
R091	docs/scripts/generate-route-map.ts	apps/docs/scripts/generate-route-map.ts
R093	docs/scripts/move-generated.ts	apps/docs/scripts/move-generated.ts
R100	docs/scripts/tsconfig.json	apps/docs/scripts/tsconfig.json
A	apps/docs/scripts/utils/links.ts
R091	docs/scripts/utils/routes.ts	apps/docs/scripts/utils/routes.ts
A	apps/docs/scripts/validate-links.ts
A	apps/docs/src/app.d.ts
R100	docs/src/app.html	apps/docs/src/app.html
R100	docs/src/lib/components/Author.svelte	apps/docs/src/lib/components/Author.svelte
A	apps/docs/src/lib/components/Footer.svelte
R100	docs/src/lib/components/GithubIcon.svelte	apps/docs/src/lib/components/GithubIcon.svelte
A	apps/docs/src/lib/components/Header.svelte
A	apps/docs/src/lib/components/Navigation.svelte
R075	docs/src/lib/components/NavigationItem.svelte	apps/docs/src/lib/components/NavigationItem.svelte
A	apps/docs/src/lib/components/PeerNavigation.svelte
R092	docs/src/lib/components/ReferenceList.svelte	apps/docs/src/lib/components/ReferenceList.svelte
R096	docs/src/lib/components/ResearchQuote.svelte	apps/docs/src/lib/components/ResearchQuote.svelte
A	apps/docs/src/lib/components/TableOfContents.svelte
A	apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte
A	apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts
R100	docs/src/lib/components/openVAALogo/index.ts	apps/docs/src/lib/components/openVAALogo/index.ts
R100	docs/src/lib/consts.ts	apps/docs/src/lib/consts.ts
R082	docs/src/lib/layouts/MdLayout.svelte	apps/docs/src/lib/layouts/MdLayout.svelte
R100	docs/src/lib/layouts/prism-vs.css	apps/docs/src/lib/layouts/prism-vs.css
A	apps/docs/src/lib/navigation.config.ts
R100	docs/src/lib/navigation.type.ts	apps/docs/src/lib/navigation.type.ts
R100	docs/src/lib/screenshots.ts	apps/docs/src/lib/screenshots.ts
R100	docs/src/lib/utils/navigation.ts	apps/docs/src/lib/utils/navigation.ts
R100	docs/src/routes/(content)/+layout.svelte	apps/docs/src/routes/(content)/+layout.svelte
A	apps/docs/src/routes/(content)/about/association/+page.md
A	apps/docs/src/routes/(content)/about/features/+page.md
R100	docs/src/routes/(content)/about/intro/+page.md	apps/docs/src/routes/(content)/about/intro/+page.md
R100	docs/src/routes/(content)/about/newsletter/+page.svelte	apps/docs/src/routes/(content)/about/newsletter/+page.svelte
A	apps/docs/src/routes/(content)/about/project/+page.md
A	apps/docs/src/routes/(content)/about/roadmap/+page.md
R100	docs/src/routes/(content)/about/rules/+page.md	apps/docs/src/routes/(content)/about/rules/+page.md
A	apps/docs/src/routes/(content)/developers-guide/about-these-docs/+page.md
A	apps/docs/src/routes/(content)/developers-guide/admin-app/+page.md
A	apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/architecture/+page.md
A	apps/docs/src/routes/(content)/developers-guide/auto-documentation/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/customized-behaviour/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/default-data-loading/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/generated-types/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md
A	apps/docs/src/routes/(content)/developers-guide/backend/mock-data-generation/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/plugins/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/preparing-backend-dependencies/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/re-generating-types/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/running-the-backend-separately/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/backend/security/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/candidate-user-management/creating-a-new-candidate/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/candidate-user-management/mock-data/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/candidate-user-management/resetting-the-password/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/configuration/app-customization/+page.md
A	apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
A	apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md
A	apps/docs/src/routes/(content)/developers-guide/configuration/intro/+page.md
A	apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/defining-nominations/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/password-validation/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/ai-agents/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/issues/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/pull-request/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/recommended-ide-settings-code/+page.md
A	apps/docs/src/routes/(content)/developers-guide/contributing/workflows/+page.md
A	apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
A	apps/docs/src/routes/(content)/developers-guide/development/intro/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/development/monorepo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/development/requirements/+page.md
A	apps/docs/src/routes/(content)/developers-guide/development/running-the-development-environment/+page.md
A	apps/docs/src/routes/(content)/developers-guide/development/seed-data/+page.md
A	apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/accessing-data-and-state-management/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/accordionSelect/AccordionSelect/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/alert/Alert/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/avatar/Avatar/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/button/Button/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/buttonWithConfirmation/ButtonWithConfirmation/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/categoryTag/CategoryTag/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/constituencySelector/ConstituencySelector/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/constituencySelector/SingleGroupConstituencySelector/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/InfoMessages/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/ProgressBar/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/WarningMessages/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionSelector/ElectionSelector/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionSymbol/ElectionSymbol/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionTag/ElectionTag/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/EntityFilters/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/enumerated/EnumeratedEntityFilter/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/numeric/NumericEntityFilter/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/text/TextEntityFilter/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityTag/EntityTag/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/errorMessage/ErrorMessage/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/expander/Expander/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/headingGroup/HeadingGroup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/headingGroup/PreHeading/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/hero/Hero/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/heroEmoji/HeroEmoji/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/icon/Icon/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/icon/PreviewAllIcons/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/image/Image/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/infoAnswer/InfoAnswer/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/infoBadge/InfoBadge/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/Input/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/InputGroup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/PreviewAllInputs/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/QuestionInput/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/parts/ImagePart/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/parts/MultilingualTextPart/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/parts/MultipleTextPart/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/parts/SelectMultiplePart/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/loading/Loading/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/matchScore/MatchScore/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/Modal/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/ModalContainer/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/confirmation/ConfirmationModal/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawer/Drawer/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawerHost/DrawerHost/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/timed/TimedModal/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/notification/Notification/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/openVAALogo/OpenVAALogo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/preventNavigation/PreventNavigation/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/NumberScaleInput/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/OpinionQuestionInput/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionActions/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionArguments/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionBasicInfo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionChoices/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionExtendedInfo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionExtendedInfoButton/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionOpenAnswer/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/scoreGauge/ScoreGauge/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/select/Select/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/subMatches/SubMatches/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/successMessage/SuccessMessage/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/tabs/Tabs/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/term/Term/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/toggle/Toggle/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/video/Video/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/warning/Warning/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/contactSupport/ContactSupport/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailEntry/EmailEntry/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailField/EmailField/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailSentPanel/EmailSentPanel/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailSentPanel/EmailSentResend/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/logoutButton/LogoutButton/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/notEditableNote/NotEditableNote/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/nothingToEdit/NothingToEdit/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/passwordField/PasswordField/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/passwordSetter/PasswordSetter/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/passwordSignIn/PasswordSignIn/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/passwordValidator/PasswordValidator/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/preregisteredNotification/PreregisteredNotification/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/registrationCodeField/RegistrationCodeField/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/registrationModeSelector/RegistrationModeSelector/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/termsOfUse/TermsOfUse/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/termsOfUse/TermsOfUseForm/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/appLogo/AppLogo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/DataConsent/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/DataConsentInfoButton/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/popup/DataConsentPopup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCard/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityChildren/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityDetails/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityInfo/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityOpinions/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/InfoItem/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityList/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityListControls/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityListWithControls/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entitySelector/EntitySelector/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/Feedback/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/modal/FeedbackModal/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/popup/FeedbackPopup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/footer/Footer/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/logoutButton/LogoutButton/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/NavGroup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/NavItem/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/Navigation/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/admin/AdminNav/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/contestant/ContestantNav/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/languages/LanguageSelection/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/voter/VoterNav/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/questionHeading/QuestionHeading/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/SurveyButton/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/banner/SurveyBanner/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/popup/SurveyPopup/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/data-api-and-adapters/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/data-api/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/frontend/environmental-variables/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md
A	apps/docs/src/routes/(content)/developers-guide/frontend/styling/+page.md
R100	docs/src/routes/(content)/developers-guide/frontend/styling/color-test.txt	apps/docs/src/routes/(content)/developers-guide/frontend/styling/color-test.txt
A	apps/docs/src/routes/(content)/developers-guide/llm-features/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/intro/+page.md
A	apps/docs/src/routes/(content)/developers-guide/localization/local-translations/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/locale-resolution/+page.md
A	apps/docs/src/routes/(content)/developers-guide/localization/locale-routes/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/locale-selection-step-by-step/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/localization-in-the-frontend/+page.ts
A	apps/docs/src/routes/(content)/developers-guide/localization/storing-multi-locale-data/+page.md
A	apps/docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md
A	apps/docs/src/routes/(content)/developers-guide/localization/translations-and-overrides/+page.md
A	apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md
A	apps/docs/src/routes/(content)/developers-guide/troubleshooting/+page.md
R100	docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/intro/+page.md	apps/docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/intro/+page.md
R100	docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/marketing/+page.md	apps/docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/marketing/+page.md
R100	docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/user-support/+page.md	apps/docs/src/routes/(content)/publishers-guide/after-publishing-the-vaa/user-support/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
R100	docs/src/routes/(content)/publishers-guide/data-collection/additional-data-for-the-voter/+page.md	apps/docs/src/routes/(content)/publishers-guide/data-collection/additional-data-for-the-voter/+page.md
R100	docs/src/routes/(content)/publishers-guide/data-collection/candidates-or-parties-answers/+page.md	apps/docs/src/routes/(content)/publishers-guide/data-collection/candidates-or-parties-answers/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/data-collection/data-from-final-election-lists/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/data-collection/initial-data/+page.md
R100	docs/src/routes/(content)/publishers-guide/data-collection/intro/+page.md	apps/docs/src/routes/(content)/publishers-guide/data-collection/intro/+page.md
R100	docs/src/routes/(content)/publishers-guide/data-collection/moderation-of-candidate-answers/+page.md	apps/docs/src/routes/(content)/publishers-guide/data-collection/moderation-of-candidate-answers/+page.md
R100	docs/src/routes/(content)/publishers-guide/intro/+page.md	apps/docs/src/routes/(content)/publishers-guide/intro/+page.md
R100	docs/src/routes/(content)/publishers-guide/other-information-sources/+page.md	apps/docs/src/routes/(content)/publishers-guide/other-information-sources/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/intro/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/intro/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/languages-will-the-vaa-be/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/matching/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/the-application-be-hosted/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/the-specifics-of-the-elections/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/the-specifics-of-the-elections/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/the-statements-or-questions-posed/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/the-vaa-look-and-feel/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/the-vaa-look-and-feel/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/the-voter-see-when-using/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/timeline/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/timeline/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/to-ask-voters-to-give/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/to-ask-voters-to-give/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/to-offer-a-survey-for/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/to-offer-a-survey-for/+page.md
A	apps/docs/src/routes/(content)/publishers-guide/preparing/what-data-should-be-collected/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/what-other-information-is-collected/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/what-other-information-is-collected/+page.md
R100	docs/src/routes/(content)/publishers-guide/preparing/who-is-the-target-group/+page.md	apps/docs/src/routes/(content)/publishers-guide/preparing/who-is-the-target-group/+page.md
R100	docs/src/routes/(content)/publishers-guide/publish-with-openvaa/+page.md	apps/docs/src/routes/(content)/publishers-guide/publish-with-openvaa/+page.md
R100	docs/src/routes/(content)/publishers-guide/what-are-vaas/intro/+page.md	apps/docs/src/routes/(content)/publishers-guide/what-are-vaas/intro/+page.md
R100	docs/src/routes/(content)/publishers-guide/what-are-vaas/vaas-used/+page.md	apps/docs/src/routes/(content)/publishers-guide/what-are-vaas/vaas-used/+page.md
A	apps/docs/src/routes/+layout.svelte
A	apps/docs/src/routes/+page.svelte
R100	docs/src/routes/layout.css	apps/docs/src/routes/layout.css
R100	docs/static/favicon.png	apps/docs/static/favicon.png
R100	docs/static/images/guides/category-selection.png	apps/docs/static/images/guides/category-selection.png
R100	docs/static/images/guides/distance-matrices.png	apps/docs/static/images/guides/distance-matrices.png
R100	docs/static/images/guides/highlight-template.psd	apps/docs/static/images/guides/highlight-template.psd
R100	docs/static/images/guides/nested-candidate-matches-within-parties.png	apps/docs/static/images/guides/nested-candidate-matches-within-parties.png
R100	docs/static/images/guides/quick-results.png	apps/docs/static/images/guides/quick-results.png
R100	docs/static/images/guides/results-filters.png	apps/docs/static/images/guides/results-filters.png
R100	docs/static/images/guides/results-link.png	apps/docs/static/images/guides/results-link.png
R100	docs/static/images/guides/skip-statement.png	apps/docs/static/images/guides/skip-statement.png
R100	docs/static/images/guides/subcategory-matches.png	apps/docs/static/images/guides/subcategory-matches.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-1.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-1.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-10.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-10.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-11.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-11.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-3.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-3.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-4.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-4.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-6.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-6.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-7.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-7.png
R100	docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-8.png	apps/docs/static/images/screenshots/eu-elections-2024-vaa-screenshot-8.png
R100	docs/static/images/screenshots/luxembourg-vaa-eu-elections-2024-1.png	apps/docs/static/images/screenshots/luxembourg-vaa-eu-elections-2024-1.png
R100	docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-1.png	apps/docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-1.png
R100	docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-2.png	apps/docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-2.png
R100	docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-3.png	apps/docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-3.png
R100	docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-educational-mode-1.png	apps/docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-educational-mode-1.png
R100	docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-educational-mode-2.png	apps/docs/static/images/screenshots/nuorisoala-finnish-local-elections-2025-vaa-educational-mode-2.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-1.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-1.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-10.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-10.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-4.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-4.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-5.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-5.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-6.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-6.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-7.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-7.png
R100	docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-9.png	apps/docs/static/images/screenshots/nuortenvaalikone.fi-videoversio-ilman-kannykkaa-9.png
R100	docs/static/images/shiba-inu-facing-front.png	apps/docs/static/images/shiba-inu-facing-front.png
R100	docs/static/images/shiba-inu-sitting.png	apps/docs/static/images/shiba-inu-sitting.png
R100	docs/static/images/youthvotes-logo.png	apps/docs/static/images/youthvotes-logo.png
A	apps/docs/svelte.config.js
A	apps/docs/tailwind.config.mjs
A	apps/docs/tsconfig.json
A	apps/docs/turbo.json
R100	docs/vite.config.ts	apps/docs/vite.config.ts
R100	frontend/.dockerignore	apps/frontend/.dockerignore
A	apps/frontend/.env.example
A	apps/frontend/.gitignore
R100	frontend/.npmrc	apps/frontend/.npmrc
R100	frontend/.prettierignore	apps/frontend/.prettierignore
A	apps/frontend/Dockerfile
A	apps/frontend/README.md
A	apps/frontend/docker-compose.dev.yml
A	apps/frontend/eslint.config.mjs
A	apps/frontend/messages/README.md
A	apps/frontend/messages/da/about.json
A	apps/frontend/messages/da/adminApp.argumentCondensation.json
A	apps/frontend/messages/da/adminApp.common.json
A	apps/frontend/messages/da/adminApp.error.json
A	apps/frontend/messages/da/adminApp.factorAnalysis.json
A	apps/frontend/messages/da/adminApp.jobs.json
A	apps/frontend/messages/da/adminApp.languageFeatures.json
A	apps/frontend/messages/da/adminApp.login.json
A	apps/frontend/messages/da/adminApp.notSupported.json
A	apps/frontend/messages/da/adminApp.questionInfo.json
A	apps/frontend/messages/da/common.json
A	apps/frontend/messages/da/components.json
A	apps/frontend/messages/da/constituencies.json
A	apps/frontend/messages/da/contestantApp.basicInfo.json
A	apps/frontend/messages/da/contestantApp.common.json
A	apps/frontend/messages/da/contestantApp.emailSent.json
A	apps/frontend/messages/da/contestantApp.entitySelection.json
A	apps/frontend/messages/da/contestantApp.error.json
A	apps/frontend/messages/da/contestantApp.help.json
A	apps/frontend/messages/da/contestantApp.home.json
A	apps/frontend/messages/da/contestantApp.info.json
A	apps/frontend/messages/da/contestantApp.login.json
A	apps/frontend/messages/da/contestantApp.logoutModal.json
A	apps/frontend/messages/da/contestantApp.nominations.json
A	apps/frontend/messages/da/contestantApp.notSupported.json
A	apps/frontend/messages/da/contestantApp.nothingToEdit.json
A	apps/frontend/messages/da/contestantApp.preregister.json
A	apps/frontend/messages/da/contestantApp.preview.json
A	apps/frontend/messages/da/contestantApp.privacy.json
A	apps/frontend/messages/da/contestantApp.questions.json
A	apps/frontend/messages/da/contestantApp.register.json
A	apps/frontend/messages/da/contestantApp.resetPassword.json
A	apps/frontend/messages/da/contestantApp.setPassword.json
A	apps/frontend/messages/da/contestantApp.settings.json
A	apps/frontend/messages/da/dynamic.json
A	apps/frontend/messages/da/elections.json
A	apps/frontend/messages/da/entityCard.json
A	apps/frontend/messages/da/entityDetails.json
A	apps/frontend/messages/da/entityFilters.json
A	apps/frontend/messages/da/entityList.json
A	apps/frontend/messages/da/error.json
A	apps/frontend/messages/da/feedback.json
A	apps/frontend/messages/da/help.json
A	apps/frontend/messages/da/info.json
A	apps/frontend/messages/da/lang.json
A	apps/frontend/messages/da/maintenance.json
A	apps/frontend/messages/da/privacy.json
A	apps/frontend/messages/da/questions.json
A	apps/frontend/messages/da/results.json
A	apps/frontend/messages/da/statistics.json
A	apps/frontend/messages/da/yourList.json
A	apps/frontend/messages/en/about.json
A	apps/frontend/messages/en/adminApp.argumentCondensation.json
A	apps/frontend/messages/en/adminApp.common.json
A	apps/frontend/messages/en/adminApp.error.json
A	apps/frontend/messages/en/adminApp.factorAnalysis.json
A	apps/frontend/messages/en/adminApp.jobs.json
A	apps/frontend/messages/en/adminApp.languageFeatures.json
A	apps/frontend/messages/en/adminApp.login.json
A	apps/frontend/messages/en/adminApp.notSupported.json
A	apps/frontend/messages/en/adminApp.questionInfo.json
A	apps/frontend/messages/en/common.json
A	apps/frontend/messages/en/components.json
A	apps/frontend/messages/en/constituencies.json
A	apps/frontend/messages/en/contestantApp.basicInfo.json
A	apps/frontend/messages/en/contestantApp.common.json
A	apps/frontend/messages/en/contestantApp.emailSent.json
A	apps/frontend/messages/en/contestantApp.entitySelection.json
A	apps/frontend/messages/en/contestantApp.error.json
A	apps/frontend/messages/en/contestantApp.help.json
A	apps/frontend/messages/en/contestantApp.home.json
A	apps/frontend/messages/en/contestantApp.info.json
A	apps/frontend/messages/en/contestantApp.login.json
A	apps/frontend/messages/en/contestantApp.logoutModal.json
A	apps/frontend/messages/en/contestantApp.nominations.json
A	apps/frontend/messages/en/contestantApp.notSupported.json
A	apps/frontend/messages/en/contestantApp.nothingToEdit.json
A	apps/frontend/messages/en/contestantApp.preregister.json
A	apps/frontend/messages/en/contestantApp.preview.json
A	apps/frontend/messages/en/contestantApp.privacy.json
A	apps/frontend/messages/en/contestantApp.questions.json
A	apps/frontend/messages/en/contestantApp.register.json
A	apps/frontend/messages/en/contestantApp.resetPassword.json
A	apps/frontend/messages/en/contestantApp.setPassword.json
A	apps/frontend/messages/en/contestantApp.settings.json
A	apps/frontend/messages/en/dynamic.json
A	apps/frontend/messages/en/elections.json
A	apps/frontend/messages/en/entityCard.json
A	apps/frontend/messages/en/entityDetails.json
A	apps/frontend/messages/en/entityFilters.json
A	apps/frontend/messages/en/entityList.json
A	apps/frontend/messages/en/error.json
A	apps/frontend/messages/en/feedback.json
A	apps/frontend/messages/en/help.json
A	apps/frontend/messages/en/info.json
A	apps/frontend/messages/en/lang.json
A	apps/frontend/messages/en/maintenance.json
A	apps/frontend/messages/en/privacy.json
A	apps/frontend/messages/en/questions.json
A	apps/frontend/messages/en/results.json
A	apps/frontend/messages/en/statistics.json
A	apps/frontend/messages/en/yourList.json
A	apps/frontend/messages/et/about.json
A	apps/frontend/messages/et/adminApp.argumentCondensation.json
A	apps/frontend/messages/et/adminApp.common.json
A	apps/frontend/messages/et/adminApp.error.json
A	apps/frontend/messages/et/adminApp.factorAnalysis.json
A	apps/frontend/messages/et/adminApp.jobs.json
A	apps/frontend/messages/et/adminApp.languageFeatures.json
A	apps/frontend/messages/et/adminApp.login.json
A	apps/frontend/messages/et/adminApp.notSupported.json
A	apps/frontend/messages/et/adminApp.questionInfo.json
A	apps/frontend/messages/et/common.json
A	apps/frontend/messages/et/components.json
A	apps/frontend/messages/et/constituencies.json
A	apps/frontend/messages/et/contestantApp.basicInfo.json
A	apps/frontend/messages/et/contestantApp.common.json
A	apps/frontend/messages/et/contestantApp.emailSent.json
A	apps/frontend/messages/et/contestantApp.entitySelection.json
A	apps/frontend/messages/et/contestantApp.error.json
A	apps/frontend/messages/et/contestantApp.help.json
A	apps/frontend/messages/et/contestantApp.home.json
A	apps/frontend/messages/et/contestantApp.info.json
A	apps/frontend/messages/et/contestantApp.login.json
A	apps/frontend/messages/et/contestantApp.logoutModal.json
A	apps/frontend/messages/et/contestantApp.nominations.json
A	apps/frontend/messages/et/contestantApp.notSupported.json
A	apps/frontend/messages/et/contestantApp.nothingToEdit.json
A	apps/frontend/messages/et/contestantApp.preregister.json
A	apps/frontend/messages/et/contestantApp.preview.json
A	apps/frontend/messages/et/contestantApp.privacy.json
A	apps/frontend/messages/et/contestantApp.questions.json
A	apps/frontend/messages/et/contestantApp.register.json
A	apps/frontend/messages/et/contestantApp.resetPassword.json
A	apps/frontend/messages/et/contestantApp.setPassword.json
A	apps/frontend/messages/et/contestantApp.settings.json
A	apps/frontend/messages/et/dynamic.json
A	apps/frontend/messages/et/elections.json
A	apps/frontend/messages/et/entityCard.json
A	apps/frontend/messages/et/entityDetails.json
A	apps/frontend/messages/et/entityFilters.json
A	apps/frontend/messages/et/entityList.json
A	apps/frontend/messages/et/error.json
A	apps/frontend/messages/et/feedback.json
A	apps/frontend/messages/et/help.json
A	apps/frontend/messages/et/info.json
A	apps/frontend/messages/et/lang.json
A	apps/frontend/messages/et/maintenance.json
A	apps/frontend/messages/et/privacy.json
A	apps/frontend/messages/et/questions.json
A	apps/frontend/messages/et/results.json
A	apps/frontend/messages/et/statistics.json
A	apps/frontend/messages/et/yourList.json
A	apps/frontend/messages/fi/about.json
A	apps/frontend/messages/fi/adminApp.argumentCondensation.json
A	apps/frontend/messages/fi/adminApp.common.json
A	apps/frontend/messages/fi/adminApp.error.json
A	apps/frontend/messages/fi/adminApp.factorAnalysis.json
A	apps/frontend/messages/fi/adminApp.jobs.json
A	apps/frontend/messages/fi/adminApp.languageFeatures.json
A	apps/frontend/messages/fi/adminApp.login.json
A	apps/frontend/messages/fi/adminApp.notSupported.json
A	apps/frontend/messages/fi/adminApp.questionInfo.json
A	apps/frontend/messages/fi/common.json
A	apps/frontend/messages/fi/components.json
A	apps/frontend/messages/fi/constituencies.json
A	apps/frontend/messages/fi/contestantApp.basicInfo.json
A	apps/frontend/messages/fi/contestantApp.common.json
A	apps/frontend/messages/fi/contestantApp.emailSent.json
A	apps/frontend/messages/fi/contestantApp.entitySelection.json
A	apps/frontend/messages/fi/contestantApp.error.json
A	apps/frontend/messages/fi/contestantApp.help.json
A	apps/frontend/messages/fi/contestantApp.home.json
A	apps/frontend/messages/fi/contestantApp.info.json
A	apps/frontend/messages/fi/contestantApp.login.json
A	apps/frontend/messages/fi/contestantApp.logoutModal.json
A	apps/frontend/messages/fi/contestantApp.nominations.json
A	apps/frontend/messages/fi/contestantApp.notSupported.json
A	apps/frontend/messages/fi/contestantApp.nothingToEdit.json
A	apps/frontend/messages/fi/contestantApp.preregister.json
A	apps/frontend/messages/fi/contestantApp.preview.json
A	apps/frontend/messages/fi/contestantApp.privacy.json
A	apps/frontend/messages/fi/contestantApp.questions.json
A	apps/frontend/messages/fi/contestantApp.register.json
A	apps/frontend/messages/fi/contestantApp.resetPassword.json
A	apps/frontend/messages/fi/contestantApp.setPassword.json
A	apps/frontend/messages/fi/contestantApp.settings.json
A	apps/frontend/messages/fi/dynamic.json
A	apps/frontend/messages/fi/elections.json
A	apps/frontend/messages/fi/entityCard.json
A	apps/frontend/messages/fi/entityDetails.json
A	apps/frontend/messages/fi/entityFilters.json
A	apps/frontend/messages/fi/entityList.json
A	apps/frontend/messages/fi/error.json
A	apps/frontend/messages/fi/feedback.json
A	apps/frontend/messages/fi/help.json
A	apps/frontend/messages/fi/info.json
A	apps/frontend/messages/fi/lang.json
A	apps/frontend/messages/fi/maintenance.json
A	apps/frontend/messages/fi/privacy.json
A	apps/frontend/messages/fi/questions.json
A	apps/frontend/messages/fi/results.json
A	apps/frontend/messages/fi/statistics.json
A	apps/frontend/messages/fi/yourList.json
A	apps/frontend/messages/fr/about.json
A	apps/frontend/messages/fr/adminApp.argumentCondensation.json
A	apps/frontend/messages/fr/adminApp.common.json
A	apps/frontend/messages/fr/adminApp.error.json
A	apps/frontend/messages/fr/adminApp.factorAnalysis.json
A	apps/frontend/messages/fr/adminApp.jobs.json
A	apps/frontend/messages/fr/adminApp.languageFeatures.json
A	apps/frontend/messages/fr/adminApp.login.json
A	apps/frontend/messages/fr/adminApp.notSupported.json
A	apps/frontend/messages/fr/adminApp.questionInfo.json
A	apps/frontend/messages/fr/common.json
A	apps/frontend/messages/fr/components.json
A	apps/frontend/messages/fr/constituencies.json
A	apps/frontend/messages/fr/contestantApp.basicInfo.json
A	apps/frontend/messages/fr/contestantApp.common.json
A	apps/frontend/messages/fr/contestantApp.emailSent.json
A	apps/frontend/messages/fr/contestantApp.entitySelection.json
A	apps/frontend/messages/fr/contestantApp.error.json
A	apps/frontend/messages/fr/contestantApp.help.json
A	apps/frontend/messages/fr/contestantApp.home.json
A	apps/frontend/messages/fr/contestantApp.info.json
A	apps/frontend/messages/fr/contestantApp.login.json
A	apps/frontend/messages/fr/contestantApp.logoutModal.json
A	apps/frontend/messages/fr/contestantApp.nominations.json
A	apps/frontend/messages/fr/contestantApp.notSupported.json
A	apps/frontend/messages/fr/contestantApp.nothingToEdit.json
A	apps/frontend/messages/fr/contestantApp.preregister.json
A	apps/frontend/messages/fr/contestantApp.preview.json
A	apps/frontend/messages/fr/contestantApp.privacy.json
A	apps/frontend/messages/fr/contestantApp.questions.json
A	apps/frontend/messages/fr/contestantApp.register.json
A	apps/frontend/messages/fr/contestantApp.resetPassword.json
A	apps/frontend/messages/fr/contestantApp.setPassword.json
A	apps/frontend/messages/fr/contestantApp.settings.json
A	apps/frontend/messages/fr/dynamic.json
A	apps/frontend/messages/fr/elections.json
A	apps/frontend/messages/fr/entityCard.json
A	apps/frontend/messages/fr/entityDetails.json
A	apps/frontend/messages/fr/entityFilters.json
A	apps/frontend/messages/fr/entityList.json
A	apps/frontend/messages/fr/error.json
A	apps/frontend/messages/fr/feedback.json
A	apps/frontend/messages/fr/help.json
A	apps/frontend/messages/fr/info.json
A	apps/frontend/messages/fr/lang.json
A	apps/frontend/messages/fr/maintenance.json
A	apps/frontend/messages/fr/privacy.json
A	apps/frontend/messages/fr/questions.json
A	apps/frontend/messages/fr/results.json
A	apps/frontend/messages/fr/statistics.json
A	apps/frontend/messages/fr/yourList.json
A	apps/frontend/messages/lb/about.json
A	apps/frontend/messages/lb/adminApp.argumentCondensation.json
A	apps/frontend/messages/lb/adminApp.common.json
A	apps/frontend/messages/lb/adminApp.error.json
A	apps/frontend/messages/lb/adminApp.factorAnalysis.json
A	apps/frontend/messages/lb/adminApp.jobs.json
A	apps/frontend/messages/lb/adminApp.languageFeatures.json
A	apps/frontend/messages/lb/adminApp.login.json
A	apps/frontend/messages/lb/adminApp.notSupported.json
A	apps/frontend/messages/lb/adminApp.questionInfo.json
A	apps/frontend/messages/lb/common.json
A	apps/frontend/messages/lb/components.json
A	apps/frontend/messages/lb/constituencies.json
A	apps/frontend/messages/lb/contestantApp.basicInfo.json
A	apps/frontend/messages/lb/contestantApp.common.json
A	apps/frontend/messages/lb/contestantApp.emailSent.json
A	apps/frontend/messages/lb/contestantApp.entitySelection.json
A	apps/frontend/messages/lb/contestantApp.error.json
A	apps/frontend/messages/lb/contestantApp.help.json
A	apps/frontend/messages/lb/contestantApp.home.json
A	apps/frontend/messages/lb/contestantApp.info.json
A	apps/frontend/messages/lb/contestantApp.login.json
A	apps/frontend/messages/lb/contestantApp.logoutModal.json
A	apps/frontend/messages/lb/contestantApp.nominations.json
A	apps/frontend/messages/lb/contestantApp.notSupported.json
A	apps/frontend/messages/lb/contestantApp.nothingToEdit.json
A	apps/frontend/messages/lb/contestantApp.preregister.json
A	apps/frontend/messages/lb/contestantApp.preview.json
A	apps/frontend/messages/lb/contestantApp.privacy.json
A	apps/frontend/messages/lb/contestantApp.questions.json
A	apps/frontend/messages/lb/contestantApp.register.json
A	apps/frontend/messages/lb/contestantApp.resetPassword.json
A	apps/frontend/messages/lb/contestantApp.setPassword.json
A	apps/frontend/messages/lb/contestantApp.settings.json
A	apps/frontend/messages/lb/dynamic.json
A	apps/frontend/messages/lb/elections.json
A	apps/frontend/messages/lb/entityCard.json
A	apps/frontend/messages/lb/entityDetails.json
A	apps/frontend/messages/lb/entityFilters.json
A	apps/frontend/messages/lb/entityList.json
A	apps/frontend/messages/lb/error.json
A	apps/frontend/messages/lb/feedback.json
A	apps/frontend/messages/lb/help.json
A	apps/frontend/messages/lb/info.json
A	apps/frontend/messages/lb/lang.json
A	apps/frontend/messages/lb/maintenance.json
A	apps/frontend/messages/lb/privacy.json
A	apps/frontend/messages/lb/questions.json
A	apps/frontend/messages/lb/results.json
A	apps/frontend/messages/lb/statistics.json
A	apps/frontend/messages/lb/yourList.json
A	apps/frontend/messages/sv/about.json
A	apps/frontend/messages/sv/adminApp.argumentCondensation.json
A	apps/frontend/messages/sv/adminApp.common.json
A	apps/frontend/messages/sv/adminApp.error.json
A	apps/frontend/messages/sv/adminApp.factorAnalysis.json
A	apps/frontend/messages/sv/adminApp.jobs.json
A	apps/frontend/messages/sv/adminApp.languageFeatures.json
A	apps/frontend/messages/sv/adminApp.login.json
A	apps/frontend/messages/sv/adminApp.notSupported.json
A	apps/frontend/messages/sv/adminApp.questionInfo.json
A	apps/frontend/messages/sv/common.json
A	apps/frontend/messages/sv/components.json
A	apps/frontend/messages/sv/constituencies.json
A	apps/frontend/messages/sv/contestantApp.basicInfo.json
A	apps/frontend/messages/sv/contestantApp.common.json
A	apps/frontend/messages/sv/contestantApp.emailSent.json
A	apps/frontend/messages/sv/contestantApp.entitySelection.json
A	apps/frontend/messages/sv/contestantApp.error.json
A	apps/frontend/messages/sv/contestantApp.help.json
A	apps/frontend/messages/sv/contestantApp.home.json
A	apps/frontend/messages/sv/contestantApp.info.json
A	apps/frontend/messages/sv/contestantApp.login.json
A	apps/frontend/messages/sv/contestantApp.logoutModal.json
A	apps/frontend/messages/sv/contestantApp.nominations.json
A	apps/frontend/messages/sv/contestantApp.notSupported.json
A	apps/frontend/messages/sv/contestantApp.nothingToEdit.json
A	apps/frontend/messages/sv/contestantApp.preregister.json
A	apps/frontend/messages/sv/contestantApp.preview.json
A	apps/frontend/messages/sv/contestantApp.privacy.json
A	apps/frontend/messages/sv/contestantApp.questions.json
A	apps/frontend/messages/sv/contestantApp.register.json
A	apps/frontend/messages/sv/contestantApp.resetPassword.json
A	apps/frontend/messages/sv/contestantApp.setPassword.json
A	apps/frontend/messages/sv/contestantApp.settings.json
A	apps/frontend/messages/sv/dynamic.json
A	apps/frontend/messages/sv/elections.json
A	apps/frontend/messages/sv/entityCard.json
A	apps/frontend/messages/sv/entityDetails.json
A	apps/frontend/messages/sv/entityFilters.json
A	apps/frontend/messages/sv/entityList.json
A	apps/frontend/messages/sv/error.json
A	apps/frontend/messages/sv/feedback.json
A	apps/frontend/messages/sv/help.json
A	apps/frontend/messages/sv/info.json
A	apps/frontend/messages/sv/lang.json
A	apps/frontend/messages/sv/maintenance.json
A	apps/frontend/messages/sv/privacy.json
A	apps/frontend/messages/sv/questions.json
A	apps/frontend/messages/sv/results.json
A	apps/frontend/messages/sv/statistics.json
A	apps/frontend/messages/sv/yourList.json
A	apps/frontend/package.json
A	apps/frontend/paraglide.options.ts
R100	frontend/prettier.config.mjs	apps/frontend/prettier.config.mjs
A	apps/frontend/project.inlang/settings.json
A	apps/frontend/scripts/compile-paraglide.ts
A	apps/frontend/scripts/flatten-current-codemod.mjs
A	apps/frontend/scripts/store-to-state-codemod.mjs
A	apps/frontend/src/app.css
A	apps/frontend/src/app.d.ts
A	apps/frontend/src/app.html
R086	frontend/src/error.html	apps/frontend/src/error.html
A	apps/frontend/src/hooks.client.ts
A	apps/frontend/src/hooks.server.ts
A	apps/frontend/src/hooks.ts
A	apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
A	apps/frontend/src/lib/_guards/eslint-adapter-singleton-guard.test.ts
A	apps/frontend/src/lib/_guards/eslint-parse-posture-guard.test.ts
A	apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
A	apps/frontend/src/lib/_guards/spike-scaffolding.test.ts
A	apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte
A	apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte.test.ts
R100	frontend/src/lib/admin/components/jobs/FeatureJobs.type.ts	apps/frontend/src/lib/admin/components/jobs/FeatureJobs.type.ts
A	apps/frontend/src/lib/admin/components/jobs/JobDetails.svelte
R100	frontend/src/lib/admin/components/jobs/JobDetails.type.ts	apps/frontend/src/lib/admin/components/jobs/JobDetails.type.ts
A	apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte
R100	frontend/src/lib/admin/components/jobs/index.ts	apps/frontend/src/lib/admin/components/jobs/index.ts
R100	frontend/src/lib/admin/components/jobs/shared.ts	apps/frontend/src/lib/admin/components/jobs/shared.ts
A	apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte
A	apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.type.ts
R100	frontend/src/lib/admin/components/languageFeatures/index.ts	apps/frontend/src/lib/admin/components/languageFeatures/index.ts
R095	frontend/src/lib/admin/features.ts	apps/frontend/src/lib/admin/features.ts
R083	frontend/src/lib/admin/utils/loadElectionData.ts	apps/frontend/src/lib/admin/utils/loadElectionData.ts
R100	frontend/src/lib/admin/utils/loginError.ts	apps/frontend/src/lib/admin/utils/loginError.ts
A	apps/frontend/src/lib/analytics/analyticsEvent.type.ts
A	apps/frontend/src/lib/analytics/appOfRoute.test.ts
A	apps/frontend/src/lib/analytics/appOfRoute.ts
A	apps/frontend/src/lib/analytics/batch.schema.test.ts
A	apps/frontend/src/lib/analytics/batch.schema.ts
A	apps/frontend/src/lib/analytics/constants.ts
A	apps/frontend/src/lib/analytics/events.fixtures.ts
A	apps/frontend/src/lib/analytics/events.schema.test.ts
A	apps/frontend/src/lib/analytics/events.schema.ts
A	apps/frontend/src/lib/analytics/mappers/toLogRecord.test.ts
A	apps/frontend/src/lib/analytics/mappers/toLogRecord.ts
A	apps/frontend/src/lib/analytics/mappers/toOtelLogRecord.test.ts
A	apps/frontend/src/lib/analytics/mappers/toOtelLogRecord.ts
A	apps/frontend/src/lib/analytics/modes.ts
A	apps/frontend/src/lib/analytics/pageviewRoutes.test.ts
A	apps/frontend/src/lib/analytics/pageviewRoutes.ts
A	apps/frontend/src/lib/analytics/uuidv7.test.ts
A	apps/frontend/src/lib/analytics/uuidv7.ts
A	apps/frontend/src/lib/api/README.md
R079	frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts	apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts
R100	frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.type.ts	apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.type.ts
R100	frontend/src/lib/api/adapters/apiRoute/apiRoutes.ts	apps/frontend/src/lib/api/adapters/apiRoute/apiRoutes.ts
R093	frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts	apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts
R100	frontend/src/lib/api/adapters/apiRoute/feedbackWriter/apiRouteFeedbackWriter.ts	apps/frontend/src/lib/api/adapters/apiRoute/feedbackWriter/apiRouteFeedbackWriter.ts
A	apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
A	apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts
A	apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
A	apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
A	apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/fetchAllRows.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/fetchAllRows.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseFailureMessages.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseJsonbColumn.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.type.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts
A	apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
A	apps/frontend/src/lib/api/adminWriter.ts
R100	frontend/src/lib/api/base/actionResult.type.ts	apps/frontend/src/lib/api/base/actionResult.type.ts
R100	frontend/src/lib/api/base/adapterType.type.ts	apps/frontend/src/lib/api/base/adapterType.type.ts
R100	frontend/src/lib/api/base/dataProvider.type.ts	apps/frontend/src/lib/api/base/dataProvider.type.ts
R100	frontend/src/lib/api/base/dataTypes.ts	apps/frontend/src/lib/api/base/dataTypes.ts
A	apps/frontend/src/lib/api/base/dataWriter.type.ts
R100	frontend/src/lib/api/base/feedbackWriter.type.ts	apps/frontend/src/lib/api/base/feedbackWriter.type.ts
A	apps/frontend/src/lib/api/base/getDataFilters.type.ts
A	apps/frontend/src/lib/api/base/getDataOptions.type.ts
A	apps/frontend/src/lib/api/base/universalAdapter.test.ts
R075	frontend/src/lib/api/base/universalAdapter.ts	apps/frontend/src/lib/api/base/universalAdapter.ts
R084	frontend/src/lib/api/base/universalAdapter.type.ts	apps/frontend/src/lib/api/base/universalAdapter.type.ts
A	apps/frontend/src/lib/api/base/universalApiRoutes.ts
A	apps/frontend/src/lib/api/base/universalDataProvider.test.ts
R081	frontend/src/lib/api/base/universalDataProvider.ts	apps/frontend/src/lib/api/base/universalDataProvider.ts
A	apps/frontend/src/lib/api/base/universalDataWriter.ts
R100	frontend/src/lib/api/base/universalFeedbackWriter.ts	apps/frontend/src/lib/api/base/universalFeedbackWriter.ts
A	apps/frontend/src/lib/api/dataProvider.test.ts
A	apps/frontend/src/lib/api/dataProvider.ts
A	apps/frontend/src/lib/api/dataWriter.ts
A	apps/frontend/src/lib/api/feedbackWriter.ts
R100	frontend/src/lib/api/utils/addHeader.ts	apps/frontend/src/lib/api/utils/addHeader.ts
A	apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
A	apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
A	apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
A	apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
A	apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
A	apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts
A	apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.ts
R100	frontend/src/lib/api/utils/auth/generateChallenge.ts	apps/frontend/src/lib/api/utils/auth/generateChallenge.ts
A	apps/frontend/src/lib/api/utils/auth/oidcFailure.test.ts
A	apps/frontend/src/lib/api/utils/auth/oidcFailure.ts
A	apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/fixtures.test.ts
A	apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/keys.ts
A	apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/tokens.ts
A	apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
A	apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
A	apps/frontend/src/lib/api/utils/auth/providers/idura.ts
A	apps/frontend/src/lib/api/utils/auth/providers/index.ts
A	apps/frontend/src/lib/api/utils/auth/providers/requireConfigured.ts
A	apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
A	apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
A	apps/frontend/src/lib/api/utils/auth/providers/types.ts
R100	frontend/src/lib/api/utils/fail.ts	apps/frontend/src/lib/api/utils/fail.ts
R100	frontend/src/lib/api/utils/filterData.test.ts	apps/frontend/src/lib/api/utils/filterData.test.ts
R100	frontend/src/lib/api/utils/filterData.ts	apps/frontend/src/lib/api/utils/filterData.ts
R100	frontend/src/lib/api/utils/filterEntitiesByNomination.test.ts	apps/frontend/src/lib/api/utils/filterEntitiesByNomination.test.ts
R100	frontend/src/lib/api/utils/filterEntitiesByNomination.ts	apps/frontend/src/lib/api/utils/filterEntitiesByNomination.ts
R100	frontend/src/lib/api/utils/formatId.ts	apps/frontend/src/lib/api/utils/formatId.ts
A	apps/frontend/src/lib/api/utils/isRefusedResponse.ts
A	apps/frontend/src/lib/api/utils/isValidResult.test.ts
A	apps/frontend/src/lib/api/utils/isValidResult.ts
A	apps/frontend/src/lib/api/utils/parseAnswers.ts
A	apps/frontend/src/lib/api/utils/parseResponse.test.ts
A	apps/frontend/src/lib/api/utils/parseResponse.ts
R100	frontend/src/lib/api/utils/translateHeroContent.test.ts	apps/frontend/src/lib/api/utils/translateHeroContent.test.ts
R100	frontend/src/lib/api/utils/translateHeroContent.ts	apps/frontend/src/lib/api/utils/translateHeroContent.ts
A	apps/frontend/src/lib/api/utils/translateLocalizedEntity.ts
R100	frontend/src/lib/api/utils/translateQuestionArguments.ts	apps/frontend/src/lib/api/utils/translateQuestionArguments.ts
R100	frontend/src/lib/api/utils/translateQuestionInfoSections.ts	apps/frontend/src/lib/api/utils/translateQuestionInfoSections.ts
R100	frontend/src/lib/api/utils/translateQuestionTerms.ts	apps/frontend/src/lib/api/utils/translateQuestionTerms.ts
R100	frontend/src/lib/api/utils/translateVideoContent.ts	apps/frontend/src/lib/api/utils/translateVideoContent.ts
A	apps/frontend/src/lib/auth/getUserData.ts
A	apps/frontend/src/lib/auth/index.ts
A	apps/frontend/src/lib/auth/invitationCodeLogin.test.ts
A	apps/frontend/src/lib/auth/invitationCodeLogin.ts
A	apps/frontend/src/lib/auth/passwordLogin.test.ts
A	apps/frontend/src/lib/auth/passwordLogin.ts
A	apps/frontend/src/lib/auth/roles.ts
A	apps/frontend/src/lib/auth/sessionAdmission.test.ts
A	apps/frontend/src/lib/auth/sessionAdmission.ts
A	apps/frontend/src/lib/components/README.md
A	apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
R100	frontend/src/lib/components/accordionSelect/AccordionSelect.type.ts	apps/frontend/src/lib/components/accordionSelect/AccordionSelect.type.ts
R100	frontend/src/lib/components/accordionSelect/index.ts	apps/frontend/src/lib/components/accordionSelect/index.ts
A	apps/frontend/src/lib/components/alert/Alert.svelte
A	apps/frontend/src/lib/components/alert/Alert.type.ts
R100	frontend/src/lib/components/alert/index.ts	apps/frontend/src/lib/components/alert/index.ts
A	apps/frontend/src/lib/components/avatar/Avatar.svelte
R100	frontend/src/lib/components/avatar/Avatar.type.ts	apps/frontend/src/lib/components/avatar/Avatar.type.ts
R100	frontend/src/lib/components/avatar/index.ts	apps/frontend/src/lib/components/avatar/index.ts
A	apps/frontend/src/lib/components/button/Button.svelte
A	apps/frontend/src/lib/components/button/Button.type.ts
R100	frontend/src/lib/components/button/index.ts	apps/frontend/src/lib/components/button/index.ts
A	apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte
R076	frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts	apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts
R100	frontend/src/lib/components/buttonWithConfirmation/index.ts	apps/frontend/src/lib/components/buttonWithConfirmation/index.ts
A	apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte
R100	frontend/src/lib/components/categoryTag/CategoryTag.type.ts	apps/frontend/src/lib/components/categoryTag/CategoryTag.type.ts
R100	frontend/src/lib/components/categoryTag/index.ts	apps/frontend/src/lib/components/categoryTag/index.ts
A	apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
R080	frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts	apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts
A	apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte
R093	frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.type.ts	apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.type.ts
R100	frontend/src/lib/components/constituencySelector/index.ts	apps/frontend/src/lib/components/constituencySelector/index.ts
A	apps/frontend/src/lib/components/controller/InfoMessages.svelte
R100	frontend/src/lib/components/controller/InfoMessages.type.ts	apps/frontend/src/lib/components/controller/InfoMessages.type.ts
A	apps/frontend/src/lib/components/controller/ProgressBar.svelte
R100	frontend/src/lib/components/controller/ProgressBar.type.ts	apps/frontend/src/lib/components/controller/ProgressBar.type.ts
A	apps/frontend/src/lib/components/controller/WarningMessages.svelte
R100	frontend/src/lib/components/controller/WarningMessages.type.ts	apps/frontend/src/lib/components/controller/WarningMessages.type.ts
R100	frontend/src/lib/components/controller/index.ts	apps/frontend/src/lib/components/controller/index.ts
A	apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte
R100	frontend/src/lib/components/electionSelector/ElectionSelector.type.ts	apps/frontend/src/lib/components/electionSelector/ElectionSelector.type.ts
R100	frontend/src/lib/components/electionSelector/index.ts	apps/frontend/src/lib/components/electionSelector/index.ts
A	apps/frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte
R100	frontend/src/lib/components/electionSymbol/ElectionSymbol.type.ts	apps/frontend/src/lib/components/electionSymbol/ElectionSymbol.type.ts
R100	frontend/src/lib/components/electionSymbol/index.ts	apps/frontend/src/lib/components/electionSymbol/index.ts
A	apps/frontend/src/lib/components/electionTag/ElectionTag.svelte
A	apps/frontend/src/lib/components/electionTag/ElectionTag.svelte.test.ts
R100	frontend/src/lib/components/electionTag/ElectionTag.type.ts	apps/frontend/src/lib/components/electionTag/ElectionTag.type.ts
R100	frontend/src/lib/components/electionTag/index.ts	apps/frontend/src/lib/components/electionTag/index.ts
A	apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte
R100	frontend/src/lib/components/entityFilters/EntityFilters.type.ts	apps/frontend/src/lib/components/entityFilters/EntityFilters.type.ts
A	apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte
R100	frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.type.ts	apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.type.ts
R100	frontend/src/lib/components/entityFilters/enumerated/index.ts	apps/frontend/src/lib/components/entityFilters/enumerated/index.ts
R100	frontend/src/lib/components/entityFilters/index.ts	apps/frontend/src/lib/components/entityFilters/index.ts
A	apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte
R100	frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.type.ts	apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.type.ts
R100	frontend/src/lib/components/entityFilters/numeric/index.ts	apps/frontend/src/lib/components/entityFilters/numeric/index.ts
A	apps/frontend/src/lib/components/entityFilters/text/TextEntityFilter.svelte
R083	frontend/src/lib/components/entityFilters/text/TextEntityFilter.type.ts	apps/frontend/src/lib/components/entityFilters/text/TextEntityFilter.type.ts
R100	frontend/src/lib/components/entityFilters/text/index.ts	apps/frontend/src/lib/components/entityFilters/text/index.ts
A	apps/frontend/src/lib/components/entityTag/EntityTag.svelte
R085	frontend/src/lib/components/entityTag/EntityTag.type.ts	apps/frontend/src/lib/components/entityTag/EntityTag.type.ts
R100	frontend/src/lib/components/entityTag/index.ts	apps/frontend/src/lib/components/entityTag/index.ts
A	apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte
A	apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte.test.ts
R089	frontend/src/lib/components/errorMessage/ErrorMessage.type.ts	apps/frontend/src/lib/components/errorMessage/ErrorMessage.type.ts
R100	frontend/src/lib/components/errorMessage/index.ts	apps/frontend/src/lib/components/errorMessage/index.ts
A	apps/frontend/src/lib/components/expander/Expander.svelte
A	apps/frontend/src/lib/components/expander/Expander.type.ts
R100	frontend/src/lib/components/expander/index.ts	apps/frontend/src/lib/components/expander/index.ts
A	apps/frontend/src/lib/components/headingGroup/HeadingGroup.svelte
A	apps/frontend/src/lib/components/headingGroup/HeadingGroup.type.ts
A	apps/frontend/src/lib/components/headingGroup/PreHeading.svelte
A	apps/frontend/src/lib/components/headingGroup/PreHeading.type.ts
R100	frontend/src/lib/components/headingGroup/index.ts	apps/frontend/src/lib/components/headingGroup/index.ts
R079	frontend/src/lib/components/hero/Hero.svelte	apps/frontend/src/lib/components/hero/Hero.svelte
R100	frontend/src/lib/components/hero/Hero.type.ts	apps/frontend/src/lib/components/hero/Hero.type.ts
R100	frontend/src/lib/components/hero/index.ts	apps/frontend/src/lib/components/hero/index.ts
A	apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte
R100	frontend/src/lib/components/heroEmoji/HeroEmoji.type.ts	apps/frontend/src/lib/components/heroEmoji/HeroEmoji.type.ts
R100	frontend/src/lib/components/heroEmoji/index.ts	apps/frontend/src/lib/components/heroEmoji/index.ts
A	apps/frontend/src/lib/components/icon/Icon.svelte
R100	frontend/src/lib/components/icon/Icon.type.ts	apps/frontend/src/lib/components/icon/Icon.type.ts
A	apps/frontend/src/lib/components/icon/PreviewAllIcons.svelte
R100	frontend/src/lib/components/icon/PreviewAllIcons.type.ts	apps/frontend/src/lib/components/icon/PreviewAllIcons.type.ts
R099	frontend/src/lib/components/icon/icons.ts	apps/frontend/src/lib/components/icon/icons.ts
R100	frontend/src/lib/components/icon/index.ts	apps/frontend/src/lib/components/icon/index.ts
R100	frontend/src/lib/components/icon/svg/custom/missing_icon.ts	apps/frontend/src/lib/components/icon/svg/custom/missing_icon.ts
R100	frontend/src/lib/components/icon/svg/custom/opinion.ts	apps/frontend/src/lib/components/icon/svg/custom/opinion.ts
R100	frontend/src/lib/components/icon/svg/custom/skip.ts	apps/frontend/src/lib/components/icon/svg/custom/skip.ts
R100	frontend/src/lib/components/icon/svg/custom/subtitles_off.ts	apps/frontend/src/lib/components/icon/svg/custom/subtitles_off.ts
R100	frontend/src/lib/components/icon/svg/custom/subtitles_on.ts	apps/frontend/src/lib/components/icon/svg/custom/subtitles_on.ts
R100	frontend/src/lib/components/icon/svg/material/arrow_back_ios.ts	apps/frontend/src/lib/components/icon/svg/material/arrow_back_ios.ts
R100	frontend/src/lib/components/icon/svg/material/arrow_forward_ios.ts	apps/frontend/src/lib/components/icon/svg/material/arrow_forward_ios.ts
R100	frontend/src/lib/components/icon/svg/material/article.ts	apps/frontend/src/lib/components/icon/svg/material/article.ts
R100	frontend/src/lib/components/icon/svg/material/check.ts	apps/frontend/src/lib/components/icon/svg/material/check.ts
R100	frontend/src/lib/components/icon/svg/material/close.ts	apps/frontend/src/lib/components/icon/svg/material/close.ts
R100	frontend/src/lib/components/icon/svg/material/create.ts	apps/frontend/src/lib/components/icon/svg/material/create.ts
R100	frontend/src/lib/components/icon/svg/material/done_all.ts	apps/frontend/src/lib/components/icon/svg/material/done_all.ts
R100	frontend/src/lib/components/icon/svg/material/download.ts	apps/frontend/src/lib/components/icon/svg/material/download.ts
R100	frontend/src/lib/components/icon/svg/material/error.ts	apps/frontend/src/lib/components/icon/svg/material/error.ts
R100	frontend/src/lib/components/icon/svg/material/expand_less.ts	apps/frontend/src/lib/components/icon/svg/material/expand_less.ts
R100	frontend/src/lib/components/icon/svg/material/expand_more.ts	apps/frontend/src/lib/components/icon/svg/material/expand_more.ts
R100	frontend/src/lib/components/icon/svg/material/face.ts	apps/frontend/src/lib/components/icon/svg/material/face.ts
R100	frontend/src/lib/components/icon/svg/material/feedback.ts	apps/frontend/src/lib/components/icon/svg/material/feedback.ts
R100	frontend/src/lib/components/icon/svg/material/filter_alt.ts	apps/frontend/src/lib/components/icon/svg/material/filter_alt.ts
R100	frontend/src/lib/components/icon/svg/material/flag.ts	apps/frontend/src/lib/components/icon/svg/material/flag.ts
R100	frontend/src/lib/components/icon/svg/material/format_list_bulleted.ts	apps/frontend/src/lib/components/icon/svg/material/format_list_bulleted.ts
R100	frontend/src/lib/components/icon/svg/material/format_list_numbered.ts	apps/frontend/src/lib/components/icon/svg/material/format_list_numbered.ts
R100	frontend/src/lib/components/icon/svg/material/group.ts	apps/frontend/src/lib/components/icon/svg/material/group.ts
R100	frontend/src/lib/components/icon/svg/material/help.ts	apps/frontend/src/lib/components/icon/svg/material/help.ts
R100	frontend/src/lib/components/icon/svg/material/home.ts	apps/frontend/src/lib/components/icon/svg/material/home.ts
R100	frontend/src/lib/components/icon/svg/material/how_to_vote.ts	apps/frontend/src/lib/components/icon/svg/material/how_to_vote.ts
R100	frontend/src/lib/components/icon/svg/material/info.ts	apps/frontend/src/lib/components/icon/svg/material/info.ts
R100	frontend/src/lib/components/icon/svg/material/language.ts	apps/frontend/src/lib/components/icon/svg/material/language.ts
R100	frontend/src/lib/components/icon/svg/material/lightbulb.ts	apps/frontend/src/lib/components/icon/svg/material/lightbulb.ts
R100	frontend/src/lib/components/icon/svg/material/link.ts	apps/frontend/src/lib/components/icon/svg/material/link.ts
R100	frontend/src/lib/components/icon/svg/material/lock.ts	apps/frontend/src/lib/components/icon/svg/material/lock.ts
R100	frontend/src/lib/components/icon/svg/material/login.ts	apps/frontend/src/lib/components/icon/svg/material/login.ts
R100	frontend/src/lib/components/icon/svg/material/logout.ts	apps/frontend/src/lib/components/icon/svg/material/logout.ts
R100	frontend/src/lib/components/icon/svg/material/menu.ts	apps/frontend/src/lib/components/icon/svg/material/menu.ts
R100	frontend/src/lib/components/icon/svg/material/pause.ts	apps/frontend/src/lib/components/icon/svg/material/pause.ts
R100	frontend/src/lib/components/icon/svg/material/person.ts	apps/frontend/src/lib/components/icon/svg/material/person.ts
R100	frontend/src/lib/components/icon/svg/material/person_pin_circle.ts	apps/frontend/src/lib/components/icon/svg/material/person_pin_circle.ts
R100	frontend/src/lib/components/icon/svg/material/photo_camera.ts	apps/frontend/src/lib/components/icon/svg/material/photo_camera.ts
R100	frontend/src/lib/components/icon/svg/material/play_arrow.ts	apps/frontend/src/lib/components/icon/svg/material/play_arrow.ts
R100	frontend/src/lib/components/icon/svg/material/playlist_add_check.ts	apps/frontend/src/lib/components/icon/svg/material/playlist_add_check.ts
R100	frontend/src/lib/components/icon/svg/material/playlist_remove.ts	apps/frontend/src/lib/components/icon/svg/material/playlist_remove.ts
R100	frontend/src/lib/components/icon/svg/material/priority_high.ts	apps/frontend/src/lib/components/icon/svg/material/priority_high.ts
R100	frontend/src/lib/components/icon/svg/material/remove_done.ts	apps/frontend/src/lib/components/icon/svg/material/remove_done.ts
R100	frontend/src/lib/components/icon/svg/material/replay.ts	apps/frontend/src/lib/components/icon/svg/material/replay.ts
R100	frontend/src/lib/components/icon/svg/material/science.ts	apps/frontend/src/lib/components/icon/svg/material/science.ts
R100	frontend/src/lib/components/icon/svg/material/search.ts	apps/frontend/src/lib/components/icon/svg/material/search.ts
R100	frontend/src/lib/components/icon/svg/material/security.ts	apps/frontend/src/lib/components/icon/svg/material/security.ts
R100	frontend/src/lib/components/icon/svg/material/settings.ts	apps/frontend/src/lib/components/icon/svg/material/settings.ts
R100	frontend/src/lib/components/icon/svg/material/skip_next.ts	apps/frontend/src/lib/components/icon/svg/material/skip_next.ts
R100	frontend/src/lib/components/icon/svg/material/skip_previous.ts	apps/frontend/src/lib/components/icon/svg/material/skip_previous.ts
R100	frontend/src/lib/components/icon/svg/material/sort_by_alpha.ts	apps/frontend/src/lib/components/icon/svg/material/sort_by_alpha.ts
R100	frontend/src/lib/components/icon/svg/material/switch_account.ts	apps/frontend/src/lib/components/icon/svg/material/switch_account.ts
R100	frontend/src/lib/components/icon/svg/material/videocam.ts	apps/frontend/src/lib/components/icon/svg/material/videocam.ts
R100	frontend/src/lib/components/icon/svg/material/videocam_off.ts	apps/frontend/src/lib/components/icon/svg/material/videocam_off.ts
R100	frontend/src/lib/components/icon/svg/material/visibility.ts	apps/frontend/src/lib/components/icon/svg/material/visibility.ts
R100	frontend/src/lib/components/icon/svg/material/visibility_off.ts	apps/frontend/src/lib/components/icon/svg/material/visibility_off.ts
R100	frontend/src/lib/components/icon/svg/material/volume_off.ts	apps/frontend/src/lib/components/icon/svg/material/volume_off.ts
R100	frontend/src/lib/components/icon/svg/material/volume_up.ts	apps/frontend/src/lib/components/icon/svg/material/volume_up.ts
R100	frontend/src/lib/components/icon/svg/material/warning.ts	apps/frontend/src/lib/components/icon/svg/material/warning.ts
A	apps/frontend/src/lib/components/image/Image.svelte
A	apps/frontend/src/lib/components/image/Image.svelte.test.ts
R100	frontend/src/lib/components/image/Image.type.ts	apps/frontend/src/lib/components/image/Image.type.ts
R100	frontend/src/lib/components/image/index.ts	apps/frontend/src/lib/components/image/index.ts
A	apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte
R100	frontend/src/lib/components/infoAnswer/InfoAnswer.type.ts	apps/frontend/src/lib/components/infoAnswer/InfoAnswer.type.ts
R100	frontend/src/lib/components/infoAnswer/index.ts	apps/frontend/src/lib/components/infoAnswer/index.ts
A	apps/frontend/src/lib/components/infoBadge/InfoBadge.svelte
R100	frontend/src/lib/components/infoBadge/InfoBadge.type.ts	apps/frontend/src/lib/components/infoBadge/InfoBadge.type.ts
R100	frontend/src/lib/components/infoBadge/index.ts	apps/frontend/src/lib/components/infoBadge/index.ts
A	apps/frontend/src/lib/components/input/Input.color.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.described.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.labelWrap.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.requiredLocale.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.svelte
A	apps/frontend/src/lib/components/input/Input.svelte.test.ts
A	apps/frontend/src/lib/components/input/Input.type.ts
A	apps/frontend/src/lib/components/input/InputGroup.svelte
A	apps/frontend/src/lib/components/input/InputGroup.type.ts
R086	frontend/src/lib/components/input/PreviewAllInputs.svelte	apps/frontend/src/lib/components/input/PreviewAllInputs.svelte
R100	frontend/src/lib/components/input/PreviewAllInputs.type.ts	apps/frontend/src/lib/components/input/PreviewAllInputs.type.ts
A	apps/frontend/src/lib/components/input/QuestionInput.svelte
R100	frontend/src/lib/components/input/QuestionInput.type.ts	apps/frontend/src/lib/components/input/QuestionInput.type.ts
A	apps/frontend/src/lib/components/input/index.ts
A	apps/frontend/src/lib/components/input/parts/ImagePart.svelte
A	apps/frontend/src/lib/components/input/parts/ImagePart.type.ts
A	apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
A	apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts
A	apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
A	apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts
A	apps/frontend/src/lib/components/input/parts/README.md
A	apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
A	apps/frontend/src/lib/components/input/parts/SelectMultiplePart.type.ts
A	apps/frontend/src/lib/components/input/shared.ts
A	apps/frontend/src/lib/components/loading/Loading.svelte
R091	frontend/src/lib/components/loading/Loading.type.ts	apps/frontend/src/lib/components/loading/Loading.type.ts
R100	frontend/src/lib/components/loading/index.ts	apps/frontend/src/lib/components/loading/index.ts
A	apps/frontend/src/lib/components/matchScore/MatchScore.svelte
A	apps/frontend/src/lib/components/matchScore/MatchScore.type.ts
R100	frontend/src/lib/components/matchScore/index.ts	apps/frontend/src/lib/components/matchScore/index.ts
A	apps/frontend/src/lib/components/modal/Modal.svelte
A	apps/frontend/src/lib/components/modal/Modal.type.ts
R079	frontend/src/lib/components/modal/ModalContainer.svelte	apps/frontend/src/lib/components/modal/ModalContainer.svelte
A	apps/frontend/src/lib/components/modal/ModalContainer.type.ts
A	apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte
A	apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.type.ts
R100	frontend/src/lib/components/modal/confirmation/index.ts	apps/frontend/src/lib/components/modal/confirmation/index.ts
A	apps/frontend/src/lib/components/modal/drawer/Drawer.svelte
A	apps/frontend/src/lib/components/modal/drawer/Drawer.type.ts
R100	frontend/src/lib/components/modal/drawer/index.ts	apps/frontend/src/lib/components/modal/drawer/index.ts
A	apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
A	apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte.test.ts
A	apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts
A	apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
A	apps/frontend/src/lib/components/modal/drawerHost/index.ts
R100	frontend/src/lib/components/modal/index.ts	apps/frontend/src/lib/components/modal/index.ts
A	apps/frontend/src/lib/components/modal/timed/TimedModal.svelte
A	apps/frontend/src/lib/components/modal/timed/TimedModal.type.ts
R100	frontend/src/lib/components/modal/timed/index.ts	apps/frontend/src/lib/components/modal/timed/index.ts
A	apps/frontend/src/lib/components/notification/Notification.svelte
R100	frontend/src/lib/components/notification/Notification.type.ts	apps/frontend/src/lib/components/notification/Notification.type.ts
R100	frontend/src/lib/components/notification/index.ts	apps/frontend/src/lib/components/notification/index.ts
A	apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte
A	apps/frontend/src/lib/components/openVAALogo/OpenVAALogo.type.ts
R100	frontend/src/lib/components/openVAALogo/index.ts	apps/frontend/src/lib/components/openVAALogo/index.ts
A	apps/frontend/src/lib/components/preventNavigation/PreventNavigation.svelte
R100	frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts	apps/frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts
R100	frontend/src/lib/components/preventNavigation/index.ts	apps/frontend/src/lib/components/preventNavigation/index.ts
A	apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
A	apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
A	apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
A	apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
A	apps/frontend/src/lib/components/questions/QuestionActions.svelte
R088	frontend/src/lib/components/questions/QuestionActions.type.ts	apps/frontend/src/lib/components/questions/QuestionActions.type.ts
A	apps/frontend/src/lib/components/questions/QuestionArguments.svelte
A	apps/frontend/src/lib/components/questions/QuestionArguments.svelte.test.ts
R100	frontend/src/lib/components/questions/QuestionArguments.type.ts	apps/frontend/src/lib/components/questions/QuestionArguments.type.ts
A	apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte
R100	frontend/src/lib/components/questions/QuestionBasicInfo.type.ts	apps/frontend/src/lib/components/questions/QuestionBasicInfo.type.ts
A	apps/frontend/src/lib/components/questions/QuestionChoices.svelte
A	apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts
A	apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
A	apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
A	apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte.test.ts
A	apps/frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts
A	apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
R100	frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts	apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts
A	apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte
R100	frontend/src/lib/components/questions/QuestionOpenAnswer.type.ts	apps/frontend/src/lib/components/questions/QuestionOpenAnswer.type.ts
A	apps/frontend/src/lib/components/questions/index.ts
A	apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte
R090	frontend/src/lib/components/scoreGauge/ScoreGauge.type.ts	apps/frontend/src/lib/components/scoreGauge/ScoreGauge.type.ts
R100	frontend/src/lib/components/scoreGauge/index.ts	apps/frontend/src/lib/components/scoreGauge/index.ts
A	apps/frontend/src/lib/components/select/Select.svelte
A	apps/frontend/src/lib/components/select/Select.type.ts
R100	frontend/src/lib/components/select/index.ts	apps/frontend/src/lib/components/select/index.ts
A	apps/frontend/src/lib/components/subMatches/SubMatches.svelte
R100	frontend/src/lib/components/subMatches/SubMatches.type.ts	apps/frontend/src/lib/components/subMatches/SubMatches.type.ts
R100	frontend/src/lib/components/subMatches/index.ts	apps/frontend/src/lib/components/subMatches/index.ts
A	apps/frontend/src/lib/components/successMessage/SuccessMessage.svelte
R085	frontend/src/lib/components/successMessage/SuccessMessage.type.ts	apps/frontend/src/lib/components/successMessage/SuccessMessage.type.ts
R100	frontend/src/lib/components/successMessage/index.ts	apps/frontend/src/lib/components/successMessage/index.ts
A	apps/frontend/src/lib/components/tabs/Tabs.svelte
A	apps/frontend/src/lib/components/tabs/Tabs.svelte.test.ts
A	apps/frontend/src/lib/components/tabs/Tabs.type.ts
A	apps/frontend/src/lib/components/tabs/index.ts
A	apps/frontend/src/lib/components/tabs/tabKey.ts
A	apps/frontend/src/lib/components/term/Term.svelte
R079	frontend/src/lib/components/term/Term.type.ts	apps/frontend/src/lib/components/term/Term.type.ts
R100	frontend/src/lib/components/term/index.ts	apps/frontend/src/lib/components/term/index.ts
R079	frontend/src/lib/components/toggle/Toggle.svelte	apps/frontend/src/lib/components/toggle/Toggle.svelte
R100	frontend/src/lib/components/toggle/Toggle.type.ts	apps/frontend/src/lib/components/toggle/Toggle.type.ts
R100	frontend/src/lib/components/toggle/index.ts	apps/frontend/src/lib/components/toggle/index.ts
A	apps/frontend/src/lib/components/video/Video.svelte
A	apps/frontend/src/lib/components/video/Video.type.ts
A	apps/frontend/src/lib/components/video/component-stores.svelte.ts
R100	frontend/src/lib/components/video/index.ts	apps/frontend/src/lib/components/video/index.ts
A	apps/frontend/src/lib/components/warning/Warning.svelte
A	apps/frontend/src/lib/components/warning/Warning.type.ts
R100	frontend/src/lib/components/warning/index.ts	apps/frontend/src/lib/components/warning/index.ts
A	apps/frontend/src/lib/contestant/components/README.md
A	apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte
A	apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts
A	apps/frontend/src/lib/contestant/components/contactSupport/index.ts
A	apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte
A	apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.type.ts
A	apps/frontend/src/lib/contestant/components/emailEntry/index.ts
A	apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte
A	apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts
A	apps/frontend/src/lib/contestant/components/emailField/index.ts
A	apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte
A	apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.type.ts
A	apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte
A	apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts
A	apps/frontend/src/lib/contestant/components/emailSentPanel/index.ts
A	apps/frontend/src/lib/contestant/components/emailSentPanel/resendCountdown.svelte.ts
A	apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
A	apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.type.ts
R100	frontend/src/lib/candidate/components/logoutButton/index.ts	apps/frontend/src/lib/contestant/components/logoutButton/index.ts
A	apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte
A	apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts
A	apps/frontend/src/lib/contestant/components/notEditableNote/index.ts
A	apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte
A	apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.type.ts
A	apps/frontend/src/lib/contestant/components/nothingToEdit/index.ts
A	apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte
A	apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts
R100	frontend/src/lib/candidate/components/passwordField/index.ts	apps/frontend/src/lib/contestant/components/passwordField/index.ts
A	apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
A	apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.type.ts
R100	frontend/src/lib/candidate/components/passwordSetter/index.ts	apps/frontend/src/lib/contestant/components/passwordSetter/index.ts
A	apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte
A	apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.type.ts
A	apps/frontend/src/lib/contestant/components/passwordSignIn/index.ts
A	apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.svelte
A	apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.svelte.test.ts
R100	frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.type.ts	apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.type.ts
R100	frontend/src/lib/candidate/components/passwordValidator/index.ts	apps/frontend/src/lib/contestant/components/passwordValidator/index.ts
A	apps/frontend/src/lib/contestant/components/preregisteredNotification/PreregisteredNotification.svelte
R100	frontend/src/lib/candidate/components/preregisteredNotification/PreregisteredNotification.type.ts	apps/frontend/src/lib/contestant/components/preregisteredNotification/PreregisteredNotification.type.ts
R100	frontend/src/lib/candidate/components/preregisteredNotification/index.ts	apps/frontend/src/lib/contestant/components/preregisteredNotification/index.ts
A	apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte
A	apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.type.ts
A	apps/frontend/src/lib/contestant/components/registrationCodeField/index.ts
A	apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte
A	apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/registrationModeSelector/RegistrationModeSelector.type.ts
A	apps/frontend/src/lib/contestant/components/registrationModeSelector/index.ts
A	apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte
A	apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte
R100	frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts	apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.type.ts
A	apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte
A	apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte.test.ts
A	apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.type.ts
A	apps/frontend/src/lib/contestant/components/termsOfUse/index.ts
A	apps/frontend/src/lib/contestant/entryFlow/entryFlow.test.ts
A	apps/frontend/src/lib/contestant/entryFlow/entryFlow.ts
A	apps/frontend/src/lib/contestant/entryFlow/index.ts
A	apps/frontend/src/lib/contestant/gates/SetPasswordGate.svelte
A	apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte
A	apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte.test.ts
A	apps/frontend/src/lib/contestant/gates/gateViews.ts
A	apps/frontend/src/lib/contestant/gates/gates.test.ts
A	apps/frontend/src/lib/contestant/gates/gates.ts
A	apps/frontend/src/lib/contestant/nominations/editorFacts.test.ts
A	apps/frontend/src/lib/contestant/nominations/editorFacts.ts
A	apps/frontend/src/lib/contestant/nominations/index.ts
A	apps/frontend/src/lib/contestant/nominations/nominationDraft.test.ts
A	apps/frontend/src/lib/contestant/nominations/nominationDraft.ts
A	apps/frontend/src/lib/contestant/tasks/index.ts
A	apps/frontend/src/lib/contestant/tasks/taskState.test.ts
A	apps/frontend/src/lib/contestant/tasks/taskState.ts
A	apps/frontend/src/lib/contestant/tasks/unanswered.test.ts
A	apps/frontend/src/lib/contestant/tasks/unanswered.ts
A	apps/frontend/src/lib/contestant/utils/contestantAppName.test.ts
A	apps/frontend/src/lib/contestant/utils/contestantAppName.ts
A	apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
A	apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
A	apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.test.ts
A	apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts
A	apps/frontend/src/lib/contestant/utils/loginError.test.ts
A	apps/frontend/src/lib/contestant/utils/loginError.ts
A	apps/frontend/src/lib/contestant/utils/nameRule.test.ts
A	apps/frontend/src/lib/contestant/utils/nameRule.ts
A	apps/frontend/src/lib/contestant/utils/oidcError.test.ts
A	apps/frontend/src/lib/contestant/utils/oidcError.ts
A	apps/frontend/src/lib/contestant/utils/opinionQuestionsState.test.ts
A	apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts
A	apps/frontend/src/lib/contestant/utils/preregistrationError.ts
A	apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts
A	apps/frontend/src/lib/contestant/utils/registrationOffer.ts
A	apps/frontend/src/lib/contestant/utils/userEntityDisplayName.test.ts
A	apps/frontend/src/lib/contestant/utils/userEntityDisplayName.ts
A	apps/frontend/src/lib/contexts/README.md
A	apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
A	apps/frontend/src/lib/contexts/admin/adminContext.type.ts
A	apps/frontend/src/lib/contexts/admin/index.ts
A	apps/frontend/src/lib/contexts/admin/jobStates.svelte.test.ts
A	apps/frontend/src/lib/contexts/admin/jobStates.svelte.ts
A	apps/frontend/src/lib/contexts/admin/jobStates.type.ts
A	apps/frontend/src/lib/contexts/app/appContext.popupCountdown.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/appContext.svelte.ts
A	apps/frontend/src/lib/contexts/app/appContext.type.ts
A	apps/frontend/src/lib/contexts/app/appCustomization.type.ts
A	apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
A	apps/frontend/src/lib/contexts/app/index.ts
A	apps/frontend/src/lib/contexts/app/popup/index.ts
A	apps/frontend/src/lib/contexts/app/popup/popupComponent.type.ts
A	apps/frontend/src/lib/contexts/app/popup/popupState.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/popup/popupState.svelte.ts
A	apps/frontend/src/lib/contexts/app/popup/popupState.type.ts
A	apps/frontend/src/lib/contexts/app/survey.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/survey.svelte.ts
A	apps/frontend/src/lib/contexts/app/tracking/batchBuilder.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/batchBuilder.ts
A	apps/frontend/src/lib/contexts/app/tracking/gates.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/gates.ts
A	apps/frontend/src/lib/contexts/app/tracking/index.ts
A	apps/frontend/src/lib/contexts/app/tracking/relayTransport.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/relayTransport.ts
A	apps/frontend/src/lib/contexts/app/tracking/trackingEvent.type.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/trackingEvent.type.ts
A	apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
A	apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
A	apps/frontend/src/lib/contexts/app/tracking/viewTracker.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/viewTracker.ts
A	apps/frontend/src/lib/contexts/app/tracking/visitId.test.ts
A	apps/frontend/src/lib/contexts/app/tracking/visitId.ts
A	apps/frontend/src/lib/contexts/app/userPreferences.type.ts
A	apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
A	apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
A	apps/frontend/src/lib/contexts/auth/authContext.type.ts
A	apps/frontend/src/lib/contexts/auth/index.ts
A	apps/frontend/src/lib/contexts/component/componentContext.svelte.test.ts
A	apps/frontend/src/lib/contexts/component/componentContext.svelte.ts
A	apps/frontend/src/lib/contexts/component/componentContext.type.ts
A	apps/frontend/src/lib/contexts/component/darkMode.svelte.ts
A	apps/frontend/src/lib/contexts/component/index.ts
A	apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
A	apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
A	apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
A	apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
A	apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
A	apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
A	apps/frontend/src/lib/contexts/contestant/index.ts
A	apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
A	apps/frontend/src/lib/contexts/data/dataContext.type.ts
A	apps/frontend/src/lib/contexts/data/index.ts
A	apps/frontend/src/lib/contexts/filter/__tests__/FilterContextHarness.svelte
A	apps/frontend/src/lib/contexts/filter/__tests__/GetFilterContextHarness.svelte
A	apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts
A	apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts
A	apps/frontend/src/lib/contexts/filter/filterContext.type.ts
A	apps/frontend/src/lib/contexts/filter/index.ts
R078	frontend/src/lib/contexts/i18n/i18nContext.ts	apps/frontend/src/lib/contexts/i18n/i18nContext.ts
A	apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
R100	frontend/src/lib/contexts/i18n/index.ts	apps/frontend/src/lib/contexts/i18n/index.ts
A	apps/frontend/src/lib/contexts/layout/VideoController.svelte.test.ts
A	apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts
A	apps/frontend/src/lib/contexts/layout/index.ts
A	apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
A	apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
A	apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts
A	apps/frontend/src/lib/contexts/utils/inheritContextMembers.test.ts
A	apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts
A	apps/frontend/src/lib/contexts/utils/paramState.svelte.ts
A	apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
A	apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
A	apps/frontend/src/lib/contexts/utils/prepareAdminWriter.ts
A	apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts
R100	frontend/src/lib/contexts/utils/questionBlockStore.type.ts	apps/frontend/src/lib/contexts/utils/questionBlockState.type.ts
A	apps/frontend/src/lib/contexts/utils/questionRollup.test.ts
A	apps/frontend/src/lib/contexts/utils/questionRollup.ts
A	apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts
A	apps/frontend/src/lib/contexts/utils/sameRefs.test.ts
A	apps/frontend/src/lib/contexts/utils/sameRefs.ts
A	apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.test.ts
A	apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts
A	apps/frontend/src/lib/contexts/voter/answerState.svelte.test.ts
A	apps/frontend/src/lib/contexts/voter/answerState.svelte.ts
A	apps/frontend/src/lib/contexts/voter/answerState.type.ts
R100	frontend/src/lib/contexts/voter/countAnswers.ts	apps/frontend/src/lib/contexts/voter/countAnswers.ts
R100	frontend/src/lib/contexts/voter/filters/buildParentFilters.ts	apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts
R091	frontend/src/lib/contexts/voter/filters/buildQuestionFilter.ts	apps/frontend/src/lib/contexts/voter/filters/buildQuestionFilter.ts
A	apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts
A	apps/frontend/src/lib/contexts/voter/filters/filterRelevance.ts
A	apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts
A	apps/frontend/src/lib/contexts/voter/index.ts
A	apps/frontend/src/lib/contexts/voter/matchState.svelte.test.ts
A	apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
A	apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.test.ts
A	apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
R100	frontend/src/lib/contexts/voter/selectionTree.type.ts	apps/frontend/src/lib/contexts/voter/selectionTree.type.ts
R100	frontend/src/lib/contexts/voter/voter.ts	apps/frontend/src/lib/contexts/voter/voter.ts
A	apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
A	apps/frontend/src/lib/contexts/voter/voterContext.type.ts
A	apps/frontend/src/lib/cookies/cookies.test.ts
A	apps/frontend/src/lib/cookies/index.ts
A	apps/frontend/src/lib/dynamic-components/README.md
A	apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte
R095	frontend/src/lib/dynamic-components/appLogo/AppLogo.type.ts	apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.type.ts
R100	frontend/src/lib/dynamic-components/appLogo/index.ts	apps/frontend/src/lib/dynamic-components/appLogo/index.ts
A	apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte
A	apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.type.ts
A	apps/frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.svelte
R100	frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.type.ts	apps/frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.type.ts
R100	frontend/src/lib/dynamic-components/dataConsent/index.ts	apps/frontend/src/lib/dynamic-components/dataConsent/index.ts
A	apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte
R100	frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.type.ts	apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.type.ts
R100	frontend/src/lib/dynamic-components/dataConsent/popup/index.ts	apps/frontend/src/lib/dynamic-components/dataConsent/popup/index.ts
A	apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
A	apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts
R100	frontend/src/lib/dynamic-components/entityCard/index.ts	apps/frontend/src/lib/dynamic-components/entityCard/index.ts
A	apps/frontend/src/lib/dynamic-components/entityCard/tests/EntityCard.svelte.test.ts
A	apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte
R100	frontend/src/lib/dynamic-components/entityDetails/EntityChildren.type.ts	apps/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.type.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte.test.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
R100	frontend/src/lib/dynamic-components/entityDetails/EntityInfo.type.ts	apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.type.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
R086	frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts	apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte
A	apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/openEntityDrawer.svelte.test.ts
A	apps/frontend/src/lib/dynamic-components/entityDetails/openEntityDrawer.svelte.ts
A	apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte
R100	frontend/src/lib/dynamic-components/entityList/EntityList.type.ts	apps/frontend/src/lib/dynamic-components/entityList/EntityList.type.ts
A	apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
R100	frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts	apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts
A	apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
A	apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts
A	apps/frontend/src/lib/dynamic-components/entityList/helpers.test.ts
A	apps/frontend/src/lib/dynamic-components/entityList/helpers.ts
A	apps/frontend/src/lib/dynamic-components/entityList/index.ts
A	apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte
A	apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte.test.ts
A	apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts
A	apps/frontend/src/lib/dynamic-components/entitySelector/index.ts
A	apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
A	apps/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts
R100	frontend/src/lib/dynamic-components/feedback/index.ts	apps/frontend/src/lib/dynamic-components/feedback/index.ts
A	apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte
R100	frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.type.ts	apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.type.ts
R100	frontend/src/lib/dynamic-components/feedback/modal/index.ts	apps/frontend/src/lib/dynamic-components/feedback/modal/index.ts
A	apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
R100	frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.type.ts	apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.type.ts
R100	frontend/src/lib/dynamic-components/feedback/popup/index.ts	apps/frontend/src/lib/dynamic-components/feedback/popup/index.ts
A	apps/frontend/src/lib/dynamic-components/footer/Footer.svelte
R100	frontend/src/lib/dynamic-components/footer/Footer.type.ts	apps/frontend/src/lib/dynamic-components/footer/Footer.type.ts
R100	frontend/src/lib/dynamic-components/footer/index.ts	apps/frontend/src/lib/dynamic-components/footer/index.ts
A	apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte
A	apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts
R100	frontend/src/lib/dynamic-components/logoutButton/index.ts	apps/frontend/src/lib/dynamic-components/logoutButton/index.ts
A	apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte
A	apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts
A	apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
A	apps/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts
A	apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte
A	apps/frontend/src/lib/dynamic-components/navigation/Navigation.type.ts
A	apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
R100	frontend/src/lib/dynamic-components/navigation/admin/AdminNav.type.ts	apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.type.ts
R100	frontend/src/lib/dynamic-components/navigation/admin/index.ts	apps/frontend/src/lib/dynamic-components/navigation/admin/index.ts
A	apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
A	apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
A	apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.type.ts
A	apps/frontend/src/lib/dynamic-components/navigation/contestant/index.ts
R100	frontend/src/lib/dynamic-components/navigation/index.ts	apps/frontend/src/lib/dynamic-components/navigation/index.ts
A	apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
R100	frontend/src/lib/dynamic-components/navigation/languages/index.ts	apps/frontend/src/lib/dynamic-components/navigation/languages/index.ts
A	apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts
A	apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
R100	frontend/src/lib/dynamic-components/navigation/voter/VoterNav.type.ts	apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.type.ts
R100	frontend/src/lib/dynamic-components/navigation/voter/index.ts	apps/frontend/src/lib/dynamic-components/navigation/voter/index.ts
A	apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
R096	frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.type.ts	apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.type.ts
R100	frontend/src/lib/dynamic-components/questionHeading/index.ts	apps/frontend/src/lib/dynamic-components/questionHeading/index.ts
A	apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
A	apps/frontend/src/lib/dynamic-components/survey/SurveyButton.type.ts
A	apps/frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte
R100	frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.type.ts	apps/frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.type.ts
R100	frontend/src/lib/dynamic-components/survey/banner/index.ts	apps/frontend/src/lib/dynamic-components/survey/banner/index.ts
R100	frontend/src/lib/dynamic-components/survey/index.ts	apps/frontend/src/lib/dynamic-components/survey/index.ts
A	apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte
R100	frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.type.ts	apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.type.ts
R100	frontend/src/lib/dynamic-components/survey/popup/index.ts	apps/frontend/src/lib/dynamic-components/survey/popup/index.ts
A	apps/frontend/src/lib/i18n/README.md
R100	frontend/src/lib/i18n/index.ts	apps/frontend/src/lib/i18n/index.ts
A	apps/frontend/src/lib/i18n/init.ts
A	apps/frontend/src/lib/i18n/overrides.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/app-environment.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/app-forms.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/app-paths.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/app-state.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-private.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-public.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/paraglide-messages.ts
A	apps/frontend/src/lib/i18n/tests/__mocks__/paraglide-runtime.ts
A	apps/frontend/src/lib/i18n/tests/overrides.test.ts
A	apps/frontend/src/lib/i18n/tests/translations.test.ts
R085	frontend/src/lib/i18n/tests/utils.test.ts	apps/frontend/src/lib/i18n/tests/utils.test.ts
A	apps/frontend/src/lib/i18n/types.ts
A	apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts
A	apps/frontend/src/lib/i18n/utils/canonize.ts
R100	frontend/src/lib/i18n/utils/index.ts	apps/frontend/src/lib/i18n/utils/index.ts
A	apps/frontend/src/lib/i18n/utils/intl.d.ts
R100	frontend/src/lib/i18n/utils/isLocale.ts	apps/frontend/src/lib/i18n/utils/isLocale.ts
R093	frontend/src/lib/i18n/utils/matchLocale.ts	apps/frontend/src/lib/i18n/utils/matchLocale.ts
R085	frontend/src/lib/i18n/utils/parseAcceptedLanguages.ts	apps/frontend/src/lib/i18n/utils/parseAcceptedLanguages.ts
A	apps/frontend/src/lib/i18n/wrapper.ts
A	apps/frontend/src/lib/layouts/index.ts
A	apps/frontend/src/lib/layouts/main/Banner.svelte
A	apps/frontend/src/lib/layouts/main/Header.svelte
A	apps/frontend/src/lib/layouts/main/Layout.svelte
A	apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts
A	apps/frontend/src/lib/layouts/main/Layout.type.ts
A	apps/frontend/src/lib/layouts/main/MainContent.svelte
A	apps/frontend/src/lib/layouts/main/MainContent.type.ts
A	apps/frontend/src/lib/layouts/main/MaintenancePage.svelte
A	apps/frontend/src/lib/layouts/main/MaintenancePage.type.ts
A	apps/frontend/src/lib/layouts/main/SingleCardContent.svelte
A	apps/frontend/src/lib/layouts/main/index.ts
A	apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts
A	apps/frontend/src/lib/routes/appGates.test.ts
A	apps/frontend/src/lib/routes/appGates.ts
A	apps/frontend/src/lib/routes/buildRoute.redirects.test.ts
A	apps/frontend/src/lib/routes/buildRoute.ts
A	apps/frontend/src/lib/routes/contestantHomeRoute.test.ts
A	apps/frontend/src/lib/routes/contestantHomeRoute.ts
A	apps/frontend/src/lib/routes/filterPersistent.ts
A	apps/frontend/src/lib/routes/impliedParams.test.ts
A	apps/frontend/src/lib/routes/impliedParams.ts
A	apps/frontend/src/lib/routes/index.ts
A	apps/frontend/src/lib/routes/loginRedirectTarget.test.ts
A	apps/frontend/src/lib/routes/loginRedirectTarget.ts
A	apps/frontend/src/lib/routes/params.ts
A	apps/frontend/src/lib/routes/parseParams.test.ts
A	apps/frontend/src/lib/routes/parseParams.ts
A	apps/frontend/src/lib/routes/resultsRoutes.test.ts
A	apps/frontend/src/lib/routes/resultsRoutes.ts
A	apps/frontend/src/lib/routes/route.test.ts
A	apps/frontend/src/lib/routes/route.ts
A	apps/frontend/src/lib/routes/routeConsistency.test.ts
A	apps/frontend/src/lib/routes/selectionOrder.test.ts
A	apps/frontend/src/lib/routes/selectionOrder.ts
A	apps/frontend/src/lib/routes/voterAppPath.test.ts
A	apps/frontend/src/lib/routes/voterAppPath.ts
A	apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts
A	apps/frontend/src/lib/server/admin/features/condenseArguments.ts
A	apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
R100	frontend/src/lib/server/admin/jobs/README.md	apps/frontend/src/lib/server/admin/jobs/README.md
A	apps/frontend/src/lib/server/admin/jobs/assertValidJobId.ts
A	apps/frontend/src/lib/server/admin/jobs/jobRecord.ts
R097	frontend/src/lib/server/admin/jobs/jobStore.ts	apps/frontend/src/lib/server/admin/jobs/jobStore.ts
A	apps/frontend/src/lib/server/admin/jobs/jobStore.type.ts
R090	frontend/src/lib/server/admin/jobs/pipelineController.ts	apps/frontend/src/lib/server/admin/jobs/pipelineController.ts
A	apps/frontend/src/lib/server/admin/requireAdminAction.ts
A	apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
A	apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
A	apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts
A	apps/frontend/src/lib/server/analytics/config.test.ts
A	apps/frontend/src/lib/server/analytics/config.ts
A	apps/frontend/src/lib/server/analytics/env.ts
A	apps/frontend/src/lib/server/analytics/noAddressOrAgent.test.ts
A	apps/frontend/src/lib/server/analytics/providers/index.test.ts
A	apps/frontend/src/lib/server/analytics/providers/index.ts
A	apps/frontend/src/lib/server/analytics/providers/log.test.ts
A	apps/frontend/src/lib/server/analytics/providers/log.ts
A	apps/frontend/src/lib/server/analytics/providers/none.ts
A	apps/frontend/src/lib/server/analytics/providers/posthog.test.ts
A	apps/frontend/src/lib/server/analytics/providers/posthog.ts
A	apps/frontend/src/lib/server/analytics/providers/provider.type.ts
A	apps/frontend/src/lib/server/analytics/queue.test.ts
A	apps/frontend/src/lib/server/analytics/queue.ts
A	apps/frontend/src/lib/server/analytics/relay.test.ts
A	apps/frontend/src/lib/server/analytics/relay.ts
A	apps/frontend/src/lib/server/analytics/runtime.ts
A	apps/frontend/src/lib/server/api/README.md
A	apps/frontend/src/lib/server/api/adapters/local/dataProvider/index.ts
A	apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.test.ts
A	apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts
A	apps/frontend/src/lib/server/api/adapters/local/feedbackWriter/index.ts
R100	frontend/src/lib/server/api/adapters/local/feedbackWriter/localServerFeedbackWriter.ts	apps/frontend/src/lib/server/api/adapters/local/feedbackWriter/localServerFeedbackWriter.ts
R100	frontend/src/lib/server/api/adapters/local/localPaths.ts	apps/frontend/src/lib/server/api/adapters/local/localPaths.ts
R100	frontend/src/lib/server/api/adapters/local/localServerAdapter.ts	apps/frontend/src/lib/server/api/adapters/local/localServerAdapter.ts
R100	frontend/src/lib/server/api/dataProvider.ts	apps/frontend/src/lib/server/api/dataProvider.ts
R100	frontend/src/lib/server/api/feedbackWriter.ts	apps/frontend/src/lib/server/api/feedbackWriter.ts
A	apps/frontend/src/lib/server/constants.ts
A	apps/frontend/src/lib/server/contestant/previewGate.test.ts
A	apps/frontend/src/lib/server/contestant/previewGate.ts
A	apps/frontend/src/lib/server/contestant/registrationGuard.test.ts
A	apps/frontend/src/lib/server/contestant/registrationGuard.ts
A	apps/frontend/src/lib/server/contestant/signOutToLogin.test.ts
A	apps/frontend/src/lib/server/contestant/signOutToLogin.ts
R100	frontend/src/lib/server/llm/llmProvider.ts	apps/frontend/src/lib/server/llm/llmProvider.ts
A	apps/frontend/src/lib/server/startup/requiredEnv.test.ts
A	apps/frontend/src/lib/server/startup/requiredEnv.ts
A	apps/frontend/src/lib/supabase/anon.ts
A	apps/frontend/src/lib/supabase/browser.ts
A	apps/frontend/src/lib/supabase/job.test.ts
A	apps/frontend/src/lib/supabase/job.ts
A	apps/frontend/src/lib/supabase/safeGetSession.test.ts
A	apps/frontend/src/lib/supabase/safeGetSession.ts
A	apps/frontend/src/lib/supabase/server.test.ts
A	apps/frontend/src/lib/supabase/server.ts
A	apps/frontend/src/lib/supabase/universal.ts
A	apps/frontend/src/lib/types/generated/translationKey.ts
R092	frontend/src/lib/types/global.d.ts	apps/frontend/src/lib/types/global.d.ts
R100	frontend/src/lib/types/index.ts	apps/frontend/src/lib/types/index.ts
R086	frontend/src/lib/utils/aria/focus.ts	apps/frontend/src/lib/utils/aria/focus.ts
R100	frontend/src/lib/utils/breakpoints.ts	apps/frontend/src/lib/utils/breakpoints.ts
A	apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte
R100	frontend/src/lib/utils/color/adjustContrast.ts	apps/frontend/src/lib/utils/color/adjustContrast.ts
A	apps/frontend/src/lib/utils/color/ensureColors.test.ts
A	apps/frontend/src/lib/utils/color/ensureColors.ts
R100	frontend/src/lib/utils/color/luminance.ts	apps/frontend/src/lib/utils/color/luminance.ts
R079	frontend/src/lib/utils/color/parseColorString.ts	apps/frontend/src/lib/utils/color/parseColorString.ts
R100	frontend/src/lib/utils/color/parseColors.ts	apps/frontend/src/lib/utils/color/parseColors.ts
R100	frontend/src/lib/utils/color/rgb.ts	apps/frontend/src/lib/utils/color/rgb.ts
R100	frontend/src/lib/utils/color/rgbToHex.ts	apps/frontend/src/lib/utils/color/rgbToHex.ts
A	apps/frontend/src/lib/utils/components.test.ts
A	apps/frontend/src/lib/utils/components.ts
A	apps/frontend/src/lib/utils/constants.ts
A	apps/frontend/src/lib/utils/email.ts
R100	frontend/src/lib/utils/entities.ts	apps/frontend/src/lib/utils/entities.ts
R092	frontend/src/lib/utils/entityCards.ts	apps/frontend/src/lib/utils/entityCards.ts
R096	frontend/src/lib/utils/entityDetails.ts	apps/frontend/src/lib/utils/entityDetails.ts
A	apps/frontend/src/lib/utils/focusNavigationTarget.test.ts
A	apps/frontend/src/lib/utils/focusNavigationTarget.ts
R100	frontend/src/lib/utils/freeze.ts	apps/frontend/src/lib/utils/freeze.ts
A	apps/frontend/src/lib/utils/getAllianceSummary.ts
R100	frontend/src/lib/utils/hashIds.test.ts	apps/frontend/src/lib/utils/hashIds.test.ts
R081	frontend/src/lib/utils/hashIds.ts	apps/frontend/src/lib/utils/hashIds.ts
R100	frontend/src/lib/utils/image.test.ts	apps/frontend/src/lib/utils/image.test.ts
R100	frontend/src/lib/utils/image.ts	apps/frontend/src/lib/utils/image.ts
R100	frontend/src/lib/utils/links.ts	apps/frontend/src/lib/utils/links.ts
A	apps/frontend/src/lib/utils/localizedText.test.ts
A	apps/frontend/src/lib/utils/localizedText.ts
A	apps/frontend/src/lib/utils/logLevel.test.ts
A	apps/frontend/src/lib/utils/logLevel.ts
A	apps/frontend/src/lib/utils/matches.ts
A	apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts
A	apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts
R100	frontend/src/lib/utils/matching/imputeParentAnswers.type.ts	apps/frontend/src/lib/utils/matching/imputeParentAnswers.type.ts
R100	frontend/src/lib/utils/matching/index.ts	apps/frontend/src/lib/utils/matching/index.ts
R100	frontend/src/lib/utils/matching/mean.test.ts	apps/frontend/src/lib/utils/matching/mean.test.ts
R100	frontend/src/lib/utils/matching/mean.ts	apps/frontend/src/lib/utils/matching/mean.ts
R100	frontend/src/lib/utils/matching/median.test.ts	apps/frontend/src/lib/utils/matching/median.test.ts
R092	frontend/src/lib/utils/matching/median.ts	apps/frontend/src/lib/utils/matching/median.ts
R100	frontend/src/lib/utils/matching/mode.test.ts	apps/frontend/src/lib/utils/matching/mode.test.ts
R100	frontend/src/lib/utils/matching/mode.ts	apps/frontend/src/lib/utils/matching/mode.ts
A	apps/frontend/src/lib/utils/motion.test.ts
A	apps/frontend/src/lib/utils/motion.ts
A	apps/frontend/src/lib/utils/multiChoiceValidity.test.ts
A	apps/frontend/src/lib/utils/multiChoiceValidity.ts
R079	frontend/src/lib/utils/onKeyboardFocusOut.ts	apps/frontend/src/lib/utils/onKeyboardFocusOut.ts
A	apps/frontend/src/lib/utils/organizationMatching.test.ts
A	apps/frontend/src/lib/utils/organizationMatching.ts
A	apps/frontend/src/lib/utils/password-validation/passwordValidation.test.ts
A	apps/frontend/src/lib/utils/password-validation/passwordValidation.ts
R100	frontend/src/lib/utils/purgeNullish.ts	apps/frontend/src/lib/utils/purgeNullish.ts
R100	frontend/src/lib/utils/questions/electionTags.ts	apps/frontend/src/lib/utils/questions/electionTags.ts
A	apps/frontend/src/lib/utils/questions/extendedInfo.test.ts
A	apps/frontend/src/lib/utils/questions/extendedInfo.ts
A	apps/frontend/src/lib/utils/questions/index.ts
A	apps/frontend/src/lib/utils/regexp.ts
R100	frontend/src/lib/utils/removeDuplicates.ts	apps/frontend/src/lib/utils/removeDuplicates.ts
A	apps/frontend/src/lib/utils/sanitize.test.ts
R100	frontend/src/lib/utils/sanitize.ts	apps/frontend/src/lib/utils/sanitize.ts
A	apps/frontend/src/lib/utils/settings.svelte.test.ts
A	apps/frontend/src/lib/utils/settings.test.ts
A	apps/frontend/src/lib/utils/settings.ts
R100	frontend/src/lib/utils/sorting.ts	apps/frontend/src/lib/utils/sorting.ts
R090	frontend/src/lib/utils/text/abbreviate.ts	apps/frontend/src/lib/utils/text/abbreviate.ts
R100	frontend/src/lib/utils/text/toNameCase.ts	apps/frontend/src/lib/utils/text/toNameCase.ts
R100	frontend/src/lib/utils/text/ucFirst.ts	apps/frontend/src/lib/utils/text/ucFirst.ts
R100	frontend/src/lib/utils/timing.ts	apps/frontend/src/lib/utils/timing.ts
A	apps/frontend/src/lib/utils/viewTransition.test.ts
A	apps/frontend/src/lib/utils/viewTransition.ts
A	apps/frontend/src/params/contestantEntityPage.test.ts
A	apps/frontend/src/params/contestantEntityPage.ts
A	apps/frontend/src/params/etPl.test.ts
A	apps/frontend/src/params/etPl.ts
A	apps/frontend/src/params/etSg.test.ts
A	apps/frontend/src/params/etSg.ts
A	apps/frontend/src/params/servedEntityType.test.ts
A	apps/frontend/src/params/servedEntityType.ts
A	apps/frontend/src/params/uuid.test.ts
A	apps/frontend/src/params/uuid.ts
A	apps/frontend/src/routes/(voters)/(located)/+layout.server.ts
A	apps/frontend/src/routes/(voters)/(located)/+layout.svelte
A	apps/frontend/src/routes/(voters)/(located)/+layout.ts
A	apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts
A	apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts
A	apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
A	apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts
A	apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
A	apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
A	apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts
A	apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts
A	apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte
A	apps/frontend/src/routes/(voters)/+layout.svelte
A	apps/frontend/src/routes/(voters)/+page.svelte
A	apps/frontend/src/routes/(voters)/about/+page.svelte
A	apps/frontend/src/routes/(voters)/constituencies/+page.svelte
A	apps/frontend/src/routes/(voters)/constituencies/+page.ts
A	apps/frontend/src/routes/(voters)/elections/+page.svelte
A	apps/frontend/src/routes/(voters)/elections/+page.ts
A	apps/frontend/src/routes/(voters)/info/+page.svelte
A	apps/frontend/src/routes/(voters)/intro/+page.svelte
A	apps/frontend/src/routes/(voters)/nominations/+layout.svelte
A	apps/frontend/src/routes/(voters)/nominations/+layout.ts
A	apps/frontend/src/routes/(voters)/nominations/+page.svelte
A	apps/frontend/src/routes/(voters)/privacy/+page.svelte
A	apps/frontend/src/routes/(voters)/privacy/page.svelte.test.ts
A	apps/frontend/src/routes/+error.svelte
A	apps/frontend/src/routes/+layout.server.ts
A	apps/frontend/src/routes/+layout.svelte
A	apps/frontend/src/routes/+layout.ts
A	apps/frontend/src/routes/README.md
A	apps/frontend/src/routes/admin/(protected)/+layout.svelte
A	apps/frontend/src/routes/admin/(protected)/+layout.ts
A	apps/frontend/src/routes/admin/(protected)/+page.svelte
A	apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts
A	apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte
A	apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.ts
A	apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
A	apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte
A	apps/frontend/src/routes/admin/(protected)/jobs/+layout.svelte
A	apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte
A	apps/frontend/src/routes/admin/(protected)/jobs/jobsPage.svelte.test.ts
A	apps/frontend/src/routes/admin/(protected)/layout.server.test.ts
A	apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts
A	apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte
A	apps/frontend/src/routes/admin/(protected)/question-info/+layout.ts
A	apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
A	apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte
A	apps/frontend/src/routes/admin/+layout.server.ts
A	apps/frontend/src/routes/admin/+layout.svelte
A	apps/frontend/src/routes/admin/layout.server.test.ts
A	apps/frontend/src/routes/admin/login/+page.server.ts
A	apps/frontend/src/routes/admin/login/+page.svelte
A	apps/frontend/src/routes/api/admin/jobs/abort-all/+server.ts
A	apps/frontend/src/routes/api/admin/jobs/active/+server.ts
A	apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts
A	apps/frontend/src/routes/api/admin/jobs/past/+server.ts
A	apps/frontend/src/routes/api/admin/jobs/single/[jobId]/abort/+server.ts
A	apps/frontend/src/routes/api/admin/jobs/single/[jobId]/progress/+server.ts
A	apps/frontend/src/routes/api/admin/jobs/start/+server.ts
A	apps/frontend/src/routes/api/auth/callback/+server.ts
A	apps/frontend/src/routes/api/auth/callback/server.test.ts
A	apps/frontend/src/routes/api/auth/logout/+server.ts
A	apps/frontend/src/routes/api/auth/logout/server.test.ts
A	apps/frontend/src/routes/api/contestant/preregister/+server.ts
A	apps/frontend/src/routes/api/contestant/preregister/preregisterUpstreamStatus.test.ts
R100	frontend/src/routes/[[lang=locale]]/api/data/[collection]/+server.ts	apps/frontend/src/routes/api/data/[collection]/+server.ts
A	apps/frontend/src/routes/api/diagnostics/+server.ts
A	apps/frontend/src/routes/api/diagnostics/server.test.ts
R100	frontend/src/routes/[[lang=locale]]/api/feedback/+server.ts	apps/frontend/src/routes/api/feedback/+server.ts
A	apps/frontend/src/routes/api/health/+server.ts
A	apps/frontend/src/routes/api/health/server.test.ts
A	apps/frontend/src/routes/api/oidc/authorize/+server.ts
A	apps/frontend/src/routes/api/oidc/callback/+server.ts
A	apps/frontend/src/routes/api/oidc/token/+server.ts
A	apps/frontend/src/routes/api/usage/+server.ts
A	apps/frontend/src/routes/api/usage/server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
A	apps/frontend/src/routes/contestant/(protected)/+layout.svelte
A	apps/frontend/src/routes/contestant/(protected)/+page.server.ts
A	apps/frontend/src/routes/contestant/(protected)/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts
A	apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+layout.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/layout.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/+layout.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveContestant.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveRoot.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/afterSave.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/layout.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepLoads.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+layout.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/layout.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/nominationFacts.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
A	apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.test.ts
A	apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.ts
A	apps/frontend/src/routes/contestant/(protected)/gateFocus.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/loadTracking.testUtils.ts
A	apps/frontend/src/routes/contestant/(protected)/page.server.test.ts
A	apps/frontend/src/routes/contestant/(protected)/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/page.tracking.test.ts
A	apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts
A	apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
A	apps/frontend/src/routes/contestant/+layout.server.ts
A	apps/frontend/src/routes/contestant/+layout.svelte
A	apps/frontend/src/routes/contestant/README.md
A	apps/frontend/src/routes/contestant/email-sent/+page.svelte
A	apps/frontend/src/routes/contestant/email-sent/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/forgot-password/+page.svelte
A	apps/frontend/src/routes/contestant/forgot-password/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/help/+page.svelte
A	apps/frontend/src/routes/contestant/homeButton.svelte.test.ts
A	apps/frontend/src/routes/contestant/login/+page.svelte
A	apps/frontend/src/routes/contestant/login/email/+page.server.ts
A	apps/frontend/src/routes/contestant/login/email/+page.svelte
A	apps/frontend/src/routes/contestant/login/email/page.server.test.ts
A	apps/frontend/src/routes/contestant/login/email/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/login/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/password-reset/+page.server.ts
A	apps/frontend/src/routes/contestant/password-reset/+page.svelte
A	apps/frontend/src/routes/contestant/password-reset/page.server.test.ts
A	apps/frontend/src/routes/contestant/password-reset/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/preregister/(authenticated)/+layout.svelte
A	apps/frontend/src/routes/contestant/preregister/(authenticated)/constituencies/+page.svelte
A	apps/frontend/src/routes/contestant/preregister/(authenticated)/elections/+page.svelte
A	apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte
A	apps/frontend/src/routes/contestant/preregister/+layout.server.ts
A	apps/frontend/src/routes/contestant/preregister/+layout.svelte
A	apps/frontend/src/routes/contestant/preregister/+page.svelte
A	apps/frontend/src/routes/contestant/preregister/+page.ts
A	apps/frontend/src/routes/contestant/preregister/status/+page.svelte
A	apps/frontend/src/routes/contestant/privacy/+page.svelte
A	apps/frontend/src/routes/contestant/register/+page.server.ts
A	apps/frontend/src/routes/contestant/register/+page.svelte
A	apps/frontend/src/routes/contestant/register/email/+page.server.ts
A	apps/frontend/src/routes/contestant/register/email/+page.svelte
A	apps/frontend/src/routes/contestant/register/email/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/register/page.svelte.test.ts
A	apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts
A	apps/frontend/src/routes/contestant/register/sign-in/+page.svelte
A	apps/frontend/src/routes/contestant/register/sign-in/page.server.test.ts
A	apps/frontend/src/routes/contestant/register/sign-in/page.svelte.test.ts
A	apps/frontend/src/routes/layout.load.test.ts
A	apps/frontend/src/routes/layout.server.test.ts
A	apps/frontend/src/routes/layout.tracking.svelte.test.ts
A	apps/frontend/src/tailwind-theme.css
R100	frontend/static/favicon.png	apps/frontend/static/favicon.png
A	apps/frontend/static/fonts/OFL.txt
A	apps/frontend/static/fonts/README.md
A	apps/frontend/static/fonts/inter-latin-400-normal.woff2
A	apps/frontend/static/fonts/inter-latin-700-normal.woff2
A	apps/frontend/static/fonts/inter-latin-ext-400-normal.woff2
A	apps/frontend/static/fonts/inter-latin-ext-700-normal.woff2
A	apps/frontend/static/fonts/inter.css
R100	frontend/static/icons/list.svg	apps/frontend/static/icons/list.svg
R100	frontend/static/icons/publisher.svg	apps/frontend/static/icons/publisher.svg
R100	frontend/static/icons/tip.svg	apps/frontend/static/icons/tip.svg
R100	frontend/static/icons/vote.svg	apps/frontend/static/icons/vote.svg
A	apps/frontend/static/images/e2e-test-image-1.jpg
R100	frontend/static/images/error.svg	apps/frontend/static/images/error.svg
R100	frontend/static/images/hero-admin.png	apps/frontend/static/images/hero-admin.png
R100	frontend/static/images/hero-candidate.png	apps/frontend/static/images/hero-contestant.png
R100	frontend/static/images/hero-origins.png	apps/frontend/static/images/hero-origins.png
R100	frontend/static/images/hero.png	apps/frontend/static/images/hero.png
A	apps/frontend/svelte.config.js
A	apps/frontend/svelte.config.test.ts
R100	frontend/tests/sample.spec.ts	apps/frontend/tests/sample.spec.ts
R100	frontend/tools/editTranslations/.gitignore	apps/frontend/tools/editTranslations/.gitignore
A	apps/frontend/tools/editTranslations/editTranslations.ts
A	apps/frontend/tools/translationKey/generateTranslationKeyType.ts
A	apps/frontend/tsconfig.json
A	apps/frontend/turbo.json
A	apps/frontend/vite.config.ts
A	apps/frontend/vite.projectIdEnv.test.ts
A	apps/frontend/vite.projectIdEnv.ts
A	apps/frontend/vite.restartOnRootEnv.test.ts
A	apps/frontend/vite.restartOnRootEnv.ts
A	apps/frontend/vitest.config.ts
A	apps/supabase/README.md
A	apps/supabase/package.json
A	apps/supabase/scripts/check-schema-equivalence.sh
A	apps/supabase/scripts/isolated-instance.sh
A	apps/supabase/scripts/lint-schema.mjs
A	apps/supabase/supabase/.gitignore
A	apps/supabase/supabase/config.toml
A	apps/supabase/supabase/functions/.env.example
A	apps/supabase/supabase/functions/account-access/contract.test.ts
A	apps/supabase/supabase/functions/account-access/contract.ts
A	apps/supabase/supabase/functions/account-access/deploymentChecks.test.ts
A	apps/supabase/supabase/functions/account-access/deploymentChecks.ts
A	apps/supabase/supabase/functions/account-access/envConfig.ts
A	apps/supabase/supabase/functions/account-access/flowConformance.test.ts
A	apps/supabase/supabase/functions/account-access/index.ts
A	apps/supabase/supabase/functions/account-access/linkIssue.test.ts
A	apps/supabase/supabase/functions/account-access/linkIssue.ts
A	apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
A	apps/supabase/supabase/functions/account-access/mailTemplates.ts
A	apps/supabase/supabase/functions/account-access/signInLink.test.ts
A	apps/supabase/supabase/functions/account-access/signInLink.ts
A	apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
A	apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
A	apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
A	apps/supabase/supabase/functions/identity-callback/claimConfig.ts
A	apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
A	apps/supabase/supabase/functions/identity-callback/entityGrant.ts
A	apps/supabase/supabase/functions/identity-callback/envConfig.ts
A	apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
A	apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
A	apps/supabase/supabase/functions/identity-callback/index.ts
A	apps/supabase/supabase/functions/identity-callback/verificationLogPrivacy.test.ts
A	apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts
A	apps/supabase/supabase/functions/identity-callback/verifyConfig.ts
A	apps/supabase/supabase/functions/send-email/callerAuthority.test.ts
A	apps/supabase/supabase/functions/send-email/callerAuthority.ts
A	apps/supabase/supabase/functions/send-email/envConfig.test.ts
A	apps/supabase/supabase/functions/send-email/envConfig.ts
A	apps/supabase/supabase/functions/send-email/flowConformance.test.ts
A	apps/supabase/supabase/functions/send-email/index.ts
A	apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
A	apps/supabase/supabase/functions/send-email/jwtSegment.ts
A	apps/supabase/supabase/functions/send-email/templateVars.test.ts
A	apps/supabase/supabase/functions/send-email/templateVars.ts
A	apps/supabase/supabase/migrations.manifest.json
A	apps/supabase/supabase/migrations/00001_initial_schema.sql
A	apps/supabase/supabase/schema/000-enums.sql
A	apps/supabase/supabase/schema/001-role-settings.sql
A	apps/supabase/supabase/schema/010-utility-functions.sql
A	apps/supabase/supabase/schema/011-validation-functions.sql
A	apps/supabase/supabase/schema/100-tenancy.sql
A	apps/supabase/supabase/schema/101-elections.sql
A	apps/supabase/supabase/schema/102-entities.sql
A	apps/supabase/supabase/schema/103-questions.sql
A	apps/supabase/supabase/schema/104-nominations.sql
A	apps/supabase/supabase/schema/105-answers.sql
A	apps/supabase/supabase/schema/106-app-settings.sql
A	apps/supabase/supabase/schema/107-feedback.sql
A	apps/supabase/supabase/schema/108-admin-jobs.sql
A	apps/supabase/supabase/schema/200-indexes.sql
A	apps/supabase/supabase/schema/300-auth-tables.sql
A	apps/supabase/supabase/schema/301-auth-functions.sql
A	apps/supabase/supabase/schema/302-rls.sql
A	apps/supabase/supabase/schema/303-column-grants.sql
A	apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql
A	apps/supabase/supabase/schema/305-invitations.sql
A	apps/supabase/supabase/schema/400-storage.sql
A	apps/supabase/supabase/schema/500-external-id.sql
A	apps/supabase/supabase/schema/501-bulk-operations.sql
A	apps/supabase/supabase/schema/502-email-helpers.sql
A	apps/supabase/supabase/schema/503-entity-rpcs.sql
A	apps/supabase/supabase/schema/504-admin-rpcs.sql
A	apps/supabase/supabase/schema/505-question-rpcs.sql
A	apps/supabase/supabase/schema/506-invitation-rpcs.sql
A	apps/supabase/supabase/schema/900-test-helpers.sql
A	apps/supabase/supabase/seed.sql
A	apps/supabase/supabase/tests/database/00-helpers.test.sql
A	apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql
A	apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
A	apps/supabase/supabase/tests/database/03-anon-read.test.sql
A	apps/supabase/supabase/tests/database/04-admin-crud.test.sql
A	apps/supabase/supabase/tests/database/05-organization-admin.test.sql
A	apps/supabase/supabase/tests/database/06-storage-rls.test.sql
A	apps/supabase/supabase/tests/database/07-rpc-security.test.sql
A	apps/supabase/supabase/tests/database/08-triggers.test.sql
A	apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
A	apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
A	apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
A	apps/supabase/supabase/tests/database/12-user-can.test.sql
A	apps/supabase/supabase/tests/database/14-grants-migration.test.sql
A	apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
A	apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
A	apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
A	apps/supabase/supabase/tests/database/18-entity-policies.test.sql
A	apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
A	apps/supabase/supabase/tests/database/20-storage-authority.test.sql
A	apps/supabase/supabase/tests/database/21-entity-organization.test.sql
A	apps/supabase/supabase/tests/database/22-content-policies.test.sql
A	apps/supabase/supabase/tests/database/23-nominations-write.test.sql
A	apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
A	apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
A	apps/supabase/supabase/tests/database/26-uniqueness-keys.test.sql
A	apps/supabase/supabase/tests/database/27-parent-nomination-queue.test.sql
A	apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql
A	apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql
A	apps/supabase/supabase/tests/database/30-closed-project.test.sql
A	apps/supabase/supabase/tests/database/31-storage-cleanup.test.sql
A	apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
A	apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
A	apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql
A	apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
A	apps/supabase/supabase/tests/database/36-entity-identity.test.sql
A	apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
A	apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
A	apps/supabase/supabase/tests/database/39-invitations.test.sql
A	apps/supabase/supabase/tests/database/40-entity-type-list.test.sql
A	apps/supabase/supabase/tests/database/41-entity-color.test.sql
A	apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
A	apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
A	apps/supabase/supabase/tests/database/44-nomination-parent-options.test.sql
A	apps/supabase/supabase/tests/database/45-registration-mode-matrix.test.sql
A	apps/supabase/supabase/tests/database/46-nomination-write-helpers.test.sql
A	apps/supabase/supabase/tests/database/47-invitation-nominations.test.sql
A	apps/supabase/vitest.config.ts
D	backend/vaa-strapi/.dockerignore
D	backend/vaa-strapi/.env.example
D	backend/vaa-strapi/.gitignore
D	backend/vaa-strapi/.prettierignore
D	backend/vaa-strapi/Dockerfile
D	backend/vaa-strapi/README.md
D	backend/vaa-strapi/config/admin.ts
D	backend/vaa-strapi/config/api.ts
D	backend/vaa-strapi/config/database.ts
D	backend/vaa-strapi/config/email-templates/reset-password.html
D	backend/vaa-strapi/config/env/test/database.js
D	backend/vaa-strapi/config/middlewares.ts
D	backend/vaa-strapi/config/plugins.ts
D	backend/vaa-strapi/config/server.ts
D	backend/vaa-strapi/config/typescript.ts
D	backend/vaa-strapi/docker-compose.dev.yml
D	backend/vaa-strapi/eslint.config.mjs
D	backend/vaa-strapi/favicon.png
D	backend/vaa-strapi/jest.config.json
D	backend/vaa-strapi/localstack-init-aws.sh
D	backend/vaa-strapi/localstack-s3-cors-policy.json
D	backend/vaa-strapi/package.json
D	backend/vaa-strapi/public/robots.txt
D	backend/vaa-strapi/src/admin/tsconfig.json
D	backend/vaa-strapi/src/api/admin-job/content-types/admin-job/schema.json
D	backend/vaa-strapi/src/api/admin-job/controllers/admin-job.ts
D	backend/vaa-strapi/src/api/admin-job/routes/admin-job.ts
D	backend/vaa-strapi/src/api/admin-job/services/admin-job.ts
D	backend/vaa-strapi/src/api/alliance/content-types/alliance/schema.json
D	backend/vaa-strapi/src/api/alliance/controllers/alliance.ts
D	backend/vaa-strapi/src/api/alliance/routes/alliance.ts
D	backend/vaa-strapi/src/api/alliance/services/alliance.ts
D	backend/vaa-strapi/src/api/app-customization/content-types/app-customization/schema.json
D	backend/vaa-strapi/src/api/app-customization/controllers/app-customization.ts
D	backend/vaa-strapi/src/api/app-customization/documentation/1.0.0/app-customization.json
D	backend/vaa-strapi/src/api/app-customization/routes/app-customization.ts
D	backend/vaa-strapi/src/api/app-customization/services/app-customization.ts
D	backend/vaa-strapi/src/api/app-setting/content-types/app-setting/schema.json
D	backend/vaa-strapi/src/api/app-setting/controllers/app-setting.ts
D	backend/vaa-strapi/src/api/app-setting/routes/app-setting.ts
D	backend/vaa-strapi/src/api/app-setting/services/app-setting.ts
D	backend/vaa-strapi/src/api/candidate/content-types/candidate/lifecycles.ts
D	backend/vaa-strapi/src/api/candidate/content-types/candidate/schema.json
D	backend/vaa-strapi/src/api/candidate/controllers/answers.ts
D	backend/vaa-strapi/src/api/candidate/controllers/candidate.ts
D	backend/vaa-strapi/src/api/candidate/controllers/properties.ts
D	backend/vaa-strapi/src/api/candidate/documentation/1.0.0/candidate.json
D	backend/vaa-strapi/src/api/candidate/routes/00-customRoutes.ts
D	backend/vaa-strapi/src/api/candidate/routes/candidate.ts
D	backend/vaa-strapi/src/api/candidate/services/candidate.ts
D	backend/vaa-strapi/src/api/constituency-group/content-types/constituency-group/schema.json
D	backend/vaa-strapi/src/api/constituency-group/controllers/constituency-group.ts
D	backend/vaa-strapi/src/api/constituency-group/documentation/1.0.0/constituency-group.json
D	backend/vaa-strapi/src/api/constituency-group/routes/constituency-group.ts
D	backend/vaa-strapi/src/api/constituency-group/services/constituency-group.ts
D	backend/vaa-strapi/src/api/constituency/content-types/constituency/schema.json
D	backend/vaa-strapi/src/api/constituency/controllers/constituency.ts
D	backend/vaa-strapi/src/api/constituency/documentation/1.0.0/constituency.json
D	backend/vaa-strapi/src/api/constituency/routes/constituency.ts
D	backend/vaa-strapi/src/api/constituency/services/constituency.ts
D	backend/vaa-strapi/src/api/election/content-types/election/schema.json
D	backend/vaa-strapi/src/api/election/controllers/election.ts
D	backend/vaa-strapi/src/api/election/documentation/1.0.0/election.json
D	backend/vaa-strapi/src/api/election/routes/election.ts
D	backend/vaa-strapi/src/api/election/services/election.ts
D	backend/vaa-strapi/src/api/feedback/content-types/feedback/schema.json
D	backend/vaa-strapi/src/api/feedback/controllers/feedback.ts
D	backend/vaa-strapi/src/api/feedback/documentation/1.0.0/feedback.json
D	backend/vaa-strapi/src/api/feedback/routes/feedback.ts
D	backend/vaa-strapi/src/api/feedback/services/feedback.ts
D	backend/vaa-strapi/src/api/language/content-types/language/schema.json
D	backend/vaa-strapi/src/api/language/controllers/language.ts
D	backend/vaa-strapi/src/api/language/documentation/1.0.0/language.json
D	backend/vaa-strapi/src/api/language/routes/language.ts
D	backend/vaa-strapi/src/api/language/services/language.ts
D	backend/vaa-strapi/src/api/nomination/content-types/nomination/schema.json
D	backend/vaa-strapi/src/api/nomination/controllers/nomination.ts
D	backend/vaa-strapi/src/api/nomination/documentation/1.0.0/nomination.json
D	backend/vaa-strapi/src/api/nomination/routes/nomination.ts
D	backend/vaa-strapi/src/api/nomination/services/nomination.ts
D	backend/vaa-strapi/src/api/party/content-types/party/schema.json
D	backend/vaa-strapi/src/api/party/controllers/party.ts
D	backend/vaa-strapi/src/api/party/documentation/1.0.0/party.json
D	backend/vaa-strapi/src/api/party/routes/party.ts
D	backend/vaa-strapi/src/api/party/services/party.ts
D	backend/vaa-strapi/src/api/question-category/content-types/question-category/schema.json
D	backend/vaa-strapi/src/api/question-category/controllers/question-category.ts
D	backend/vaa-strapi/src/api/question-category/documentation/1.0.0/question-category.json
D	backend/vaa-strapi/src/api/question-category/routes/question-category.ts
D	backend/vaa-strapi/src/api/question-category/services/question-category.ts
D	backend/vaa-strapi/src/api/question-type/content-types/question-type/schema.json
D	backend/vaa-strapi/src/api/question-type/controllers/question-type.ts
D	backend/vaa-strapi/src/api/question-type/documentation/1.0.0/question-type.json
D	backend/vaa-strapi/src/api/question-type/routes/question-type.ts
D	backend/vaa-strapi/src/api/question-type/services/question-type.ts
D	backend/vaa-strapi/src/api/question/content-types/question/schema.json
D	backend/vaa-strapi/src/api/question/controllers/customdata.ts
D	backend/vaa-strapi/src/api/question/controllers/question.ts
D	backend/vaa-strapi/src/api/question/documentation/1.0.0/question.json
D	backend/vaa-strapi/src/api/question/routes/00-customRoutes.ts
D	backend/vaa-strapi/src/api/question/routes/question.ts
D	backend/vaa-strapi/src/api/question/services/question.ts
D	backend/vaa-strapi/src/components/customization/candidate-app-faq.json
D	backend/vaa-strapi/src/components/customization/translation-override-translation.json
D	backend/vaa-strapi/src/components/customization/translation-override.json
D	backend/vaa-strapi/src/components/settings/access.json
D	backend/vaa-strapi/src/components/settings/candidate-app-questions.json
D	backend/vaa-strapi/src/components/settings/candidate-app.json
D	backend/vaa-strapi/src/components/settings/elections.json
D	backend/vaa-strapi/src/components/settings/entities.json
D	backend/vaa-strapi/src/components/settings/entity-details-contents.json
D	backend/vaa-strapi/src/components/settings/entity-details-show-missing-answers.json
D	backend/vaa-strapi/src/components/settings/entity-details-show-missing-elsmbl.json
D	backend/vaa-strapi/src/components/settings/entity-details.json
D	backend/vaa-strapi/src/components/settings/header-style-dark.json
D	backend/vaa-strapi/src/components/settings/header-style-light.json
D	backend/vaa-strapi/src/components/settings/header-style.json
D	backend/vaa-strapi/src/components/settings/header.json
D	backend/vaa-strapi/src/components/settings/hide-if-missing-answers.json
D	backend/vaa-strapi/src/components/settings/matching.json
D	backend/vaa-strapi/src/components/settings/notifications-notification-data.json
D	backend/vaa-strapi/src/components/settings/notifications.json
D	backend/vaa-strapi/src/components/settings/questions-category-intros.json
D	backend/vaa-strapi/src/components/settings/questions-interactive-info.json
D	backend/vaa-strapi/src/components/settings/questions-intro.json
D	backend/vaa-strapi/src/components/settings/questions.json
D	backend/vaa-strapi/src/components/settings/results-candidate-card-contents.json
D	backend/vaa-strapi/src/components/settings/results-party-card-contents.json
D	backend/vaa-strapi/src/components/settings/results.json
D	backend/vaa-strapi/src/components/settings/survey.json
D	backend/vaa-strapi/src/constants.ts
D	backend/vaa-strapi/src/extensions/documentation/documentation/1.0.0/full_documentation.json
D	backend/vaa-strapi/src/extensions/email/documentation/1.0.0/email.json
D	backend/vaa-strapi/src/extensions/upload/documentation/1.0.0/upload.json
D	backend/vaa-strapi/src/extensions/upload/strapi-server.ts
D	backend/vaa-strapi/src/extensions/users-permissions/content-types/user/schema.json
D	backend/vaa-strapi/src/extensions/users-permissions/controllers/candidate.ts
D	backend/vaa-strapi/src/extensions/users-permissions/documentation/1.0.0/users-permissions.json
D	backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts
D	backend/vaa-strapi/src/functions/defaultData/questionTypes.json
D	backend/vaa-strapi/src/functions/generateMockData.ts
D	backend/vaa-strapi/src/functions/loadDefaultAppSettings.ts
D	backend/vaa-strapi/src/functions/loadDefaultData.ts
D	backend/vaa-strapi/src/functions/loadDynamicTranslations.ts
D	backend/vaa-strapi/src/functions/mockData/mockAdmins.json
D	backend/vaa-strapi/src/functions/mockData/mockCandidateForTesting.json
D	backend/vaa-strapi/src/functions/mockData/mockCategories.json
D	backend/vaa-strapi/src/functions/mockData/mockInfoQuestions.json
D	backend/vaa-strapi/src/functions/mockData/mockQuestionTypes.json
D	backend/vaa-strapi/src/functions/mockData/mockQuestions.json
D	backend/vaa-strapi/src/functions/mockData/mockUsers.json
D	backend/vaa-strapi/src/functions/setDefaultApiPermissions.ts
D	backend/vaa-strapi/src/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/.eslintignore
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/.gitignore
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/.prettierignore
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/.prettierrc
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/README.md
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/custom.d.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/addCandidate.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/candidateAuth.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/candidateStats.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/data.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/email.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/utils/apiPost.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/api/utils/apiResult.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/AddCandidate.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/CandidateAuth.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/CandidateNominatorFileImport.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/CandidateStats.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/DataBase.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/DeleteData.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/FindData.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/ImportData.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/Initializer.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/PluginIcon.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/RegistrationEmailButton.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/RegistrationEmailToAll.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/RegistrationEmailToOne.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/components/SendEmail.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/pages/App.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/pages/HomePage.tsx
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/src/pluginId.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/tsconfig.build.json
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/admin/tsconfig.json
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/package.json
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/bootstrap.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/addCandidate.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/candidateAuth.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/candidateStats.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/data.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/email.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/controllers/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/destroy.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/register.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/addCandidate.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/candidateAuth.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/candidateStats.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/data.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/email.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/admin/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/routes/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/actionResult.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/addCandidate.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/addCandidate.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/candidateAuth.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/candidateAuth.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/candidateStats.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/candidateStats.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/data.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/data.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/email.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/email.type.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/index.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/createOrUpdate.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/emailPlaceholders.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/externalRelations.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/importableCollections.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/sendToAll.ts
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/tsconfig.build.json
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/tsconfig.json
D	backend/vaa-strapi/src/plugins/openvaa-admin-tools/yalc.lock
D	backend/vaa-strapi/src/policies/debug.ts
D	backend/vaa-strapi/src/policies/disallow-all-filters.ts
D	backend/vaa-strapi/src/policies/forbidden.ts
D	backend/vaa-strapi/src/policies/not-answers-locked.ts
D	backend/vaa-strapi/src/policies/restrict-body.ts
D	backend/vaa-strapi/src/policies/restrict-populate.ts
D	backend/vaa-strapi/src/policies/user-is-admin.ts
D	backend/vaa-strapi/src/policies/user-owns-candidate.ts
D	backend/vaa-strapi/src/util/answersLocked.ts
D	backend/vaa-strapi/src/util/api.ts
D	backend/vaa-strapi/src/util/appCustomization.ts
D	backend/vaa-strapi/src/util/appSettings.ts
D	backend/vaa-strapi/src/util/drop.ts
D	backend/vaa-strapi/src/util/getEntity.ts
D	backend/vaa-strapi/src/util/getEntityApi.ts
D	backend/vaa-strapi/src/util/getUsersCandidate.ts
D	backend/vaa-strapi/src/util/isAllowedPopulate.test.ts
D	backend/vaa-strapi/src/util/isAllowedPopulate.ts
D	backend/vaa-strapi/src/util/logger.ts
D	backend/vaa-strapi/src/util/removeNullishProps.ts
D	backend/vaa-strapi/src/util/setEntityAnswers.ts
D	backend/vaa-strapi/src/util/setEntityProperties.ts
D	backend/vaa-strapi/src/util/translations/da/dynamic.json
D	backend/vaa-strapi/src/util/translations/en/dynamic.json
D	backend/vaa-strapi/src/util/translations/et/dynamic.json
D	backend/vaa-strapi/src/util/translations/fi/dynamic.json
D	backend/vaa-strapi/src/util/translations/sv/dynamic.json
D	backend/vaa-strapi/src/util/updateCustomData.ts
D	backend/vaa-strapi/tests/app.test.js
D	backend/vaa-strapi/tests/election/index.js
D	backend/vaa-strapi/tests/helpers/strapi.js
D	backend/vaa-strapi/tests/user/index.js
D	backend/vaa-strapi/tsconfig.json
D	backend/vaa-strapi/tsconfig.tsbuildinfo
D	backend/vaa-strapi/types/customStrapiTypes.d.ts
D	backend/vaa-strapi/types/entities.d.ts
D	backend/vaa-strapi/types/generated/components.d.ts
D	backend/vaa-strapi/types/generated/contentTypes.d.ts
D	backend/vaa-strapi/vitest.config.ts
M	docker-compose.dev.yml
D	docs/README.md
D	docs/eslint.config.js
A	docs/key-generation.md
D	docs/package.json
D	docs/playwright.config.ts
D	docs/scripts/utils/links.ts
D	docs/scripts/validate-links.ts
D	docs/src/app.d.ts
D	docs/src/lib/components/Footer.svelte
D	docs/src/lib/components/Header.svelte
D	docs/src/lib/components/Navigation.svelte
D	docs/src/lib/components/PeerNavigation.svelte
D	docs/src/lib/components/TableOfContents.svelte
D	docs/src/lib/components/openVAALogo/OpenVAALogo.svelte
D	docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts
D	docs/src/lib/navigation.config.ts
D	docs/src/routes/(content)/about/association/+page.md
D	docs/src/routes/(content)/about/features/+page.md
D	docs/src/routes/(content)/about/project/+page.md
D	docs/src/routes/(content)/about/roadmap/+page.md
D	docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md
D	docs/src/routes/(content)/developers-guide/auto-documentation/+page.md
D	docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
D	docs/src/routes/(content)/developers-guide/backend/customized-behaviour/+page.md
D	docs/src/routes/(content)/developers-guide/backend/default-data-loading/+page.md
D	docs/src/routes/(content)/developers-guide/backend/intro/+page.md
D	docs/src/routes/(content)/developers-guide/backend/mock-data-generation/+page.md
D	docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.md
D	docs/src/routes/(content)/developers-guide/backend/plugins/+page.md
D	docs/src/routes/(content)/developers-guide/backend/preparing-backend-dependencies/+page.md
D	docs/src/routes/(content)/developers-guide/backend/re-generating-types/+page.md
D	docs/src/routes/(content)/developers-guide/backend/running-the-backend-separately/+page.md
D	docs/src/routes/(content)/developers-guide/backend/security/+page.md
D	docs/src/routes/(content)/developers-guide/candidate-user-management/creating-a-new-candidate/+page.md
D	docs/src/routes/(content)/developers-guide/candidate-user-management/mock-data/+page.md
D	docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.md
D	docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.md
D	docs/src/routes/(content)/developers-guide/candidate-user-management/resetting-the-password/+page.md
D	docs/src/routes/(content)/developers-guide/configuration/app-customization/+page.md
D	docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
D	docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md
D	docs/src/routes/(content)/developers-guide/configuration/intro/+page.md
D	docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/ai-agents/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/issues/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/pull-request/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/recommended-ide-settings-code/+page.md
D	docs/src/routes/(content)/developers-guide/contributing/workflows/+page.md
D	docs/src/routes/(content)/developers-guide/deployment/+page.md
D	docs/src/routes/(content)/developers-guide/development/intro/+page.md
D	docs/src/routes/(content)/developers-guide/development/monorepo/+page.md
D	docs/src/routes/(content)/developers-guide/development/requirements/+page.md
D	docs/src/routes/(content)/developers-guide/development/running-the-development-environment/+page.md
D	docs/src/routes/(content)/developers-guide/development/testing/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/accessing-data-and-state-management/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/logoutButton/LogoutButton/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/passwordField/PasswordField/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/passwordSetter/PasswordSetter/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/passwordValidator/PasswordValidator/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/preregisteredNotification/PreregisteredNotification/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/termsOfUse/TermsOfUse/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/termsOfUse/TermsOfUseForm/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/accordionSelect/AccordionSelect/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/alert/Alert/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/avatar/Avatar/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/button/Button/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/buttonWithConfirmation/ButtonWithConfirmation/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/categoryTag/CategoryTag/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/constituencySelector/ConstituencySelector/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/constituencySelector/SingleGroupConstituencySelector/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/InfoMessages/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/ProgressBar/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/controller/WarningMessages/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionSelector/ElectionSelector/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionSymbol/ElectionSymbol/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/electionTag/ElectionTag/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/EntityFilters/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/enumerated/EnumeratedEntityFilter/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/numeric/NumericEntityFilter/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityFilters/text/TextEntityFilter/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/entityTag/EntityTag/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/errorMessage/ErrorMessage/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/expander/Expander/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/headingGroup/HeadingGroup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/headingGroup/PreHeading/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/hero/Hero/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/heroEmoji/HeroEmoji/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/icon/Icon/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/icon/PreviewAllIcons/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/image/Image/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/infoAnswer/InfoAnswer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/infoBadge/InfoBadge/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/Input/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/InputGroup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/PreviewAllInputs/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/input/QuestionInput/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/loading/Loading/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/matchScore/MatchScore/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/Modal/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/ModalContainer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/confirmation/ConfirmationModal/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/drawer/Drawer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/modal/timed/TimedModal/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/notification/Notification/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/openVAALogo/OpenVAALogo/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/preventNavigation/PreventNavigation/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/OpinionQuestionInput/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionActions/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionBasicInfo/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionChoices/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionExtendedInfo/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionExtendedInfoButton/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionExtendedInfoDrawer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/questions/QuestionOpenAnswer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/scoreGauge/ScoreGauge/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/select/Select/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/subMatches/SubMatches/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/successMessage/SuccessMessage/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/tabs/Tabs/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/term/Term/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/toggle/Toggle/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/video/Video/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/components/warning/Warning/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/appLogo/AppLogo/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/DataConsent/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/DataConsentInfoButton/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/dataConsent/popup/DataConsentPopup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCard/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCardAction/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityChildren/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityDetails/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityDetailsDrawer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityInfo/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/EntityOpinions/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityDetails/InfoItem/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityList/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityListControls/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/Feedback/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/modal/FeedbackModal/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/feedback/popup/FeedbackPopup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/footer/Footer/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/logoutButton/LogoutButton/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/NavGroup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/NavItem/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/Navigation/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/admin/AdminNav/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/candidate/CandidateNav/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/languages/LanguageSelection/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/navigation/voter/VoterNav/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/questionHeading/QuestionHeading/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/SurveyButton/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/banner/SurveyBanner/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/survey/popup/SurveyPopup/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/data-api/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/environmental-variables/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/intro/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/routing/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md
D	docs/src/routes/(content)/developers-guide/frontend/styling/+page.md
D	docs/src/routes/(content)/developers-guide/llm-features/+page.md
D	docs/src/routes/(content)/developers-guide/localization/intro/+page.md
D	docs/src/routes/(content)/developers-guide/localization/local-translations/+page.md
D	docs/src/routes/(content)/developers-guide/localization/locale-routes/+page.md
D	docs/src/routes/(content)/developers-guide/localization/locale-selection-step-by-step/+page.md
D	docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.md
D	docs/src/routes/(content)/developers-guide/localization/localization-in-the-frontend/+page.md
D	docs/src/routes/(content)/developers-guide/localization/storing-multi-locale-data/+page.md
D	docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md
D	docs/src/routes/(content)/developers-guide/quick-start/+page.md
D	docs/src/routes/(content)/developers-guide/troubleshooting/+page.md
D	docs/src/routes/(content)/publishers-guide/app-settings/+page.md
D	docs/src/routes/(content)/publishers-guide/data-collection/data-from-final-election-lists/+page.md
D	docs/src/routes/(content)/publishers-guide/data-collection/initial-data/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/languages-will-the-vaa-be/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/matching/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/the-application-be-hosted/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/the-statements-or-questions-posed/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/the-voter-see-when-using/+page.md
D	docs/src/routes/(content)/publishers-guide/preparing/what-data-should-be-collected/+page.md
D	docs/src/routes/+layout.svelte
D	docs/src/routes/+page.svelte
D	docs/static/images/co-funded-by-the-eu-en.png
D	docs/svelte.config.js
D	docs/tailwind.config.mjs
D	docs/tsconfig.json
D	docs/tsconfig.tsbuildinfo
D	frontend/.env.example
D	frontend/.gitignore
D	frontend/Dockerfile
D	frontend/README.md
D	frontend/android/.gitignore
D	frontend/android/.idea/.gitignore
D	frontend/android/.idea/compiler.xml
D	frontend/android/.idea/jarRepositories.xml
D	frontend/android/.idea/misc.xml
D	frontend/android/app/.gitignore
D	frontend/android/app/build.gradle
D	frontend/android/app/capacitor.build.gradle
D	frontend/android/app/proguard-rules.pro
D	frontend/android/app/src/main/AndroidManifest.xml
D	frontend/android/app/src/main/java/com/voting/advice/app/MainActivity.java
D	frontend/android/app/src/main/res/drawable-land-hdpi/splash.png
D	frontend/android/app/src/main/res/drawable-land-mdpi/splash.png
D	frontend/android/app/src/main/res/drawable-land-xhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-land-xxhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-land-xxxhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-port-hdpi/splash.png
D	frontend/android/app/src/main/res/drawable-port-mdpi/splash.png
D	frontend/android/app/src/main/res/drawable-port-xhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-port-xxhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-port-xxxhdpi/splash.png
D	frontend/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
D	frontend/android/app/src/main/res/drawable/ic_launcher_background.xml
D	frontend/android/app/src/main/res/drawable/splash.png
D	frontend/android/app/src/main/res/layout/activity_main.xml
D	frontend/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
D	frontend/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
D	frontend/android/app/src/main/res/mipmap-hdpi/ic_launcher.png
D	frontend/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
D	frontend/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
D	frontend/android/app/src/main/res/mipmap-mdpi/ic_launcher.png
D	frontend/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
D	frontend/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
D	frontend/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
D	frontend/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
D	frontend/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
D	frontend/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
D	frontend/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
D	frontend/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
D	frontend/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
D	frontend/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
D	frontend/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
D	frontend/android/app/src/main/res/values/ic_launcher_background.xml
D	frontend/android/app/src/main/res/values/strings.xml
D	frontend/android/app/src/main/res/values/styles.xml
D	frontend/android/app/src/main/res/xml/file_paths.xml
D	frontend/android/build.gradle
D	frontend/android/capacitor.settings.gradle
D	frontend/android/gradle.properties
D	frontend/android/gradle/wrapper/gradle-wrapper.jar
D	frontend/android/gradle/wrapper/gradle-wrapper.properties
D	frontend/android/gradlew
D	frontend/android/gradlew.bat
D	frontend/android/settings.gradle
D	frontend/android/variables.gradle
D	frontend/capacitor.config.ts
D	frontend/docker-compose.dev.yml
D	frontend/eslint.config.mjs
D	frontend/ios/.gitignore
D	frontend/ios/App/App.xcodeproj/project.pbxproj
D	frontend/ios/App/App.xcodeproj/project.xcworkspace/contents.xcworkspacedata
D	frontend/ios/App/App.xcworkspace/contents.xcworkspacedata
D	frontend/ios/App/App.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist
D	frontend/ios/App/App/AppDelegate.swift
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@1x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@2x-1.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@3x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@1x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@2x-1.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@3x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@1x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@2x-1.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@3x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@3x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@1x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-76x76@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-83.5x83.5@2x.png
D	frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json
D	frontend/ios/App/App/Assets.xcassets/Contents.json
D	frontend/ios/App/App/Assets.xcassets/Splash.imageset/Contents.json
D	frontend/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png
D	frontend/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png
D	frontend/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png
D	frontend/ios/App/App/Base.lproj/LaunchScreen.storyboard
D	frontend/ios/App/App/Base.lproj/Main.storyboard
D	frontend/ios/App/App/Info.plist
D	frontend/ios/App/Podfile
D	frontend/jest.config.json
D	frontend/package.json
D	frontend/postcss.config.cjs
D	frontend/src/app.css
D	frontend/src/app.d.ts
D	frontend/src/app.html
D	frontend/src/hooks.server.ts
D	frontend/src/lib/admin/components/jobs/FeatureJobs.svelte
D	frontend/src/lib/admin/components/jobs/JobDetails.svelte
D	frontend/src/lib/admin/components/jobs/WithPolling.svelte
D	frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte
D	frontend/src/lib/admin/components/languageFeatures/LanguageSelector.type.ts
D	frontend/src/lib/api/README.md
D	frontend/src/lib/api/adapters/apiRoute/dataProvider/index.ts
D	frontend/src/lib/api/adapters/apiRoute/feedbackWriter/index.ts
D	frontend/src/lib/api/adapters/strapi/dataProvider/index.ts
D	frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts
D	frontend/src/lib/api/adapters/strapi/dataWriter/index.ts
D	frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts
D	frontend/src/lib/api/adapters/strapi/feedbackWriter/index.ts
D	frontend/src/lib/api/adapters/strapi/feedbackWriter/strapiFeedbackWriter.ts
D	frontend/src/lib/api/adapters/strapi/strapiAdapter.ts
D	frontend/src/lib/api/adapters/strapi/strapiAdapter.type.ts
D	frontend/src/lib/api/adapters/strapi/strapiApi.ts
D	frontend/src/lib/api/adapters/strapi/strapiData.type.ts
D	frontend/src/lib/api/adapters/strapi/utils/buildFilterParams.ts
D	frontend/src/lib/api/adapters/strapi/utils/index.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseBasics.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseCandidate.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseEntityType.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseImage.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseNominations.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseOrganization.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseQuestionCategoryCustomData.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseQuestionCustomData.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseQuestionType.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseRelationIds.ts
D	frontend/src/lib/api/adapters/strapi/utils/parseUser.ts
D	frontend/src/lib/api/base/dataWriter.type.ts
D	frontend/src/lib/api/base/getDataFilters.type.ts
D	frontend/src/lib/api/base/getDataOptions.type.ts
D	frontend/src/lib/api/base/universalAdapter.test.ts
D	frontend/src/lib/api/base/universalApiRoutes.ts
D	frontend/src/lib/api/base/universalDataWriter.ts
D	frontend/src/lib/api/dataProvider.ts
D	frontend/src/lib/api/dataWriter.ts
D	frontend/src/lib/api/feedbackWriter.ts
D	frontend/src/lib/api/utils/auth/getIdTokenClaims.ts
D	frontend/src/lib/api/utils/authHeaders.test.ts
D	frontend/src/lib/api/utils/authHeaders.ts
D	frontend/src/lib/api/utils/cachifyUrl.test.ts
D	frontend/src/lib/api/utils/cachifyUrl.ts
D	frontend/src/lib/api/utils/isValidResult.ts
D	frontend/src/lib/api/utils/parseAnswers.ts
D	frontend/src/lib/api/utils/parseResponse.test.ts
D	frontend/src/lib/api/utils/parseResponse.ts
D	frontend/src/lib/api/utils/translateLocalizedCandidate.ts
D	frontend/src/lib/auth/authToken.ts
D	frontend/src/lib/auth/getUserData.ts
D	frontend/src/lib/auth/index.ts
D	frontend/src/lib/candidate/components/README.md
D	frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
D	frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts
D	frontend/src/lib/candidate/components/passwordField/PasswordField.svelte
D	frontend/src/lib/candidate/components/passwordField/PasswordField.type.ts
D	frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
D	frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts
D	frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
D	frontend/src/lib/candidate/components/preregisteredNotification/PreregisteredNotification.svelte
D	frontend/src/lib/candidate/components/termsOfUse/TermsOfUse.svelte
D	frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte
D	frontend/src/lib/candidate/components/termsOfUse/index.ts
D	frontend/src/lib/candidate/utils/loginError.ts
D	frontend/src/lib/candidate/utils/preregistrationError.ts
D	frontend/src/lib/components/README.md
D	frontend/src/lib/components/accordionSelect/AccordionSelect.svelte
D	frontend/src/lib/components/alert/Alert.svelte
D	frontend/src/lib/components/alert/Alert.type.ts
D	frontend/src/lib/components/analytics/umami/UmamiAnalytics.svelte
D	frontend/src/lib/components/analytics/umami/UmamiAnalytics.type.ts
D	frontend/src/lib/components/analytics/umami/index.ts
D	frontend/src/lib/components/avatar/Avatar.svelte
D	frontend/src/lib/components/button/Button.svelte
D	frontend/src/lib/components/button/Button.type.ts
D	frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte
D	frontend/src/lib/components/categoryTag/CategoryTag.svelte
D	frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
D	frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte
D	frontend/src/lib/components/controller/InfoMessages.svelte
D	frontend/src/lib/components/controller/ProgressBar.svelte
D	frontend/src/lib/components/controller/WarningMessages.svelte
D	frontend/src/lib/components/electionSelector/ElectionSelector.svelte
D	frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte
D	frontend/src/lib/components/electionTag/ElectionTag.svelte
D	frontend/src/lib/components/entityFilters/EntityFilters.svelte
D	frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte
D	frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte
D	frontend/src/lib/components/entityFilters/text/TextEntityFilter.svelte
D	frontend/src/lib/components/entityTag/EntityTag.svelte
D	frontend/src/lib/components/errorMessage/ErrorMessage.svelte
D	frontend/src/lib/components/expander/Expander.svelte
D	frontend/src/lib/components/expander/Expander.type.ts
D	frontend/src/lib/components/headingGroup/HeadingGroup.svelte
D	frontend/src/lib/components/headingGroup/HeadingGroup.type.ts
D	frontend/src/lib/components/headingGroup/PreHeading.svelte
D	frontend/src/lib/components/headingGroup/PreHeading.type.ts
D	frontend/src/lib/components/heroEmoji/HeroEmoji.svelte
D	frontend/src/lib/components/icon/Icon.svelte
D	frontend/src/lib/components/icon/PreviewAllIcons.svelte
D	frontend/src/lib/components/image/Image.svelte
D	frontend/src/lib/components/infoAnswer/InfoAnswer.svelte
D	frontend/src/lib/components/infoBadge/InfoBadge.svelte
D	frontend/src/lib/components/input/Input.svelte
D	frontend/src/lib/components/input/Input.type.ts
D	frontend/src/lib/components/input/InputGroup.svelte
D	frontend/src/lib/components/input/InputGroup.type.ts
D	frontend/src/lib/components/input/QuestionInput.svelte
D	frontend/src/lib/components/input/index.ts
D	frontend/src/lib/components/input/shared.ts
D	frontend/src/lib/components/loading/Loading.svelte
D	frontend/src/lib/components/matchScore/MatchScore.svelte
D	frontend/src/lib/components/matchScore/MatchScore.type.ts
D	frontend/src/lib/components/modal/Modal.svelte
D	frontend/src/lib/components/modal/Modal.type.ts
D	frontend/src/lib/components/modal/ModalContainer.type.ts
D	frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte
D	frontend/src/lib/components/modal/confirmation/ConfirmationModal.type.ts
D	frontend/src/lib/components/modal/drawer/Drawer.svelte
D	frontend/src/lib/components/modal/drawer/Drawer.type.ts
D	frontend/src/lib/components/modal/timed/TimedModal.svelte
D	frontend/src/lib/components/modal/timed/TimedModal.type.ts
D	frontend/src/lib/components/notification/Notification.svelte
D	frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte
D	frontend/src/lib/components/openVAALogo/OpenVAALogo.type.ts
D	frontend/src/lib/components/preventNavigation/PreventNavigation.svelte
D	frontend/src/lib/components/questions/OpinionQuestionInput.svelte
D	frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
D	frontend/src/lib/components/questions/QuestionActions.svelte
D	frontend/src/lib/components/questions/QuestionArguments.svelte
D	frontend/src/lib/components/questions/QuestionBasicInfo.svelte
D	frontend/src/lib/components/questions/QuestionChoices.svelte
D	frontend/src/lib/components/questions/QuestionChoices.type.ts
D	frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
D	frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts
D	frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
D	frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte
D	frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.type.ts
D	frontend/src/lib/components/questions/QuestionOpenAnswer.svelte
D	frontend/src/lib/components/questions/index.ts
D	frontend/src/lib/components/scoreGauge/ScoreGauge.svelte
D	frontend/src/lib/components/select/Select.svelte
D	frontend/src/lib/components/select/Select.type.ts
D	frontend/src/lib/components/subMatches/SubMatches.svelte
D	frontend/src/lib/components/successMessage/SuccessMessage.svelte
D	frontend/src/lib/components/tabs/Tabs.svelte
D	frontend/src/lib/components/tabs/Tabs.type.ts
D	frontend/src/lib/components/tabs/index.ts
D	frontend/src/lib/components/term/Term.svelte
D	frontend/src/lib/components/video/Video.svelte
D	frontend/src/lib/components/video/Video.type.ts
D	frontend/src/lib/components/video/component-stores.ts
D	frontend/src/lib/components/warning/Warning.svelte
D	frontend/src/lib/components/warning/Warning.type.ts
D	frontend/src/lib/contexts/README.md
D	frontend/src/lib/contexts/admin/adminContext.ts
D	frontend/src/lib/contexts/admin/adminContext.type.ts
D	frontend/src/lib/contexts/admin/index.ts
D	frontend/src/lib/contexts/admin/jobStores.ts
D	frontend/src/lib/contexts/admin/jobStores.type.ts
D	frontend/src/lib/contexts/app/appContext.ts
D	frontend/src/lib/contexts/app/appContext.type.ts
D	frontend/src/lib/contexts/app/appCustomization.type.ts
D	frontend/src/lib/contexts/app/getRoute.ts
D	frontend/src/lib/contexts/app/index.ts
D	frontend/src/lib/contexts/app/popup/index.ts
D	frontend/src/lib/contexts/app/popup/popupComponent.type.ts
D	frontend/src/lib/contexts/app/popup/popupStore.ts
D	frontend/src/lib/contexts/app/popup/popupStore.type.ts
D	frontend/src/lib/contexts/app/survey.ts
D	frontend/src/lib/contexts/app/tracking/index.ts
D	frontend/src/lib/contexts/app/tracking/trackingEvent.type.ts
D	frontend/src/lib/contexts/app/tracking/trackingService.ts
D	frontend/src/lib/contexts/app/tracking/trackingService.type.ts
D	frontend/src/lib/contexts/app/userPreferences.type.ts
D	frontend/src/lib/contexts/auth/authContext.ts
D	frontend/src/lib/contexts/auth/authContext.type.ts
D	frontend/src/lib/contexts/auth/index.ts
D	frontend/src/lib/contexts/candidate/candidateContext.ts
D	frontend/src/lib/contexts/candidate/candidateContext.type.ts
D	frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
D	frontend/src/lib/contexts/candidate/candidateUserDataStore.type.ts
D	frontend/src/lib/contexts/candidate/index.ts
D	frontend/src/lib/contexts/component/componentContext.ts
D	frontend/src/lib/contexts/component/componentContext.type.ts
D	frontend/src/lib/contexts/component/darkMode.ts
D	frontend/src/lib/contexts/component/index.ts
D	frontend/src/lib/contexts/data/dataContext.ts
D	frontend/src/lib/contexts/data/dataContext.type.ts
D	frontend/src/lib/contexts/data/index.ts
D	frontend/src/lib/contexts/i18n/i18nContext.type.ts
D	frontend/src/lib/contexts/layout/index.ts
D	frontend/src/lib/contexts/layout/layoutContext.ts
D	frontend/src/lib/contexts/layout/layoutContext.type.ts
D	frontend/src/lib/contexts/utils/dataCollectionStore.ts
D	frontend/src/lib/contexts/utils/pageDatumStore.ts
D	frontend/src/lib/contexts/utils/paramStore.ts
D	frontend/src/lib/contexts/utils/parsimoniusDerived.ts
D	frontend/src/lib/contexts/utils/prepareDataWriter.ts
D	frontend/src/lib/contexts/utils/questionBlockStore.ts
D	frontend/src/lib/contexts/utils/questionCategoryStore.ts
D	frontend/src/lib/contexts/utils/questionStore.ts
D	frontend/src/lib/contexts/utils/stackedStore.ts
D	frontend/src/lib/contexts/utils/storageStore.ts
D	frontend/src/lib/contexts/voter/answerStore.ts
D	frontend/src/lib/contexts/voter/answerStore.type.ts
D	frontend/src/lib/contexts/voter/filters/filterStore.ts
D	frontend/src/lib/contexts/voter/index.ts
D	frontend/src/lib/contexts/voter/matchStore.ts
D	frontend/src/lib/contexts/voter/nominationAndQuestionStore.ts
D	frontend/src/lib/contexts/voter/voterContext.ts
D	frontend/src/lib/contexts/voter/voterContext.type.ts
D	frontend/src/lib/dynamic-components/README.md
D	frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte
D	frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte
D	frontend/src/lib/dynamic-components/dataConsent/DataConsent.type.ts
D	frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.svelte
D	frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte
D	frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
D	frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts
D	frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte
D	frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts
D	frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte
D	frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
D	frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts
D	frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte
D	frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.type.ts
D	frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
D	frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
D	frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte
D	frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts
D	frontend/src/lib/dynamic-components/entityDetails/index.ts
D	frontend/src/lib/dynamic-components/entityList/EntityList.svelte
D	frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte
D	frontend/src/lib/dynamic-components/entityList/index.ts
D	frontend/src/lib/dynamic-components/feedback/Feedback.svelte
D	frontend/src/lib/dynamic-components/feedback/Feedback.type.ts
D	frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte
D	frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
D	frontend/src/lib/dynamic-components/footer/Footer.svelte
D	frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte
D	frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts
D	frontend/src/lib/dynamic-components/navigation/NavGroup.svelte
D	frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts
D	frontend/src/lib/dynamic-components/navigation/NavItem.svelte
D	frontend/src/lib/dynamic-components/navigation/NavItem.type.ts
D	frontend/src/lib/dynamic-components/navigation/Navigation.svelte
D	frontend/src/lib/dynamic-components/navigation/Navigation.type.ts
D	frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
D	frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
D	frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.type.ts
D	frontend/src/lib/dynamic-components/navigation/candidate/index.ts
D	frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
D	frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
D	frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
D	frontend/src/lib/dynamic-components/survey/SurveyButton.svelte
D	frontend/src/lib/dynamic-components/survey/SurveyButton.type.ts
D	frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte
D	frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte
D	frontend/src/lib/i18n/README.md
D	frontend/src/lib/i18n/init.ts
D	frontend/src/lib/i18n/tests/translations.test.ts
D	frontend/src/lib/i18n/translations/da/about.json
D	frontend/src/lib/i18n/translations/da/adminApp.argumentCondensation.json
D	frontend/src/lib/i18n/translations/da/adminApp.common.json
D	frontend/src/lib/i18n/translations/da/adminApp.error.json
D	frontend/src/lib/i18n/translations/da/adminApp.factorAnalysis.json
D	frontend/src/lib/i18n/translations/da/adminApp.jobs.json
D	frontend/src/lib/i18n/translations/da/adminApp.languageFeatures.json
D	frontend/src/lib/i18n/translations/da/adminApp.login.json
D	frontend/src/lib/i18n/translations/da/adminApp.notSupported.json
D	frontend/src/lib/i18n/translations/da/adminApp.questionInfo.json
D	frontend/src/lib/i18n/translations/da/candidateApp.basicInfo.json
D	frontend/src/lib/i18n/translations/da/candidateApp.common.json
D	frontend/src/lib/i18n/translations/da/candidateApp.error.json
D	frontend/src/lib/i18n/translations/da/candidateApp.help.json
D	frontend/src/lib/i18n/translations/da/candidateApp.home.json
D	frontend/src/lib/i18n/translations/da/candidateApp.info.json
D	frontend/src/lib/i18n/translations/da/candidateApp.login.json
D	frontend/src/lib/i18n/translations/da/candidateApp.logoutModal.json
D	frontend/src/lib/i18n/translations/da/candidateApp.notSupported.json
D	frontend/src/lib/i18n/translations/da/candidateApp.preregister.json
D	frontend/src/lib/i18n/translations/da/candidateApp.preview.json
D	frontend/src/lib/i18n/translations/da/candidateApp.privacy.json
D	frontend/src/lib/i18n/translations/da/candidateApp.questions.json
D	frontend/src/lib/i18n/translations/da/candidateApp.register.json
D	frontend/src/lib/i18n/translations/da/candidateApp.resetPassword.json
D	frontend/src/lib/i18n/translations/da/candidateApp.setPassword.json
D	frontend/src/lib/i18n/translations/da/candidateApp.settings.json
D	frontend/src/lib/i18n/translations/da/common.json
D	frontend/src/lib/i18n/translations/da/components.json
D	frontend/src/lib/i18n/translations/da/constituencies.json
D	frontend/src/lib/i18n/translations/da/dynamic.json
D	frontend/src/lib/i18n/translations/da/elections.json
D	frontend/src/lib/i18n/translations/da/entityCard.json
D	frontend/src/lib/i18n/translations/da/entityDetails.json
D	frontend/src/lib/i18n/translations/da/entityFilters.json
D	frontend/src/lib/i18n/translations/da/entityList.json
D	frontend/src/lib/i18n/translations/da/error.json
D	frontend/src/lib/i18n/translations/da/feedback.json
D	frontend/src/lib/i18n/translations/da/help.json
D	frontend/src/lib/i18n/translations/da/info.json
D	frontend/src/lib/i18n/translations/da/maintenance.json
D	frontend/src/lib/i18n/translations/da/privacy.json
D	frontend/src/lib/i18n/translations/da/questions.json
D	frontend/src/lib/i18n/translations/da/results.json
D	frontend/src/lib/i18n/translations/da/statistics.json
D	frontend/src/lib/i18n/translations/da/yourList.json
D	frontend/src/lib/i18n/translations/en/about.json
D	frontend/src/lib/i18n/translations/en/adminApp.argumentCondensation.json
D	frontend/src/lib/i18n/translations/en/adminApp.common.json
D	frontend/src/lib/i18n/translations/en/adminApp.error.json
D	frontend/src/lib/i18n/translations/en/adminApp.factorAnalysis.json
D	frontend/src/lib/i18n/translations/en/adminApp.jobs.json
D	frontend/src/lib/i18n/translations/en/adminApp.languageFeatures.json
D	frontend/src/lib/i18n/translations/en/adminApp.login.json
D	frontend/src/lib/i18n/translations/en/adminApp.notSupported.json
D	frontend/src/lib/i18n/translations/en/adminApp.questionInfo.json
D	frontend/src/lib/i18n/translations/en/candidateApp.basicInfo.json
D	frontend/src/lib/i18n/translations/en/candidateApp.common.json
D	frontend/src/lib/i18n/translations/en/candidateApp.error.json
D	frontend/src/lib/i18n/translations/en/candidateApp.help.json
D	frontend/src/lib/i18n/translations/en/candidateApp.home.json
D	frontend/src/lib/i18n/translations/en/candidateApp.info.json
D	frontend/src/lib/i18n/translations/en/candidateApp.login.json
D	frontend/src/lib/i18n/translations/en/candidateApp.logoutModal.json
D	frontend/src/lib/i18n/translations/en/candidateApp.notSupported.json
D	frontend/src/lib/i18n/translations/en/candidateApp.preregister.json
D	frontend/src/lib/i18n/translations/en/candidateApp.preview.json
D	frontend/src/lib/i18n/translations/en/candidateApp.privacy.json
D	frontend/src/lib/i18n/translations/en/candidateApp.questions.json
D	frontend/src/lib/i18n/translations/en/candidateApp.register.json
D	frontend/src/lib/i18n/translations/en/candidateApp.resetPassword.json
D	frontend/src/lib/i18n/translations/en/candidateApp.setPassword.json
D	frontend/src/lib/i18n/translations/en/candidateApp.settings.json
D	frontend/src/lib/i18n/translations/en/common.json
D	frontend/src/lib/i18n/translations/en/components.json
D	frontend/src/lib/i18n/translations/en/constituencies.json
D	frontend/src/lib/i18n/translations/en/dynamic.json
D	frontend/src/lib/i18n/translations/en/elections.json
D	frontend/src/lib/i18n/translations/en/entityCard.json
D	frontend/src/lib/i18n/translations/en/entityDetails.json
D	frontend/src/lib/i18n/translations/en/entityFilters.json
D	frontend/src/lib/i18n/translations/en/entityList.json
D	frontend/src/lib/i18n/translations/en/error.json
D	frontend/src/lib/i18n/translations/en/feedback.json
D	frontend/src/lib/i18n/translations/en/help.json
D	frontend/src/lib/i18n/translations/en/info.json
D	frontend/src/lib/i18n/translations/en/maintenance.json
D	frontend/src/lib/i18n/translations/en/privacy.json
D	frontend/src/lib/i18n/translations/en/questions.json
D	frontend/src/lib/i18n/translations/en/results.json
D	frontend/src/lib/i18n/translations/en/statistics.json
D	frontend/src/lib/i18n/translations/en/yourList.json
D	frontend/src/lib/i18n/translations/et/about.json
D	frontend/src/lib/i18n/translations/et/adminApp.argumentCondensation.json
D	frontend/src/lib/i18n/translations/et/adminApp.common.json
D	frontend/src/lib/i18n/translations/et/adminApp.error.json
D	frontend/src/lib/i18n/translations/et/adminApp.factorAnalysis.json
D	frontend/src/lib/i18n/translations/et/adminApp.jobs.json
D	frontend/src/lib/i18n/translations/et/adminApp.languageFeatures.json
D	frontend/src/lib/i18n/translations/et/adminApp.login.json
D	frontend/src/lib/i18n/translations/et/adminApp.notSupported.json
D	frontend/src/lib/i18n/translations/et/adminApp.questionInfo.json
D	frontend/src/lib/i18n/translations/et/candidateApp.basicInfo.json
D	frontend/src/lib/i18n/translations/et/candidateApp.common.json
D	frontend/src/lib/i18n/translations/et/candidateApp.error.json
D	frontend/src/lib/i18n/translations/et/candidateApp.help.json
D	frontend/src/lib/i18n/translations/et/candidateApp.home.json
D	frontend/src/lib/i18n/translations/et/candidateApp.info.json
D	frontend/src/lib/i18n/translations/et/candidateApp.login.json
D	frontend/src/lib/i18n/translations/et/candidateApp.logoutModal.json
D	frontend/src/lib/i18n/translations/et/candidateApp.notSupported.json
D	frontend/src/lib/i18n/translations/et/candidateApp.preregister.json
D	frontend/src/lib/i18n/translations/et/candidateApp.preview.json
D	frontend/src/lib/i18n/translations/et/candidateApp.privacy.json
D	frontend/src/lib/i18n/translations/et/candidateApp.questions.json
D	frontend/src/lib/i18n/translations/et/candidateApp.register.json
D	frontend/src/lib/i18n/translations/et/candidateApp.resetPassword.json
D	frontend/src/lib/i18n/translations/et/candidateApp.setPassword.json
D	frontend/src/lib/i18n/translations/et/candidateApp.settings.json
D	frontend/src/lib/i18n/translations/et/common.json
D	frontend/src/lib/i18n/translations/et/components.json
D	frontend/src/lib/i18n/translations/et/constituencies.json
D	frontend/src/lib/i18n/translations/et/dynamic.json
D	frontend/src/lib/i18n/translations/et/elections.json
D	frontend/src/lib/i18n/translations/et/entityCard.json
D	frontend/src/lib/i18n/translations/et/entityDetails.json
D	frontend/src/lib/i18n/translations/et/entityFilters.json
D	frontend/src/lib/i18n/translations/et/entityList.json
D	frontend/src/lib/i18n/translations/et/error.json
D	frontend/src/lib/i18n/translations/et/feedback.json
D	frontend/src/lib/i18n/translations/et/help.json
D	frontend/src/lib/i18n/translations/et/info.json
D	frontend/src/lib/i18n/translations/et/maintenance.json
D	frontend/src/lib/i18n/translations/et/privacy.json
D	frontend/src/lib/i18n/translations/et/questions.json
D	frontend/src/lib/i18n/translations/et/results.json
D	frontend/src/lib/i18n/translations/et/statistics.json
D	frontend/src/lib/i18n/translations/et/yourList.json
D	frontend/src/lib/i18n/translations/fi/about.json
D	frontend/src/lib/i18n/translations/fi/adminApp.argumentCondensation.json
D	frontend/src/lib/i18n/translations/fi/adminApp.common.json
D	frontend/src/lib/i18n/translations/fi/adminApp.error.json
D	frontend/src/lib/i18n/translations/fi/adminApp.factorAnalysis.json
D	frontend/src/lib/i18n/translations/fi/adminApp.jobs.json
D	frontend/src/lib/i18n/translations/fi/adminApp.languageFeatures.json
D	frontend/src/lib/i18n/translations/fi/adminApp.login.json
D	frontend/src/lib/i18n/translations/fi/adminApp.notSupported.json
D	frontend/src/lib/i18n/translations/fi/adminApp.questionInfo.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.basicInfo.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.common.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.error.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.help.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.home.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.info.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.login.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.logoutModal.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.notSupported.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.preregister.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.preview.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.privacy.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.questions.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.register.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.resetPassword.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.setPassword.json
D	frontend/src/lib/i18n/translations/fi/candidateApp.settings.json
D	frontend/src/lib/i18n/translations/fi/common.json
D	frontend/src/lib/i18n/translations/fi/components.json
D	frontend/src/lib/i18n/translations/fi/constituencies.json
D	frontend/src/lib/i18n/translations/fi/dynamic.json
D	frontend/src/lib/i18n/translations/fi/elections.json
D	frontend/src/lib/i18n/translations/fi/entityCard.json
D	frontend/src/lib/i18n/translations/fi/entityDetails.json
D	frontend/src/lib/i18n/translations/fi/entityFilters.json
D	frontend/src/lib/i18n/translations/fi/entityList.json
D	frontend/src/lib/i18n/translations/fi/error.json
D	frontend/src/lib/i18n/translations/fi/feedback.json
D	frontend/src/lib/i18n/translations/fi/help.json
D	frontend/src/lib/i18n/translations/fi/info.json
D	frontend/src/lib/i18n/translations/fi/maintenance.json
D	frontend/src/lib/i18n/translations/fi/privacy.json
D	frontend/src/lib/i18n/translations/fi/questions.json
D	frontend/src/lib/i18n/translations/fi/results.json
D	frontend/src/lib/i18n/translations/fi/statistics.json
D	frontend/src/lib/i18n/translations/fi/yourList.json
D	frontend/src/lib/i18n/translations/index.ts
D	frontend/src/lib/i18n/translations/sv/about.json
D	frontend/src/lib/i18n/translations/sv/adminApp.argumentCondensation.json
D	frontend/src/lib/i18n/translations/sv/adminApp.common.json
D	frontend/src/lib/i18n/translations/sv/adminApp.error.json
D	frontend/src/lib/i18n/translations/sv/adminApp.factorAnalysis.json
D	frontend/src/lib/i18n/translations/sv/adminApp.jobs.json
D	frontend/src/lib/i18n/translations/sv/adminApp.languageFeatures.json
D	frontend/src/lib/i18n/translations/sv/adminApp.login.json
D	frontend/src/lib/i18n/translations/sv/adminApp.notSupported.json
D	frontend/src/lib/i18n/translations/sv/adminApp.questionInfo.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.basicInfo.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.common.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.error.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.help.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.home.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.info.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.login.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.logoutModal.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.notSupported.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.preregister.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.preview.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.privacy.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.questions.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.register.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.resetPassword.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.setPassword.json
D	frontend/src/lib/i18n/translations/sv/candidateApp.settings.json
D	frontend/src/lib/i18n/translations/sv/common.json
D	frontend/src/lib/i18n/translations/sv/components.json
D	frontend/src/lib/i18n/translations/sv/constituencies.json
D	frontend/src/lib/i18n/translations/sv/dynamic.json
D	frontend/src/lib/i18n/translations/sv/elections.json
D	frontend/src/lib/i18n/translations/sv/entityCard.json
D	frontend/src/lib/i18n/translations/sv/entityDetails.json
D	frontend/src/lib/i18n/translations/sv/entityFilters.json
D	frontend/src/lib/i18n/translations/sv/entityList.json
D	frontend/src/lib/i18n/translations/sv/error.json
D	frontend/src/lib/i18n/translations/sv/feedback.json
D	frontend/src/lib/i18n/translations/sv/help.json
D	frontend/src/lib/i18n/translations/sv/info.json
D	frontend/src/lib/i18n/translations/sv/maintenance.json
D	frontend/src/lib/i18n/translations/sv/privacy.json
D	frontend/src/lib/i18n/translations/sv/questions.json
D	frontend/src/lib/i18n/translations/sv/results.json
D	frontend/src/lib/i18n/translations/sv/statistics.json
D	frontend/src/lib/i18n/translations/sv/yourList.json
D	frontend/src/lib/i18n/translations/translations.type.ts
D	frontend/src/lib/i18n/utils/assertTranslationKey.ts
D	frontend/src/lib/i18n/utils/canonize.ts
D	frontend/src/lib/i18n/utils/intl.d.ts
D	frontend/src/lib/server/admin/features/condenseArguments.ts
D	frontend/src/lib/server/admin/features/generateQuestionInfo.ts
D	frontend/src/lib/server/admin/jobs/jobStore.type.ts
D	frontend/src/lib/server/api/README.md 21-40-30-014.md
D	frontend/src/lib/server/api/adapters/local/dataProvider/index.ts
D	frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts
D	frontend/src/lib/server/api/adapters/local/feedbackWriter/index.ts
D	frontend/src/lib/server/constants.ts
D	frontend/src/lib/types/generated/translationKey.ts
D	frontend/src/lib/utils/color/PreviewColorContrast.svelte
D	frontend/src/lib/utils/color/ensureColors.ts
D	frontend/src/lib/utils/components.ts
D	frontend/src/lib/utils/constants.ts
D	frontend/src/lib/utils/email.ts
D	frontend/src/lib/utils/logger.ts
D	frontend/src/lib/utils/matches.ts
D	frontend/src/lib/utils/matching/imputeParentAnswers.ts
D	frontend/src/lib/utils/merge.ts
D	frontend/src/lib/utils/questions/index.ts
D	frontend/src/lib/utils/regexp.ts
D	frontend/src/lib/utils/route/buildRoute.ts
D	frontend/src/lib/utils/route/filterPersistent.ts
D	frontend/src/lib/utils/route/impliedParams.ts
D	frontend/src/lib/utils/route/index.ts
D	frontend/src/lib/utils/route/params.ts
D	frontend/src/lib/utils/route/parseParams.ts
D	frontend/src/lib/utils/route/route.ts
D	frontend/src/lib/utils/settings.ts
D	frontend/src/params/entityType.ts
D	frontend/src/params/locale.ts
D	frontend/src/routes/README.md
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/[questionId]/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/category/[categoryId]/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/statistics/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/about/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/constituencies/+page.ts
D	frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/elections/+page.ts
D	frontend/src/routes/[[lang=locale]]/(voters)/info/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/intro/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/nominations/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/nominations/+layout.ts
D	frontend/src/routes/[[lang=locale]]/(voters)/nominations/+page.svelte
D	frontend/src/routes/[[lang=locale]]/(voters)/privacy/+page.svelte
D	frontend/src/routes/[[lang=locale]]/+error.svelte
D	frontend/src/routes/[[lang=locale]]/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/+layout.ts
D	frontend/src/routes/[[lang=locale]]/Banner.svelte
D	frontend/src/routes/[[lang=locale]]/Header.svelte
D	frontend/src/routes/[[lang=locale]]/Layout.svelte
D	frontend/src/routes/[[lang=locale]]/Layout.type.ts
D	frontend/src/routes/[[lang=locale]]/MainContent.svelte
D	frontend/src/routes/[[lang=locale]]/MainContent.type.ts
D	frontend/src/routes/[[lang=locale]]/MaintenancePage.svelte
D	frontend/src/routes/[[lang=locale]]/MaintenancePage.type.ts
D	frontend/src/routes/[[lang=locale]]/SingleCardContent.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/+layout.ts
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/+page.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+layout.ts
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.server.ts
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/jobs/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/jobs/+page.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+layout.ts
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.server.ts
D	frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.svelte
D	frontend/src/routes/[[lang=locale]]/admin/+layout.server.ts
D	frontend/src/routes/[[lang=locale]]/admin/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/admin/login/+page.server.ts
D	frontend/src/routes/[[lang=locale]]/admin/login/+page.svelte
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/abort-all/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/active/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/past/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/single/[jobId]/abort/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/single/[jobId]/progress/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/admin/jobs/start/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/auth/logout/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/cache/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts
D	frontend/src/routes/[[lang=locale]]/api/oidc/token/+server.ts
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.ts
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/preview/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/profile/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/[questionId]/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/(protected)/settings/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts
D	frontend/src/routes/[[lang=locale]]/candidate/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/README.md
D	frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/help/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts
D	frontend/src/routes/[[lang=locale]]/candidate/login/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/constituencies/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/elections/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/(authenticated)/email/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/+layout.server.ts
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/+page.ts
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/signicat/oidc/callback/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/preregister/status/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/privacy/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/register/+layout.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/register/+page.svelte
D	frontend/src/routes/[[lang=locale]]/candidate/register/+page.ts
D	frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte
D	frontend/svelte.config.js
D	frontend/tailwind.config.mjs
D	frontend/tests/password-validation.spec.ts
D	frontend/tests/strapiDataProvider/data/allParties.response.json
D	frontend/tests/strapiDataProvider/data/allParties.result.json
D	frontend/tests/strapiDataProvider/strapiDataProvider.test.ts
D	frontend/tools/editTranslations/editTranslations.ts
D	frontend/tools/translationKey/generateTranslationKeyType.ts
D	frontend/tsconfig.json
D	frontend/tsconfig.tsbuildinfo
D	frontend/vite.config.ts
D	frontend/vitest.config.ts
A	infra/.terraform-version
A	infra/README.md
A	infra/bootstrap/.terraform.lock.hcl
A	infra/bootstrap/README.md
A	infra/bootstrap/backend.tf
A	infra/bootstrap/example.tfvars
A	infra/bootstrap/main.tf
A	infra/bootstrap/outputs.tf
A	infra/bootstrap/terraform.tfvars
A	infra/bootstrap/variables.tf
A	infra/envs/example/aws/.terraform.lock.hcl
A	infra/envs/example/aws/main.tf
A	infra/envs/example/aws/terraform.tfvars
A	infra/envs/example/aws/variables.tf
A	infra/envs/example/dns-mail/.terraform.lock.hcl
A	infra/envs/example/dns-mail/main.tf
A	infra/envs/example/dns-mail/terraform.tfvars
A	infra/envs/example/dns-mail/variables.tf
A	infra/envs/example/supabase/.terraform.lock.hcl
A	infra/envs/example/supabase/main.tf
A	infra/envs/example/supabase/terraform.tfvars
A	infra/envs/example/supabase/variables.tf
A	infra/envs/scratch/supabase/.terraform.lock.hcl
A	infra/envs/scratch/supabase/main.tf
A	infra/envs/scratch/supabase/terraform.tfvars
A	infra/envs/scratch/supabase/variables.tf
A	infra/envs/staging/aws/.terraform.lock.hcl
A	infra/envs/staging/aws/main.tf
A	infra/envs/staging/aws/terraform.tfvars
A	infra/envs/staging/aws/variables.tf
A	infra/envs/staging/dns-mail/.terraform.lock.hcl
A	infra/envs/staging/dns-mail/DELEGATION.md
A	infra/envs/staging/dns-mail/README.md
A	infra/envs/staging/dns-mail/main.tf
A	infra/envs/staging/dns-mail/terraform.tfvars
A	infra/envs/staging/dns-mail/variables.tf
A	infra/envs/staging/supabase/.terraform.lock.hcl
A	infra/envs/staging/supabase/README.md
A	infra/envs/staging/supabase/main.tf
A	infra/envs/staging/supabase/terraform.tfvars
A	infra/envs/staging/supabase/variables.tf
A	infra/local/check-proxy-topology.sh
A	infra/local/docker-compose.proxy.yml
A	infra/local/nginx.conf
A	infra/modules/budget/main.tf
A	infra/modules/budget/outputs.tf
A	infra/modules/budget/variables.tf
A	infra/modules/dns-zone/main.tf
A	infra/modules/dns-zone/outputs.tf
A	infra/modules/dns-zone/variables.tf
A	infra/modules/github-oidc/main.tf
A	infra/modules/github-oidc/outputs.tf
A	infra/modules/github-oidc/policies.tf
A	infra/modules/github-oidc/variables.tf
A	infra/modules/mail-ses/main.tf
A	infra/modules/mail-ses/outputs.tf
A	infra/modules/mail-ses/smtp.tf
A	infra/modules/mail-ses/variables.tf
A	infra/modules/registry/README.md
A	infra/modules/registry/main.tf
A	infra/modules/registry/outputs.tf
A	infra/modules/registry/variables.tf
A	infra/modules/state-bucket/main.tf
A	infra/modules/state-bucket/outputs.tf
A	infra/modules/state-bucket/variables.tf
A	infra/modules/supabase/hosted-settings.json
A	infra/modules/supabase/main.tf
A	infra/modules/supabase/outputs.tf
A	infra/modules/supabase/settings.tf
A	infra/modules/supabase/variables.tf
A	infra/scripts/account-inventory.sh
A	infra/scripts/bootstrap.sql
A	infra/scripts/check-drift.sh
A	infra/scripts/check-seed.sql
A	infra/scripts/check-settings-types.sh
M	package.json
A	packages/README.md
M	packages/app-shared/.gitignore
M	packages/app-shared/README.md
M	packages/app-shared/package.json
M	packages/app-shared/src/data/customData.type.ts
M	packages/app-shared/src/data/extendedData.type.ts
A	packages/app-shared/src/data/getLocalized.test.ts
A	packages/app-shared/src/data/getLocalized.ts
M	packages/app-shared/src/data/isEmoji.ts
M	packages/app-shared/src/data/isImage.ts
M	packages/app-shared/src/data/isLocalized.ts
A	packages/app-shared/src/data/schemas/index.ts
A	packages/app-shared/src/data/schemas/sendEmailResult.schema.test.ts
A	packages/app-shared/src/data/schemas/sendEmailResult.schema.ts
A	packages/app-shared/src/data/schemas/storedAnswers.schema.test.ts
A	packages/app-shared/src/data/schemas/storedAnswers.schema.ts
A	packages/app-shared/src/data/schemas/storedCustomization.schema.test.ts
A	packages/app-shared/src/data/schemas/storedCustomization.schema.ts
A	packages/app-shared/src/data/schemas/storedImage.schema.test.ts
A	packages/app-shared/src/data/schemas/storedImage.schema.ts
A	packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
A	packages/app-shared/src/data/schemas/storedSettings.schema.ts
M	packages/app-shared/src/index.ts
A	packages/app-shared/src/logging/logger.test.ts
A	packages/app-shared/src/logging/logger.ts
A	packages/app-shared/src/logging/logger.type.ts
M	packages/app-shared/src/settings/README.md
A	packages/app-shared/src/settings/contestantAppConfig.test.ts
A	packages/app-shared/src/settings/contestantAppConfig.ts
M	packages/app-shared/src/settings/dynamicSettings.ts
M	packages/app-shared/src/settings/dynamicSettings.type.ts
M	packages/app-shared/src/settings/staticSettings.ts
M	packages/app-shared/src/settings/staticSettings.type.ts
A	packages/app-shared/src/utils/mergeSettings.test.ts
A	packages/app-shared/src/utils/mergeSettings.ts
D	packages/app-shared/src/utils/passwordValidation.test.ts
D	packages/app-shared/src/utils/passwordValidation.ts
D	packages/app-shared/tsconfig.cjs.json
D	packages/app-shared/tsconfig.esm.json
M	packages/app-shared/tsconfig.json
D	packages/app-shared/tsconfig.tsbuildinfo
A	packages/app-shared/tsup.config.ts
M	packages/app-shared/vitest.config.ts
M	packages/argument-condensation/.gitignore
M	packages/argument-condensation/README.md
M	packages/argument-condensation/package.json
M	packages/argument-condensation/src/api.ts
M	packages/argument-condensation/src/core/condensation/condenser.ts
M	packages/argument-condensation/src/core/condensation/responseValidators/index.ts
M	packages/argument-condensation/src/core/condensation/responseValidators/responseWithArguments.ts
M	packages/argument-condensation/src/core/condensation/runner.ts
M	packages/argument-condensation/src/core/types/api/apiConfig.ts
M	packages/argument-condensation/src/core/types/api/commentGroup.ts
M	packages/argument-condensation/src/core/types/condensation/condensationInput.ts
M	packages/argument-condensation/src/core/types/condensation/condensationResult.ts
M	packages/argument-condensation/src/core/types/condensation/condensationType.ts
M	packages/argument-condensation/src/core/types/condensation/processDefinition.ts
M	packages/argument-condensation/src/core/types/condensation/processParams.ts
M	packages/argument-condensation/src/core/types/condensation/processStepResult.ts
M	packages/argument-condensation/src/core/types/llm/promptInstance.ts
M	packages/argument-condensation/src/core/types/llm/responseWithArguments.ts
M	packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts
M	packages/argument-condensation/src/core/utils/condensation/defineCondensationSteps.ts
M	packages/argument-condensation/src/core/utils/condensation/getAndSliceComments.ts
M	packages/argument-condensation/src/core/utils/condensation/getParallelFactor.ts
M	packages/argument-condensation/src/core/utils/condensation/normalizeArgumentLists.ts
M	packages/argument-condensation/src/core/utils/condensation/planValidation.ts
M	packages/argument-condensation/src/core/utils/condensation/validateInputTokenCount.ts
M	packages/argument-condensation/src/core/utils/index.ts
M	packages/argument-condensation/src/defaultValues.ts
M	packages/argument-condensation/src/prompts.ts
M	packages/argument-condensation/src/question-handlers.ts
M	packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
M	packages/argument-condensation/tests/condensation/condenserIntegration.test.ts
M	packages/argument-condensation/tests/condensation/condenserStandalone.test.ts
M	packages/argument-condensation/tests/unit/handleQuestion.test.ts
M	packages/argument-condensation/tests/unit/planValidation.test.ts
M	packages/argument-condensation/tsconfig.json
A	packages/argument-condensation/tsup.config.ts
M	packages/argument-condensation/vitest.config.ts
M	packages/core/.gitignore
A	packages/core/LICENSE
M	packages/core/README.md
M	packages/core/package.json
M	packages/core/src/controller/controller.ts
M	packages/core/src/entity/entity.type.ts
M	packages/core/src/pipelines/metrics.type.ts
M	packages/core/tsconfig.json
A	packages/core/tsup.config.ts
M	packages/core/vitest.config.ts
M	packages/data/.gitignore
A	packages/data/LICENSE
M	packages/data/README.md
M	packages/data/examples/example.ts
M	packages/data/package.json
M	packages/data/src/core/collection.type.ts
M	packages/data/src/core/dataAccessor.type.ts
M	packages/data/src/core/dataObject.type.ts
M	packages/data/src/index.ts
M	packages/data/src/internal.ts
M	packages/data/src/objects/election/election.test.ts
M	packages/data/src/objects/election/election.ts
M	packages/data/src/objects/election/election.type.ts
A	packages/data/src/objects/election/nominationShape.test.ts
A	packages/data/src/objects/election/nominationShape.ts
M	packages/data/src/objects/entities/variants/variants.ts
M	packages/data/src/objects/nominations/base/nomination.test.ts
M	packages/data/src/objects/nominations/base/nomination.ts
M	packages/data/src/objects/nominations/base/nomination.type.ts
M	packages/data/src/objects/nominations/variants/allianceNomination.test.ts
M	packages/data/src/objects/nominations/variants/allianceNomination.ts
M	packages/data/src/objects/nominations/variants/allianceNomination.type.ts
M	packages/data/src/objects/nominations/variants/candidateNomination.type.ts
M	packages/data/src/objects/nominations/variants/factionNomination.type.ts
M	packages/data/src/objects/nominations/variants/organizationNomination.type.ts
M	packages/data/src/objects/nominations/variants/variants.test.ts
M	packages/data/src/objects/nominations/variants/variants.ts
M	packages/data/src/objects/questions/base/choiceQuestion.ts
M	packages/data/src/objects/questions/base/choiceQuestion.type.ts
M	packages/data/src/objects/questions/base/multipleChoiceQuestion.ts
M	packages/data/src/objects/questions/base/multipleChoiceQuestion.type.ts
M	packages/data/src/objects/questions/base/question.ts
M	packages/data/src/objects/questions/base/question.type.ts
M	packages/data/src/objects/questions/category/questionCategory.test.ts
M	packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts
M	packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts
M	packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts
M	packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.ts
M	packages/data/src/objects/questions/variants/variants.ts
M	packages/data/src/root/dataRoot.test.ts
M	packages/data/src/root/dataRoot.ts
M	packages/data/src/root/dataRoot.type.ts
M	packages/data/src/utils/createDeterministicId.ts
M	packages/data/src/utils/formatAnswer.ts
M	packages/data/src/utils/typeGuards.test.ts
M	packages/data/src/utils/typeGuards.ts
M	packages/data/tsconfig.json
A	packages/data/tsup.config.ts
M	packages/data/vitest.config.ts
A	packages/dev-seed/README.md
A	packages/dev-seed/package.json
A	packages/dev-seed/scripts/download-portraits.ts
A	packages/dev-seed/src/assertKnownRowProps.ts
A	packages/dev-seed/src/assets/portraits/LICENSE.md
A	packages/dev-seed/src/assets/portraits/portrait-01.jpg
A	packages/dev-seed/src/assets/portraits/portrait-02.jpg
A	packages/dev-seed/src/assets/portraits/portrait-03.jpg
A	packages/dev-seed/src/assets/portraits/portrait-04.jpg
A	packages/dev-seed/src/assets/portraits/portrait-05.jpg
A	packages/dev-seed/src/assets/portraits/portrait-06.jpg
A	packages/dev-seed/src/assets/portraits/portrait-07.jpg
A	packages/dev-seed/src/assets/portraits/portrait-08.jpg
A	packages/dev-seed/src/assets/portraits/portrait-09.jpg
A	packages/dev-seed/src/assets/portraits/portrait-10.jpg
A	packages/dev-seed/src/assets/portraits/portrait-11.jpg
A	packages/dev-seed/src/assets/portraits/portrait-12.jpg
A	packages/dev-seed/src/assets/portraits/portrait-13.jpg
A	packages/dev-seed/src/assets/portraits/portrait-14.jpg
A	packages/dev-seed/src/assets/portraits/portrait-15.jpg
A	packages/dev-seed/src/assets/portraits/portrait-16.jpg
A	packages/dev-seed/src/assets/portraits/portrait-17.jpg
A	packages/dev-seed/src/assets/portraits/portrait-18.jpg
A	packages/dev-seed/src/assets/portraits/portrait-19.jpg
A	packages/dev-seed/src/assets/portraits/portrait-20.jpg
A	packages/dev-seed/src/assets/portraits/portrait-21.jpg
A	packages/dev-seed/src/assets/portraits/portrait-22.jpg
A	packages/dev-seed/src/assets/portraits/portrait-23.jpg
A	packages/dev-seed/src/assets/portraits/portrait-24.jpg
A	packages/dev-seed/src/assets/portraits/portrait-25.jpg
A	packages/dev-seed/src/assets/portraits/portrait-26.jpg
A	packages/dev-seed/src/assets/portraits/portrait-27.jpg
A	packages/dev-seed/src/assets/portraits/portrait-28.jpg
A	packages/dev-seed/src/assets/portraits/portrait-29.jpg
A	packages/dev-seed/src/assets/portraits/portrait-30.jpg
A	packages/dev-seed/src/cli/help.ts
A	packages/dev-seed/src/cli/resolve-template.ts
A	packages/dev-seed/src/cli/seed.ts
A	packages/dev-seed/src/cli/summary.ts
A	packages/dev-seed/src/cli/teardown-help.ts
A	packages/dev-seed/src/cli/teardown.ts
A	packages/dev-seed/src/ctx.ts
A	packages/dev-seed/src/emitters/answers.ts
A	packages/dev-seed/src/emitters/latent/centroids.ts
A	packages/dev-seed/src/emitters/latent/dimensions.ts
A	packages/dev-seed/src/emitters/latent/gaussian.ts
A	packages/dev-seed/src/emitters/latent/index.ts
A	packages/dev-seed/src/emitters/latent/latentEmitter.ts
A	packages/dev-seed/src/emitters/latent/latentTypes.ts
A	packages/dev-seed/src/emitters/latent/loadings.ts
A	packages/dev-seed/src/emitters/latent/positions.ts
A	packages/dev-seed/src/emitters/latent/project.ts
A	packages/dev-seed/src/emitters/latent/spread.ts
A	packages/dev-seed/src/generators/AccountsGenerator.ts
A	packages/dev-seed/src/generators/AlliancesGenerator.ts
A	packages/dev-seed/src/generators/AppSettingsGenerator.ts
A	packages/dev-seed/src/generators/CandidatesGenerator.ts
A	packages/dev-seed/src/generators/ConstituenciesGenerator.ts
A	packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts
A	packages/dev-seed/src/generators/ElectionsGenerator.ts
A	packages/dev-seed/src/generators/FactionsGenerator.ts
A	packages/dev-seed/src/generators/FeedbackGenerator.ts
A	packages/dev-seed/src/generators/NominationsGenerator.ts
A	packages/dev-seed/src/generators/OrganizationsGenerator.ts
A	packages/dev-seed/src/generators/ProjectsGenerator.ts
A	packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts
A	packages/dev-seed/src/generators/QuestionsGenerator.ts
A	packages/dev-seed/src/index.ts
A	packages/dev-seed/src/localSupabaseUrl.ts
A	packages/dev-seed/src/locales.ts
A	packages/dev-seed/src/pipeline.ts
A	packages/dev-seed/src/resolveAppSettingsExternalIds.ts
A	packages/dev-seed/src/supabaseAdminClient.ts
A	packages/dev-seed/src/template/collectionNames.ts
A	packages/dev-seed/src/template/index.ts
A	packages/dev-seed/src/template/linkSentinels.ts
A	packages/dev-seed/src/template/permittedKeys.ts
A	packages/dev-seed/src/template/schema.ts
A	packages/dev-seed/src/template/types.ts
A	packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
A	packages/dev-seed/src/templates/_helpers/buildMinimal.ts
A	packages/dev-seed/src/templates/_helpers/index.ts
A	packages/dev-seed/src/templates/default.ts
A	packages/dev-seed/src/templates/defaults/alliances-override.ts
A	packages/dev-seed/src/templates/defaults/candidates-override.ts
A	packages/dev-seed/src/templates/defaults/nominations-override.ts
A	packages/dev-seed/src/templates/defaults/questions-override.ts
A	packages/dev-seed/src/templates/e2e/base.ts
A	packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-1e1cg1co.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-answers-locked.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disable-allow-open.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disable-contestant-app.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disable-voter-app.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-header-show-help.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-hide-all-nominations.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-hide-if-missing-answers.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-missing-nominations.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-per-app-notifications.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
A	packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts
A	packages/dev-seed/src/templates/e2e/perm/shared.ts
A	packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts
A	packages/dev-seed/src/templates/index.ts
A	packages/dev-seed/src/types.ts
A	packages/dev-seed/src/writer.ts
A	packages/dev-seed/tests/analyticsEnvTemplates.test.ts
A	packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts
A	packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts
A	packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
A	packages/dev-seed/tests/assertKnownRowProps.test.ts
A	packages/dev-seed/tests/assets.test.ts
A	packages/dev-seed/tests/auditBaselineShape.test.ts
A	packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
A	packages/dev-seed/tests/ciSecretScanFlags.test.ts
A	packages/dev-seed/tests/ciTypecheckGate.test.ts
A	packages/dev-seed/tests/cli/allowedTeardownTables.test.ts
A	packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs
A	packages/dev-seed/tests/cli/help.test.ts
A	packages/dev-seed/tests/cli/localityGuard.test.ts
A	packages/dev-seed/tests/cli/resolve-template.test.ts
A	packages/dev-seed/tests/cli/summary.test.ts
A	packages/dev-seed/tests/cli/teardown.test.ts
A	packages/dev-seed/tests/deploymentChecksWiring.test.ts
A	packages/dev-seed/tests/deploymentTemplates.test.ts
A	packages/dev-seed/tests/determinism.test.ts
A	packages/dev-seed/tests/e2eDocPreconditionGate.test.ts
A	packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts
A	packages/dev-seed/tests/edgeFunctionEnvGate.test.ts
A	packages/dev-seed/tests/emitters/answers.test.ts
A	packages/dev-seed/tests/ensureProject.test.ts
A	packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
A	packages/dev-seed/tests/fixtures/negctl-nominations-entity-type-camel.ts
A	packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts
A	packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
A	packages/dev-seed/tests/generators/AccountsGenerator.test.ts
A	packages/dev-seed/tests/generators/AlliancesGenerator.test.ts
A	packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts
A	packages/dev-seed/tests/generators/CandidatesGenerator.test.ts
A	packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts
A	packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts
A	packages/dev-seed/tests/generators/ElectionsGenerator.test.ts
A	packages/dev-seed/tests/generators/FactionsGenerator.test.ts
A	packages/dev-seed/tests/generators/FeedbackGenerator.test.ts
A	packages/dev-seed/tests/generators/NominationsGenerator.test.ts
A	packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts
A	packages/dev-seed/tests/generators/ProjectsGenerator.test.ts
A	packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts
A	packages/dev-seed/tests/generators/QuestionsGenerator.test.ts
A	packages/dev-seed/tests/hostedSettingsParityGate.test.ts
A	packages/dev-seed/tests/infraValidateJobGate.test.ts
A	packages/dev-seed/tests/integration/default-template.integration.test.ts
A	packages/dev-seed/tests/latent/centroids.test.ts
A	packages/dev-seed/tests/latent/clustering.integration.test.ts
A	packages/dev-seed/tests/latent/dimensions.test.ts
A	packages/dev-seed/tests/latent/gaussian.test.ts
A	packages/dev-seed/tests/latent/latentEmitter.test.ts
A	packages/dev-seed/tests/latent/loadings.test.ts
A	packages/dev-seed/tests/latent/positions.test.ts
A	packages/dev-seed/tests/latent/project.test.ts
A	packages/dev-seed/tests/latent/spread.test.ts
A	packages/dev-seed/tests/localSupabaseUrl.test.ts
A	packages/dev-seed/tests/locales.test.ts
A	packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts
A	packages/dev-seed/tests/nodeEngineGate.test.ts
A	packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts
A	packages/dev-seed/tests/pipeline.test.ts
A	packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts
A	packages/dev-seed/tests/projectScopingGate.test.ts
A	packages/dev-seed/tests/registrationModeMatrixParity.test.ts
A	packages/dev-seed/tests/resolveAppSettingsExternalIds.test.ts
A	packages/dev-seed/tests/rpcNullabilityGate.test.ts
A	packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts
A	packages/dev-seed/tests/serviceRoleClientCallSites.test.ts
A	packages/dev-seed/tests/supabaseAdminClient.invitations.test.ts
A	packages/dev-seed/tests/supabaseAdminClient.test.ts
A	packages/dev-seed/tests/template.test.ts
A	packages/dev-seed/tests/template/latent.schema.test.ts
A	packages/dev-seed/tests/template/linkSentinelRules.type-test.ts
A	packages/dev-seed/tests/template/linkSentinels.test.ts
A	packages/dev-seed/tests/template/permittedKeys.test.ts
A	packages/dev-seed/tests/template/strictRowTypes.type-test.ts
A	packages/dev-seed/tests/templates/base-app-settings.test.ts
A	packages/dev-seed/tests/templates/base.test.ts
A	packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
A	packages/dev-seed/tests/templates/default.test.ts
A	packages/dev-seed/tests/templates/nominations-override.test.ts
A	packages/dev-seed/tests/turboBuildInputsGate.test.ts
A	packages/dev-seed/tests/utils.ts
A	packages/dev-seed/tests/writer.test.ts
A	packages/dev-seed/tsconfig.json
A	packages/dev-seed/vitest.config.ts
A	packages/dev-tools/package.json
A	packages/dev-tools/src/keygen.ts
A	packages/dev-tools/src/pem-to-jwk.ts
A	packages/dev-tools/tsconfig.json
M	packages/filters/.gitignore
A	packages/filters/LICENSE
M	packages/filters/README.md
M	packages/filters/package.json
M	packages/filters/src/filter/base/filter.type.ts
M	packages/filters/src/filter/enumerated/enumeratedFilter.ts
M	packages/filters/tests/filter.test.ts
M	packages/filters/tsconfig.json
A	packages/filters/tsup.config.ts
M	packages/filters/vitest.config.ts
M	packages/llm/.gitignore
M	packages/llm/README.md
M	packages/llm/package.json
M	packages/llm/src/index.ts
M	packages/llm/src/llm-providers/llmProvider.ts
M	packages/llm/src/llm-providers/provider.types.ts
M	packages/llm/src/prompts/index.ts
M	packages/llm/src/prompts/localizationInstructions.ts
M	packages/llm/src/prompts/promptRegistry.ts
M	packages/llm/src/prompts/types.ts
M	packages/llm/src/types/llmPipelineResult.ts
M	packages/llm/src/utils/costCalculation.ts
M	packages/llm/src/utils/costCalculation.type.ts
M	packages/llm/src/utils/parseRateLimitError.ts
M	packages/llm/src/utils/prompting/setPromptVars.ts
M	packages/llm/tests/llmProvider.test.ts
M	packages/llm/tsconfig.json
A	packages/llm/tsup.config.ts
M	packages/llm/vitest.config.ts
M	packages/matching/.gitignore
A	packages/matching/LICENSE
M	packages/matching/README.md
M	packages/matching/package.json
M	packages/matching/src/distance/metric.ts
M	packages/matching/src/index.ts
M	packages/matching/src/match/match.ts
M	packages/matching/src/question/categoricalQuestion.ts
M	packages/matching/tests/space.test.ts
M	packages/matching/tsconfig.json
A	packages/matching/tsup.config.ts
M	packages/matching/vitest.config.ts
M	packages/question-info/.gitignore
M	packages/question-info/package.json
M	packages/question-info/src/core/infoGeneration.ts
M	packages/question-info/src/core/infoGeneration.type.ts
M	packages/question-info/src/prompts.ts
M	packages/question-info/src/prompts/en/consts.ts
M	packages/question-info/src/prompts/en/generateBoth.yaml
M	packages/question-info/src/prompts/en/generateInfoSections.yaml
M	packages/question-info/src/prompts/en/generateTerms.yaml
M	packages/question-info/tests/api.test.ts
M	packages/question-info/tests/questionTypes.test.ts
M	packages/question-info/tsconfig.json
A	packages/question-info/tsup.config.ts
M	packages/question-info/vitest.config.ts
M	packages/shared-config/README.md
M	packages/shared-config/eslint.config.mjs
M	packages/shared-config/package.json
M	packages/shared-config/prettier.config.mjs
M	packages/shared-config/tsconfig.base.json
A	packages/supabase-types/RPC-NULLABILITY.md
A	packages/supabase-types/package.json
A	packages/supabase-types/src/column-map.ts
A	packages/supabase-types/src/database.merged.ts
A	packages/supabase-types/src/database.overrides.ts
A	packages/supabase-types/src/database.ts
A	packages/supabase-types/src/index.ts
A	packages/supabase-types/tsconfig.json
M	render.example.yaml
A	scripts/assert-a11y-scan-wiring.mjs
A	scripts/assert-adapter-casts.mjs
A	scripts/assert-auth-signup-closed.mjs
A	scripts/assert-comment-hygiene.mjs
A	scripts/assert-cookie-names.mjs
A	scripts/assert-declared-binaries.mjs
A	scripts/assert-dependency-audit.mjs
A	scripts/assert-edge-env-defaults.mjs
A	scripts/assert-edge-function-env.mjs
A	scripts/assert-env-pair-registry.mjs
A	scripts/assert-env-pairs-agree.mjs
A	scripts/assert-grant-permission-enum.mjs
A	scripts/assert-hosted-settings-parity.mjs
A	scripts/assert-i18n-catalog-namespaces.mjs
A	scripts/assert-no-candidate-app-names.mjs
A	scripts/assert-no-inline-iam-policies.mjs
A	scripts/assert-no-session-in-loads.mjs
A	scripts/assert-node-engine.mjs
A	scripts/assert-project-scoped-queries.mjs
A	scripts/assert-rpc-return-nullability.mjs
A	scripts/assert-schema-migration-parity.mjs
A	scripts/assert-unit-test-coverage.mjs
A	scripts/fixtures/assert-comment-hygiene.expected.mjs.violations
A	scripts/fixtures/assert-comment-hygiene.expected.sh.violations
A	scripts/fixtures/assert-comment-hygiene.expected.sql.violations
A	scripts/fixtures/assert-comment-hygiene.expected.svelte.violations
A	scripts/fixtures/assert-comment-hygiene.expected.ts.violations
A	scripts/fixtures/assert-comment-hygiene.expected.yaml.violations
A	scripts/fixtures/assert-comment-hygiene.input.mjs
A	scripts/fixtures/assert-comment-hygiene.input.sh
A	scripts/fixtures/assert-comment-hygiene.input.sql
A	scripts/fixtures/assert-comment-hygiene.input.svelte
A	scripts/fixtures/assert-comment-hygiene.input.ts
A	scripts/fixtures/assert-comment-hygiene.input.yaml
A	scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations
A	scripts/fixtures/assert-no-candidate-app-names.input.ts
A	scripts/fixtures/assert-no-session-in-loads.expected.ts.violations
A	scripts/fixtures/assert-no-session-in-loads.input.ts
A	scripts/fixtures/grant-permission-enum/enums.ok.sql
A	scripts/fixtures/grant-permission-enum/enums.violations.sql
A	scripts/fixtures/grant-permission-enum/expected.violations
A	scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json
A	scripts/fixtures/no-inline-iam-policies/expected.violations
A	scripts/fixtures/no-inline-iam-policies/ok/main.tf
A	scripts/fixtures/no-inline-iam-policies/violations/extra.tf.json
A	scripts/fixtures/no-inline-iam-policies/violations/main.tf
A	scripts/fixtures/project-scoped-queries/clean.fixture.ts
A	scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
A	scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
A	scripts/fixtures/project-scoped-queries/violation.fixture.ts
A	scripts/fixtures/schema-migration-freeze/bad-baseline-commit/expected.violations
A	scripts/fixtures/schema-migration-freeze/bad-baseline-commit/manifest.json
A	scripts/fixtures/schema-migration-freeze/bad-baseline-commit/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/bad-name/expected.violations
A	scripts/fixtures/schema-migration-freeze/bad-name/manifest.json
A	scripts/fixtures/schema-migration-freeze/bad-name/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/bad-name/migrations/20261012120000_add_note.sql
A	scripts/fixtures/schema-migration-freeze/baseline-not-first/expected.violations
A	scripts/fixtures/schema-migration-freeze/baseline-not-first/manifest.json
A	scripts/fixtures/schema-migration-freeze/baseline-not-first/migrations/00001_other.sql
A	scripts/fixtures/schema-migration-freeze/baseline-without-table/expected.violations
A	scripts/fixtures/schema-migration-freeze/baseline-without-table/manifest.json
A	scripts/fixtures/schema-migration-freeze/baseline-without-table/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/duplicate-version/expected.violations
A	scripts/fixtures/schema-migration-freeze/duplicate-version/manifest.json
A	scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00002_a.sql
A	scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00002_b.sql
A	scripts/fixtures/schema-migration-freeze/edited-file/expected.violations
A	scripts/fixtures/schema-migration-freeze/edited-file/manifest.json
A	scripts/fixtures/schema-migration-freeze/edited-file/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/edited-file/migrations/00002_add_note.sql
A	scripts/fixtures/schema-migration-freeze/empty-baseline/expected.violations
A	scripts/fixtures/schema-migration-freeze/empty-baseline/manifest.json
R100	backend/vaa-strapi/database/migrations/.gitkeep	scripts/fixtures/schema-migration-freeze/empty-baseline/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/empty-migrations/expected.violations
A	scripts/fixtures/schema-migration-freeze/empty-migrations/manifest.json
A	scripts/fixtures/schema-migration-freeze/empty-migrations/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/malformed-manifest/expected.violations
A	scripts/fixtures/schema-migration-freeze/malformed-manifest/manifest.json
A	scripts/fixtures/schema-migration-freeze/malformed-manifest/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/missing-baseline-member/expected.violations
A	scripts/fixtures/schema-migration-freeze/missing-baseline-member/manifest.json
A	scripts/fixtures/schema-migration-freeze/missing-baseline-member/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/missing-file/expected.violations
A	scripts/fixtures/schema-migration-freeze/missing-file/manifest.json
A	scripts/fixtures/schema-migration-freeze/missing-file/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/missing-manifest/expected.violations
A	scripts/fixtures/schema-migration-freeze/missing-manifest/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/non-increasing-version/expected.violations
A	scripts/fixtures/schema-migration-freeze/non-increasing-version/manifest.json
A	scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00002_b.sql
A	scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00003_a.sql
R100	backend/vaa-strapi/public/uploads/.gitkeep	scripts/fixtures/schema-migration-freeze/ok/expected.violations
A	scripts/fixtures/schema-migration-freeze/ok/manifest.json
A	scripts/fixtures/schema-migration-freeze/ok/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/ok/migrations/00002_add_note.sql
A	scripts/fixtures/schema-migration-freeze/unlisted-file/expected.violations
A	scripts/fixtures/schema-migration-freeze/unlisted-file/manifest.json
A	scripts/fixtures/schema-migration-freeze/unlisted-file/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/unlisted-file/migrations/00002_add_note.sql
A	scripts/fixtures/schema-migration-freeze/version-gap/expected.violations
A	scripts/fixtures/schema-migration-freeze/version-gap/manifest.json
A	scripts/fixtures/schema-migration-freeze/version-gap/migrations/00001_initial_schema.sql
A	scripts/fixtures/schema-migration-freeze/version-gap/migrations/00003_add_note.sql
A	scripts/lib/audit-run.mjs
A	scripts/lib/comment-spans.mjs
A	security/audit-baseline.json
A	tests/IDURA-TEST-RUNBOOK.md
M	tests/README.md
M	tests/eslint.config.mjs
A	tests/global-setup.ts
M	tests/playwright.config.ts
A	tests/scripts/ci-write-local-keys.sh
A	tests/scripts/determinism-batch.sh
A	tests/scripts/e2e-evidence.mjs
A	tests/scripts/e2e-run.sh
A	tests/scripts/e2e-spec-verdict.mjs
A	tests/scripts/tcp-forward.mjs
A	tests/scripts/visual-container.sh
A	tests/scripts/withhold-stack-keys.mjs
A	tests/seed-test-data.ts
D	tests/tests/candidate-import.csv
D	tests/tests/candidateApp-advanced.spec.ts
D	tests/tests/candidateApp-basics.spec.ts
A	tests/tests/data/assets/test-captions.vtt
A	tests/tests/data/assets/test-poster.jpg
A	tests/tests/data/assets/test-video.mp4
A	tests/tests/data/assets/test-video.webm
A	tests/tests/data/test-not-an-image.txt
A	tests/tests/fixtures/admin/adminLoginPage.fixture.ts
A	tests/tests/fixtures/contestant/contestant-bank-auth-journey.ts
A	tests/tests/fixtures/contestant/contestant-entity-selection.ts
A	tests/tests/fixtures/contestant/contestant-journey.ts
A	tests/tests/fixtures/contestant/contestant-registration.ts
A	tests/tests/fixtures/contestant/contestant-terms-gate-phone.ts
A	tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
A	tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
A	tests/tests/fixtures/contestant/contestantEntitySelectionPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantForgotPasswordPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
A	tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts
A	tests/tests/fixtures/contestant/contestantNoQuestionsPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
A	tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantPasswordResetPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantPasswordSetter.fixture.ts
A	tests/tests/fixtures/contestant/contestantPreregisterPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantPrivacyPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
A	tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
A	tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
A	tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
A	tests/tests/fixtures/contestant/invitation-landing.ts
A	tests/tests/fixtures/contestant/notEditableNote.fixture.ts
A	tests/tests/fixtures/contestant/perm-contestant-nominations.ts
A	tests/tests/fixtures/contestant/perm-l10n.ts
A	tests/tests/fixtures/contestant/perm-no-nomination.ts
A	tests/tests/fixtures/contestant/perm-organization-editing.ts
A	tests/tests/fixtures/contestant/perm-startfromcg.ts
A	tests/tests/fixtures/shared/deviceStores.fixture.ts
A	tests/tests/fixtures/shared/emailBucket.fixture.ts
A	tests/tests/fixtures/shared/feedbackDialog.fixture.ts
A	tests/tests/fixtures/shared/forensicCapture.fixture.ts
A	tests/tests/fixtures/shared/invitationFlow.fixture.ts
A	tests/tests/fixtures/shared/langSelectorFixture.fixture.ts
A	tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
A	tests/tests/fixtures/shared/navMenu.fixture.ts
A	tests/tests/fixtures/shared/pageGeometry.fixture.ts
A	tests/tests/fixtures/shared/popupNotice.fixture.ts
A	tests/tests/fixtures/shared/relayCapture.fixture.ts
A	tests/tests/fixtures/shared/relayProxy.fixture.ts
A	tests/tests/fixtures/shared/requestOrigins.fixture.ts
A	tests/tests/fixtures/shared/screenShape.fixture.ts
A	tests/tests/fixtures/shared/theme.fixture.ts
A	tests/tests/fixtures/shared/video.fixture.ts
A	tests/tests/fixtures/voter/aboutPage.fixture.ts
A	tests/tests/fixtures/voter/entityDetails.fixture.ts
A	tests/tests/fixtures/voter/entityFilters.fixture.ts
A	tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts
A	tests/tests/fixtures/voter/organizationDetail.fixture.ts
A	tests/tests/fixtures/voter/questionInfo.fixture.ts
A	tests/tests/fixtures/voter/resultsPage.fixture.ts
A	tests/tests/fixtures/voter/viewTransitionLog.fixture.ts
A	tests/tests/fixtures/voter/views.ts
A	tests/tests/fixtures/voter/voter-journey.fixture.ts
A	tests/tests/fixtures/voter/voterHomePage.fixture.ts
A	tests/tests/fixtures/voter/voterIntroPage.fixture.ts
A	tests/tests/fixtures/voter/voterNavFixture.fixture.ts
A	tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
D	tests/tests/global-setup.ts
A	tests/tests/helpers/README.md
A	tests/tests/helpers/index.ts
A	tests/tests/helpers/navigation.ts
A	tests/tests/helpers/select.ts
A	tests/tests/helpers/settle.ts
A	tests/tests/helpers/timeouts.ts
R100	backend/vaa-strapi/src/api/.gitkeep	tests/tests/setup/.gitkeep
A	tests/tests/setup/admin/admin-access.teardown.ts
A	tests/tests/setup/admin/admin-auth.setup.ts
A	tests/tests/setup/contestant/bank-auth-journey.setup.ts
A	tests/tests/setup/contestant/bank-auth-journey.teardown.ts
A	tests/tests/setup/contestant/contestant-journey.setup.ts
A	tests/tests/setup/contestant/contestant-journey.teardown.ts
A	tests/tests/setup/contestant/entity-selection.setup.ts
A	tests/tests/setup/contestant/entity-selection.teardown.ts
A	tests/tests/setup/contestant/passwordless-session.setup.ts
A	tests/tests/setup/contestant/passwordless-session.teardown.ts
A	tests/tests/setup/perm/perm-1e1cg1co.setup.ts
A	tests/tests/setup/perm/perm-1e1cg1co.teardown.ts
A	tests/tests/setup/perm/perm-2e-asymmetric.setup.ts
A	tests/tests/setup/perm/perm-2e-asymmetric.teardown.ts
A	tests/tests/setup/perm/perm-2e-shared.setup.ts
A	tests/tests/setup/perm/perm-2e-shared.teardown.ts
A	tests/tests/setup/perm/perm-access-disable.setup.ts
A	tests/tests/setup/perm/perm-access-disable.teardown.ts
A	tests/tests/setup/perm/perm-analytics-tracking.setup.ts
A	tests/tests/setup/perm/perm-analytics-tracking.teardown.ts
A	tests/tests/setup/perm/perm-answers-locked.setup.ts
A	tests/tests/setup/perm/perm-answers-locked.teardown.ts
A	tests/tests/setup/perm/perm-closed-project.setup.ts
A	tests/tests/setup/perm/perm-closed-project.teardown.ts
A	tests/tests/setup/perm/perm-contestant-nominations.setup.ts
A	tests/tests/setup/perm/perm-contestant-nominations.teardown.ts
A	tests/tests/setup/perm/perm-disable-allow-open.setup.ts
A	tests/tests/setup/perm/perm-disable-allow-open.teardown.ts
A	tests/tests/setup/perm/perm-disable-election-1co.setup.ts
A	tests/tests/setup/perm/perm-disable-election-1co.teardown.ts
A	tests/tests/setup/perm/perm-disable-election-2co.setup.ts
A	tests/tests/setup/perm/perm-disable-election-2co.teardown.ts
A	tests/tests/setup/perm/perm-disjoint-1co.setup.ts
A	tests/tests/setup/perm/perm-disjoint-1co.teardown.ts
A	tests/tests/setup/perm/perm-header-show-help.setup.ts
A	tests/tests/setup/perm/perm-header-show-help.teardown.ts
A	tests/tests/setup/perm/perm-hide-all-nominations.setup.ts
A	tests/tests/setup/perm/perm-hide-all-nominations.teardown.ts
A	tests/tests/setup/perm/perm-hide-category-tags.setup.ts
A	tests/tests/setup/perm/perm-hide-category-tags.teardown.ts
A	tests/tests/setup/perm/perm-hide-election-tags.setup.ts
A	tests/tests/setup/perm/perm-hide-election-tags.teardown.ts
A	tests/tests/setup/perm/perm-hide-hero.setup.ts
A	tests/tests/setup/perm/perm-hide-hero.teardown.ts
A	tests/tests/setup/perm/perm-hide-if-missing-answers.setup.ts
A	tests/tests/setup/perm/perm-hide-if-missing-answers.teardown.ts
A	tests/tests/setup/perm/perm-interactive-info.setup.ts
A	tests/tests/setup/perm/perm-interactive-info.teardown.ts
A	tests/tests/setup/perm/perm-localisation-positive.setup.ts
A	tests/tests/setup/perm/perm-localisation-positive.teardown.ts
A	tests/tests/setup/perm/perm-missing-nominations.setup.ts
A	tests/tests/setup/perm/perm-missing-nominations.teardown.ts
A	tests/tests/setup/perm/perm-no-nomination.setup.ts
A	tests/tests/setup/perm/perm-no-nomination.teardown.ts
A	tests/tests/setup/perm/perm-not-located-2e2cg.setup.ts
A	tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts
A	tests/tests/setup/perm/perm-org-matching.setup.ts
A	tests/tests/setup/perm/perm-org-matching.teardown.ts
A	tests/tests/setup/perm/perm-organization-editing.setup.ts
A	tests/tests/setup/perm/perm-organization-editing.teardown.ts
A	tests/tests/setup/perm/perm-per-app-notifications.setup.ts
A	tests/tests/setup/perm/perm-per-app-notifications.teardown.ts
A	tests/tests/setup/perm/perm-question-video.setup.ts
A	tests/tests/setup/perm/perm-question-video.teardown.ts
A	tests/tests/setup/perm/perm-show-feedback-survey.setup.ts
A	tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts
A	tests/tests/setup/perm/perm-startfromcg.setup.ts
A	tests/tests/setup/perm/perm-startfromcg.teardown.ts
A	tests/tests/setup/shared/assertTeardown.ts
A	tests/tests/setup/shared/auth.setup.ts
A	tests/tests/setup/shared/base.setup.ts
A	tests/tests/setup/shared/base.teardown.ts
A	tests/tests/setup/shared/registerAndStoreSession.ts
A	tests/tests/setup/shared/setupFromTemplate.ts
R100	backend/vaa-strapi/src/extensions/.gitkeep	tests/tests/setup/voter/.gitkeep
A	tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts
A	tests/tests/specs/a11y/a11y-smoke.spec.ts
A	tests/tests/specs/a11y/contestant-a11y.spec.ts
A	tests/tests/specs/admin/admin-access.spec.ts
A	tests/tests/specs/auth/public-signup-closed.spec.ts
A	tests/tests/specs/contestant/.gitkeep
A	tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts
A	tests/tests/specs/contestant/contestant-bank-auth.spec.ts
A	tests/tests/specs/contestant/contestant-code-registration.spec.ts
A	tests/tests/specs/contestant/contestant-email-registration.spec.ts
A	tests/tests/specs/contestant/contestant-entity-selection.spec.ts
A	tests/tests/specs/contestant/contestant-entry-phone.spec.ts
A	tests/tests/specs/contestant/contestant-entry-scan.spec.ts
A	tests/tests/specs/contestant/contestant-journey.spec.ts
A	tests/tests/specs/contestant/contestant-password-recovery.spec.ts
A	tests/tests/specs/contestant/contestant-terms-gate-phone.spec.ts
A	tests/tests/specs/contestant/contestant-terms-tracking.spec.ts
A	tests/tests/specs/contestant/invitation-contract.spec.ts
A	tests/tests/specs/contestant/invitation-landing.spec.ts
A	tests/tests/specs/perf/performance-budget.spec.ts
A	tests/tests/specs/perm/contestant-nominations.spec.ts
A	tests/tests/specs/perm/perm-1e1cg1co.spec.ts
A	tests/tests/specs/perm/perm-2e-asymmetric.spec.ts
A	tests/tests/specs/perm/perm-2e-shared.spec.ts
A	tests/tests/specs/perm/perm-access-disable.spec.ts
A	tests/tests/specs/perm/perm-answers-locked.spec.ts
A	tests/tests/specs/perm/perm-closed-project.spec.ts
A	tests/tests/specs/perm/perm-disable-allow-open.spec.ts
A	tests/tests/specs/perm/perm-disable-election-1co.spec.ts
A	tests/tests/specs/perm/perm-disable-election-2co.spec.ts
A	tests/tests/specs/perm/perm-disjoint-1co.spec.ts
A	tests/tests/specs/perm/perm-header-show-help.spec.ts
A	tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
A	tests/tests/specs/perm/perm-hide-category-tags.spec.ts
A	tests/tests/specs/perm/perm-hide-election-tags.spec.ts
A	tests/tests/specs/perm/perm-hide-hero.spec.ts
A	tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
A	tests/tests/specs/perm/perm-interactive-info.spec.ts
A	tests/tests/specs/perm/perm-localisation-positive.spec.ts
A	tests/tests/specs/perm/perm-missing-nominations.spec.ts
A	tests/tests/specs/perm/perm-no-nomination.spec.ts
A	tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts
A	tests/tests/specs/perm/perm-org-matching.spec.ts
A	tests/tests/specs/perm/perm-organization-editing.spec.ts
A	tests/tests/specs/perm/perm-per-app-notifications.spec.ts
A	tests/tests/specs/perm/perm-question-video.spec.ts
A	tests/tests/specs/perm/perm-show-feedback-survey.spec.ts
A	tests/tests/specs/perm/perm-startfromcg.spec.ts
A	tests/tests/specs/storage/storage-cleanup.spec.ts
A	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-desktop.png
A	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-mobile.png
A	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png
A	tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png
A	tests/tests/specs/visual/visual-regression.spec.ts
A	tests/tests/specs/voter/.gitkeep
A	tests/tests/specs/voter/analytics-gpc.spec.ts
A	tests/tests/specs/voter/analytics-privacy.spec.ts
A	tests/tests/specs/voter/cold-entry-dataroot.spec.ts
A	tests/tests/specs/voter/eperm07-term-trigger.spec.ts
A	tests/tests/specs/voter/voter-alliance.spec.ts
A	tests/tests/specs/voter/voter-dark-mode.spec.ts
A	tests/tests/specs/voter/voter-journey-mobile.spec.ts
A	tests/tests/specs/voter/voter-journey.spec.ts
A	tests/tests/specs/voter/voter-nominations.spec.ts
A	tests/tests/specs/voter/voter-pageview-only.spec.ts
A	tests/tests/specs/voter/voter-prefs-tracking.spec.ts
A	tests/tests/specs/voter/voter-results-redraw.spec.ts
A	tests/tests/specs/voter/voter-tracking-consent-free.spec.ts
A	tests/tests/support/mock-oidc-cert.pem
A	tests/tests/support/mock-oidc-key.pem
A	tests/tests/support/mockOidcIssuer.ts
A	tests/tests/support/mockOidcIssuerEntry.ts
A	tests/tests/support/preflight.ts
D	tests/tests/test_image_black.png
D	tests/tests/translations.spec.ts
A	tests/tests/utils/accountAccessClient.ts
A	tests/tests/utils/adminCredentials.ts
A	tests/tests/utils/authApi.ts
A	tests/tests/utils/axeScan.ts
A	tests/tests/utils/bankAuthJourneyConstants.ts
A	tests/tests/utils/buildRoute.test.ts
M	tests/tests/utils/buildRoute.ts
A	tests/tests/utils/buildTestIdToken.test.ts
A	tests/tests/utils/buildTestIdToken.ts
A	tests/tests/utils/contestantAxeScan.ts
A	tests/tests/utils/contestantEntityUrl.test.ts
A	tests/tests/utils/contestantEntityUrl.ts
A	tests/tests/utils/contestantJourneyConstants.ts
A	tests/tests/utils/e2eSpecVerdict.test.ts
A	tests/tests/utils/entryAxeScan.ts
A	tests/tests/utils/invitationConstants.test.ts
A	tests/tests/utils/invitationConstants.ts
A	tests/tests/utils/mailedLink.test.ts
A	tests/tests/utils/mailedLink.ts
A	tests/tests/utils/multiChoice.ts
A	tests/tests/utils/permContestantNominationsData.ts
A	tests/tests/utils/permNoNominationData.ts
A	tests/tests/utils/permOrganizationEditingData.ts
A	tests/tests/utils/permStartFromCgData.ts
A	tests/tests/utils/preflight.test.ts
A	tests/tests/utils/privacyAllowlists.test.ts
A	tests/tests/utils/privacyAllowlists.ts
A	tests/tests/utils/rawKeyScan.ts
A	tests/tests/utils/selectElection.ts
A	tests/tests/utils/supabaseAdminClient.ts
A	tests/tests/utils/supabaseAnonKey.ts
A	tests/tests/utils/tcpForward.test.ts
A	tests/tests/utils/testCredentials.ts
A	tests/tests/utils/testIds.ts
A	tests/tests/utils/testKeys.ts
D	tests/tests/utils/translations.ts
A	tests/tests/utils/voterIntro.ts
A	tests/tests/utils/voterNavigation.ts
A	tests/tests/utils/withholdStackKeys.test.ts
A	tests/tsconfig.json
A	tests/vitest.config.ts
A	turbo.json
A	vitest.config.ts
D	vitest.workspace.ts
M	yarn.lock
```

### Files that differ from `origin/main` (red branch)

`git diff --name-status origin/main ci-evidence/183-infra-validate-red` is line for line the same list as above: `infra/` does not exist on `origin/main`, so the two files the red commit changes are added on both branches and appear as the same two lines, with other content:

```
A	infra/envs/example/aws/main.tf
A	infra/envs/example/aws/variables.tf
```

`git diff --name-only ci-evidence/183-infra-validate ci-evidence/183-infra-validate-red` lists exactly those two paths.
