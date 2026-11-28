---
created: 2026-11-10T00:00:00.000Z
title: Native-reader review of the French and Luxembourgish strings Phase 179.1's plans 70 to 80 wrote
area: i18n
severity: minor
source: Phase 179.1 (plan 179.1-79 Task 1; rule 5 of the rules of plans 70 to 79 in 179.1-70-PLAN.md)
files:
  - apps/frontend/messages/fr/adminApp.argumentCondensation.json
  - apps/frontend/messages/fr/adminApp.common.json
  - apps/frontend/messages/fr/adminApp.error.json
  - apps/frontend/messages/fr/adminApp.factorAnalysis.json
  - apps/frontend/messages/fr/adminApp.jobs.json
  - apps/frontend/messages/fr/adminApp.languageFeatures.json
  - apps/frontend/messages/fr/adminApp.login.json
  - apps/frontend/messages/fr/adminApp.notSupported.json
  - apps/frontend/messages/fr/adminApp.questionInfo.json
  - apps/frontend/messages/fr/common.json
  - apps/frontend/messages/fr/components.json
  - apps/frontend/messages/fr/questions.json
  - apps/frontend/messages/lb/adminApp.argumentCondensation.json
  - apps/frontend/messages/lb/adminApp.common.json
  - apps/frontend/messages/lb/adminApp.error.json
  - apps/frontend/messages/lb/adminApp.factorAnalysis.json
  - apps/frontend/messages/lb/adminApp.jobs.json
  - apps/frontend/messages/lb/adminApp.languageFeatures.json
  - apps/frontend/messages/lb/adminApp.login.json
  - apps/frontend/messages/lb/adminApp.notSupported.json
  - apps/frontend/messages/lb/adminApp.questionInfo.json
  - apps/frontend/messages/lb/common.json
  - apps/frontend/messages/lb/components.json
  - apps/frontend/messages/lb/questions.json
---

## Problem

Plans 70 to 78 and the gap-closure plan 80 of Phase 179.1 wrote French (`fr`) and Luxembourgish (`lb`) strings: the Admin App's login page (plan 70, 13 keys), the eight other `adminApp.*` catalogues (plan 80, 108 keys, by the answer C5 = b at plan 70's checkpoint), and the two sentences the login pages show after a sign-out the user did not see (plan 74, `common.loggedOutAutomatically` and `common.loggedOutElsewhere`). Every one of them is a machine translation that the operator approved at a copy checkpoint without reading it as a native speaker. **No native reader has read any of them.** They are served as they stand.

It sits beside `2026-10-26-179.1-native-speaker-review-of-the-phase-strings.md`, which the same reviewers are owed.

## What to do

- For `fr` and for `lb`, read every row below in its screen's context and correct the catalogue file in place. A correction changes text only: no key is renamed or removed. The screens: the Admin App's login page (`/fr/admin/login`, `/lb/admin/login`), its home, jobs, argument condensation, question info and factor analysis pages, the unauthorised, not-available and not-supported screens, and both apps' login pages after a sign-out made in another tab or by a logout count's end.
- Start with the strings flagged as doubtful at plan 80's checkpoint (`179.1-80-SUMMARY.md`): lb `jobs.startProcess` (the familiar imperative "Start …"), lb `jobs.hideMessages` / `showMessages` (the final `n` in "Messagen"), lb `generate.noElectionSelected` ("als éischt"), fr `description` ("boussole électorale" in lower case), fr `jobs.title` ("Panneau de contrôle"), fr `jobs.abortingInfo`, lb "Gouvernance", lb "n. v." and fr "administrateurs système".
- A corrected string must then be written into the approved strings (`179.1-70-approved-strings.json` or `179.1-80-approved-strings.json` in the phase directory), or `179.1-approved-strings.mjs` will report it as differing.

## The list, and how to derive it again

