-- 49-invitation-link-bounds.test.sql: what a link request with a code reveals, and the bounds over time on the sign-in and recovery mails
--
-- Four properties of `invitation_link_request` and `recovery_link_request`:
--
-- 1. WITH AN OPEN CODE, NOTHING THE CODE HOLDER CAN OBSERVE DEPENDS ON THE TYPED ADDRESS. The code's own cooldown is spent and the address is bound before the address's slots are asked, so a request whose typed address is refused by its slot leaves the code row exactly as a request whose typed address is free does. The probe: ask for the typed address without the code (which takes its slot only when the address is eligible), ask with the code for that address, then ask with the code for the code holder's own address. The third answer, and the row's end state, are the same for an eligible and for an unknown address.
-- 2. AN OPEN CODE IS BOUND TO A BOUNDED NUMBER OF ADDRESSES. Each binding to another address than the row's pending one counts against the row, five per day; a request for the address the row is already bound to counts nothing.
-- 3. ONE ADDRESS IS MAILED A BOUNDED NUMBER OF LINKS, WHATEVER PROJECT. Besides the per-project minute slot, every answered sign-in or recovery request takes the address's own slot, twenty per day across every project, and a refused take writes no binding. invitation_link_release gives one take of it back.
-- 4. A LINK REQUEST WITH A USED CODE DOES NOT SPEND THE CODE'S SIGN-IN BUDGET. The claimant's address is read without counting against the `code:` key, which bounds password attempts.
--
-- Every assertion's description begins with `BOUNDS: `. The functions are the service role's; the fixture role calls them and moves the throttle rows.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, test_user_id), 506-invitation-rpcs.sql (create_invitations, the link and recovery requests, invitation_link_release, invitation_code_claimant_email and the throttle table).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (17);

-- Create test fixture data
SELECT
  create_test_data ();

-- Both projects serve candidates and allow the email and the code mode for them.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "entityTypes": ["candidate"],
      "registrationModes": {
        "candidate": ["email", "code"]
      }
    }'::jsonb
  )
WHERE
  project_id IN (test_id ('project_a'), test_id ('project_b'));

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '49490000-0000-4000-8000-0000000000c1',
    test_id ('project_a'),
    'Probe',
    'Eligible'
  ),
  (
    '49490000-0000-4000-8000-0000000000c2',
    test_id ('project_a'),
    'Probe',
    'Unknown'
  ),
  (
    '49490000-0000-4000-8000-0000000000c3',
    test_id ('project_a'),
    'Bind',
    'Cap'
  ),
  (
    '49490000-0000-4000-8000-0000000000c4',
    test_id ('project_a'),
    'Used',
    'Code'
  ),
  (
    '49490000-0000-4000-8000-0000000000c5',
    test_id ('project_a'),
    'Invited',
    'Address'
  ),
  (
    '49490000-0000-4000-8000-0000000000c6',
    test_id ('project_a'),
    'Mailed',
    'Address'
  ),
  (
    '49490000-0000-4000-8000-0000000000b6',
    test_id ('project_b'),
    'Mailed',
    'Elsewhere'
  );

-- `t49.a` holds, by index: 0 the code of the eligible-address probe; 1 the code of the unknown-address probe; 2 the code whose bindings are counted; 3 the code that is claimed; 4 the email invitation that makes probe.invited@ eligible; 5 the email invitation of the address whose mails are counted. `t49.b` holds that address's email invitation in project B.
DO $$
BEGIN
  PERFORM set_config(
    't49.a',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c1"},
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c2"},
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c3"},
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c4"},
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c5","email":"probe.invited@test.example"},
        {"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000c6","email":"mailed.often@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't49.b',
    public.create_invitations(
      test_id('project_b'),
      '[{"target_type":"candidate","target_id":"49490000-0000-4000-8000-0000000000b6","email":"mailed.often@test.example"}]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

-- The code of `t49.a` at an index.
CREATE FUNCTION pg_temp.t49_code (p_index integer) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT current_setting('t49.a')::jsonb -> p_index ->> 'code';
$$;

-- The open code row of `t49.a` at an index, as `<pending address or -> <cooling while its 60-second cooldown runs, else free>`.
CREATE FUNCTION pg_temp.t49_row (p_index integer) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(i.pending_email, '-') || ' ' || CASE WHEN i.pending_email_at + interval '60 seconds' > now() THEN 'cooling' ELSE 'free' END
  FROM public.invitations i
  WHERE i.id = (current_setting('t49.a')::jsonb -> p_index ->> 'id')::uuid;
$$;

-- End the cooldown of every open code row and every per-project minute slot, as if more than a minute had passed. Day-long keys are left as they are.
CREATE FUNCTION pg_temp.t49_next_minute () RETURNS void LANGUAGE sql AS $$
  UPDATE public.invitations SET pending_email_at = pending_email_at - interval '2 minutes' WHERE pending_email_at IS NOT NULL;
  DELETE FROM private.invitation_throttle WHERE key LIKE 'link:%';
$$;

-- =====================================================================
-- 1. With an open code, the outcome does not depend on the typed address
-- =====================================================================
-- The eligible probe. Its first request takes probe.invited@'s minute slot, because that address has an open invitation.
SELECT
  set_config(
    't49.p1',
    concat_ws(
      '|',
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'probe.invited@test.example',
          NULL
        ),
        '-'
      ),
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'probe.invited@test.example',
          pg_temp.t49_code (0)
        ),
        '-'
      ),
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'code.holder@test.example',
          pg_temp.t49_code (0)
        ),
        '-'
      )
    ),
    true
  );

