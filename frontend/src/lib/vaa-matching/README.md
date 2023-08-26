# Matching algorithms

## Quick start

See `examples/example.ts`.

Run with `ts-node-esm --experimentalSpecifierResolution node examples/example.ts`.

NB. If you're missing `/frontend/.svelte-kit/tsconfig.json`, you can create it from https://github.com/sveltejs/kit/blob/master/packages/create-svelte/tsconfig.json.

## Steps

1. Create `Question` objects
2. Create `Candidate` objects and a voter passing them `Answer` objects
3. Create a `MatchingAlgorithmBase` object with suitable options
4. Call the algorithm's `match` method with the voter and the candidates
   to get `Match` objects for each candidate. You can supply question
   categories implementing `HasMatchableQuestions` in the `MatchingOptions`
   to get category matches included in the `Match` object's `subMatches`
   array.
