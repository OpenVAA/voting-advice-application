# Data Object Model Reference

Quick-lookup reference for all `@openvaa/data` object types, their hierarchy positions, DataRoot collection getters, and relationships.

## Class Diagrams

For full Mermaid class diagrams showing inheritance and inter-object links, read `packages/data/README.md`.

The README contains three diagrams:

1. Classes and inheritance without Questions
2. Question and QuestionCategory class inheritance
3. Links between objects (cross-references, Nomination linking, etc.)

Do NOT duplicate these diagrams -- always refer to the README as the single source of truth.

## Object Type Hierarchy

All 21 concrete types organized by inheritance chain. Values in parentheses are `OBJECT_TYPE` string values from `packages/data/src/core/objectTypes.ts`.

```
Updatable (abstract)
  DataRoot
  DataObject (abstract)
    Election ('election')
    Constituency ('constituency')
    ConstituencyGroup ('constituencyGroup')
    QuestionAndCategoryBase (abstract)
      QuestionCategory ('questionCategory')
      Question (abstract)
        BooleanQuestion ('booleanQuestion')
        DateQuestion ('dateQuestion')
        ImageQuestion ('imageQuestion')
        MultipleTextQuestion ('multipleTextQuestion')
        NumberQuestion ('numberQuestion')
        TextQuestion ('textQuestion')
        ChoiceQuestion (abstract)
          SingleChoiceQuestion (abstract)
            SingleChoiceOrdinalQuestion ('singleChoiceOrdinalQuestion')
            SingleChoiceCategoricalQuestion ('singleChoiceCategoricalQuestion')
          MultipleChoiceQuestion (abstract)
            MultipleChoiceCategoricalQuestion ('multipleChoiceCategoricalQuestion')
    Entity (abstract)
      Candidate ('candidate')
      Organization ('organization')
      Faction ('faction')
      Alliance ('alliance')
    Nomination (abstract)
      CandidateNomination ('candidateNomination')
      OrganizationNomination ('organizationNomination')
      FactionNomination ('factionNomination')
      AllianceNomination ('allianceNomination')
```

Source: `packages/data/src/core/objectTypes.ts` defines the `OBJECT_TYPE` const and `ObjectTypeMap`.

## DataRoot Collection Getters

All collections available on `DataRoot` (source: `packages/data/src/root/dataRoot.ts`):

| Collection Getter         | Returns                    | Id Getter                       | Provision Method            |
| ------------------------- | -------------------------- | ------------------------------- | --------------------------- |
| `elections`               | `Election[]`               | `getElection(id)`               | `provideElectionData()`     |
| `constituencyGroups`      | `ConstituencyGroup[]`      | `getConstituencyGroup(id)`      | `provideConstituencyData()` |
| `constituencies`          | `Constituency[]`           | `getConstituency(id)`           | `provideConstituencyData()` |
| `questionCategories`      | `QuestionCategory[]`       | `getQuestionCategory(id)`       | `provideQuestionData()`     |
| `questions`               | `AnyQuestionVariant[]`     | `getQuestion(id)`               | `provideQuestionData()`     |
| `candidates`              | `Candidate[]`              | `getCandidate(id)`              | `provideEntityData()`       |
| `organizations`           | `Organization[]`           | `getOrganization(id)`           | `provideEntityData()`       |
| `factions`                | `Faction[]`                | `getFaction(id)`                | `provideEntityData()`       |
| `alliances`               | `Alliance[]`               | `getAlliance(id)`               | `provideEntityData()`       |
| `candidateNominations`    | `CandidateNomination[]`    | `getCandidateNomination(id)`    | `provideNominationData()`   |
| `organizationNominations` | `OrganizationNomination[]` | `getOrganizationNomination(id)` | `provideNominationData()`   |
| `factionNominations`      | `FactionNomination[]`      | `getFactionNomination(id)`      | `provideNominationData()`   |
| `allianceNominations`     | `AllianceNomination[]`     | `getAllianceNomination(id)`     | `provideNominationData()`   |

Additional cross-cutting getters:

- `getEntity(type, id)` -- generic entity getter by `EntityType` and `Id`
- `getNomination(type, id)` -- generic nomination getter by `EntityType` and `Id`
- `getNominationsForEntity({ type, id })` -- all nominations for a specific entity
- `findNominations({ entityType, entityId?, electionId?, ... })` -- filtered nomination search
- `provideFullData(data)` -- provides all data at once (calls all provision methods)

