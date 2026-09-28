# Sign up scenarios to handle

- Contains new project settings: PS
- Admin seeds may be separate invites or real entities or users
- PS: election_type: organization_only, candidate_only, organization_list

## Auth meth settings

Allow: method { identity_provider, email, parent_email, code, open } x entity type

## 1 identity_provider based

### Any entity

Authenticates at common entry point
Select entity type if election allows multiple

## 2 Email

Admin seeds entities with immutable data (name) and email
User logs in with email and is asked to confirm email

## 2.1 parent_email: Organisation invites (implement only for org > cand)

Admin seeds organisation entities (party managers) with immutable data (name) and email
Organisation user logs in with email and is asked to confirm email
Organisation user can invite candidates by email the same way as admin

## 3 Code

Admin seeds entities with immutable data (name) and registration code
User inserts code and email and is asked to confirm email

## 4 Open

User can sign up with their email and is asked to confirm email

## Common user task flow

1. Identify or enter code if needed
2. Enter email (if by email, check), unless re-entry by identity (code is one-time)
3. (User created)
4. Confirm email
5. Choose password (may be optional if magic links allowed)
6. Accept ToU
7. Create nomination unless existing: pick elections, constituency per election, (party per nomination if candidate and election is org + cand and organizations are seeded, otherwise free text)
8. Answer questions
9. If nomination changed (PS lock_nominations, Admin can set at some stage), question set may change

## User types

RootAdmin
AccountAdmin
ProjectAdmin
ProjectEditor
Candidate
OrganizationEditor
FactionEditor
AllianceEditor

## Grants, atomic rights (non exhaustive)

Feedback
- read
- manage

Account
- edit settings
- create, delete projects
- manage admins

Project
- manage editors
- edit settings
- edit elections, constituency groups and constituencies
- edit questions and categories
- read settings, elections, constituency groups and constituencies, questions and categories (anyone when project is open for voters; any auth user can always read their project)
- edit entities
- edit nominations
- read entities and nominations (confirmed nominations and linked entities public when open for voters)

Entity
- edit answers (entity users can do this to their own)
- read answers (public only when/via nomination confirmed, see above)
- edit immutable data (admin/editor only)
- invite children (org > cands)

Nomination
- edit contents (entity users can do this to their own, unless locked; when editing, turn confirmed false)
- read contents and related entities basic (not answers unless public) data (entity users can do this to their own)
- confirm (only admins)

## Other changes

For now, let's scope suggested changes from the schema. Users will just have to send a message to the admin to have those made.