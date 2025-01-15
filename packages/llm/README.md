# `@openvaa/matching`: Matching algorithms for candidates and other entities

The module provides a generic implementation for matching algorithms used in VAAs.

In order to use the algorithms provided, the target entities and questions must fulfil certain requirements defined in the `@openvaa/core` module:

- [`HasAnswers`](/packages/core/src/matching/hasAnswers.type.ts)
- [`MatchableQuestion`](/packages/core/src/matching/matchableQuestion.type.ts)

## Features

- Supports any type of question
  - Sample implementations provided for ordinal questions (including Likert questions of any scale) and categorical questions
  - For custom question implementations, the only requirement is that answers to can be represented as positions in uni- or multidimensional space
- Manhattan, directional and Euclidean distance metrics
- Assign arbitrary weights to questions
- Computing matches for subgroups of questions, such as for specific themes
- Projecting positions to a lower-dimensional space, such as a 2D map, using custom projector

See also [Future developments](#future-developments)

## Dependencies

`@openvaa/core`: Definitions related to matching space distances, matchable questions and entities having answers to these are shared between this and other `vaa` modules.

## Developing

The module uses [`tsc-esm-fix`](https://github.com/antongolub/tsc-esm-fix) which allows us to use suffixless imports in Typescript.

## Quick start

1. Create question objects that implement [`MatchableQuestion`](/packages/core/src/matching/matchableQuestion.type.ts)
2. Create candidate objects and a voter that implement [`HasAnswers`](/packages/core/src/matching/hasAnswers.type.ts). With regard to the matching algorithm, there’s no difference between the voter and candidates
3. Instantiate a [`MatchingAlgorithm`](./src/algorithms/matchingAlgorithm.ts) with suitable options
4. Call the algorithm’s [`match`](./src/algorithms/matchingAlgorithm.ts) method passing as arguments the questions to match for, the voter, the candidates and optional [`MatchingOptions`](./src/algorithms/matchingAlgorithm.type.ts). The algorithm returns an array of [`Match`](./src/match/match.ts) objects for each candidate ordered by ascending distance
   1. The `Match` objects contain a reference to the `entity` they target
   2. You can get submatches for question categories by supplying `questionGroups` in the options. These are objects implementing [`MatchableQuestionGroup`](./src/question/matchableQuestionGroup.ts). The submatches are contained in the [`subMatches`](./src/match/subMatch.ts) array of the [`Match`](./src/match/match.ts) objects
   3. You can weight the questions by supplying `questionWeights` in the options
   4. Only those questions that the voter has answered will be considered in the matching

## Trying it out

See [`examples/example.ts`](./examples/example.ts).

Run with `tsx examples/example.ts`.

## Principles

At first glance, it may well seem that the algorithm module is overly complicated for such a simple task as Manhattan matching. This would be true if we were to limit ourselves to using just that algorithm. However, the purpose of the module is to provide a very flexible framework for implementing different matching algorithms.

To that end, the module is built following these principles:

1. Enable mixing of different kinds of questions
2. Provide flexible methods of dealing with missing values
3. Do not expect answers to questions to be inherently numeric
4. Prefer reliability even at the cost of performance
5. Prefer verbosity if it can help avoid confusion

## Paradigm

The general operational paradigm of the algorithm is to treat the voter and the candidate as positions in a multidimensional space. To compute a match we measure the distance between the two in that space and return a value, which is normalized so that it represents the fraction of the maximum possible distance in that space, i.e. 0–100 %.

The algorithm also supports a more complicated method of matching, in which the positions are projected to a lower-dimensional space before calculating the distance. This method is used often to place the persons into a two or three-dimensional space with axes such as ‘Economical left–right’ and ‘Value conservative–liberal’. In this kind of projection, different weights are given to the dimensions in source space (that is, the questions) in calculating the positions in the target space. In the basic method, on the contrary, all of the questions have equal weights in calculating the distance.

In order to do this, you need to supply a [`MatchingSpaceProjector`](./src/algorithms/matchingSpaceProjector.ts) when instantiating the algorithm.

### Process

The process of computing a match goes roughly as follows. (This is a simplified example that does not use subcategory matching, question weighting or projection into a lower-dimensional space.)

1. [`MatchingAlgorithm.match()`](./src/algorithms/matchingAlgorithm.ts) is called and passed an array of [`MatchableQuestion`](/packages/core/src/matching/matchableQuestion.type.ts)[^1], a `reference` (usually the voter) and a `targets` array (usually the candidates or parties), which we’ll refer to as entities below. All of these must implement the [`HasAnswers`](/packages/core/src/matching/hasAnswers.type.ts) interface. [Options](./src/algorithms/matchingAlgorithm.type.ts) may also be provided.
2. The `reference` is queried for the questions they have answered by calling the [`answers`](/packages/core/src/matching/hasAnswers.type.ts) getter. The questions they have not answered are removed from matching. If no questions remain, an error will be thrown.
3. Before using the actual answers, we create the [`MatchingSpace`](./src/space/matchingSpace.ts) in which we position the entities. Usually this is simply a space with `N` dimensions of equal weight, where `N` is the number of questions.[^2]
4. To place them in the space, we iterate over each entity and over each question.
   - The position is represented by an `N`-length array of numbers ([`Position`](./src/space/position.ts)) with possible subdimensions.
   - We build that get by getting the entity’s answer to each question by querying their [`answers`](/packages/core/src/matching/hasAnswers.type.ts) record with the question [id](/packages/core/src/matching/id.type.ts).
   - The values we have are still of an unknown type, so we pass them to the question’s [`normalizeValue(value: unknown)`](/packages/core/src/matching/matchableQuestion.ts) method, which returns either a [`CoordinateOrMissing`](/packages/core/src/matching/distance.type.ts) (`number` or `undefined`) or an array of these.[^3]
5. Now that the entities are positioned in a normalized space, we can finally calculate the matches, that is, the normalized distances of the `targets` to the `reference`.
6. To do that, we iterate over each `target` and calculate their distance to the `reference` in each dimension of the [`MatchingSpace`](./src/space/matchingSpace.ts), sum these up and normalise.[^4]
   - Recall that some coordinates of the `targets`’ positions may be `undefined`. To calculate distances between these and the `reference`’s respective coordinates, we need to impute a value in place of the missing one.[^5]
7. Finally, we use the distances to create a [`Match`](./src/match/match.ts) object for each of the `targets`, which includes a reference to the `target` entity and the distance. The [`Match`es](./src/match/match.ts) also contain getters for presenting the distance as, e.g., a percentage score.[^6]
8. The [`Match`es](./src/match/match.ts) are returned and may be passed on to UI components. They are ordered by ascending match distance.

## Future developments

1. Distances are now measured using combinatios of [`kernels`](./src/distance/metric.ts) and other helper functions. It seems likely that we could simplify all of these to simple distance measurements in a vector space.
2. Provide an example implementation of a ranked preference question, which involves creating `f(n) / (2 * f(n-2))` subdimensions where `n` is the number of options and `f(•)` the factorial to map each pairwise preference.
3. Implement Manhattan-directional hybrid and Mahalanobis distance metrics.

[^1]: The questions have to implement a [`normalizeValue()`](/packages/core/src/matching/matchableQuestion.type.ts) method, because otherwise we don’t know how to compare the answer values, whose type is unspecified, to each other.

[^2]: Some question types, such as ranked preference questions, create multiple subdimensions with a total weight of 1.

[^3]: [`normalizeValue()`](/packages/core/src/matching/matchableQuestion.ts) returns an array of numbers if the question is one that creates multiple subdimensions, such as a [`CategoricalQuestion`](./src/question/categoricalQuestion.ts)

[^4]: To be precise, it’s the average weighted by the weights of the dimensions, which may differ from 1 in case of questions creating subdimensions.

[^5]: There are several methods to this, which are defined in the constructor options to the [`MatchingAlgorithm`](./src/algorithms/matchingAlgorithm.ts).

[^6]: And in case of subcategory matching, they also contain [`subMatches`](./src/match/subMatch.ts) for each category.