## Entity Type Constants

Source: `packages/data/src/objects/entities/base/entityTypes.ts`

| ENTITY_TYPE    | Value            | Explicit/Implied                                                  |
| -------------- | ---------------- | ----------------------------------------------------------------- |
| `Candidate`    | `'candidate'`    | Explicit -- requires separate EntityData                          |
| `Organization` | `'organization'` | Explicit -- requires separate EntityData                          |
| `Faction`      | `'faction'`      | Can be implied -- auto-created from NominationData if no entityId |
| `Alliance`     | `'alliance'`     | Can be implied -- auto-created from NominationData if no entityId |

Implied entities get deterministic IDs via `DataRoot.createId()`. They are constituency- and election-specific.

## Question Type Constants

Source: `packages/data/src/objects/questions/base/questionTypes.ts`

- **SIMPLE_QUESTION_TYPE:** Text, Number, Boolean, Image, Date, MultipleText
- **SINGLE_CHOICE_QUESTION_TYPE:** SingleChoiceOrdinal, SingleChoiceCategorical
- **MULTIPLE_CHOICE_QUESTION_TYPE:** MultipleChoiceCategorical
- **CHOICE_QUESTION_TYPE** = SINGLE_CHOICE + MULTIPLE_CHOICE (auto-derived via spread)
- **QUESTION_TYPE** = SIMPLE + CHOICE (auto-derived via spread)

**Matchable questions** (implement `isMatchable = true` and `_normalizeValue()`):

- SingleChoiceOrdinal -- Likert-scale; maps ordinal choice value to [0,1] range
- SingleChoiceCategorical -- nominal; creates N subdimensions (one per choice)
- Boolean -- maps true/false to coordinate
- Number -- matchable if `min` and `max` are defined in data
- Date -- matchable if `min` and `max` dates are defined

**Not matchable:** Text, Image, MultipleText, MultipleChoiceCategorical (not yet implemented).

**Not implemented:** PreferenceOrder (planned, based on MultipleChoiceCategorical).

## Question Category Types

Source: `packages/data/src/objects/questions/category/questionCategoryTypes.ts`

| QUESTION_CATEGORY_TYPE | Value       | Purpose                                         |
| ---------------------- | ----------- | ----------------------------------------------- |
| `Opinion`              | `'opinion'` | Opinion questions normally used for matching    |
| `Info`                 | `'info'`    | Background/info questions not used for matching |
| `Default`              | `'default'` | Default type when category type is unspecified  |

Category filtering uses `appliesTo(filters)` on `QuestionAndCategoryBase`, which checks election, constituency, entityType, and electionRound scoping. Questions inherit their category's filters unless `dontInherit: true`.

The model types `entityType` as a `FilterValue`, one entity type or a list of them. The database is narrower: the `entity_type` column of `questions` and of `question_categories` holds null or a JSON array of entity types, and a trigger refuses a bare string for every writer. Data that is stored or imported, a seed template's row included, therefore states the filter as an array, also for one type: `['organization']`. See the database skill for the trigger.

## Key Relationships

- **Election -> ConstituencyGroup(s) -> Constituency(ies):** Elections have constituency groups; each group contains constituencies the voter chooses from.
- **One constituency per election -- selection semantics, not a model invariant:** The voter chooses one constituency per election, and in a multi-election setting those choices are not independent: where two elections share a constituency group, or where their constituencies are nested, the two choices meet and cannot be contradictory -- they are one choice, so selecting for one election constrains the other.
- **Constituency -> parentConstituency:** Optional nesting for multi-level elections (e.g., regional + municipal).
- **Child constituency implies its parent -- selection semantics, not a model invariant:** The `parentConstituency` nesting lets the voter select only the child constituency; the parent is implied from it, so a selector need not ask for both.
- **Nomination links Entity + Election + Constituency:** A Nomination represents an entity nominated in a specific election-constituency pair.
- **CandidateNomination -> Candidate:** Links to the nominated person.
- **OrganizationNomination -> Organization:** Links to the nominated Organization, most often a party; may contain CandidateNominations and FactionNominations as children.
- **Party list -- an OrganizationNomination with CandidateNomination children:** The common case of the relationship above, and the name the code itself uses; CandidateNomination.list returns the parent OrganizationNomination -- `null` when the candidate is not nominated on a list -- and OrganizationNomination.candidateNominations returns its members.
- **AllianceNomination -> Alliance:** Contains OrganizationNominations as children.
- **FactionNomination -> Faction:** Contains CandidateNominations as children; must be part of an OrganizationNomination.
- **Question -> QuestionCategory:** Each question belongs to exactly one category.
- **Entity has Answers:** Record of `Id -> Answer` stored in entity data; accessed via `entity.getAnswer(question)`.

