---
quick_id: 260726-ibp
phase: quick-260726-ibp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/lib/i18n/translations/so/*.json
autonomous: true
requirements: [SOM-01, SOM-02, SOM-03, SOM-04]
tags: [i18n, translations, somali, localization]

must_haves:
  truths:
    - "SOM-01: A locked Somali glossary exists in this plan and every translator agent uses it verbatim — no agent invents its own rendering for a glossary term."
    - "SOM-02: All 46 JSON files exist under frontend/src/lib/i18n/translations/so/ with the same filenames as en/."
    - "SOM-03: Every so/ file has a byte-identical key set, nesting, and key order to its en/ counterpart — only string values differ."
    - "SOM-04: Every ICU placeholder, ICU construct, HTML tag, href value, literal \\n, and protected brand literal present in an en/ value is present verbatim in the corresponding so/ value."
    - "No so/ value is left in English except the enumerated untranslated-by-design list."
  artifacts:
    - frontend/src/lib/i18n/translations/so/ (46 .json files)
  key_links:
    - "so/ filenames must match the `keys` array in frontend/src/lib/i18n/translations/index.ts exactly (dynamic import path `./${locale}/${key}.json`)."
    - "Glossary Section A terms feed every batch — drift here produces visible inconsistency across the app."
---

<objective>
Create Somali (`so`) translations for all 46 i18n translation JSON files in
`frontend/src/lib/i18n/translations/`, using English (`en`) as the authoritative
source and Finnish (`fi`) as the disambiguating reference for intent.

Purpose: Add Somali as a translatable locale's content layer. Somali is a major
minority language in Nordic elections; the VAA is unusable for Somali-speaking
voters without it.

Output: `frontend/src/lib/i18n/translations/so/` containing exactly 46 `.json`
files, structurally identical to `en/`, with every human-readable value rendered
in standard Somali (Af-Soomaali, Latin script).

Method: Lock a shared glossary FIRST (Task 1, authored below), then translate in
five parallel batches (Tasks 2-6) that share only the glossary, then validate
structurally (Task 7).
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@frontend/src/lib/i18n/translations/index.ts
@frontend/src/lib/i18n/translations/translations.type.ts
@frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
</context>

---

# HARD CONSTRAINTS — read before writing a single character

**These are non-negotiable. Every executor of every task must obey all seven.**

1. **Never alter, add, remove, reorder, or rename a JSON key.** The `so/` file
   must have exactly the same key set and the same nesting as `en/`, **in the
   same order**. Only string VALUES are translated. The correct working method
   is: copy the `en/` file to `so/`, then replace values in place.

2. **Preserve every ICU placeholder token verbatim**, including exact spelling
   and casing: `{numQuestions}`, `{publisher}`, `{candidatePlural}`,
   `{partyPlural}`, `{candidateSingular}`, `{partySingular}`, `{entity}`,
   `{organization}`, `{constituencyGroup}`, `{option}`, `{maxFilesize}`,
   `{minPasswordLength}`, `{questionId}`, `{registrationUrl}`, `{firstName}`,
   `{lastName}`, `{username}`, `{score}`, `{rating}`, `{ratingMax}`,
   `{numShown}`, `{numCandidates}`, `{numCategories}`, `{minQuestions}`,
   `{numUnansweredQuestions}`, `{infoQuestionsLeft}`, `{opinionQuestionsLeft}`,
   `{timeLeft}`, `{minutes}`, `{seconds}`, `{consentDate}`, `{electionDate}`,
   `{adminEmailLink}`, `{analyticsLink}`, `{questionsLink}`, `{appName}`,
   `{count}`, `{error}`, `{feature}`, `{partyMatchingMethod}`.
   **Never translate the token name. Never localise the braces.** Placeholders
   may be re-ordered within a sentence if Somali syntax requires it, but every
   token that appears in the `en` value must appear in the `so` value.

3. **Preserve ICU constructs**: `plural`, `select`, `selectordinal`, `date`,
   `number`, `time`, the `#` symbol, and their option keywords (`one`, `other`,
   `zero`, `=0`, `=1`, `=-1`, and `select` branch names such as `answersOnly`
   and `imputed`). Only the human-readable text inside each branch gets
   translated. Empty branches such as `=0 {}` stay empty. Date skeletons such as
   `::yyyyMMd` and `::yyyyMMdd` are copied verbatim.

4. **Preserve all HTML markup verbatim**: tag names and structure (`<a>`, `<p>`,
   `<ul>`, `<li>`, `<h3>`, `<strong>`, …), tag nesting order, and **all
   attribute values, especially `href="…"`**. Translate only the text between
   tags. Do not add, remove, or merge tags. Do not add `dir` or `lang`
   attributes.

5. **Preserve literal `\n` escape sequences** and their exact position and
   count. `candidateApp.preregister.email.text` contains three of them.

6. **Output must be valid JSON**, UTF-8, **2-space indent**, **LF** line
   endings, **trailing newline at EOF** — matching `en/` formatting exactly
   (`.editorconfig` sets `indent_size = 2`, `end_of_line = lf`,
   `insert_final_newline = true`). The repo runs Prettier; `yarn format` can
   normalise whitespace if needed, but it will NOT fix key order or key names.

7. **Every file must be complete.** No file may be partially translated,
   stubbed, left in English, or skipped. **All 46 files.**

## Scope fence

**IN SCOPE:** creating `.json` files under
`frontend/src/lib/i18n/translations/so/` only.

**OUT OF SCOPE — do not touch, do not plan, do not commit:**
- `frontend/src/lib/i18n/translations/index.ts` (locale registry — read only)
- `packages/app-shared/src/settings/staticSettings.ts`
- `translationKey.ts`, any locale registration, any RTL/direction config
- `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` (read
  only; Task 7 runs a **scratchpad copy**, never an edited repo copy)

Registering `so` as a selectable locale (`index.ts` `locales` map +
`staticSettings.supportedLocales`) is a deliberate **out-of-scope follow-up**.
This task creates the content only. Until registration lands, the `so/` files
are inert — that is expected and correct.

**Commit fence:** commit only `frontend/src/lib/i18n/translations/so/` and this
plan's own `.planning/` artifacts. Nothing else. If `git status --porcelain`
shows a modified file outside `so/`, revert it before committing.

**Commit note (this repo):** the husky/lint-staged pre-commit hook runs a build
and aborts `.planning`-only commits. Use `git commit --no-verify` for the
`.planning` artifact commit, then verify the blob is non-empty with
`git show --stat HEAD`. The `so/` content commit should run the hook normally.

---

# TASK 1 CONTENT — THE LOCKED SOMALI GLOSSARY

**This section is the single source of truth for Tasks 2-6.** A translator agent
reads ONLY this section plus its own batch's `en/` and `fi/` files. Nothing here
is a suggestion. If a term appears below, use the locked Somali rendering
verbatim. If a term does NOT appear below, translate it naturally following the
conventions, and prefer a construction built from locked terms.

## 1. Locked conventions

### C-1. Orthography

- **Latin script, standard Somali (Af-Soomaali) spelling. Never Arabic script.**
- Use the full Somali consonant inventory correctly: **`c`** (voiced pharyngeal,
  e.g. *cod*, *caawimo*, *ficil*), **`x`** (voiceless pharyngeal, e.g. *xisbi*,
  *xaqiiji*, *xir*), **`q`** (uvular, e.g. *qari*, *qayb*, *doorasho*), **`dh`**
  (retroflex, e.g. *dhammaan*, *dhexdhexaad*), **`kh`** (e.g. *khalad*), **`sh`**
  (e.g. *shaandhee*).
- The apostrophe `'` marks the glottal stop and is **part of the spelling**:
  *su'aal*, *su'aalo*, *mas'uul*, *ra'yi*. Use the plain ASCII apostrophe `'`
  (U+0027), never a typographic quote — it must survive JSON escaping unchanged.
- Long vowels are written doubled: *doorasho*, *natiijo*, *iimayl*, *waajib*.
- Do not use Arabic-script diacritics, tatweel, or any RTL control characters.
  Somali text here is left-to-right.

### C-2. Register and person

- **Neutral, plain, civic-service Somali.** Not literary, not colloquial, not
  religious register. Aim at the reading level of a national election
  information leaflet.
- **Address the user in the second person SINGULAR (`adiga`) everywhere.**
  Somali has no T/V politeness split; the singular is the neutral civic form and
  the plural (`idinka`) would read as addressing a group. This matches the
  Finnish source's singular address.
  - Buttons and calls to action use the **imperative singular**: *Dooro*,
    *Kaydi*, *Sii wad*, *Dib u noqo*.
  - Statements about the user use singular possessive/verbal agreement:
    *jawaabahaaga* ("your answers"), *waad karaysaa* ("you can"),
    *waa inaad …* ("you must …").
- **Exception:** the app speaks about itself in the first person plural (*waannu*
  / *waxaannu*) where `en` says "we" — e.g. `privacy.cookies.content`,
  `error.content`. Keep that.
- Politeness marker: render `en` "Please" as **`fadlan`**, placed
  sentence-initially (*Fadlan la xidhiidh taageerada.*) or before the verb.
  Do not drop it, and do not add it where `en` does not have it.

### C-3. Capitalisation and punctuation

- **Somali has no English-style Title Case. Use SENTENCE CASE throughout**, even
  where the `en` source uses Title Case ("Save and Continue" → *Kaydi oo sii
  wad*; "Basic Information" → *Macluumaadka aasaasiga ah*).
  - Capitalise the **first letter** exactly when `en` capitalises the first
    letter. `common.home` is lowercase `"home"` in `en` → lowercase in `so`.
  - Capitalise proper nouns and the product name only (see C-4).
- **Preserve trailing punctuation exactly**: a value ending in `.` keeps `.`; a
  value ending in `!` keeps `!`; a value with no trailing punctuation gets none.
- **Preserve the exact characters** `…` (U+2026 HORIZONTAL ELLIPSIS — never
  three dots), `—` (U+2014 EM DASH), `’` (U+2019 RIGHT SINGLE QUOTATION MARK
  where it appears in `en`), `&` , `%`, `€`.
- **Preserve the exact whitespace of separator and affix strings.**
  `common.multipleAnswerSeparator` is `" • "` — one space, bullet, one space.
  Leading/trailing spaces in any value are load-bearing; copy them.
- Somali uses the same `.`/`,`/`?`/`!` punctuation as English. Do not introduce
  Arabic punctuation (`؟`, `،`, `؛`).

### C-4. Untranslated-by-design values

**Copy these byte-for-byte. Never translate, never inflect, never re-case.**

**(a) Whole values that stay identical to `en` (11 key paths + 20 emoji keys):**

| Key path | Value | Why |
|---|---|---|
| `common.missingAnswer` | `—` | em dash, missing-answer marker |
| `common.multipleAnswerSeparator` | `" • "` | separator, exact whitespace |
| `common.madeWithSuffix` | `""` | empty by design (Somali needs no suffix after the brand) |
| `common.openVAA` | `OpenVAA` | brand |
| `components.matchScore.score` | `{score}%` | pure placeholder + symbol |
| `entityDetails.tabs.candidates` | `{candidatePlural}` | pure placeholder |
| `about.source.sitename` | `GitHub` | brand |
| `adminApp.jobs.id` | `ID` | technical identifier column |
| `dynamic.candidateAppPrivacy.otherTermsOfUse.content` | `""` | empty by design |
| every `heroEmoji` key | emoji glyph | decorative glyph, not text |
| `candidateApp.register.codePlaceholder` sample | `CP23-174a-f4%&-aHAB` | literal code sample inside a translated sentence |

There are exactly **20 `heroEmoji` keys**: 15 in `dynamic.json`, 3 in
`candidateApp.preregister.json`, 1 in `candidateApp.notSupported.json`, 1 in
`adminApp.notSupported.json`. Copy each glyph unchanged (do not re-encode, do
not add or strip the variation selector).

**(b) Literals that must survive verbatim INSIDE an otherwise-translated value:**

| Literal | Occurrences | Handling |
|---|---|---|
| `Bank ID` | 4× in `candidateApp.preregister.json` | wrap in Somali: *adeegga Bank ID*, *aqoonsiga Bank ID* |
| `OpenVAA` | `common.openVAA` + `{openVAA}` payload | brand |
| `GitHub` | `about.source.sitename` | brand |
| `Umami` | 2× in `privacy.json` | wrap: *adeegga Umami* |
| `DATA_CONTROLLER`, `DATA_CONTACT_PERSON`, `DATA_STORAGE_TERM_EG_5_YRS` | `dynamic.candidateAppPrivacy.registryStatement.content` | ALL-CAPS build-time placeholders, copy exactly |
| `CP23-174a-f4%&-aHAB` | `candidateApp.register.codePlaceholder` | code sample |
| `!?%#€` | `candidateApp.register.passwordValidation.symbol` | symbol sample |
| `MB` | 2× in `components.json` (`{maxFilesize} MB`) | keep the SI-style unit `MB` |
| `LLM` | `adminApp.questionInfo.customInstructions.help` | acronym; wrap: *LLM-ka* |
| `local storage` | `privacy.cookies.content` | keep in parentheses after the Somali gloss (matches the `fi` pattern) |
| `N/A` | — | **DO NOT keep**; `adminApp.jobs.notAvailable` translates to *Ma jiro* |

**(c) Any value that is purely punctuation, symbols, whitespace, or an empty
string is copied verbatim.**

### C-5. Loanword policy

Somali has settled vocabulary for civic and electoral concepts and takes many of
them from Arabic (*xisbi*, *musharrax*, *waajib*). Modern software vocabulary is
less settled. The ruling, in priority order:

1. **Use the settled Somali/Arabic-Somali term where one exists.** Do not
   English-loan a word that Somali already has: *doorasho* not "election-ka",
   *su'aal* not "question-ka", *furaha sirta ah* not "password-ka".
2. **Where no settled equivalent exists and the concept is digital-technical,
   use a transliterated loan adapted to Somali phonotactics**, with the definite
   suffix attached: *boroofaylka* (profile), *biraawsarka* (browser),
   *konsoolka* (console), *kukiyada* (cookies), *faktooyinka* (factors).
   Transliterate with epenthetic vowels (Somali disallows initial clusters):
   *profile* → *boroofayl*, *browser* → *biraawsar*.
3. **Never leave an English word bare inside Somali prose** unless it is on the
   C-4(b) verbatim list. If a loan is used, it is transliterated and inflected.
4. **Never coin a novel compound where a locked term exists.** The per-term
   rulings below are binding; they are not defaults to be re-litigated.
5. **Never gloss in parentheses** ("waafaqsanaan (match)") except for the two
   cases explicitly locked below: `local storage` in `privacy.cookies.content`
   and `(GDPR)` after the spelled-out regulation name.

**Contested terms — rulings are final (do not re-decide per batch):**

| Concept | Ruling | Rejected alternative and why |
|---|---|---|
| opinion | **aragti** | *ra'yi* (bare Arabic loan, formal/legalistic); *fikrad* (= idea, too abstract) |
| constituency | **degmo doorasho** | *goob doorasho* (= polling station — actively wrong) |
| nomination / candidacy | **musharraxnimo** | *magacaabis* (= appointment by an authority, wrong agent) |
| menu (UI) | **liiska xulashada** | bare *liis* (collides with `yourList` / `electionList`) |
| profile | **boroofayl** | *bogga shakhsiga* (reads as a navigation page, not a data object) |
| match / matching | **waafaqsanaan** | *is-barbardhigid* (= comparison, not agreement) |
| filter | **shaandhee** / **shaandhooyin** | *filtar* (unnecessary loan; *shaandhee* is settled) |
| factor (statistical) | **fakto** / pl. **faktooyin** | no Somali equivalent exists; loan per rule 2 |
| link (hyperlink) | **xidhiidh** / pl. **xidhiidhada** | *linkiga* (unnecessary loan) |
| Election Compass (product) | **Hagaha Doorashada** | leaving it English — `fi`/`sv`/`da`/`et` all translate it |
| cookies (web) | **kuki** / pl. **kukiyo**, def. **kukiyada** | leaving "cookies" bare |
| account | **akoon**, def. **akoonka** | *xisaab* (= arithmetic/bank account, ambiguous) |

---

## 2. THE GLOSSARY

Format: `en` | `fi` (reference) | **`so` (LOCKED)** | usage note.

### Section A — Core VAA domain

| en | fi | **so (locked)** | note |
|---|---|---|---|
| candidate (sing.) | ehdokas | **musharrax** | def. *musharraxa* |
| candidates (pl.) | ehdokkaat | **musharraxiin** | def. *musharraxiinta*. `common.candidate.plural` is lowercase in `en` — keep lowercase |
| party (sing.) | puolue | **xisbi** | def. *xisbiga*. `common.organization.singular` |
| parties (pl.) | puolueet | **xisbiyo** | def. *xisbiyada*. `common.organization.plural`, lowercase |
| organization | puolue | **xisbi** | this app renders `organization` as "party"; never *urur* |
| alliance (sing.) | vaaliliitto | **isbahaysi** | electoral alliance |
| alliances (pl.) | vaaliliitot | **isbahaysiyo** | def. *isbahaysiyada* |
| faction (sing.) | ryhmittymä | **koox** | narrower than *isbahaysi*: an informal grouping |
| factions (pl.) | ryhmittymät | **kooxo** | def. *kooxaha* |
| election (sing.) | vaali | **doorasho** | def. *doorashada* |
| elections (pl.) | vaalit | **doorashooyin** | def. *doorashooyinka* |
| constituency | vaalipiiri | **degmo doorasho** | def. *degmada doorashada* |
| constituencies | vaalipiirit | **degmooyin doorasho** | def. *degmooyinka doorashada* |
| constituency group | vaalipiirien ryhmä | **koox degmooyin doorasho** | `{constituencyGroup}` payload substitutes a name here |
| in constituency | vaalipiirissä | **degmada doorashada** | `results.inConstituency`, lowercase |
| nomination / candidacy | ehdokkuus | **musharraxnimo** | pl. *musharraxnimooyin*. A candidate's standing in one election+constituency |
| to stand / run as a candidate | asettua ehdolle | **isku sharrax** | *"Isku sharrax musharraxnimo"* |
| election symbol | vaalisymboli | **astaanta doorashada** | `common.electionSymbol.{alliance,faction,organization}` |
| election number | ehdokasnumero | **lambarka musharraxa** | `common.electionSymbol.candidate` |
| election list | vaalilista | **liiska doorashada** | `common.electionList` — `en` says only "List"; expand as `fi` does |
| candidate list (official) | vaaliluettelo | **liiska rasmiga ah ee musharraxiinta** | the confirmed official register |
| election date | vaalipäivä | **taariikhda doorashada** | |
| question | kysymys | **su'aal** | def. *su'aasha* (**feminine**) |
| questions | kysymykset | **su'aalo** | def. *su'aalaha* |
| answer (noun) | vastaus | **jawaab** | pl. *jawaabo*, def. *jawaabaha* |
| answer (verb) | vastata | **ka jawaab** | *"Ka jawaab su'aashan"* |
| opinion | mielipide | **aragti** | def. *aragtida* |
| opinions | mielipiteet | **aragtiyo** | def. *aragtiyaha*. `questions.title` "Opinions" → *Aragtiyahaaga* (as `fi` "Mielipiteesi") |
| opinion question / statement | mielipidekysymys / väittämä | **su'aal aragtiyeed** | pl. *su'aalo aragtiyeed* |
| info question | tietokysymys | **su'aal macluumaad** | |
| category / theme | teema | **mawduuc** | pl. *mawduucyo*. `fi` uses "teema", not "kategoria" — follow that |
| results | tulokset | **natiijooyin** | def. *natiijooyinka*; sing. *natiijo* |
| your results | tuloksesi | **Natiijooyinkaaga** | `results.title.results` |
| match (score label) | sopivuus | **waafaqsanaan** | `components.matchScore.label`, lowercase |
| match score | sopivuustulos | **natiijada waafaqsanaanta** | |
| party matching | puolueiden tulokset | **waafaqsanaanta xisbiyada** | `about.organizationMatching.title` |
| Election Compass (product) | Vaalikone | **Hagaha Doorashada** | both words capitalised — it is the product name |
| Election Compass for Candidates | Ehdokkaiden vaalikone | **Hagaha Doorashada ee musharraxiinta** | |
| Election Compass for voters | Äänestäjien vaalikone | **Hagaha Doorashada ee codbixiyayaasha** | |
| voting advice application | vaalikone | **hagaha doorashada** | lowercase when generic (`adminApp.common.description`) |
| vote (verb) | äänestää | **cod bixi** | |
| political / politics | poliittinen / politiikka | **siyaasadeed** / **siyaasadda** | *"arrimaha siyaasadda"* = political issues |
| values (political) | arvot | **qiyamka** | |

### Section B — Actors, app surfaces, objects

| en | fi | **so (locked)** | note |
|---|---|---|---|
| voter | äänestäjä | **codbixiye** | |
| voters | äänestäjät | **codbixiyayaal** | def. *codbixiyayaasha* |
| admin / administrator | ylläpitäjä | **maamule** | pl. *maamulayaal* |
| system administrator | järjestelmänvalvoja | **maamulaha nidaamka** | |
| admin app / admin view | ylläpitonäkymä | **barnaamijka maamulaha** | |
| Admin Control Panel | — | **Guddiga maamulka** | `adminApp.jobs.title` |
| admin privileges | ylläpitäjän oikeudet | **xuquuqaha maamulaha** | |
| candidate app | ehdokkaiden vaalikone | **barnaamijka musharraxiinta** | |
| voter app | äänestäjien vaalikone | **barnaamijka codbixiyayaasha** | |
| application / app | sovellus | **barnaamij** | def. *barnaamijka* |
| profile | profiili | **boroofayl** | def. *boroofaylka*; "Your Profile" → *Boroofaylkaaga* |
| public profile | julkinen profiili | **boroofaylkaaga dadweynaha** | |
| list | lista | **liis** | pl. *liisas* |
| Your List | Muistilistasi | **Liiskaaga** | `yourList.title` |
| favourites / saved items | — | **liiska kaydka** | not in any current file; use if encountered |
| page | sivu | **bog** | def. *bogga*, pl. *bogag* |
| front page / home | etusivu | **bogga hore** | `common.home` is lowercase → *bogga hore*; `adminApp.common.home` → *Bogga hore* |
| start (nav label) | alku | **Bilowga** | `candidateApp.common.home` = "Start" |
| section | osio | **qayb** | pl. *qaybo* |
| support | tuki | **taageero** | def. *taageerada* |
| candidate support | ehdokastuki | **Taageerada musharraxiinta** | `candidateApp.help.title` |
| support request | tukipyyntö | **Codsi taageero** | `candidateApp.help.supportEmailSubject` |
| publisher | julkaisija | **daabace** | "Published by {publisher}" → *Waxaa daabacay {publisher}* |
| user | käyttäjä | **isticmaale** | pl. *isticmaalayaal* |
| username | käyttäjätunnus | **magaca isticmaalaha** | |
| browser | selain | **biraawsar** | def. *biraawsarka* |
| device | laite | **qalab** | def. *qalabka* |
| image / photo | kuva | **sawir** | def. *sawirka* |
| file | tiedosto | **fayl** | pl. *faylal* |
| URL / web address | verkko-osoite | **cinwaan internet** | |
| link (hyperlink) | linkki | **xidhiidh** | pl. *xidhiidhada*. `entityDetails.links` → *Xidhiidhada* |
| button | painike | **badhan** | "the button below" → *badhanka hoose* |
| window | ikkuna | **daaqad** | |
| checkbox | ruutu | **sanduuqa calaamadaynta** | |
| field (form) | kenttä | **goob** | pl. *goobo* |
| icon | ikoni | **astaan** | |
| email (noun) | sähköposti | **iimayl** | def. *iimaylka* |
| survey | kysely | **sahan** | "user survey" → *sahanka isticmaalayaasha* |
| feedback | palaute | **jawaab-celin** | def. *jawaab-celinta*. Keep the hyphen |
| statistics | tilastotietoja | **Tirakoob** | `statistics.title` |
| help | ohje | **Caawimo** | `help.title` |
| info | lisätietoja | **Macluumaad** | `common.info` |
| further information | lisätietoja | **Macluumaad dheeraad ah** | |
| basic information | perustiedot | **Macluumaadka aasaasiga ah** | |
| personal information | henkilötiedot | **Macluumaadka shakhsiga ah** | |
| maintenance | huolto | **dayactir** | "Under Maintenance" → *Dayactir baa socda* |
| source code | lähdekoodi | **koodka isha** | `about.source.title` |
| argument / reasoning | perustelut | **doodo** | `candidateApp.questions.openAnswerPrompt` "Arguments" → *Doodo* |

### Section C — UI verbs and controls (imperative singular)

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Back | Palaa | **Dib u noqo** | |
| Return | Palaa | **Dib u noqo** | `fi` uses the same word for both — do the same |
| Return Home | Palaa etusivulle | **Dib ugu noqo bogga hore** | |
| Cancel | Peruuta | **Jooji** | |
| Clear (empty) | Tyhjennä | **Nadiifi** | `common.clear`; distinct from *Tirtir* (delete) |
| Clear your answers | Tyhjennä vastauksesi | **Nadiifi jawaabahaaga** | `common.resetAnswers` |
| Close | Sulje | **Xir** | |
| Continue | Jatka | **Sii wad** | |
| Continue filling | Jatka täyttämistä | **Sii wad buuxinta** | |
| Save | Tallenna | **Kaydi** | |
| Save and Continue | Tallenna ja jatka | **Kaydi oo sii wad** | |
| Save and Return | Tallenna ja palaa | **Kaydi oo dib u noqo** | |
| Send / Submit | Lähetä | **Dir** | |
| Edit | Muokkaa | **Wax ka beddel** | the settled Somali for "edit" |
| Remove / Delete | Poista | **Tirtir** | "Delete answer" → *Tirtir jawaabta* |
| Add | Lisää | **Ku dar** | |
| Select / Choose | Valitse | **Dooro** | |
| Select all | Valitse kaikki | **Dooro dhammaan** | |
| Deselect / Unselect | Poista valinta | **Ka saar xulashada** | `components.input.deleteOption` → *Ka saar xulashada: {option}* (colon form, as `fi`) |
| Unselect all | Poista valinta kaikista | **Ka saar dhammaan** | |
| Search (verb) | Etsi | **Raadi** | "Search by name" → *Magac ku raadi* |
| search term | hakusana | **eray raadin** | `entityFilters.text.*` |
| Filter (verb/button) | Suodata | **Shaandhee** | |
| filters (noun) | suodattimet | **shaandhooyin** | def. *shaandhooyinka* |
| Sort / order | Järjestä | **Kala saar** | |
| Show / Display | Näytä | **Muuji** | |
| Show more | Näytä lisää | **Muuji wax dheeraad ah** | |
| Hide | Piilota | **Qari** | |
| View / Inspect | Tarkastele | **Eeg** | |
| Expand | Laajenna | **Ballaari** | |
| Collapse | Pienennä | **Yaree** | "Collapse list" → *Yaree liiska* |
| Skip | Ohita | **Ka bood** | |
| Skip to X | Hyppää X:ään | **U bood X** | "Skip to Results" → *U bood natiijooyinka* |
| Retry / Try again | Yritä uudelleen | **Isku day mar kale** | |
| Try again later | Yritä myöhemmin | **Isku day mar dambe** | |
| Next | Seuraava | **Xiga** | "Next question" → *Su'aasha xigta* |
| Previous | Edellinen | **Tii hore** | **feminine agreement** with *su'aal*; `questions.previous` |
| Open | Avaa | **Fur** | |
| Apply | Käytä | **Dabbaqi** | |
| Reset | Nollaa | **Dib u deji** | "Reset filters" → *Dib u deji shaandhooyinka* |
| Sign in / Log in | Kirjaudu | **Soo gal** | `common.login`, `candidateApp.login.title`, `adminApp.login.button` — all identical |
| Log out | Kirjaudu ulos | **Ka bax** | |
| Register | Rekisteröidy | **Is diiwaangeli** | |
| registration | rekisteröityminen | **diiwaangelin** | def. *diiwaangelinta* |
| preregistration | ennakkorekisteröinti | **diiwaangelinta hordhaca ah** | |
| Identify yourself | Tunnistaudu | **Is aqoonsii** | bank-auth flow |
| Confirm / Verify | Vahvista | **Xaqiiji** | |
| Accept / Agree to | Hyväksy | **Aqbal** | |
| Deny / Decline | Kiellä | **Diid** | |
| Consent (verb) | Salli / Anna suostumus | **Ogolow** | noun: *ogolaansho* |
| Upload | Lataa | **Soo geli** | image upload |
| Download | Lataa | **Soo deji** | |
| Change | Vaihda | **Beddel** | |
| Update | Päivitä | **Cusboonaysii** | |
| Enter (data) | Syötä | **Geli** | |
| Fill in | Täytä | **Buuxi** | |
| Generate | Luo | **Soo saar** | admin AI tooling |
| Compute | Laske | **Xisaabi** | |
| Abort | Keskeytä | **Jooji** | |
| Start | Aloita | **Bilow** | |
| Play (media) | Toista | **Bilow** | |
| Pause | Tauota | **Hakad geli** | |
| Replay | Toista uudelleen | **Dib u bilow** | |
| Mute | Äänet pois | **Dami codka** | |
| Unmute | Äänet päälle | **Shid codka** | |
| Tap | Napauta | **Taabo** | |
| Click / Press | Napsauta / Paina | **Riix** | |
| Read More | Lue lisää | **Akhri wax dheeraad ah** | `common.readMore` |
| Learn more | Tutustu aiheeseen | **Baro wax dheeraad ah** | `components.questionExtendedInfo.title` |
| Browse | Selaa | **Fiiri** | `results.title.browse` |
| Preview (verb) | Esikatsele | **Horudhac u samee** | |
| Preview (noun) | Esikatselu | **Horudhac** | |
| Contact | Ota yhteyttä | **La xidhiidh** | "Contact support" → *La xidhiidh taageerada* |
| Compare | Vertaa | **Isbarbardhig** | |
| Narrow down | Karsia | **Yaree** | |

### Section D — States and status

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Loading… | Ladataan… | **Waa la soo rarayaa…** | `…` is U+2026 |
| Saving… | Tallennetaan… | **Waa la kaydinayaa…** | |
| Sending… | Lähetetään… | **Waa la dirayaa…** | |
| Generating... | — | **Waa la soo saarayaa...** | `adminApp.*.buttonLoading` uses three ASCII dots in `en` — **copy the ASCII dots, not `…`** |
| Computing factors... | — | **Waa la xisaabinayaa faktooyinka...** | same ASCII-dots rule |
| Aborting… | — | **Waa la joojinayaa…** | `adminApp.jobs.aborting` uses `…` |
| Pending (unconfirmed) | Vahvistamaton | **Aan la xaqiijin** | `common.pending` |
| Confirmed | Vahvistettu | **La xaqiijiyay** | |
| Locked | Lukittu | **Qufulan** | |
| Required | Vaadittava | **Waajib** | |
| Optional | Valinnainen | **Ikhtiyaari** | `adminApp.*` "(optional)" → *(ikhtiyaari)* |
| error | virhe | **khalad** | pl. *khaladaad* |
| warning | varoitus | **digniin** | pl. *digniino* |
| Something went wrong | Jotakin meni pieleen | **Wax baa qaldamay** | |
| success (noun) | onnistuminen | **guul** | |
| Action successful! | Toiminto onnistui! | **Howshu way guulaysatay!** | `common.success` (note `en` typo "succesful" — translate the intent) |
| failed | epäonnistui | **fashilmay** | "Login failed" → *Soo gelidda way fashilantay* |
| invalid | virheellinen | **aan sax ahayn** | |
| valid | kelvollinen | **sax ah** | |
| missing | puuttuva | **maqan** | |
| unanswered | vastaamaton | **aan la jawaabin** | |
| No answer | Ei vastausta | **Jawaab ma jirto** | `entityFilters.missingValue` |
| missing-answer marker | — | **`—`** | `common.missingAnswer` — DO NOT TRANSLATE |
| Unaffiliated | Sitoutumaton | **Madax banaan** | = independent, not party-affiliated |
| draft | luonnos | **qabyo** | |
| published | julkaistu | **la daabacay** | |
| Active | Aktiivinen | **Firfircoon** | `adminApp.jobs.activeJobs` → *Hawlaha firfircoon* |
| Past (jobs) | Menneet | **Hore** | *Hawlihii hore* |
| Available | Saatavilla | **La heli karo** | |
| not available | ei saatavilla | **lama heli karo** | `results.missingNominations.noNominationsForElection`, lowercase |
| N/A | — | **Ma jiro** | `adminApp.jobs.notAvailable` — translate, do NOT keep "N/A" |
| expired | vanhentunut | **dhacay** | "Your session has expired" → *Fadhigaagii wuu dhacay* |
| Progress | Eteneminen | **Horumar** | |
| State / Status | Tila | **Xaalad** | `common.state` |
| Duration | Kesto | **Muddo** | |
| Started | Aloitettu | **Bilaabmay** | |
| Author | Tekijä | **Qoraa** | |
| Messages | Viestit | **Farriimo** | |
| System Health | Järjestelmän tila | **Caafimaadka nidaamka** | |

### Section E — Account and auth

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Email | Sähköposti | **Iimayl** | `common.email`, `adminApp.login.email` |
| email address | sähköpostiosoite | **cinwaanka iimaylka** | |
| Password | Salasana | **Furaha sirta ah** | the ONLY rendering; never *password-ka* |
| Confirm password | Vahvista salasana | **Xaqiiji furaha sirta ah** | |
| New Password | Uusi salasana | **Furaha sirta ah ee cusub** | |
| Current Password | Nykyinen salasana | **Furaha sirta ah ee hadda** | |
| New Password Confirmation | Uuden salasanan vahvistus | **Xaqiijinta furaha sirta ah ee cusub** | |
| Passwords don't match | Salasanat eivät täsmää | **Furayaasha sirta ah isku mid ma aha** | |
| Forgot Password? | Unohditko salasanan? | **Ma illowday furaha sirta ah?** | |
| Set password | Aseta salasana | **Deji furaha sirta ah** | |
| Reveal / Hide password | Näytä / Piilota salasana | **Muuji / Qari furaha sirta ah** | |
| Account | Tili | **Akoon** | def. *akoonka* |
| Account Password | Tilin salasana | **Furaha sirta ah ee akoonka** | |
| Settings | Asetukset | **Habaynta** | |
| App Language | Sovelluksen kieli | **Luqadda barnaamijka** | |
| language | kieli | **luqad** | "Select Language" → *Dooro luqadda* |
| First Name | Etunimi | **Magaca hore** | |
| Surname | Sukunimi | **Magaca dambe** | |
| date of birth | syntymäaika | **taariikhda dhalashada** | |
| Privacy | Yksityisyys | **Asturnaanta** | `privacy.title` |
| Privacy (data protection) | Tietosuoja | **Ilaalinta xogta** | `candidateApp.privacy.shortTitle` — the legal sense |
| Privacy and terms of use | Tietosuoja ja käyttöehdot | **Ilaalinta xogta iyo shuruudaha isticmaalka** | |
| Terms of use | Käyttöehdot | **Shuruudaha isticmaalka** | |
| Registry and privacy statement | Rekisteri- ja tietosuojaseloste | **Qoraalka diiwaanka iyo ilaalinta xogta** | |
| registry | rekisteri | **diiwaan** | def. *diiwaanka* |
| data controller | rekisterinpitäjä | **mas'uulka xogta** | note the apostrophe |
| contact person | yhteyshenkilö | **qofka xidhiidhka** | |
| Session | Istunto | **Fadhi** | def. *fadhiga* |
| reset link | palautuslinkki | **xidhiidhka dib u dejinta** | |
| confirmation link | vahvistuslinkki | **xidhiidhka xaqiijinta** | |
| registration code | rekisteröintikoodi | **koodka diiwaangelinta** | |
| code | koodi | **kood** | |
| identity verification | tunnistautuminen | **xaqiijinta aqoonsiga** | |
| Bank ID | pankkitunnistautuminen | **Bank ID** | **brand — keep verbatim**; wrap as *adeegga Bank ID* |
| cookies | evästeet | **kukiyada** | sing. *kuki* |
| local storage | paikallinen säilö (local storage) | **kaydka maxalliga ah (local storage)** | keep the parenthetical, as `fi` does |
| analytics | analytiikka | **falanqayn** | |
| usage data | käyttötiedot | **xogta isticmaalka** | |
| anonymously | nimettömästi | **si aan magac lahayn** | |
| consent (noun) | suostumus | **ogolaansho** | |
| EU General Data Protection Regulation | EU:n yleinen tietosuoja-asetus | **Xeerka Guud ee Ilaalinta Xogta ee Midowga Yurub (GDPR)** | keep `(GDPR)` |
| EEA | ETA | **Aagga Dhaqaalaha Yurub (EEA)** | |
| right to be forgotten | oikeus tulla unohdetuksi | **xuquuqda in la ilaawo** | |
| lowercase / uppercase letter | pieni / iso kirjain | **xaraf yar** / **xaraf weyn** | |
| number (digit) | numero | **lambar** | |
| symbol | erikoismerkki | **astaan** | *Astaan (sida !?%#€)* |
| character | merkki | **xaraf** | *"Ugu yaraan {minPasswordLength} xaraf"* |

### Section F — Agreement / answer scale

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Yes | Kyllä | **Haa** | `common.answer.yes` |
| No | Ei | **Maya** | `common.answer.no` |
| No Thanks | Ei kiitos | **Maya, mahadsanid** | `common.thanksNo` |
| agree (with you) | olla samaa mieltä | **kula waafaqsan** | |
| agree completely | olla täysin samaa mieltä | **gebi ahaanba isku waafaqsan** | |
| disagree | olla eri mieltä | **is khilaafsan** | |
| strongly agree | vahvasti samaa mieltä | **si buuxda u waafaqsan** | scale wording, if encountered |
| somewhat agree | jokseenkin samaa mieltä | **xoogaa u waafaqsan** | |
| neutral / neither | neutraali | **dhexdhexaad** | |
| somewhat disagree | jokseenkin eri mieltä | **xoogaa u khilaafsan** | |
| strongly disagree | vahvasti eri mieltä | **si buuxda u khilaafsan** | |
| "the {candidatePlural} that agree with you the most" | — | **"{candidatePlural} ee aad ugu badan kula waafaqsan"** | `results.ingress.answerMinQuestions`, `dynamic.intro.*` |
| "A score of 100 means…" | — | **"Natiijada 100 waxay ka dhigan tahay…"** | `about.content` |
| member of {organization} | puolueen {organization} jäsen | **xubin ka ah {organization}** | `entityDetails.memberOfOrganization`, lowercase |

### Section G — Accessibility and screen-reader phrasings

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Skip to main content | Hyppää sisältöön | **U bood nuxurka bogga** | `common.skipToMain` |
| Toggle menu | Avaa tai sulje valikko | **Fur ama xir liiska xulashada** | `common.openCloseMenu` |
| Open menu | Avaa valikko | **Fur liiska xulashada** | |
| Close menu | Sulje valikko | **Xir liiska xulashada** | |
| Close dialog | Sulje valintaikkuna | **Xir daaqadda xulashada** | `common.closeDialog` |
| Expand or collapse this section | Laajenna tai pienennä tämä sisältö | **Ballaari ama yaree qaybtan** | `common.expandOrCollapse` |
| menu | valikko | **liiska xulashada** | never bare *liis* |
| dialog | valintaikkuna | **daaqadda xulashada** | |
| Heading group | Otsikkoryhmä | **Koox cinwaanno ah** | `components.headingGroup.roleDescription` |
| Pre-title | Otsikon esirivi | **Cinwaan-hordhac** | `components.preHeading.roleDescription` |
| heading / title | otsikko | **cinwaan** | |
| Primary actions | Ensisijaiset toiminnot | **Ficillada aasaasiga ah** | `common.primaryActions` |
| Tap to show all options | Napauta näyttääksesi kaikki vaihtoehdot | **Taabo si aad u aragto dhammaan xulashooyinka** | |
| option | vaihtoehto | **xulasho** | pl. *xulashooyin* |
| Portrait (candidate photo) | Omakuva | **Sawirka shakhsiga** | `common.candidatePortrait` |
| Show full image | Näytä täysikokoinen kuva | **Muuji sawirka oo dhan** | |
| Further actions for this question | Lisää toimintoja tähän kysymykseen liittyen | **Ficillo dheeraad ah oo su'aashan la xidhiidha** | `questions.additionalActions` |
| Background information on the question | Taustatietoja tästä kysymyksestä | **Macluumaad asaasi ah oo ku saabsan su'aasha** | `questions.infoDescription` |
| Time remaining | Aikaa jäljellä | **Waqtiga hadhay** | |

### Section H — Media player

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Video | Video | **Fiidiyow** | |
| Subtitles | Tekstitykset | **Qoraal-hoosaadyo** | keep the hyphen |
| Captions (descriptive) | Kuvailevat tekstitykset | **Qoraallo sharraxaad ah** | distinct from subtitles |
| Text / Transcript | Teksti | **Qoraal** | |
| Show video as text | Näytä video tekstinä | **Muuji fiidiyowga qoraal ahaan** | |
| Switch between video and text | Vaihda teksti- ja videonäkymän välillä | **U kala beddel muuqaalka fiidiyowga iyo qoraalka** | |
| Jump back | Hyppää taaksepäin | **Dib u bood** | |
| Jump forward | Hyppää eteenpäin | **Hore u bood** | |
| minute(s) | minuutti / minuuttia | **daqiiqad** / **daqiiqado** | ICU `=1 {…}` / `other {# …}` branches |
| second(s) | sekunti / sekuntia | **ilbiriqsi** / **ilbiriqsiyo** | |
| left (remaining) | jäljellä | **ayaa hadhay** | `components.video.timeLeft` — trailing position |

### Section I — Recurring connective phrases (lock to prevent drift)

| en pattern | **so (locked)** | note |
|---|---|---|
| "Please …" | **"Fadlan …"** | |
| ", sorry!" (trailing) | **", waan ka xunnahay!"** | `error.404`, `error.500`, `error.default`, `entityFilters.error` |
| "Sorry, …" (leading) | **"Waan ka xunnahay, …"** | |
| "We're very sorry" | **"Aad baannu uga xunnahay"** | |
| "We're terribly sorry" | **"Aad baannu uga xunnahay"** | same rendering |
| "Something went wrong" | **"Wax baa qaldamay"** | |
| "Please contact support." | **"Fadlan la xidhiidh taageerada."** | |
| "if the problem persists" | **"haddii dhibaatadu sii socoto"** | |
| "below" / "the button below" | **"hoos"** / **"badhanka hoose"** | |
| "above" | **"kor"** | |
| "You can …" | **"Waad karaysaa …"** | 2nd sing. |
| "You must …" | **"Waa inaad …"** | |
| "You have …" | **"Waxaad haysataa …"** | |
| "Thank you!" | **"Mahadsanid!"** | |
| "Thanks for …" | **"Waad ku mahadsan tahay …"** | |
| "Congratulations!" | **"Hambalyo!"** | |
| "Hello, {username}!" | **"Salaan, {username}!"** | |
| "Welcome to X" | **"Ku soo dhawoow X"** | |
| "Let's start!" | **"Aan bilowno!"** | `dynamic.intro.title` |
| "You're Ready to Roll!" | **"Waad diyaar tahay!"** | `candidateApp.home.ready` |
| "E.g." / "For example" | **"Tusaale:"** | |
| "such as" | **"sida"** | |
| "and" | **"iyo"** | |
| "Or" (standalone) | **"Ama"** | `common.or` |
| "first" (do X first) | **"marka hore"** | |
| "Next, …" (discourse) | **"Marka xigta, …"** | |
| "Note that …" | **"Ogow in …"** | |
| "at least" | **"ugu yaraan"** | |
| "Made with" | **"Waxaa lagu dhisay"** | `common.madeWithPrefix`; suffix stays `""` |
| "Published by {publisher}" | **"Waxaa daabacay {publisher}"** | |
| "How Does This App Work?" | **"Sidee bay u shaqaysaa barnaamijkan?"** | `about.title` AND `candidateApp.info.title` — must be identical in both files |
| "Information About the Elections" | **"Macluumaad ku saabsan doorashooyinka"** | `info.title` |

### Section J — Admin and AI tooling

| en | fi | **so (locked)** | note |
|---|---|---|---|
| Argument Condensation | — | **Soo koobidda doodaha** | feature name; identical in `adminApp.argumentCondensation.title` and `adminApp.jobs.features.ArgumentCondensation.title` |
| argument | perustelu | **dood** | pl. *doodo* |
| condense | tiivistää | **soo koob** | |
| Factor Analysis | — | **Falanqaynta faktooyinka** | |
| factor | faktori | **fakto** | pl. *faktooyin*; loan per C-5 rule 2 |
| latent factors | latentit faktorit | **faktooyinka qarsoon** | |
| Question Info | — | **Macluumaadka su'aasha** | `adminApp.questionInfo.title` |
| Question Info Generation | — | **Soo saarista macluumaadka su'aasha** | |
| term definition | termin määritelmä | **qeexidda erayga** | |
| info section | tietoosio | **qaybta macluumaadka** | |
| job (background job) | työ | **hawl** | pl. *hawlo*, def. *hawlaha* |
| Abort Job | Keskeytä työ | **Jooji hawsha** | |
| Emergency cleanup | Hätäpuhdistus | **Nadiifin degdeg ah** | |
| pipeline | putki | **habraaca** | `adminApp.jobs.abortingInfo` |
| console | konsoli | **konsool** | def. *konsoolka* |
| LLM | LLM | **LLM** | acronym — keep verbatim, inflect as *LLM-ka* |
| Target Language | Kohdekieli | **Luqadda bartilmaameedka** | |
| Custom Instructions | Omat ohjeet | **Tilmaamo gaar ah** | |
| Question Context | — | **Macnaha guud ee su'aasha** | |
| Section Topics | — | **Mawduucyada qaybaha** | |
| Generation Options | — | **Xulashooyinka soo saarista** | |
| Comma-separated list | pilkulla erotettu lista | **liis ay comma kala qaybiso** | |
| data configuration | — | **habaynta xogta** | |
| data adapter | — | **isku-xirka xogta** | `adminApp.notSupported.content` |

---

<tasks>

<task type="tracer">
  <name>Task 1: Lock the glossary and scaffold the `so/` locale directory</name>
  <files>frontend/src/lib/i18n/translations/so/ (directory), frontend/src/lib/i18n/translations/so/common.json</files>
  <precondition>`frontend/src/lib/i18n/translations/en/` contains exactly 46 `.json` files and `frontend/src/lib/i18n/translations/so/` does not yet exist.</precondition>
  <action>
Read the entire "TASK 1 CONTENT — THE LOCKED SOMALI GLOSSARY" section above,
including all five conventions (C-1 orthography, C-2 register, C-3
capitalisation/punctuation, C-4 untranslated-by-design, C-5 loanword policy) and
all ten glossary sections (A-J). This section is frozen for the duration of this
plan — no task may re-decide a locked term. If a batch executor believes a locked
term is wrong, it stops and reports; it does not silently deviate.

Create the target directory:
`mkdir -p frontend/src/lib/i18n/translations/so`

Seed it by copying every English file across unchanged, preserving filenames:
`cp frontend/src/lib/i18n/translations/en/*.json frontend/src/lib/i18n/translations/so/`

This copy is the structural guarantee for HARD CONSTRAINT 1: every downstream
batch replaces values in place inside an already-correct key skeleton, so keys
cannot be added, dropped, renamed, or reordered.

Then translate ONE file end-to-end as the tracer slice: `so/common.json`. It is
the highest-leverage file (it defines candidate/party/election/constituency
plurals that every other file interpolates via `{candidatePlural}` etc.), it
exercises every constraint class in one pass (plain strings, a nested object, an
ICU placeholder in `publishedBy`, the em-dash `missingAnswer`, the whitespace-
sensitive `multipleAnswerSeparator`, the empty `madeWithSuffix`, the `OpenVAA`
brand, an ellipsis in `loading`/`saving`), and it proves the whole approach
before five agents run in parallel. Apply Section A, C, D, E, and G terms
verbatim.

Do NOT translate any other file in this task — the remaining 45 stay as English
copies until their batch runs.
  </action>
  <verify>
    <automated>test -d frontend/src/lib/i18n/translations/so &amp;&amp; test "$(ls frontend/src/lib/i18n/translations/so/*.json | wc -l | tr -d ' ')" = "46" &amp;&amp; node -e "const a=require('./frontend/src/lib/i18n/translations/en/common.json'),b=require('./frontend/src/lib/i18n/translations/so/common.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?f(v,p+k+'.'):[p+k]);const x=f(a).join('|'),y=f(b).join('|');if(x!==y){console.error('KEY MISMATCH');process.exit(1)}if(b.missingAnswer!=='—'||b.multipleAnswerSeparator!==' • '||b.madeWithSuffix!==''||b.openVAA!=='OpenVAA'){console.error('VERBATIM VALUE ALTERED');process.exit(1)}if(!/\{publisher\}/.test(b.publishedBy)){console.error('PLACEHOLDER LOST');process.exit(1)}if(b.candidate.singular==='candidate'){console.error('NOT TRANSLATED');process.exit(1)}console.log('OK')"</automated>
  </verify>
  <done>`so/` exists with 46 files; `so/common.json` is fully translated Somali with a key list byte-identical to `en/common.json`, all four verbatim values intact, `{publisher}` preserved, and every glossary Section A term used verbatim.</done>
</task>

<task type="auto">
  <name>Task 2: BATCH 1 — App-level dynamic content (1 file, 8,506 bytes)</name>
  <files>frontend/src/lib/i18n/translations/so/dynamic.json</files>
  <precondition>Task 1 has completed: `so/dynamic.json` exists as an unmodified copy of `en/dynamic.json`.</precondition>
  <action>
Translate the single file `so/dynamic.json` in place. Source of truth:
`en/dynamic.json`; disambiguating reference: `fi/dynamic.json`.

Read ONLY: the glossary section of this plan, `en/dynamic.json`,
`fi/dynamic.json`.

This batch is one file because it is the densest single artefact in the repo:
`candidateAppPrivacy.registryStatement.content` alone is ~3.5 KB of GDPR registry
prose wrapped in `<h3>`/`<p>` markup and containing three ALL-CAPS build-time
placeholders.

Batch-specific hazards:
- **20 `heroEmoji` keys minus the 5 outside this file = 15 here.** Copy every
  emoji glyph byte-for-byte. Do not translate, describe, or re-encode them.
- `candidateAppPrivacy.registryStatement.content`: preserve every `<h3>` and
  `<p>` tag and their order; preserve `{adminEmailLink}` and `{appName}`;
  preserve `DATA_CONTROLLER`, `DATA_CONTACT_PERSON`, and
  `DATA_STORAGE_TERM_EG_5_YRS` verbatim. Numbered headings (`1.` … `10.`) keep
  their numbers. Use Section E legal terms (*mas'uulka xogta*, *diiwaan*,
  *Xeerka Guud ee Ilaalinta Xogta ee Midowga Yurub (GDPR)*).
- `candidateAppPrivacy.otherTermsOfUse.content` is `""` — leave it empty.
- `appName` = **Hagaha Doorashada**; `candidateAppName` = **Hagaha Doorashada ee
  musharraxiinta**. Every other occurrence of "Election Compass" in this file
  uses the same locked forms.
- `info.dateInfo` contains `{electionDate, date, ::yyyyMMdd}` — copy the ICU date
  construct and skeleton verbatim.
- `intro.ingress`, `intro.list.results`, `results.ingress.*`,
  `results.multipleElections` interpolate `{candidatePlural}` and
  `{partyPlural}` — these resolve to the plurals set in `so/common.json`
  (*musharraxiin* / *xisbiyo*), so build sentences whose grammar works with those
  plural nouns.
- `maintenance.content` has two `<p>` blocks with no whitespace between them —
  preserve the exact tag adjacency.
  </action>
  <verify>
    <automated>node -e "const p='./frontend/src/lib/i18n/translations/';const a=require(p+'en/dynamic.json'),b=require(p+'so/dynamic.json');const f=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?f(v,q+k+'.'):[[q+k,v]]);const A=f(a),B=f(b);if(A.map(x=>x[0]).join('|')!==B.map(x=>x[0]).join('|')){console.error('KEY MISMATCH');process.exit(1)}const M=new Map(B);let bad=[];for(const [k,v] of A){const w=M.get(k);for(const m2 of v.matchAll(/\{([a-z_][a-zA-Z0-9_]*)[,}]/g)){const t=m2[1];if(['plural','select','selectordinal','number','date','time'].includes(t))continue;if(!w.includes('{'+t))bad.push(k+' lost {'+t+'}')}for(const t of (v.match(/<\/?[a-zA-Z][a-zA-Z0-9]*/g)||[]))if(!w.includes(t))bad.push(k+' lost '+t);for(const t of ['DATA_CONTROLLER','DATA_CONTACT_PERSON','DATA_STORAGE_TERM_EG_5_YRS'])if(v.includes(t)&amp;&amp;!w.includes(t))bad.push(k+' lost '+t);if(k.endsWith('heroEmoji')&amp;&amp;v!==w)bad.push(k+' emoji changed');if(v!==''&amp;&amp;v===w&amp;&amp;k!=='candidateAppPrivacy.otherTermsOfUse.content'&amp;&amp;!k.endsWith('heroEmoji'))bad.push(k+' still English')}if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK '+A.length+' keys')"</automated>
  </verify>
  <done>`so/dynamic.json` parses as JSON, has a key list identical to `en/dynamic.json`, preserves all ICU tokens / HTML tags / ALL-CAPS placeholders / 15 emoji glyphs, keeps `otherTermsOfUse.content` empty, and has no value left in English.</done>
