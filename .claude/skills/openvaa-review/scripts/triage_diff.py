#!/usr/bin/env python3
"""Split a PR diff into what a human reviewer must read and what is noise, and measure its effective size.

Usage:
  triage_diff.py --base <ref> --head <ref> --out <run-dir> [--expect-files <file>] [--agent-infra-reviewable]

Writes into <run-dir>:
  manifest.json      every changed file with its class, noise flag, line counts and lens hints
  review.diff        whitespace-insensitive diff of the files a human should read
  tests.diff         diff of the test files and the E2E harness (read by the tests lens)
  translations.diff  diff of the non-English message catalogues (read by the i18n lens only, for key-set completeness)
  size.json          effective added/removed lines per file, per class and in total (the conciseness lens)
  summary.txt        human-readable counts, printed to stdout as well

--expect-files takes the authoritative file list (`gh api --paginate repos/$REPO/pulls/$N/files -q '.[].filename'`).
When the local file set disagrees with it the script exits 3 rather than review the wrong diff. GitHub's files API
returns at most 3000 files, so a list of exactly 3000 is treated as truncated: the script warns and only checks that
every listed file is in the local diff.

--agent-infra-reviewable turns `.claude/**`, `.agents/**` and `CLAUDE.md` from noise into reviewable files, for a PR
whose subject is the agent infrastructure itself.

Code under tests/ that is not a spec or unit test (the Playwright runner, fixtures, setup, utils, scripts) is class
`test-infra`: reviewable and counted, and it is in both review.diff and tests.diff.

Effective lines exclude tests, noise, content (catalogues, Markdown, docs-site pages, seed-template data, images,
JSON fixtures) and every blank or comment-only line; see size_count.py for the per-language rules.
"""
import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from size_count import count_diff  # noqa: E402

FILES_API_CAP = 3000
NON_EN_LOCALES = ("da", "et", "fi", "fr", "lb", "sv")

AGENT_INFRA = ("agent-infra", [".claude/*", ".agents/*", "CLAUDE.md", "*/CLAUDE.md"])

# Order matters: first match wins.
NOISE_CLASSES = [
    ("planning", [".planning/*", "*/.planning/*"]),
    AGENT_INFRA,
    ("lockfile", ["yarn.lock", "*/yarn.lock", "package-lock.json", "*/package-lock.json"]),
    ("generated", [
        "packages/supabase-types/src/*", "apps/frontend/src/lib/paraglide/*",
        "*.snap", "*/__snapshots__/*", "*.generated.*",
    ]),
    ("run-artifact", ["tests/e2e-runs/*", "tests/playwright-*/*", "*/playwright-report/*", "*/test-results/*"]),
    ("translation-non-en", [f"apps/frontend/messages/{loc}/*" for loc in NON_EN_LOCALES]),
    ("test", [
        "*.test.ts", "*.test.js", "*.spec.ts", "*.spec.js", "*.test.svelte.ts", "*.svelte.test.ts",
        "tests/*", "apps/supabase/supabase/tests/*", "packages/*/tests/*", "*/__tests__/*",
    ]),
]

SIGNAL_CLASSES = [
    ("translation-en", ["apps/frontend/messages/en/*"]),
    ("migration", ["apps/supabase/supabase/migrations/*"]),
    ("schema", ["apps/supabase/supabase/schema/*"]),
    ("edge-function", ["apps/supabase/supabase/functions/*"]),
    ("dependency-manifest", ["package.json", "*/package.json", "apps/supabase/supabase/functions/deno.json"]),
    ("docs-site", ["apps/docs/src/routes/*"]),
    ("seed-template", ["packages/dev-seed/src/templates/*"]),
    ("docs", ["*.md", "*.mdx"]),
]

# The E2E harness under tests/ (runner, fixtures, setup, utils, scripts) is code that ships with the suite and is
# reviewed as code. Only the spec and unit-test files under it are test noise.
TEST_INFRA = ("test-infra", ["tests/*"])
TEST_FILES = ["*.test.*", "*.spec.*", "*/__screenshots__/*", "*/__snapshots__/*"]

# Content classes: reviewable, but not code, so not counted as effective lines.
CONTENT_CLASSES = {"translation-en", "translation-non-en", "docs-site", "docs", "seed-template"}
CONTENT_PATTERNS = ["*.md", "*.mdx", "*.svg", "*.png", "*.jpg", "*.jpeg", "*.webp", "*.gif", "*.ico",
                    "*.woff", "*.woff2", "*/fixtures/*.json", "*.fixtures.json"]

FRONTEND = "apps/frontend/src"
SOURCE = ["*.ts", "*.js", "*.mjs", "*.cjs", "*.svelte", "*.sql", "*.css", "*.sh", "*.py"]

