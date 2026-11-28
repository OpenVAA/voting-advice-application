---
created: 2026-11-28
title: Add search and select/deselect all to the constituency selector
area: frontend
tags: [voter, contestant, frontend, ui, improvement]
keywords: [constituency-selector, search, select-all, nominations, multi-select, scalability]
files:
  - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
---

# Add search and select/deselect all to the constituency selector

## Origin

Maintainer ruling of 2026-11-28 on `2026-10-11-177-cap-of-ten-counts-an-editors-own-nominations.md`.

## Problem

A party can easily be nominated in every constituency of an election, and there may be hundreds of them. Where the constituency selector lets an entity pick several constituencies (the nomination editor; see `2026-10-11-177-several-constituencies-per-election-for-one-entity.md`), picking them one by one does not scale, and a long list without search is hard to use for voters too.

## Solution

Refactor `ConstituencySelector` (and the multi-select variant `MultiConstituencySelector`) to offer a search/filter field and, in multi-select mode, "select all" / "deselect all" (per election, and over the filtered set). Keep it accessible (combobox/listbox pattern, keyboard). Land together with relaxing the cap of ten unconfirmed nominations.
