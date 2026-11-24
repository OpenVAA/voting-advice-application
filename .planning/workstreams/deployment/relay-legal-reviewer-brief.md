# Usage analytics in OpenVAA: a brief for the legal reviewer

**Date:** 24 November 2026
**Prepared for:** a qualified reviewer of data protection and electronic-communications law
**Status:** facts for review. Nothing in this brief is a legal conclusion.

## 1. What we ask of you, and what is already decided

OpenVAA collects usage data from its voting advice application. We ask you to judge whether the way it does so is lawful, and what must change if it is not. Section 8 lists our questions. Sections 3 to 7 give the facts they rest on.

Three things are decided already. They are working decisions of the project's operator for a test environment, not conclusions about the law.

- The application runs today only on a test site, called staging. It has no real voters yet; the people using it are the team and invited testers.
- On staging, the collection of detailed usage events is switched on, so that the system can be tested end to end. It stays on while you review.
- The production launch, the first site with real voters, waits for your review. It does not go ahead until you have answered.

## 2. The service in brief

A voting advice application helps a voter before an election. The voter answers a set of statements about politics, such as whether a tax should rise, on a scale from "fully disagree" to "fully agree". The application then compares the answers with the answers candidates and parties gave to the same statements, and lists the candidates and parties by how closely they match. The voter can read each candidate's and party's answers and profile.

OpenVAA is open-source software for building such applications. The deployment under review is meant for elections in Finland. It has three parts, all on the same web address:

- the voter app, used by the public, anonymously and without an account;
- the candidate and party app, where candidates and parties sign in to give their answers and profile;
- the admin app, used by the organisation that runs the election's application.

## 3. What is collected

The application collects two kinds of usage data: a page count that is always sent, and detailed events that are sent only after consent.

**The pageview.** A pageview is a record that a page of the application was viewed. One is made for every page a visitor opens. It holds only:

