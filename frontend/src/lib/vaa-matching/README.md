# Matching algorithms

## Quick start

See `examples/example.ts`.

Run with `ts-node-esm --experimentalSpecifierResolution node examples/example.ts`.

## Steps

1. Create `Question` objects
2. Create `Candidate` objects and a voter passing them `Answer` objects
3. Create a `MatchingAlgorithmBase` object with suitable options
4. Call the algorithm's `match` method with the voter and the candidates
   to get `Match` objects for each candidate