</task>

<task type="auto">
  <name>Task 3: BATCH 2 — Voter-facing core UI (14 files, 7,928 bytes)</name>
  <files>frontend/src/lib/i18n/translations/so/{components,questions,entityCard,entityDetails,entityFilters,entityList,elections,constituencies,statistics,yourList,help,info,maintenance}.json</files>
  <precondition>Task 1 has completed: `so/common.json` is already translated and is NOT re-translated by this task.</precondition>
  <action>
Translate these 13 files in place (`common.json`, the 14th file of this batch by
byte accounting, was already delivered by Task 1 — **do not modify it**, but read
it so your terminology matches it exactly):

- `components.json` (2,615 B)
- `questions.json` (1,241 B)
- `entityFilters.json` (427 B)
- `entityList.json` (348 B)
- `constituencies.json` (230 B)
- `entityDetails.json` (186 B)
- `entityCard.json` (105 B)
- `statistics.json` (72 B)
- `info.json` (49 B)
- `elections.json` (36 B)
- `maintenance.json` (35 B)
- `yourList.json` (27 B)
- `help.json` (22 B)

Read ONLY: the glossary section of this plan, the `en/` and `fi/` versions of
these files, and `so/common.json` (for terminology alignment).

This is the highest-density batch: many short keys, mostly buttons, labels, and
aria-labels. Fidelity to Sections C (verbs), G (accessibility), and H (media)
matters more here than anywhere else — these strings recur across the whole app.

