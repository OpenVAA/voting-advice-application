#!/usr/bin/env python3
"""Assemble the PR review comment(s) from a run dir.

Usage: compose_comment.py --run <dir> --pr N --repo OWNER/REPO --base <branch> --mb <sha> --head <sha> [--drop ID,ID] [--xref ID=LENS ...] [--verbose]
       compose_comment.py --run <dir> --plan --branch <branch> --head <sha> [--pr N]
       either form with --local: the review is a file committed to the branch, not a PR comment

Reads map.md, manifest.json, lens-<lens>.md/json, verify-<lens>.json and merge-plan.json (if present).
Verifier verdicts apply: REFUTED dropped, severity / revised_title / revised_detail / revised_suggestion honoured, and a DOWNGRADED
finding without a revised_detail gets the verifier's reason appended. merge-plan.json's "drop" and "xref"
fold cross-lens duplicates; --drop / --xref do the same by hand.

Lens sections drop their **Affected** list, except Common patterns (the pattern and its outliers) and Conciseness (the size table); --verbose keeps every list.

Findings render under `### Findings`, grouped by severity, each with its detail in a <details> block and a
checkbox list of fix options (the recommended one first, then any alternatives, then Discuss / Don't fix).
`/openvaa-review fix` reads those ticks back with parse_decisions.py, so the option labels are a contract:
keep "Discuss" and "Don't fix" exact.

Writes comment.md. If the whole review exceeds BUDGET (about a third of GitHub's comment limit, because checkboxes
toggle unreliably in long comments), comment.md holds the header and the feedback checklist, followed by as many
findings and lens sections as fit; the rest go to comment-2.md, comment-3.md, ... Each continuation starts with the
`openvaa-review:v1-cont` marker. Every part, the first included, stays within BUDGET. The hidden data block counts
towards it: it rides in the first part when it fits there, and otherwise gets a final part of its own, which holds no
checkboxes. parse_decisions.py and harvest.py read it from whichever part carries it.

A review-stack slice (a stack.json in the run dir: {"k", "n", "source_branch"}) gets its position and source branch
in the header.

With --plan the review is of plan documents, not a diff: the header comes from plans.json instead of manifest.json,
the marker is `openvaa-plan-review:v1` so a plan review and a code review on the same PR never overwrite each other,
and the reviewer-feedback block is left out because the learning loop does not harvest plan reviews.

With --local, or with --plan and no --pr, the output is a file committed to the branch. A file has no size limit, so
nothing is split, and it carries no reviewer-feedback block because the learning loop reads PR comments only. A
code review needs --branch in place of --pr when the branch has no PR.
"""
import argparse, glob, hashlib, html, json, os, re, sys

ORDER = [("plan", "Plan soundness"), ("behaviour", "Behaviour"), ("analytics", "Analytics"),
         ("cross-cutting", "Cross-cutting interactions"), ("common-patterns", "Common patterns"),
         ("data-structure-rot", "Incremental changes & data-structure rot"), ("nomenclature", "Nomenclature"),
         ("complexity-reuse", "Complexity & reuse"), ("domain-packages", "Domain packages"), ("conciseness", "Conciseness"),
         ("database", "Database"), ("server", "Server & Edge Functions"), ("routes", "Routes"),
         ("components", "Components"), ("design", "Design"), ("accessibility", "Accessibility"), ("i18n", "Localization"),
         ("tests", "Tests"), ("docs-comments", "Docs & comments"), ("dependencies", "Dependencies")]
KEEP_AFFECTED = {"common-patterns", "conciseness"}  # their list is the substance: the pattern and its outliers, the size table
SEV_RANK = {"blocking": 0, "should-fix": 1, "consider": 2}
SEV_TITLE = {"blocking": "Blocking", "should-fix": "Should-fix", "consider": "Consider"}
LIMIT = 65536
BUDGET = 20000  # well under LIMIT: GitHub task-list checkboxes stop toggling reliably in long comments
CONT_OVERHEAD = 200  # a continuation's marker and "part i of n" heading


