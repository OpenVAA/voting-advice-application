---
name: recommended-skills
description: 'External agent skill sets this repository recommends, installed per user and never committed. Use when installing, setting up or updating agent skills, when an agent lacks Supabase platform or Postgres guidance, or when advice from a user-installed external skill disagrees with a project skill. Lists each set with its source repository, pinned commit, review date, exact install procedure and scope, and the places where it conflicts with this repo, where the project skill wins.'
---

# Recommended external skill sets

Nothing listed here is vendored into `.claude/skills/`. Each set is installed into the operator's own
user skills directory, `$HOME/.claude/skills/`, never into the project and never committed (operator
ruling of 2026-10-18). The project skills stay the single source of this repository's rules; an
external set adds general platform guidance and is wrong wherever its own section below says so.

This is a growing list. An agent that finds a new need adds a new set as a new H2 section below, in
the same shape: source, pinned commit, review date, scope, skills, install, conflicts with this repo,
updating.

## Supabase agent skills

- Source: https://github.com/supabase/agent-skills
- Pinned commit: `544bfc56c89afe2b87b20017a59b2c6e9502a1fb` (tag v0.1.9)
- Reviewed: 2026-10-18
- Scope: user. Never project, never plugin.
- Skills: `supabase` and `supabase-postgres-best-practices`
- Licence: MIT
- Content at the pin: Markdown only, no executable file; 4 files in the first skill and 36 in the
  second

### Install

```bash
SRC="$(mktemp -d)/agent-skills"
git clone https://github.com/supabase/agent-skills.git "$SRC"
cd "$SRC"
git checkout --detach 544bfc56c89afe2b87b20017a59b2c6e9502a1fb
test "$(git rev-parse HEAD)" = 544bfc56c89afe2b87b20017a59b2c6e9502a1fb
# Read every file of both skill directories in full here, before going on
# ("$SRC/skills/supabase" and "$SRC/skills/supabase-postgres-best-practices", 40 files, about 86 KB).
test ! -e "$HOME/.claude/skills/supabase" && test ! -e "$HOME/.claude/skills/supabase-postgres-best-practices"
cp -R "$SRC/skills/supabase" "$HOME/.claude/skills/"
cp -R "$SRC/skills/supabase-postgres-best-practices" "$HOME/.claude/skills/"
diff -r "$SRC/skills/supabase" "$HOME/.claude/skills/supabase"
diff -r "$SRC/skills/supabase-postgres-best-practices" "$HOME/.claude/skills/supabase-postgres-best-practices"
```

Do not install the set as a Claude Code plugin. The upstream plugin manifest gives the repository
root as each plugin's source, so the plugin route probably also registers the remote MCP server at
https://mcp.supabase.com/mcp. Do not use `npx skills add` either: it is a third-party installer that
runs outside the repository's npm age gate. A newly installed skill may only load in a new session,
so do not expect it in the session that installed it.

### Conflicts with this repo

`.claude/skills/database/SKILL.md` wins on every point below. Where the Supabase skills and the
database skill disagree, follow the database skill and treat the upstream advice as wrong for this
repo.

Three warnings first, because they act before any advice is read:

- The `supabase` skill fetches https://supabase.com/changelog.md before every task. The fetch is a
  public read and carries no repository data, but it is a network call on every task.
- It may create an MCP config file at the project root pointing at https://mcp.supabase.com/mcp.
  None is created or committed here; if one appears, delete it rather than commit it.
- It picks a migration workflow that is wrong for this repo. Its declarative option applies only
  when the upstream's declarative schemas directory exists or `schema_paths` is set; this repo has
  neither (its schema source is a differently named directory, and `schema_paths` is empty), so the
  skill falls through to its imperative option, which would write a second migration file.

The four conflicts:

1. **Migration workflow.** Upstream generates a migration with `supabase db pull` or creates one
   with `supabase migration new`. Here neither command is used: the schema workflow is the one the
   database skill describes under "The schema is declarative: you edit one copy, the other is
   generated" (edit the schema source, regenerate the single migration file). Either upstream
   command writes a second migration file, which `yarn assert:schema-migration-parity` rejects. The
   database skill wins.
2. **EXECUTE on the private helpers.** Upstream revokes EXECUTE on its `private` helper functions
   from PUBLIC, anon, authenticated and service_role and then calls them from policies. Here "private
   is not an exposed schema; anon/authenticated keep USAGE + EXECUTE so policies (which run as the
   caller) can still call them". Revoking that EXECUTE breaks the policies. The database skill wins.
3. **The `auth.uid()` check in every definer body.** Upstream says to "always include an auth.uid()
   check" in a SECURITY DEFINER body. Here the six `service_role`-only invitation helpers are designed
   without one: each "checks nothing about its caller, so EXECUTE is revoked from PUBLIC, anon and
   authenticated by name". Their safety is the revocation, not a body check. The database skill wins.
4. **Primary keys.** Upstream prefers a bigint identity key, or UUIDv7 for exposed ids. Here every
   content table's `id` is a uuid primary key defaulting to `gen_random_uuid()`, as the database
   skill's common column pattern lists it. The database skill wins.

Two further notes:

- Upstream's row-ownership examples write a per-table `user_id` ownership policy. Here authority
  comes from one grant model, rows of `public.grants` asked through `user_can`, and a per-table
  ownership policy is the exception the database skill names, not the pattern. The database skill
  wins.
- Upstream reaches for the Supabase advisors and MCP tooling to check a schema. Here the checks are
  `yarn db:lint:sql` against the local database and the pgTAP estate, as the database skill
  describes them. The database skill wins.

Upstream files that hold the conflicting advice, at the pin: the `supabase` skill's own SKILL.md (the
workflow options, the changelog fetch, the MCP config instruction, the definer-body rule) and the
best-practices skill's reference files on security, RLS and performance and on primary keys. They
are named here, not copied.

### Updating

Updates are manual. To bump the pin, read the upstream diff of both skill directories in full,
between the pinned commit and the new one. Then update the pinned commit, the review date and the
conflicts list above in the same commit, adding, changing or removing a conflict as the diff
requires. There is no update script.