# Path hints only: the cartographer confirms applicability against the diff.
LENS_HINTS = {
    "behaviour": [f"{FRONTEND}/routes/*", f"{FRONTEND}/lib/contexts/*", f"{FRONTEND}/lib/dynamic-components/*",
                  f"{FRONTEND}/lib/contestant/*", f"{FRONTEND}/lib/admin/*", f"{FRONTEND}/lib/api/*"],
    "analytics": [f"{FRONTEND}/lib/analytics/*", f"{FRONTEND}/lib/contexts/app/tracking/*", f"{FRONTEND}/routes/api/usage/*"],
    "cross-cutting": [f"{FRONTEND}/hooks.server.ts", f"{FRONTEND}/lib/routes/*", f"{FRONTEND}/lib/admin/gates/*",
                      f"{FRONTEND}/lib/auth/*", "apps/supabase/supabase/migrations/*", "apps/supabase/supabase/functions/*",
                      "packages/app-shared/src/settings/*"],
    "data-structure-rot": ["*.type.ts", "*/types/*", "packages/app-shared/src/settings/*", "packages/data/src/*",
                           "apps/supabase/supabase/migrations/*", "packages/dev-seed/src/*"],
    "nomenclature": SOURCE,
    "complexity-reuse": SOURCE,
    "domain-packages": ["packages/core/*", "packages/data/*", "packages/matching/*", "packages/filters/*",
                        "packages/app-shared/*", f"{FRONTEND}/lib/utils/*"],
    "conciseness": SOURCE,
    "database": ["apps/supabase/supabase/migrations/*", "apps/supabase/supabase/schema/*", "apps/supabase/supabase/tests/*", "apps/supabase/supabase/*.sql",
                 "apps/supabase/scripts/*", "packages/supabase-types/*", f"{FRONTEND}/lib/api/adapters/supabase/*"],
    "server": ["apps/supabase/supabase/functions/*", f"{FRONTEND}/routes/api/*", f"{FRONTEND}/hooks.server.ts",
               f"{FRONTEND}/lib/server/*", f"{FRONTEND}/routes/*+server.ts", f"{FRONTEND}/routes/*+page.server.ts",
               f"{FRONTEND}/routes/*+layout.server.ts"],
    "routes": [f"{FRONTEND}/routes/*", f"{FRONTEND}/lib/routes/*", f"{FRONTEND}/lib/layouts/*",
               f"{FRONTEND}/lib/utils/viewTransition.ts"],
    "components": ["*.svelte", f"{FRONTEND}/lib/components/*", f"{FRONTEND}/lib/dynamic-components/*",
                   f"{FRONTEND}/lib/contestant/components/*", f"{FRONTEND}/lib/admin/components/*", f"{FRONTEND}/lib/contexts/*"],
    "design": ["*.svelte", "*.css", "*.pcss", "*/tailwind.config.*", "packages/app-shared/src/settings/staticSettings.ts"],
    "accessibility": ["*.svelte", f"{FRONTEND}/lib/utils/aria/*", f"{FRONTEND}/lib/utils/focusNavigationTarget.ts"],
    "i18n": ["apps/frontend/messages/*", f"{FRONTEND}/lib/i18n/*", "apps/frontend/project.inlang/*"],
    "docs-comments": ["apps/docs/*", "*.md"],
    "dependencies": ["package.json", "*/package.json", "apps/supabase/supabase/functions/deno.json"],
}


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def match(path, patterns):
    return any(fnmatch.fnmatch(path, p) for p in patterns)


def classify(path, agent_infra_reviewable):
    for name, pats in SIGNAL_CLASSES[:1]:  # the English catalogue sits under the same tree as the noise locales
        if match(path, pats):
            return name, False
    for name, pats in NOISE_CLASSES:
        if name == "test" and match(path, TEST_INFRA[1]) and match(path, SOURCE) and not match(path, TEST_FILES):
            return TEST_INFRA[0], False
        if match(path, pats):
            if name == AGENT_INFRA[0] and agent_infra_reviewable:
                return name, False
            return name, True
    for name, pats in SIGNAL_CLASSES[1:]:
        if match(path, pats):
            return name, False
    return "source", False


def numstat(base, head, extra=()):
    out = {}
    for line in git("diff", "--numstat", "-M", *extra, f"{base}..{head}").splitlines():
        a, d, path = line.split("\t", 2)
        if " => " in path:  # rename: keep the new path
            path = re.sub(r"\{([^{}]*) => ([^{}]*)\}", r"\2", path)
            path = path.split(" => ")[-1].replace("//", "/")
        out[path] = (0 if a == "-" else int(a), 0 if d == "-" else int(d))
    return out


