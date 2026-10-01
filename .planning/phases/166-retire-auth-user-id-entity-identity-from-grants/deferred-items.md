## Deferred Items

- 03-anon-read's future-terms-of-use control is hidden for two reasons, not one
  status: open
  **Found during:** 166-03 Task 3, the whole-file sweep of `apps/supabase/supabase/tests/database/03-anon-read.test.sql`.
  **What:** The "terms_of_use_accepted gating" section inserts two controls (`NoTerms` …001a and `FutureTerms` …001b) and a nomination for each. The comment above the nominations insert says the controls are given nominations so that terms of use is the only conjunct hiding them. The `FutureTerms` nomination (…002b) is inserted with `confirmed = false`, so `entity_has_confirmed_nomination` also fails for it. The assertion "anon cannot SELECT an otherwise-visible candidate with terms_of_use_accepted in the future" therefore passes for a second reason, and would stay green if the future-dated half of the terms-of-use conjunct (`terms_of_use_accepted < now()`) were removed from `anon_select_candidates`. (UNCONFIRMED: not run as a negative control. 16-anon-visibility.test.sql may already flip that conjunct alone; check before fixing.)
  **Why deferred:** Pre-existing and unrelated to the auth link column (scope boundary). 166-03 Task 3 is a comment-only sweep, so the comment was rewritten to make no claim about the nomination's confirmation state, and the fixture value was left as is.
  **Fix:** Insert the …002b nomination with `confirmed = true`. Then observe the assertion going red with `terms_of_use_accepted < now()` removed from the policy, and green with it restored.
