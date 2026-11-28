---
created: 2026-11-28
title: Refactor Expander to the disclosure pattern
area: frontend
tags: [voter, contestant, frontend, ui, improvement]
keywords: [expander, disclosure, a11y, aria-expanded, badges, edge-to-edge]
source: "GitHub issue #341"
github_issues: [341]
files:
  - apps/frontend/src/lib/components/expander/Expander.svelte
  - apps/frontend/src/lib/components/expander/Expander.type.ts
  - apps/frontend/src/app.css
---

# Refactor Expander to the disclosure pattern

## Origin

Converted from GitHub issue [#341 Refactor: Expander component](https://github.com/openvaa/voting-advice-application/issues/341) on 2026-11-28.

## Problem

`apps/frontend/src/lib/components/expander/Expander.svelte` is built on DaisyUI `collapse` with an `<input type="checkbox">` labelled by a generic `aria-label` ("expand or collapse"), so screen readers hear a checkbox with a generic name rather than a button named by the title with `aria-expanded`. Per the APG disclosure pattern (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/) the title itself should be the button. Two design gaps too: `title` is a string, so badges shown in designs next to expander titles cannot be added; and edge-to-edge styling is impossible because applying `edgetoedge-x` (app.css) to the title alone is clipped by the container's `overflow-x: hidden`.

## Solution

Render the title as a `<button aria-expanded aria-controls>` (or native <details>/<summary>), remove the aria-label, accept a `title` snippet (keeping a string shorthand), and add an edge-to-edge option applied to container, title and content. Check all variants (read-more, question, category, question-help) and the filter dialog that uses one Expander per filter; run the axe and visual gates.
