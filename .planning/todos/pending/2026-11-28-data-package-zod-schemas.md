---
created: 2026-11-28
title: Define @openvaa/data input types with zod schemas
area: data
tags: [data, improvement]
keywords: [zod, validation, data-types, coercion, schemas]
source: "GitHub issue #858"
github_issues: [858]
files:
  - packages/data/src/core/dataObject.type.ts
  - packages/data/src/root/dataRoot.ts
  - packages/data/src/objects/
  - packages/data/package.json
---

# Define @openvaa/data input types with zod schemas

## Origin

Converted from GitHub issue [#858 refactor[data]: define types with `zod`](https://github.com/openvaa/voting-advice-application/issues/858) on 2026-11-28.

## Problem

`@openvaa/data` describes its input data (`*.type.ts` interfaces such as `DataObjectData`, entity, question and nomination data) only as TypeScript types. Data arriving from the backend or local files is not validated at runtime, and mismatched literal types (e.g. `1` for `true`) are not coerced, so bad data surfaces as confusing UI errors.

## Solution

Define zod schemas for the provided data and infer the TS types from them (`z.infer`), validate/coerce in `DataRoot.provide*` (or optionally in the data provider), and report errors with object ids. Weigh bundle-size and performance impact for large datasets; keep the package's dependency footprint small. Related: 2026-09-24-data-model-vs-db-nomination-constraints.md.
