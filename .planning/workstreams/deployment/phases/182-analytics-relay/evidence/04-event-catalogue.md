# Event catalogue (plan 182-04)

The closed vocabulary in `apps/frontend/src/lib/analytics/events.schema.ts`, for the operator to review.
One row per member of the union; 30 members. The classification of the events the research marked as
assumption A11 is unreviewed by the operator.

Every event carries `name` and `ago` (its age in whole milliseconds at send time, 0 to 24 h). Every event but
`pageview` may carry `id`, the visit id, which must be a canonical UUIDv7; whether it is kept is the relay's
rule (plan 182-08). Every object, `attributes` included, rejects an unknown key. An "id string" below is 1 to
64 of `A-Z a-z 0-9 _ -`. An entity type is one of `candidate`, `faction`, `organization`, `alliance`, taken
from `ENTITY_TYPE` in `@openvaa/data`.

## Four readings the operator may want to change

1. **`entityDetails_changeTab` is not sensitive.** It names a content tab (`info`, `opinions`, …), not the
   entity. The entity being viewed is already known from the `results_*_entity` event that opened the drawer,
   which is sensitive. Changing it costs one line in `SENSITIVE_EVENTS` and one in its test; the event then
   loses its visit id in consent-free mode.
2. **`filters_active` sends a count and is sensitive.** The filter names were localised question texts and are
   gone; only how many filters are active (1 to 100) remains. A count reveals little, so it could be made
   non-sensitive (one line), or the event could instead carry the filtered question ids (a new attribute and a
   change at the two call sites in `EntityListControls.svelte` and `EntityListWithControls.svelte`; question
   ids with the filter values would reveal more and should then stay sensitive).
3. **The two section events send an index.** `questionExtendedInfo_expandSection` and `_collapseSection` send
   `sectionIndex` (0 to 100), the position of the section among the question's info sections, in place of the
   localised title. The index is only meaningful together with the question; adding `questionId` costs one
   attribute and a change at the call site in the questions layout.
   **Operator ruling (2026-10-20): send the localised section title, not sensitive.** Both events carry
   `title` again (a non-empty string of at most 256 characters) in place of `sectionIndex`, and neither is in
   `SENSITIVE_EVENTS`, so both keep the visit id.
4. **`video` keeps `src` without its query string.** The media URL is kept up to the first `?` or `#`, so
   tokens and tracking parameters do not leave, but the path stays and can name the file. Dropping `src`
   entirely costs one attribute; replacing it with a stable media id would need an id in `VideoContent`.

## The vocabulary

| # | Name | Attributes and bounds | Sensitive | Difference from today |
|---|------|-----------------------|-----------|-----------------------|
| 1 | `pageview` | `params`: record of at most 8 entries, name `^[A-Za-z][A-Za-z0-9_]{0,63}$`, value an id string; `duration`: integer ≥ 0 (ms). No `id` member | no | No longer folds the other events; no `href`, `from`, `start` or session id. Route id and locale travel in the batch envelope. Built into the record by the relay |
| 2 | `answer` | `questionId`: id string; `value`: finite number, boolean, or 1–256 of `A-Z a-z 0-9 _ . : , -` | yes | Value bounded to a character set; unchanged in meaning |
| 3 | `answer_delete` | `questionId`: id string | yes | Unchanged |
| 4 | `answer_resetAll` | none | no | Unchanged |
| 5 | `dataConsent_granted` | none | no | Unchanged |
| 6 | `entityCard_expandSubcards` | `length`: integer 0–1000 | no | Bounded |
| 7 | `entityDetails_changeTab` | `section`: id string | no | Bounded |
| 8 | `feedback_error` | `rating`: optional integer 1–5 | no | `description` (the visitor's typed text) removed |
| 9 | `feedback_sent` | `rating`: optional integer 1–5 | no | `description` (the visitor's typed text) removed |
| 10 | `filters_active` | `count`: integer 1–100 | yes | `activeFilters` (localised filter names) replaced by `count` |
| 11 | `filters_reset` | none | no | Unchanged |
| 12 | `maintenance_shown` | none | no | Unchanged |
| 13 | `menu_open` | none | no | Unchanged |
| 14 | `question_next` | `questionIndex`: optional integer 0–10000 | no | Bounded |
| 15 | `question_previous` | `questionIndex`: optional integer 0–10000 | no | Bounded |
| 16 | `question_skip` | `questionIndex`: optional integer 0–10000 | yes | Bounded |
| 17 | `question_startFrom` | `questionId`: id string (admits `__first__`) | no | Bounded |
| 18 | `questionInfo_collapse` | none | no | Unchanged |
| 19 | `questionInfo_expand` | none | no | Unchanged |
| 20 | `questionExtendedInfo_collapseSection` | `sectionIndex`: integer 0–100 | no | `title` (localised section title) replaced by `sectionIndex`. Operator ruling (2026-10-20): send the localised section title, not sensitive; now `title`: string 1–256 chars |
| 21 | `questionExtendedInfo_expandSection` | `sectionIndex`: integer 0–100 | no | `title` (localised section title) replaced by `sectionIndex`. Operator ruling (2026-10-20): send the localised section title, not sensitive; now `title`: string 1–256 chars |
| 22 | `questionExtendedInfo_open` | none | no | Unchanged |
| 23 | `results_browse` | `election`: optional id string; `entityType`: optional entity type; `numAnswers`: integer 0–10000 | no | Bounded |
| 24 | `results_browse_entity` | `entityType`: entity type; `entityId`: id string | yes | Replaces the template `results_browse_${EntityType}`; the entity id moves from `id` to `entityId` |
| 25 | `results_changeElection` | `election`: id string | no | Bounded |
| 26 | `results_changeTab` | `section`: entity type | no | Bounded to the entity types |
| 27 | `results_ranked` | `election`: optional id string; `entityType`: optional entity type; `numAnswers`: integer 0–10000 | no | Bounded |
| 28 | `results_ranked_entity` | `entityType`: entity type; `entityId`: id string; `score`: integer 0–100 | yes | Replaces the template `results_ranked_${EntityType}`; the entity id moves from `id` to `entityId` |
| 29 | `survey_opened` | none | no | Unchanged |
| 30 | `video` | all optional: `startMuted`, `startWithTranscript`, `startWithCaptions`, `ended`, `endMuted`, `endWithTranscript`, `endWithCaptions`, `error`: boolean; `duration`: number 0–86400 (s); `endAt`: `'end'` or number 0–1; `src`: ≤ 2048 chars, cut at the first `?` or `#`; `jump`: ≤ 512 chars of `^(-?\d+(\.\d+)?,)+$`; `toggleTranscript`: ≤ 512 chars of `^((true\|false),)+$` | no | `src` loses its query string and fragment; `jump` and `toggleTranscript` get a pattern and a cap |