Derived at plan 179.1-79 by `git diff 9fb41c6af HEAD -- apps/frontend/messages/fr apps/frontend/messages/lb` (`9fb41c6af` is the head of `179.1-69-final`, the round's starting point), read key by key: every leaf of a catalogue whose `fr` or `lb` value is absent at `9fb41c6af` (added) or differs from it (changed), with its text at HEAD. To derive it again, save the script below as `frlb-keys.mjs` and run, from the repository root, `node frlb-keys.mjs 9fb41c6af HEAD`; it prints one JSON object per leaf with its file, key, kind (`added`, `changed`, `path-only` for a key whose text is unchanged under a new path, `removed`) and text.

```js
import { execFileSync } from 'node:child_process';

const [base, head] = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

function flatten(obj, prefix, out) {
  if (typeof obj === 'string') { out.set(prefix, obj); return out; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out)); return out; }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}
function read(rev, path) {
  try { return JSON.parse(git('show', `${rev}:${path}`)); } catch { return {}; }
}

const files = git('diff', '--name-only', base, head, '--', 'apps/frontend/messages/fr', 'apps/frontend/messages/lb')
  .trim().split('\n').filter(Boolean);
const result = [];
for (const f of files) {
  const before = flatten(read(base, f), '', new Map());
  const after = flatten(read(head, f), '', new Map());
  const removed = [...before.keys()].filter((k) => !after.has(k));
  for (const [k, v] of after) {
    if (before.get(k) === v) continue;
    const kind = !before.has(k)
      ? (removed.some((r) => before.get(r) === v) ? 'path-only' : 'added')
      : 'changed';
    result.push({ file: f, key: k, kind, text: v });
  }
  for (const r of removed) {
    if ([...after.values()].includes(before.get(r))) continue;
    result.push({ file: f, key: r, kind: 'removed', text: before.get(r) });
  }
}
process.stdout.write(JSON.stringify(result, null, 1));
```

121 keys, each with its `fr` and its `lb` text as written: 119 of the nine `adminApp.*` catalogues and 2 of `common`. Where a cell reads "unchanged in this locale", the derivation found no change there because the text equals the English one, and the key is listed again under *Written but equal to the English* below. Grouped by catalogue file; each key is written in its file under the file's one top-level key.

### `adminApp.argumentCondensation.json` (20)

Files: `apps/frontend/messages/fr/adminApp.argumentCondensation.json`, `apps/frontend/messages/lb/adminApp.argumentCondensation.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.argumentCondensation.title` | Synthèse des arguments | Zesummefaassung vun Argumenter |
| `adminApp.argumentCondensation.description` | Synthétisez et gérez les arguments relatifs aux questions de l’élection. | Fasst d’Argumenter zu de Wahlfroen zesummen a verwalt se. |
| `adminApp.argumentCondensation.jobs.noActiveJobs` | Aucune tâche active | Keng aktiv Aufgaben |
| `adminApp.argumentCondensation.jobs.startProcess` | Lancez une synthèse des arguments pour en suivre le déroulement en temps réel | Start eng Zesummefaassung vun Argumenter, fir de Verlaf an Echtzäit ze verfollegen |
| `adminApp.argumentCondensation.generate.allQuestions` | Générer des arguments pour toutes les affirmations | Argumenter fir all Aussoe generéieren |
| `adminApp.argumentCondensation.generate.button` | Générer les arguments | Argumenter generéieren |
| `adminApp.argumentCondensation.generate.buttonLoading` | Génération… | Gëtt generéiert… |
| `adminApp.argumentCondensation.generate.error` | Une erreur s’est produite lors de la génération des arguments | Beim Generéiere vun den Argumenter ass e Feeler opgetrueden |
| `adminApp.argumentCondensation.generate.mayTakeTime` | Cette opération peut prendre plusieurs minutes | Dëse Prozess kann e puer Minutten daueren |
| `adminApp.argumentCondensation.generate.noElectionsAvailable` | Aucune élection n’est disponible pour le moment. Veuillez vérifier la configuration de vos données. | Momentan si keng Wahlen disponibel. Iwwerpréift wgl. d’Konfiguratioun vun Ären Donnéeën. |
| `adminApp.argumentCondensation.generate.noElectionSelected` | Veuillez d’abord sélectionner une élection | Wielt wgl. als éischt eng Wahl aus |
| `adminApp.argumentCondensation.generate.noQuestionsForElection` | Aucune affirmation n’a été trouvée pour l’élection sélectionnée. | Fir déi ausgewielte Wahl goufe keng Aussoe fonnt. |
| `adminApp.argumentCondensation.generate.noQuestionSelected` | Veuillez sélectionner au moins une question | Wielt wgl. op d’mannst eng Fro aus |
| `adminApp.argumentCondensation.generate.selectElection` | Sélectionner une élection | Wahl auswielen |
| `adminApp.argumentCondensation.generate.selectElectionPlaceholder` | Choisissez une élection… | Wielt eng Wahl aus… |
| `adminApp.argumentCondensation.generate.selectedQuestions` | Générer des arguments uniquement pour les questions sélectionnées | Argumenter nëmme fir déi ausgewielte Froe generéieren |
| `adminApp.argumentCondensation.generate.questionType` | Sélection des questions | Auswiel vun de Froen |
| `adminApp.argumentCondensation.generate.selectAll` | Tout sélectionner | All auswielen |
| `adminApp.argumentCondensation.generate.unselectAll` | Tout désélectionner | All deselektéieren |
| `adminApp.argumentCondensation.generate.errorLoadingQuestions` | Erreur lors du chargement des questions : {error} | Feeler beim Luede vun de Froen: {error} |

### `adminApp.common.json` (4)

Files: `apps/frontend/messages/fr/adminApp.common.json`, `apps/frontend/messages/lb/adminApp.common.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.common.home` | Accueil | Start |
| `adminApp.common.description` | Utilisez les outils ci-dessous pour gérer la boussole électorale. | Benotzt d’Tools hei drënner, fir de Wal-Kompass ze verwalten. |
| `adminApp.common.notAccessible.content` | L’application d’administration est actuellement configurée comme indisponible. | D’Administratiouns-Applikatioun ass momentan esou konfiguréiert, datt se net verfügbar ass. |
| `adminApp.common.notAccessible.title` | Désolé, l’application d’administration n’est pas disponible | Entschëllegt, d’Administratiouns-Applikatioun ass net verfügbar |

### `adminApp.error.json` (3)

Files: `apps/frontend/messages/fr/adminApp.error.json`, `apps/frontend/messages/lb/adminApp.error.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.error.unauthorized` | Vous n’êtes pas autorisé·e à accéder à cet espace | Dir sidd net berechtegt, op dëse Beräich zouzegräifen |
| `adminApp.error.unauthorizedDescription` | Votre compte a bien été authentifié, mais vous ne disposez pas des droits d’administration requis. | Äre Kont gouf authentifizéiert, mee Dir hutt net déi néideg Administrateursrechter. |
| `adminApp.error.unauthorizedContact` | Cette section est réservée aux administrateurs système. Si vous pensez devoir y avoir accès, veuillez contacter l’administrateur système. | Dëse Beräich ass nëmme fir Systemadministrateuren. Wann Dir mengt, datt Dir Zougang sollt hunn, kontaktéiert wgl. de Systemadministrateur. |

### `adminApp.factorAnalysis.json` (14)

Files: `apps/frontend/messages/fr/adminApp.factorAnalysis.json`, `apps/frontend/messages/lb/adminApp.factorAnalysis.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.factorAnalysis.title` | Analyse factorielle | Faktoranalys |
| `adminApp.factorAnalysis.description` | Analysez et gérez les facteurs des questions de l’élection. | Analyséiert a verwalt d’Faktore vun de Wahlfroen. |
| `adminApp.factorAnalysis.compute.title` | Calculer les facteurs | Faktore berechnen |
| `adminApp.factorAnalysis.compute.description` | Calculez les facteurs latents à partir des réponses des candidat·es et des partis. | Berechent déi latent Faktoren aus den Äntwerte vun de Kandidat*innen an de Parteien. |
| `adminApp.factorAnalysis.compute.selectElections` | Sélectionnez les élections pour lesquelles calculer les facteurs. | Wielt d’Wahlen, fir déi d’Faktore berechent solle ginn. |
| `adminApp.factorAnalysis.compute.button` | Calculer les facteurs | Faktore berechnen |
| `adminApp.factorAnalysis.compute.buttonLoading` | Calcul des facteurs… | Faktore gi berechent… |
| `adminApp.factorAnalysis.compute.mayTakeTime` | Cela peut prendre un certain temps. | Dat kann eng Zäit daueren. |
| `adminApp.factorAnalysis.compute.noElections` | Aucune élection disponible | Keng Wahlen disponibel |
| `adminApp.factorAnalysis.compute.candidates` | candidat·es | Kandidat*innen |
| `adminApp.factorAnalysis.compute.parties.some` | et {count} partis | an {count} Parteien |
| `adminApp.factorAnalysis.compute.parties.none` | et aucun parti | a keng Parteien |
| `adminApp.factorAnalysis.compute.haveAnswered` | ont répondu | hu geäntwert |
| `adminApp.factorAnalysis.compute.error` | Échec du calcul des facteurs | D’Faktore konnten net berechent ginn |

### `adminApp.jobs.json` (36)

Files: `apps/frontend/messages/fr/adminApp.jobs.json`, `apps/frontend/messages/lb/adminApp.jobs.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.jobs.title` | Panneau de contrôle d’administration | Kontrollpanel fir d’Administratioun |
| `adminApp.jobs.emergencyCleanup` | Nettoyage d’urgence | Noutfall-Opraumen |
| `adminApp.jobs.features.ArgumentCondensation.title` | Synthèse des arguments | Zesummefaassung vun Argumenter |
| `adminApp.jobs.features.QuestionInfoGeneration.title` | Génération d’informations sur les questions | Generéierung vun Informatiounen iwwer d’Froen |
| `adminApp.jobs.confirmAbortAll` | Êtes-vous sûr·e de vouloir interrompre TOUTES les tâches en cours ? | Sidd Dir sécher, datt Dir ALL lafend Aufgabe wëllt ofbriechen? |
| `adminApp.jobs.authRequired` | Authentification requise | Authentifizéierung erfuerderlech |
| `adminApp.jobs.abortAllFailed` | Échec du nettoyage d’urgence. Consultez la console pour plus de détails. | D’Noutfall-Opraumen ass feelgeschloen. Kuckt an der Konsol no fir Detailer. |
| `adminApp.jobs.systemHealth` | État du système | Systemzoustand |
| `adminApp.jobs.activeJobs` | Tâches actives | Aktiv Aufgaben |
| `adminApp.jobs.successfulJobs` | Tâches réussies | Erfollegräich Aufgaben |
| `adminApp.jobs.failedJobs` | Tâches échouées | Feelgeschloen Aufgaben |
| `adminApp.jobs.abortedJobs` | Tâches interrompues | Ofgebrach Aufgaben |
| `adminApp.jobs.abortingInfo` | Interruption demandée. En attente de l’arrêt du traitement et de son nettoyage en toute sécurité. | Ofbroch ugefrot. Et gëtt gewaart, bis de Prozess gestoppt ass a sécher opgeraumt huet. |
| `adminApp.jobs.abortJob` | Interrompre la tâche | Aufgab ofbriechen |
| `adminApp.jobs.pastJobs` | Tâches passées | Vergaangen Aufgaben |
| `adminApp.jobs.hidePastJobs` | Masquer les tâches passées | Vergaangen Aufgabe verstoppen |
| `adminApp.jobs.showPastJobs` | Afficher les tâches passées | Vergaangen Aufgabe weisen |
| `adminApp.jobs.pastJobsDescription` | Tâches passées | Vergaangen Aufgaben |
| `adminApp.jobs.noActiveJobs` | Aucune tâche active | Keng aktiv Aufgaben |
| `adminApp.jobs.noPastJobs` | Aucune tâche passée | Keng vergaangen Aufgaben |
| `adminApp.jobs.started` | Début | Ufank |
| `adminApp.jobs.notAvailable` | N/D | n. v. |
| `adminApp.jobs.confirmAbortJob` | Êtes-vous sûr·e de vouloir interrompre cette tâche ({feature}) ? | Sidd Dir sécher, datt Dir dës Aufgab ({feature}) wëllt ofbriechen? |
| `adminApp.jobs.abortJobFailed` | Échec de l’interruption de la tâche. Consultez la console pour plus de détails. | D’Aufgab konnt net ofgebrach ginn. Kuckt an der Konsol no fir Detailer. |
| `adminApp.jobs.alreadyRunning` | Une tâche est déjà en cours. Veuillez attendre qu’elle se termine. | Et leeft schonn eng Aufgab. Waart wgl., bis se fäerdeg ass. |
| `adminApp.jobs.progress` | Progression | Fortschrëtt |
| `adminApp.jobs.warningsAndErrors` | Avertissements et erreurs | Warnungen a Feeler |
| `adminApp.jobs.noWarningsOrErrors` | Aucun avertissement ni erreur | Keng Warnungen oder Feeler |
| `adminApp.jobs.infoMessages` | Messages d’information | Informatiounsmessagen |
| `adminApp.jobs.noInfoMessages` | Aucun message d’information | Keng Informatiounsmessagen |
| `adminApp.jobs.author` | Auteur·rice | Auteur |
| `adminApp.jobs.duration` | Durée | Dauer |
| `adminApp.jobs.aborting` | Interruption… | Gëtt ofgebrach… |
| `adminApp.jobs.hideMessages` | Masquer les messages | Messagen verstoppen |
| `adminApp.jobs.showMessages` | Afficher les messages | Messagen weisen |
| `adminApp.jobs.messages` | (unchanged in this locale, see below) | Messagen |

### `adminApp.languageFeatures.json` (2)

Files: `apps/frontend/messages/fr/adminApp.languageFeatures.json`, `apps/frontend/messages/lb/adminApp.languageFeatures.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.languageFeatures.targetLanguage.label` | Langue cible | Zilsprooch |
| `adminApp.languageFeatures.targetLanguage.help` | La langue dans laquelle le contenu est généré. Les questions seront traitées et les résultats enregistrés dans cette langue. | D’Sprooch, an där den Inhalt generéiert gëtt. D’Froe ginn an dëser Sprooch veraarbecht an d’Resultater an dëser Sprooch gespäichert. |

### `adminApp.login.json` (13)

Files: `apps/frontend/messages/fr/adminApp.login.json`, `apps/frontend/messages/lb/adminApp.login.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.login.title` | Connexion à l’administration | Umeldung fir d’Administratioun |
| `adminApp.login.appTitle` | Boussole électorale | Wal-Kompass |
| `adminApp.login.instructions` | Saisissez vos identifiants de connexion. | Gitt Är Umeldungsdaten an. |
| `adminApp.login.email` | E-mail | E-Mail |
| `adminApp.login.password` | Mot de passe | Passwuert |
| `adminApp.login.button` | Se connecter | Umellen |
| `adminApp.login.forgotPassword` | Mot de passe oublié ? | Passwuert vergiess? |
| `adminApp.login.errors.invalidCredentials` | E-mail ou mot de passe non valide | Ongëlteg E-Mail oder Passwuert |
| `adminApp.login.errors.genericError` | Une erreur s’est produite lors de la connexion. Veuillez réessayer. | Beim Umellen ass e Feeler opgetrueden. Probéiert wgl. nach eng Kéier. |
| `adminApp.login.errors.unauthorized` | Vous devez disposer des droits d’administration pour accéder à cet espace | Dir braucht Administrateursrechter fir op dëse Beräich zouzegräifen |
| `adminApp.login.errors.sessionExpired` | Votre session a expiré, veuillez vous reconnecter | Är Sessioun ass ofgelaf, mellt Iech wgl. nach eng Kéier un |
| `adminApp.login.errors.unknown` | Une erreur inconnue s’est produite | En onbekannte Feeler ass opgetrueden |
| `adminApp.login.appSubtitle` | (unchanged in this locale, see below) | Administratioun |

### `adminApp.notSupported.json` (2)

Files: `apps/frontend/messages/fr/adminApp.notSupported.json`, `apps/frontend/messages/lb/adminApp.notSupported.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.notSupported.title` | Application d’administration non prise en charge | Administratiouns-Applikatioun net ënnerstëtzt |
| `adminApp.notSupported.content` | L’application d’administration n’est pas prise en charge avec l’adaptateur de données actuel. | D’Administratiouns-Applikatioun gëtt mam aktuellen Donnéeën-Adapter net ënnerstëtzt. |

### `adminApp.questionInfo.json` (25)

Files: `apps/frontend/messages/fr/adminApp.questionInfo.json`, `apps/frontend/messages/lb/adminApp.questionInfo.json`.

| key | fr | lb |
|---|---|---|
| `adminApp.questionInfo.title` | Informations sur les questions | Informatiounen iwwer d’Froen |
| `adminApp.questionInfo.description` | Générez des informations de contexte pour les questions de la boussole électorale, notamment des définitions de termes et des sections d’information, afin d’aider les électeur·rice·s à mieux comprendre les questions. | Generéiert Kontextinformatiounen zu de Froe vum Wal-Kompass, dorënner Begrëffsdefinitiounen an Informatiounssektiounen, fir de Wieler*innen ze hëllefen, d’Froe besser ze verstoen. |
| `adminApp.questionInfo.selectElection` | Sélectionner une élection | Wahl auswielen |
| `adminApp.questionInfo.selectQuestions` | Sélectionner les questions | Froen auswielen |
| `adminApp.questionInfo.noQuestions` | Aucune affirmation trouvée pour cette élection | Fir dës Wahl goufe keng Aussoe fonnt |
| `adminApp.questionInfo.generate.button` | Générer les informations sur les questions | Informatiounen iwwer d’Froe generéieren |
| `adminApp.questionInfo.generate.buttonLoading` | Génération… | Gëtt generéiert… |
| `adminApp.questionInfo.generate.allQuestions` | Toutes les affirmations | All d’Aussoen |
| `adminApp.questionInfo.generate.selectedQuestions` | Questions sélectionnées | Ausgewielte Froen |
| `adminApp.questionInfo.options.heading` | Options de génération | Optioune fir d’Generéierung |
| `adminApp.questionInfo.options.whatToGenerate` | Éléments à générer : | Wat soll generéiert ginn: |
| `adminApp.questionInfo.options.terms` | Définitions de termes | Begrëffsdefinitiounen |
| `adminApp.questionInfo.options.infoSections` | Sections d’information | Informatiounssektiounen |
| `adminApp.questionInfo.sectionTopics.label` | Thèmes des sections (facultatif) | Theme vun de Sektiounen (optional) |
| `adminApp.questionInfo.sectionTopics.help` | Liste de thèmes pour les sections d’information, séparés par des virgules. Laissez vide pour utiliser les thèmes par défaut. | Lëscht vun Theme fir d’Informatiounssektiounen, mat Komma getrennt. Loosst d’Feld eidel, fir d’Standardthemen ze benotzen. |
| `adminApp.questionInfo.sectionTopics.placeholder` | Contexte, Situation actuelle, Principales parties prenantes | Hannergrond, Aktuell Situatioun, Wichteg Akteuren |
| `adminApp.questionInfo.customInstructions.label` | Instructions personnalisées (facultatif) | Eegen Instruktiounen (optional) |
| `adminApp.questionInfo.customInstructions.help` | Indications supplémentaires pour le LLM sur la manière de générer le contenu. | Zousätzlech Uweisunge fir de LLM, wéi den Inhalt generéiert soll ginn. |
| `adminApp.questionInfo.customInstructions.placeholder` | Mettre l’accent sur la gouvernance locale et les aspects de politique municipale | De Fokus op d’lokal Gouvernance an op Aspekter vun der Gemengepolitik leeën |
| `adminApp.questionInfo.questionContext.label` | Contexte des questions (facultatif) | Kontext vun de Froen (optional) |
| `adminApp.questionInfo.questionContext.help` | Contexte sur l’élection ou le domaine thématique, pour aider le LLM à générer un contenu plus pertinent. | Kontext iwwer d’Wahl oder d’Themegebitt, fir dem LLM ze hëllefen, méi relevanten Inhalt ze generéieren. |
| `adminApp.questionInfo.questionContext.placeholder` | Élections municipales finlandaises 2025 | Finnesch Gemengewahlen 2025 |
| `adminApp.questionInfo.validation.noElection` | Veuillez sélectionner une élection | Wielt wgl. eng Wahl aus |
| `adminApp.questionInfo.validation.noQuestions` | Veuillez sélectionner au moins une question | Wielt wgl. op d’mannst eng Fro aus |
| `adminApp.questionInfo.validation.noOperations` | Veuillez sélectionner au moins une option de génération | Wielt wgl. op d’mannst eng Optioun fir d’Generéierung aus |

### `common.json` (2)

Files: `apps/frontend/messages/fr/common.json`, `apps/frontend/messages/lb/common.json`.

| key | fr | lb |
|---|---|---|
| `common.loggedOutAutomatically` | Vous avez été déconnecté·e automatiquement, car une déconnexion que vous aviez lancée n’a pas été annulée à temps. | Dir gouft automatesch ausgeloggt, well en Ausloggen, deen Dir ugefaangen hutt, net rechtzäiteg ofgebrach gouf. |
| `common.loggedOutElsewhere` | Vous avez été déconnecté·e dans un autre onglet ou une autre fenêtre. | Dir gouft an engem aneren Tab oder an enger anerer Fënster ausgeloggt. |

### Written but equal to the English, so the derivation shows no change

Plans 70 and 80 translated every key of the nine `adminApp.*` catalogues (121 in each locale). These kept the English text, so `git diff` does not show them; a native reader should still confirm them.

| file | key | fr | lb |
|---|---|---|---|
| `adminApp.jobs.json` | `adminApp.jobs.messages` | Messages | (changed, in the table above) |
| `adminApp.jobs.json` | `adminApp.jobs.id` | ID | ID |
| `adminApp.login.json` | `adminApp.login.appSubtitle` | Administration | (changed, in the table above) |
| `adminApp.notSupported.json` | `adminApp.notSupported.heroEmoji` | 🔧 | 🔧 |

### Changed with no text written

- `about.json`, `about.organizationMatching.content`, in `fr` and `lb`: plan 70 changed only the selectors of the variants (`partyMatchingMethod=imputed` became `=impute`, `=other` became `=*`). No text changed, so there is nothing for a native reader here beyond what the phase's earlier review already covers.
- `components.json`, `components.passwordInput.hidePassword`, in `fr` and `lb`: removed by plan 77 (the password toggle keeps one name). Nothing to read.

## Added by plan 179.1-81

Plan 179.1-81 wrote nine more values, four in `fr` and five in `lb` (rule 5 of the rules of plans 81 to 85 in `179.1-81-PLAN.md`): the select's placeholder and the argument lists of a question, which were still in English. Each is a machine translation approved at that plan's checkpoint; the `lb` value of `questions.arguments.proCategory` is written as the operator's edit gave it. No native reader has read them. Derived by `git diff 3c379d3d5 HEAD -- apps/frontend/messages/fr apps/frontend/messages/lb`; a corrected string is then written into `179.1-81-approved-strings.json` in the phase directory.

### `components.json` (2)

Files: `apps/frontend/messages/fr/components.json`, `apps/frontend/messages/lb/components.json`.

| key | fr | lb |
|---|---|---|
| `components.select.placeholder` | Sélectionnez une option ci-dessous | Wielt hei ënnen eng Optioun aus |

### `questions.json` (7)

Files: `apps/frontend/messages/fr/questions.json`, `apps/frontend/messages/lb/questions.json`.

| key | fr | lb |
|---|---|---|
| `questions.arguments.con` | Contre | Dogéint |
| `questions.arguments.pro` | Pour | Dofir |
| `questions.arguments.proCategory` | Pour {option} | Dofir: {option} |
| `questions.arguments.title` | (not written: `Arguments`, the same word in French, on the allowlist) | Argumenter |
