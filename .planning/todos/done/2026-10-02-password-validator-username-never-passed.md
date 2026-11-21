---
created: 2026-10-02
title: PasswordSetter renders PasswordValidator without a username, so the username-similarity password rule is always met
area: apps/frontend/src/lib/candidate/components
severity: minor
source: Phase 168 (docs-site rewrite), 168-06 finding F8, filed by plan 168-08 (optional code todo)
related_phase: 168
files:
  - apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte (`<PasswordValidator bind:validPassword {password} />`)
  - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte (`` `password` and `username` should be given as props. ``)
---

## Problem

The password validator enforces a `username` requirement. Its prop is documented as "The username used to prevent the password from
being too similar", and the rules run through `validatePasswordDetails(_password, _username)`. But `PasswordSetter`,
which all three password pages use (register/set password, reset, settings change), renders it without the prop:
`<PasswordValidator bind:validPassword {password} />`. With no username the check has nothing to compare against, so it is always met.
The validator's own docstring says `` `password` and `username` should be given as props. ``

The Password validation docs page (`/developers-guide/candidate-app/password-validation`) states this behaviour.

## Fix

Pass the user's email, or its local part, or the candidate's name, as `username` from each page into `PasswordSetter` and through to
`PasswordValidator`. Add a unit test with a password too similar to the username. Optional hardening: not a defect in any flow, but the
rule is currently dead.

## Resolution

**Closed 2026-10-16 by Phase 178** (plan 178-11). `PasswordSetter` takes the account's address as `username`, holds it in a hidden read-only field for a password manager and hands it to the rule list, and the set-password gate, the reset page and the settings page all pass it. Pinned by the unit case `reports a password that contains the address as not valid` of `PasswordSetter.svelte.test.ts`. The docs page `developers-guide/contestant-app/password-validation` was brought in line by plan 178-23.
