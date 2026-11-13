---
created: 2026-10-07T12:53:29.000Z
title: 170-allowlist-probe.sh reads the auth container's whole environment through docker inspect piped to grep, outside every hygiene scan
area: planning scripts / hygiene
severity: minor
source: Phase 174 (item 25 of 174-01-PLAN.md; 174-03-SUMMARY.md § Threat Flags; filed by 174-10)
files:
  - .planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh
  - .planning/phases/174-invitations-grants-defined-in-advance/174-stack-probe.sh
  - .planning/phases/174-invitations-grants-defined-in-advance/174-verdict.mjs
---

## Problem

Phase 174's rule for its own scripts (PROH-174-29) is that a container variable is read one name at a time, with `docker exec <container> printenv <NAME>`, and that no command lists a container's whole environment. `174-verdict.mjs hygiene` checks the phase's scripts and plan actions for the forbidden forms.

Every closing gate of the phase also runs a script that is not this phase's and is not scanned: `170-allowlist-probe.sh` reads the redirect allowlist with

`docker inspect supabase_auth_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^GOTRUE_URI_ALLOW_LIST='`

The pipe prints one line, the allowlist, which holds no secret. But the left side of the pipe is the container's entire environment, which is where the auth service's secrets are, inside a command substitution; a change to the filter, a `set -x`, or a failing `grep` under some shells' error reporting would put it on the terminal or in an evidence file. It is the form the rule exists to forbid, used by a script that every later phase copies its closing step from.

## Solution

- Replace the line with `docker exec supabase_auth_openvaa-local printenv GOTRUE_URI_ALLOW_LIST`, as `174-stack-probe.sh` reads its variables. Do it in the probe the next phase writes; the finished phases' scripts are a record and stay as they are.
- Give the next phase's hygiene verdict the directories of the scripts it calls, not only its own, or have it refuse to run a script it has not scanned.
