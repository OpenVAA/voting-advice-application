-- Apply one reorder variant to the LIVE database (for running the pgTAP estate against it).
-- psql -v variant=A_public_first|B_project_public_entity -f apply-reorder.sql ; undo with `yarn db:reset`.
SELECT set_config('spike.variant', :'variant', false);
DO $$
DECLARE r record; inner_q text; pos int; p1 int; newq text;
BEGIN
  FOR r IN SELECT tablename, policyname, qual FROM pg_policies
           WHERE schemaname = 'public' AND cmd = 'SELECT' AND policyname LIKE 'authenticated_select_%'
             AND tablename IN ('candidates','organizations','factions','alliances','nominations')
  LOOP
    inner_q := substr(r.qual, 2, length(r.qual) - 2);                       -- strip the outer parentheses
    pos := position(' OR (( SELECT project_open_for_voters' IN inner_q);  -- start of the public disjunct
    IF pos = 0 THEN RAISE EXCEPTION 'public disjunct not found in %', r.policyname; END IF;
    IF position(' OR ' IN substr(inner_q, pos + 4)) > 0 AND substr(inner_q, pos + 4) !~ '^\(\(.*\)\)$' THEN
      RAISE EXCEPTION 'public disjunct of % is not the last top-level disjunct', r.policyname;
    END IF;
    IF current_setting('spike.variant') = 'A_public_first' THEN
      newq := substr(inner_q, pos + 4) || ' OR ' || substr(inner_q, 1, pos - 1);
    ELSE  -- B_project_public_entity: keep the project-authority disjunct first (admins exit on it), then public, then the entity disjuncts
      p1 := position(' OR ( SELECT user_can(' IN inner_q);
      IF p1 = 0 OR p1 >= pos OR substr(inner_q, 1, p1 - 1) NOT LIKE '%user_can(''project''::grant_scope_type%' THEN
        RAISE EXCEPTION 'first disjunct of % is not the project-authority user_can', r.policyname;
      END IF;
      newq := substr(inner_q, 1, p1 - 1) || ' OR ' || substr(inner_q, pos + 4) || ' OR ' || substr(inner_q, p1 + 4, pos - p1 - 4);
    END IF;
    EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, newq);
    RAISE NOTICE 'reordered %', r.policyname;
  END LOOP;
END $$;
SELECT 'applied ' || :'variant' || ', quals md5 ' || md5(string_agg(policyname || ':' || qual, '|' ORDER BY policyname)) FROM pg_policies
 WHERE schemaname = 'public' AND cmd = 'SELECT' AND tablename IN ('candidates','organizations','factions','alliances','nominations');
