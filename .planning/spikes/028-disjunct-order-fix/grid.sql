-- Spike 028 correctness grid. Runs inside the caller's transaction. Shaped after D-36 § 4's grid:
-- 2 projects (G1 open_for_voters, G2 NOT) x 4 entity types x confirmed {t,f} x nomination {confirmed,
-- unconfirmed, none}; candidates additionally x terms_of_use {past, NULL, future}; plus per project one
-- entity of each type whose ONLY confirmed nomination carries the OTHER project's id; plus parent/child
-- nomination chains (organization -> candidate, organization -> faction -> candidate, alliance -> organization)
-- so the window-267 child-nominee reach (user_can nomination.read via is_child_nominee) is exercised.
SET LOCAL session_replication_role = replica;
CREATE TEMP TABLE g_proj (tag text PRIMARY KEY, id uuid, election uuid, const uuid, open boolean) ON COMMIT DROP;
INSERT INTO g_proj VALUES ('G1', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), true),
                          ('G2', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), false);
INSERT INTO public.projects (id, account_id, name, open_for_voters)
SELECT id, (SELECT account_id FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000001'), 'spike028-' || tag, open FROM g_proj;
INSERT INTO public.elections (id, project_id) SELECT election, id FROM g_proj;
INSERT INTO public.constituencies (id, project_id) SELECT const, id FROM g_proj;

-- one carrier organization + confirmed org nomination per project: parent for factions/candidates
CREATE TEMP TABLE g_ent (id uuid PRIMARY KEY, typ public.entity_type, proj text, confirmed boolean, nom text, tou text) ON COMMIT DROP;
CREATE TEMP TABLE g_carrier (proj text, org uuid, orgnom uuid, alli uuid, allinom uuid) ON COMMIT DROP;
INSERT INTO g_carrier SELECT tag, gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid() FROM g_proj;
INSERT INTO public.alliances (id, project_id, confirmed) SELECT c.alli, p.id, true FROM g_carrier c JOIN g_proj p ON p.tag = c.proj;
INSERT INTO public.nominations (id, project_id, alliance_id, election_id, constituency_id, confirmed)
SELECT c.allinom, p.id, c.alli, p.election, p.const, true FROM g_carrier c JOIN g_proj p ON p.tag = c.proj;
INSERT INTO public.organizations (id, project_id, confirmed) SELECT c.org, p.id, true FROM g_carrier c JOIN g_proj p ON p.tag = c.proj;
INSERT INTO public.nominations (id, project_id, organization_id, election_id, constituency_id, parent_nomination_id, confirmed)
SELECT c.orgnom, p.id, c.org, p.election, p.const, c.allinom, true FROM g_carrier c JOIN g_proj p ON p.tag = c.proj;
INSERT INTO g_ent SELECT alli, 'alliance'::public.entity_type, proj, true, 'carrier', NULL FROM g_carrier UNION ALL SELECT org, 'organization'::public.entity_type, proj, true, 'carrier', NULL FROM g_carrier;

-- the grid proper
INSERT INTO g_ent
SELECT gen_random_uuid(), t::public.entity_type, p.tag, conf, nom, tou
FROM g_proj p,
     unnest(ARRAY['candidate','organization','faction','alliance']) t,
     unnest(ARRAY[true,false]) conf,
     unnest(ARRAY['confirmed','unconfirmed','none','other_project']) nom,
     unnest(ARRAY['past','null','future']) tou
WHERE t = 'candidate' OR tou = 'past';
INSERT INTO public.candidates (id, project_id, first_name, last_name, confirmed, terms_of_use_accepted)
SELECT e.id, p.id, 'G', 'G', e.confirmed,
       CASE e.tou WHEN 'past' THEN now() - interval '1 day' WHEN 'future' THEN now() + interval '1 day' END
FROM g_ent e JOIN g_proj p ON p.tag = e.proj WHERE e.typ = 'candidate';
INSERT INTO public.organizations (id, project_id, confirmed) SELECT e.id, p.id, e.confirmed FROM g_ent e JOIN g_proj p ON p.tag = e.proj WHERE e.typ = 'organization' AND e.nom <> 'carrier';
INSERT INTO public.factions (id, project_id, organization_id, confirmed) SELECT e.id, p.id, c.org, e.confirmed FROM g_ent e JOIN g_proj p ON p.tag = e.proj JOIN g_carrier c ON c.proj = e.proj WHERE e.typ = 'faction';
INSERT INTO public.alliances (id, project_id, confirmed) SELECT e.id, p.id, e.confirmed FROM g_ent e JOIN g_proj p ON p.tag = e.proj WHERE e.typ = 'alliance' AND e.nom <> 'carrier';

-- nominations: candidates and factions hang under the carrier org nomination; orgs under the carrier alliance
-- nomination; alliances are top-level. 'other_project' puts the nomination row in the OTHER project.
INSERT INTO public.nominations (project_id, candidate_id, organization_id, faction_id, alliance_id, election_id, constituency_id, parent_nomination_id, confirmed)
SELECT np.id,
       CASE WHEN e.typ = 'candidate' THEN e.id END, CASE WHEN e.typ = 'organization' THEN e.id END,
       CASE WHEN e.typ = 'faction' THEN e.id END, CASE WHEN e.typ = 'alliance' THEN e.id END,
       np.election, np.const,
       CASE WHEN e.typ IN ('candidate','faction') THEN c.orgnom WHEN e.typ = 'organization' THEN c.allinom END,
       e.nom <> 'unconfirmed'
FROM g_ent e
JOIN g_proj ep ON ep.tag = e.proj
JOIN g_proj np ON np.tag = CASE WHEN e.nom = 'other_project' THEN (CASE e.proj WHEN 'G1' THEN 'G2' ELSE 'G1' END) ELSE e.proj END
JOIN g_carrier c ON c.proj = np.tag
WHERE e.nom IN ('confirmed','unconfirmed','other_project');
-- a faction-parented candidate chain (organization -> faction -> candidate), for the two-hop child reach
CREATE TEMP TABLE g_chain ON COMMIT DROP AS
SELECT p.tag, gen_random_uuid() fac, gen_random_uuid() facnom, gen_random_uuid() cand FROM g_proj p;
INSERT INTO public.factions (id, project_id, organization_id, confirmed) SELECT g.fac, p.id, c.org, true FROM g_chain g JOIN g_proj p ON p.tag = g.tag JOIN g_carrier c ON c.proj = g.tag;
INSERT INTO public.nominations (id, project_id, faction_id, election_id, constituency_id, parent_nomination_id, confirmed)
SELECT g.facnom, p.id, g.fac, p.election, p.const, c.orgnom, true FROM g_chain g JOIN g_proj p ON p.tag = g.tag JOIN g_carrier c ON c.proj = g.tag;
INSERT INTO public.candidates (id, project_id, first_name, last_name, confirmed, terms_of_use_accepted)
SELECT g.cand, p.id, 'C', 'C', false, NULL FROM g_chain g JOIN g_proj p ON p.tag = g.tag;   -- unconfirmed, no ToU: visible ONLY via a grant
INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, parent_nomination_id, confirmed)
SELECT p.id, g.cand, p.election, p.const, g.facnom, false FROM g_chain g JOIN g_proj p ON p.tag = g.tag;
INSERT INTO g_ent SELECT fac, 'faction'::public.entity_type, tag, true, 'chain', NULL FROM g_chain UNION ALL SELECT cand, 'candidate'::public.entity_type, tag, false, 'chain', 'null' FROM g_chain;
SET LOCAL session_replication_role = origin;
