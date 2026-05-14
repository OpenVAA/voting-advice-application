---
date: "2026-05-14 20:50"
promoted: false
---

For future e2e cold runs: when I run the dev server with `nohup` in the bg, it always hangs with 5173 not reachable even in the actual Vite process as a child. Under nohup, signal forwarding and child-process inheritance get awkward. Sometimes the parent yarn exits before the child is ready, or the child gets backgrounded weirdly and never finishes binding.

4. Output buffering. `> /tmp/vite-86-run1.log 2>&1` redirects both streams to a file. If anything in the Vite startup pipeline detects non-TTY output and switches to fully-buffered mode (block-buffered, 4KB or 8KB chunks), you won't see startup logs in the file until that buffer fills — which makes it look like the server is hung when it's actually still initializing. A real terminal gets line-buffered output and looks "alive."

**Why a separate terminal works:**
- Real TTY → Vite's interactive code paths work normally
- Full environment from your shell rc files
- Line-buffered output → you see startup progress immediately
- Job stays attached to a real foreground process group

If you ever need backgrounding for automation: prefer tmux/screen (gives a real TTY) over nohup, or use a process manager like pm2. For one-off scripts, the pattern `yarn ... dev &` (no nohup) often works better than `nohup ... &` precisely because it doesn't redirect stdin from `/dev/null` — the dev server inherits your terminal's stdin and behaves like it's interactive even when backgrounded.

For your current flow, running Vite in a separate terminal is honestly the more reliable approach for the Plan 04 cold-start runs — you can watch its startup logs scroll by and confirm it's healthy before kicking off the Playwright run in the first terminal.