Batch-specific hazards:
- `entityDetails.tabs.candidates` is `"{candidatePlural}"` — **pure placeholder,
  copy verbatim, do not add any Somali text around it.**
- `components.matchScore.score` is `"{score}%"` — **copy verbatim.**
- `components.matchScore.label` is the lowercase word "match" → **waafaqsanaan**
  (lowercase).
- `components.video.timeLeft` is a double ICU plural with empty `=0 {}` branches:
  `{minutes, plural, =0 {} =1 {one minutes} other {# minutes}} {seconds, plural, =0 {} =1 {one second} other {# seconds}} left`.
  Keep both constructs, both `=0 {}` empty branches, both `#` symbols, and the
  single space between the two constructs. Translate only the branch text and the
  trailing "left" (→ *ayaa hadhay*).
- `questions.category.numQuestions` uses the unusual branch `=-1 {}` — keep it
  empty and keep the `=-1` key.
- `questions.intro.ingress.withCategorySelection` and `.withoutCategorySelection`
  each contain a nested ICU plural inside a sentence; keep the nesting, keep the
  empty `=0 {}` / `=1 {}` branches.
- `entityList.controls.showingNumResults` and `entityCard.showAllCandidates` use
  `{numShown}` / `{numCandidates}` — preserve.
- `components.input.error.oversizeFile` and `components.input.imageInfo` keep the
  unit **MB** (do not localise to "Mt" as Finnish does).
