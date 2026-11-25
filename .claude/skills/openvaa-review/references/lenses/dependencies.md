# Lens: Dependencies · ID prefix `DEP`

**Applies when** any `package.json` adds, upgrades or removes a dependency, a Deno import or pin changes, or the Node engine changes. Lockfile churn alone doesn't count.

## List

Each new or upgraded dependency: _package@version_ → _workspace_ → _what it's used for (call sites)_ → _maintainer signal, if known_ → _install scripts?_ (`npm view <pkg> scripts`).

## Evaluate (criterion slugs)

- `dep-necessary`: is it strictly necessary? Check whether the repo already has something that does it (another dependency, a package under `packages/`, a platform API such as `Intl`, `structuredClone` or `crypto.randomUUID`). A dependency used for one small function is usually a finding.
- `dep-vendor`: could the used part be copied in from source (small, stable, permissive licence) to avoid supply-chain exposure? Give the approximate size and the licence. Prefer vendoring for tiny, rarely updated utilities; prefer the dependency for anything security-sensitive or fast-moving.
- `dep-risk`: postinstall scripts, very new or single-maintainer packages, a large transitive tree, or a duplicate major version of an existing dependency. `yarn audit:deps` is clean.
- `dep-placement`: `dependencies` vs `devDependencies`, and root vs workspace.
- `dep-workspace`: an internal dependency uses `workspace:^` and has a matching tsconfig `references` entry.
- `dep-engine-binaries`: the Node 24 floor holds (`yarn assert:node-engine`); every binary a script calls is declared (`yarn assert:declared-binaries`); Deno stays pinned as an npm devDependency of `@openvaa/supabase` (`apps/supabase/package.json`).

## Promote to

`.agents/code-review-checklist.md`; `packages/README.md` (workspace dependencies).
