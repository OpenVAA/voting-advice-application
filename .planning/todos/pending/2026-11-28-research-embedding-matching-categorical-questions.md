---
created: 2026-11-28
title: Research embedding-based matching for categorical and open answers
area: matching
tags: [voter, matching, llm, feat]
keywords: [embeddings, categorical-questions, open-answers, matching-paradigm, research]
source: "GitHub issue #625"
github_issues: [625]
files:
  - packages/matching/
  - packages/llm/
  - packages/data/src/objects/questions/
---

# Research embedding-based matching for categorical and open answers

## Origin

Converted from GitHub issue [#625 Alternative matching paradigm using embedding vectors for categorical multiple-choice questions](https://github.com/openvaa/voting-advice-application/issues/625) on 2026-11-28.

## Problem

Categorical (nominal) multiple-choice questions are matched in `@openvaa/matching` by splitting into subdimensions, which loses nuance; and voters/contestants cannot write their own answer that counts for matching. Epic #625 proposes embedding answers (and optionally free-text answers) with an embedding model and measuring distance in that space or in a learned lower-dimensional 'political' projection (to ignore stylistic features). Open questions: per-question vs combined embedding (the matching engine expects one shared multidimensional space), whether to train the projection from existing open answers + Likert values or from known factor loadings, real-time vs precomputed. A prototype exists at github.com/MemeSlayer27/embeddings_match_concept.

## Solution

TBD — research spike first: evaluate on real data, decide how embedding distances plug into `MatchingSpace`/`MatchingAlgorithm` (e.g. as a custom question type implementing the matching interface), and where embeddings are computed (admin job via `@openvaa/llm`, stored in question/answer custom data).
