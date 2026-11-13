# Phase 180 — the function-driving projects of the suite, derived

Derived on 2026-11-13 at HEAD `b549dcf3e` by the four steps of `180-EXECUTION-RULES.md` § Targeted E2E (a to d), run mechanically by a scratch script that prints every command it runs; the output below is that script's, unedited. Step (d) maps files to projects by the `file` and `projectName` of each test in the baseline run `tests/e2e-runs/179.2/179.2-final-4/results.json`.

The record names every project the derivation reaches: all 129 of the baseline run. Because plan 02's run is the superset `--project perm-closed-project`, which holds the same 129, the record changes nothing about what runs; `180-run-checks.mjs --projects` then requires every one of them to be in the run with every test passed. The 13 projects of `180-RESEARCH.md` § Pattern 10 are all among them; the comparison at the end gives, for each of the other 116, the chain of basename matches that brought it in.

### (a) Call sites of the suite

```
$ git grep -l -E "functions/v1/(account-access|identity-callback|send-email)|functions\.invoke\(" -- tests/tests
tests/tests/fixtures/shared/invitationFlow.fixture.ts
tests/tests/specs/contestant/contestant-bank-auth.spec.ts
tests/tests/utils/accountAccessClient.ts
```

### (b) Files that import one of them, repeated to a fixed point

One `git grep -l -F <basename without .ts> -- tests/tests` per new file; each line gives the basename, the hit count and the files it added.

