---
created: 2026-11-28
title: Prompt to switch to the browser's preferred language
area: frontend
tags: [voter, contestant, frontend, ui, translations, feat]
keywords: [preferred-locale, accept-language, language-prompt, paraglide, i18n, locale-switch]
source: "GitHub issue #372"
github_issues: [372]
files:
  - apps/frontend/src/app.d.ts
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/i18n/utils/parseAcceptedLanguages.ts
  - apps/frontend/paraglide.options.ts
  - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
---

# Prompt to switch to the browser's preferred language

## Origin

Converted from GitHub issue [#372 feat: show a prompt if the user's preferred language is available](https://github.com/openvaa/voting-advice-application/issues/372) on 2026-11-28.

## Problem

A visitor arriving on a URL in one locale (for example an unprefixed base-locale link) whose browser prefers another supported locale is never told the app is available in their language. `apps/frontend/src/lib/i18n/utils/parseAcceptedLanguages.ts` parses `Accept-Language` but nothing calls it, and `preferredLocale` in `apps/frontend/src/app.d.ts` (`App.Locals`) is declared and never written. Paraglide resolves the locale by `url`, `cookie`, `baseLocale` only.

## Solution

In `hooks.server.ts` set `locals.preferredLocale` from `parseAcceptedLanguages` matched against the runtime-supported locales (respecting the DynamicSettings `supportedLocales` override), pass it to the layout, and when it differs from the current locale show a dismissible notice linking to `localizeHref(current path + search, { locale })`. Remember the dismissal per visitor. Alternatively remove the dead `preferredLocale`/`parseAcceptedLanguages` if the prompt is not wanted.
