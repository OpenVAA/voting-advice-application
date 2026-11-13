-- Exercises the Phase 174 prototype on the private throwaway database. Everything runs in one transaction and rolls back.
\set QUIET on
\pset format unaligned
\pset tuples_only on
BEGIN;

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO anon, authenticated, service_role;

-- Run one statement as an API role with the claim the access-token hook would build from public.grants.
CREATE FUNCTION t.run (p_label text, p_role text, p_uid uuid, p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_claims jsonb;
  v_result text;
  v_state text; v_msg text; v_constraint text;
BEGIN
  IF p_uid IS NOT NULL THEN
    v_claims := public.custom_access_token_hook(jsonb_build_object('user_id', p_uid, 'claims', jsonb_build_object('sub', p_uid, 'role', p_role))) -> 'claims';
  ELSE
    v_claims := jsonb_build_object('role', p_role);
  END IF;
  PERFORM set_config('request.jwt.claims', v_claims::text, true);
  PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::text, ''), true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql INTO v_result;
    v_result := 'OK ' || COALESCE(v_result, '(null)');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_msg = MESSAGE_TEXT, v_constraint = CONSTRAINT_NAME;
    v_result := 'REFUSED ' || v_state || COALESCE(' [' || NULLIF(v_constraint, '') || ']', '') || ' ' || left(v_msg, 110);
  END;
  RESET ROLE;
  RETURN rpad(p_label, 78) || ' -> ' || v_result;
END;
$$;

-- Fixture ---------------------------------------------------------------------
INSERT INTO public.accounts (id, name) VALUES ('00000000-0000-0000-0000-0000000000b0', 'Account B');
INSERT INTO public.projects (id, account_id, name) VALUES ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b0', 'Project B');
INSERT INTO public.candidates (id, project_id, first_name, last_name, external_id) VALUES
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000001', 'Ada', 'One', 'c1'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000001', 'Bea', 'Two', 'c2'),
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-000000000001', '', '', 'c3-nameless'),
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-000000000001', 'Dee', 'Four', 'c4'),
  ('00000000-0000-0000-0000-00000000c0b1', '00000000-0000-0000-0000-0000000000b1', 'Other', 'Project', 'cb');
INSERT INTO public.organizations (id, project_id, name, external_id) VALUES
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000001', '{"en":"Org One"}', 'o1'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000001', NULL, 'o2-nameless');

CREATE FUNCTION t.mkuser (p_n int, p_email text, p_confirmed boolean) RETURNS uuid LANGUAGE sql AS $$
  INSERT INTO auth.users (id, instance_id, aud, role, email, email_confirmed_at, encrypted_password, created_at, updated_at)
  VALUES (('aaaaaaaa-0000-0000-0000-0000000000' || lpad(p_n::text, 2, '0'))::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          p_email, CASE WHEN p_confirmed THEN now() END, '', now(), now())
  RETURNING id;
$$;
SELECT t.mkuser(11, 'projeditor@t.test', true), t.mkuser(12, 'projadmin@t.test', true), t.mkuser(13, 'acctadmin@t.test', true),
       t.mkuser(14, 'root@t.test', true), t.mkuser(15, 'entityeditor@t.test', true),
       t.mkuser(21, 'invitee1@t.test', true), t.mkuser(22, 'invitee2@t.test', false), t.mkuser(23, 'stranger@t.test', true),
       t.mkuser(24, 'codeholder@t.test', true), t.mkuser(25, 'second@t.test', true) \gset u_
INSERT INTO public.grants (user_id, scope, target_type, target_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000011', 'project', NULL, '00000000-0000-0000-0000-000000000001', 'editor'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'project', NULL, '00000000-0000-0000-0000-000000000001', 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'account', NULL, (SELECT account_id FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000001'), 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000014', 'global', NULL, NULL, 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000015', 'entity', 'candidate', '00000000-0000-0000-0000-00000000c002', 'editor');

