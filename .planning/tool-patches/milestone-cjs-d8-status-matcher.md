# Patch: milestone.cjs mark-complete status matcher (D8)

Ruled 2026-08-29 — see `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D8.

**The patched file is the GLOBAL GSD install, OUTSIDE this repository:**
`~/.claude/gsd-core/bin/lib/milestone.cjs`

`gsd-update` WILL overwrite it. This mirror exists so that overwrite is detectable.
To check whether the patch is still live:

```bash
grep -c 'D8 (OpenVAA v2.15' ~/.claude/gsd-core/bin/lib/milestone.cjs   # 1 = live, 0 = REVERTED
```

sha256 before patch: 2f8e6606d9039c1e9e9d3d6273b829d2756aaeb31194fbbd94d4b23e6d1dc0d2
sha256 after  patch: 4eda91f1a7ee4f382b7d5ee46d1af9460a51ed06915341aa16da8cf517d0f1e2

Flip-tested both halves: accepts bare `Pending`, `Gaps Found`, and dash/paren/colon
annotations (annotation PRESERVED on the written `Complete` cell); rejects `Complete`,
`Blocked`, `Not started`, and the near-miss `Pending review by operator` (a different
status, not an annotation).

## Diff

```diff
--- /Users/kallejarvenpaa/.claude/gsd-core/bin/lib/milestone.cjs.pre-d8.bak	2026-08-29 12:08:23
+++ /Users/kallejarvenpaa/.claude/gsd-core/bin/lib/milestone.cjs	2026-08-29 12:09:10
@@ -185,9 +185,24 @@
             // documented gaps_found response) leaves a row stranded at Gaps Found with
             // no inverse; a genuinely-satisfied requirement must be able to reach
             // Complete again via mark-complete, or the milestone is blocked forever.
-            if (/^(pending|gaps found)$/i.test(current.trim())) {
+            // D8 (OpenVAA v2.15, ruled 2026-08-29): anchor on the LEADING status word
+            // and carry any trailing annotation through. The prior
+            // `/^(pending|gaps found)$/i` tested the trimmed WHOLE cell, so a cell
+            // reading `Pending - measured 2026-08-28 as already satisfied by Phase 144`
+            // did not match: the row EXISTS but rejects the write, the checkbox flip is
+            // rolled back by defect 2 below, and the tool reports `not_found`.
+            // Normalising such a cell to a bare `Pending` instead would DELETE the
+            // annotation carrying the finding, so the annotation is preserved on the
+            // Complete cell. Only a punctuation-introduced annotation is accepted, so
+            // a genuinely different status (`Pending review`) still rejects the write.
+            const statusMatch = /^(pending|gaps found)(\s*(?:[-\u2013\u2014:(].*)?)$/i.exec(current.trim());
+            if (statusMatch) {
                 tableHit = true;
-                return ' Complete ';
+                const annotation = (statusMatch[2] ?? '').trim();
+                if (!annotation)
+                    return ' Complete ';
+                // a `:` binds tight (`Complete: note`); dashes and parens take a space.
+                return annotation.startsWith(':') ? ` Complete${annotation} ` : ` Complete ${annotation} `;
             }
             return current;
         });
```