def check_expected(expected_path, local):
    with open(expected_path) as fh:
        expected = {l.strip() for l in fh if l.strip()}
    if len(expected) >= FILES_API_CAP:
        print(f"WARNING: the expected list has {len(expected)} files, GitHub's files-API cap; treating it as truncated "
              "and checking only that every listed file is in the local diff.", file=sys.stderr)
        missing = expected - local
        if missing:
            print(f"FILE SET MISMATCH: listed but not local: {sorted(missing)[:15]}", file=sys.stderr)
            sys.exit(3)
        return
    if expected != local:
        print("FILE SET MISMATCH between local git and the expected list (stale merge base, or a failed gh call?).", file=sys.stderr)
        print(f"  only local:    {sorted(local - expected)[:15]}", file=sys.stderr)
        print(f"  only expected: {sorted(expected - local)[:15]}", file=sys.stderr)
        sys.exit(3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--head", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--expect-files")
    ap.add_argument("--agent-infra-reviewable", action="store_true")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    raw = numstat(args.base, args.head)
    ws = numstat(args.base, args.head, ("-w", "--ignore-blank-lines"))
    status = {}
    for line in git("diff", "--name-status", "-M", f"{args.base}..{args.head}").splitlines():
        parts = line.split("\t")
        status[parts[-1]] = parts[0][0]

    if args.expect_files:
        check_expected(args.expect_files, set(raw))

    files = []
    for path, (add, dele) in sorted(raw.items()):
        cls, noise = classify(path, args.agent_infra_reviewable)
        wadd, wdel = ws.get(path, (0, 0))
        if (add + dele) > 0 and (wadd + wdel) == 0 and not noise:
            cls, noise = "formatting-only", True
        if status.get(path) == "R" and add + dele == 0:
            cls, noise = "pure-rename", True
        if cls == "translation-non-en":
            lenses = ["i18n"]
        elif cls == "test":
            lenses = ["tests"]
        elif noise:
            lenses = []
        else:
            lenses = sorted({l for l, pats in LENS_HINTS.items() if match(path, pats)}
                            | ({"tests"} if cls == TEST_INFRA[0] else set()))
        files.append({
            "path": path, "status": status.get(path, "M"), "class": cls, "noise": noise,
            "added": add, "deleted": dele, "added_ignoring_ws": wadd, "deleted_ignoring_ws": wdel,
            "lens_hints": lenses,
        })

    review = [f["path"] for f in files if not f["noise"]]
    tests = [f["path"] for f in files if f["class"] in ("test", TEST_INFRA[0])]  # the tests lens reads the harness too
    translations = [f["path"] for f in files if f["class"] == "translation-non-en"]
    for name, paths, extra in (("review.diff", review, ("-w", "--ignore-blank-lines", "-U5")),
                               ("tests.diff", tests, ("-U3",)), ("translations.diff", translations, ("-U0",))):
        with open(os.path.join(args.out, name), "w") as fh:
            if paths:
                fh.write(git("diff", "-M", *extra, f"{args.base}..{args.head}", "--", *paths))

    # Effective size: reviewable code only.
    sized = [f for f in files if not f["noise"] and f["class"] not in CONTENT_CLASSES and not match(f["path"], CONTENT_PATTERNS)]
    counts = count_diff(git("diff", "-M", "-U0", f"{args.base}..{args.head}", "--", *[f["path"] for f in sized])) if sized else {}
    size_files, size_by_class = [], {}
    total_add = total_del = 0
    for f in sized:
        a, d = counts.get(f["path"], (0, 0))
        f["effective_added"], f["effective_deleted"] = a, d
        size_files.append({"path": f["path"], "class": f["class"], "added": a, "deleted": d})
        c = size_by_class.setdefault(f["class"], {"files": 0, "added": 0, "deleted": 0})
        c["files"] += 1
        c["added"] += a
        c["deleted"] += d
        total_add += a
        total_del += d
    size = {"base": args.base, "head": args.head,
            "total": {"files": len(sized), "added": total_add, "deleted": total_del, "net": total_add - total_del},
            "by_class": size_by_class, "files": sorted(size_files, key=lambda x: -(x["added"] + x["deleted"]))}
    with open(os.path.join(args.out, "size.json"), "w") as fh:
        json.dump(size, fh, indent=2)

    by_class = {}
    for f in files:
        c = by_class.setdefault(f["class"], {"files": 0, "added": 0, "deleted": 0, "noise": f["noise"]})
        c["files"] += 1
        c["added"] += f["added"]
        c["deleted"] += f["deleted"]
    hinted = sorted({l for f in files for l in f["lens_hints"]})
    manifest = {"base": args.base, "head": args.head, "by_class": by_class, "lens_hints": hinted, "files": files}
    with open(os.path.join(args.out, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    lines = [f"{len(files)} files changed; {len(review)} to review by a human."]
    for cls, c in sorted(by_class.items(), key=lambda kv: -kv[1]["files"]):
        lines.append(f"  {cls:<20} {c['files']:>4} files  +{c['added']}/-{c['deleted']}  ({'noise' if c['noise'] else 'review'})")
    lines.append(f"Effective code lines (no tests, comments, blanks or content): +{total_add}/-{total_del} "
                 f"(net {total_add - total_del:+d}) across {len(sized)} files")
    lines.append(f"Lens hints: {', '.join(hinted) or 'none'}")
    text = "\n".join(lines)
    with open(os.path.join(args.out, "summary.txt"), "w") as fh:
        fh.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
