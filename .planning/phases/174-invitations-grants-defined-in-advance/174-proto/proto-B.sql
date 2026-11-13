-- Design B: the authority map written inline, one policy per command, so the permission literals are in pg_policies.
DROP POLICY "admin_select_invitations" ON public.invitations;
DROP POLICY "admin_insert_invitations" ON public.invitations;
DROP POLICY "admin_delete_invitations" ON public.invitations;
DROP FUNCTION private.caller_may_promise (uuid, public.grant_scope_type, public.entity_type, uuid, public.grant_role_type);

CREATE OR REPLACE FUNCTION private.project_account_id (p_project_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT p.account_id FROM public.projects p WHERE p.id = p_project_id;
$$;

CREATE POLICY "admin_select_invitations" ON public.invitations FOR
SELECT
  TO authenticated USING (
    (
      scope = 'entity' AND role = 'editor'
      AND (SELECT private.entity_project_id (target_type, target_id)) = project_id
      AND (SELECT user_can ('project', project_id, 'project.read_entities'))
    )
    OR (
      scope = 'project' AND role = 'editor' AND target_id = project_id
      AND (SELECT user_can ('project', project_id, 'project.manage_editors'))
    )
    OR (
      scope = 'project' AND role = 'admin' AND target_id = project_id
      AND (SELECT user_can ('account', private.project_account_id (project_id), 'account.manage_admins'))
    )
  );

CREATE POLICY "admin_insert_invitations" ON public.invitations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      scope = 'entity' AND role = 'editor'
      AND (SELECT private.entity_project_id (target_type, target_id)) = project_id
      AND (SELECT user_can ('project', project_id, 'project.edit_entities'))
    )
    OR (
      scope = 'project' AND role = 'editor' AND target_id = project_id
      AND (SELECT user_can ('project', project_id, 'project.manage_editors'))
    )
    OR (
      scope = 'project' AND role = 'admin' AND target_id = project_id
      AND (SELECT user_can ('account', private.project_account_id (project_id), 'account.manage_admins'))
    )
  );

CREATE POLICY "admin_delete_invitations" ON public.invitations FOR DELETE TO authenticated USING (
  claimed_at IS NULL
  AND (
    (
      scope = 'entity' AND role = 'editor'
      AND (SELECT private.entity_project_id (target_type, target_id)) = project_id
      AND (SELECT user_can ('project', project_id, 'project.edit_entities'))
    )
    OR (
      scope = 'project' AND role = 'editor' AND target_id = project_id
      AND (SELECT user_can ('project', project_id, 'project.manage_editors'))
    )
    OR (
      scope = 'project' AND role = 'admin' AND target_id = project_id
      AND (SELECT user_can ('account', private.project_account_id (project_id), 'account.manage_admins'))
    )
  )
);
