---
created: 2026-11-23
title: Make "contact support" a link in the locked-name message of the profile page
area: frontend
severity: minor
source: operator, during phase 189.1 UAT on staging (2026-11-23)
owner: the end of phase 189.1, before the phase closes
files:
  - apps/frontend/messages/en/dynamic.json (contestantAppBasicInfo.identity.name.locked)
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
  - apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte
---

## Problem

The Contestant App's profile page shows, for a name the administrator set or the identification provided, "Your name has been set by the administrator or taken from your identification, and you cannot change it here. If it is wrong, please contact support." (`dynamic.contestantAppBasicInfo.identity.name.locked.candidate`, chosen by `NAME_SENTENCE` in the profile `+page.svelte`). "contact support" is plain text, so the candidate has no direct way to reach support from the place that tells them to. The organization variant, "...If they are wrong, please contact support.", has the same shape.

## Solution

Render "contact support" as a link that opens the same support contact as `ContactSupport.svelte` (a mail to `appSettings.admin.email` with the `contestantApp.help.supportEmailSubject` subject), for both the candidate and the organization sentence, in every locale. The link text must stay a translated part of the message rather than an English string spliced in, for example by splitting the message around the link or by a markup-capable message. Keep it accessible: a real link with a discernible name, keyboard-reachable, and the profile page's axe scan and component test (`page.svelte.test.ts`, which pins the note's text) updated and passing. The other "please contact support" messages are out of scope unless the same change covers them for free.
