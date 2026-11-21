---
created: 2026-10-16T00:00:00.000Z
title: Check whether a form control's edge on the shaded page meets the 3:1 contrast a component boundary needs
area: apps/frontend - styling / a11y (manual check)
severity: minor
source: Phase 178 (plan 178-23; item N-8 of 178-UI-SPEC.md, raised and not fixed)
files:
  - apps/frontend/src/app.css
  - packages/app-shared/src/settings/staticSettings.ts
---

## Problem

On the entry screens' shaded page the controls' fill against the page computes to about 1.25:1, and DaisyUI's input border is drawn at 20 % opacity. WCAG 2.1 SC 1.4.11 asks 3:1 for the visual boundary of a control that is identified only by it. axe does not test this, and the login screen had it before this phase. Every field has a visible label, which locates it; whether that is enough is the judgement to make.

## What to do

- Measure, in both themes, the contrast of each control's edge (border, or fill where there is no border) against the shaded page and against the white option blocks of the registration screen: the email and password fields, the code field, the radios.
- Decide with the operator whether to add a stronger boundary token in the theme; it would change every form of the application, not only the entry screens.

## What to look for

- Which of the boundary's parts carries the identification (border, fill, focus ring).
- The focus ring's own contrast, which is a separate requirement (2.4.7) and is not this item.