def load(path, default=None):
    if not os.path.exists(path): return default
    with open(path) as fh:
        return json.load(fh) if path.endswith(".json") else fh.read()


def section(md, name):
    m = re.search(rf"^## {name}\s*\n(.*?)(?=^## |\Z)", md, re.S | re.M)
    return m.group(1).strip() if m else ""


def strip_affected(md):
    """Drop the **Affected** block: from its label line to the next heading or the end of the lens body."""
    return re.sub(r"^[ \t]*(?:#+[ \t]*)?\*\*Affected\*\*.*?(?=^#|\Z)", "", md, flags=re.S | re.M).strip()


# HTML that agent-written markdown may legitimately carry. Anything else in angle brackets is prose (a `<title>` placeholder, a JSX name) that GitHub would swallow as an unknown tag.
HTML_TAGS = "details|summary|sub|sup|br|hr|kbd|code|pre|em|strong|b|i|del|ins|p|ul|ol|li|table|thead|tbody|tr|th|td|img"
KEEP_RE = re.compile(
    r"^(?P<fence>`{3,}|~{3,})[^\n]*\n.*?^(?P=fence)[ \t]*$"         # fenced code block
    r"|(?<!`)(?P<tick>`+)(?!`)(?:[^\n]|\n(?!\s*\n))+?(?<!`)(?P=tick)(?!`)"  # inline code span
    r"|<!--.*?-->"                                                    # HTML comment
    r"|<https?://[^\s<>]+>"                                           # autolink
    r"|<a\s[^<>]*href=[^<>]*>|</a>"                                   # a real link
    rf"|</?(?:{HTML_TAGS})(?:\s[^<>]*)?/?>",                          # a real tag
    re.S | re.M)
QUOTE_RE = re.compile(r"^[ \t]*(?:>[ \t]?)+")


def escape_angles(md):
    """Escape `<` and `>` in markdown wherever they are neither code, real HTML, nor a blockquote marker."""
    def esc(text, at_line_start):
        lines = text.split("\n")
        for i, line in enumerate(lines):
            quote = QUOTE_RE.match(line) if (i or at_line_start) else None
            head, rest = (quote.group(0), line[quote.end():]) if quote else ("", line)
            lines[i] = head + rest.replace("<", "&lt;").replace(">", "&gt;")
        return "\n".join(lines)

    out, pos = [], 0
    for m in KEEP_RE.finditer(md or ""):
        out += [esc(md[pos:m.start()], pos == 0 or md[pos - 1] == "\n"), m.group(0)]
        pos = m.end()
    out.append(esc((md or "")[pos:], pos == 0 or md[pos - 1] == "\n"))
    return "".join(out)


def slice_summary(body):
    """The reading-guide line for one map slice: its description, never its file list or reading order.

    A description that ends in a colon introduces a list; the list's items are folded into the line, so the bullet
    never ends mid-sentence."""
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    if not lines: return ""
    first = lines[0].strip(" -—")
    if first.endswith(":"):
        items = []
        for l in lines[1:]:
            if not l.startswith(("- ", "* ")) or re.match(r"[-*] \*{0,2}(Files|Reading order)\b", l, re.I): break
            item = l[2:].strip().rstrip(".;,")
            if len(item) > 1 and item[0].isupper() and item[1].islower(): item = item[0].lower() + item[1:]
            items.append(item)
        first = f"{first} {'; '.join(items)}." if items else first.rstrip(":") + "."
    return first


def stack_line(run):
    st = load(f"{run}/stack.json") or {}
    k, n = st.get("k"), st.get("n")
    if not (k and n): return None
    src = st.get("source_branch") or st.get("source")
    return (f"**Stack slice:** {int(k):02d} of {int(n):02d}" + (f", cut from `{src}`" if src else "")
            + ". The diff is a path partition of that branch: files outside it are in other slices, not missing.")


def plain_id(x):
    return x.split(":")[-1]