```
round 1: git grep -l -F invitationFlow.fixture -- tests/tests -> 11 hit(s), 11 new
round 1: git grep -l -F contestant-bank-auth.spec -- tests/tests -> 0 hit(s), 0 new
round 1: git grep -l -F accountAccessClient -- tests/tests -> 3 hit(s), 1 new
round 2: git grep -l -F admin-account-flows -- tests/tests -> 3 hit(s), 1 new
round 2: git grep -l -F contestant-journey -- tests/tests -> 18 hit(s), 17 new
round 2: git grep -l -F contestant-registration -- tests/tests -> 4 hit(s), 3 new
round 2: git grep -l -F invitation-landing -- tests/tests -> 3 hit(s), 1 new
round 2: git grep -l -F passwordless-session.setup -- tests/tests -> 0 hit(s), 0 new
round 2: git grep -l -F passwordless-session.teardown -- tests/tests -> 0 hit(s), 0 new
round 2: git grep -l -F contestant-a11y.spec -- tests/tests -> 4 hit(s), 4 new
round 2: git grep -l -F admin-account-flows.spec -- tests/tests -> 1 hit(s), 0 new
round 2: git grep -l -F contestant-entry-phone.spec -- tests/tests -> 0 hit(s), 0 new
round 2: git grep -l -F contestant-entry-scan.spec -- tests/tests -> 1 hit(s), 0 new
round 2: git grep -l -F invitation-contract.spec -- tests/tests -> 1 hit(s), 0 new
round 2: git grep -l -F supabaseAdminClient -- tests/tests -> 102 hit(s), 79 new
round 3: git grep -l -F invitationConstants -- tests/tests -> 21 hit(s), 3 new
round 3: git grep -l -F contestant-entity-selection -- tests/tests -> 5 hit(s), 1 new
round 3: git grep -l -F contestantLoginPage.fixture -- tests/tests -> 20 hit(s), 0 new
round 3: git grep -l -F perm-l10n -- tests/tests -> 4 hit(s), 0 new
round 3: git grep -l -F emailBucket.fixture -- tests/tests -> 4 hit(s), 0 new
round 3: git grep -l -F contestant-journey.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F contestant-journey.teardown -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F perm-access-disable.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-localisation-positive.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-missing-nominations.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-per-app-notifications.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F assertTeardown -- tests/tests -> 34 hit(s), 0 new
round 3: git grep -l -F base.teardown -- tests/tests -> 2 hit(s), 1 new
round 3: git grep -l -F contestant-journey.spec -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F perm-localisation-positive.spec -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F visual-regression.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F voter-journey.spec -- tests/tests -> 12 hit(s), 11 new
round 3: git grep -l -F testIds -- tests/tests -> 113 hit(s), 62 new
round 3: git grep -l -F contestant-code-registration.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F contestant-email-registration.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F contestant-password-recovery.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F invitation-landing.spec -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F a11y-smoke.spec -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F axeScan -- tests/tests -> 7 hit(s), 2 new
round 3: git grep -l -F rawKeyScan -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F testCredentials -- tests/tests -> 27 hit(s), 2 new
round 3: git grep -l -F contestantEmailSentPage.fixture -- tests/tests -> 5 hit(s), 0 new
round 3: git grep -l -F contestantEntityHomePage.fixture -- tests/tests -> 7 hit(s), 0 new
round 3: git grep -l -F contestantEntityPages.fixture -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F contestantIdentityProviderGate.fixture -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F contestantNoQuestionsPage.fixture -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F contestantNominationEditor.fixture -- tests/tests -> 5 hit(s), 0 new
round 3: git grep -l -F contestantNominationsPage.fixture -- tests/tests -> 4 hit(s), 0 new
round 3: git grep -l -F contestantSetPasswordGate.fixture -- tests/tests -> 8 hit(s), 0 new
round 3: git grep -l -F contestantSettingsPage.fixture -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F perm-contestant-nominations -- tests/tests -> 6 hit(s), 0 new
round 3: git grep -l -F perm-no-nomination -- tests/tests -> 6 hit(s), 0 new
round 3: git grep -l -F perm-organization-editing -- tests/tests -> 6 hit(s), 0 new
round 3: git grep -l -F perm-startfromcg -- tests/tests -> 6 hit(s), 0 new
round 3: git grep -l -F identityProviderFlow.fixture -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F README.md -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F index -- tests/tests -> 40 hit(s), 8 new
round 3: git grep -l -F settle -- tests/tests -> 42 hit(s), 1 new
round 3: git grep -l -F admin-access.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F admin-auth.setup -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F entity-selection.setup -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F entity-selection.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F identity-provider.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F identity-provider.teardown -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F perm-1e1cg1co.teardown -- tests/tests -> 1 hit(s), 1 new
round 3: git grep -l -F perm-2e-asymmetric.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-2e-shared.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-access-disable.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-analytics-tracking.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-answers-locked.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-answers-locked.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-closed-project.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-closed-project.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-contestant-nominations.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-contestant-nominations.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-disable-allow-open.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-disable-allow-open.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-disable-election-1co.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-disable-election-2co.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-disjoint-1co.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-header-show-help.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-all-nominations.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-category-tags.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-election-tags.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-hero.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-hero.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-hide-if-missing-answers.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-interactive-info.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-localisation-positive.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-missing-nominations.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-no-nomination.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-not-located-2e2cg.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-org-matching.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-organization-editing.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-per-app-notifications.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-question-video.setup -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-question-video.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-show-feedback-survey.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-startfromcg.teardown -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F registerAndStoreSession -- tests/tests -> 8 hit(s), 0 new
round 3: git grep -l -F setupFromTemplate -- tests/tests -> 34 hit(s), 14 new
round 3: git grep -l -F admin-access.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F public-signup-closed.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F contestant-identity-provider.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F contestant-terms-tracking.spec -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F contestant-nominations.spec -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F perm-access-disable.spec -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F perm-answers-locked.spec -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F perm-closed-project.spec -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F perm-interactive-info.spec -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F perm-not-located-2e2cg.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-org-matching.spec -- tests/tests -> 2 hit(s), 0 new
round 3: git grep -l -F perm-question-video.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F perm-show-feedback-survey.spec -- tests/tests -> 1 hit(s), 0 new
round 3: git grep -l -F perm-startfromcg.spec -- tests/tests -> 3 hit(s), 0 new
round 3: git grep -l -F storage-cleanup.spec -- tests/tests -> 0 hit(s), 0 new
round 3: git grep -l -F permContestantNominationsData -- tests/tests -> 6 hit(s), 0 new
round 3: git grep -l -F permNoNominationData -- tests/tests -> 4 hit(s), 0 new
round 3: git grep -l -F permOrganizationEditingData -- tests/tests -> 4 hit(s), 0 new
round 3: git grep -l -F permStartFromCgData -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F contestantJourneyConstants -- tests/tests -> 7 hit(s), 0 new
round 4: git grep -l -F invitationConstants.test -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F runScopedAddresses.test -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F contestant-entity-selection.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F base.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F contestantHomePage.fixture -- tests/tests -> 8 hit(s), 0 new
round 4: git grep -l -F contestantProfilePage.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F views -- tests/tests -> 24 hit(s), 2 new
round 4: git grep -l -F voter-journey.fixture -- tests/tests -> 25 hit(s), 2 new
round 4: git grep -l -F defaultTemplateResults.probe.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F eperm07-term-trigger.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voter-alliance.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voter-journey-mobile.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voter-prefs-tracking.spec -- tests/tests -> 2 hit(s), 0 new
round 4: git grep -l -F voter-results-redraw.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F selectElection -- tests/tests -> 8 hit(s), 1 new
round 4: git grep -l -F adminLoginPage.fixture -- tests/tests -> 7 hit(s), 0 new
round 4: git grep -l -F adminSetPasswordGate.fixture -- tests/tests -> 2 hit(s), 0 new
round 4: git grep -l -F authConfirmPage.fixture -- tests/tests -> 5 hit(s), 1 new
round 4: git grep -l -F contestantEntitySelectionPage.fixture -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F contestantForgotPasswordPage.fixture -- tests/tests -> 6 hit(s), 0 new
round 4: git grep -l -F contestantIdentityProviderError.fixture -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F contestantLogoutButton.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F contestantNothingToEditPage.fixture -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F contestantPasswordResetPage.fixture -- tests/tests -> 6 hit(s), 0 new
round 4: git grep -l -F contestantPasswordSetter.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F contestantPreviewPage.fixture -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F contestantPrivacyPage.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F contestantQuestionPage.fixture -- tests/tests -> 8 hit(s), 0 new
round 4: git grep -l -F contestantQuestionsOverviewPage.fixture -- tests/tests -> 11 hit(s), 0 new
round 4: git grep -l -F contestantRegisterPage.fixture -- tests/tests -> 6 hit(s), 0 new
round 4: git grep -l -F contestantTermsOfUsePage.fixture -- tests/tests -> 7 hit(s), 1 new
round 4: git grep -l -F notEditableNote.fixture -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F headerLogout.fixture -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F langSelectorFixture.fixture -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F multilingualTextFieldFixture.fixture -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F navMenu.fixture -- tests/tests -> 15 hit(s), 0 new
round 4: git grep -l -F popupNotice.fixture -- tests/tests -> 2 hit(s), 0 new
round 4: git grep -l -F video.fixture -- tests/tests -> 2 hit(s), 0 new
round 4: git grep -l -F aboutPage.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F entityDetails.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F entityFilters.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F organizationDetail.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F questionInfo.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F resultsPage.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F voterHomePage.fixture -- tests/tests -> 7 hit(s), 0 new
round 4: git grep -l -F voterIntroPage.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voterNavFixture.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voterQuestionsPage.fixture -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F select -- tests/tests -> 86 hit(s), 4 new
round 4: git grep -l -F perm-no-nomination.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-organization-editing.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-startfromcg.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F auth.setup -- tests/tests -> 3 hit(s), 0 new
round 4: git grep -l -F performance-budget.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-1e1cg1co.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-2e-shared.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disable-allow-open.spec -- tests/tests -> 2 hit(s), 0 new
round 4: git grep -l -F perm-disable-election-1co.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disable-election-2co.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disjoint-1co.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-header-show-help.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-category-tags.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-election-tags.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-hero.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-if-missing-answers.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F perm-missing-nominations.spec -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-no-nomination.spec -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F perm-organization-editing.spec -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F analytics-gpc.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F analytics-privacy.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F cold-entry-dataroot.spec -- tests/tests -> 2 hit(s), 1 new
round 4: git grep -l -F voter-nominations.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voter-pageview-only.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F voter-tracking-consent-free.spec -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F mailedLink.test -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F voterIntro -- tests/tests -> 11 hit(s), 0 new
round 4: git grep -l -F voterNavigation -- tests/tests -> 14 hit(s), 0 new
round 4: git grep -l -F contestantAxeScan -- tests/tests -> 7 hit(s), 0 new
round 4: git grep -l -F entryAxeScan -- tests/tests -> 4 hit(s), 0 new
round 4: git grep -l -F adminCredentials -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F runScopedIdentity.test -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F deviceStores.fixture -- tests/tests -> 5 hit(s), 0 new
round 4: git grep -l -F relayCapture.fixture -- tests/tests -> 6 hit(s), 0 new
round 4: git grep -l -F perm-show-feedback-survey.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F mockOidcIssuer -- tests/tests -> 6 hit(s), 3 new
round 4: git grep -l -F multiChoice -- tests/tests -> 7 hit(s), 0 new
round 4: git grep -l -F privacyAllowlists.test -- tests/tests -> 1 hit(s), 0 new
round 4: git grep -l -F privacyAllowlists -- tests/tests -> 4 hit(s), 1 new
round 4: git grep -l -F withholdStackKeys.test -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F navigation -- tests/tests -> 71 hit(s), 2 new
round 4: git grep -l -F perm-1e1cg1co.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-2e-asymmetric.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-2e-shared.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-analytics-tracking.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disable-election-1co.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disable-election-2co.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-disjoint-1co.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-header-show-help.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-all-nominations.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-category-tags.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-election-tags.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-hide-if-missing-answers.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-interactive-info.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-not-located-2e2cg.setup -- tests/tests -> 0 hit(s), 0 new
round 4: git grep -l -F perm-org-matching.setup -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F forensicCapture.fixture -- tests/tests -> 1 hit(s), 0 new
round 5: git grep -l -F perm-per-app-notifications.spec -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F feedbackDialog.fixture -- tests/tests -> 6 hit(s), 0 new
round 5: git grep -l -F minimalVoterResultsPage.fixture -- tests/tests -> 2 hit(s), 0 new
round 5: git grep -l -F perm-2e-asymmetric.spec -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F mailedLink -- tests/tests -> 15 hit(s), 0 new
round 5: git grep -l -F contestant-terms-gate-phone -- tests/tests -> 3 hit(s), 1 new
round 5: git grep -l -F screenShape.fixture -- tests/tests -> 2 hit(s), 0 new
round 5: git grep -l -F theme.fixture -- tests/tests -> 1 hit(s), 0 new
round 5: git grep -l -F viewTransitionLog.fixture -- tests/tests -> 2 hit(s), 0 new
round 5: git grep -l -F mockOidcIssuer.test -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F voter-dark-mode.spec -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F mockOidcIssuerEntry -- tests/tests -> 1 hit(s), 0 new
round 5: git grep -l -F buildTestIdToken.test -- tests/tests -> 0 hit(s), 0 new
round 5: git grep -l -F buildTestIdToken -- tests/tests -> 5 hit(s), 1 new
round 5: git grep -l -F requestOrigins.fixture -- tests/tests -> 2 hit(s), 0 new
round 5: git grep -l -F timeouts -- tests/tests -> 14 hit(s), 0 new
round 5: git grep -l -F perm-hide-all-nominations.spec -- tests/tests -> 1 hit(s), 0 new
round 6: git grep -l -F contestant-terms-gate-phone.spec -- tests/tests -> 1 hit(s), 0 new
round 6: git grep -l -F testKeys -- tests/tests -> 5 hit(s), 0 new
fixed point after 6 rounds: 246 files under tests/tests
```

