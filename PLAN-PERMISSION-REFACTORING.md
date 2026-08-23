Re: apps/supabase/supabase/schema/300-auth-tables.sql

# Permissions refactoring

## General todo

- Use project id
- Supabase dataprovider:

## Todo

- Define level 1 permissions short of full
- Define candidate registration flows and check against permissions
- Define nomination confirmation flow
- Extend permission checks to storage using the same helpers e.g. user_can(scope, uuid, verb)

## Intro

What we need is this kind of matrix, but we'll have to do that in a follow-up phase (blocking ship).

- Tables
  - grants with user_id x scope x target_id x role

- Scopes and possible user roles
  - global (super admin)
    - admin
  - account
    - admin
  - project
    - admin (can manage editors)
    - editor (can edit data but not invite editors)
  - entities (all grantees can edit the entity's data and its own nominations — but see below for more details)
    - alliance
      - owner (can manage editors)
      - editor
    - faction
      - owner (can manage editors)
      - editor
    - organization (party)
      - owner (can manage editors)
      - editor
    - candidate
      - owner (can manage editors)
      - editor

- User roles
  - admin, can do anything to the object and its descendants
  - owner (e.g. a candidate themself), can invite and dismiss editors but may have limited editing rights
  - editor, same rights as owner except for managing editors

- Special permissions TBA
  - Candidates and their info
    - Based on per project setting, candidates can either edit their name or any edits will have to be approved by a project admin/editor (or higher up)
  - Entities nominations
    - Based on per project setting, a candidate can either:
      - edit/add their nominations
      - suggest a change to be approved
        - if the change includes a parent entity (faction/organization), based on setting:
          - the owner/editor or higher up will have to approve that change
      - not do either
    - Based on per project setting, an organization owner/editor can either:
      - edit/add their nominations
        - if the change includes a child (faction/candidate), based on setting:
          - the owner/editor or higher up (project/account) will have to approve that change
        - invite a new candidate/faction by email, based on setting
      - suggest a change to be approved
        - if the change includes a parent entity (alliance), based on setting:
          - the owner/editor or higher up will have to approve that change
      - not do either
    - Based on per project setting, an alliance owner/editor can either:
      - edit/add their nominations with the organizations, based on setting:
        - the owner/editor or higher up (project/account) will have to approve that change
        - invite a new candidate/faction by email, based on setting

## Predicates

is_child_nominee(p_parent_entity, p_child_entity) = if p_child_entity is in any nominations where p_parent_entity is the parent

- used to allow parents control over children when policy allows that, e.g. an organization's owner may be able to edit the candidates' data

## Read grants

A published project is always readable by anyone.

A non-published project's:

- non-entities are readably by any user with a grant in it
- entities are readably by the grantees themselves and their parents
