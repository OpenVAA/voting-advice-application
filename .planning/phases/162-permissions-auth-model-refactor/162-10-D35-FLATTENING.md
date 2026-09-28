# D-35 — flattening `entity_is_anon_visible`: measured, and STOPPED at assertion 46

**Status: BLOCKED ON AN OPERATOR DECISION. No schema change was committed.**

D-35's flattening is fully specified, fully measured and proven behaviour-neutral, but it cannot land
without reddening **assertion 46 of `16-anon-visibility.test.sql`** — the one assertion D-35's own brief
fences off. The brief says to report that and stop rather than edit it, so this document is the report and
the tree is unchanged apart from this file.

Everything below was measured on this machine, against the applied database, at
`9c1806789`. Every timing carries the `md5(prosrc)` of the `entity_is_anon_visible` body that produced
it — see § *The instrument lies if you do not fingerprint it*.

---

## 1. Assertion 46 IS affected — observed, not reasoned

Applied the flattened function to the live database and ran the whole estate:

| run | exit | files | assertions | failures |
| --- | --- | --- | --- | --- |
| baseline, shipped nested | **0** | 21 | 921 | none |
| **flattened, four-arm CASE** | **1** | 21 | 921 | **1 — test 46 of `16-anon-visibility.test.sql`** |
| **flattened, UNION ALL dispatch** | **1** | 21 | 921 | **1 — test 46 of `16-anon-visibility.test.sql`** |

```
Test Summary Report
  16-anon-visibility.test.sql   (Wstat: 0 Tests: 51 Failed: 1)
    Failed test:  46
# Failed test 46: "both converted anon policies reach the project term -- directly or through the one
#  composition -- and neither mentions published; and that composition still requires
#  project_open_for_voters in its own body, read from pg_get_functiondef so a term dropped from the
#  function cannot hide behind a policy that merely calls it"
```

**920 of 921 stay green under both flat forms.** Assertion 46 is the sole casualty, and it is exactly the
assertion the brief names.

Its two clauses, evaluated directly before and after (the flat form applied in a rolled-back transaction):

| clause | expects | shipped nested | flattened |
| --- | --- | --- | --- |
| the two anon policies reach the project term and never mention `published` | 2 | 2 | **2** |
| `pg_get_functiondef(entity_is_anon_visible) LIKE '%project_open_for_voters%'` | 1 | 1 | **0** |

The **policy** clause is untouched — no policy was modified, and none needed to be. The **function-body**
clause fails by construction: flattening's whole content is that the body no longer names
`project_open_for_voters`.

**There is no honest way to satisfy the second clause under D-35.** The only text that would satisfy it is
a *comment* inside the body naming the helper — which would leave an assertion that can no longer fail for
the reason it was written, i.e. precisely the "structural assertion that lies" this estate's own comments
argue against. It was not done.

**What the replacement should be is 162-17's job, and that is the substantive reason to stop here.**
Assertion 46 pins "the composition still requires `project_open_for_voters`". After flattening, the
composition still requires the *rule*; it no longer requires the *helper*. The assertion that expresses
that is the 162-17 equivalence guard D-35 already commissions — so the replacement for assertion 46 and the
guard D-35 owes are the same artefact. Editing 46 ahead of 162-17 would write that guard twice, in a fenced
file, by a different hand.

---

## 2. The cost, measured on the same instrument both times

Both instruments: one project `open_for_voters`, `SET LOCAL ROLE` (RLS actually applied — never `postgres`),
`SELECT count(*) FROM public.candidates`, 8 runs per reader, fixture built and rolled back inside one
transaction, row counts reported beside every time so a fast-but-emptier answer cannot pass as a fast one.

### Instrument A — the brief's own: 5000 candidates + 5000 confirmed nominations, all anon-visible

| variant | `md5(prosrc)` | anon min (ms) | auth min (ms) | rows | correct |
| --- | --- | --- | --- | --- | --- |
| pre-162-10 policies (helpers called at the **top level of the qual**) | n/a | 39.4 | 30.0 | 5000 | yes |
| **shipped — nested `SECURITY DEFINER`** | `baceba3d` | **271.9** | 351.9 | 5000 | yes |
| **flat — four-arm CASE, logic inline** | `54b7c4e9` | **111.5** | 193.0 | 5000 | **yes** |
| **flat — UNION ALL dispatch, conjuncts hoisted** | `b1a97ebd` | **79.6** | 161.7 | 5000 | **yes** |
| one-arm inline (candidate arm only) | `d57dc18d` | 57.3 | 141.2 | 5000 | **NO — see § 3** |