- `components.input.deleteOption` "Deselect {option}" → *Ka saar xulashada:
  {option}* (colon form, matching `fi`).
- `components.constituencySelector.selectPrompt` is `"Select {constituencyGroup}"`
  → *Dooro {constituencyGroup}*.
- `help.json`, `info.json`, `maintenance.json`, `elections.json`, `yourList.json`,
  `statistics.json` are single-key files — translate the one value; do not add
  keys.
- `info.json` title uses the locked Section I rendering.
  </action>
  <verify>
    <automated>node -e "const p='./frontend/src/lib/i18n/translations/';const fs=['components','questions','entityCard','entityDetails','entityFilters','entityList','elections','constituencies','statistics','yourList','help','info','maintenance'];const flat=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?flat(v,q+k+'.'):[[q+k,v]]);let bad=[],n=0;for(const f of fs){const a=flat(require(p+'en/'+f+'.json')),b=flat(require(p+'so/'+f+'.json'));if(a.map(x=>x[0]).join('|')!==b.map(x=>x[0]).join('|')){bad.push(f+': KEY MISMATCH');continue}const M=new Map(b);for(const [k,v] of a){n++;const w=M.get(k);const id=f+'.'+k;for(const m2 of v.matchAll(/\{([a-z_][a-zA-Z0-9_]*)[,}]/g)){const t=m2[1];if(['plural','select','selectordinal','number','date','time'].includes(t))continue;if(!w.includes('{'+t))bad.push(id+' lost {'+t+'}')}for(const c of ['plural','select','selectordinal','date'])if(v.includes(', '+c+',')&amp;&amp;!w.includes(', '+c+','))bad.push(id+' lost ICU '+c);if((v.match(/#/g)||[]).length!==(w.match(/#/g)||[]).length)bad.push(id+' # count changed');if(v.includes(' MB')&amp;&amp;!w.includes(' MB'))bad.push(id+' lost MB');const keep=['entityDetails.tabs.candidates','components.matchScore.score'];if(v===w&amp;&amp;!keep.includes(id))bad.push(id+' still English')}}if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK '+n+' keys across '+fs.length+' files')"</automated>
  </verify>
  <done>All 13 files parse, key lists match `en/` exactly, every ICU token/construct and `#` is preserved, `{candidatePlural}` and `{score}%` pure-placeholder values are untouched, `MB` survives, and no value is left in English.</done>
