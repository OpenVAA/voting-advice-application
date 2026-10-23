# Arabic Translation Glossary — OpenVAA

> **LOCKED — do not revise mid-phase.**
> This glossary fixes one Modern Standard Arabic (MSA / فُصْحَى) rendering per recurring VAA domain term.
> All 46 frontend translation files and the backend `dynamic.json` must use exactly these renderings.
> Any deviation discovered during translation must be corrected to match this table, not the other way round.
> Locked: 2026-06-14 (Phase: arabic-translations, Plan 01).

---

## Core VAA Domain Terms

| English Term                     | Arabic (MSA)       | Notes / Key                                                                              |
| -------------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| candidate (singular)             | مرشح               | `common.candidate.singular`                                                              |
| candidates (plural)              | مرشحون             | `common.candidate.plural` — use مرشحون (nominative default); مرشحين in governed contexts |
| party / organization (singular)  | حزب                | `common.organization.singular`                                                           |
| parties / organizations (plural) | أحزاب              | `common.organization.plural`                                                             |
| constituency                     | دائرة انتخابية     | `common.constituency`                                                                    |
| election                         | انتخابات           | `common.election` (plural is appropriate for the general concept)                        |
| opinion (singular)               | رأي                | `dynamic.json` intro, survey text                                                        |
| opinions (plural)                | آراء               | used where plural form required                                                          |
| alliance (singular)              | تحالف              | `common.alliance.singular`                                                               |
| alliances (plural)               | تحالفات            | `common.alliance.plural`                                                                 |
| faction (singular)               | كتلة               | `common.faction.singular`                                                                |
| factions (plural)                | كتل                | `common.faction.plural`                                                                  |
| question                         | سؤال               | `common.question`                                                                        |
| results                          | نتائج              | `results.title.results`                                                                  |
| answer / reply                   | إجابة              | generic answer noun                                                                      |
| answer yes                       | نعم                | `common.answer.yes`                                                                      |
| answer no                        | لا                 | `common.answer.no`                                                                       |
| match / match score              | درجة التطابق       | `components.matchScore.label` and related                                                |
| Election Compass                 | البوصلة الانتخابية | descriptive phrase → translated (D-05); used wherever literal "Election Compass" appears |

---

## UI Action & State Terms

| English Term         | Arabic (MSA)               | Notes / Key                                 |
| -------------------- | -------------------------- | ------------------------------------------- |
| loading…             | جارٍ التحميل…              | `common.loading`                            |
| saving…              | جارٍ الحفظ…                | `common.saving`                             |
| continue             | متابعة                     | `common.continue`, `dynamic.intro.continue` |
| back                 | رجوع                       | `common.back`                               |
| close                | إغلاق                      | `common.close`                              |
| cancel               | إلغاء                      | `common.cancel`                             |
| clear                | مسح                        | `common.clear`                              |
| return               | العودة                     | `common.return`                             |
| return home          | العودة إلى الصفحة الرئيسية | `common.returnHome`                         |
| save and continue    | حفظ ومتابعة                | `common.saveAndContinue`                    |
| save and return      | حفظ والعودة                | `common.saveAndReturn`                      |
| read more            | اقرأ المزيد                | `common.readMore`                           |
| expand or collapse   | توسيع أو طي                | `common.expandOrCollapse`                   |
| skip to main content | انتقل إلى المحتوى الرئيسي  | `common.skipToMain`                         |

---

## Authentication & Account Terms

| English Term            | Arabic (MSA)      | Notes / Key                            |
| ----------------------- | ----------------- | -------------------------------------- |
| login / sign in         | تسجيل الدخول      | `common.login`, `candidateApp.login.*` |
| logout / log out        | تسجيل الخروج      | `common.logout`                        |
| register / registration | التسجيل           | `candidateApp.register.*`              |
| password                | كلمة المرور       | `common.password`                      |
| confirm password        | تأكيد كلمة المرور | `common.passwordConfirmation`          |
| email                   | البريد الإلكتروني | `common.email`                         |
| first name              | الاسم الأول       | `common.firstName`                     |
| surname / last name     | اسم العائلة       | `common.lastName`                      |

---

## Content / Info Terms

| English Term       | Arabic (MSA)      | Notes / Key                                                         |
| ------------------ | ----------------- | ------------------------------------------------------------------- |
| filters            | الفلاتر           | `entityFilters.*` — loan word well-established in digital Arabic UI |
| feedback           | ملاحظات           | `feedback.title`                                                    |
| privacy            | الخصوصية          | `privacy.title`                                                     |
| statistics         | إحصاءات           | `statistics.*`                                                      |
| nomination         | ترشيح             | `common.nomination`                                                 |
| unaffiliated       | مستقل             | `common.unaffiliated`                                               |
| portrait           | صورة شخصية        | `common.candidatePortrait`                                          |
| website            | الموقع الإلكتروني | `common.website`                                                    |
| state / status     | الحالة            | `common.state`                                                      |
| progress           | التقدم            | `common.progress`                                                   |
| info / information | معلومات           | `common.info`                                                       |

