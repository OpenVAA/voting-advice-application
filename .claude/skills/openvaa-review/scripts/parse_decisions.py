#!/usr/bin/env python3
"""Read a posted /openvaa-review back and report what the reviewer decided per finding.

Usage: parse_decisions.py --pr N [--repo OWNER/REPO] [--out decisions.json] [--from-files comment.md ...]
       parse_decisions.py --plan --pr N [--out decisions.json]
       parse_decisions.py --plan --from-files <dir>/OPENVAA-PLAN-REVIEW.md [--out decisions.json]

Collects the review comment and its continuations (markers `openvaa-review:v1 ` and `v1-cont`), parses every
finding block, and resolves each one to a decision:

  fix      an option is ticked (or nothing is ticked, which means the recommended option)
  discuss  "Discuss" is ticked — the orchestrator must settle these with the user BEFORE fixing anything
  skip     "Don't fix" is ticked

Ticking several options is reported as `conflict`, never guessed. The reviewer-feedback block at the end
("<id> not a real issue") is parsed separately into `feedback_wrong`; it tunes future reviews and is not a
fix instruction, so a finding can be both `fix` and `feedback_wrong`.

Everything the reviewer added is read, not just the tick marks:
  - an option's full text, including wrapped or indented continuation lines, is the `choice` verbatim;
  - text typed after a label ("Discuss — prefer the helper", "Don't fix: intentional") keeps the label's meaning
    and lands in `notes`;
  - any prose between the options and the finding's closing `---` lands in `notes`;
  - an option whose fingerprint is absent from the data block's `opts` was added or edited by the reviewer
    (`user_text` on the option, `custom` on the decision when it is the one chosen);
  - other PR comments, review bodies and inline review comments that name a finding id land in `mentions`,
    and those naming none in `unlinked_comments`, because fix mode must read them before planning.
A finding carrying any of these gets `user_input: true`, and its id is listed in `needs_reading`.

With --plan it reads a plan review instead (marker `openvaa-plan-review:v1`). Either kind of review lives in a PR
comment, or in a file committed to the branch (no PR, or the review was run with --local), which is passed with
--from-files and needs no --pr.

Exit status is 0 even when nothing is ticked; the caller decides. Non-zero only on a missing review.
"""
import argparse, hashlib, html, json, re, subprocess, sys

MARKER = "<!-- openvaa-review:v1"  # matches the head comment and the v1-cont continuations
PLAN_MARKER = "<!-- openvaa-plan-review:v1"
FIXES_MARKER = "<!-- openvaa-review-fixes:v1"  # fix mode's own report: names finding ids, but is no reviewer's input
DATA_RE = re.compile(r"<!-- openvaa-review-data\s*(\{.*?\})\s*-->", re.S)
HEAD_RE = re.compile(r"^##### <sub>([A-Z][A-Z0-9]{1,4}-\d+) · \*([a-z-]+)\* · `([^`]*)`</sub>\s*$", re.M)
SUMMARY_RE = re.compile(r"<summary>(.*?)</summary>", re.S)
OPT_LINE_RE = re.compile(r"^ {0,3}[-*+] \[([ xX])\](?:\s+(.*))?$")
FEEDBACK_RE = re.compile(r"^- \[([ xX])\] ([A-Z][A-Z0-9]{1,4}-\d+) not a real issue(.*)$", re.M)
ID_RE = re.compile(r"\b([A-Z][A-Z0-9]{1,4}-\d+)\b")
DISCUSS_RE = re.compile(r"^discuss\b(.*)$", re.I | re.S)
DONT_FIX_RE = re.compile(r"^don['’]?t fix\b(.*)$", re.I | re.S)
RECOMMENDED = "*(Recommended)*"
# Generated lines in the option region that are not reviewer input.
SCAFFOLD_RE = re.compile(r"^(—|#{1,6} .*|<!-- openvaa-review.*|\*Continued in the next .*)$")


def option_fingerprint(text):
    """Must match compose_comment.py."""
    return hashlib.sha256(" ".join(text.split()).encode()).hexdigest()[:8]


def unescape_angles(text):
    """Undo compose_comment.py's escape_angles, so a fix agent reads `<title>` and not `&lt;title&gt;`. Applied after fingerprinting."""
    return text.replace("&lt;", "<").replace("&gt;", ">") if text else text


