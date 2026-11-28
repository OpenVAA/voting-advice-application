---
created: 2026-11-28
title: Hide parent nominations without child nominations
area: frontend
tags: [voter, frontend, supabase, improvement]
keywords: [empty-parties, parent-nominations, get-nominations, results, purge]
source: "GitHub issue #825"
github_issues: [825]
files:
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - packages/data/src/objects/election/nominationShape.ts
---

# Hide parent nominations without child nominations

## Origin

Converted from GitHub issue [#825 feat[backend]: purge empty parent nominations](https://github.com/openvaa/voting-advice-application/issues/825) on 2026-11-28.

## Problem

In list elections an organization (or alliance/faction) nomination may have no candidate nominations in the selected constituency, e.g. after unconfirmed candidates are filtered out. `get_nominations` in `apps/supabase/supabase/schema/503-entity-rpcs.sql` returns them anyway, so they appear as empty parties in the voter results. In organization-only elections, childless organization nominations are legitimate, so the rule must depend on the election's nomination shape or a setting.

## Solution

Filter on the server (an option to `get_nominations`, e.g. `p_omit_childless_parents`, computed after the unconfirmed filter) or in the Supabase data provider, driven by the election's nomination shape or an app setting. Add a pgTAP test and a dev-seed scenario.