def inline_html(text):
    """Markdown inline spans to HTML. <details> bodies are HTML, so markdown inside them would render literally."""
    out = html.escape(text, quote=False)
    out = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', out)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?!\w)", r"<em>\1</em>", out)
    return out


def block_html(text):
    """Markdown blocks (paragraphs and simple bullet lists) to HTML."""
    parts = []
    for block in re.split(r"\n\s*\n", (text or "").strip()):
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        run = []  # consecutive non-bullet lines, flushed as one paragraph
        items = []
        for line in lines + [None]:
            bullet = line is not None and line.startswith(("- ", "* "))
            if bullet:
                if run: parts.append(f"<p>{inline_html(' '.join(run))}</p>"); run = []
                items.append(line[2:])
                continue
            if items: parts.append("<ul>" + "".join(f"<li>{inline_html(i)}</li>" for i in items) + "</ul>"); items = []
            if line is not None: run.append(line)
        if run: parts.append(f"<p>{inline_html(' '.join(run))}</p>")
    return "\n".join(parts)


def evidence_html(refs):
    """Numbered links for permalinks; a `path#Lx-Ly` reference on an unpushed branch has no URL and shows as text."""
    return " · ".join(f'<a href="{html.escape(u, quote=True)}">{i + 1}</a>' if u.startswith("http")
                      else f"<code>{html.escape(u, quote=False)}</code>" for i, u in enumerate(refs))


# "(a) … (b) …" or "Two routes" inside one suggestion: several fixes collapsed into one checkbox.
BUNDLED_ROUTES = re.compile(r"\(a\).*\(b\)|\b(two|three) (routes|options|approaches)\b", re.I | re.S)


def fix_options(f):
    """Escaped here, so the text that is rendered is the text that is fingerprinted and that parse_decisions.py reads back."""
    return [escape_angles(o) for o in [f"{f['suggestion']} *(Recommended)*"] + [str(x) for x in (f.get("alternatives") or [])]]


def option_fingerprint(text):
    """Must match parse_decisions.py: lets fix mode tell a generated option from one the reviewer edited or added."""
    return hashlib.sha256(" ".join(text.split()).encode()).hexdigest()[:8]