</task>

<task type="auto">
  <name>Task 4: BATCH 3 — Prose pages, results and admin chrome (14 files, 8,771 bytes)</name>
  <files>frontend/src/lib/i18n/translations/so/{about,privacy,error,feedback,results,adminApp.common,adminApp.error,adminApp.notSupported,adminApp.languageFeatures,adminApp.login,adminApp.factorAnalysis,candidateApp.info,candidateApp.privacy,candidateApp.notSupported}.json</files>
  <precondition>Task 1 has completed: `so/common.json` is translated and available for terminology alignment.</precondition>
  <action>
Translate these 14 files in place:

- `about.json` (1,623 B)
- `results.json` (1,595 B)
- `privacy.json` (1,305 B)
- `error.json` (913 B)
- `feedback.json` (808 B)
- `adminApp.factorAnalysis.json` (712 B)
- `adminApp.login.json` (592 B)
- `adminApp.error.json` (351 B)
- `adminApp.common.json` (262 B)
- `adminApp.languageFeatures.json` (192 B)
- `candidateApp.notSupported.json` (166 B)
- `adminApp.notSupported.json` (142 B)
- `candidateApp.privacy.json` (69 B)
- `candidateApp.info.json` (41 B)

Read ONLY: the glossary section of this plan, the `en/` and `fi/` versions of
these files, and `so/common.json`.

