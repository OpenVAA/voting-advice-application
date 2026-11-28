# `.bg-shell/manifest.json` is tracked and looks like local scaffolding

**Filed:** 2026-09-03 (Phase 163, during evidence-branch preparation)

`.bg-shell/manifest.json` is tracked on `integration/ship-12-squash`, is **not** on
`origin/main`, and its entire content is `[]`. It looks like session/agent scaffolding that
was committed by accident rather than project source.

**Why it was noticed:** it would have been published to the PUBLIC repo as part of the
`ci-evidence/**` branch. Excluded from that branch by operator decision 2026-09-03.

**What to decide:** whether `.bg-shell/` should be added to `.gitignore` and the tracked
file removed from the branch proper. Not done here — Phase 163 is CI gates, and quietly
deleting a tracked file is outside its scope.

**Check while you are there:** whether anything else local-only is tracked. The measurement
that found this was `git ls-tree --name-only HEAD` compared against `origin/main`.