### (c) Browser-driven call sites in the application, and the specs that drive their routes

```
$ git grep -n -E "functions\.invoke\('(account-access|identity-callback|send-email)'" -- apps/frontend/src
apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:132:    const { data, error } = await this.supabase.functions.invoke('send-email', {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:549:    const { data, error } = await this.supabase.functions.invoke('account-access', {
apps/frontend/src/routes/api/oidc/callback/+server.ts:187:    const { data, error } = await locals.supabase.functions.invoke('identity-callback', {

$ git ls-files "tests/tests/specs/**/contestant-entry-*.spec.ts" "tests/tests/specs/**/contestant-*-registration.spec.ts" "tests/tests/specs/**/*password-recovery*.spec.ts" "tests/tests/specs/**/contestant-identity-provider.spec.ts" "tests/tests/specs/**/contestant-bank-auth.spec.ts" "tests/tests/specs/**/admin-account-flows.spec.ts"
tests/tests/specs/admin/admin-account-flows.spec.ts
tests/tests/specs/contestant/contestant-bank-auth.spec.ts
tests/tests/specs/contestant/contestant-code-registration.spec.ts
tests/tests/specs/contestant/contestant-email-registration.spec.ts
tests/tests/specs/contestant/contestant-entry-phone.spec.ts
tests/tests/specs/contestant/contestant-entry-scan.spec.ts
tests/tests/specs/contestant/contestant-identity-provider.spec.ts
tests/tests/specs/contestant/contestant-password-recovery.spec.ts
```

