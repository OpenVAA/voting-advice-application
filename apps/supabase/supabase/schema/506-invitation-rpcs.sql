-- Invitation RPC functions
--
-- Functions:
-- - create_invitations() - seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds, and return each generated code once
-- - private.access_throttle_take() - count one take against a throttle key
-- - private.email_hash(), private.email_link_slot_key(), private.email_link_slots_take() - the throttle keys of an address, and the two slots a sign-in or recovery mail takes
-- - private.invitation_mode_allowed() - whether the project allows the registration mode of an open invitation
-- - private.invitation_is_open() - whether an invitation is unclaimed and unexpired
-- - private.email_holds_allowed_invitation() - whether an open invitation of a project, whose registration mode is allowed, is addressed to an address
-- - private.email_holds_grant_in_project() - whether a user with a confirmed address holds a grant that reaches a project
-- - invitation_code_status() - whether a code is valid, used or unknown
-- - invitation_link_request() - the address a sign-in mail may go to, or null
-- - invitation_link_release() - give back what a link request took when no mail went out
-- - recovery_link_request() - which mail a recovery request for an address earns, or null
-- - email_confirmation_request() - whether one confirmation mail may go to an address for a signed-in account, under the address's and the account's limits
-- - email_confirmation_release() - give back the address's slot of a confirmation that mailed nothing
-- - email_invitation_hold() - which hold an open invitation of a project has on an address: one the project would honour, one it would not, or none
-- - invitation_code_claimant_email() - the claimant's address of a used code, under an attempt limit
-- - identity_account_find() - the account an identity provider's identity resolves to, by its match value or its placeholder address
-- - identity_entity_find_or_create() - the entity an identity provider's user registered in a project, found or created
-- - access_caller_take() - count one anonymous account-access operation against the limit of the address it came from
-- - claim_invitations() - turn the caller's open invitations into grants
--
-- The four `invitation_*` functions, access_caller_take, recovery_link_request, the two `email_confirmation_*` functions, email_invitation_hold and the two `identity_*` functions are the service role's: an Edge Function calls them with values a visitor typed or an identity provider asserted, and no API role can execute them. claim_invitations is the signed-in user's and nobody else's.
--
-- Depends on:
-- - 102-entities.sql (the four entity tables)
-- - 104-nominations.sql (public.nominations, its triggers and the constraint trigger validate_nomination_parent_required)
-- - 300-auth-tables.sql (public.grants)
-- - 100-tenancy.sql (public.projects, which private.identity_registrations references)
-- - 301-auth-functions.sql (private.entity_project_id, private.registration_mode_allowed, private.project_contestant_app_closed, private.grant_reaches_project)
-- - 305-invitations.sql (public.invitations, its insert trigger, its policies and private.invitation_code_hash)
-- - 503-entity-rpcs.sql (private.nomination_list_checked, private.nomination_object_checked, private.parent_nomination_resolved, private.nomination_parent_target)
-- - auth.users (Supabase Auth)
--------------------------------------------------------------------------------
-- localized_has_text: does a localized string say anything
--
-- True when the value is a JSON object with at least one member whose text is not blank. NULL, a non-object and an object of blank or null members are all false.
--
-- create_invitations is SECURITY INVOKER and calls it as its caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.localized_has_text (p_val jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_val) = 'object' THEN
      EXISTS (SELECT 1 FROM jsonb_each_text(p_val) AS t WHERE btrim(t.value) <> '')
    ELSE false
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.localized_has_text (jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.localized_has_text (jsonb) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- create_invitations RPC: seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds
--
-- p_project_id, p_invitations and p_confirm_entity are REQUIRED and none carries a DEFAULT: every row of the batch belongs to p_project_id, and a NULL p_confirm_entity is refused. p_invitations is a JSON array of items `{ scope?, role?, target_type?, target_id?, external_id?, email?, expires_at?, nominations? }`. `scope` defaults to `entity` and `role` to `editor`. An entity-scope item names its entity by `target_type` and exactly one of `target_id` and `external_id`; a project-scope item promises a role on p_project_id itself. An item with an `email` is bound to that address, and one without gets a generated code.
--
-- The plaintext of a generated code exists only in this function's return value: the table holds its hash, which no API role can read, so a code that is lost is replaced by deleting the unclaimed invitation and seeding another. The code is read from the transaction-local setting the insert trigger writes, and the setting is cleared straight after.
--
-- SECURITY INVOKER: each row is inserted as the caller, so the INSERT policy of public.invitations decides who may promise which grant, exactly as it does for a direct insert, and this body holds no authority rule of its own. An `external_id` is resolved under the caller's row-level security, inside p_project_id only. The nominations are written as the caller too, so the policies, the column grants and the triggers of public.nominations decide every statement. A service-role caller bypasses the policies and is bound by the tables' CHECK constraints and triggers.
--
-- p_confirm_entity says whether the call confirms the entities it invites. `true` confirms each named entity of the batch, in the same transaction and as the caller, so enforce_entity_immutability asks `entity.confirm`. A candidate has a name when its first and last name are both non-blank; the other three types when their localized `name` has text. An entity without a name stays unconfirmed. `false` confirms no one. No call unconfirms an entity, no item key overrides the call's value, a project-scope promise confirms nothing, and deleting the invitation later leaves the entity confirmed.
--
-- NOMINATIONS. An entity-scope item for a candidate or an organization may carry `nominations`, a JSON array of nomination objects of the invited entity. The array is checked by `private.nomination_list_checked`, so it holds at most 1000 objects, and the shape of each object by `private.nomination_object_checked`, as set_entity_nominations checks its own. The keys of one object:
--   id              - a uuid: the object describes that nomination of the invited entity. Absent: it describes a new one.
--   election_id     - a uuid, required: an election of p_project_id the caller can read. With `id` it must be the stored row's.
--   constituency_id - a uuid, required. With `id` it must be the stored row's: an invitation moves no nomination.
--   election_round  - an integer, optional. A new nomination without one is written at its election's current_round. With `id`, a stated round must be the stored row's.
--   election_symbol - a string or null. It is trimmed; a blank one is stored as NULL, and one longer than 50 characters is refused.
--   parent          - `{"kind":"none"}`, `{"kind":"entity","entity_type","entity_id"}`, `{"kind":"other","name"}` or `{"kind":"keep"}`, as set_entity_nominations takes them; `keep` only with an `id`. A candidate names an organization and an organization an alliance.
--   confirmed       - true or false, required on every object.
--   custom_data     - a JSON object, optional, written over the stored custom data key by key. It may not carry `requestedParentOrganization`, which only a parent of kind `other` sets.
--   name, short_name, info, color, image - a JSON object or null; sort_order - an integer or null; subtype, external_id - a string or null. Each optional.
-- On an object with an `id`, a column the object does not state keeps its stored value. Any other key is not read.
--
-- An object creates or updates a nomination; an invitation never deletes one. For a parent of kind `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which refuses a parent of another project and creates the parent's bare, unconfirmed row where it holds none. A new nomination is then inserted with its parent set and without `confirmed`, which the INSERT column grant leaves out, so it starts unconfirmed, and an object that states it confirmed is confirmed by an UPDATE of the new row. An object with an `id` whose values all equal the stored row's is not written; otherwise one UPDATE writes every column at its target, the stated confirmation included. The custom data is the stated object written over the stored one, then `other` sets the requested name, `entity` and `none` remove it, and `keep` leaves it, as `private.nomination_parent_target` states for both nomination writers.
--
-- Every UPDATE reads back the confirmation it wrote. Row-level security refuses an UPDATE without an error, and enforce_nomination_confirmation turns off the confirmation of a row that a caller without `nomination.confirm` edits; so an UPDATE that affects no row, a parent's nomination that cannot be found after it was created, and a confirmation read back other than the one stated each raise SQLSTATE 42501 with `<label> could not be written as stated`. A caller without `nomination.confirm` that states a new nomination confirmed meets enforce_nomination_confirmation's own refusal.
--
-- Where an election's nomination shape requires a candidate's nomination to have a parent or a requested name, `validate_nomination_parent_required` judges it when the transaction ends. A call that wrote a nomination forces that constraint after its last item and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call. A call that wrote none leaves the rows an earlier statement of the caller's transaction left pending to the end of the transaction.
--
-- Each item is checked before anything of it is written, its nominations whole, and is then written in this order: the invitation, the entity's confirmation, the nominations. The function creates no entity and no user and sends nothing. The whole batch is the caller's one transaction: a refused item, a duplicate or an unknown `external_id` raises, and no row of the batch is written. A malformed batch, item or object raises SQLSTATE 22023 naming the item's index, and an object's as `p_invitations[<i>].nominations[<j>]`, and never an address. Refused besides the shapes: `nominations` on a project-scope item or on an item for a faction or an alliance; the nominations of one entity on two items of the batch; nominations for an invited entity that is no entity of p_project_id the caller can read; an `id` that another object of the array names or that names no nomination of the invited entity; an election, a constituency or a round other than the named nomination's.
--
-- Returns a JSON array with one object per item, in order: `id`, `scope`, `target_type`, `target_id`, `role`, `email`, `expires_at`, `code` (the generated code as `XXXX-XXXX-XXXX`, or null on an email item) and `entity_confirmed`, the invited entity's confirmation after the item as the caller reads it (null on a project-scope item and for an entity the caller cannot read). An item that states `nominations` also answers `nominations`: `{"inserted", "updated", "unchanged", "parents_created"}`, each a count of nominations, `parents_created` counting the rows created for a party or an alliance.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_invitations (
  p_project_id uuid,
  p_invitations jsonb,
  p_confirm_entity boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_scope public.grant_scope_type;
  v_role public.grant_role_type;
  v_target_type public.entity_type;
  v_target_id uuid;
  v_external_id text;
  v_email text;
  v_expires_at timestamptz;
  v_id uuid;
  v_code text;
  v_entity_confirmed boolean;
  v_out jsonb := '[]'::jsonb;
  -- The nominations of one item.
  v_has_nominations boolean;
  v_entity_key text;
  v_entity_keys text[] := ARRAY[]::text[];
  v_parent_type public.entity_type;
  v_object jsonb;
  v_object_ordinality bigint;
  v_label text;
  v_checked jsonb;
  v_nomination_id uuid;
  v_named_ids uuid[];
  v_round integer;
  v_stored jsonb;
  v_columns jsonb;
  v_column text;
  v_column_type text;
  v_value jsonb;
  v_item_plan jsonb;
  v_entry jsonb;
  v_is_new boolean;
  v_kind text;
  v_target_parent uuid;
  v_parent_created boolean;
  v_target_custom jsonb;
  v_target jsonb;
  v_row_id uuid;
  v_row_confirmed boolean;
  v_inserted integer;
  v_updated integer;
  v_unchanged integer;
  v_parents_created integer;
  v_wrote_nomination boolean := false;
BEGIN
  IF p_confirm_entity IS NULL THEN
    RAISE EXCEPTION 'create_invitations: p_confirm_entity must be true or false'
      USING ERRCODE = '22023';
  END IF;

  IF p_invitations IS NULL OR jsonb_typeof(p_invitations) <> 'array' THEN
    RAISE EXCEPTION 'create_invitations: p_invitations must be a JSON array'
      USING ERRCODE = '22023';
  END IF;

  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_invitations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'create_invitations: p_invitations[%] must be a JSON object', v_index
        USING ERRCODE = '22023';
    END IF;

    v_scope := COALESCE(v_item ->> 'scope', 'entity')::public.grant_scope_type;
    v_role := COALESCE(v_item ->> 'role', 'editor')::public.grant_role_type;
    v_target_type := (v_item ->> 'target_type')::public.entity_type;
    v_target_id := (v_item ->> 'target_id')::uuid;
    v_external_id := v_item ->> 'external_id';
    v_email := NULLIF(lower(btrim(v_item ->> 'email')), '');
    v_expires_at := (v_item ->> 'expires_at')::timestamptz;

    IF v_scope = 'entity' THEN
      IF v_target_type IS NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] is an entity-scope item and needs a target_type', v_index
          USING ERRCODE = '22023';
      END IF;
      IF num_nonnulls(v_target_id, v_external_id) <> 1 THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] must name its entity by exactly one of target_id and external_id', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_external_id IS NOT NULL THEN
        -- Read as the caller, inside the named project only: an entity of another project, or one the caller cannot see, is not found.
        CASE v_target_type
          WHEN 'candidate' THEN
            SELECT e.id INTO v_target_id FROM public.candidates e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'organization' THEN
            SELECT e.id INTO v_target_id FROM public.organizations e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'faction' THEN
            SELECT e.id INTO v_target_id FROM public.factions e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'alliance' THEN
            SELECT e.id INTO v_target_id FROM public.alliances e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
        END CASE;
        IF v_target_id IS NULL THEN
          RAISE EXCEPTION 'create_invitations: p_invitations[%] names no % with that external_id in the project', v_index, v_target_type
            USING ERRCODE = '22023';
        END IF;
      END IF;
    ELSE
      IF v_external_id IS NOT NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] names an external_id, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_scope = 'project' THEN
        v_target_id := COALESCE(v_target_id, p_project_id);
      END IF;
    END IF;

    -- The item's nominations, checked whole before anything of the item is written. Each object's checked values are kept in the item plan.
    v_has_nominations := v_item ? 'nominations';
    v_item_plan := '[]'::jsonb;
    IF v_has_nominations THEN
      IF v_scope <> 'entity' THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_target_type NOT IN ('candidate', 'organization') THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for % %, which only a candidate or an organization may hold',
          v_index, (CASE v_target_type WHEN 'alliance' THEN 'an' ELSE 'a' END), v_target_type
          USING ERRCODE = '22023';
      END IF;

      PERFORM private.nomination_list_checked(
        v_item -> 'nominations', 'create_invitations', format('p_invitations[%s].nominations', v_index));

      v_entity_key := v_target_type::text || ':' || v_target_id::text;
      IF v_entity_key = ANY (v_entity_keys) THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity an earlier item of the batch states them for', v_index
          USING ERRCODE = '22023';
      END IF;
      v_entity_keys := v_entity_keys || v_entity_key;

      -- Read as the caller, before the invitation's policy has judged the caller: an entity the caller cannot read is no entity of the project, so the refusal says nothing about rows the caller cannot see.
      CASE v_target_type
        WHEN 'candidate' THEN
          PERFORM 1 FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        ELSE
          PERFORM 1 FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity that is no entity of the project', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A candidate stands under an organization and an organization under an alliance.
      v_parent_type := CASE v_target_type
        WHEN 'candidate' THEN 'organization'::public.entity_type
        ELSE 'alliance'::public.entity_type
      END;
      v_named_ids := ARRAY[]::uuid[];

      FOR v_object, v_object_ordinality IN
        SELECT t.item, t.ordinality
        FROM jsonb_array_elements(v_item -> 'nominations') WITH ORDINALITY AS t (item, ordinality)
      LOOP
        v_label := format('p_invitations[%s].nominations[%s]', v_index, v_object_ordinality - 1);

        -- The shape of the object, then the keys only an invitation reads, then the checks that read rows.
        v_checked := private.nomination_object_checked(v_object, v_parent_type, 'create_invitations', v_label);
        v_nomination_id := (v_checked ->> 'id')::uuid;

        IF jsonb_typeof(v_object -> 'confirmed') IS DISTINCT FROM 'boolean' THEN
          RAISE EXCEPTION 'create_invitations: % needs confirmed, which is true or false', v_label
            USING ERRCODE = '22023';
        END IF;

        IF v_object ? 'election_round'
           AND (jsonb_typeof(v_object -> 'election_round') <> 'number'
             OR NOT pg_input_is_valid(v_object ->> 'election_round', 'integer')) THEN
          RAISE EXCEPTION 'create_invitations: % has an election_round that is not an integer', v_label
            USING ERRCODE = '22023';
        END IF;

        SELECT e.current_round INTO v_round
        FROM public.elections e
        WHERE e.id = (v_checked ->> 'election_id')::uuid
          AND e.project_id = p_project_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'create_invitations: % names an election_id that is no election of the project the caller can read', v_label
            USING ERRCODE = '22023';
        END IF;
        IF v_object ? 'election_round' THEN
          v_round := (v_object ->> 'election_round')::integer;
        END IF;

        -- The stated columns, each by its JSON type; the symbol as the shape check trimmed it.
        v_columns := CASE
          WHEN v_object ? 'election_symbol' THEN jsonb_build_object('election_symbol', v_checked ->> 'symbol')
          ELSE '{}'::jsonb
        END;
        FOR v_column, v_column_type IN
          SELECT c.column_name, c.json_type
          FROM (
            VALUES
              (1, 'name', 'a JSON object'),
              (2, 'short_name', 'a JSON object'),
              (3, 'info', 'a JSON object'),
              (4, 'color', 'a JSON object'),
              (5, 'image', 'a JSON object'),
              (6, 'sort_order', 'an integer'),
              (7, 'subtype', 'a string'),
              (8, 'external_id', 'a string')
          ) AS c (ordinal, column_name, json_type)
          ORDER BY c.ordinal
        LOOP
          IF v_object ? v_column THEN
            v_value := v_object -> v_column;
            IF jsonb_typeof(v_value) <> 'null' AND NOT (CASE v_column_type
                WHEN 'a JSON object' THEN jsonb_typeof(v_value) = 'object'
                WHEN 'an integer' THEN jsonb_typeof(v_value) = 'number' AND pg_input_is_valid(v_value #>> '{}', 'integer')
                ELSE jsonb_typeof(v_value) = 'string'
              END) THEN
              RAISE EXCEPTION 'create_invitations: % has a % that is neither % nor null', v_label, v_column, v_column_type
                USING ERRCODE = '22023';
            END IF;
            v_columns := v_columns || jsonb_build_object(v_column, v_value);
          END IF;
        END LOOP;

        IF v_object ? 'custom_data' THEN
          IF jsonb_typeof(v_object -> 'custom_data') <> 'object' THEN
            RAISE EXCEPTION 'create_invitations: % has a custom_data that is not a JSON object', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_object -> 'custom_data') ? c_requested THEN
            RAISE EXCEPTION 'create_invitations: % states requestedParentOrganization in custom_data, which only a parent of kind other sets', v_label
              USING ERRCODE = '22023';
          END IF;
        END IF;

        v_stored := NULL;
        IF v_nomination_id IS NOT NULL THEN
          IF v_nomination_id = ANY (v_named_ids) THEN
            RAISE EXCEPTION 'create_invitations: % names an id that another object of the array names', v_label
              USING ERRCODE = '22023';
          END IF;
          v_named_ids := v_named_ids || v_nomination_id;

          -- The stored row, read as the caller: a nomination of the invited entity in p_project_id.
          SELECT jsonb_build_object(
              'election_id', n.election_id,
              'constituency_id', n.constituency_id,
              'election_round', n.election_round,
              'election_symbol', n.election_symbol,
              'parent_nomination_id', n.parent_nomination_id,
              'custom_data', n.custom_data,
              'confirmed', n.confirmed,
              'name', n.name,
              'short_name', n.short_name,
              'info', n.info,
              'color', n.color,
              'image', n.image,
              'sort_order', n.sort_order,
              'subtype', n.subtype,
              'external_id', n.external_id)
          INTO v_stored
          FROM public.nominations n
          WHERE n.id = v_nomination_id
            AND n.project_id = p_project_id
            AND CASE v_target_type
              WHEN 'candidate' THEN n.candidate_id = v_target_id
              ELSE n.organization_id = v_target_id
            END;
          IF v_stored IS NULL THEN
            RAISE EXCEPTION 'create_invitations: % names an id that is no nomination of the invited entity', v_label
              USING ERRCODE = '22023';
          END IF;

          IF (v_stored ->> 'election_id')::uuid <> (v_checked ->> 'election_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names an election_id other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_stored ->> 'constituency_id')::uuid <> (v_checked ->> 'constituency_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names a constituency_id other than its nomination''s; an invitation moves no nomination', v_label
              USING ERRCODE = '22023';
          END IF;
          IF v_object ? 'election_round'
             AND (v_stored ->> 'election_round')::integer IS DISTINCT FROM v_round THEN
            RAISE EXCEPTION 'create_invitations: % names an election_round other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          v_round := (v_stored ->> 'election_round')::integer;
        ELSIF v_checked ->> 'kind' = 'keep' THEN
          RAISE EXCEPTION 'create_invitations: % keeps a parent, which only an object that names an id may', v_label
            USING ERRCODE = '22023';
        END IF;

        v_item_plan := v_item_plan || jsonb_build_array(jsonb_build_object(
          'label', v_label,
          'id', v_nomination_id,
          'election_id', v_checked -> 'election_id',
          'constituency_id', v_checked -> 'constituency_id',
          'round', v_round,
          'kind', v_checked -> 'kind',
          'parent_entity_id', v_checked -> 'parent_entity_id',
          'name', v_checked -> 'name',
          'confirmed', v_object -> 'confirmed',
          'custom_data', v_object -> 'custom_data',
          'columns', v_columns,
          'stored', v_stored));
      END LOOP;
    END IF;

    INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, expires_at)
    VALUES (p_project_id, v_scope, v_target_type, v_target_id, v_role, v_email, v_expires_at)
    RETURNING id INTO v_id;

    v_code := NULLIF(current_setting('openvaa.generated_invitation_code', true), '');
    PERFORM set_config('openvaa.generated_invitation_code', '', true);

    IF p_confirm_entity AND v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          UPDATE public.candidates e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND btrim(e.first_name) <> '' AND btrim(e.last_name) <> '';
        WHEN 'organization' THEN
          UPDATE public.organizations e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'faction' THEN
          UPDATE public.factions e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'alliance' THEN
          UPDATE public.alliances e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
      END CASE;
    END IF;

    -- The item's nominations, in the order of its array.
    v_inserted := 0;
    v_updated := 0;
    v_unchanged := 0;
    v_parents_created := 0;
    FOR v_entry IN
      SELECT t.entry
      FROM jsonb_array_elements(v_item_plan) WITH ORDINALITY AS t (entry, ordinality)
      ORDER BY t.ordinality
    LOOP
      v_label := v_entry ->> 'label';
      v_stored := v_entry -> 'stored';
      v_is_new := jsonb_typeof(v_stored) IS DISTINCT FROM 'object';
      v_kind := v_entry ->> 'kind';
      v_round := (v_entry ->> 'round')::integer;

      -- The custom data: the stated keys over the stored ones.
      v_target_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
      IF jsonb_typeof(v_entry -> 'custom_data') = 'object' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || (v_entry -> 'custom_data');
      END IF;

      -- The parent and the custom data for the parent's kind; `entity` then asks for the parent's nomination at the contest, created where it holds none.
      SELECT t.parent_nomination_id, t.custom_data
      INTO v_target_parent, v_target_custom
      FROM private.nomination_parent_target(
        v_kind, (v_stored ->> 'parent_nomination_id')::uuid, v_target_custom, v_entry ->> 'name') AS t;

      IF v_kind = 'entity' THEN
        SELECT r.nomination_id, r.created
        INTO v_target_parent, v_parent_created
        FROM private.parent_nomination_resolved(
          p_project_id, v_parent_type, (v_entry ->> 'parent_entity_id')::uuid,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          'create_invitations', v_label) AS r;

        IF v_parent_created THEN
          v_parents_created := v_parents_created + 1;
          v_wrote_nomination := true;
        END IF;
        IF v_target_parent IS NULL THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
      END IF;

      -- What the row is to hold: each column stated, or as stored when not stated.
      v_target := CASE WHEN v_is_new THEN '{}'::jsonb ELSE v_stored END
        || jsonb_build_object(
          'parent_nomination_id', v_target_parent,
          'custom_data', v_target_custom,
          'confirmed', v_entry -> 'confirmed')
        || (v_entry -> 'columns');

      IF v_is_new THEN
        INSERT INTO public.nominations (
          project_id, candidate_id, organization_id,
          election_id, constituency_id, election_round, parent_nomination_id, election_symbol, custom_data,
          name, short_name, info, color, image, sort_order, subtype, external_id
        )
        VALUES (
          p_project_id,
          CASE WHEN v_target_type = 'candidate' THEN v_target_id END,
          CASE WHEN v_target_type = 'organization' THEN v_target_id END,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          v_target_parent, v_target ->> 'election_symbol', v_target_custom,
          NULLIF(v_target -> 'name', 'null'::jsonb), NULLIF(v_target -> 'short_name', 'null'::jsonb),
          NULLIF(v_target -> 'info', 'null'::jsonb), NULLIF(v_target -> 'color', 'null'::jsonb),
          NULLIF(v_target -> 'image', 'null'::jsonb), (v_target ->> 'sort_order')::integer,
          v_target ->> 'subtype', v_target ->> 'external_id'
        )
        RETURNING id INTO v_row_id;
        v_inserted := v_inserted + 1;
        v_wrote_nomination := true;

        -- A new row starts unconfirmed; a stated confirmation is a write of its own.
        IF (v_target ->> 'confirmed')::boolean THEN
          UPDATE public.nominations n
          SET confirmed = true
          WHERE n.id = v_row_id
          RETURNING n.confirmed INTO v_row_confirmed;
          IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
              USING ERRCODE = '42501';
          END IF;
        END IF;
      ELSIF v_target IS NOT DISTINCT FROM v_stored THEN
        v_unchanged := v_unchanged + 1;
      ELSE
        v_row_id := (v_entry ->> 'id')::uuid;
        UPDATE public.nominations n
        SET election_symbol = v_target ->> 'election_symbol',
            parent_nomination_id = v_target_parent,
            custom_data = v_target_custom,
            confirmed = (v_target ->> 'confirmed')::boolean,
            name = NULLIF(v_target -> 'name', 'null'::jsonb),
            short_name = NULLIF(v_target -> 'short_name', 'null'::jsonb),
            info = NULLIF(v_target -> 'info', 'null'::jsonb),
            color = NULLIF(v_target -> 'color', 'null'::jsonb),
            image = NULLIF(v_target -> 'image', 'null'::jsonb),
            sort_order = (v_target ->> 'sort_order')::integer,
            subtype = v_target ->> 'subtype',
            external_id = v_target ->> 'external_id'
        WHERE n.id = v_row_id
        RETURNING n.confirmed INTO v_row_confirmed;
        -- Row-level security hides a row without an error, and a caller without nomination.confirm has its edit unconfirmed: either is a statement not written as stated.
        IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM (v_target ->> 'confirmed')::boolean THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
        v_updated := v_updated + 1;
        v_wrote_nomination := true;
      END IF;
    END LOOP;

    -- The invited entity's confirmation after the item, as the caller reads it.
    v_entity_confirmed := NULL;
    IF v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'organization' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'faction' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.factions e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'alliance' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.alliances e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
    END IF;

    v_out := v_out || jsonb_build_array(
      jsonb_build_object(
        'id', v_id,
        'scope', v_scope,
        'target_type', v_target_type,
        'target_id', v_target_id,
        'role', v_role,
        'email', v_email,
        'expires_at', v_expires_at,
        'code', v_code,
        'entity_confirmed', v_entity_confirmed
      ) || CASE
        WHEN v_has_nominations THEN jsonb_build_object(
          'nominations', jsonb_build_object(
            'inserted', v_inserted,
            'updated', v_updated,
            'unchanged', v_unchanged,
            'parents_created', v_parents_created))
        ELSE '{}'::jsonb
      END
    );
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call when it wrote a nomination, and leave the constraint deferred.
  IF v_wrote_nomination THEN
    SET CONSTRAINTS public.validate_nomination_parent_required IMMEDIATE;
    SET CONSTRAINTS public.validate_nomination_parent_required DEFERRED;
  END IF;

  RETURN v_out;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- access_throttle: the windowed counters of the invitation, recovery and address-confirmation helpers
--
-- One row per key, in one of seven forms:
-- - `link:<project id>:<sha256 hex of the address>` counts the sign-in and recovery mails to one address in one project, one a minute.
-- - `link-address:<sha256 hex of the address>` counts the sign-in and recovery mails to one address in every project together, twenty a day.
-- - `code-bind:<invitation id>` counts the addresses one open code row is bound to, five a day.
-- - `code:<project id>:<code hash>` counts claimant look-ups of one used code, which are password attempts.
-- - `confirm:<user id>` counts one signed-in account's address-confirmation requests, whatever project they name.
-- - `confirm-address:<sha256 hex of the address>` counts the address-confirmation mails to one address, whatever project their requests name.
-- - `caller:<project id>:<address, or the /64 of an IPv6 address>` counts the anonymous account-access operations from one caller in one project, `private.deployment_settings.access_caller_max` per ten minutes, taken by `access_caller_take` from the address the Edge Function passes.
--
-- Only a `caller:` key holds an address in clear, and only while its window runs: each take of `access_caller_take` deletes the `caller:` rows whose window has ended. Every other address is hashed by private.email_hash. A `link:` or `link-address:` key is taken only for an address a mail would go to, a `code-bind:` key only for an open code row, which also bounds how many addresses a code holder can make a mail go to, a `code:` key only for a code that names a claimed row, and a `confirm:` key only for an account the service role read from a signed-in caller's own token that registered in the project the request names, whose count also bounds the `confirm-address:` keys that account's requests can take; so a caller cannot fill the table with keys of its own making. A `caller:` key is the one key derived from a request header: it is taken only from an address Cloudflare names, which a caller cannot choose, and only for a project that exists.
--
-- Only the SECURITY DEFINER functions of this file read or write it: row-level security is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE private.access_throttle (
  key text PRIMARY KEY,
  -- Takes in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; access_throttle_take starts a new one once it has ended.
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.access_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.access_throttle
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- access_throttle_take: count one take against a key
--
-- Returns true when the key, counting this take, is within p_max takes in its current window of p_window. A first take creates the key; a take after the window has ended starts a new window at 1. A refused take is counted and does not move the window. The advisory lock serialises concurrent takes of one key until the transaction ends.
--
-- Only the SECURITY DEFINER functions of this file call it, as their owner, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.access_throttle_take (p_key text, p_max integer, p_window interval) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('access_throttle:' || p_key));

  INSERT INTO private.access_throttle AS t (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN t.window_start + p_window <= now() THEN 1 ELSE t.count + 1 END,
        window_start = CASE WHEN t.window_start + p_window <= now() THEN now() ELSE t.window_start END
  RETURNING t.count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.access_throttle_take (text, integer, interval)
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- email_hash: the form in which an address enters a throttle key
--
-- The sha256 hex of the address trimmed and lower-cased, so the keys of one address agree whatever its case and surrounding white space. Null for a null address, which makes every key built on it null and so matches no row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_hash (p_email text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex');
$$;

--------------------------------------------------------------------------------
-- email_link_slot_key: the `link:` key of an address in a project
--
-- The one-a-minute slot of the sign-in and recovery mails, stated once for the two functions that take it (through email_link_slots_take), the one that gives it back (invitation_link_release) and the trigger that deletes it with its invitation. Null when either argument is null.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_link_slot_key (p_project_id uuid, p_email text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT 'link:' || p_project_id::text || ':' || private.email_hash(p_email);
$$;

--------------------------------------------------------------------------------
-- email_link_slots_take: take the two slots one sign-in or recovery mail to an address spends
--
-- Takes the address's minute slot in the project (email_link_slot_key, one per 60 seconds) and then its day slot in every project together (`link-address:<email_hash>`, twenty a day), and answers true only when both were taken. The minute slot is taken first, so a request inside the minute spends nothing of the day. invitation_link_request and recovery_link_request call it, so a sign-in mail and a recovery mail to one address are limited together.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_link_slots_take (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE plpgsql
SET
  search_path = '' AS $$
BEGIN
  IF NOT private.access_throttle_take(private.email_link_slot_key(p_project_id, p_email), 1, interval '60 seconds') THEN
    RETURN false;
  END IF;

  RETURN private.access_throttle_take('link-address:' || private.email_hash(p_email), 20, interval '1 day');
END;
$$;

-- The three run as the definer functions of this file that call them, so no API role holds EXECUTE.
REVOKE
EXECUTE ON FUNCTION private.email_hash (text),
private.email_link_slot_key (uuid, text),
private.email_link_slots_take (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- access_caller_take: count one anonymous account-access operation against the caller's limit in a project
--
-- Returns 0 when the take is admitted, and otherwise the whole seconds until the caller's window ends, at least 1: `private.deployment_settings.access_caller_max` takes per caller per project per ten minutes. A refused take is counted, as every take of access_throttle_take is.
--
-- The caller is p_address, the address the Edge Function read from `cf-connecting-ip`, keyed as `caller:<project id>:<caller>`, where the caller is the bucket private.client_address_bucket gives it (107-feedback.sql): the host of an IPv4 address, the IPv4 host of an IPv4-mapped IPv6 address and the /64 of any other IPv6 address. The address is trusted only when `private.deployment_settings.behind_cloudflare` is true, because only behind Cloudflare is `cf-connecting-ip` the connecting client rather than a value the client chose. An untrusted, absent, blank or unparseable address, and an id that names no project, are admitted with no row written: such takes would otherwise all share one bucket, so one caller could spend everyone's slots, or fill the table with keys of its own making.
--
-- After its own take, each take deletes the other `caller:` rows whose window has ended, so an address is held in clear only while its window runs. The take holds its key's advisory lock until the transaction ends, so the cleanup must wait for nothing: it leaves out its own key and skips a row another transaction has locked rather than wait for it. A row skipped is deleted by a later take.
--
-- SECURITY DEFINER because the throttle table and the deployment settings are the owner's alone. It checks nothing about its caller, so only the service role may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.access_caller_take (p_project_id uuid, p_address text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_window constant interval := interval '10 minutes';
  v_trusted boolean;
  v_max integer;
  v_caller text;
  v_key text;
  v_admitted boolean;
  v_start timestamptz;
BEGIN
  SELECT s.behind_cloudflare, s.access_caller_max INTO v_trusted, v_max FROM private.deployment_settings s;

  -- A missing settings row reads as false, so the address is then not trusted.
  IF NOT COALESCE(v_trusted, false) THEN
    RETURN 0;
  END IF;

  v_caller := private.client_address_bucket(p_address);
  IF v_caller IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = p_project_id) THEN
    RETURN 0;
  END IF;

  v_key := 'caller:' || p_project_id::text || ':' || v_caller;
  v_admitted := private.access_throttle_take(v_key, v_max, v_window);

  DELETE FROM private.access_throttle t
  WHERE t.key IN (
    SELECT x.key
    FROM private.access_throttle x
    WHERE x.key LIKE 'caller:%'
      AND x.key <> v_key
      AND x.window_start + v_window <= now()
    FOR UPDATE SKIP LOCKED
  );

  IF v_admitted THEN
    RETURN 0;
  END IF;

  SELECT t.window_start INTO v_start FROM private.access_throttle t WHERE t.key = v_key;
  RETURN GREATEST(1, ceil(extract(epoch FROM (v_start + v_window - now())))::integer);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.access_caller_take (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.access_caller_take (uuid, text) TO service_role;

--------------------------------------------------------------------------------
-- cleanup_access_throttle_on_delete: a deleted invitation leaves no throttle key
--
-- Deletes the `link:` keys of the row's address and of its pending address in the row's project, the row's `code-bind:` key and the `code:` key of its code. An invitation that is deleted and seeded again is therefore not answered with the wait its predecessor left behind. An address's `link-address:` key is not deleted: it counts the address's mails in every project, and no one row owns it.
--
-- SECURITY DEFINER because the deleting caller holds nothing on the throttle table. search_path is pinned as on every definer function here.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_access_throttle_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  -- A null address or code hash makes its key null, which matches no row.
  DELETE FROM private.access_throttle t
  WHERE t.key IN (
    private.email_link_slot_key(OLD.project_id, OLD.email),
    private.email_link_slot_key(OLD.project_id, OLD.pending_email),
    'code-bind:' || OLD.id::text,
    'code:' || OLD.project_id::text || ':' || OLD.code_hash
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_access_throttle
AFTER DELETE ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_access_throttle_on_delete ();

-- Not an RPC. A trigger fires whatever EXECUTE its function carries, so nothing is lost by revoking it from the API roles.
REVOKE
EXECUTE ON FUNCTION public.cleanup_access_throttle_on_delete ()
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_mode_allowed: does the project allow the registration mode of this invitation?
--
-- The registration-mode condition, stated once for the functions that read an open invitation: invitation_code_status, invitation_link_request and recovery_link_request (through email_holds_allowed_invitation), email_invitation_hold and claim_invitations. Each treats a row this function refuses as absent.
--
-- WHICH ROWS ARE NOT JUDGED. A project-scope promise is a project editor or admin grant, used in the Admin App, so it is allowed whatever the Contestant App's settings say.
--
-- A CLOSED CONTESTANT APP REFUSES EVERY ENTITY ROW. While the project's stored `access.contestantApp` is the JSON boolean false (private.project_contestant_app_closed), no entity-scope row is allowed, whatever its type or its mode: an invitation that leads to the Contestant App is not honoured while that app is switched off.
--
-- WHICH ROWS ARE JUDGED BY THE MATRIX. An entity-scope row whose target is a candidate or an organization: the registration-mode matrix has a row for those two types and for no other. Such a row is allowed when private.registration_mode_allowed says so for the row's project, its target type and its mode, which it never does while the project's contestant editing is `locked`. The matrix has no row for a faction or an alliance, so such a row is allowed while the Contestant App is not closed.
--
-- A ROW'S MODE is read from which of its two bindings is set: `code` for a row that holds a code hash, `email` for a row bound to an address.
--
-- The callers ask it of open rows only, so a claimed row is never judged: a registration that is finished stays as it is whatever the matrix says later. create_invitations does not ask it, so an invitation can be seeded while its mode is off and is honoured once the mode is on.
--
-- It runs as its caller. The callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invitation_mode_allowed (p_invitation public.invitations) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (p_invitation).scope <> 'entity' THEN true
    WHEN private.project_contestant_app_closed((p_invitation).project_id) THEN false
    WHEN (p_invitation).target_type NOT IN ('candidate', 'organization') THEN true
    ELSE private.registration_mode_allowed(
      (p_invitation).project_id,
      (p_invitation).target_type::text,
      CASE WHEN (p_invitation).code_hash IS NOT NULL THEN 'code' ELSE 'email' END
    )
  END;
$$;

--------------------------------------------------------------------------------
-- invitation_is_open: is this invitation unclaimed and unexpired?
--
-- Open is `claimed_at IS NULL` and no `expires_at`, or one still in the future. Stated once for the functions that read open rows: invitation_link_release, email_holds_allowed_invitation, email_invitation_hold and claim_invitations. invitation_code_status tells the closed states apart by itself, because it answers them differently.
--
-- It runs as its caller. The callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invitation_is_open (p_invitation public.invitations) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT (p_invitation).claimed_at IS NULL
    AND ((p_invitation).expires_at IS NULL OR (p_invitation).expires_at > now());
$$;

--------------------------------------------------------------------------------
-- email_holds_allowed_invitation: is an open invitation of the project, whose registration mode is allowed, addressed to this address?
--
-- True when p_project_id holds an invitation whose `email` is p_email, that is open (private.invitation_is_open) and whose registration mode the project allows (private.invitation_mode_allowed). A code row bound to the address as its pending address does not count: only the code's holder may ask for its mail. Stated once for the two functions that decide whether a mail may go to an address without a code: invitation_link_request and recovery_link_request. public.email_invitation_hold asks the wider question of whether any open invitation, honoured or not, reserves an address.
--
-- p_email is compared as given, so the callers pass it trimmed and lower-cased, the form in which the table stores it.
--
-- It runs as its caller. The two callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_holds_allowed_invitation (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.email = p_email
      AND private.invitation_is_open(i)
      AND private.invitation_mode_allowed(i)
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.invitation_mode_allowed (public.invitations),
private.invitation_is_open (public.invitations),
private.email_holds_allowed_invitation (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- email_holds_grant_in_project: does a user with this confirmed address hold a grant that reaches the project?
--
-- The grant-holder test, stated once for the two functions that decide whether a mail may go to an address: invitation_link_request and recovery_link_request.
--
-- True when a user whose address equals p_email and is confirmed holds a project-scope grant on p_project_id, an entity-scope grant on one of its entities, any global-scope grant, or an account-scope grant on the account p_project_id belongs to, whatever the grant's role. An account grant on another account, a grant in another project only and an unconfirmed address answer false. The reach of one grant is private.grant_reaches_project's, in 301-auth-functions.sql, which the frontend's app-entry gates read through get_user_project_grants.
--
-- The stored address is trimmed and lower-cased before it is compared. p_email is compared as given, so the callers pass it trimmed and lower-cased.
--
-- It runs as its caller. The two callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(btrim(u.email)) = p_email
      AND u.email_confirmed_at IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.grants g
        WHERE g.user_id = u.id
          AND private.grant_reaches_project(g.scope, g.target_type, g.target_id, p_project_id)
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.email_holds_grant_in_project (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_code_status: is this code valid, used or unknown
--
-- Answers one of three words about the row of p_project_id whose code hash equals the hash of the code as typed:
-- - `used` when the row is claimed, which is `claimed_at IS NOT NULL` and so stays true after the claimant is deleted;
-- - `unknown` when the row is unclaimed and expired, when it is open but its registration mode is switched off (private.invitation_mode_allowed), and when the project holds no such row, which includes the code of another project;
-- - `valid` otherwise.
--
-- A switched-off mode has no answer of its own: the status and the body are those of a code that names nothing. The mode is asked only of a row that is open and unexpired, so such a row costs one read of its project's settings row that a code naming nothing does not.
--
-- It returns nothing else about the row, and it counts nothing: an unknown code is defended by its 60 bits.
--
-- SECURITY DEFINER because no API role can read `code_hash`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_code_status (p_project_id uuid, p_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN i.claimed_at IS NOT NULL THEN 'used'
        WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
        WHEN NOT private.invitation_mode_allowed(i) THEN 'unknown'
        ELSE 'valid'
      END
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.code_hash = private.invitation_code_hash(p_code)
    ),
    'unknown'
  );
$$;

--------------------------------------------------------------------------------
-- invitation_link_request: may a sign-in mail go out, and to which address
--
-- Returns the address a sign-in mail may be sent to, or null for "do nothing". The caller sends exactly one mail to a non-null answer, or gives the answer back through invitation_link_release.
--
-- With a code (p_code is not null) the code alone decides:
-- - It names an open row and p_email is not blank: the address is the candidate, unless the row's pending address was bound less than 60 seconds ago, or the address is another than the row's pending one and the row has already been bound to five other addresses that day (its `code-bind:<invitation id>` key). Sending again to the address the row is bound to is not a new binding.
-- - It names a claimed row whose claimant still exists: the candidate is the claimant's own address, whatever p_email holds. The claimant is read without counting against the code's look-up budget, which bounds password attempts; the address's slots below bound these mails.
-- - It names nothing, an expired row, an open row whose registration mode is switched off (private.invitation_mode_allowed), or a claimed row whose claimant is gone: null.
--
-- AN OPEN CODE IS BOUND BEFORE THE ADDRESS IS ASKED ABOUT. The row's pending address is set to the candidate and its 60-second cooldown starts before the address's slots are taken, so what the row's holder can observe afterwards, the row and its cooldown, is the same whether the typed address's slot was free or not. Whether that slot is taken depends on whether the address is eligible without the code, so the holder of one code learns nothing about another address's invitations or grants by asking for it. A request refused by the address's slots has therefore bound the row and mails nothing; a request refused by the cooldown, the binding limit or anything before them has changed no row.
--
-- Without a code, p_email is the candidate when the project holds an open invitation for it whose registration mode is allowed (private.email_holds_allowed_invitation), or when a user with that confirmed address holds a grant that reaches the project (private.email_holds_grant_in_project): a project-scope grant on the project, an entity-scope grant on one of its entities, any global-scope grant, or an account-scope grant on the project's account, whatever its role.
--
-- A candidate then takes its address's two slots through private.email_link_slots_take, and the answer is null when either is taken:
-- - `link:<project id>:<sha256 hex>`, one per address per project per 60 seconds. recovery_link_request takes the same slot, so a recovery mail and a sign-in mail to one address are limited together.
-- - `link-address:<sha256 hex>`, twenty per address per day in every project together and for both kinds of mail. It bounds how often an anonymous caller can have one address mailed, and so how often a caller can stop that address's unopened link, because a later link of either kind stops an earlier one.
-- The minute slot is taken first, so a request inside the minute spends nothing of the day. No slot is taken for an address no mail would go to.
--
-- A switched-off mode is answered as an unknown code or an uninvited address is: null, before a slot is asked for and before anything is written. It changes nothing for a claimed code, whose claimant is still answered, or for a user who holds a grant in the project.
--
-- Eligibility follows the rows as they are: whether an invitation's creator still holds the authority to promise it is not asked.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash` and writes the pending address, none of which an API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_request (
  p_project_id uuid,
  p_email text DEFAULT NULL,
  p_code text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_row public.invitations%ROWTYPE;
  v_candidate text;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_code IS NOT NULL THEN
    SELECT i.* INTO v_row
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN NULL;
    ELSIF v_row.claimed_at IS NOT NULL THEN
      SELECT u.email INTO v_candidate
      FROM auth.users u
      WHERE u.id = v_row.claimed_by
        AND NULLIF(btrim(u.email), '') IS NOT NULL;
    ELSIF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN
      RETURN NULL;
    ELSIF NOT private.invitation_mode_allowed(v_row) THEN
      RETURN NULL;
    ELSIF v_email IS NULL THEN
      RETURN NULL;
    ELSIF v_row.pending_email_at IS NOT NULL AND v_row.pending_email_at + interval '60 seconds' > now() THEN
      RETURN NULL;
    ELSE
      IF v_row.pending_email IS DISTINCT FROM v_email
        AND NOT private.access_throttle_take('code-bind:' || v_row.id::text, 5, interval '1 day') THEN
        RETURN NULL;
      END IF;

      UPDATE public.invitations i
      SET pending_email = v_email, pending_email_at = now()
      WHERE i.id = v_row.id;

      v_candidate := v_email;
    END IF;
  ELSIF v_email IS NOT NULL AND (
    private.email_holds_allowed_invitation(p_project_id, v_email)
    OR private.email_holds_grant_in_project(p_project_id, v_email)
  ) THEN
    v_candidate := v_email;
  END IF;

  IF v_candidate IS NULL OR NOT private.email_link_slots_take(p_project_id, v_candidate) THEN
    RETURN NULL;
  END IF;

  RETURN v_candidate;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_release: give back what a link request took
--
-- For a sign-in or a recovery request that was answered with an address to which no mail was then handed over. It deletes the address's minute slot in the project and, when there was one, gives one take of the address's day slot back; and when p_code names an open row whose pending address is that address, it clears the row's `pending_email_at`, so the same address, and the same binding of the same code, can be asked again at once.
--
-- It changes no claimed row and no other column, and it does nothing for an address that holds no minute slot. A binding counted against a code and a look-up counted against a used code are not given back.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_release (
  p_project_id uuid,
  p_email text,
  p_code text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM private.access_throttle t
  WHERE t.key = private.email_link_slot_key(p_project_id, v_email);

  IF FOUND THEN
    UPDATE private.access_throttle t
    SET count = t.count - 1
    WHERE t.key = 'link-address:' || private.email_hash(v_email)
      AND t.count > 0;
  END IF;

  IF p_code IS NOT NULL THEN
    UPDATE public.invitations i
    SET pending_email_at = NULL
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
      AND private.invitation_is_open(i)
      AND i.pending_email = v_email;
  END IF;
END;
$$;

--------------------------------------------------------------------------------
-- recovery_link_request: which mail, if any, a recovery request for an address earns
--
-- Returns `{"email": <the address, trimmed and lower-cased>, "mail": <one of two words>}`, or null for "do nothing". The caller sends exactly one mail of the named kind to a non-null answer, or gives the answer back through invitation_link_release.
--
-- - `recovery` when a user with that confirmed address holds a grant that reaches p_project_id (private.email_holds_grant_in_project): a project-scope grant on it, an entity-scope grant on one of its entities, any global-scope grant, or an account-scope grant on its account, whatever its role. Whether the user has a password is not asked: opening a recovery link stores none, and the page it leads to sets one.
-- - `sign-in` when no such user exists and the project holds an open, unexpired invitation for the address whose registration mode is allowed (private.email_holds_allowed_invitation). Such an address has no password to recover, so it is sent the mail a sign-in request would have earned it.
-- - null for everything else: an address the project knows nothing of, the holder of an account grant on another account or of grants in other projects only, an unconfirmed address, an expired or a claimed invitation, a null project and a blank address.
--
-- A non-null candidate then takes the address's two slots through private.email_link_slots_take, as invitation_link_request does, and the answer is null when either is taken: one per address per project per 60 seconds, and twenty per address per day in every project together. A later link of either kind stops an unopened earlier one of either kind, so the two requests are limited together. No slot is taken for an address no mail would go to.
--
-- It creates no account, changes no invitation row and binds no address: the slots are all it writes. It takes a project and an address and nothing else, and it returns no user id, grant, name or reason. Which of the three outcomes an address got is known only to whoever can execute it, which is the service role alone.
--
-- SECURITY DEFINER because it reads auth.users and the grants of accounts that are not the caller's.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_mail text;
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF private.email_holds_grant_in_project(p_project_id, v_email) THEN
    v_mail := 'recovery';
  ELSIF private.email_holds_allowed_invitation(p_project_id, v_email) THEN
    v_mail := 'sign-in';
  ELSE
    RETURN NULL;
  END IF;

  IF NOT private.email_link_slots_take(p_project_id, v_email) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('email', v_email, 'mail', v_mail);
END;
$$;

--------------------------------------------------------------------------------
-- email_confirmation_request: may one confirmation mail go to an address for a signed-in account
--
-- Answers true when both of two slots were taken, and false otherwise; a false answer means no mail.
-- - The caller's slot, `confirm:<user id>`: ten requests per user per fifteen minutes, whatever project a request names. The operation that sends this mail also tells its caller whether the address belongs to another account, so the caller's own count bounds how many addresses one account can ask about. It is taken first, and a refused take is counted, so a caller at its limit learns nothing more whatever addresses it sends.
-- - The address's slot, `confirm-address:<email_hash of the address>`: one per address per 60 seconds, whatever project a request names. email_confirmation_release gives it back when no mail was handed over.
--
-- NEITHER SLOT NAMES THE PROJECT. The mail is the same whatever the project, and the change of address it starts is the account's, not a project's; a slot keyed on the project a request names would give a caller a fresh budget for every project id it sends.
--
-- So the address's slot is not the `link:<project id>:...` slot the sign-in and recovery mails take, and a confirmation mail and a sign-in or recovery mail to one address are limited each on its own, at one a minute. They need no shared slot: a confirmation link is a change-of-address link, which neither stops an unopened sign-in or recovery link nor is stopped by one.
--
-- p_project_id is the project the request names. The answer is false, and nothing is written, unless private.identity_registrations holds a row of the user in that project. Only identity_entity_find_or_create writes that table, when an identity provider registers the user in a project, so a request can name no project its account did not register in. This function is the only check of that bound: `account-access` passes the project through.
--
-- A null project, user or address, and a blank address, answer false and write nothing. The user id is the one the service role read from the caller's own token.
--
-- It writes nothing but the two throttle rows. It sends nothing and returns nothing about anyone. SECURITY DEFINER because only definer functions read the registrations and write the throttle table; it trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_confirmation_request (p_project_id uuid, p_user_id uuid, p_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF p_project_id IS NULL OR p_user_id IS NULL OR v_email IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM private.identity_registrations r
    WHERE r.user_id = p_user_id
      AND r.project_id = p_project_id
  ) THEN
    RETURN false;
  END IF;

  IF NOT private.access_throttle_take(
    'confirm:' || p_user_id::text,
    10,
    interval '15 minutes'
  ) THEN
    RETURN false;
  END IF;

  IF NOT private.access_throttle_take(
    'confirm-address:' || private.email_hash(v_email),
    1,
    interval '60 seconds'
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

--------------------------------------------------------------------------------
-- email_confirmation_release: give back the address's slot of a confirmation that mailed nothing
--
-- For an email_confirmation_request that answered true and after which no mail was handed over: the address belonged to another account, or the link could not be issued or mailed. It deletes the address's `confirm-address:` slot, so the address can be asked for again at once. The caller's `confirm:` slot is never given back.
--
-- It does nothing for a null or blank address or for an address that holds no slot, and it writes nothing else. SECURITY DEFINER because only the definer functions write the throttle table; the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_confirmation_release (p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM private.access_throttle t
  WHERE t.key = 'confirm-address:' || private.email_hash(v_email);
END;
$$;

--------------------------------------------------------------------------------
-- invitation_code_claimant_email: the address of the user who claimed a code
--
-- Returns the claimant's address for a claimed code row of p_project_id whose claimant still exists, and null otherwise. The address is what a password sign-in by code is attempted against, so each answer is counted against the code: ten per fifteen minutes, and null beyond that, which is the answer an unknown code gets. A code that names no claimed row, or one whose claimant is gone, is not counted and writes no throttle key.
--
-- The limit is keyed on the code row. A caller that guesses passwords for one code meets it whatever address or header it sends.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash`. It returns a user's address to whoever can execute it, which is the service role alone.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_code_claimant_email (p_project_id uuid, p_code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_hash text := private.invitation_code_hash(p_code);
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.invitations i
  JOIN auth.users u ON u.id = i.claimed_by
  WHERE i.project_id = p_project_id
    AND i.code_hash = v_hash
    AND i.claimed_at IS NOT NULL
    AND NULLIF(btrim(u.email), '') IS NOT NULL;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT private.access_throttle_take('code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes') THEN
    RETURN NULL;
  END IF;

  RETURN v_email;
END;
$$;

--------------------------------------------------------------------------------
-- identity_registrations: the entity an identity provider's user registered in a project, per entity type
--
-- One row per user, project and entity type: the candidate or the organization the user's identity registered there. identity_entity_find_or_create writes a row in the transaction that creates the entity and its editor grant, and reads it on every later sign-in; email_confirmation_request reads it to learn whether the user registered in a project. A row is never rewritten. It goes with its user and with its project; it does not go with its entity, which has no foreign key here, so a row whose entity or grant is gone is how identity_entity_find_or_create knows that an administrator removed what the identity registered.
--
-- Only SECURITY DEFINER functions read or write it: row-level security is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE private.identity_registrations (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL CONSTRAINT identity_registrations_entity_type_check CHECK (entity_type IN ('candidate', 'organization')),
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id, entity_type)
);

-- The primary key leads with user_id; the project's foreign key gets its own index for the cascade.
CREATE INDEX idx_identity_registrations_project_id ON private.identity_registrations (project_id);

ALTER TABLE private.identity_registrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.identity_registrations
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- identity_account_find: the account an identity provider's identity resolves to
--
-- Answers `{"id", "email", "raw_app_meta_data"}` of one row of auth.users, or SQL null when none matches:
-- - the row whose app metadata `identity_match_value` equals p_match_value exactly, when there is one;
-- - otherwise the row whose address, lower-cased, equals p_placeholder_email lower-cased: the placeholder account an earlier sign-in of the identity created, whose metadata the auth service may not have written yet.
-- A null argument matches nothing on its side. Where several rows match one side, the oldest is answered.
--
-- The identity-callback Edge Function asks it before it creates an account and again after a failed invite, so a request that lost the race to create the account goes on with the one another request made. A placeholder account answered by its address may be bound to another identity; identity_entity_find_or_create refuses that account for any other match value.
--
-- It writes nothing. SECURITY DEFINER because it reads auth.users; it trusts its arguments and returns an account's address and metadata, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.identity_account_find (p_match_value text, p_placeholder_email text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object('id', u.id, 'email', u.email, 'raw_app_meta_data', u.raw_app_meta_data)
  FROM auth.users u
  WHERE (p_match_value IS NOT NULL AND u.raw_app_meta_data ->> 'identity_match_value' = p_match_value)
     OR (p_placeholder_email IS NOT NULL AND lower(u.email) = lower(p_placeholder_email))
  ORDER BY
    (p_match_value IS NOT NULL AND u.raw_app_meta_data ->> 'identity_match_value' = p_match_value) DESC NULLS LAST,
    u.created_at,
    u.id
  LIMIT 1;
$$;

--------------------------------------------------------------------------------
-- identity_entity_find_or_create: the entity an identity provider's user registered in a project, found or created
--
-- WHAT IT TRUSTS. Its arguments, as the identity-callback Edge Function sends them: p_user_id is the account the verified identity resolved to, p_project_id and p_entity_type are the project and the type that function chose among public.identity_provider_entity_types, the two names are the ones the provider's assertion carries, and p_identity_metadata is the identity metadata that function builds: the provider, the name of the claim the account is matched on and that claim's value, with a null for each claim key the account's metadata must not keep. Every argument is required and none has a default. It takes no address, and it reads and writes nothing about any account but p_user_id's.
--
-- WHAT IT READS. The user's row of private.identity_registrations for the project and the type, which names the entity this identity registered there.
--
-- WHAT IT ANSWERS. `{"result", "entity_id"}`:
-- - `found`, with the registered id, when the user still holds the `(entity, <type>, <id>, editor)` grant on the registered entity and the entity is still a row of the project;
-- - `gone`, with a null id, when the registration names an entity and its grant or its row is gone. Nothing is created: an administrator who removed either has decided that the identity no longer edits that entity, and identifying again does not undo that;
-- - `created`, with the new entity's id, when the user holds no registration for the project and the type.
--
-- WHAT IT WRITES, on every answer: the identity metadata, into auth.users.raw_app_meta_data, each key given a string set and each key given a null removed, every other member kept; an empty object writes nothing. For `created` only: the registration, one entity, either a candidate with the given names, written confirmed because the strong identity check behind the call vouches for those names, or an organization without a name, written unconfirmed because an identity provider never proves that a person speaks for a party, and the user's editor grant on that entity. Nothing else of auth.users is changed.
--
-- ONE IDENTITY PER ACCOUNT. The account's stored `identity_match_value` is compared with the one p_identity_metadata carries, under the account's row lock and before anything is written or resolved. An account that already holds another value, a value that differs only by case included, is refused: two identities whose match values meet in one placeholder address never share an account, its session or its entity. An account that holds no value yet is bound to the given one by the metadata write. A call whose metadata names no `identity_match_value` binds and compares nothing.
--
-- WHY THE IDENTITY METADATA IS WRITTEN HERE. The auth service's admin update writes the whole of raw_app_meta_data from the copy it read when the update began. Written here, under the row lock and by a merge of the named keys, the identity metadata never replaces a key another sign-in of the same user wrote in the meantime.
--
-- WHY THE ROW LOCK. Two first sign-ins of one identity can arrive at once. SELECT ... FOR UPDATE on the user's row of auth.users holds the second call until the first one's transaction has ended, and the registration is read after the lock is taken and written before the transaction ends, so the second call reads the first one's registration and answers `found` instead of creating a second entity. The registration is inserted before its entity, with ON CONFLICT DO NOTHING on its key, so a registration the lock did not serialise is found and not duplicated.
--
-- REFUSALS, each with nothing written: SQLSTATE 22023 for a null argument, an entity type other than candidate and organization, a user id that names no user, and identity metadata that is not an object of strings and nulls; 22000 for an account whose stored app metadata is not an object; 42501 for an account bound to another identity's match value.
--
-- SECURITY DEFINER because it reads and writes auth.users and private.identity_registrations and writes the entity tables and public.grants, in one transaction. It trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.identity_entity_find_or_create (
  p_user_id uuid,
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_first_name text,
  p_last_name text,
  p_identity_metadata jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_metadata jsonb;
  v_stored_match text;
  v_result text;
  v_entity_id uuid;
  v_registered uuid;
BEGIN
  IF p_user_id IS NULL
     OR p_project_id IS NULL
     OR p_entity_type IS NULL
     OR p_first_name IS NULL
     OR p_last_name IS NULL
     OR p_identity_metadata IS NULL THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: every argument is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_type NOT IN ('candidate', 'organization') THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the entity type must be candidate or organization'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_identity_metadata) <> 'object'
     OR EXISTS (
       SELECT 1
       FROM jsonb_each(p_identity_metadata) AS m (key, value)
       WHERE jsonb_typeof(m.value) NOT IN ('string', 'null')
     ) THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: p_identity_metadata must be an object of strings and nulls'
      USING ERRCODE = '22023';
  END IF;

  SELECT u.raw_app_meta_data INTO v_metadata
  FROM auth.users u
  WHERE u.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: p_user_id names no user'
      USING ERRCODE = '22023';
  END IF;

  IF v_metadata IS NOT NULL AND jsonb_typeof(v_metadata) <> 'object' THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the account''s app metadata is malformed'
      USING ERRCODE = '22000';
  END IF;

  -- Compare and bind: the stored match value, when there is one, must be the given one.
  v_stored_match := v_metadata ->> 'identity_match_value';
  IF p_identity_metadata ? 'identity_match_value'
     AND v_stored_match IS NOT NULL
     AND (p_identity_metadata ->> 'identity_match_value') IS DISTINCT FROM v_stored_match THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the account is bound to another identity'
      USING ERRCODE = '42501';
  END IF;

  IF p_identity_metadata <> '{}'::jsonb THEN
    UPDATE auth.users u
    SET raw_app_meta_data = (COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_strip_nulls(p_identity_metadata)) - ARRAY(
      SELECT m.key
      FROM jsonb_each(p_identity_metadata) AS m (key, value)
      WHERE jsonb_typeof(m.value) = 'null'
    )
    WHERE u.id = p_user_id;
  END IF;

  SELECT r.entity_id INTO v_registered
  FROM private.identity_registrations r
  WHERE r.user_id = p_user_id
    AND r.project_id = p_project_id
    AND r.entity_type = p_entity_type;

  IF NOT FOUND THEN
    v_entity_id := gen_random_uuid();

    INSERT INTO private.identity_registrations (user_id, project_id, entity_type, entity_id)
    VALUES (p_user_id, p_project_id, p_entity_type, v_entity_id)
    ON CONFLICT (user_id, project_id, entity_type) DO NOTHING
    RETURNING entity_id INTO v_registered;

    IF v_registered IS NOT NULL THEN
      IF p_entity_type = 'candidate' THEN
        INSERT INTO public.candidates (id, project_id, first_name, last_name, confirmed)
        VALUES (v_entity_id, p_project_id, p_first_name, p_last_name, true);
      ELSE
        INSERT INTO public.organizations (id, project_id, confirmed)
        VALUES (v_entity_id, p_project_id, false);
      END IF;

      INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (p_user_id, 'entity', p_entity_type, v_entity_id, 'editor');

      v_result := 'created';
    ELSE
      SELECT r.entity_id INTO v_registered
      FROM private.identity_registrations r
      WHERE r.user_id = p_user_id
        AND r.project_id = p_project_id
        AND r.entity_type = p_entity_type;
    END IF;
  END IF;

  IF v_result IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = p_user_id
        AND g.scope = 'entity'
        AND g.target_type = p_entity_type
        AND g.target_id = v_registered
        AND g.role = 'editor'
    ) AND (
      CASE p_entity_type
        WHEN 'candidate' THEN EXISTS (
          SELECT 1 FROM public.candidates c WHERE c.id = v_registered AND c.project_id = p_project_id
        )
        ELSE EXISTS (
          SELECT 1 FROM public.organizations o WHERE o.id = v_registered AND o.project_id = p_project_id
        )
      END
    ) THEN
      v_result := 'found';
      v_entity_id := v_registered;
    ELSE
      v_result := 'gone';
      v_entity_id := NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object('result', v_result, 'entity_id', v_entity_id);
END;
$$;

--------------------------------------------------------------------------------
-- email_invitation_hold: which hold does an open invitation of a project have on an address?
--
-- An invitation of p_project_id holds the address when it is open (private.invitation_is_open) and has the address, trimmed and lower-cased, as its `email` or as its `pending_email`. The answer is:
-- - `allowed` when such an invitation holds the address and the project honours at least one of them (private.invitation_mode_allowed);
-- - `held` when such invitations hold the address and the project honours none of them, because the registration mode of each is off or the Contestant App is closed. The address stays reserved: a promise waiting for its address is the address's whatever modes the project allows at the moment;
-- - `none` when no open invitation of the project holds the address.
--
-- It differs from private.email_holds_allowed_invitation, which answers only the first case and reads `email` alone: a code's pending address reserves the address here, but no mail goes to it without the code.
--
-- The stored `email` and `pending_email` are held trimmed and lower-cased by the table's CHECKs, so the argument is put in that form and compared with them as stored.
--
-- A null project, a null address and a blank address answer `none`.
--
-- WHO ASKS. The `confirm-address` operation of the `account-access` Edge Function, for an address a signed-in account an identity provider made has typed, after it has taken that account's and that address's slots through email_confirmation_request. `allowed` is reported to the caller as `invited`: the address is held by an invitation, which the person should sign in with instead. `held` is reported as the address being in use, because the invitation that reserves it would not be honoured. The answer is therefore an invitation-existence answer, bounded by those two slots and given only to the holder of such an account's own token.
--
-- It writes nothing. SECURITY DEFINER because no API role can read `pending_email`, nor the invitations of a project it does not administer; it trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_invitation_hold (p_project_id uuid, p_email text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN bool_or(private.invitation_mode_allowed(i)) THEN 'allowed'
    WHEN count(*) > 0 THEN 'held'
    ELSE 'none'
  END
  FROM public.invitations i
  WHERE i.project_id = p_project_id
    AND private.invitation_is_open(i)
    AND (
      i.email = NULLIF(lower(btrim(p_email)), '')
      OR i.pending_email = NULLIF(lower(btrim(p_email)), '')
    );
$$;

-- service_role only. Each of the ten is SECURITY DEFINER and checks nothing about its caller: published to an API role, the code check would be a code oracle, the link request and the recovery request account and invitation oracles that also write, the claimant look-up would hand out a user's address, the confirmation request and its release would take or give back any account's and any address's slot, the account look-up would hand out any identity's account and its address, the find-or-create would make any user the editor of a new entity, and the invitation-hold check would answer, for any address and without a limit, whether it is invited. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
REVOKE
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.recovery_link_request (uuid, text),
public.email_confirmation_request (uuid, uuid, text),
public.email_confirmation_release (text),
public.identity_account_find (text, text),
public.identity_entity_find_or_create (uuid, uuid, public.entity_type, text, text, jsonb),
public.email_invitation_hold (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.recovery_link_request (uuid, text),
public.email_confirmation_request (uuid, uuid, text),
public.email_confirmation_release (text),
public.identity_account_find (text, text),
public.identity_entity_find_or_create (uuid, uuid, public.entity_type, text, text, jsonb),
public.email_invitation_hold (uuid, text) TO service_role;

--------------------------------------------------------------------------------
-- claim_invitations RPC: turn the caller's open invitations into grants
--
-- WHAT IT TRUSTS. One thing: the caller's own confirmed address, read from the caller's row of auth.users, which is the row `auth.uid()` names. A user whose `email_confirmed_at` is null, or whose address is blank, claims nothing. An account whose app metadata names an identity provider claims nothing either, whatever its address: such an account was created by an identity provider, and its address is not what decides who the person is.
--
-- WHAT IT IGNORES. It takes no address, no user id and no invitation id, so it cannot be pointed at another person's invitation, and it never reads the token's `email` claim, which can be older than the row. p_project_id only chooses which of the caller's own invitations are looked at.
--
-- WHAT IT CANNOT KNOW. The database sees that an address is confirmed and not how it came to be. This function therefore depends on the auth service refusing public sign-up and requiring confirmation by mail: where a visitor can create an account for an address without opening a mail sent to it, that visitor can claim the address's invitations. Nothing here guards against that configuration.
--
-- WHAT IT MATCHES. The rows of p_project_id that are open (private.invitation_is_open) and whose `email` is the caller's address, plus the code rows whose pending address is. A code row with no pending address, or with another one, is claimed by nobody. A row whose registration mode is switched off (private.invitation_mode_allowed) is not matched either: it is neither claimed nor skipped, and it stays open.
--
-- WHAT IT WRITES. One row of public.grants per claimed invitation, copying the invitation's four columns, and on the invitation `claimed_by`, `claimed_at` and a cleared pending address. It confirms no entity and creates nothing else. Whether the invitation's creator still holds the authority to promise the grant is not asked: a row that exists is honoured, and a promise is withdrawn by deleting its row.
--
-- EACH ROW BY ITSELF. Rows are taken in the order they were created, and each is claimed or skipped on its own:
-- - an entity-scope row whose target is no longer an entity of the row's project is skipped with the reason `target_not_in_project` and stays open (no foreign key holds the target, so it is asked again here);
-- - a grant the caller already holds exactly is left as it is, by `ON CONFLICT` on `grants_user_scope_target_role_key`: the row is marked claimed and no second grant is written;
-- - a unique violation on `idx_grants_one_candidate_editor` means another user edits that candidate: the row is skipped with the reason `candidate_has_editor` and stays open;
-- - any other violation is raised and undoes the call.
-- The grant's own key is the conflict target, rather than being told apart by the constraint a violation names, because PostgreSQL probes a table's unique indexes in the order of their OIDs: an exact duplicate of a candidate's editor grant violates both indexes, and which one it names would change when one of them is rebuilt.
--
-- Returns `{"claimed": [...], "skipped": [...]}`. Each element holds `scope`, `target_type`, `target_id` and `role`, and a skipped one also `reason`. No address, code or invitation id is returned; whether the caller's account holds a password is get_caller_account_state's answer (503-entity-rpcs.sql). A second call claims nothing.
--
-- A grant reaches a token only when one is issued, so a caller refreshes its session after a claim that returned a non-empty `claimed` and before it reads anything the grant opens.
--
-- SECURITY DEFINER because it reads auth.users, writes public.grants and updates public.invitations, none of which the caller can. It answers for `auth.uid()`, which neither `anon` nor the service role has, so `authenticated` alone holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invitations (p_project_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_email text;
  v_row public.invitations%ROWTYPE;
  v_spec jsonb;
  v_constraint text;
  v_skip_reason text;
  v_claimed jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT lower(btrim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = v_uid
      AND u.email_confirmed_at IS NOT NULL
      AND u.raw_app_meta_data ->> 'identity_provider' IS NULL
      AND NULLIF(btrim(u.email), '') IS NOT NULL;
  END IF;

  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped);
  END IF;

  FOR v_row IN
    SELECT i.*
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND private.invitation_is_open(i)
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
      AND private.invitation_mode_allowed(i)
    ORDER BY i.created_at, i.id
    FOR UPDATE
  LOOP
    v_spec := jsonb_build_object(
      'scope', v_row.scope,
      'target_type', v_row.target_type,
      'target_id', v_row.target_id,
      'role', v_row.role
    );
    v_skip_reason := NULL;

    IF v_row.scope = 'entity'
       AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
      v_skip_reason := 'target_not_in_project';
    ELSE
      BEGIN
        INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
        VALUES (v_uid, v_row.scope, v_row.target_type, v_row.target_id, v_row.role)
        ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;
      EXCEPTION
        WHEN unique_violation THEN
          GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
          IF v_constraint = 'idx_grants_one_candidate_editor' THEN
            v_skip_reason := 'candidate_has_editor';
          ELSE
            RAISE;
          END IF;
      END;
    END IF;

    IF v_skip_reason IS NOT NULL THEN
      v_skipped := v_skipped || jsonb_build_array(v_spec || jsonb_build_object('reason', v_skip_reason));
    ELSE
      UPDATE public.invitations i
      SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL
      WHERE i.id = v_row.id;
      v_claimed := v_claimed || jsonb_build_array(v_spec);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.claim_invitations (uuid)
FROM
  PUBLIC,
  anon,
  service_role;

GRANT
EXECUTE ON FUNCTION public.claim_invitations (uuid) TO authenticated;
