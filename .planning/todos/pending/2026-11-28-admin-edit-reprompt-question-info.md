---
created: 2026-11-28
title: Admin UI to edit and reprompt generated question info
area: frontend
tags: [admin, frontend, llm, argument-condensation, question-info, feat]
keywords: [admin-ui, llm-output-editing, prompts, reprompt, question-info]
source: "GitHub issue #675"
github_issues: [675]
files:
  - apps/frontend/src/routes/admin/(protected)/question-info/
  - apps/frontend/src/routes/admin/(protected)/argument-condensation/
  - apps/frontend/src/lib/server/admin/
  - packages/question-info/
  - packages/argument-condensation/
---

# Admin UI to edit and reprompt generated question info

## Origin

Converted from GitHub issue [#675 UI for prompt selection, answer editing and reprompting](https://github.com/openvaa/voting-advice-application/issues/675) on 2026-11-28.

## Problem

Generated LLM content for questions (background info sections, term definitions, condensed pro/con arguments) is stored in question custom data, but admins cannot review or change it in the Admin App. Needed per VAA question: choose which extra information items show in the voter question info UI; customise the prompt per item; edit answers manually (incl. term triggers, localized); reprompt the LLM for a single item. A JSON editor (e.g. svelte-jsoneditor) and CSV/JSON export-import were suggested as a minimum.

## Solution

Add a per-question editor page under the Admin App's question-info route, writing to question `custom_data` through the admin writer; reuse the job runner for single-question regeneration with a prompt override.