`supabaseDataWriter.ts` (`account-access`) serves the contestant entry (`check-code`, `code-sign-in`), registration (`request-link`), recovery (`request-recovery`) and address-confirmation (`confirm-address`) screens, and the Admin App's account flows; `+server.ts` (`identity-callback`) is the OIDC callback route of the identity-provider and bank-auth flows; `supabaseAdminWriter.ts` (`send-email`) has no caller in `apps/frontend/src` (`git grep -n -F ".sendEmail(" -- apps/frontend/src ':!*.test.ts'` exits 1; only the writer's own unit test calls it), so no spec drives it and only the wrapper's `OPTIONS` probe observes it.

### (d) Every file of (a) to (c) that carries tests in the baseline run, mapped to its projects

The `file` of each test in `tests/e2e-runs/179.2/179.2-final-4/results.json` (relative to `tests/tests/`) against the derived file set; the `projectName` of its tests.

```
tests/tests/setup/admin/admin-access.teardown.ts -> data-teardown-admin-access
tests/tests/setup/admin/admin-auth.setup.ts -> data-setup-admin-auth
tests/tests/setup/contestant/contestant-journey.setup.ts -> data-setup-contestant-journey
tests/tests/setup/contestant/contestant-journey.teardown.ts -> data-teardown-contestant-journey
tests/tests/setup/contestant/entity-selection.setup.ts -> data-setup-entity-selection
tests/tests/setup/contestant/entity-selection.teardown.ts -> data-teardown-entity-selection
tests/tests/setup/contestant/identity-provider.setup.ts -> data-setup-identity-provider
tests/tests/setup/contestant/identity-provider.teardown.ts -> data-teardown-identity-provider
tests/tests/setup/contestant/passwordless-session.setup.ts -> data-setup-passwordless-session
tests/tests/setup/contestant/passwordless-session.teardown.ts -> data-teardown-passwordless-session
tests/tests/setup/perm/perm-1e1cg1co.setup.ts -> data-setup-perm-1e1cg1co
tests/tests/setup/perm/perm-1e1cg1co.teardown.ts -> data-teardown-perm-1e1cg1co
tests/tests/setup/perm/perm-2e-asymmetric.setup.ts -> data-setup-perm-2e-asymmetric
tests/tests/setup/perm/perm-2e-asymmetric.teardown.ts -> data-teardown-perm-2e-asymmetric
tests/tests/setup/perm/perm-2e-shared.setup.ts -> data-setup-perm-2e-shared
tests/tests/setup/perm/perm-2e-shared.teardown.ts -> data-teardown-perm-2e-shared
tests/tests/setup/perm/perm-access-disable.setup.ts -> data-setup-perm-access-disable
tests/tests/setup/perm/perm-access-disable.teardown.ts -> data-teardown-perm-access-disable
tests/tests/setup/perm/perm-analytics-tracking.setup.ts -> data-setup-perm-analytics-tracking
tests/tests/setup/perm/perm-analytics-tracking.teardown.ts -> data-teardown-perm-analytics-tracking
tests/tests/setup/perm/perm-answers-locked.setup.ts -> data-setup-perm-answers-locked
tests/tests/setup/perm/perm-answers-locked.teardown.ts -> data-teardown-perm-answers-locked
tests/tests/setup/perm/perm-closed-project.setup.ts -> data-setup-perm-closed-project
tests/tests/setup/perm/perm-closed-project.teardown.ts -> data-teardown-perm-closed-project
tests/tests/setup/perm/perm-contestant-nominations.setup.ts -> data-setup-perm-contestant-nominations
tests/tests/setup/perm/perm-contestant-nominations.teardown.ts -> data-teardown-perm-contestant-nominations
tests/tests/setup/perm/perm-disable-allow-open.setup.ts -> data-setup-perm-disable-allow-open
tests/tests/setup/perm/perm-disable-allow-open.teardown.ts -> data-teardown-perm-disable-allow-open
tests/tests/setup/perm/perm-disable-election-1co.setup.ts -> data-setup-perm-disable-election-1co
tests/tests/setup/perm/perm-disable-election-1co.teardown.ts -> data-teardown-perm-disable-election-1co
tests/tests/setup/perm/perm-disable-election-2co.setup.ts -> data-setup-perm-disable-election-2co
tests/tests/setup/perm/perm-disable-election-2co.teardown.ts -> data-teardown-perm-disable-election-2co
tests/tests/setup/perm/perm-disjoint-1co.setup.ts -> data-setup-perm-disjoint-1co
tests/tests/setup/perm/perm-disjoint-1co.teardown.ts -> data-teardown-perm-disjoint-1co
tests/tests/setup/perm/perm-header-show-help.setup.ts -> data-setup-perm-header-show-help
tests/tests/setup/perm/perm-header-show-help.teardown.ts -> data-teardown-perm-header-show-help
tests/tests/setup/perm/perm-hide-all-nominations.setup.ts -> data-setup-perm-hide-all-nominations
tests/tests/setup/perm/perm-hide-all-nominations.teardown.ts -> data-teardown-perm-hide-all-nominations
tests/tests/setup/perm/perm-hide-category-tags.setup.ts -> data-setup-perm-hide-category-tags
tests/tests/setup/perm/perm-hide-category-tags.teardown.ts -> data-teardown-perm-hide-category-tags
tests/tests/setup/perm/perm-hide-election-tags.setup.ts -> data-setup-perm-hide-election-tags
tests/tests/setup/perm/perm-hide-election-tags.teardown.ts -> data-teardown-perm-hide-election-tags
tests/tests/setup/perm/perm-hide-hero.setup.ts -> data-setup-perm-hide-hero
tests/tests/setup/perm/perm-hide-hero.teardown.ts -> data-teardown-perm-hide-hero
tests/tests/setup/perm/perm-hide-if-missing-answers.setup.ts -> data-setup-perm-hide-if-missing-answers
tests/tests/setup/perm/perm-hide-if-missing-answers.teardown.ts -> data-teardown-perm-hide-if-missing-answers
tests/tests/setup/perm/perm-interactive-info.setup.ts -> data-setup-perm-interactive-info
tests/tests/setup/perm/perm-interactive-info.teardown.ts -> data-teardown-perm-interactive-info
tests/tests/setup/perm/perm-localisation-positive.setup.ts -> data-setup-perm-localisation-positive
tests/tests/setup/perm/perm-localisation-positive.teardown.ts -> data-teardown-perm-localisation-positive
tests/tests/setup/perm/perm-missing-nominations.setup.ts -> data-setup-perm-missing-nominations
tests/tests/setup/perm/perm-missing-nominations.teardown.ts -> data-teardown-perm-missing-nominations
tests/tests/setup/perm/perm-no-nomination.setup.ts -> data-setup-perm-no-nomination
tests/tests/setup/perm/perm-no-nomination.teardown.ts -> data-teardown-perm-no-nomination
tests/tests/setup/perm/perm-not-located-2e2cg.setup.ts -> data-setup-perm-not-located-2e2cg
tests/tests/setup/perm/perm-not-located-2e2cg.teardown.ts -> data-teardown-perm-not-located-2e2cg
tests/tests/setup/perm/perm-org-matching.setup.ts -> data-setup-perm-org-matching
tests/tests/setup/perm/perm-org-matching.teardown.ts -> data-teardown-perm-org-matching
tests/tests/setup/perm/perm-organization-editing.setup.ts -> data-setup-perm-organization-editing
tests/tests/setup/perm/perm-organization-editing.teardown.ts -> data-teardown-perm-organization-editing
tests/tests/setup/perm/perm-per-app-notifications.setup.ts -> data-setup-perm-per-app-notifications
tests/tests/setup/perm/perm-per-app-notifications.teardown.ts -> data-teardown-perm-per-app-notifications
tests/tests/setup/perm/perm-question-video.setup.ts -> data-setup-perm-question-video
tests/tests/setup/perm/perm-question-video.teardown.ts -> data-teardown-perm-question-video
tests/tests/setup/perm/perm-show-feedback-survey.setup.ts -> data-setup-perm-show-feedback-survey
tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts -> data-teardown-perm-show-feedback-survey
tests/tests/setup/perm/perm-startfromcg.setup.ts -> data-setup-perm-startfromcg
tests/tests/setup/perm/perm-startfromcg.teardown.ts -> data-teardown-perm-startfromcg
tests/tests/setup/shared/auth.setup.ts -> auth-setup
tests/tests/setup/shared/base.setup.ts -> data-setup-base
tests/tests/setup/shared/base.teardown.ts -> data-teardown-base
tests/tests/specs/a11y/a11y-smoke.spec.ts -> a11y-smoke
tests/tests/specs/admin/admin-access.spec.ts -> admin-access
tests/tests/specs/admin/admin-account-flows.spec.ts -> admin-account-flows
tests/tests/specs/auth/public-signup-closed.spec.ts -> auth-service-contract
tests/tests/specs/contestant/contestant-bank-auth.spec.ts -> bank-auth
tests/tests/specs/contestant/contestant-code-registration.spec.ts -> contestant-code-registration
tests/tests/specs/contestant/contestant-email-registration.spec.ts -> contestant-email-registration
tests/tests/specs/contestant/contestant-entity-selection.spec.ts -> contestant-entity-selection
tests/tests/specs/contestant/contestant-entry-phone.spec.ts -> contestant-entry-phone
tests/tests/specs/contestant/contestant-entry-scan.spec.ts -> contestant-entry-scan
tests/tests/specs/contestant/contestant-identity-provider.spec.ts -> contestant-identity-provider
tests/tests/specs/contestant/contestant-journey.spec.ts -> contestant-journey
tests/tests/specs/contestant/contestant-password-recovery.spec.ts -> contestant-password-recovery
tests/tests/specs/contestant/contestant-terms-gate-phone.spec.ts -> contestant-terms-gate-phone
tests/tests/specs/contestant/contestant-terms-tracking.spec.ts -> voter-prefs-tracking
tests/tests/specs/contestant/invitation-contract.spec.ts -> invitation-contract
tests/tests/specs/contestant/invitation-landing.spec.ts -> invitation-landing
tests/tests/specs/perf/performance-budget.spec.ts -> performance
tests/tests/specs/perm/contestant-nominations.spec.ts -> perm-contestant-nominations
tests/tests/specs/perm/perm-1e1cg1co.spec.ts -> perm-1e1cg1co
tests/tests/specs/perm/perm-2e-asymmetric.spec.ts -> perm-2e-asymmetric
tests/tests/specs/perm/perm-2e-shared.spec.ts -> perm-2e-shared
tests/tests/specs/perm/perm-access-disable.spec.ts -> perm-access-disable
tests/tests/specs/perm/perm-answers-locked.spec.ts -> perm-answers-locked
tests/tests/specs/perm/perm-closed-project.spec.ts -> perm-closed-project
tests/tests/specs/perm/perm-disable-allow-open.spec.ts -> perm-disable-allow-open
tests/tests/specs/perm/perm-disable-election-1co.spec.ts -> perm-disable-election-1co
tests/tests/specs/perm/perm-disable-election-2co.spec.ts -> perm-disable-election-2co
tests/tests/specs/perm/perm-disjoint-1co.spec.ts -> perm-disjoint-1co
tests/tests/specs/perm/perm-header-show-help.spec.ts -> perm-header-show-help
tests/tests/specs/perm/perm-hide-all-nominations.spec.ts -> perm-hide-all-nominations
tests/tests/specs/perm/perm-hide-category-tags.spec.ts -> perm-hide-category-tags
tests/tests/specs/perm/perm-hide-election-tags.spec.ts -> perm-hide-election-tags
tests/tests/specs/perm/perm-hide-hero.spec.ts -> perm-hide-hero
tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts -> perm-hide-if-missing-answers
tests/tests/specs/perm/perm-interactive-info.spec.ts -> perm-interactive-info
tests/tests/specs/perm/perm-localisation-positive.spec.ts -> perm-localisation-positive
tests/tests/specs/perm/perm-missing-nominations.spec.ts -> perm-missing-nominations
tests/tests/specs/perm/perm-no-nomination.spec.ts -> perm-no-nomination
tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts -> perm-not-located-2e2cg
tests/tests/specs/perm/perm-org-matching.spec.ts -> perm-org-matching
tests/tests/specs/perm/perm-organization-editing.spec.ts -> perm-organization-editing
tests/tests/specs/perm/perm-per-app-notifications.spec.ts -> perm-per-app-notifications
tests/tests/specs/perm/perm-question-video.spec.ts -> perm-question-video
tests/tests/specs/perm/perm-show-feedback-survey.spec.ts -> perm-show-feedback-survey
tests/tests/specs/perm/perm-startfromcg.spec.ts -> perm-startfromcg
tests/tests/specs/storage/storage-cleanup.spec.ts -> storage-cleanup
tests/tests/specs/voter/analytics-gpc.spec.ts -> voter-prefs-tracking
tests/tests/specs/voter/analytics-privacy.spec.ts -> voter-prefs-tracking
tests/tests/specs/voter/cold-entry-dataroot.spec.ts -> cold-entry-dataroot, cold-entry-dataroot-contestant
tests/tests/specs/voter/eperm07-term-trigger.spec.ts -> eperm07-term-trigger
tests/tests/specs/voter/voter-alliance.spec.ts -> voter-alliance
tests/tests/specs/voter/voter-dark-mode.spec.ts -> voter-dark-mode
tests/tests/specs/voter/voter-journey-mobile.spec.ts -> voter-journey-mobile
tests/tests/specs/voter/voter-journey.spec.ts -> voter-journey
tests/tests/specs/voter/voter-nominations.spec.ts -> voter-nominations
tests/tests/specs/voter/voter-pageview-only.spec.ts -> voter-pageview-only
tests/tests/specs/voter/voter-prefs-tracking.spec.ts -> voter-prefs-tracking
tests/tests/specs/voter/voter-results-redraw.spec.ts -> voter-results-redraw
tests/tests/utils/contestantAxeScan.ts -> contestant-a11y-scan, contestant-identity-provider, perm-contestant-nominations, perm-no-nomination, perm-organization-editing
tests/tests/utils/entryAxeScan.ts -> admin-account-flows, contestant-a11y-scan, contestant-entry-scan, perm-closed-project
```

