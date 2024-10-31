# `vaa-core`: Core types and utilities shared by the `vaa` modules

The module contains types and constants that all the `vaa` modules (`vaa-data`, `vaa-filters` and `vaa-matching`) handling abstract logic use and which must be aligned for module interoperation.

It contains:

- Typing for [`Id`s](./src/id) and related utilities
- Typing for JSON [`Serializable`](./src/serializable/serializable.type.ts) objects
- Typing for distances, answers and missing values related to [matching](./src/matching/)

## Developing

The module uses [`tsc-esm-fix`](https://github.com/antongolub/tsc-esm-fix) which allows us to use suffixless imports in Typescript.