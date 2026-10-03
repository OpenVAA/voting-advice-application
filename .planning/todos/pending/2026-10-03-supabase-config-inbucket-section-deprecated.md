---
title: "Supabase CLI 2.118 warns that `[inbucket]` in config.toml is deprecated in favour of `[local_smtp]`"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: any Supabase-config slot (best with the next CLI bump)
keywords: [supabase-cli, config-toml, inbucket, local-smtp, mailpit, deprecation]
re_check_trigger: "the next Supabase CLI bump, or when the CLI turns the warning into an error"
---

# `[inbucket]` deprecation (169-06)

Every CLI call on 2.118.0 prints `config section [inbucket] is deprecated. Please use [local_smtp] instead`.
`apps/supabase/supabase/config.toml` still has the `[inbucket]` section (line ~111). The plan did not name the rename,
so 169-06 left it.

**What to do:** rename the section per the CLI 2.118+ config reference (check which keys moved — ports, `smtp_port`,
`pop3_port`, sender fields), restart this project's stack only, and confirm the local mail UI and the E2E specs that
read local mail still work (the E2E helpers address the mail server by port). Also check
`2026-06-07-supabase-email-link-not-pointing-to-localhost-in-local-dev.md`, which touches the same section.