## The derived projects

project: a11y-smoke
project: admin-access
project: admin-account-flows
project: auth-service-contract
project: auth-setup
project: bank-auth
project: cold-entry-dataroot
project: cold-entry-dataroot-contestant
project: contestant-a11y-scan
project: contestant-code-registration
project: contestant-email-registration
project: contestant-entity-selection
project: contestant-entry-phone
project: contestant-entry-scan
project: contestant-identity-provider
project: contestant-journey
project: contestant-password-recovery
project: contestant-terms-gate-phone
project: data-setup-admin-auth
project: data-setup-base
project: data-setup-contestant-journey
project: data-setup-entity-selection
project: data-setup-identity-provider
project: data-setup-passwordless-session
project: data-setup-perm-1e1cg1co
project: data-setup-perm-2e-asymmetric
project: data-setup-perm-2e-shared
project: data-setup-perm-access-disable
project: data-setup-perm-analytics-tracking
project: data-setup-perm-answers-locked
project: data-setup-perm-closed-project
project: data-setup-perm-contestant-nominations
project: data-setup-perm-disable-allow-open
project: data-setup-perm-disable-election-1co
project: data-setup-perm-disable-election-2co
project: data-setup-perm-disjoint-1co
project: data-setup-perm-header-show-help
project: data-setup-perm-hide-all-nominations
project: data-setup-perm-hide-category-tags
project: data-setup-perm-hide-election-tags
project: data-setup-perm-hide-hero
project: data-setup-perm-hide-if-missing-answers
project: data-setup-perm-interactive-info
project: data-setup-perm-localisation-positive
project: data-setup-perm-missing-nominations
project: data-setup-perm-no-nomination
project: data-setup-perm-not-located-2e2cg
project: data-setup-perm-org-matching
project: data-setup-perm-organization-editing
project: data-setup-perm-per-app-notifications
project: data-setup-perm-question-video
project: data-setup-perm-show-feedback-survey
project: data-setup-perm-startfromcg
project: data-teardown-admin-access
project: data-teardown-base
project: data-teardown-contestant-journey
project: data-teardown-entity-selection
project: data-teardown-identity-provider
project: data-teardown-passwordless-session
project: data-teardown-perm-1e1cg1co
project: data-teardown-perm-2e-asymmetric
project: data-teardown-perm-2e-shared
project: data-teardown-perm-access-disable
project: data-teardown-perm-analytics-tracking
project: data-teardown-perm-answers-locked
project: data-teardown-perm-closed-project
project: data-teardown-perm-contestant-nominations
project: data-teardown-perm-disable-allow-open
project: data-teardown-perm-disable-election-1co
project: data-teardown-perm-disable-election-2co
project: data-teardown-perm-disjoint-1co
project: data-teardown-perm-header-show-help
project: data-teardown-perm-hide-all-nominations
project: data-teardown-perm-hide-category-tags
project: data-teardown-perm-hide-election-tags
project: data-teardown-perm-hide-hero
project: data-teardown-perm-hide-if-missing-answers
project: data-teardown-perm-interactive-info
project: data-teardown-perm-localisation-positive
project: data-teardown-perm-missing-nominations
project: data-teardown-perm-no-nomination
project: data-teardown-perm-not-located-2e2cg
project: data-teardown-perm-org-matching
project: data-teardown-perm-organization-editing
project: data-teardown-perm-per-app-notifications
project: data-teardown-perm-question-video
project: data-teardown-perm-show-feedback-survey
project: data-teardown-perm-startfromcg
project: eperm07-term-trigger
project: invitation-contract
project: invitation-landing
project: performance
project: perm-1e1cg1co
project: perm-2e-asymmetric
project: perm-2e-shared
project: perm-access-disable
project: perm-answers-locked
project: perm-closed-project
project: perm-contestant-nominations
project: perm-disable-allow-open
project: perm-disable-election-1co
project: perm-disable-election-2co
project: perm-disjoint-1co
project: perm-header-show-help
project: perm-hide-all-nominations
project: perm-hide-category-tags
project: perm-hide-election-tags
project: perm-hide-hero
project: perm-hide-if-missing-answers
project: perm-interactive-info
project: perm-localisation-positive
project: perm-missing-nominations
project: perm-no-nomination
project: perm-not-located-2e2cg
project: perm-org-matching
project: perm-organization-editing
project: perm-per-app-notifications
project: perm-question-video
project: perm-show-feedback-survey
project: perm-startfromcg
project: storage-cleanup
project: voter-alliance
project: voter-dark-mode
project: voter-journey
project: voter-journey-mobile
project: voter-nominations
project: voter-pageview-only
project: voter-prefs-tracking
project: voter-results-redraw

