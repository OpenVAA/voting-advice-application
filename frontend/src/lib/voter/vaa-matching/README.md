# Matching algorithms (`vaa-matching`)

## Quick start

1. Create question objects that implement `MatchableQuestion`
2. Create candidate objects and a voter passing that implement `HasMatchableAnswers`. With regard to the matching algorithm, there's no difference between the voter and candidates
3. Instantiate a `MatchingAlgorithm` object with suitable options
4. Call the algorithm's `match` method passing as arguments the voter and the candidates as well as optional `MatchingOptions`. The algorithm returns an array of `Match` objects for each candidate.
   1. You can get submatches for question categories by supplying `questionGroups` in the options. These are objects implementing `MatchableQuestionGroup`. The submatches are contained in the `subMatches` array of the `Match` objects.

## Trying it out

See `examples/example.ts`.

Run with `ts-node-esm --experimentalSpecifierResolution node examples/example.ts`.

## Principles

At first glance, it may well seem that the algorithm module is overly complicated for such a simple task as Manhattan matching. This would be true if we were to limit ourselves to using just that algorithm. However, the purpose of the module is to provide a very flexible framework for implementing different matching algorithms.

To that end, the module is built following these principles:

1. Enable mixing of different kinds of questions
2. Provide flexible methods of dealing with missing values
3. Do not expect question values to fall into a specific numeric range by default
4. Prefer reliability even at the cost of performance
5. Prefer verbosity if it can help avoid confusion

## Paradigm

The general operational paradigm of the algorithm is to treat the voter and the candidate as positions in a multidimensional space. To compute a match we measure the distance between the two in that space and return a value, which is normalized so that it represents the fraction of the maximum possible distance in that space, i.e. 0–100 %.

The algorithm also supports a more complicated method of matching, in which the positions are project to a lower-dimensional space before calculating the distance. This method is used often to place the persons into a two or three-dimensional space with axes such as 'Economical left–right' and 'Value conservative–liberal'. In this kind of projection, different weights are given to the dimensions in source space (that is, the questions) in calculating the positions in the target space. In the basic method, on the contrary, all of the questions have equal weights in calculating the distance.

### Process

The process of computing a match goes roughly as follows. (This is a simplified example that does not use subcategory matching or projection into a lower-dimensional space.)

1. `MatchingAlgorithn.match()` is called and passed a `Voter` and an array of `Candidates`, which we'll refer to as `Entities` below. Both of these must implement the `HasMatchableAnswers` interface.
2. The `Voter` is queried for the questions they have answered by calling the getter `Voter.matchableAnswers`.
3. The resulting `MatchableAnswer` objects contain both a `MatchableQuestion` and its value.[^1]
4. Before using the actual answers, we create the `MatchingSpace` in which we position the `Entities`. Usually this is simply a space with `N` dimensions of equal weight, where `N` is the number of `MatchableAnswers` we got from the `Voter`.[^2]
5. To place them in the space, we iterate over each `Entity` and over each `MatchableQuestion` we got in the `Voter`'s answers.
   - The position is represented by an `N`-length array of numbers (`MatchingSpacePosition`).
   - We build that get by getting the `Entity`'s answer to each question: the `Voter`'s answers we already have, but in case of `Candidates` we call their `getAnswer()` method, passing the question.
   - The values we have are still of an unknown type, so we pass them to the question's `normalizeValue()` method, which returns either a `MatchingSpaceCoordinate` (`number` in range 0–1 or `undefined`).[^3]
6. Now that the `Entities` are positioned in a normalized space, we can finally calculate the matches, that is, the normalized distances of the `Candidates` to the `Voter`.
7. To do that, we iterate over each `Entity` and calculate their distance to the `Voter` in each dimension of the `MatchingSpace`, sum these up and take their average.[^4]
   - Recall that some coordinates of the `Candidates`' positions may be `undefined`.[^5] To calculate distances between these and the `Voter`'s respective coordinates, we need to impute a value in place of the missing one.[^6]
8. Finally, we use the distances to create a `Match` object for each of the `Candidates`, which includes a reference to the `Candidate` and the distance. The `Matches` also contain getters for presenting the distance as a percentage score etc.[^7]
9. The `Matches` are returned and may be passed on to UI components.



[^1]: The reason why the answers contain the questions is that otherwise we don't know how to compare the answer values, whose type is unspecified, to each other (see `normalizeValue()` in the process).
[^2]: Some question types, such as ranked preference questions, create multiple subdimensions with a total weight of 1.
[^3]: Actually, `normalizeValue()` can also return an array of numbers if the question is such that creates multiple subdimensions.
[^4]: To be precise, it's the average weighted by the weights of the dimensions, which may differ from 1 in case of questions creating subdimensions.
[^5]: The `Voter`'s coordinates cannot be `undefined`.
[^6]: There are several methods to this, which are defined in the constructor options to the `MatchingAlgorithm`.
[^7]: And in case of subcategory matching, they also contain `subMatches` for each category.