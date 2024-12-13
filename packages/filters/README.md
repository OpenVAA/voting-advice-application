# `@openvaa/filters`: Filters for candidates and other entities

The filters in this module allow basic filtering of entities, e.g. candidates or parties, using criteria, such as their answers to designated question or their other properties.

**This documentation is incomplete and will be updated later!**

## 🚧 To Do:

- Refactor the complicated `entityGetter`, built-in `property` or `Question` accessors and the stored objects in `EnumeratedFilter` into a single value getter callback (possibly with another callback for processing values for display). Also remove `locale` from properties and leave sorting to the consumers.
- Add global locale changing to group
- Make canonical missing value undefined, but add isMissing utility that checks for empty arrays etc.
- Possibly move isMissing check to filter method so it can be overriden

## Dependencies

- `@openvaa/core`: Definitions related to ids, answers and entities having answers to these are shared between this and other `vaa` modules.
- `@openvaa/data`: Definitions related to questions.

## Developing

The module uses [`tsc-esm-fix`](https://github.com/antongolub/tsc-esm-fix) which allows us to use suffixless imports in Typescript.

## Basic use

1. Choose from one of the implemented filters, e.g. [`SingleChoiceQuestionFilter`](./src/filter/enumerated/singleChoiceQuestionFilter.ts), which works on questions that have an enumerated list of values of which the entity may select one.
2. Depending on the filter, they take different constructor parameters and type generics. [`SingleChoiceQuestionFilter`](./src/filter/enumerated/singleChoiceQuestionFilter.ts) takes a `question` parameter implementing the [`ChoiceQuestion`](./src/question/filterableQuestion.ts) interface and an optional `locale` code, which is used in value sorting.
3. After creating the filter, you can add rules to it to filter down the results.
4. To apply the filter, use the `apply` method.
5. To list the value options, use the `parse` method on the available targets.
6. You can also add an event handler which is called each time the filters' rules change.

```tsx
// Get candidates from somewhere, Candidate implements EntityWithAnswers
const candidates: Array<Candidate> = getCandidates();

// Create filter: ; genderQuestion: ChoiceQuestion, $locale: string
const filter = new SingleChoiceQuestionFilter<Candidate>(genderQuestion, locale);

// Define event handler
const handler = (filter) => console.info(filter.apply(candidates));

// Show the values present in candidates and sorted in a localized order with a possible missing value at the end. These can be used in the frontend to create form inputs
console.info(filter.parseValues(candidates));

// Change the filter. Expect the handler to be called
filter.exclude(genderQuestion.values.find((v) => v.label === 'Male'));

// Reset the filter. Expect the handler to be called and apply to return all candidates, because the filters are now reset.
filter.reset();

// Change the filter. Expect the handler to be called
filter.include(genderQuestion.values.find((v) => v.label === 'Female' || v.label === 'Nonbinary'));
```

## Filter group

You can also use the [`FilterGroup`](./src/group/filterGroup.ts) class to combine multiple filters, subscribe to all of their changes and use `apply`
to get combined results for all of the filters.