129 of the baseline run's 129 projects.

Baseline projects not derived: none.

## Comparison with 180-RESEARCH.md § Pattern 10 (13 projects)

In the research and not derived: none.

In the research and derived, with the file that brought each in and its chain back to a step-(a) or step-(c) file:

- `bank-auth`: contestant-bank-auth.spec.ts (a)
- `contestant-identity-provider`: contestant-identity-provider.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `invitation-contract`: invitation-contract.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `invitation-landing`: invitation-landing.spec.ts (matches `invitation-landing`) <- invitation-landing.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-email-registration`: contestant-email-registration.spec.ts (matches `contestant-registration`) <- contestant-registration.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-code-registration`: contestant-code-registration.spec.ts (matches `contestant-registration`) <- contestant-registration.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-password-recovery`: contestant-password-recovery.spec.ts (matches `contestant-registration`) <- contestant-registration.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `admin-account-flows`: admin-account-flows.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-entry-scan`: contestant-entry-scan.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-entry-phone`: contestant-entry-phone.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-a11y-scan`: contestantAxeScan.ts (matches `axeScan`) <- axeScan.ts (matches `contestant-a11y.spec`) <- contestant-a11y.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-journey`: contestant-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-localisation-positive`: perm-localisation-positive.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)

Derived and not in the research (116), with the same chain. The reason is the same for every one: step (b) follows a basename match, not a call. Its fixed point crosses a general-purpose module that a file reaches for something other than a function call (the seeding client `supabaseAdminClient`, whose `inviteByEmail` alone calls `account-access`; the shared `testIds`; and plain mentions in comments and docblocks, such as `contestant-journey` and `voter-journey.spec`), and from there reaches most of the suite. The research's table follows the calls themselves.