Both selection rules above are voter-facing semantics recorded from the product owner's review of PR #874, not facts read off a source file -- an agent cannot recover them from the class definitions, which is why they are stated here. `@openvaa/data` enforces neither: nothing rejects a conflicting pair of selections. It does supply what a constituency selector needs to honour them -- `ConstituencyGroup.impliedBy()` and `ConstituencyGroup.getImpliedConstituency()` in `packages/data/src/objects/constituency/constituencyGroup.ts`, and `DataRoot.getCombinedElections()` in `packages/data/src/root/dataRoot.ts`, which collapses elections whose constituency groups imply one another so the voter is asked once. The nearest thing to a guard is `Election.getApplicableConstituency()` in `packages/data/src/objects/election/election.ts`, which throws when a voter's selection resolves to more than one constituency for a single election -- a read-site check, not an invariant of the model.

## The nomination shape of an election

`Election.nominationShape` says which entity types the election admits as nominees and which parent each may name. The data's `nominationShape` is optional; the getter answers `DEFAULT_NOMINATION_SHAPE`, `organization_list_and_independents`, where the data states none. The values are those the database stores in `elections.election_type`.

The matrix is `packages/data/src/objects/election/nominationShape.ts`, a pure module that reads no `DataRoot`:

| `NOMINATION_SHAPE` member | Value | Nominees | A candidate's parent |
| --- | --- | --- | --- |
| `OrganizationOnly` | `organization_only` | organizations and alliances | — |
| `CandidateOnly` | `candidate_only` | candidates alone | none is named |
| `OrganizationList` | `organization_list` | every entity type | an organization, required |
| `OrganizationListAndIndependents` | `organization_list_and_independents` | every entity type | an organization, optional |

- `isNominableInShape(shape, entityType)` -- whether an entity of that type may be nominated. Asked wherever elections are offered to an entity or counted for it. A shape that is not a member admits nothing.
- `allowedParentTypes(shape, entityType)` -- `{ types, required }`: the entity types the parent may be and whether one must be named. An organization for a candidate (none in `candidate_only`), an alliance for an organization, never required; an organization for a faction, required; none for an alliance. The answer is the empty one where the entity type is not nominable in the shape. A faction is never among `types`: no screen lets a candidate choose a faction's list, although the database admits a faction's nomination as a candidate's parent.

NEVER re-derive either answer from the shape's name in a page, a load or a component: ask the two functions. The model does not refuse a nomination its election's shape does not admit; the functions tell the application what to offer, and the database is what refuses. `packages/data/README.md` § _Nomination rules: the data model and the database_ compares the two statements rule by rule, and `nominationShape.test.ts` holds one case for each of the sixteen cells.

## Factory Functions

- `createQuestion({ data, root })` in `packages/data/src/objects/questions/variants/variants.ts` -- selects the correct Question subclass from `data.type` using the `QUESTION_VARIANT` map.
- `parseEntityTree(data)` in `packages/data/src/objects/entities/variants/variants.ts` -- converts `EntityVariantTree` (keyed by EntityType) to a flat `AnyEntityVariantData[]`.
- `parseNominationTree(data)` in `packages/data/src/objects/nominations/variants/variants.ts` -- converts `NominationVariantTree` (keyed by electionId/constituencyId) to a flat array.
- `parseFullVaaData(data)` in `packages/data/src/utils/parseFullVaaData.ts` -- parses a complete VAA data structure with all collections.

<!-- skill-link-allow: data.type -->

Objects are NEVER created directly with `new` in application code. Always use DataRoot provision methods (`provideEntityData()`, `provideQuestionData()`, etc.) which call these factories internally.