---

## Status / Job-State Terms (adminApp.jobs — Open Question 1 resolution)

These terms appear in `adminApp.jobs.json` (37 keys) and `common.json`. Formal MSA technical vocabulary is used per D-04.

| English Term            | Arabic (MSA)      | Notes                                  |
| ----------------------- | ----------------- | -------------------------------------- |
| Pending                 | قيد الانتظار      | job state — formal administrative term |
| Confirmed               | مؤكَّد            | `common.confirmed` and adminApp.jobs   |
| Locked                  | مُقفَل            | `common.locked` and adminApp.jobs      |
| job / task (processing) | مهمة              | adminApp job queue context             |
| running                 | قيد التشغيل       | job execution state                    |
| failed / error          | فشل               | job failure state                      |
| completed / done        | مكتمل             | job completion state                   |
| cancelled               | ملغى              | job cancelled state                    |
| queued                  | في قائمة الانتظار | job queued state                       |

---

## Brand / Proper-Noun Rule (D-05)

> **This section is normative and binding on all translation tasks in this phase.**

### Latin-retained names (keep verbatim in JSON values — no Arabic substitution)

The following names are kept in **Latin script exactly** as they appear in the English source. The already-shipped RTL bidi infrastructure (phase `rtl-bidi-support`, decision A8) handles LTR isolation at render time — the translator does NOT add Unicode bidi isolate characters to JSON values.

| Name        | Rule                                       | Justification                              |
| ----------- | ------------------------------------------ | ------------------------------------------ |
| **OpenVAA** | Keep as `OpenVAA` in every `ar` JSON value | Registered brand name (true proper noun)   |
| **Bank ID** | Keep as `Bank ID` in every `ar` JSON value | Registered service name (true proper noun) |

The D-06 check script enforces this: if `en` contains `OpenVAA` or `Bank ID`, the `ar` value must also contain it literally or the script exits 1.

### ICU token names (pass through verbatim — never translate)

ICU tokens are runtime-interpolated values, not translatable text:

- `{appName}`, `{firstName}`, `{lastName}`, `{registrationUrl}`, `{adminEmailLink}`, `{publisher}`, `{candidateSingular}`, `{candidatePlural}`, `{partySingular}`, `{partyPlural}`, `{count}`, `{numShown}`, `{consentDate}`, `{electionDate}`, `{minQuestions}`, `{partyMatchingMethod}` — all must appear verbatim in Arabic values that contain them in English.

### Descriptive phrases (translate to Arabic)

Descriptive phrases used as names are not registered proper nouns and should be translated:

| English Phrase   | Arabic             | Notes                                                 |
| ---------------- | ------------------ | ----------------------------------------------------- |
| Election Compass | البوصلة الانتخابية | Appears as literal text in `dynamic.json`             |
| Made with        | صُنع بـ            | `common.madeWithPrefix`; `madeWithSuffix` stays empty |

### Emoji (keep in place)

Emoji characters (`🖋️`, `👍`, `✉️`, `❤️`, etc.) must be preserved in Arabic values at the same position they occupy in the English source (unless natural Arabic prose requires relocation, in which case keep them in the translated sentence).

---

## Arabic ICU Plural Categories (CLDR)

> **All translators must use these six plural forms for Arabic.** The `intl-messageformat` engine (v10.7.11) resolves the correct arm via `Intl.PluralRules` with locale `ar` at runtime.

| Category | Applies when `n` is                      | Example (`numShown` context) |
| -------- | ---------------------------------------- | ---------------------------- |
| `zero`   | = 0                                      | لا نتائج                     |
| `one`    | = 1                                      | نتيجة واحدة                  |
| `two`    | = 2 (grammatical dual — Arabic-specific) | نتيجتان                      |
| `few`    | 3–10 (and 103–110, 1003–1010, …)         | # نتائج                      |
| `many`   | 11–99 (and 111–199, 1011–1099, …)        | # نتيجةً                     |
| `other`  | 100, 200, 300, … (exact round hundreds)  | # نتيجة                      |

**Important:** Arabic has a grammatical **dual** form (suffix `-ان` nominative / `-ين` accusative-genitive). Always provide a distinct `two` arm — do not use `other` for 2. English `=0`, `=1`, `other` arms may be expanded to all six Arabic arms without breaking the key-parity test (the parity test checks key names only, not value content).

---

## Sources

- `frontend/src/lib/i18n/translations/en/common.json` — source of truth for key names
- `frontend/src/lib/i18n/translations/index.ts` — `DEFAULT_PAYLOAD_KEYS` token names
- `.planning/phases/arabic-translations/arabic-translations-RESEARCH.md` §7 (glossary seed)
- `.planning/phases/arabic-translations/arabic-translations-CONTEXT.md` (D-02, D-05)
- `.planning/phases/rtl-bidi-support/DECISIONS.md` (A5, A8 — LTR isolation, bidi)
