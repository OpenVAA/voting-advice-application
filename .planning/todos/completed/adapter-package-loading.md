---
title: TSConfig-based importable package-based adapter loading
priority: medium
source: Phase 34 discussion (2026-03-22)
tags: [frontend, tooling, improvement]
keywords: [adapters, data-provider, package-loading, tsconfig, architecture]
resolved: 2026-11-28
resolution: duplicate of 2026-09-27-adapter-selection-entrypoints.md
---

Replace the current dynamic adapter switch with a tsconfig-based, importable, package-based adapter loading pattern. Each adapter (Supabase, future adapters) should be its own package that can be selected via tsconfig path mapping or package imports rather than runtime config switching.