This batch carries the app's longest continuous prose (the "how it works"
explainer, the privacy page, the error page) plus the admin chrome. Section I
(connective phrases) governs the prose voice; Section J governs the admin terms.

Batch-specific hazards:
- `about.source.sitename` is `"GitHub"` — **copy verbatim.**
- `candidateApp.info.title` and `about.title` are the SAME English string
  ("How Does This App Work?"). Use the identical locked Somali rendering in both
  files: *Sidee bay u shaqaysaa barnaamijkan?*
- `about.content` is a `<p>` + `<ul>`/`<li>` block — preserve every tag, the list
  structure, and the exact whitespace between `</p>` and `<ul>`.
- `about.organizationMatching.content` is an ICU `select` on
  `{partyMatchingMethod}` with branches `answersOnly`, `imputed`, `other`, and a
  SECOND `select` construct on the same variable immediately after. Keep both
  constructs, all branch names verbatim (`answersOnly`, `imputed`, `other`), the
  empty `answersOnly {}` branch in the second construct, the `<p>` tags inside
  each branch, and the single space between the two constructs.
- `error.content` contains `{adminEmailLink}` and two adjacent `<p>` blocks.
- `error.403`, `error.404`, `error.500`, `error.default`,
  `entityFilters`-style ", sorry!" endings → use the locked Section I rendering
  *", waan ka xunnahay!"*.
- `privacy.analytics.content.umami` and `privacy.dataCollection.platform.umami`
  keep the brand **Umami** verbatim and `{analyticsLink}`.
- `privacy.cookies.content` keeps the parenthetical **(local storage)** per
  Section E.
- `privacy.dataConsentIntro.denied` / `.granted` contain
  `{consentDate, date, ::yyyyMMd}` — copy the construct and the skeleton
  verbatim. Note `.granted` has a **double space** after the date placeholder in
  `en`; reproduce the whitespace exactly.
- `feedback.rating.valueLabel` is an ICU plural with a nested `{ratingMax}`
  placeholder inside the `other` branch — preserve both.
- `results.*.numShown` are four ICU plurals; `candidate.numShown` and
  `organization.numShown` nest `{candidatePlural}` / `{partySingular}` etc.
  **inside** plural branches. Preserve every nested placeholder.
- `results.ingress.answerMinQuestions` contains `{questionsLink}` — preserve.
- `adminApp.factorAnalysis.compute.parties.some` uses `{count}`.
- `adminApp.notSupported.heroEmoji` and `candidateApp.notSupported.heroEmoji` —
  copy the glyphs verbatim.
- `adminApp.login.appTitle` is "Election Compass" → **Hagaha Doorashada** (same
  as `dynamic.appName`).
  </action>
  <verify>
    <automated>node -e "const p='./frontend/src/lib/i18n/translations/';const fs=['about','privacy','error','feedback','results','adminApp.common','adminApp.error','adminApp.notSupported','adminApp.languageFeatures','adminApp.login','adminApp.factorAnalysis','candidateApp.info','candidateApp.privacy','candidateApp.notSupported'];const flat=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?flat(v,q+k+'.'):[[q+k,v]]);let bad=[],n=0;for(const f of fs){const a=flat(require(p+'en/'+f+'.json')),b=flat(require(p+'so/'+f+'.json'));if(a.map(x=>x[0]).join('|')!==b.map(x=>x[0]).join('|')){bad.push(f+': KEY MISMATCH');continue}const M=new Map(b);for(const [k,v] of a){n++;const w=M.get(k);const id=f+'.'+k;for(const m2 of v.matchAll(/\{([a-z_][a-zA-Z0-9_]*)[,}]/g)){const t=m2[1];if(['plural','select','selectordinal','number','date','time'].includes(t))continue;if(!w.includes('{'+t))bad.push(id+' lost {'+t+'}')}for(const t of (v.match(/<\/?[a-zA-Z][a-zA-Z0-9]*/g)||[]))if(!w.includes(t))bad.push(id+' lost tag '+t);for(const c of ['plural','select','date'])if(v.includes(', '+c+',')&amp;&amp;!w.includes(', '+c+','))bad.push(id+' lost ICU '+c);for(const c of ['answersOnly','imputed','Umami','::yyyyMMd'])if(v.includes(c)&amp;&amp;!w.includes(c))bad.push(id+' lost '+c);if(k.endsWith('heroEmoji')&amp;&amp;v!==w)bad.push(id+' emoji changed');const keep=['about.source.sitename'];if(v===w&amp;&amp;!keep.includes(id)&amp;&amp;!k.endsWith('heroEmoji'))bad.push(id+' still English')}}if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK '+n+' keys across '+fs.length+' files')"</automated>
  </verify>
  <done>All 14 files parse, key lists match `en/`, all HTML tags / ICU constructs / select-branch names / `Umami` / date skeletons / emoji survive, `GitHub` is verbatim, `about.title` and `candidateApp.info.title` are identical Somali, and no value is left in English.</done>
</task>

<task type="auto">
  <name>Task 5: BATCH 4 — Registration and admin AI tooling (4 files, 8,421 bytes)</name>
  <files>frontend/src/lib/i18n/translations/so/{candidateApp.preregister,adminApp.jobs,adminApp.questionInfo,adminApp.argumentCondensation}.json</files>
  <precondition>Task 1 has completed: `so/common.json` is translated and available for terminology alignment.</precondition>
  <action>
Translate these 4 files in place:

- `candidateApp.preregister.json` (4,016 B)
- `adminApp.jobs.json` (1,599 B)
- `adminApp.questionInfo.json` (1,599 B)
- `adminApp.argumentCondensation.json` (1,207 B)

Read ONLY: the glossary section of this plan, the `en/` and `fi/` versions of
these files, and `so/common.json`.

Four files but the second-densest batch — `candidateApp.preregister.json` is the
transactional-email and bank-authentication flow (the highest-stakes strings in
the app: if a link breaks, a candidate cannot register), and the three admin
files are the densest specialist vocabulary (Section J).

Batch-specific hazards:
- **`candidateApp.preregister.email.text` contains three literal `\n` escape
  sequences.** Preserve their exact count and position (after the greeting line,
  after the instruction line, after the URL). This is the single most fragile
  string in the whole set.
- `candidateApp.preregister.email.html` contains
  `<a href="{registrationUrl}">{registrationUrl}</a>` — preserve the anchor, the
  `href` attribute **and its `{registrationUrl}` value**, and the placeholder as
  the link text. Preserve `{firstName}`.
- **`Bank ID` appears 4× in this file.** Copy verbatim every time; wrap in Somali
  as *adeegga Bank ID* / *aqoonsiga Bank ID* per Section E. Never translate,
  never inflect the brand itself.
- `candidateApp.preregister.identification.success.title` contains
  `{firstName} {lastName}` — preserve both and the single space between them.
- Three `heroEmoji` keys in this file — copy the glyphs verbatim.
- Every `content` value in `candidateApp.preregister.status.*` is wrapped in
  `<p>` tags, several with two adjacent `<p>` blocks. Preserve tag count and
  adjacency.
- `adminApp.jobs.id` is `"ID"` — **copy verbatim, do not translate.**
- `adminApp.jobs.notAvailable` is `"N/A"` → **translate to *Ma jiro*** (this one
  is NOT on the verbatim list).
- `adminApp.jobs.confirmAbortAll` contains the emphatic ALL-CAPS word "ALL" —
  render the emphasis in Somali as *DHAMMAAN* (Somali has no other emphasis
  mechanism here, and the ALL-CAPS intent is part of the warning).
- `adminApp.jobs.confirmAbortJob` uses `{feature}`;
  `adminApp.argumentCondensation.generate.errorLoadingQuestions` uses `{error}`.
- `adminApp.jobs.features.ArgumentCondensation.title` must be **identical** to
  `adminApp.argumentCondensation.title` (*Soo koobidda doodaha*) — they render
  the same feature name in two places.
- `adminApp.*.buttonLoading` values end in **three ASCII dots** (`...`), not the
  `…` character. Copy the ASCII dots. Contrast with `adminApp.jobs.aborting`
  which uses `…`.
- `adminApp.questionInfo.customInstructions.help` mentions **LLM** — keep the
  acronym verbatim, inflected as *LLM-ka*.
- `adminApp.questionInfo.questionContext.placeholder` is
  `"Finnish municipal elections 2025"` — translate it (it is example text, not a
  literal): *Doorashooyinka degmooyinka Finland 2025*.
- All `"(optional)"` suffixes → *(ikhtiyaari)*.
  </action>
  <verify>
    <automated>node -e "const p='./frontend/src/lib/i18n/translations/';const fs=['candidateApp.preregister','adminApp.jobs','adminApp.questionInfo','adminApp.argumentCondensation'];const flat=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?flat(v,q+k+'.'):[[q+k,v]]);let bad=[],n=0,so={};for(const f of fs){const a=flat(require(p+'en/'+f+'.json')),b=flat(require(p+'so/'+f+'.json'));if(a.map(x=>x[0]).join('|')!==b.map(x=>x[0]).join('|')){bad.push(f+': KEY MISMATCH');continue}const M=new Map(b);for(const [k,v] of a){n++;const w=M.get(k);const id=f+'.'+k;so[id]=w;for(const m2 of v.matchAll(/\{([a-z_][a-zA-Z0-9_]*)[,}]/g)){const t=m2[1];if(['plural','select','selectordinal','number','date','time'].includes(t))continue;if(!w.includes('{'+t))bad.push(id+' lost {'+t+'}')}for(const t of (v.match(/<\/?[a-zA-Z][a-zA-Z0-9]*/g)||[]))if(!w.includes(t))bad.push(id+' lost tag '+t);for(const h of (v.match(/href=\"[^\"]*\"/g)||[]))if(!w.includes(h))bad.push(id+' lost '+h);if((v.match(/\n/g)||[]).length!==(w.match(/\n/g)||[]).length)bad.push(id+' newline count changed');if((v.match(/Bank ID/g)||[]).length!==(w.match(/Bank ID/g)||[]).length)bad.push(id+' Bank ID count changed');if(v.endsWith('...')&amp;&amp;!w.endsWith('...'))bad.push(id+' ASCII dots changed');if(k.endsWith('heroEmoji')&amp;&amp;v!==w)bad.push(id+' emoji changed');const keep=['adminApp.jobs.id'];if(v===w&amp;&amp;!keep.includes(id)&amp;&amp;!k.endsWith('heroEmoji'))bad.push(id+' still English')}}if(so['adminApp.jobs.features.ArgumentCondensation.title']!==so['adminApp.argumentCondensation.title'])bad.push('ArgumentCondensation title mismatch between files');if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK '+n+' keys across '+fs.length+' files')"</automated>
  </verify>
  <done>All 4 files parse, key lists match `en/`, the three `\n` escapes and all `href="{registrationUrl}"` values survive, `Bank ID` appears 4× verbatim, `adminApp.jobs.id` is still `"ID"`, ASCII-dot loading suffixes are preserved, the two Argument Condensation titles are identical, and no other value is left in English.</done>
