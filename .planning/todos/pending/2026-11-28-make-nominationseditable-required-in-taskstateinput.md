---
created: 2026-11-28
title: Make nominationsEditable required in TaskStateInput
area: frontend
tags: [contestant, frontend, improvement]
keywords: [task-state, nominations-editable, contestant-home, typing]
---

# Make nominationsEditable required in TaskStateInput

## Origin

Split from loose end 4.4 of `2026-10-11-177-small-rulings-and-loose-ends-the-plans-left-open.md` (closed 2026-11-28).

## Problem

`nominationsEditable` is optional in `TaskStateInput` (177-19): when left out it reads as "not editable", which silently hides the nominations task if a caller forgets it.

## Solution

Make the field required and pass it explicitly from every caller (the profile page and the question page among them).
