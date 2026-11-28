---
created: 2026-10-08T00:00:00.000Z
title: Admin UI, first update — the most crucial features for admins (questions and categories, contestant-user fixes, app settings, translation overrides)
area: admin app
severity: major
source: operator, 2026-10-08 (captured during the v2.16 run)
owner: the operator, when the admin app is next scoped
files:
  - apps/frontend/src/routes/admin/
  - apps/frontend/src/lib/server/admin/
tags: [contestant, admin, frontend, supabase, app-shared, feat]
keywords: [admin-ui, questions, app-settings, translation-overrides, contestant-support, deep-merge, admin-editor, customization, admin-app, question-categories, editor, support, edit-answers, impersonation, contestant-app]
github_issues: [158, 211]
---

## Problem

An admin has no screen in the Admin app for the tasks that come up most often when a VAA is being run. They are
done through the Supabase dashboard, by import, or not at all. Several rules built in v2.16 assume an admin can
act — a confirmed entity's name is read-only to its user "and only an admin changes it"; a user whose nominations
are locked is sent to support — and the admin has no place in the app to do so.

## Solution

A first update of the Admin UI that implements the most crucial features. The operator's list:

- **Edit questions and categories.**
- **Fix common contestant-user issues** — some of them may defer to the Supabase dashboard:
  - alter a name;
  - change nominations;
  - maybe: let an admin use the Contestant app as that user.
- **Change app settings.**
- **Change translation overrides.**

Not decided here: which of the contestant-user fixes get a screen and which are a documented dashboard procedure;
whether "use the Contestant app as that user" is built at all, and by what mechanism; whether this is a phase of a
milestone or a milestone of its own.

## Standing todos this would absorb or touch

- `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (the app-settings editor)
- `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` (confirming an entity whose editors have not accepted
  the terms of use)
- `2026-10-07-174-admin-grants-admit-no-project-editor.md`
- `2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md`
- `2026-08-28-admin-login-supabase-independence.md`
- `2026-05-11-e2e-01-single-locale-runtime-override.md` (runtime translation overrides)
- Phase 999.1 in the roadmap's backlog (the command registry), which names admin actions as one of its consumers

## Merged from `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (2026-11-28)

The settings editor must validate with StoredSettingsSchema on save and write whole groups. It should also cover app_settings.customization. Deep merge has landed, so the docs advice to 'store whole top-level groups' can be relaxed.

The merged todo is kept at `.planning/todos/completed/2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md`.

## Merged from loose end 4.9 of the Phase 177 rulings record (2026-11-28)

The confirmation queue keys on `requestedParentOrganization`; it now also holds organizations that typed an alliance, and placeholder alliance nominations created by organizations. The Admin App has no page for either. Add admin pages to review and confirm/reject these queue entries. (Source: `.planning/todos/completed/2026-10-11-177-small-rulings-and-loose-ends-the-plans-left-open.md` section 4.9.)

## From GitHub issue #158 (2026-11-28)

[#158 As an Application Manager, I want to input the election questions so that the candidates and parties can answer them](https://github.com/openvaa/voting-advice-application/issues/158)

GitHub #158 (2023 user story): an Application Manager must be able to enter the election questions (and categories) so contestants can answer them. Today only `bulk_import` (questions, question_categories collections) or the Supabase dashboard can do it.

## From GitHub issue #211 (2026-11-28)

[#211 As an Application Manager, I want to be able to edit the candidates' answers if they have problems using the app.](https://github.com/openvaa/voting-advice-application/issues/211)

GitHub #211: for candidate support, an Application Manager (or a support role) should be able to edit a contestant's basic info AND opinion answers, preferably through the same Contestant App UI (i.e. 'use the Contestant app as that user' or acting as an editor of that entity). Consider a support/project-editor role rather than full admin (see 174-admin-grants-admit-no-project-editor and 179.1-project-editor-exempts-one-entity-from-the-answers-lock).