</task>

<task type="auto">
  <name>Task 6: BATCH 5 — Candidate app: profile, answering and auth (13 files, 8,615 bytes)</name>
  <files>frontend/src/lib/i18n/translations/so/{candidateApp.questions,candidateApp.settings,candidateApp.register,candidateApp.basicInfo,candidateApp.home,candidateApp.common,candidateApp.error,candidateApp.logoutModal,candidateApp.resetPassword,candidateApp.login,candidateApp.preview,candidateApp.setPassword,candidateApp.help}.json</files>
  <precondition>Task 1 has completed: `so/common.json` is translated and available for terminology alignment.</precondition>
  <action>
Translate these 13 files in place:

- `candidateApp.questions.json` (1,299 B)
- `candidateApp.settings.json` (1,124 B)
- `candidateApp.register.json` (942 B)
- `candidateApp.basicInfo.json` (852 B)
- `candidateApp.home.json` (807 B)
- `candidateApp.common.json` (695 B)
- `candidateApp.error.json` (574 B)
- `candidateApp.logoutModal.json` (525 B)
- `candidateApp.resetPassword.json` (446 B)
- `candidateApp.login.json` (375 B)
- `candidateApp.preview.json` (347 B)
- `candidateApp.setPassword.json` (334 B)
- `candidateApp.help.json` (295 B)

Read ONLY: the glossary section of this plan, the `en/` and `fi/` versions of
these files, and `so/common.json`.

This batch is the candidate's whole working experience. Section E (account/auth)
and Section C (verbs) dominate. **The password vocabulary is the consistency
risk here** — *furaha sirta ah* appears in a dozen variants across four files and
must be identical everywhere.

Batch-specific hazards:
- `candidateApp.logoutModal.itemsLeft` contains **two** ICU plurals in one
  string (`{infoQuestionsLeft}` and `{opinionQuestionsLeft}`); `.questionsLeft`
  contains one. Preserve every construct, branch keyword, and `#`.
- `candidateApp.logoutModal.ingress` uses `{timeLeft}`.
- `candidateApp.questions.unansweredWarning` is an ICU plural on
  `{numUnansweredQuestions}`; `.ingress.empty` uses `{numQuestions}`.
- `candidateApp.questions.error.*` and `candidateApp.basicInfo.error.*` use
  `{questionId}` — preserve.
- `candidateApp.common.greeting` is `"Hello, {username}!"` → *Salaan,
  {username}!* (Section I).
- `candidateApp.register.codePlaceholder` is `"E.g. CP23-174a-f4%&-aHAB"` →
  *Tusaale: CP23-174a-f4%&-aHAB* — **the code sample is copied verbatim**,
  including the `%` and `&`.
