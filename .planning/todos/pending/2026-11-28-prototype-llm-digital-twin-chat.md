---
created: 2026-11-28
title: Prototype LLM digital twin chat for parties
area: frontend
tags: [voter, frontend, llm, feat]
keywords: [digital-twin, llm-chat, parties, candidates, research]
source: "GitHub issue #629"
github_issues: [629]
files:
  - packages/llm/
  - apps/frontend/src/lib/server/
  - apps/frontend/src/lib/dynamic-components/entityDetails/
---

# Prototype LLM digital twin chat for parties

## Origin

Converted from GitHub issue [#629 Experimental digital twin of a candidate or party](https://github.com/openvaa/voting-advice-application/issues/629) on 2026-11-28.

## Problem

Epic #629: voters want to ask a candidate or party free-form questions beyond the VAA questions. Data availability varies (incumbents have decision-making records; new candidates little), so it may suit parties only. Answers should cite sources for reliability. A Python demo exists at github.com/maximusvitutus/argument-condensation (digital_twin/party_twin.py).

## Solution

TBD — research/prototype: decide party-only vs candidates, data sources (manifestos, answers, open data), real-time server-side LLM calls via `@openvaa/llm` with rate limiting and cost control, citations, a setting to enable, and UI in entity details.