def finding_block(f):
    """One finding: heading, collapsed detail, then the fix options as checkboxes."""
    out = [f"##### <sub>{f['id']} · *{f['severity']}* · `{f.get('criterion', '')}`</sub>", "",
           "<details>", f"<summary>{inline_html(f['title'])}</summary>", block_html(f.get("detail", ""))]
    ev = evidence_html(f.get("evidence") or [])
    if ev: out.append(f"<p>Evidence: {ev}</p>")
    if f.get("existing"): out.append(f"<p>Existing: <code>{html.escape(str(f['existing']), quote=False)}</code></p>")
    if f.get("checklist_rule"): out.append(f"<p>Covered by the code review checklist (<code>.agents/code-review-checklist.md</code>): {html.escape(str(f['checklist_rule']))}</p>")
    out += ["</details>", "", "—", ""]
    # Continuation lines are indented so a multi-line option (a lead sentence and its list) nests under its checkbox.
    out += ["- [ ] " + "\n".join(("  " + l) if j and l.strip() else l for j, l in enumerate(o.splitlines()))
            for o in fix_options(f)] + ["- [ ] Discuss", "- [ ] Don't fix"]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--head", required=True)
    for a in ("--pr", "--repo", "--base", "--mb", "--branch"): ap.add_argument(a, default="")
    ap.add_argument("--plan", action="store_true", help="review of plan documents: header from plans.json, plan marker")
    ap.add_argument("--local", action="store_true", help="the review is a committed file, even when the branch has a PR")
    ap.add_argument("--drop", default="")
    ap.add_argument("--xref", action="append", default=[])
    ap.add_argument("--verbose", action="store_true")
    a = ap.parse_args()
    if a.plan and not a.branch: ap.error("--plan needs --branch")
    if not a.plan and not all((a.repo, a.base, a.mb)): ap.error("--repo, --base and --mb are required without --plan")
    if not a.plan and not a.pr and not (a.local and a.branch): ap.error("--pr is required, or --local with --branch")
    as_file = a.local or not a.pr
    target = a.pr or a.branch
    run = a.run
    mark = "openvaa-plan-review:v1" if a.plan else "openvaa-review:v1"
    budget = 10 ** 9 if as_file else BUDGET  # a committed review file is not subject to the comment limit
    plan = load(f"{run}/merge-plan.json", {}) or {}
    drop = {x for x in a.drop.split(",") if x} | {plain_id(x) for x in plan.get("drop", [])}
    xref = {}
    for x in a.xref:
        fid, lens = x.split("=", 1); xref.setdefault(lens, []).append(fid)
    for fid, lost in (plan.get("xref") or {}).items():
        for lens in lost: xref.setdefault(lens, []).append(plain_id(fid))

    mp = escape_angles(load(f"{run}/map.md", ""))
    files = (load(f"{run}/manifest.json", {"files": []}) or {"files": []})["files"]
    rev = [f for f in files if not f["noise"]]
    add, dele = sum(f["added"] for f in rev), sum(f["deleted"] for f in rev)
    noise = {}
    for f in files:
        if f["noise"]: noise[f["class"]] = noise.get(f["class"], 0) + 1
    filtered = ", ".join(f"{n} {c}" for c, n in sorted(noise.items(), key=lambda kv: -kv[1])) or "nothing"

    lenses, findings, refuted = [], [], []
    for key, title in ORDER:
        lj = load(f"{run}/lens-{key}.json")
        if lj is None or lj.get("applies") is False: continue
        vj = load(f"{run}/verify-{key}.json", {}) or {}
        verdict = {v["id"]: v for v in vj.get("verdicts", [])}
        kept = []
        for f in lj.get("findings", []):
            v = verdict.get(f["id"]) or {}
            if v.get("verdict") == "REFUTED":
                refuted.append({"lens": key, "criterion": f.get("criterion"), "title": f.get("title"), "reason": v.get("reason")}); continue
            if f["id"] in drop: continue
            if v.get("severity"): f["severity"] = v["severity"]
            if v.get("revised_title"): f["title"] = v["revised_title"]
            if v.get("revised_suggestion"): f["suggestion"] = v["revised_suggestion"]
            if v.get("revised_alternatives") is not None: f["alternatives"] = v["revised_alternatives"]
            if BUNDLED_ROUTES.search(f.get("suggestion", "")):
                print(f"WARN {key}:{f['id']}: suggestion bundles several routes in one option; split it into "
                      "suggestion + alternatives", file=sys.stderr)
            if v.get("revised_detail"): f["detail"] = v["revised_detail"]
            elif v.get("verdict") == "DOWNGRADED": f["detail"] += f"\n\n*Verifier narrowed this:* {v.get('reason', '')}"
            f["lens"], f["lens_title"] = key, title
            kept.append(f)
        kept.sort(key=lambda f: SEV_RANK.get(f["severity"], 3))
        lenses.append((key, title, escape_angles((load(f"{run}/lens-{key}.md", "") or "").strip()), kept))
        findings += kept
    findings.sort(key=lambda f: (SEV_RANK.get(f["severity"], 3), f["id"]))

    if a.plan:
        pj = load(f"{run}/plans.json", {}) or {}
        plans, context = pj.get("plans") or [], pj.get("context") or []
        fix_cmd = f"/openvaa-review fix --plan {'--local ' if a.local else ''}{target}"
        head = [f"<!-- {mark} pr={a.pr or 'none'} branch={a.branch} head={a.head} -->", "## Plan review brief", "",
                "> Thematic review of the plans listed below, generated by `/openvaa-review --plan` before they are executed. "
                "It explains what the plans intend by theme and lists only what should change in them. No code was reviewed: "
                "the tree was read only to check what the plans say about it.", "",
                f"**Branch:** `{a.branch}` @ `{a.head[:10]}` · **Plans reviewed:** {len(plans)} · **Context read:** {len(context)} files", "",
                "### Plans under review", ""]
        head += [f"- `{p['path']}`" + (f": {p['title']}" if p.get("title") else "") for p in plans]
        head += ["", "### What the plans set out to do", "", section(mp, "Purpose"), "", "### Reading guide", ""]
    else:
        fix_cmd = f"/openvaa-review fix {'--local ' if a.local else ''}{target}"
        head = [f"<!-- {mark} pr={a.pr or 'none'} head={a.head} -->", "## Review brief", "",
                "> Thematic review for the human reviewer, generated by `/openvaa-review` after automated review. "
                "It explains the change by theme and lists only what needs fixing. Correctness bugs were the automated review's job.", "",
                f"**Base:** `{a.base}` @ `{a.mb[:10]}` · **Head:** `{a.head[:10]}` · **Reviewed:** {len(rev)} of {len(files)} files "
                f"(+{add}/−{dele}) · **Filtered out:** {filtered}", "",
                "### What this PR does", "", section(mp, "Purpose"), "", "### Reading guide", ""]
        sl = stack_line(run)
        if sl: head[head.index("### What this PR does"):head.index("### What this PR does")] = [sl, ""]
    for m in re.finditer(r"^### (.+?)\n(.*?)(?=^### |\Z)", section(mp, "Slices"), re.S | re.M):
        head.append(f"- **{m.group(1).strip()}**: {slice_summary(m.group(2))}")
    head += ["", "### Findings", ""]
    if findings:
        counts = ", ".join(f"{sum(1 for f in findings if f['severity'] == s)} {s}"
                           for s in SEV_TITLE if any(f["severity"] == s for f in findings))
        head.append(f"{len(findings)} findings: {counts}. Tick one option under each. An untouched finding means "
                    f"the recommended option; `{fix_cmd}` applies them.")
    else:
        head.append("Nothing to fix. The lenses below explain the change.")

    # Chunks are packed into comments in order. Each carries the heading to repeat when it starts a new part.
    chunks = []
    for sev in ("blocking", "should-fix", "consider"):
        for f in [f for f in findings if f["severity"] == sev]:
            chunks.append({"heading": f"### {SEV_TITLE[sev]}", "text": finding_block(f)})
    for key, title, body, kept in lenses:
        out = [body if a.verbose or key in KEEP_AFFECTED else strip_affected(body)]
        if kept: out.append("Findings: " + ", ".join(f"**{f['id']}**" for f in kept) + ".")
        for fid in xref.get(key, []):
            out.append(f"See **{fid}** (raised under another lens).")
        if not kept and not xref.get(key): out.append("Nothing to fix.")
        chunks.append({"heading": f"### {title}", "text": "\n\n".join(x for x in out if x)})

    data = {"version": 1, "pr": int(a.pr) if a.pr else None, "head": a.head, "base": a.mb, "lenses": [l[0] for l in lenses],
            "findings": [{"id": f["id"], "lens": f["lens"], "criterion": f.get("criterion"), "severity": f["severity"],
                          "title": f["title"], "files": sorted({re.sub(r"^https://github\.com/[^/]+/[^/]+/blob/[0-9a-f]+/|#.*$", "", u)
                                                                for u in f.get("evidence") or []}),
                          "checklist_rule": f.get("checklist_rule"),
                          "opts": [option_fingerprint(o) for o in fix_options(f)]} for f in findings],
            "refuted": refuted}
    tail = ["---", ""]
    if a.plan:
        data.update({"mode": "plan", "branch": a.branch, "plans": [p["path"] for p in plans]})
    elif a.branch:
        data["branch"] = a.branch
    if not a.plan and not as_file:
        tail += ["<details><summary>Reviewer feedback: tick any finding that was wrong or not worth raising</summary>", "",
                 "This feedback tunes future reviews. Ticked findings teach `/openvaa-review learn` what not to flag. "
                 "It is not the same as ticking \"Don't fix\" above, which declines a fix for a finding that is real.", ""]
        tail += [f"- [ ] {f['id']} not a real issue" for f in findings]
        tail += ["", "</details>", ""]
    tail += [f"<sub>{len(lenses)} lenses · {len(findings)} findings, {len(refuted)} refuted by peer verification · "
             f"openvaa-review v1{' (plan)' if a.plan else ''}</sub>"]
    data_s = "\n".join(["<!-- openvaa-review-data", json.dumps(data, ensure_ascii=False).replace("-->", "--\\u003e"), "-->"])

    head_s, tail_s = "\n".join(head), "\n".join(tail)
    parts, cur, room, seen = [], [], budget - len(head_s) - len(tail_s), set()
    last = None
    for c in chunks:
        repeat = " (continued)" if c["heading"] in seen and c["heading"] != last else ""
        piece = ("" if c["heading"] == last else f"{c['heading']}{repeat}\n\n") + c["text"]
        if cur and len(piece) + 8 > room:
            parts.append(cur); cur, room, last = [], budget - CONT_OVERHEAD, None
            piece = f"{c['heading']}{' (continued)' if c['heading'] in seen else ''}\n\n" + c["text"]
        cur.append(piece); room -= len(piece) + 8
        seen.add(c["heading"]); last = c["heading"]
    if cur: parts.append(cur)
    if not parts: parts = [[]]
    # The data block joins the first part only if that part still fits the budget with it.
    first_len = len(head_s) + len(tail_s) + sum(len(p) + 8 for p in parts[0]) + 60
    data_apart = first_len + len(data_s) > budget
    if not data_apart: tail_s += "\n\n" + data_s

    total = len(parts) + (1 if data_apart else 0)
    written = []
    for i, secs in enumerate(parts, start=1):
        body = "\n\n---\n\n".join(secs)
        if i == 1:
            cont = f"\n\n*Continued in the next {total - 1} comment(s).*" if total > 1 else ""
            text = f"{head_s}\n\n{body}{cont}\n\n{tail_s}\n"
            name = "comment.md"
        else:
            text = (f"<!-- {mark}-cont pr={a.pr} head={a.head} part={i}/{total} -->\n"
                    f"## {'Plan review' if a.plan else 'Review'} brief, part {i} of {total}\n\n{body}\n")
            name = f"comment-{i}.md"
        if not as_file and len(text) > LIMIT:
            print(f"WARNING: {name} is {len(text)} chars (one chunk alone exceeds the limit); trim it.")
        with open(f"{run}/{name}", "w") as fh: fh.write(text)
        written.append((name, len(text)))
    if data_apart:
        text = (f"<!-- {mark}-cont pr={a.pr} head={a.head} part={total}/{total} -->\n"
                f"## {'Plan review' if a.plan else 'Review'} brief, part {total} of {total}\n\n"
                "<sub>Machine-readable record of this review for `/openvaa-review fix` and `learn`. Please do not edit.</sub>\n\n"
                f"{data_s}\n")
        if len(text) > LIMIT:
            print(f"WARNING: comment-{total}.md (the data block) is {len(text)} chars, over GitHub's limit.")
        with open(f"{run}/comment-{total}.md", "w") as fh: fh.write(text)
        written.append((f"comment-{total}.md", len(text)))
    for stale in glob.glob(f"{run}/comment-*.md"):
        m = re.fullmatch(r"comment-(\d+)\.md", os.path.basename(stale))
        if m and int(m.group(1)) > total: os.remove(stale)

    print("; ".join(f"{n}: {c} chars" for n, c in written) + f" · {len(lenses)} lenses · {len(findings)} findings · {len(refuted)} refuted")
    for f in findings: print(f"  {f['id']:<7} {f['severity']:<10} {f['title']}")


if __name__ == "__main__":
    main()
