---
created: 2026-10-05T23:30:00.000Z
title: Decide which term the Publishers' Guide uses where it speaks of the contestant app in general
area: docs
severity: minor
source: Phase 170 CONTEXT ("The publishers' guide's user-facing naming is left to Phase 171"); Phase 171 plan 04, Task 2 (deviation 9 of that plan)
files:
  - apps/docs/src/routes/(content)/publishers-guide
---

## Problem

Phase 170 renamed the app for candidates and parties to the contestant app everywhere in code, routes and developer prose, and left one thing to Phase 171: what the Publishers' Guide calls the app when it addresses a publisher. The naming guard reflects that: it does not match the phrase under a `publishers-guide` directory.

Phase 171 decided the names the app **shows for itself** — "Candidate app", "Party app" and "Candidate and party app", chosen by the project's `contestantApp.entityTypes` setting and overridable through `dynamic.contestantAppName.*`. It decided **no term for the guide's own prose**. A project can now serve parties only, or both, so "the candidate application" is no longer always the right name for what the guide describes; but the guide is also written for publishers, most of whom run a candidates-only project and will see "Candidate app" on screen.

Phase 171 rewrote one page, the publishers' settings page (`publishers-guide/app-settings/+page.md`): it documents the two new settings and the three name keys, quotes the three shown names, and keeps that page's existing term "Candidate App" where the page already used it. **The rest of the guide was not swept.**

## The population

```bash
git grep -n -i -e "candidate app" -e "candidate application" -- "apps/docs/src/routes/(content)/publishers-guide"
```

Measured on the tree after plan 171-04's docs task: 25 lines on 12 pages, 26 occurrences. Paths are relative to `apps/docs/src/routes/(content)/publishers-guide/`. Long lines are cut and end in "…", and the padding of the two table rows is collapsed; nothing else is altered.

```text
after-publishing-the-vaa/intro/+page.md:3:Most of the hard work is done when you’ve published the candidate application or the actual voters’ VAA.
after-publishing-the-vaa/user-support/+page.md:3:During the time the candidate application is open, you will probably receive a number of requests for support.
app-settings/+page.md:135:- `contestantApp`: If `true`, the Candidate App can be accessed. Default: `true`.
app-settings/+page.md:145:- `contestantApp`: The notification shown to users of the Candidate App. Defined by the properties:
app-settings/+page.md:154:Settings related to the Candidate App.
app-settings/+page.md:156:- `questions`: Settings related to the question view in the Candidate App.
app-settings/+page.md:157:  - `hideVideo`: Whether to hide possible video content for questions in the Candidate App. Default: `false`.
app-settings/+page.md:158:  - `hideHero`: Whether to hide possible hero content for questions in the Candidate App. Default: `false`.
app-settings/+page.md:165:The app names itself after `entityTypes`: "Candidate app" when it serves candidates, "Party app" when it serves parties and "Candidate and party app" when it serves both. …
app-settings/+page.md:169:- With nothing declared, the app is the "Candidate app" with sign-in only: the login page shows the sign-in form and no way to register. …
data-collection/additional-data-for-the-voter/+page.md:3:Some of the application data is not needed for the candidate application and can, thus, be provided a bit later. These include:
data-collection/candidates-or-parties-answers/+page.md:3:Depending on the method of data collection you’ve decided on, you can either collect these manually or have the candidates use the candidate application …
data-collection/initial-data/+page.md:3:Before publishing the candidate application, you will need to provide the data below. …
data-collection/initial-data/+page.md:11:- [ ] Candidate lists if using the candidate app and not using bank authentication
data-collection/intro/+page.md:7:1. initial data, including everything needed before publishing the possible candidate application
data-collection/intro/+page.md:8:2. candidates’ or parties’ answers, which can be collected manually or using the candidate application
data-collection/moderation-of-candidate-answers/+page.md:3:If the candidate app is available, candidates can enter free-form explanation to accompany their replies to the statements.
preparing/candidates-and-parties-data-be/+page.md:17:In candidate-based settings, this is, however, seldom feasible and you will need to enable the platform’s candidate application so that they can enter their …
preparing/candidates-and-parties-data-be/+page.md:51:It is very often the case that candidates will require assistance when registering for or using the candidate application.
preparing/candidates-and-parties-data-be/+page.md:57:The candidate application also has a Frequently asked questions page onto which answers to common problems can be added.
preparing/the-application-be-hosted/+page.md:5:The main decision affecting hosting is whether you will have need of the candidate application with which candidates can enter their answers to the statements and …
preparing/the-specifics-of-the-elections/+page.md:115:Thus, if the elections follow a closed-list model in which the voters can only vote a party list, not an individual candidate, there’s usually no point in s…
preparing/timeline/+page.md:9:| Testing the application before publishing the candidate application | 2 weeks |
preparing/timeline/+page.md:10:| Candidate application open for | 1.5 months |
preparing/timeline/+page.md:16:If you will not be using the candidate application, the time reserved for that will be used to otherwise collect answers to the statements from the candidates or parties.
```

By spelling (`git grep -h -i -o … | sort | uniq -c`): 14 "candidate application", 1 "Candidate application", 1 "Candidate Application", 6 "Candidate App", 2 "candidate app", 2 "Candidate app". The two "Candidate app" hits on `app-settings/+page.md` lines 165 and 169 are the shown name, quoted on purpose, and are not part of the question.

When Phase 171 was planned the same command found 24 occurrences on 12 pages. The settings page lost one (the section on the removed pre-registration switch) and gained the two quoted names.

## The question for the operator

**Which term does the Publishers' Guide use where it speaks of the app in general?** The options seen so far:

1. Keep "candidate application" / "Candidate App" as the guide's everyday term, and say once (on the settings page, where it is already said) that the app names itself after the entity types it serves.
2. Use the neutral developer term, "Contestant App", throughout the guide.
3. Use the shown names: "Candidate app" where a passage is about candidates, "Candidate and party app" where it is about both.

Whatever is chosen, the guide today spells the term five ways; one spelling should come out of the sweep.

## Solution

After the operator's answer, sweep the 12 pages with the population command above, leaving the two quoted shown names on the settings page as they are. If option 2 or 3 is chosen, also check whether the naming guard's path scope for `publishers-guide` (`NOT_PUBLISHERS_GUIDE` in `scripts/assert-no-candidate-app-names.mjs`) should then be removed, so that the guide is held to the same rule as the rest of the docs.

Passages that address the reader's candidates as candidates ("candidates can enter free-form explanation…") are about the entity type, not the app, and are Phase 175's kind of question, not this one.
