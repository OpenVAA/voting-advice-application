---
title: "Root `dependenciesMeta` allows install scripts for `supabase`, which has none, so it pre-authorises any script a future release adds"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source: 169-REVIEW.md IN-03; disposition 169-REVIEW-DISPOSITION.md
priority: low
suggested_phase: the next dependency or supply-chain hardening pass (a quick task is enough)
keywords: [yarn, enableScripts, dependenciesMeta, built, supabase-cli, install-scripts, supply-chain]
re_check_trigger: "the next supabase CLI bump; or any edit to the root package.json dependenciesMeta"
---

# An allow-list entry with nothing to allow

The repo runs Yarn with `enableScripts: false`. The root `package.json` `dependenciesMeta` re-enables install scripts
for three packages: `esbuild`, `supabase` and `unrs-resolver`.

`supabase` 2.118.0 has no `preinstall`, `install` or `postinstall` script. It ships the CLI through optional
`@supabase/cli-*` platform packages (169-RESEARCH). So `supabase: { built: true }` allows nothing today. It would
silently allow any install script that a future `supabase` release adds, which defeats `enableScripts: false` for that
package. `esbuild` and `unrs-resolver` do have postinstalls and stay.

## What to do

1. Remove the `supabase` entry from `dependenciesMeta`.
2. Run `yarn install` and confirm `yarn workspace @openvaa/supabase exec supabase --version` still works and that
   `yarn db:start` boots the stack.
3. Re-add the entry only if a later release brings back a script that is actually needed, with the script's content
   reviewed and recorded in the commit message.