def trailing_note(rest):
    return rest.strip().lstrip("-—–:;,.()").strip() or None


def parse_option_region(region):
    """Options (with every continuation line) and free-text notes from the text after a finding's </details>.

    Text between two options belongs to the one above it: generated options span several lines (a lead sentence
    and a list), which older reviews posted unindented. Only text after the last option, or before the first, is a
    note, unless it is indented or directly follows the last option without a blank line."""
    items, gap = [], False
    for raw in region.splitlines():
        line = raw.rstrip()
        if not line.strip():
            gap = True; continue
        m = OPT_LINE_RE.match(line)
        if m:
            items.append(("opt", {"ticked": m.group(1).lower() == "x", "text": (m.group(2) or "").strip()}))
        elif not SCAFFOLD_RE.match(line.strip()):
            items.append(("text", (line.strip(), raw[:1].isspace() or not gap)))
        gap = False
    last = max((i for i, (k, _) in enumerate(items) if k == "opt"), default=-1)
    opts, notes, cur = [], [], None
    for i, (kind, v) in enumerate(items):
        if kind == "opt":
            cur = v; opts.append(v)
        elif cur is not None and (i < last or v[1]):
            cur["text"] = f"{cur['text']}\n{v[0]}"
        else:
            cur = None; notes.append(v[0])
    return opts, notes


def collect_mentions(repo, pr, known, review_ids, since):
    """Human comments elsewhere on the PR: issue comments, review bodies and inline review comments."""
    sources = [("comment", f"repos/{repo}/issues/{pr}/comments"), ("review", f"repos/{repo}/pulls/{pr}/reviews"),
               ("inline", f"repos/{repo}/pulls/{pr}/comments")]
    mentions, unlinked = {}, []
    for kind, path in sources:
        pages = gh_json("api", path, "--paginate", "--slurp") or []
        for c in (c for page in pages for c in (page if isinstance(page, list) else [page])):
            body = (c.get("body") or "").strip()
            if not body or c.get("id") in review_ids or MARKER in body or PLAN_MARKER in body or FIXES_MARKER in body: continue
            if (c.get("user") or {}).get("type") == "Bot": continue
            item = {"kind": kind, "author": (c.get("user") or {}).get("login"), "url": c.get("html_url"),
                    "at": c.get("created_at") or c.get("submitted_at"), "path": c.get("path"), "body": body}
            ids = sorted(set(ID_RE.findall(body)) & known)
            for fid in ids: mentions.setdefault(fid, []).append(item)
            if not ids and (item["at"] or "") >= since: unlinked.append(item)
    return mentions, unlinked