The shipped row reproduces the orchestrator's 273 ms at 271.9 ms, so the two instruments agree and the rest
of the column can be compared to their table.

### Instrument B — 162-10's shape at a scale that times reliably: 5000 candidates, HALF anon-visible

162-10's own 400-row instrument is too small to time on this machine — repeated passes swung 3.5 → 8.6 ms
on identical input. Same design, ten times the rows:

| variant | anon (ms) | ratio vs before | auth (ms) | ratio vs before | rows |
| --- | --- | --- | --- | --- | --- |
| before (pre-162-10 policies) | 20.8 | 1.00 | 30.3 | 1.00 | 2500 |
| shipped nested | 155.1 | **7.46** | 231.9 | **7.65** | 2500 |
| flat, four-arm CASE | 111.8 | **5.37** | 191.2 | **6.31** | 2500 |
| flat, UNION ALL dispatch | 67.6 | **3.25** | 146.6 | **4.84** | 2500 |
| one-arm inline (**incorrect**) | 43.7 | 2.10 | 123.3 | 4.07 | 2500 |

162-10 recorded 6.37 anon / 7.31 authenticated at 400 rows; this instrument puts the same shipped code at
7.46 / 7.65, so it is measuring the same thing a little more harshly.

> **The finding the operator most needs: flattening does NOT close the 2.0 gate.**
> The best correct arrangement measured takes anon from **7.46x to 3.25x** and authenticated from
> **7.65x to 4.84x**. That is a 2.3x improvement on the voter path and it is real, but the budget is 2.0
> and the residue is still above it. Reported unpadded, per the brief.
>
> The authenticated half stays worse than the anon half in every variant because
> `authenticated_select_candidates` evaluates its three `user_can` disjuncts **before** the public one;
> that ordering, not the composition, is what the authenticated column is measuring. 162-10 declined to
> reorder it and this work did not revisit that.

---

## 3. ⚠ The 53 ms target is a ONE-ARM number, and its correctness column is NO

The brief's target row — *Flat, 53 ms, 5000 rows, correct* — reproduces here at **57.3 ms**, but only for a
body whose other three `CASE` arms are `false`. Asked for the other three entity types, that body denies
everything:

| anon-visible rows, on the grid fixture | shipped nested | one-arm inline |
| --- | --- | --- |
| candidates | 1 | 1 |
| **organizations** | 2 | **0** |
| **factions** | 1 | **0** |
| **alliances** | 1 | **0** |
| **nominations** (transitively, via `nomination_entities_confirmed`) | 5 | **1** |

This is the same trap as the brief's third row, one level down: it is fast because it answers a smaller
question. The brief's table is right that the fully-inline-in-the-policy variant returns 0 rows; it is the
*flat* row that needs the same caveat, because 5000 candidates is a fixture that cannot see the difference.

**A faithful four-arm flattening costs 111.5 ms on instrument A, not 53 ms.** Where the other 54 ms goes,
measured by adding one conjunct at a time to a one-arm body (instrument A, anon, ms):

| body | ms |
| --- | --- |
| PK probe only, `SECURITY DEFINER` call floor | 17.1 |
| + `confirmed` + terms-of-use conjuncts | 17.0 (within noise of the floor) |
| + inline `open_for_voters` lookup | 22.1 |
| + inline confirmed-nomination `EXISTS` **without** the four-way FK `OR` | 29.6 |
| + inline confirmed-nomination `EXISTS` **with** the four-way FK `OR` (as the helper spells it) | 46.8 |
| one full arm, all conjuncts | 53.0 |
| one full arm **+ three trivial arms** | 61.8 |
| **four full arms (the faithful flattening)** | **107.7** |

The three idle arms cost ~55 ms *without running*. `EXPLAIN` confirms they are `(never executed)` — the
cost is **per-call executor set-up of a plan tree four times larger**, paid 5000 times because a
`SECURITY DEFINER` function is called once per row. That is a mechanism the 162-10 decomposition did not
isolate, because under nesting the per-row call cost swamped it (162-10 measured the four-arm CASE at only
1.5 ms of 13.37 ms).

---

## 4. A better arrangement, measured — the UNION ALL dispatch

Since the cost is plan-tree size per call, the lever is to write each shared sub-rule **once** instead of
four times. Dispatch on the entity type in a `UNION ALL` that yields at most one row, then apply the shared
conjuncts to it:

