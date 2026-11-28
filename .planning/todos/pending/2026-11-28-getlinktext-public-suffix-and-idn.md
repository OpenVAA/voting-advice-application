---
created: 2026-11-28
title: Make getLinkText handle public suffixes and IDNs
area: frontend
tags: [frontend, improvement]
keywords: [links, domain, punycode, public-suffix, link-text]
source: "GitHub issue #727"
github_issues: [727]
files:
  - apps/frontend/src/lib/utils/links.ts
---

# Make getLinkText handle public suffixes and IDNs

## Origin

Converted from GitHub issue [#727 Improve Link Text Extraction for International Domains](https://github.com/openvaa/voting-advice-application/issues/727) on 2026-11-28.

## Problem

`getLinkText(url)` in `apps/frontend/src/lib/utils/links.ts` derives a link label from the URL by splitting the host on dots and taking the second-to-last label. It fails for multi-label public suffixes (`https://sub.domain.co.uk` gives `Co`), shows punycode (`xn--...`) for internationalized domains, and does not normalise a trailing dot.

## Solution

Use a public-suffix-aware parser (e.g. the `tldts` or `psl` package, mind bundle size and the dependency age rule) to get the registrable domain, convert punycode to Unicode (`URL` + `domainToUnicode` or a small library), strip trailing dots, and add unit tests for these cases.
