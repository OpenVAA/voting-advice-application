# Nominations

A nomination is a row of `public.nominations`: one entity, in one election, one constituency and one round, optionally under a parent nomination. An entity's own editor may write its nominations; an administrator confirms each before voters see it. The rules below bind every writer unless one says otherwise. The Contestant App's side is in [Defining nominations](/developers-guide/contestant-app/defining-nominations).

## The nomination shape

`elections.nomination_shape` is a member of the enum `public.nomination_shape` and says which entity types the election admits as nominees. The column defaults to `organization_list_and_independents`.

| Nomination shape                     | Candidate                                | Organization | Faction  | Alliance |
| ------------------------------------ | ---------------------------------------- | ------------ | -------- | -------- |
| `organization_list`                  | admitted; needs a parent or a typed name | admitted     | admitted | admitted |
| `organization_list_and_independents` | admitted                                 | admitted     | admitted | admitted |
| `candidate_only`                     | admitted                                 | refused      | refused  | refused  |
| `organization_only`                  | refused                                  | admitted     | refused  | admitted |

The matrix is stated twice, once for each side, and nowhere else:

- **In SQL**, `public.nomination_shape_rule(p_shape, p_entity_type)` in [`011-validation-functions.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/011-validation-functions.sql) answers `admitted`, `parent_required` or `refused`. It reads no table. A pair it does not name answers `NULL`, which every caller treats as a refusal.
- **In TypeScript**, `isNominableInShape` and `allowedParentTypes` in [`nominationShape.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/data/src/objects/election/nominationShape.ts) of `@openvaa/data`, asked with `Election.nominationShape`. They tell the application what to offer; the database is what refuses.

The two are held together by a grid over the same sixteen cells on each side: `nominationShape.test.ts` in the data package and the section on the nomination-shape rule in `08-triggers.test.sql`. The `@openvaa/data` README compares every nomination rule of the data model with the database's, under "Nomination rules: the data model and the database".

Two triggers on `nominations` enforce the matrix:

- **The row rule.** `validate_nomination`, before every insert and update, refuses a row whose entity type its election's nomination shape does not admit, with a message that begins `Nomination shape refused: ` and SQLSTATE `23514`. It binds every writer, the service role and `bulk_import` included. It is asked when a nomination is written: changing an election's nomination shape re-checks nothing, and a later write of a row the new shape refuses is refused.
- **The end-of-transaction rule.** The constraint trigger `validate_nomination_parent_required` is `DEFERRABLE INITIALLY DEFERRED`. Where the matrix answers `parent_required`, a candidate's nomination must, when the transaction ends, have a parent nomination or carry `requestedParentOrganization` in its `custom_data` as a string that is not blank. A refusal begins `Nomination parent required: `, SQLSTATE `23514`. It is deferred so that a writer may insert the candidate's row, then its party's row, and then point the first at the second.

## Writing an entity's nominations

`public.set_entity_nominations(p_entity_type, p_entity_id, p_nominations, p_expected_versions)` writes the whole set of nominations of one candidate or organization in one call: it inserts the nominations the set adds, updates the ones whose values differ, deletes the ones the set leaves out, and creates the nomination of a named party or alliance that has none at the contest. Either all of it is stored or none of it.

It is `SECURITY INVOKER`: every statement runs as the caller, so the policies, the column grants and the triggers of `public.nominations` stay the only gate, and a direct write of the same rows meets the same refusals. Only `authenticated` may execute it.

`p_expected_versions` is the read the set was computed from: a JSON object mapping the id of every writable nomination to its `updated_at`, as `get_entity_nominations` states both on the nominations whose `writable` is true, and `{}` for an entity with none. Before it checks the set, the function compares it with the writable nominations as stored. A writable nomination the expectation does not name, an id that is no longer writable and an `updated_at` that differs each refuse the call with `OV003`, so a set computed from an older read never deletes a nomination created since, and never writes back one moved, edited or confirmed since. The comparison is made against the rows as the call reads them, without a lock.

`p_nominations` is a JSON array of objects, and an empty array is a valid set:

| Key               | Value                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | A uuid: the object describes that stored nomination. Left out for a new one; a JSON null is refused.                                                                                       |
| `election_id`     | A uuid, required. With `id` it must be the stored row's.                                                                                                                                   |
| `constituency_id` | A uuid of a constituency of the election, required. With `id`, a value other than the stored one moves the nomination: the stored row is deleted and a new one inserted.                   |
| `election_symbol` | A string or null. Trimmed; a blank one is stored as `NULL`, and one longer than 50 characters is refused.                                                                                  |
| `parent`          | `{"kind":"none"}`, `{"kind":"entity","entity_type":…,"entity_id":…}`, `{"kind":"other","name":…}` or `{"kind":"keep"}`. A candidate names an organization and an organization an alliance. |

- `entity` places the nomination under that entity's nomination at the same contest. Where the entity has none there, one is created for it, unconfirmed, for an administrator to resolve.
- `other` links nothing and stores the typed name, trimmed and at most 100 characters, in `custom_data.requestedParentOrganization`. A nomination that carries that key cannot be confirmed.
- `keep` leaves the stored parent and the stored typed name as they are. It is admitted only with an `id` and not on a move.
- Several objects may name one election, at different constituencies or under different parents. An entity is not nominated twice under one parent at one contest: the uniqueness key `nominations_entity_parent_contest_key` refuses that with `23505`, and `validate_nomination` holds every other rule of the contest.