-- The unknown probe. Its first request takes nothing, because the address is unknown to the project.
SELECT
  set_config(
    't49.p2',
    concat_ws(
      '|',
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'probe.unknown@test.example',
          NULL
        ),
        '-'
      ),
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'probe.unknown@test.example',
          pg_temp.t49_code (1)
        ),
        '-'
      ),
      COALESCE(
        public.invitation_link_request (
          test_id ('project_a'),
          'code.holder@test.example',
          pg_temp.t49_code (1)
        ),
        '-'
      )
    ),
    true
  );

SELECT
  is (
    split_part(current_setting('t49.p1'), '|', 3),
    split_part(current_setting('t49.p2'), '|', 3),
    'BOUNDS: after asking with a code for an eligible address, the code holder''s request for their own address is answered as after asking for an unknown address'
  );

SELECT
  is (
    split_part(current_setting('t49.p1'), '|', 3),
    '-',
    'BOUNDS: and in both cases it is refused by the code''s cooldown'
  );

SELECT
  is (
    pg_temp.t49_row (0),
    'probe.invited@test.example cooling',
    'BOUNDS: the code asked for an eligible address whose slot was taken is bound to it, with its cooldown spent'
  );

SELECT
  is (
    pg_temp.t49_row (1),
    'probe.unknown@test.example cooling',
    'BOUNDS: the code asked for an unknown address is bound to it, with its cooldown spent, the same end state'
  );

SELECT
  is (
    split_part(current_setting('t49.p1'), '|', 2) || ' ' || split_part(current_setting('t49.p2'), '|', 2),
    '- probe.unknown@test.example',
    'BOUNDS: a mail still goes to a typed address only when its slot is free: none to the eligible address the minute it was mailed, one to the unknown address'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          t.count::text,
          ','
          ORDER BY
            t.key
        )
      FROM
        private.invitation_throttle t
      WHERE
        t.key IN (
          'code-bind:' || (current_setting('t49.a')::jsonb -> 0 ->> 'id'),
          'code-bind:' || (current_setting('t49.a')::jsonb -> 1 ->> 'id')
        )
    ),
    '1,1',
    'BOUNDS: each probe counted one binding against its code, whatever the typed address'
  );

-- =====================================================================
-- 2. An open code is bound to at most five addresses a day
-- =====================================================================
DO $$
DECLARE
  v_answered integer := 0;
BEGIN
  FOR n IN 1..5 LOOP
    PERFORM pg_temp.t49_next_minute();
    IF public.invitation_link_request(test_id('project_a'), 'bound.' || n || '@test.example', pg_temp.t49_code(2)) IS NOT NULL THEN
      v_answered := v_answered + 1;
    END IF;
  END LOOP;
  PERFORM set_config('t49.bound', v_answered::text, true);
END;
$$;

SELECT
  is (
    current_setting('t49.bound'),
    '5',
    'BOUNDS: an open code is bound to five addresses in turn, each a minute apart'
  );

SELECT
  pg_temp.t49_next_minute ();

SELECT
  is (
    COALESCE(
      public.invitation_link_request (
        test_id ('project_a'),
        'bound.6@test.example',
        pg_temp.t49_code (2)
      ),
      '-'
    ) || ' ' || pg_temp.t49_row (2),
    '- bound.5@test.example free',
    'BOUNDS: a sixth address the same day is refused, and the code stays bound to the fifth with no cooldown spent'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bound.5@test.example',
      pg_temp.t49_code (2)
    ),
    'bound.5@test.example',
    'BOUNDS: a request for the address the code is already bound to is still answered: sending again is not a new binding'
  );

