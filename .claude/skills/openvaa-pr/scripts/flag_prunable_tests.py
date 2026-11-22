#!/usr/bin/env python3
"""List test files a PR adds or changes that tests/README.md says should not stay, and guards with no hazard note.

Usage: flag_prunable_tests.py [--base origin/main] [--all] [paths...]

Prints one tab-separated `path<TAB>reason` line per flagged file and always exits 0: the output is a list to act on,
not a gate. A file carrying a `// KEEP-GUARD: <the hazard>` comment is never flagged.

Test files here are co-located (`foo.test.ts`, `foo.svelte.test.ts`, `foo.test.svelte.ts`), with E2E specs under
`tests/tests/`. Source guards are the `scripts/assert-*` and `scripts/check-*` scripts behind the root `assert:*` and
`check:*` package scripts: they are not tests, so they are never judged as prunable, but a guard the PR adds or
changes without a `KEEP-GUARD:` note naming its hazard is listed so the author records why it earns its place.
"""
import argparse
import os
import re
import subprocess

TEST_FILE = re.compile(r"\.(test|spec)(\.svelte)?\.[cm]?[jt]sx?$")
GUARD_FILE = re.compile(r"^scripts/(assert|check)-[^/]+\.(mjs|cjs|js|ts|sh)$")
NEVER_PROD = re.compile(
    r"^(vitest|@vitest/|@playwright/test|playwright|node:|fs$|path$|url$|child_process$|@testing-library|typescript$|jsdom|zod$)"
)
VALUE_IMPORT = re.compile(r"^import\s+(?!type\b).*?\s+from\s+['\"]([^'\"]+)['\"]", re.M | re.S)
READS_SOURCE = re.compile(r"readFileSync|readFile\(|readdirSync|globSync|\?raw['\"]")
SOURCE_PATH = re.compile(r"['\"`][^'\"`\n]*\.(tsx?|css|sql|md)['\"`]")
PLAN_TAG = re.compile(r"\bD-\d{2,}\b|\bphase[- ]\d+|\bplan \d+(\.\d+)?-\d{2}\b|\bspike \d{3}\b|\bRED stub\b", re.I)
EXISTENCE_TITLE = re.compile(r"\b(exists|must not exist|re-?exports?)\b", re.I)
TITLE = re.compile(r"^\s*(?:it|test)(?:\.\w+)?\(\s*['\"`](.+?)['\"`]", re.M)
EXECUTES = re.compile(r"\b(render\w*|renderHook|screen|fireEvent|userEvent|createRoot)\(")
NAMES_TEST = re.compile(r"['\"`][^'\"`\n]*\.test\.tsx?['\"`]")


def reasons(source: str) -> list[str]:
    if "KEEP-GUARD:" in source:
        return []
    found = []
    code = "\n".join(line for line in source.splitlines() if not line.lstrip().startswith(("//", "*", "/*")))
    source = code
    imports = [m for m in VALUE_IMPORT.findall(source) if not NEVER_PROD.match(m) and not re.search(r"testUtils|testing/|/fixtures|/helpers/|/support/", m)]
    reads = bool(READS_SOURCE.search(source)) and bool(SOURCE_PATH.search(source))
    if reads and not imports and not EXECUTES.search(source):
        found.append("reads source text and executes no production code")
    if reads and PLAN_TAG.search(source):
        found.append("reads source text and names a planning artefact")
    titles = TITLE.findall(source)
    if titles and sum(bool(EXISTENCE_TITLE.search(t)) for t in titles) * 2 >= len(titles):
        found.append("most cases only assert that something exists or is exported")
    if re.search(r"(existsSync|readFileSync)\(", source) and NAMES_TEST.search(source):
        found.append("reads another test file")
    return found


def changed(base: str) -> list[str]:
    out = subprocess.check_output(
        ["git", "diff", "-z", "--name-only", "--diff-filter=AM", f"{base}...HEAD"], text=True
    )
    return [p for p in out.split("\0") if p]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--all", action="store_true", help="scan every tracked test file")
    parser.add_argument("paths", nargs="*")
    args = parser.parse_args()
    if args.all:
        paths = subprocess.check_output(["git", "ls-files", "-z"], text=True).split("\0")
    else:
        paths = args.paths or changed(args.base)
    for path in paths:
        if not path or not os.path.exists(path):
            continue
        if GUARD_FILE.search(path):
            with open(path, errors="replace") as handle:
                if "KEEP-GUARD:" not in handle.read():
                    print(f"{path}\tguard with no KEEP-GUARD note naming the hazard it forbids")
            continue
        if not TEST_FILE.search(path):
            continue
        with open(path, errors="replace") as handle:
            found = reasons(handle.read())
        if found:
            print(f"{path}\t{'; '.join(found)}")


if __name__ == "__main__":
    main()
