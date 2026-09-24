---
created: 2026-08-27T16:10:00.000Z
title: A negative-control register must record its injection text verbatim, not promise it is recoverable from a commit range
area: planning / negative-control convention
severity: minor
source: Phase 147 (147-01's promise, 147-04 Decision 1; filed by 147-05)
files:
  - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md
---

## The defect — a record-quality one, not a measurement one

`147-01` recorded row `AX1-OLD` with an injected-state blob hash (`ca43e76a…`) and stated that the
injected text was *"recoverable from this plan's commit range"*.

**It was not, and could not have been.** Three independent checks say so:

1. `147-01` committed **zero product bytes by design** — that was the plan's whole point — so the
   blob was never written to the object database (`git cat-file -t` → `could not get object info`).
2. The hash covers a **6-line comment** whose text is recorded nowhere in the register or the plan.
3. The Svelte compiler strips markup comments, so the comment is absent from the run traces too.

So the pairing `AX1-NEW` was designed to take — *inject the identical text, get the identical
hash* — was unavailable three plans after the promise was made, and the promise's falsity was **not
discoverable at the time it was written**.

## How 147-04 handled it, and why that is not the fix

The register anticipated the possibility and permitted an alternative: re-apply verbatim **or**
record your own injected-state hash. `147-04` took that branch and carried instrument identity by
four substitute equalities instead — equal *clean* blob hash, byte-identical injected element line,
identical compiled location `191:2`, and axe's own `"html"` field equal to the DOM node `AX1-OLD`
recorded. It disclosed the divergence and flagged the pairing `human_judgment: true` rather than
presenting it as a machine check.

That was the right handling of the situation. It does not stop the situation recurring.

## Solution — a convention, cheap and mechanical

In any future negative-control register: **an injecting row records the injection text VERBATIM in
the document**, inside a fenced block, as well as its blob hashes. A hash is an identity check, not
a reproduction; a hash whose preimage exists nowhere is a claim that cannot be re-derived.

The rule generalises past injections: **a register must not promise recoverability from a commit
range that, by the plan's own design, cannot contain the thing promised.** `147-04` did exactly this
for its own half — `AX1-NEW`'s injection is written out verbatim in the register, so it *is*
reproducible from the document. That is the shape to make standard.

## Note

Filed as a convention item because it costs nothing to adopt and its absence is only discovered
after the evidence it would have preserved is already gone.