-- =====================================================================
-- 3. One address is mailed at most twenty links a day, across projects and kinds
-- =====================================================================
DO $$
DECLARE
  v_answered integer := 0;
BEGIN
  FOR n IN 1..10 LOOP
    PERFORM pg_temp.t49_next_minute();
    IF public.invitation_link_request(test_id('project_a'), 'mailed.often@test.example', NULL) IS NOT NULL THEN
      v_answered := v_answered + 1;
    END IF;
  END LOOP;
  FOR n IN 1..5 LOOP
    PERFORM pg_temp.t49_next_minute();
    IF public.invitation_link_request(test_id('project_b'), 'mailed.often@test.example', NULL) IS NOT NULL THEN
      v_answered := v_answered + 1;
    END IF;
  END LOOP;
  FOR n IN 1..5 LOOP
    PERFORM pg_temp.t49_next_minute();
    IF public.recovery_link_request(test_id('project_b'), 'mailed.often@test.example') IS NOT NULL THEN
      v_answered := v_answered + 1;
    END IF;
  END LOOP;
  PERFORM set_config('t49.mailed', v_answered::text, true);
END;
$$;

SELECT
  is (
    current_setting('t49.mailed'),
    '20',
    'BOUNDS: twenty requests a minute apart, in two projects and of both kinds, are each answered'
  );

SELECT
  pg_temp.t49_next_minute ();

SELECT
  is (
    COALESCE(
      public.invitation_link_request (
        test_id ('project_a'),
        'mailed.often@test.example',
        NULL
      ),
      '-'
    ) || ' ' || COALESCE(
      public.recovery_link_request (
        test_id ('project_b'),
        'mailed.often@test.example'
      ) ->> 'mail',
      '-'
    ),
    '- -',
    'BOUNDS: the twenty-first of either kind in either project is refused'
  );

SELECT
  pg_temp.t49_next_minute ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        private.invitation_throttle t
      WHERE
        t.key LIKE 'link-address:%'
        AND t.key LIKE '%' || encode(
          sha256(convert_to('mailed.often@test.example', 'UTF8')),
          'hex'
        )
    ),
    '1',
    'BOUNDS: the address''s day slot is one key, named by the address alone'
  );

-- A request answered for an address and then given back, because no mail was handed over, leaves the day's count where it was.
SELECT
  pg_temp.t49_next_minute ();

UPDATE private.invitation_throttle
SET
  count = 19
WHERE
  key = 'link-address:' || encode(
    sha256(convert_to('mailed.often@test.example', 'UTF8')),
    'hex'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mailed.often@test.example',
      NULL
    ),
    'mailed.often@test.example',
    'BOUNDS: with one take left the request is answered'
  );

SELECT
  public.invitation_link_release (
    test_id ('project_a'),
    'mailed.often@test.example'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mailed.often@test.example',
      NULL
    ),
    'mailed.often@test.example',
    'BOUNDS: after invitation_link_release the take is given back, and the next request in the same minute is answered'
  );

SELECT
  pg_temp.t49_next_minute ();

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mailed.often@test.example',
      NULL
    ),
    NULL,
    'BOUNDS: and the day''s twentieth take is then spent'
  );

-- =====================================================================
-- 4. A link request with a used code does not spend the code's sign-in budget
-- =====================================================================
UPDATE public.invitations
SET
  claimed_at = now(),
  claimed_by = test_user_id ('candidate_b')
WHERE
  id = (current_setting('t49.a')::jsonb -> 3 ->> 'id')::uuid;

DO $$
BEGIN
  FOR n IN 1..10 LOOP
    PERFORM pg_temp.t49_next_minute();
    PERFORM public.invitation_link_request(test_id('project_a'), 'anyone@test.example', pg_temp.t49_code(3));
  END LOOP;
END;
$$;

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        private.invitation_throttle t
      WHERE
        t.key LIKE 'code:%'
    ),
    '0',
    'BOUNDS: ten link requests with a used code write no key of the code''s sign-in budget'
  );

SELECT
  ok (
    public.invitation_code_claimant_email (test_id ('project_a'), pg_temp.t49_code (3)) IS NOT NULL,
    'BOUNDS: and the claimant can still be signed in with the code'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