```sql
CREATE OR REPLACE FUNCTION public.entity_is_anon_visible (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT
        e.entity_ok
        AND COALESCE(
          (SELECT p.open_for_voters FROM public.projects p WHERE p.id = e.project_id),
          false
        )
        AND EXISTS (
          SELECT 1
          FROM public.nominations n
          WHERE n.project_id = e.project_id
            AND n.entity_type = p_entity_type
            AND (
              n.candidate_id = p_entity_id
              OR n.organization_id = p_entity_id
              OR n.faction_id = p_entity_id
              OR n.alliance_id = p_entity_id
            )
            AND NOT COALESCE(n.unconfirmed, false)
        )
      FROM (
        SELECT e.project_id,
               e.confirmed
                 AND e.terms_of_use_accepted IS NOT NULL
                 AND e.terms_of_use_accepted < now() AS entity_ok
        FROM public.candidates e
        WHERE p_entity_type = 'candidate' AND e.id = p_entity_id
        UNION ALL
        SELECT e.project_id, e.confirmed FROM public.organizations e
        WHERE p_entity_type = 'organization' AND e.id = p_entity_id
        UNION ALL
        SELECT e.project_id, e.confirmed FROM public.factions e
        WHERE p_entity_type = 'faction' AND e.id = p_entity_id
        UNION ALL
        SELECT e.project_id, e.confirmed FROM public.alliances e
        WHERE p_entity_type = 'alliance' AND e.id = p_entity_id
      ) e
    ),
    false
  );
$$;
```

The alternative — the minimal-delta form — is the shipped body with each helper call textually replaced by
that helper's own body, four times over:

```sql
            AND COALESCE(
              (SELECT p.open_for_voters FROM public.projects p WHERE p.id = e.project_id),
              false
            )
            AND EXISTS (
              SELECT 1
              FROM public.nominations n
              WHERE n.project_id = e.project_id
                AND n.entity_type = 'candidate'::public.entity_type
                AND (n.candidate_id = e.id OR n.organization_id = e.id
                     OR n.faction_id = e.id OR n.alliance_id = e.id)
                AND NOT COALESCE(n.unconfirmed, false)
            )
```

**Why the UNION ALL form is the better of the two, beyond the 32 ms.** The minimal-delta form writes each
of D-35's two duplicated sub-rules **four** times inside the function, so the 162-17 equivalence guard would
have eight expressions to compare instead of two. The UNION ALL form writes each **once**. It is also
strictly equivalent, not merely close enough: `p_entity_type` selects exactly one branch, ids are primary keys so
the subquery yields at most one row, a missing id yields no row and `COALESCE` returns `false`, and a NULL
`p_entity_type` or `p_entity_id` matches no branch and returns `false` — the same four denial paths the
`CASE`/`ELSE false` form has today.

Both forms were measured and both were run through the full estate. Neither was substituted unmeasured.

---

## 5. Row-identity, as a set comparison, on all four entity types

Fixture: two projects (one open for voters, one not) × four entity types × `confirmed` ∈ {t,f} ×
nomination ∈ {confirmed, unconfirmed, absent} × (candidates) terms-of-use ∈ {past, NULL, future}, **plus**
one entity of each type whose only confirmed nomination row carries the *other* project's `project_id` —
the case `entity_has_confirmed_nomination`'s third argument exists to deny. 38 candidates, 15
organizations, 13 factions, 13 alliances, 54 nominations.

**(a) Visible ID sets through the policies**, captured as `anon` and as an `authenticated` caller holding
no grant (whose only reach is the public disjunct), for the shipped nested body and for both flat bodies:

| reader | table | nested | flat CASE | flat UNION ALL |
| --- | --- | --- | --- | --- |
| anon | candidates / organizations / factions / alliances / nominations | 1 / 2 / 1 / 1 / 5 | 1 / 2 / 1 / 1 / 5 | 1 / 2 / 1 / 1 / 5 |
| authenticated (no grant) | candidates / organizations / factions / alliances / nominations | 1 / 2 / 1 / 1 / 54 | 1 / 2 / 1 / 1 / 54 | 1 / 2 / 1 / 1 / 54 |

`EXCEPT ALL` in **both** directions, for every (reader, table, variant) pair: **0 rows**. Not a count
comparison — an identity comparison of the id sets.

**(b) The full truth table**, which is the stronger instrument because it compares the *false* answers too:
every entity id asked under its own type **and under each of the three wrong types**, plus an absent id
under all four types, plus a NULL id and a NULL type — **237 probes per variant, 6 true / 231 false / 0
null, identical for all three bodies. Disagreements: 0.**

---

## 6. The red-first observation

The flattened body with the `open_for_voters` conjunct deliberately removed from all four arms:

- **Grid fixture:** the closed project's rows leak to `anon` — candidates 1 → 2, organizations 2 → 4,
  factions 1 → 2, alliances 1 → 2; 6 truth-table answers flip.
- **Estate:** exit **1**, five failures, and they name the conjunct:

```
Failed tests:  2, 27, 31, 35, 46
# 2:  "anon CANNOT see an otherwise-visible candidate whose project is not open for voters
#      -- the project conjunct, flipped alone"
# 27: "... a confirmed, nominated organization whose project is not open for voters ..."
# 31: "... a confirmed, nominated faction whose project is not open for voters ..."
# 35: "... a confirmed, nominated alliance whose project is not open for voters ..."
# 46: (the structural pin above)
```

So the four **behavioural** assertions that guard this conjunct are live against the flattened form, one per
entity type. The green estate in § 1 is a green instrument, not an absent one.

Worth recording as a gap for 162-17: `03-anon-read.test.sql` and `18-entity-policies.test.sql` both stayed
**green** against the perturbed body. All four behavioural guards for the project conjunct live in one file.

---

## 7. The duplication D-35 creates — its exact status

D-35 asks that this be stated plainly, and the accurate statement is conditional, because the change did
not land:

- **As of this commit the duplication does not exist.** `entity_is_anon_visible` still calls both helpers;
  the working tree is unchanged apart from this file.
- **The moment the flattening lands, each of the two sub-rules exists in two expressions** — one inside
  `entity_is_anon_visible`, one in `project_open_for_voters` / `entity_has_confirmed_nomination`, which keep
  their names, signatures and their own direct callers — **and it is unguarded** until 162-17 lands the
  equivalence clause D-35 commissions. Nothing in the estate would report a drift between the two spellings;
  assertion 46, the one thing that reads the composition's body at all, is the assertion the flattening
  removes the meaning of.
- That obligation is already written into `162-17-PLAN.md` and into D-35, and § 1 adds a reason to keep the
  two together: **the replacement for assertion 46 and the 162-17 guard are the same artefact.**

---

## 8. The instrument lies if you do not fingerprint it

Recorded because it cost a full round of measurements here and would cost the same again. The estate runs in
§ 1 leave the *last variant applied* installed in the live database. A subsequent benchmark that measures
"the shipped nested form" by simply not applying anything then measures whatever the previous experiment
left behind — here, a variant reported at 8.0 ms against a true 155.1 ms, a 19x error in the direction that
flatters the conclusion. Every timing in this document prints `md5(prosrc)` of the body that produced it,
taken inside the timing transaction; the fingerprints are in the § 2 table. The database was reset
(`yarn db:reset`, exit 0) before the § 2 numbers were taken and again after, and the estate verified green
on the restored tree.

---

## 9. Gates

| gate | result |
| --- | --- |
| `yarn workspace @openvaa/supabase test:db` (restored tree) | **exit 0** — Files=21, Tests=921, `Result: PASS` |
| `yarn db:lint:sql` | **exit 0** — 0 errors, 2 pre-existing FK-index warnings |
| `git status --short` | clean apart from this file |

`typecheck`, `lint:check`, `test:unit` and the full E2E suite were **not** run, and the reason is that no
runtime artefact changed: the only file this commit adds is this document, under `.planning/`. They are owed
by the commit that lands the flattening, not by this one. (Disk headroom for an E2E run was checked and is
adequate — 71 GiB free, `tests/e2e-runs/` at 6.9 GiB.)

---

## 10. What is being asked of the operator

1. **Rule on assertion 46.** It cannot survive D-35 in its current form. The options, as measured:
   (a) let 162-17's equivalence guard replace it, and land the flattening in the same change as that guard;
   (b) release the fence a second time so assertion 46 can be re-pointed at the inline projects read now and
   generalised later; (c) drop D-35.
2. **Rule on which body**, given § 4: the UNION ALL dispatch (3.25x anon, one expression per sub-rule) or
   the minimal-delta four-arm CASE (5.37x anon, four expressions per sub-rule). Both are behaviour-neutral
   on 920/921 and on the 237-probe truth table.
3. **Note that neither closes the 2.0 budget** (§ 2). If closing it is required, the remaining levers are
   outside D-35: the disjunct order in the authenticated entity policies, and the `SECURITY DEFINER` call
   itself — the floor is 17 ms of the 67.6 ms best case at 5000 rows, and that floor is what V-6(A) buys.

Everything needed to execute (1) and (2) is in this document; the bodies in § 4 are the exact text measured.