The function writes only the writable nominations: those of the entity that the caller can read and that `private.nomination_writable` admits, at their election's current round, in an election whose type admits the entity's type. A round that is not stored, on either side, is round 1, as the application reads it. A writable nomination that the set does not name is deleted; every other nomination of the entity is left as it is. A new nomination is written at its election's current round.

It answers `{"inserted", "updated", "deleted", "unchanged", "parents_created"}`, each a count. A move counts once under `deleted` and once under `inserted`. A nomination whose values did not change is not written, so it keeps its confirmation; every row an entity's editor does write has its confirmation turned off.

| Refusal                                                                                                       | SQLSTATE | Message                                                                           |
| ------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| A malformed argument or object                                                                                | `22023`  | begins `set_entity_nominations: `, naming the object as `p_nominations[<index>]`  |
| A constituency that is not one of its election's constituencies                                               | `22023`  | begins `set_entity_nominations: `, naming the object as `p_nominations[<index>]`  |
| The writable nominations as stored are not those the caller read                                              | `OV003`  | `set_entity_nominations: the nominations have changed since they were read`       |
| The caller does not hold `nomination.edit` on the entity                                                      | `42501`  | begins `set_entity_nominations: `                                                 |
| Contestant editing is `nominationsLocked` and the caller does not hold `project.edit_nominations`             | `OV006`  | `set_entity_nominations: nominations are locked in this project`                  |
| Contestant editing is `locked` and the caller does not hold `project.edit_nominations`                        | `OV002`  | `set_entity_nominations: editing is locked in this project`                       |
| A row could not be written: the rows are no longer the caller's                                               | `42501`  | begins `set_entity_nominations: a nomination could not be written`                |
| The set names one entity twice under one parent at one contest                                                | `23505`  | the uniqueness key `nominations_entity_parent_contest_key`                        |
| A nomination that is removed or moved has nominations listed under it                                         | `OV005`  | asked before the delete, so the foreign key on `parent_nomination_id` never fires |
| The call would create a parent's nomination while the caller has originated ten unconfirmed ones              | `OV004`  | begins `A caller may originate at most `                                          |
| A candidate is left with neither a parent nor a typed name where the election's nomination shape requires one | `23514`  | begins `Nomination parent required: `                                             |
| An entity type the election's nomination shape refuses                                                        | `23514`  | begins `Nomination shape refused: `                                               |

Row-level security refuses an `UPDATE` and a `DELETE` without an error, by hiding the row. The function therefore counts the rows each statement affected and raises on a shortfall, so a caller is never answered that a locked or vanished row was saved. The refusals the frontend tells apart carry SQLSTATEs of their own, in class `OV`, which no PostgreSQL error uses: `OV001` the frozen name, `OV002` contestant editing `locked`, `OV003` the changed writable nominations, `OV004` the cap, `OV005` a nomination listed under and `OV006` contestant editing `nominationsLocked`. The frontend's data writer recognises each by its code alone, never by its message, and maps `OV003`, `OV005`, `OV004`, `OV002` and `OV006` to the named refusals `changed`, `hasCandidates`, `tooManyPending`, `answersLocked` and `nominationsLocked`, and rejects for every other error.

The function forces the end-of-transaction parent rule and sets it back to deferred before it returns. PostgreSQL offers no way to read a constraint's mode, so a caller that had set `validate_nomination_parent_required` immediate finds it deferred after the call.

The function does not hold a named parent to the options the next function lists: it checks the parent's type and that the id is a uuid. It reads `access.contestantEditing` once, right after the caller's `nomination.edit` is checked and before the writable nominations are read: anything but `open` refuses a caller who does not hold `project.edit_nominations` on the project, with `OV006` under `nominationsLocked` and `OV002` under `locked`, so a project editor and a project admin still write.

## The parent options

`public.get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)` returns the entities a candidate or an organization the caller edits may stand under: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. Each element holds exactly `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`, the last being those of the asked contests at which the option holds a nomination at the election's current round. `p_contests` is a JSON array of at most 1000 `{election_id, constituency_id}` objects; a longer one is answered with `NULL`, as a malformed one is.

It is `SECURITY DEFINER`, because an entity's editor cannot read the project's organizations and alliances through its own policies, and only `authenticated` may execute it. Its gate is the caller's own editor grant on the named entity, read through `private.caller_entity_ids`; `user_can` is not asked, so a project admin is refused. It returns `NULL`, and never raises, for a refused caller and for a malformed argument; an empty array says that the project lists nothing the entity may name.

## The policies

Beside the admin policies, which ask `project.edit_nominations`, an entity's own users write through four policies, each of which admits a write only while `access.contestantEditing` is `open`:

- `entity_insert_nominations` and `entity_update_nominations`: the entity's own nomination, with `nomination.edit` on the entity.
- `entity_delete_nominations`: the entity's own nomination, confirmed or not, with `nomination.edit` on the entity. A placeholder the caller created for another entity is not the caller's own and cannot be deleted by it. The foreign key on `parent_nomination_id` takes no action on a delete, so the delete is refused while a nomination is listed under the row.
- `entity_insert_parent_nominations`: the unconfirmed nomination of a parent that has none at the contest. It asks `nomination.create_parent` and pairs the row with the caller: the caller must already hold a nomination at that contest whose entity is of a type that stands under the row's entity, a candidate or a faction for an organization's row and an organization for an alliance's. A caller may have originated at most ten unconfirmed organization and alliance nominations; the count is by user and includes those the caller inserted for an organization or an alliance it edits itself.

`private.nomination_id_in_contest` answers which nomination an entity holds at a contest, for a writer that cannot read the row: the one with no parent first, then the oldest, then the lowest id.