- which kind of page it was (for example "the results page", not the web address of a particular candidate's page);
- a few details of the page that the application lists in advance as harmless, such as which statement was on the page or which election's results were shown, but never the answer; a detail that identifies a candidate, a party or a nomination is never on that list, and a detail not on the list is dropped;
- which of the three apps it belongs to, and the language of the page;
- how long the page was visible, rounded down to a tenth of a second and capped at six hours;
- the time it was received.

A pageview carries no identifier. Nothing in it can link it to another pageview, to another event, or to a person or a device. It is sent with the next batch of usage data after the page opens. A batch goes out at the next move within the application, when the browser tab is hidden, or when the page is left.

**The detailed events, after consent.** When the visitor has consented, the application also sends events from a fixed list of about thirty. Nothing outside the list is accepted. The events include:

- the voter's answer to each statement, a change of an answer, a removed answer and a skipped statement;
- the results the voter viewed, including which candidate or party they opened and how well it matched;
- the use of filters, menus, information panels, videos and the feedback form (the rating only, never the text a visitor typed).

Events that show how a voter answered or which candidate or party they looked at are marked as sensitive in the application.

These events carry a visit id. A visit id is a random code made when the page is loaded and held only in the page's memory. It joins the events of that one page load to each other, so that one visit's answers and results can be read together. It is never written to the device, so a reload or a new tab starts a new one, and nothing links two visits. If the voter opens the user survey, the visit id is added to the survey link, so that the survey answers can be joined to the usage data of that visit.

**What is never collected.** The analytics never collect the visitor's network (IP) address, the browser's identification (its "user agent"), cookies, or any identifier stored on the device. No fingerprint is computed: the application calculates nothing from the visitor's address or browser that could recognise them again. For analytics, the only thing stored on the device is the consent choice, in the browser's local storage, a small store the browser keeps for each web site.

**Outside the analytics.** Two other features keep a network address, and are listed so that the picture is complete. The feedback form limits how often one address may send feedback, and keeps the sender's address with a count, with no expiry. The sign-in service limits repeated requests from one address for ten minutes, and keeps the address for that window. Separately, the voter app keeps the voter's answers in the browser's local storage so that they survive a reload; that copy stays on the device and is not analytics.

## 4. Where it goes

The browser never contacts an analytics company. The path is:

1. The browser sends its usage data to the application's own address, the same site the visitor is using, at a fixed path for usage data. There it reaches the part of the application server we call the relay: the code that checks each batch, keeps only what the fixed list allows, and passes it on.
2. The application server runs at Amazon Web Services (AWS) in its Stockholm region, called eu-north-1. Visitors reach it through Amazon CloudFront, AWS's network for delivering web content, which the deployment limits to its locations in Europe, North America and Israel.
3. The relay passes the data on to the analytics service the deployment has chosen. On staging this is PostHog, in PostHog's EU cloud. The alternative is the log provider: each event is written as one line to the application server's own logs, kept by AWS CloudWatch, AWS's log store, for 90 days. A deployment may also choose no provider, and then nothing is sent anywhere, the pageview included.

The relay answers the browser as soon as the data is queued, and forwards it every two seconds. If the analytics service is slow or down, data beyond a fixed queue of 1000 events is dropped.

## 5. How it is anonymised

- **The visitor's address stops at the relay.** The relay reads only five technical details of the request and its content. It does not read the visitor's address, browser identification or cookies. PostHog receives the data from the application server, so it sees the server's address, never the visitor's.
- **No person profiles.** Every event asks PostHog not to build a profile of a person from it.
- **No location.** Every event asks PostHog not to look up a location from an address (PostHog calls this GeoIP).
- **IP discarding observed.** On the staging PostHog project, the setting that discards client addresses read as switched on when checked through PostHog's interface on 19 November 2026. On the same day, the events of one consenting visit were inspected in PostHog and carried no address, no location, no browser identification, no web address and no person profile.
- **A fresh code per pageview.** PostHog needs an identifier on every record. The relay gives each pageview a new random one, so no two pageviews can be linked.
- **The consent-free mode.** A deployment may choose to collect events without asking (section 6). In that mode the sensitive events never carry the visit id: each gets a new random code, so no two answers can be linked to each other or to a pageview. Staging does not use this mode.
- **Checked by tests.** Automated tests fail if the analytics code reads a visitor's address, browser identification or a forwarded address, or computes a fingerprint of any kind.

## 6. Consent

**The voter app.** When detailed events are switched on and no choice has been made, the voter sees a consent prompt when they arrive. In the release this review concerns, the prompt is a modal dialog: a window that must be answered or closed before the page under it can be used. It has two buttons, one to agree and one to refuse, and a button that opens more information.

- Closing the prompt without a choice counts as refusing, and is stored as a refusal, exactly as pressing the refuse button is. This covers pressing the Escape key, the prompt's close button, a click outside it, and the device's own close gesture, such as the back gesture on some phones.
- After a refusal, only the pageview is sent, and the prompt does not appear again.
- The voter can change the choice at any time on the application's privacy page.
- Any event that happened before the choice is discarded at the moment of the choice, so nothing that happened before consent is sent after it.

**The pageview is sent before and regardless of a choice.** It goes out from the first page, before the prompt is answered, and also after a refusal. It is also sent when the detailed events are switched off. Only two things stop it: the deployment choosing no analytics provider, and Global Privacy Control.

**Global Privacy Control.** Global Privacy Control is a signal that some browsers and browser extensions send to every site, saying the user objects to the sale or sharing of their data. When the browser sends it, nothing is sent, the pageview included, and the consent prompt is not shown. The relay also drops any request that carries the signal. Nothing is stored to remember it.

**The candidate and party app.** There is no prompt. When a candidate or party accepts the terms of use, a box under the terms lets them opt out of usage data. Accepting the terms with the box not ticked counts as consent; ticking it counts as a refusal. This choice is stored apart from the voter app's choice, so neither app's choice answers the other. It can be changed later on the privacy page of the candidate and party app.

**The admin app.** It shows no prompt and has no terms page. It reads the choice the voter app stores in the same browser: if someone using that browser agreed in the voter app, the admin app's events are sent too; otherwise only the pageview is.

**The two switches a deployment controls.** The tracking setting, stored with each election project's settings, decides whether detailed events are collected at all. It is off by default; when it is off, only the pageview is sent and no prompt is shown. The consent mode is a server setting: "gated", the default and the one staging uses, asks first; "free" collects events without asking.

## 7. Retention

- **PostHog** keeps the events for as long as the PostHog project's plan and settings say. The application sets no period.
- **The log provider and the server's logs** are kept by AWS CloudWatch for 90 days in the staging deployment and in the example configuration. The deployment accepts only a period CloudWatch offers, never "forever".
- **The consent choice** stays in the browser's local storage until the browser or the visitor clears it.
- **The visit id** is never stored; it is gone when the page is reloaded or closed.

## Sources

Every statement above was checked against the files of the OpenVAA repository named here, as they stood on the date of this brief.

- **Sections 3 to 5:** the analytics guide for developers, `apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md` (the list of events, the privacy mechanism, the deployer's checklist and the staging observations of 19 November 2026); the relay, `apps/frontend/src/lib/server/analytics/relay.ts`; the fixed list of events, `apps/frontend/src/lib/analytics/events.schema.ts`; the pageview's list of harmless details, `apps/frontend/src/lib/analytics/pageviewRoutes.ts`; how a pageview's duration is measured, `apps/frontend/src/lib/contexts/app/tracking/viewTracker.ts`; the PostHog connection, `apps/frontend/src/lib/server/analytics/providers/posthog.ts`; the test against reading an address, `apps/frontend/src/lib/server/analytics/noAddressOrAgent.test.ts`.
- **Section 4:** the staging deployment's settings, `infra/envs/staging/aws/terraform.tfvars` (the Stockholm region, the PostHog EU address, the gated consent mode, the 90 days); the content delivery settings, `infra/modules/frontend-service/variables.tf` and `infra/modules/frontend-service/edge.tf`.
- **Section 6:** when the pageview, the events and the prompt are allowed, `apps/frontend/src/lib/contexts/app/tracking/sendPolicy.ts`; what a choice stores and the discarding of earlier events, `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`; the prompt, `apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte`, its buttons, `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte`, and the modal window it uses, `apps/frontend/src/lib/components/modal/ModalContainer.svelte`; the candidate and party app's opt-out box, `apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte`; the privacy pages, `apps/frontend/src/routes/(voters)/privacy/+page.svelte` and `apps/frontend/src/routes/contestant/privacy/+page.svelte`; the privacy texts, `apps/frontend/messages/en/privacy.json`.
- **Section 7:** the analytics guide for developers (its retention item), the staging deployment's settings, and the browser store of the choice in `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`.
- **Section 3, outside the analytics:** the analytics guide for developers (its two items on the addresses the feedback limit and the sign-in service keep); the privacy page's text on local storage, `apps/frontend/messages/en/privacy.json`.
