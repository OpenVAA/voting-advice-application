---
created: 2026-11-28
title: Add playlist support and custom captions to Video
area: frontend
tags: [voter, frontend, ui, improvement]
keywords: [video, playlist, captions, subtitles, video-controller, webvtt, a11y, cue-rendering]
source: "GitHub issue #726"
github_issues: [726, 517]
files:
  - apps/frontend/src/lib/components/video/Video.svelte
  - apps/frontend/src/lib/components/video/Video.type.ts
  - apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts
  - packages/app-shared/src/data/customData.type.ts
---

# Add playlist support and custom captions to Video

## Origin

Converted from GitHub issue [#726 refactor: `Video` component](https://github.com/openvaa/voting-advice-application/issues/726) on 2026-11-28.

## Problem

The `Video` component (`apps/frontend/src/lib/components/video/Video.svelte`) plays one video at a time, loaded imperatively through the layout context's `VideoController.load` from each page. Wanted: a playlist (as in an earlier youth-election VAA intro), callbacks that clean themselves up when the page is destroyed and wait for the player to be mounted, playlist-level `onBeforeFirst` / `onAfterLast` callbacks (e.g. to trigger a `goto`) instead of a bare `onEnded`, possibly the playlist position in the URL, and a custom subtitle renderer because native caption styling is inconsistent across browsers.

## Solution

Extend `VideoContent` (app-shared) or add a playlist type; extend `VideoController.load` to accept a playlist and register callbacks scoped to the calling component (`$effect` cleanup); render captions from the parsed VTT cues (the component already parses cues for the transcript and `jump`). Coordinate with the combined rich-content idea.

## From GitHub issue #517 (2026-11-28)

[#517 feat: implement custom captions in the Video component](https://github.com/openvaa/voting-advice-application/issues/517)

**Render Video captions with a custom cue renderer**

`Video.svelte` shows captions through the native `<track>` element. Native caption rendering is inconsistent across browsers (styling, positioning, mobile fullscreen), which hurts the accessibility of the intro videos.

*Approach:* Parse the VTT (via `video.textTracks[0].cues` with mode `hidden`, or a parser such as `webvtt-parser`), bind to `currentTime` and render the active cue in an overlay styled with the app theme; keep the toggle and transcript fallback. Verify with axe and on iOS Safari.