def gh_json(*args):
    out = subprocess.run(["gh", *args], capture_output=True, text=True)
    if out.returncode != 0 or not out.stdout.strip():
        return None
    return json.loads(out.stdout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pr")
    ap.add_argument("--plan", action="store_true", help="read the plan review rather than the code review")
    ap.add_argument("--repo")
    ap.add_argument("--out")
    ap.add_argument("--from-files", nargs="+", help="parse local comment*.md instead of the posted comments (dry runs, tests)")
    a = ap.parse_args()
    if not a.pr and not a.from_files: ap.error("--pr is required unless --from-files is given")
    marker, kind = (PLAN_MARKER, "/openvaa-review --plan") if a.plan else (MARKER, "/openvaa-review")
    if a.from_files:
        repo = a.repo or "local"
        mine = []
        for p in a.from_files:
            with open(p) as fh: mine.append({"id": p, "body": fh.read()})
    else:
        repo = a.repo or subprocess.run(["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
                                        capture_output=True, text=True, check=True).stdout.strip()
        comments = gh_json("api", f"repos/{repo}/issues/{a.pr}/comments", "--paginate", "--slurp") or []
        comments = [c for page in comments for c in (page if isinstance(page, list) else [page])]
        mine = [c for c in comments if marker in (c.get("body") or "")]
    if not mine:
        print(f"No {kind} comment on PR {a.pr}.", file=sys.stderr); return 2

    data, bodies = None, []
    for c in mine:
        body = c["body"]
        bodies.append(body)
        m = DATA_RE.search(body)
        if m and data is None:
            data = json.loads(m.group(1))
    whole = "\n".join(bodies)

    # The feedback block sits after the last finding; strip it before parsing options so its ticks are not
    # mistaken for a fix choice.
    feedback_wrong = {fid: trailing_note(rest) for tick, fid, rest in FEEDBACK_RE.findall(whole) if tick.lower() == "x"}
    whole_wo_feedback = FEEDBACK_RE.sub("", whole)

    data_findings = {f["id"]: f for f in (data or {}).get("findings") or []}
    heads = list(HEAD_RE.finditer(whole_wo_feedback))
    known = {h.group(1) for h in heads} | set(data_findings)
    mentions, unlinked = ({}, []) if a.from_files else collect_mentions(
        repo, a.pr, known, {c["id"] for c in mine}, min((c.get("created_at") or "") for c in mine))
    decisions = []
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(whole_wo_feedback)
        block = whole_wo_feedback[h.start():end]
        block = block.split("\n---", 1)[0]  # options stop at the separator that closes the finding
        fid, severity, criterion = h.group(1), h.group(2), h.group(3)
        summary = SUMMARY_RE.search(block)
        cut = block.rfind("</details>")
        opts, notes = parse_option_region(block[cut + len("</details>"):] if cut >= 0 else block)
        generated = set((data_findings.get(fid) or {}).get("opts") or [])
        for o in opts:
            dm, nm = DISCUSS_RE.match(o["text"]), DONT_FIX_RE.match(o["text"])
            o["kind"] = "discuss" if dm else "skip" if nm else "fix"
            if dm or nm:
                note = trailing_note((dm or nm).group(1))
                if note: notes.append(note)
            else:
                o["user_text"] = bool(generated) and option_fingerprint(o["text"]) not in generated
        ticked = [o for o in opts if o["ticked"]]
        fixes = [o for o in opts if o["kind"] == "fix"]
        d = {"id": fid, "severity": severity, "criterion": criterion,
             "title": html.unescape(re.sub(r"<[^>]+>", "", summary.group(1))).strip() if summary else "",
             "options": [unescape_angles(o["text"]) for o in opts], "ticked": [unescape_angles(o["text"]) for o in ticked],
             "notes": notes, "mentions": mentions.get(fid, []),
             "feedback_wrong": fid in feedback_wrong, "feedback_note": feedback_wrong.get(fid)}
        chosen = None
        if len(ticked) > 1:
            d["decision"] = "conflict"
        elif ticked and ticked[0]["kind"] in ("discuss", "skip"):
            d["decision"] = ticked[0]["kind"]
        elif ticked:
            d["decision"], chosen = "fix", ticked[0]
        else:
            d["decision"], chosen = "fix", (fixes[0] if fixes else None)
            d["defaulted"] = True
        d["choice"] = unescape_angles(chosen["text"]).replace(RECOMMENDED, "").strip() if chosen else None
        d["custom"] = bool(chosen and chosen.get("user_text"))
        d["edited_options"] = [unescape_angles(o["text"]) for o in fixes if o.get("user_text")]
        d["user_input"] = bool(notes or d["mentions"] or d["edited_options"] or d["feedback_note"])
        decisions.append(d)

    counts = {}
    for d in decisions: counts[d["decision"]] = counts.get(d["decision"], 0) + 1
    out = {"pr": int(a.pr) if a.pr else None, "mode": "plan" if a.plan else "code", "branch": (data or {}).get("branch"),
           "repo": repo, "head": (data or {}).get("head"), "comments": [c["id"] for c in mine],
           "counts": counts, "decisions": decisions,
           "findings_in_data": len((data or {}).get("findings") or []),
           "needs_reading": [d["id"] for d in decisions if d["user_input"]], "unlinked_comments": unlinked}
    if a.out:
        with open(a.out, "w") as fh: json.dump(out, fh, indent=2, ensure_ascii=False)
    print(json.dumps({k: out[k] for k in ("pr", "head", "counts", "findings_in_data", "needs_reading")}, ensure_ascii=False))
    if out["findings_in_data"] and out["findings_in_data"] != len(decisions):
        print(f"WARNING: parsed {len(decisions)} finding blocks but the data block lists "
              f"{out['findings_in_data']}; a comment may be missing.", file=sys.stderr)
    for d in decisions:
        if d["decision"] == "conflict":
            print(f"CONFLICT {d['id']}: {len(d['ticked'])} options ticked", file=sys.stderr)
    if unlinked:
        print(f"NOTE: {len(unlinked)} human comment(s) on the PR name no finding id; read unlinked_comments.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
