# Extension Patterns for @openvaa/data

Step-by-step guides for the most common data package extensions. All file paths in steps are relative to `packages/data/src/` unless stated otherwise.

## Adding a New Entity Type

Reference implementation: `Candidate` (see `objects/entities/variants/candidate.ts`, `candidate.type.ts`, `candidate.test.ts`).

Follow these steps in order. Each step names the file to create or modify.

1. **Create type file** `objects/entities/variants/{name}.type.ts`
   - Define `{Name}Data extends EntityData<typeof ENTITY_TYPE.{Name}>` interface
   - Add entity-specific fields (e.g., `firstName`, `lastName` for Candidate)
   - Import from `../../../internal`
   - Pattern: copy `objects/entities/variants/candidate.type.ts`, adapt fields

2. **Create class file** `objects/entities/variants/{name}.ts`
   - Class: `{Name} extends Entity<typeof ENTITY_TYPE.{Name}, {Name}Data>`
   - Implement `DataAccessor<{Name}Data>` interface
   - Add `readonly objectType = OBJECT_TYPE.{Name}`
   - Add typed property getters with smart defaults (e.g., `return this.data.prop ?? ''`)
   - Import from `../../../internal`
   - Pattern: copy `objects/entities/variants/candidate.ts`

3. **Add to ENTITY_TYPE** `objects/entities/base/entityTypes.ts`
   - Add `{Name}: '{name}'` to the `ENTITY_TYPE` const object
   - The `EntityType` union type auto-derives from the const via `keyof typeof`

4. **Add to OBJECT_TYPE** `core/objectTypes.ts`
   - Add `{Name}: '{name}'` to the `OBJECT_TYPE` const object
   - Add `[OBJECT_TYPE.{Name}]: {Name}` to the `ObjectTypeMap` type
   - Note the comment in source: "NB! When editing these, be sure to update `/utils/typeGuard.ts` as well."

5. **Update type guards** `utils/typeGuards.ts`
   - Add `obj.objectType === OBJECT_TYPE.{Name}` to the `isEntity()` function's condition chain
   - No change needed to `isDataObject()` (uses `Object.values(OBJECT_TYPE).includes()`)

6. **Update EntityVariant** `objects/entities/variants/variants.ts`
   - Add to `EntityVariantConstructor` type map: `[ENTITY_TYPE.{Name}]: typeof {Name}`
   - The `EntityVariant`, `EntityVariantData`, and `AnyEntityVariantData` types auto-derive
   - Update `parseEntityTree` only if the tree format needs new variant handling (usually not needed)

7. **Add exports to internal.ts** `internal.ts`
   - Add `export * from './objects/entities/variants/{name}.type'` in the entity variants block
   - Add `export * from './objects/entities/variants/{name}'` immediately after the type export
   - Position: after the last entity variant (currently alliance), before `variants.ts` re-export
   - Order matters: type file before class file

8. **Add to index.ts** `index.ts`
   - Add `{Name}Data` to the type exports block
   - Add `{Name}` to the class/value exports block

9. **Add DataRoot collection** `root/dataRoot.ts` (only if entity needs its own collection getter)
   - Add `get {name}s()` collection getter following the pattern of `get candidates()`
   - Add `get{Name}(id)` id getter following the pattern of `getCandidate(id)`
   - Update `getEntityCollectionName()` switch to map `ENTITY_TYPE.{Name}` to `'{name}s'`
   - Update `getNominationCollectionName()` if corresponding nomination exists
   - Update `provideEntityData()` to filter and construct the new entity type
   - Add the new collection key to the `RootCollections` type in `root/dataRoot.type.ts`

10. **Create co-located test** `objects/entities/variants/{name}.test.ts`
    - Import from `../../../internal` and `../../../testUtils`
    - Use `getTestDataRoot()` and `getTestData()` for test fixtures
    - Test that all provided data is accessible via getters
    - Test smart defaults for optional properties
    - Pattern: copy `objects/entities/variants/candidate.test.ts`

## Adding a New Question Type

Reference implementations: `SingleChoiceOrdinalQuestion` for matchable (see `objects/questions/variants/singleChoiceOrdinalQuestion.ts`), `TextQuestion` for non-matchable (see `objects/questions/variants/textQuestion.ts`).

Follow these steps in order.

1. **Create class file** `objects/questions/variants/{name}Question.ts`
   - For simple (non-choice) questions: `class {Name}Question extends Question<typeof QUESTION_TYPE.{Name}>`
   - For single-choice questions: `class {Name}Question extends SingleChoiceQuestion<typeof QUESTION_TYPE.{Name}, {ChoiceValue}>`
   - For multiple-choice questions: `class {Name}Question extends MultipleChoiceQuestion<typeof QUESTION_TYPE.{Name}, {ChoiceValue}>`
   - Add `readonly objectType = OBJECT_TYPE.{Name}Question`
   - Implement `_ensureValue(value)` for answer value validation
   - If matchable: override `get isMatchable() { return true; }` and implement `_normalizeValue()`
   - If non-matchable: `isMatchable` defaults to `false` from base class, no `_normalizeValue()` needed
   - Import from `../../../internal`
   - Pattern for matchable: `objects/questions/variants/singleChoiceOrdinalQuestion.ts`
   - Pattern for non-matchable: `objects/questions/variants/textQuestion.ts`