- `a11y-smoke`: a11y-smoke.spec.ts (matches `contestant-a11y.spec`) <- contestant-a11y.spec.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `admin-access`: admin-access.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `auth-service-contract`: public-signup-closed.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `auth-setup`: auth.setup.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `cold-entry-dataroot`: cold-entry-dataroot.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `cold-entry-dataroot-contestant`: cold-entry-dataroot.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-entity-selection`: contestant-entity-selection.spec.ts (matches `contestant-entity-selection`) <- contestant-entity-selection.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `contestant-terms-gate-phone`: contestant-terms-gate-phone.spec.ts (matches `contestant-terms-gate-phone`) <- contestant-terms-gate-phone.ts (matches `contestantTermsOfUsePage.fixture`) <- contestantTermsOfUsePage.fixture.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-admin-auth`: admin-auth.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-base`: base.setup.ts (matches `base.teardown`) <- base.teardown.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-contestant-journey`: contestant-journey.setup.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-entity-selection`: entity-selection.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-identity-provider`: identity-provider.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-passwordless-session`: passwordless-session.setup.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-1e1cg1co`: perm-1e1cg1co.setup.ts (matches `perm-1e1cg1co.teardown`) <- perm-1e1cg1co.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-2e-asymmetric`: perm-2e-asymmetric.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-2e-shared`: perm-2e-shared.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-access-disable`: perm-access-disable.setup.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-analytics-tracking`: perm-analytics-tracking.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-answers-locked`: perm-answers-locked.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-closed-project`: perm-closed-project.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-contestant-nominations`: perm-contestant-nominations.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-disable-allow-open`: perm-disable-allow-open.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-disable-election-1co`: perm-disable-election-1co.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-disable-election-2co`: perm-disable-election-2co.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-disjoint-1co`: perm-disjoint-1co.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-header-show-help`: perm-header-show-help.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-hide-all-nominations`: perm-hide-all-nominations.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-hide-category-tags`: perm-hide-category-tags.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-hide-election-tags`: perm-hide-election-tags.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-hide-hero`: perm-hide-hero.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-hide-if-missing-answers`: perm-hide-if-missing-answers.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-interactive-info`: perm-interactive-info.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-localisation-positive`: perm-localisation-positive.setup.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-missing-nominations`: perm-missing-nominations.setup.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-no-nomination`: perm-no-nomination.setup.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-not-located-2e2cg`: perm-not-located-2e2cg.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-org-matching`: perm-org-matching.setup.ts (matches `setupFromTemplate`) <- setupFromTemplate.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-organization-editing`: perm-organization-editing.setup.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-per-app-notifications`: perm-per-app-notifications.setup.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-setup-perm-question-video`: perm-question-video.setup.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-show-feedback-survey`: perm-show-feedback-survey.setup.ts (matches `index`) <- index.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-setup-perm-startfromcg`: perm-startfromcg.setup.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-teardown-admin-access`: admin-access.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-base`: base.teardown.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-teardown-contestant-journey`: contestant-journey.teardown.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-teardown-entity-selection`: entity-selection.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-identity-provider`: identity-provider.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-passwordless-session`: passwordless-session.teardown.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `data-teardown-perm-1e1cg1co`: perm-1e1cg1co.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-2e-asymmetric`: perm-2e-asymmetric.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-2e-shared`: perm-2e-shared.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-access-disable`: perm-access-disable.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-analytics-tracking`: perm-analytics-tracking.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-answers-locked`: perm-answers-locked.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-closed-project`: perm-closed-project.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-contestant-nominations`: perm-contestant-nominations.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-disable-allow-open`: perm-disable-allow-open.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-disable-election-1co`: perm-disable-election-1co.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-disable-election-2co`: perm-disable-election-2co.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-disjoint-1co`: perm-disjoint-1co.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-header-show-help`: perm-header-show-help.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-hide-all-nominations`: perm-hide-all-nominations.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-hide-category-tags`: perm-hide-category-tags.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-hide-election-tags`: perm-hide-election-tags.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-hide-hero`: perm-hide-hero.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-hide-if-missing-answers`: perm-hide-if-missing-answers.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-interactive-info`: perm-interactive-info.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-localisation-positive`: perm-localisation-positive.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-missing-nominations`: perm-missing-nominations.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-no-nomination`: perm-no-nomination.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-not-located-2e2cg`: perm-not-located-2e2cg.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-org-matching`: perm-org-matching.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-organization-editing`: perm-organization-editing.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-per-app-notifications`: perm-per-app-notifications.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-question-video`: perm-question-video.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-show-feedback-survey`: perm-show-feedback-survey.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `data-teardown-perm-startfromcg`: perm-startfromcg.teardown.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `eperm07-term-trigger`: eperm07-term-trigger.spec.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `performance`: performance-budget.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-1e1cg1co`: perm-1e1cg1co.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-2e-asymmetric`: perm-2e-asymmetric.spec.ts (matches `selectElection`) <- selectElection.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-2e-shared`: perm-2e-shared.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-access-disable`: perm-access-disable.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-answers-locked`: perm-answers-locked.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-closed-project`: perm-closed-project.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-contestant-nominations`: contestant-nominations.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-disable-allow-open`: perm-disable-allow-open.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-disable-election-1co`: perm-disable-election-1co.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-disable-election-2co`: perm-disable-election-2co.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-disjoint-1co`: perm-disjoint-1co.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-header-show-help`: perm-header-show-help.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-hide-all-nominations`: perm-hide-all-nominations.spec.ts (matches `navigation`) <- navigation.ts (matches `settle`) <- settle.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-hide-category-tags`: perm-hide-category-tags.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-hide-election-tags`: perm-hide-election-tags.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-hide-hero`: perm-hide-hero.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-hide-if-missing-answers`: perm-hide-if-missing-answers.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-interactive-info`: perm-interactive-info.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-missing-nominations`: perm-missing-nominations.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-no-nomination`: perm-no-nomination.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-not-located-2e2cg`: perm-not-located-2e2cg.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-org-matching`: perm-org-matching.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-organization-editing`: perm-organization-editing.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-per-app-notifications`: perm-per-app-notifications.spec.ts (matches `views`) <- views.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `perm-question-video`: perm-question-video.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-show-feedback-survey`: perm-show-feedback-survey.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `perm-startfromcg`: perm-startfromcg.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `storage-cleanup`: storage-cleanup.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `voter-alliance`: voter-alliance.spec.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-dark-mode`: voter-dark-mode.spec.ts (matches `cold-entry-dataroot.spec`) <- cold-entry-dataroot.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-journey`: voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-journey-mobile`: voter-journey-mobile.spec.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-nominations`: voter-nominations.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-pageview-only`: voter-pageview-only.spec.ts (matches `testIds`) <- testIds.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
- `voter-prefs-tracking`: contestant-terms-tracking.spec.ts (matches `supabaseAdminClient`) <- supabaseAdminClient.ts (matches `accountAccessClient`) <- accountAccessClient.ts (a)
- `voter-results-redraw`: voter-results-redraw.spec.ts (matches `voter-journey.spec`) <- voter-journey.spec.ts (matches `contestant-journey`) <- contestant-journey.ts (matches `invitationFlow.fixture`) <- invitationFlow.fixture.ts (a)
