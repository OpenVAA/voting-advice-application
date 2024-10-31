/**
 * A valid filter value that defines, e.g., the ids of the elections or constituencies that a question category should be shown for. If the filter is empty, it means that the object should always be shown. If it contains one or more values, the object should only be shown if the context matches one of them.
 * @example If a `QuestionCategory` has a `constituencyIds` filter with values `['1', '2']`, the category will be shown for `Constituency` 1 and 2 and hidden for all others. If the filter is empty, the category will be shown for all constituencies.
 */
export type FilterValue<TValue> = TValue | Array<TValue>;