2. **Create type file** (only if question has extra data fields beyond QuestionData)
   - `objects/questions/variants/{name}Question.type.ts`
   - For simple questions: `{Name}QuestionData extends QuestionData<typeof QUESTION_TYPE.{Name}>`
   - For choice questions: `{Name}QuestionData extends ChoiceQuestionData<typeof QUESTION_TYPE.{Name}, {ChoiceValue}>`
   - Add extra fields (e.g., `min` and `max` for NumberQuestion)
   - Pattern: `objects/questions/variants/numberQuestion.type.ts`

3. **Add to QUESTION_TYPE** `objects/questions/base/questionTypes.ts`
   - If simple: add `{Name}: '{name}'` to `SIMPLE_QUESTION_TYPE`
   - If single-choice: add `{Name}: '{name}'` to `SINGLE_CHOICE_QUESTION_TYPE`
   - If multiple-choice: add `{Name}: '{name}'` to `MULTIPLE_CHOICE_QUESTION_TYPE`
   - The composite consts (`CHOICE_QUESTION_TYPE`, `QUESTION_TYPE`) auto-derive via `...` spread

4. **Add to OBJECT_TYPE** `core/objectTypes.ts`
   - Add `{Name}Question: '{name}Question'` to the `OBJECT_TYPE` const
   - Add `[OBJECT_TYPE.{Name}Question]: {Name}Question` to `ObjectTypeMap`

5. **Update type guards** `utils/typeGuards.ts`
   - `isQuestion()` uses `.endsWith('Question')` -- no change needed
   - If ChoiceQuestion subtype: add to `isChoiceQuestion()` condition
   - If SingleChoiceQuestion: add to `isSingleChoiceQuestion()` condition
   - If MultipleChoiceQuestion: add to `isMultipleChoiceQuestion()` condition

6. **Update QuestionVariant** `objects/questions/variants/variants.ts`
   - Add to `QUESTION_VARIANT` map: `[QUESTION_TYPE.{Name}]: {Name}Question`
   - Add to `QuestionVariant` type map: `[QUESTION_TYPE.{Name}]: {Name}Question`
   - Add to `QuestionVariantData` type map with correct data type
   - `createQuestion()` uses `QUESTION_VARIANT` map to select the class -- no additional changes needed

7. **Update AnswerValue** `objects/questions/base/answer.type.ts`
   - Add `[QUESTION_TYPE.{Name}]: {ValueType}` to the `AnswerValue` mapped type
   - Value types by convention: `string` for text, `number` for numeric, `boolean` for boolean, `Id` for single-choice, `Array<Id>` for multiple-choice, `Image` for image, `Date` for date

8. **Add exports to internal.ts** `internal.ts`
   - Add type file export (if created): `export * from './objects/questions/variants/{name}Question.type'`
   - Add class file export: `export * from './objects/questions/variants/{name}Question'`
   - Position: in the question variants block (after existing question variants, before the `variants.ts` re-export)
   - Order matters: type file before class file

9. **Add to index.ts** `index.ts`
   - Add data type (if any) to type exports
   - Add question class to class/value exports

10. **Create co-located test** `objects/questions/variants/{name}Question.test.ts`
    - Test answer value validation via `ensureValue()`
    - Test answer formatting via `getFormattedAnswer()` if applicable
    - If matchable: test `normalizeValue()` returns correct coordinates for known input values
    - Verify `isMatchable` returns the expected boolean
    - Import from `../../../internal` and `../../../testUtils`

## Adding a New Nomination Variant

Abbreviated guide -- nomination variants follow the entity pattern but with `Nomination` base class.

Reference: `candidateNomination.ts` for simple nomination, `organizationNomination.ts` for nomination with child nominations.

Key differences from entity extension:

- Class extends `Nomination<TEntityType, TParentNominationType, {Name}NominationData>`
- Three generic params: entity variant it links to, parent nomination variant type (or `never` if top-level), and its own data type
- Add `readonly objectType = OBJECT_TYPE.{Name}Nomination`
- Must update `NominationVariantConstructor` type map in `objects/nominations/variants/variants.ts`
- Must update `NominationVariantPublicData` in same file
- May need implied (auto-generated) entity handling if this is a grouping nomination (see `organizationNomination.ts` and `allianceNomination.ts` for patterns)
- Add to `OBJECT_TYPE` and `ObjectTypeMap` in `core/objectTypes.ts`
- Update `typeGuards.ts` -- `isNomination()` uses `.endsWith('Nomination')` so may not need changes
- Add exports to `internal.ts` in the nominations variants block
- Update `DataRoot.provideNominationData()` and `getNominationCollectionName()` in `root/dataRoot.ts`

## Verification After Extension

After completing any extension, verify:

1. `cd packages/data && yarn test:unit` -- all existing tests pass (no regressions)
2. New test file passes with expected assertions
3. `yarn build:app-shared` -- builds without circular dependency errors
4. Check `internal.ts` export ordering: type file before class file, base types before dependent types
5. Check that all `OBJECT_TYPE` values are unique strings (no collisions with existing values)
6. Check that `typeGuards.ts` includes the new type where relevant (entity, question, nomination guards)
7. If matchable question: verify `normalizeValue()` returns correct dimensionality (check `normalizedDimensions` getter on the question instance)
8. If new entity: verify `DataRoot` collection getter returns instances sorted by `order` property