- `candidateApp.register.passwordValidation.symbol` is
  `"Symbol (such as !?%#€)"` → *Astaan (sida !?%#€)* — **the symbol sample is
  copied verbatim.**
- `candidateApp.register.passwordValidation.length` uses `{minPasswordLength}`.
- `candidateApp.setPassword` / `candidateApp.settings.password.*` /
  `candidateApp.resetPassword` / `candidateApp.register.passwordValidation` all
  describe passwords — use the locked Section E forms with zero variation.
- `candidateApp.common.voterApp` is "Election Compass for voters" → the locked
  Section A form *Hagaha Doorashada ee codbixiyayaasha*.
- `candidateApp.common.home` is "Start" → *Bilowga* (noun, nav label — NOT the
  imperative *Bilow*).
- `candidateApp.questions.openAnswerPrompt` is "Arguments" → *Doodo* (matches
  `fi` "Perustelut", which means reasoning/justifications, not debates).
- `candidateApp.questions.title` "Your Opinions" → *Aragtiyahaaga*.
- `candidateApp.basicInfo.editableInfos.title` "Your Profile" →
  *Boroofaylkaaga* (Section B loan ruling).
- Note the `en` typos `"anwers"` (`candidateApp.questions.tip`) and
  `"nominatinon"` (`candidateApp.error.nominationNoElection`) — translate the
  intended meaning; do not reproduce the typo.
  </action>
  <verify>
    <automated>node -e "const p='./frontend/src/lib/i18n/translations/';const fs=['candidateApp.questions','candidateApp.settings','candidateApp.register','candidateApp.basicInfo','candidateApp.home','candidateApp.common','candidateApp.error','candidateApp.logoutModal','candidateApp.resetPassword','candidateApp.login','candidateApp.preview','candidateApp.setPassword','candidateApp.help'];const flat=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?flat(v,q+k+'.'):[[q+k,v]]);let bad=[],n=0;for(const f of fs){const a=flat(require(p+'en/'+f+'.json')),b=flat(require(p+'so/'+f+'.json'));if(a.map(x=>x[0]).join('|')!==b.map(x=>x[0]).join('|')){bad.push(f+': KEY MISMATCH');continue}const M=new Map(b);for(const [k,v] of a){n++;const w=M.get(k);const id=f+'.'+k;for(const m2 of v.matchAll(/\{([a-z_][a-zA-Z0-9_]*)[,}]/g)){const t=m2[1];if(['plural','select','selectordinal','number','date','time'].includes(t))continue;if(!w.includes('{'+t))bad.push(id+' lost {'+t+'}')}for(const c of ['plural','select'])if(v.includes(', '+c+',')&amp;&amp;!w.includes(', '+c+','))bad.push(id+' lost ICU '+c);if((v.match(/#/g)||[]).length!==(w.match(/#/g)||[]).length)bad.push(id+' # count changed');for(const c of ['CP23-174a-f4%&-aHAB','!?%#€'])if(v.includes(c)&amp;&amp;!w.includes(c))bad.push(id+' lost literal '+c);if(v===w)bad.push(id+' still English')}}if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK '+n+' keys across '+fs.length+' files')"</automated>
  </verify>
  <done>All 13 files parse, key lists match `en/`, every ICU plural (including the double-plural `itemsLeft`) and `#` is preserved, the code and symbol samples are verbatim, password terminology is uniform, and no value is left in English.</done>
</task>

<task type="auto">
  <name>Task 7: Final structural, token and completeness validation of `so/`</name>
  <files>frontend/src/lib/i18n/translations/so/ (all 46 files — read/verify only, fix in place if a check fails)</files>
  <precondition>Tasks 1-6 have all completed; all 46 files under `so/` have been translated.</precondition>
  <action>
Run five independent gates against the finished `so/` tree. Every gate must pass.
If a gate fails, fix the offending `so/` file in place (never by editing `en/`,
never by relaxing the gate) and re-run all five.

**Gate (a) — all 46 files exist with the right names.**
Compare `so/` filenames against `en/` filenames as sets, and against the `keys`
array in `frontend/src/lib/i18n/translations/index.ts` (each entry `k` must have
a `so/${k}.json`). Any extra, missing, or misspelled filename fails.

**Gate (b) — key sets, nesting and ORDER identical to `en/`.**
For each of the 46 files, flatten `en` and `so` to an ordered array of dotted key
paths and require exact array equality (not set equality — order is part of the
contract). Also require that every leaf in `so` is a string where the `en` leaf
is a string, and an object where the `en` leaf is an object.

**Gate (c) — placeholder / ICU / HTML / href / brand / `\n` parity.**
Reuse the repo's already-tested checker logic instead of writing a new one. Copy
it to the scratchpad and repoint it — **do not modify the repo file**:

```
mkdir -p "$SCRATCH"
sed -e "s#path.resolve(import.meta.dirname, '../../src/lib/i18n/translations')#'<ABS>/frontend/src/lib/i18n/translations'#" \
    -e "s#loadLocaleMap('ar')#loadLocaleMap('so')#" \
  frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts > "$SCRATCH/checkSomaliPlaceholders.ts"
cd frontend && yarn tsx "$SCRATCH/checkSomaliPlaceholders.ts"
```

where `<ABS>` is the absolute repo root. Exit code must be 0 and the summary line
must report `0 checks failed`. This covers ICU token names, the six ICU construct
keywords, HTML tag sets, `href="…"` values, the `Bank ID` / `OpenVAA` brand
literals, and literal `\n` characters. **The scratchpad file must never be
copied into the repo.**

**Gate (d) — every file parses as JSON and is correctly formatted.**
Parse all 46 files with `JSON.parse`. Then confirm formatting matches `en/`:
2-space indent, LF endings, trailing newline, UTF-8. Run
`yarn format` scoped to `frontend/src/lib/i18n/translations/so/` and confirm
`git diff --stat` on `so/` is empty afterwards (i.e. the files were already
Prettier-clean). If Prettier rewrites a file, re-run gates (b) and (c) — Prettier
does not reorder keys, but confirm anyway.

**Gate (e) — no value left in English, except the enumerated allow-list.**
Flatten `en` and `so` across all 46 files and report every key whose `so` value
is byte-identical to its `en` value. The result must be exactly this
allow-list and nothing else:

```
common.missingAnswer                                   ("—")
common.multipleAnswerSeparator                         (" • ")
common.madeWithSuffix                                  ("")
common.openVAA                                         ("OpenVAA")
components.matchScore.score                            ("{score}%")
entityDetails.tabs.candidates                          ("{candidatePlural}")
about.source.sitename                                  ("GitHub")
adminApp.jobs.id                                       ("ID")
dynamic.candidateAppPrivacy.otherTermsOfUse.content    ("")
<20 heroEmoji keys>                                    (emoji glyphs)
```

Any key present in the identical-values report but absent from the allow-list is
an untranslated string and must be translated. Any key in the allow-list whose
value has changed must be restored.

**This allow-list is empirically validated, not guessed.** Running this exact
gate against the existing completed `ar` locale (a full 46-file translation of
the same source) reports
`OK: 46 files, 575 keys, 20 emoji preserved, 0 untranslated` — i.e. the Arabic
translators left exactly these 9 keys plus the 20 emoji keys identical to
English and nothing else. The allow-list is therefore known to be both complete
and minimal. Expect the same output for `so`.

Two caveats when reasoning from the `ar` precedent: Arabic localises the `MB`
unit and has six CLDR plural categories, so its `#` counts and unit strings
diverge from `en`. **Somali does neither** — `so` has the same `one`/`other`
plural categories as English, so ICU branches map 1:1 and `#` counts must be
preserved exactly, and `MB` is kept per Section C-4(b).

**Final scope check.** Run `git status --porcelain` and confirm every listed path
is under `frontend/src/lib/i18n/translations/so/` or `.planning/`. Revert
anything else. In particular confirm
`frontend/src/lib/i18n/translations/index.ts`,
`packages/app-shared/src/settings/staticSettings.ts`, and
`frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` are
unmodified.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'),p='./frontend/src/lib/i18n/translations/';const en=fs.readdirSync(p+'en').filter(f=>f.endsWith('.json')).sort(),so=fs.readdirSync(p+'so').filter(f=>f.endsWith('.json')).sort();if(en.length!==46){console.error('en count '+en.length);process.exit(1)}if(en.join('|')!==so.join('|')){console.error('FILE SET MISMATCH');process.exit(1)}const idx=fs.readFileSync(p+'index.ts','utf8');const ks=idx.slice(idx.indexOf('export const keys'));const keys=ks.slice(0,ks.indexOf('];')).match(/'([^']+)'/g).map(s=>s.slice(1,-1));if(keys.length!==46){console.error('index.ts keys parsed: '+keys.length+', expected 46');process.exit(1)}for(const k of keys)if(!so.includes(k+'.json')){console.error('index.ts key with no so file: '+k);process.exit(1)}const flat=(o,q='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v!==null?flat(v,q+k+'.'):[[q+k,v]]);const ALLOW=new Set(['common.missingAnswer','common.multipleAnswerSeparator','common.madeWithSuffix','common.openVAA','components.matchScore.score','entityDetails.tabs.candidates','about.source.sitename','adminApp.jobs.id','dynamic.candidateAppPrivacy.otherTermsOfUse.content']);let bad=[],same=[],total=0,emoji=0;for(const f of en){const raw=fs.readFileSync(p+'so/'+f,'utf8');if(!raw.endsWith('}\n'))bad.push(f+': missing trailing newline');if(raw.includes('\r'))bad.push(f+': CRLF detected');let A,B;try{A=flat(JSON.parse(fs.readFileSync(p+'en/'+f,'utf8')));B=flat(JSON.parse(raw))}catch(e){bad.push(f+': JSON PARSE FAIL '+e.message);continue}if(A.map(x=>x[0]).join('|')!==B.map(x=>x[0]).join('|')){bad.push(f+': KEY ORDER/SET MISMATCH');continue}const base=f.replace(/\.json$/,''),M=new Map(B);for(const [k,v] of A){total++;const id=base+'.'+k,w=M.get(k);if(typeof w!=='string'){bad.push(id+': not a string');continue}if(k.endsWith('heroEmoji')){emoji++;if(v!==w)bad.push(id+': emoji changed');continue}if(v===w&amp;&amp;!ALLOW.has(id))same.push(id)}}if(emoji!==20)bad.push('heroEmoji count '+emoji+' expected 20');if(same.length)bad.push('UNTRANSLATED (not on allow-list):\n  '+same.join('\n  '));if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('OK: 46 files, '+total+' keys, 20 emoji preserved, 0 untranslated')"</automated>
    <automated>cd frontend &amp;&amp; yarn tsx "$SCRATCHPAD/checkSomaliPlaceholders.ts"</automated>
    <automated>git status --porcelain | grep -v -E '(^\?\? \.planning/|frontend/src/lib/i18n/translations/so/)' | grep . &amp;&amp; { echo "SCOPE VIOLATION: changes outside so/ and .planning/"; exit 1; } || echo "scope OK"</automated>
  </verify>
  <done>
All five gates pass: 46 correctly-named files present and reachable from
`index.ts`; key arrays byte-identical to `en/` in order and nesting; the
scratchpad placeholder checker reports `0 checks failed`; all files parse as
JSON with 2-space/LF/trailing-newline formatting and are Prettier-clean; the
identical-values report equals the allow-list exactly (9 keys + 20 `heroEmoji`
keys) and nothing more; `git status` shows no change outside `so/` and
`.planning/`.
  </done>
</task>

</tasks>

---

## Batch partition — full 46-file audit

Every one of the 46 files appears in **exactly one** batch. Sizes are real
`wc -c` byte counts of the `en/` source files. Total = 42,241 B; mean batch =
8,448 B; max deviation from mean = +6 % / −6 %.

| Batch | Task | Files | Bytes | Δ vs mean | Keys | Bytes/key |
|---|---|---|---|---|---|---|
| 1 — App-level dynamic content | Task 2 | 1 | 8,506 | +0.7 % | 62 | 137 |
| 2 — Voter-facing core UI | Task 3 (+ `common.json` from Task 1) | 14 | 7,928 | −6.2 % | 172 | 46 |
| 3 — Prose pages, results, admin chrome | Task 4 | 14 | 8,771 | +3.8 % | 105 | 84 |
| 4 — Registration & admin AI tooling | Task 5 | 4 | 8,421 | −0.3 % | 119 | 71 |
| 5 — Candidate app: profile, answering, auth | Task 6 | 13 | 8,615 | +2.0 % | 117 | 74 |
| **Total** | | **46** | **42,241** | | **575** | 73 |

Batch 2 is deliberately the lightest by bytes because it has by far the highest
**key density** — 172 keys at 46 bytes/key, versus Batch 1's 62 keys at 137
bytes/key. Many short labels and aria-strings are slower per byte than
continuous prose, so equal bytes would have made Batch 2 the heaviest batch in
practice. Batch 1 is a single file because
`dynamic.candidateAppPrivacy.registryStatement.content` alone is ~3.5 KB of
dense GDPR legal prose.

**Total translatable string count across all 46 files: 575.** Every one must
carry a Somali value (minus the 29-key untranslated-by-design allow-list).

### Enumerated file list (auditable coverage)

**Batch 1 (1 file, 8,506 B)**
`dynamic.json` 8506

**Batch 2 (14 files, 7,928 B)**
`components.json` 2615 · `common.json` 2535 *(delivered by Task 1)* ·
`questions.json` 1241 · `entityFilters.json` 427 · `entityList.json` 348 ·
`constituencies.json` 230 · `entityDetails.json` 186 · `entityCard.json` 105 ·
`statistics.json` 72 · `info.json` 49 · `elections.json` 36 ·
`maintenance.json` 35 · `yourList.json` 27 · `help.json` 22

**Batch 3 (14 files, 8,771 B)**
`about.json` 1623 · `results.json` 1595 · `privacy.json` 1305 ·
`error.json` 913 · `feedback.json` 808 · `adminApp.factorAnalysis.json` 712 ·
`adminApp.login.json` 592 · `adminApp.error.json` 351 ·
`adminApp.common.json` 262 · `adminApp.languageFeatures.json` 192 ·
`candidateApp.notSupported.json` 166 · `adminApp.notSupported.json` 142 ·
`candidateApp.privacy.json` 69 · `candidateApp.info.json` 41

**Batch 4 (4 files, 8,421 B)**
`candidateApp.preregister.json` 4016 · `adminApp.jobs.json` 1599 ·
`adminApp.questionInfo.json` 1599 · `adminApp.argumentCondensation.json` 1207

**Batch 5 (13 files, 8,615 B)**
`candidateApp.questions.json` 1299 · `candidateApp.settings.json` 1124 ·
`candidateApp.register.json` 942 · `candidateApp.basicInfo.json` 852 ·
`candidateApp.home.json` 807 · `candidateApp.common.json` 695 ·
`candidateApp.error.json` 574 · `candidateApp.logoutModal.json` 525 ·
`candidateApp.resetPassword.json` 446 · `candidateApp.login.json` 375 ·
`candidateApp.preview.json` 347 · `candidateApp.setPassword.json` 334 ·
`candidateApp.help.json` 295

**Coverage check:** 1 + 14 + 14 + 4 + 13 = **46** files.
8,506 + 7,928 + 8,771 + 8,421 + 8,615 = **42,241** bytes. No file appears twice;
no file is missing.

---

## Execution waves

| Wave | Tasks | Parallel? | Rationale |
|---|---|---|---|
| 1 | Task 1 | no | Locks the glossary and scaffolds `so/`; every other task depends on it |
| 2 | Tasks 2, 3, 4, 5, 6 | **yes — 5 agents in parallel** | Zero `files_modified` overlap between batches; each agent reads only the glossary + its own `en`/`fi` files |
| 3 | Task 7 | no | Needs all 46 files finished |

Wave 2 agents share **only** the glossary section of this plan. That is the
entire coordination surface — which is why the glossary is exhaustive and its
rulings are final.

---

<verification>
Phase-level checks, run after Task 7:

1. `ls frontend/src/lib/i18n/translations/so/*.json | wc -l` → `46`
2. Structural diff of every file's ordered key array against `en/` → identical
3. Scratchpad `checkSomaliPlaceholders.ts` → exit 0, `0 checks failed`
4. `JSON.parse` on all 46 files → no throw
5. Identical-to-English report → exactly the 9-key allow-list + 20 `heroEmoji`
   keys
6. `yarn format:check` on `frontend/src/lib/i18n/translations/so/` → clean
7. `git status --porcelain` → nothing outside `so/` and `.planning/`
8. Spot-check glossary consistency across batch boundaries:
   - "Election Compass" → *Hagaha Doorashada* in `dynamic.appName`,
     `adminApp.login.appTitle`, and every `candidateApp.*` occurrence
   - "How Does This App Work?" identical in `about.title` and
     `candidateApp.info.title`
   - "Argument Condensation" identical in `adminApp.argumentCondensation.title`
     and `adminApp.jobs.features.ArgumentCondensation.title`
   - password vocabulary identical across `candidateApp.setPassword`,
     `candidateApp.resetPassword`, `candidateApp.settings`,
     `candidateApp.register`, `common.password*`
</verification>

<success_criteria>
- [ ] `frontend/src/lib/i18n/translations/so/` contains exactly 46 `.json` files
      whose names match `en/` and the `keys` array in `index.ts`
- [ ] Every `so/` file has a key set, nesting, and key **order** byte-identical
      to its `en/` counterpart; only string values differ
- [ ] Every ICU placeholder token, ICU construct keyword, `#`, date skeleton,
      HTML tag, `href` value, and literal `\n` from `en` survives in `so`
- [ ] All 4 `Bank ID`, 1 `OpenVAA`, 1 `GitHub`, 2 `Umami`, 3 ALL-CAPS registry
      placeholders, the code sample, the symbol sample, `MB`, `LLM`, and
      `(local storage)` survive verbatim
- [ ] All 20 `heroEmoji` glyphs are byte-identical to `en`
- [ ] The identical-to-English set is exactly the 9-key allow-list + the 20
      `heroEmoji` keys — no accidental untranslated string
- [ ] All 46 files are valid UTF-8 JSON, 2-space indent, LF, trailing newline,
      Prettier-clean
- [ ] Every glossary term is used verbatim; no batch invented a competing
      rendering for a locked term
- [ ] `index.ts`, `staticSettings.ts`, and `checkArabicPlaceholders.ts` are
      unmodified; nothing outside `so/` and `.planning/` is committed
</success_criteria>

<out_of_scope_followups>
These are deliberately NOT part of this plan. Record them; do not do them here.

1. **Register `so` as a selectable locale** — add `so: 'Soomaali'` to the
   `locales` map in `frontend/src/lib/i18n/translations/index.ts` and add `so`
   to `supportedLocales` in
   `packages/app-shared/src/settings/staticSettings.ts`. Until this lands, the
   `so/` files are inert.
2. **Backend translation sync** — run `yarn sync:translations` so Strapi's
   dynamic translation overrides expose Somali.
3. **Generalise the placeholder checker** — parameterise
   `checkArabicPlaceholders.ts` by locale (`--locale=so`) instead of the
   hardcoded `loadLocaleMap('ar')`, and rename it. Task 7's scratchpad copy is a
   deliberate one-off workaround, not a pattern to keep.
4. **Native-speaker review** — this plan produces machine-authored Somali held to
   a locked glossary. A native Somali speaker with electoral-domain familiarity
   should review Sections A, E, and J before the locale ships to voters.
5. **Somali number/date formatting** — confirm ICU `date` skeleton output and
   plural-category behaviour under a `so` locale in the running app.
</out_of_scope_followups>

<output>
No SUMMARY file required (quick mode). On completion, report:
- files created under `frontend/src/lib/i18n/translations/so/` (expect 46)
- total translated keys
- result of each of the five Task 7 gates
- any glossary term a batch flagged as questionable
</output>