\set P1 '''00000000-0000-0000-0000-000000000001'''
\set PE '''aaaaaaaa-0000-0000-0000-000000000011'''
\set PA '''aaaaaaaa-0000-0000-0000-000000000012'''
\set AA '''aaaaaaaa-0000-0000-0000-000000000013'''
\set ROOT '''aaaaaaaa-0000-0000-0000-000000000014'''
\set EE '''aaaaaaaa-0000-0000-0000-000000000015'''

\echo '== A. Authority map through the RPC (INV-01, D-09) =='
SELECT t.run('project editor: (entity,candidate,c1,editor) by email', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c1","email":" Invitee1@T.test "}]')->0->>'email'$$);
SELECT t.run('project editor: (entity,organization,o1,editor) by code', 'authenticated', :PE, $$SELECT (public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"organization","external_id":"o1"}]')->0->>'code') ~ '^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$'$$);
SELECT t.run('project editor: (project,editor)  [self-promotion case]', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"editor","email":"x@t.test"}]')$$);
SELECT t.run('project editor: (project,admin)', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"admin","email":"x@t.test"}]')$$);
SELECT t.run('project admin:  (project,editor)', 'authenticated', :PA, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"editor","email":"neweditor@t.test"}]')->0->>'role'$$);
SELECT t.run('project admin:  (project,admin)   [peer-level]', 'authenticated', :PA, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"admin","email":"x@t.test"}]')$$);
SELECT t.run('account admin:  (project,admin)', 'authenticated', :AA, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"admin","email":"newadmin@t.test"}]')->0->>'role'$$);
SELECT t.run('root: (account, …)', 'authenticated', :ROOT, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"account","role":"admin","target_id":"00000000-0000-0000-0000-0000000000b0","email":"x@t.test"}]')$$);
SELECT t.run('root: (global, …)', 'authenticated', :ROOT, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"global","role":"admin","email":"x@t.test"}]')$$);
SELECT t.run('root: (entity,candidate,admin)  [confers nothing]', 'authenticated', :ROOT, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c2","role":"admin","email":"x@t.test"}]')$$);
SELECT t.run('root: (project,editor) naming ANOTHER project as target', 'authenticated', :ROOT, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"editor","target_id":"00000000-0000-0000-0000-0000000000b1","email":"x@t.test"}]')$$);
SELECT t.run('project editor: target is a candidate of project B (by id)', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","target_id":"00000000-0000-0000-0000-00000000c0b1","email":"x@t.test"}]')$$);
SELECT t.run('project editor: seeding INTO project B', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-0000000000b1', '[{"target_type":"candidate","target_id":"00000000-0000-0000-0000-00000000c0b1","email":"x@t.test"}]')$$);
SELECT t.run('entity editor: (entity,candidate,own,editor)', 'authenticated', :EE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","target_id":"00000000-0000-0000-0000-00000000c002","email":"x@t.test"}]')$$);
SELECT t.run('anon: create_invitations', 'anon', NULL, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c2","email":"x@t.test"}]')$$);
SELECT t.run('service_role: (entity,candidate,c4,editor) by code', 'service_role', NULL, $$SELECT (public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c4"}]')->0->>'code') IS NOT NULL$$);
SELECT t.run('service_role: (account, …)  [CHECK binds it too]', 'service_role', NULL, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"account","role":"admin","target_id":"00000000-0000-0000-0000-0000000000b0","email":"x@t.test"}]')$$);

\echo '== B. The same rules on a direct table write (D-09, D-06, D-04) =='
SELECT t.run('project editor: INSERT (project,admin) directly', 'authenticated', :PE, $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES ('00000000-0000-0000-0000-000000000001','project','00000000-0000-0000-0000-000000000001','admin','me@t.test') RETURNING id$$);
SELECT t.run('project editor: INSERT naming code_hash', 'authenticated', :PE, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, code_hash) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor', repeat('a',64)) RETURNING id$$);
SELECT t.run('project editor: INSERT naming claimed_at / claimed_by', 'authenticated', :PE, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, claimed_at) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor','y@t.test', now()) RETURNING id$$);
SELECT t.run('project editor: INSERT naming pending_email', 'authenticated', :PE, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, pending_email) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor','y@t.test') RETURNING id$$);
SELECT t.run('project editor: INSERT with no email (direct code row)', 'authenticated', :PE, $$WITH i AS (INSERT INTO public.invitations (project_id, scope, target_type, target_id, role) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor') RETURNING id, email) SELECT 'row written, plaintext never returned: ' || (email IS NULL) FROM i$$);
SELECT t.run('project editor: INSERT email with UPPER case', 'authenticated', :PE, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor','Mixed@T.test') RETURNING id$$);
SELECT t.run('project admin:  UPDATE any row', 'authenticated', :PA, $$UPDATE public.invitations SET role = 'admin' RETURNING id$$);
SELECT t.run('project admin:  SELECT code_hash', 'authenticated', :PA, $$SELECT code_hash FROM public.invitations LIMIT 1$$);
SELECT t.run('project admin:  SELECT pending_email', 'authenticated', :PA, $$SELECT pending_email FROM public.invitations LIMIT 1$$);
SELECT t.run('project admin:  SELECT * (star)', 'authenticated', :PA, $$SELECT count(*) FROM (SELECT * FROM public.invitations) s$$);
SELECT t.run('anon:           SELECT id', 'anon', NULL, $$SELECT count(id) FROM public.invitations$$);
SELECT t.run('entity editor:  SELECT id   (rows visible)', 'authenticated', :EE, $$SELECT count(id) FROM public.invitations$$);
SELECT t.run('project editor: SELECT id   (rows visible: entity promises only)', 'authenticated', :PE, $$SELECT count(id) || ' rows, scopes ' || string_agg(DISTINCT scope::text, ',') FROM public.invitations$$);
SELECT t.run('project admin:  SELECT id   (entity + project-editor promises)', 'authenticated', :PA, $$SELECT count(id) || ' rows, shapes ' || string_agg(DISTINCT scope::text || '/' || role::text, ',') FROM public.invitations$$);
SELECT t.run('account admin:  SELECT id   (all shapes)', 'authenticated', :AA, $$SELECT count(id) || ' rows, shapes ' || string_agg(DISTINCT scope::text || '/' || role::text, ',') FROM public.invitations$$);

\echo '== C. Duplicates (INV-02, D-07) =='
SELECT t.run('same email + same target again', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c1","email":"INVITEE1@t.test"}]')$$);
SELECT 'first row after the refusal                                                    -> ' || count(*) || ' row(s), created_at unchanged: ' || bool_and(created_at = now()) FROM public.invitations WHERE email = 'invitee1@t.test' AND target_id = '00000000-0000-0000-0000-00000000c001';
SELECT t.run('same email + OTHER target (organization o1)', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"organization","external_id":"o1","email":"invitee1@t.test"}]')->0->>'target_type'$$);
SELECT t.run('batch of two, the second a duplicate', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c2","email":"batch@t.test"},{"target_type":"candidate","external_id":"c1","email":"invitee1@t.test"}]')$$);
SELECT 'rows written by the refused batch                                              -> ' || count(*) FROM public.invitations WHERE email = 'batch@t.test';
SELECT t.run('project scope: same email + same project, other ROLE (role is outside the key)', 'authenticated', :AA, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"scope":"project","role":"admin","email":"neweditor@t.test"}]')$$);
SELECT t.run('service_role: a second row carrying an existing code_hash, other target', 'service_role', NULL, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, code_hash) SELECT project_id, 'entity', 'candidate', '00000000-0000-0000-0000-00000000c002', 'editor', code_hash FROM public.invitations WHERE code_hash IS NOT NULL LIMIT 1 RETURNING id$$);
SELECT t.run('service_role: email AND code_hash on one row', 'service_role', NULL, $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, code_hash) VALUES ('00000000-0000-0000-0000-000000000001','entity','candidate','00000000-0000-0000-0000-00000000c002','editor','z@t.test', repeat('b',64)) RETURNING id$$);

\echo '== D. INV-05: confirm at seeding (D-11) =='
SELECT 'c1 (named candidate, invited)                                                  -> confirmed=' || confirmed FROM public.candidates WHERE external_id = 'c1' AND project_id = :P1;
SELECT 'o1 (named organization, invited)                                               -> confirmed=' || confirmed FROM public.organizations WHERE external_id = 'o1';
SELECT t.run('invite the nameless candidate c3', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c3-nameless","email":"c3@t.test"}]')->0->>'email'$$);
SELECT t.run('invite the nameless organization o2', 'authenticated', :PE, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"organization","external_id":"o2-nameless","email":"o2@t.test"}]')->0->>'email'$$);
SELECT 'c3 (nameless) / o2 (nameless) / c2 (named, never invited by a successful call) -> ' || (SELECT confirmed FROM public.candidates WHERE external_id = 'c3-nameless') || ' / ' || (SELECT confirmed FROM public.organizations WHERE external_id = 'o2-nameless') || ' / ' || (SELECT confirmed FROM public.candidates WHERE external_id = 'c2');

\echo '== E. Claim (INV-03, D-14) =='
\set I1 '''aaaaaaaa-0000-0000-0000-000000000021'''
\set I2 '''aaaaaaaa-0000-0000-0000-000000000022'''
\set STR '''aaaaaaaa-0000-0000-0000-000000000023'''
\set CH '''aaaaaaaa-0000-0000-0000-000000000024'''
\set SEC '''aaaaaaaa-0000-0000-0000-000000000025'''
SELECT t.run('anon: claim_invitations', 'anon', NULL, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT t.run('stranger (confirmed, other address): claim', 'authenticated', :STR, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT t.run('invitee2 (address NOT confirmed, has an invitation): claim', 'authenticated', :I2, $$WITH s AS (SELECT public.create_invitations('00000000-0000-0000-0000-000000000001','[]')) SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT t.run('invitee1 (confirmed; c1 + o1 by email): claim', 'authenticated', :I1, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'invitee1 grants after the claim                                                -> ' || string_agg(scope || '/' || COALESCE(target_type::text, '-') || '/' || role, ', ' ORDER BY target_type) FROM public.grants WHERE user_id = :I1;
SELECT t.run('invitee1: claim again (idempotent)', 'authenticated', :I1, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT t.run('invitee1: claim in ANOTHER project', 'authenticated', :I1, $$SELECT public.claim_invitations('00000000-0000-0000-0000-0000000000b1')$$);
SELECT 'grants held by the stranger and by invitee2                                    -> ' || count(*) FROM public.grants WHERE user_id IN (:STR, :I2);

\echo '== F. Code rows: pending address, used, replay (INV-04, D-16, D-17, D-08) =='
-- A code for candidate c4, seeded by the service role above. Recover a plaintext for the test by seeding a fresh one.
SELECT (public.create_invitations(:P1, '[{"target_type":"organization","external_id":"o2-nameless"}]') -> 0 ->> 'code') AS code \gset
SELECT 'status of a fresh code (typed lower-case, with spaces and look-alikes)         -> ' || public.invitation_code_status(:P1, lower(replace(:'code', '-', ' ')));
SELECT 'status of an unknown code                                                      -> ' || public.invitation_code_status(:P1, 'AAAA-BBBB-CCCC');
SELECT 'status of the code in ANOTHER project                                          -> ' || public.invitation_code_status('00000000-0000-0000-0000-0000000000b1', :'code');
SELECT t.run('codeholder: claim BEFORE binding an address', 'authenticated', :CH, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'link request with the code + the stranger''s address (first D1 entry)            -> send=' || public.invitation_link_request(:P1, 'stranger@t.test', :'code');
SELECT 'link request with the code + codeholder''s address (a later D1 entry replaces)  -> send=' || public.invitation_link_request(:P1, ' CodeHolder@t.test', :'code');
SELECT t.run('stranger: claim (their address was replaced)', 'authenticated', :STR, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'status while bound but unclaimed                                               -> ' || public.invitation_code_status(:P1, :'code');
SELECT t.run('codeholder: claim (pending address = confirmed address)', 'authenticated', :CH, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'status after the claim                                                         -> ' || public.invitation_code_status(:P1, :'code');
SELECT 'link request with the USED code + another address                              -> send=' || public.invitation_link_request(:P1, 'second@t.test', :'code');
SELECT t.run('second user: claim after presenting the used code', 'authenticated', :SEC, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'claimant address for the used code (service role only)                         -> ' || COALESCE(public.invitation_code_claimant_email(:P1, :'code'), '(null)');
SELECT 'claimant address for a VALID (unclaimed) code                                  -> ' || COALESCE(public.invitation_code_claimant_email(:P1, (SELECT 'ZZZZ-ZZZZ-ZZZZ')), '(null)');
SELECT t.run('project editor: DELETE the claimed row', 'authenticated', :PE, $$WITH d AS (DELETE FROM public.invitations WHERE claimed_at IS NOT NULL RETURNING id) SELECT count(*) || ' row(s) deleted' FROM d$$);
DELETE FROM auth.users WHERE id = :CH;
SELECT 'after deleting the claimant: status / claimed_by / claimed_at set               -> ' || public.invitation_code_status(:P1, :'code') || ' / ' || COALESCE(claimed_by::text, 'NULL') || ' / ' || (claimed_at IS NOT NULL) FROM public.invitations WHERE code_hash = private.invitation_code_hash(:'code');
SELECT 'link request with that code after the claimant is gone                         -> send=' || public.invitation_link_request(:P1, 'second@t.test', :'code');
SELECT t.run('second user: claim after the claimant was deleted', 'authenticated', :SEC, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);

\echo '== G. Row by row (D-19) =='
-- c2 already has an editor (the entity editor). Invite `second` to c2 (collision), to c4 (free) and to o1 (free).
SELECT t.run('seed three rows for second@t.test: c2 (taken), c4, o1', 'authenticated', :PE, $$SELECT jsonb_array_length(public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c2","email":"second@t.test"},{"target_type":"candidate","external_id":"c4","email":"second@t.test"},{"target_type":"organization","external_id":"o1","email":"second@t.test"}]'))$$);
SELECT t.run('second: claim', 'authenticated', :SEC, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'the skipped row stays open                                                     -> claimed_at IS NULL: ' || (claimed_at IS NULL) FROM public.invitations WHERE email = 'second@t.test' AND target_id = '00000000-0000-0000-0000-00000000c002';
-- The entity editor already holds (entity,candidate,c2,editor). Invite that same user to c2: both unique rules are violated; which is named?
SELECT t.run('seed c2 for the user who ALREADY edits c2', 'authenticated', :PE, $$SELECT jsonb_array_length(public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c2","email":"entityeditor@t.test"}]'))$$);
SELECT t.run('entity editor: claim the grant they already hold', 'authenticated', :EE, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'grants on c2 afterwards                                                        -> ' || count(*) FROM public.grants WHERE target_id = '00000000-0000-0000-0000-00000000c002';

\echo '== H. Expiry, a moved target, cleanup =='
SELECT t.run('seed an already-expired row for stranger@t.test on c1', 'authenticated', :PE, $$SELECT jsonb_array_length(public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"organization","external_id":"o2-nameless","email":"stranger@t.test","expires_at":"2020-01-01T00:00:00Z"}]'))$$);
SELECT t.run('stranger: claim an expired row', 'authenticated', :STR, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'link request for an address whose only invitation is expired                  -> send=' || public.invitation_link_request(:P1, 'stranger@t.test');
SELECT t.run('seed c3 for stranger@t.test, then the owner moves c3 to project B', 'authenticated', :PE, $$SELECT jsonb_array_length(public.create_invitations('00000000-0000-0000-0000-000000000001', '[{"target_type":"candidate","external_id":"c3-nameless","email":"stranger@t.test"}]'))$$);
UPDATE public.candidates SET project_id = '00000000-0000-0000-0000-0000000000b1' WHERE external_id = 'c3-nameless';
SELECT t.run('stranger: claim a row whose target left the project', 'authenticated', :STR, $$SELECT public.claim_invitations('00000000-0000-0000-0000-000000000001')$$);
SELECT 'invitations naming c1 before / after deleting c1                               -> ' || (SELECT count(*) FROM public.invitations WHERE target_id = '00000000-0000-0000-0000-00000000c001') AS before \gset
DELETE FROM public.candidates WHERE id = '00000000-0000-0000-0000-00000000c001';
SELECT :'before' || ' / ' || (SELECT count(*) FROM public.invitations WHERE target_id = '00000000-0000-0000-0000-00000000c001');

\echo '== I. Link eligibility and the 60-second slot (D-15, J4) =='
SELECT 'uninvited, unknown address                                                     -> send=' || public.invitation_link_request(:P1, 'nobody@t.test');
SELECT 'open invitation by email (c3@t.test), first request                            -> send=' || public.invitation_link_request(:P1, 'c3@t.test');
SELECT 'the same address again within 60 s                                             -> send=' || public.invitation_link_request(:P1, 'C3@t.test ');
SELECT 'a user who already holds a grant in the project (invitee1)                     -> send=' || public.invitation_link_request(:P1, 'invitee1@t.test');
SELECT 'the same user asked about in project B                                         -> send=' || public.invitation_link_request('00000000-0000-0000-0000-0000000000b1', 'invitee1@t.test');
SELECT 'project editor (project-scope grant on it)                                     -> send=' || public.invitation_link_request(:P1, 'projeditor@t.test');
SELECT 'root admin (global grant, none in the project)                                 -> send=' || public.invitation_link_request(:P1, 'root@t.test');
SELECT 'eleven password attempts against one used code: answers                        -> ' || string_agg(CASE WHEN public.invitation_code_claimant_email(:P1, :'code') IS NULL THEN 'null' ELSE 'addr' END, ' ') FROM generate_series(1, 3);

\echo '== J. Exposure: who can execute what =='
SELECT 'public SECURITY DEFINER functions executable by anon                           -> ' || string_agg(p.proname, ', ' ORDER BY p.proname) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND has_function_privilege('anon', p.oid, 'EXECUTE');
SELECT 'public SECURITY DEFINER functions executable by authenticated                  -> ' || string_agg(p.proname, ', ' ORDER BY p.proname) FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
SELECT t.run('authenticated: invitation_code_status', 'authenticated', :PE, $$SELECT public.invitation_code_status('00000000-0000-0000-0000-000000000001', 'x')$$);
SELECT t.run('anon: invitation_link_request', 'anon', NULL, $$SELECT public.invitation_link_request('00000000-0000-0000-0000-000000000001', 'x@t.test')$$);
SELECT t.run('authenticated: invitation_code_claimant_email', 'authenticated', :PE, $$SELECT public.invitation_code_claimant_email('00000000-0000-0000-0000-000000000001', 'x')$$);
SELECT t.run('authenticated: private.invitation_throttle_take', 'authenticated', :PE, $$SELECT private.invitation_throttle_take('x', 1, interval '1 minute')$$);
SELECT t.run('authenticated: create_invitations (INVOKER, not in the definer census)', 'authenticated', :STR, $$SELECT public.create_invitations('00000000-0000-0000-0000-000000000001', '[]')$$);

ROLLBACK;
