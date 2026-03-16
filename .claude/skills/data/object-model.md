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

All 21 concrete types organized by inheritance chain. Values in parentheses are `OBJECT_TYPE` string values from `core/objectTypes.ts`.

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

Source: `core/objectTypes.ts` defines the `OBJECT_TYPE` const and `ObjectTypeMap`.

## DataRoot Collection Getters

All collections available on `DataRoot` (source: `root/dataRoot.ts`):

| Collection Getter | Returns | Id Getter | Provision Method |
|---|---|---|---|
| `elections` | `Election[]` | `getElection(id)` | `provideElectionData()` |
| `constituencyGroups` | `ConstituencyGroup[]` | `getConstituencyGroup(id)` | `provideConstituencyData()` |
| `constituencies` | `Constituency[]` | `getConstituency(id)` | `provideConstituencyData()` |
| `questionCategories` | `QuestionCategory[]` | `getQuestionCategory(id)` | `provideQuestionData()` |
| `questions` | `AnyQuestionVariant[]` | `getQuestion(id)` | `provideQuestionData()` |
| `candidates` | `Candidate[]` | `getCandidate(id)` | `provideEntityData()` |
| `organizations` | `Organization[]` | `getOrganization(id)` | `provideEntityData()` |
| `factions` | `Faction[]` | `getFaction(id)` | `provideEntityData()` |
| `alliances` | `Alliance[]` | `getAlliance(id)` | `provideEntityData()` |
| `candidateNominations` | `CandidateNomination[]` | `getCandidateNomination(id)` | `provideNominationData()` |
| `organizationNominations` | `OrganizationNomination[]` | `getOrganizationNomination(id)` | `provideNominationData()` |
| `factionNominations` | `FactionNomination[]` | `getFactionNomination(id)` | `provideNominationData()` |
| `allianceNominations` | `AllianceNomination[]` | `getAllianceNomination(id)` | `provideNominationData()` |

Additional cross-cutting getters:

- `getEntity(type, id)` -- generic entity getter by `EntityType` and `Id`
- `getNomination(type, id)` -- generic nomination getter by `EntityType` and `Id`
- `getNominationsForEntity({ type, id })` -- all nominations for a specific entity
- `findNominations({ entityType, entityId?, electionId?, ... })` -- filtered nomination search
- `provideFullData(data)` -- provides all data at once (calls all provision methods)

## Entity Type Constants

Source: `objects/entities/base/entityTypes.ts`

| ENTITY_TYPE | Value | Explicit/Implied |
|---|---|---|
| `Candidate` | `'candidate'` | Explicit -- requires separate EntityData |
| `Organization` | `'organization'` | Explicit -- requires separate EntityData |
| `Faction` | `'faction'` | Can be implied -- auto-created from NominationData if no entityId |
| `Alliance` | `'alliance'` | Can be implied -- auto-created from NominationData if no entityId |

Implied entities get deterministic IDs via `DataRoot.createId()`. They are constituency- and election-specific.

## Question Type Constants

Source: `objects/questions/base/questionTypes.ts`

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

Source: `objects/questions/category/questionCategoryTypes.ts`

| QUESTION_CATEGORY_TYPE | Value | Purpose |
|---|---|---|
| `Opinion` | `'opinion'` | Opinion questions normally used for matching |
| `Info` | `'info'` | Background/info questions not used for matching |
| `Default` | `'default'` | Default type when category type is unspecified |

Category filtering uses `appliesTo(filters)` on `QuestionAndCategoryBase`, which checks election, constituency, entityType, and electionRound scoping. Questions inherit their category's filters unless `dontInherit: true`.

## Key Relationships

- **Election -> ConstituencyGroup(s) -> Constituency(ies):** Elections have constituency groups; each group contains constituencies the voter chooses from.
- **Constituency -> parentConstituency:** Optional nesting for multi-level elections (e.g., regional + municipal).
- **Nomination links Entity + Election + Constituency:** A Nomination represents an entity nominated in a specific election-constituency pair.
- **CandidateNomination -> Candidate:** Links to the nominated person.
- **OrganizationNomination -> Organization:** Links to the party/association; may contain CandidateNominations and FactionNominations as children.
- **AllianceNomination -> Alliance:** Contains OrganizationNominations as children.
- **FactionNomination -> Faction:** Contains CandidateNominations as children; must be part of an OrganizationNomination.
- **Question -> QuestionCategory:** Each question belongs to exactly one category.
- **Entity has Answers:** Record of `Id -> Answer` stored in entity data; accessed via `entity.getAnswer(question)`.
- **Candidate -> Organization:** Optional `organizationId` linking a candidate to their party/association.

## Factory Functions

- `createQuestion({ data, root })` in `objects/questions/variants/variants.ts` -- selects the correct Question subclass from `data.type` using the `QUESTION_VARIANT` map.
- `parseEntityTree(data)` in `objects/entities/variants/variants.ts` -- converts `EntityVariantTree` (keyed by EntityType) to a flat `AnyEntityVariantData[]`.
- `parseNominationTree(data)` in `objects/nominations/variants/variants.ts` -- converts `NominationVariantTree` (keyed by electionId/constituencyId) to a flat array.
- `parseFullVaaData(data)` in `utils/parseFullVaaData.ts` -- parses a complete VAA data structure with all collections.

Objects are NEVER created directly with `new` in application code. Always use DataRoot provision methods (`provideEntityData()`, `provideQuestionData()`, etc.) which call these factories internally.
