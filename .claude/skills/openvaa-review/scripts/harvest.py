#!/usr/bin/env python3
"""Harvest past /openvaa-review comments for the learning loop.

Usage: harvest.py --out <file.json> [--limit 60] [--repo OWNER/REPO]

For each of the last --limit PRs (any state) that carries an openvaa-review comment:
  - parses the hidden `openvaa-review-data` JSON block (in the head comment, or in a continuation of its own),
  - reads which reviewer-feedback boxes were ticked (finding judged wrong / not worth raising),
  - marks a finding `likely_addressed` when the PR head moved after the review and a later commit touched
    one of the finding's files,
  - collects human review comments (inline + review bodies + discussion) from non-bot, non-author users,
    which are raw material for new criteria the lenses missed.

Writes an aggregate keyed by criterion plus the raw per-PR records.
"""
import argparse
import json
import re
import subprocess
from collections import defaultdict

MARKER = "<!-- openvaa-review:v1 "  # trailing space: continuation comments use `v1-cont`
CONT_MARKER = "<!-- openvaa-review:v1-cont"
DATA_RE = re.compile(r"<!-- openvaa-review-data\s*(\{.*?\})\s*-->", re.S)
TICK_RE = re.compile(r"^- \[[xX]\] ([A-Z][A-Z0-9]{1,4}-\d+)\b", re.M)


def origin_repo():
    """owner/name of the `origin` remote; `gh repo view` needs GraphQL, which cloud sessions refuse."""
    url = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True, check=True).stdout.strip()
    return re.sub(r"\.git$", "", re.sub(r"^.*github\.com[:/]", "", url))


def gh_json(*args):
    """Run gh and parse JSON. Paginated `gh api` calls get --slurp so pages arrive as one list of lists."""
    args = list(args)
    paginated = "--paginate" in args
    if paginated:
        args.append("--slurp")
    out = subprocess.run(["gh", *args], capture_output=True, text=True)
    if out.returncode != 0 or not out.stdout.strip():
        return None
    data = json.loads(out.stdout)
    return [item for page in data for item in page] if paginated else data


def is_bot(user):
    login = (user or {}).get("login", "")
    return (user or {}).get("type") == "Bot" or login.endswith("[bot]")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--limit", type=int, default=60)
    ap.add_argument("--repo")
    args = ap.parse_args()
    repo = args.repo or origin_repo()

    pulls = gh_json("api", f"repos/{repo}/pulls?state=all&sort=created&direction=desc&per_page={min(args.limit, 100)}") or []
    prs = [{"number": p["number"], "title": p["title"], "author": {"login": (p.get("user") or {}).get("login")},
            "headRefOid": p["head"]["sha"],
            "state": "MERGED" if p.get("merged_at") else p["state"].upper()} for p in pulls[:args.limit]]
    records = []
    for pr in prs:
        n = pr["number"]
        comments = gh_json("api", f"repos/{repo}/issues/{n}/comments", "--paginate") or []
        review = next((c for c in reversed(comments) if MARKER in (c.get("body") or "")), None)
        if not review:
            continue
        body = review["body"]
        # The data block rides in the head comment, or in the review's last continuation when it did not fit.
        conts = [c["body"] for c in comments if CONT_MARKER in (c.get("body") or "")]
        m = next(filter(None, (DATA_RE.search(b) for b in [body, *conts])), None)
        if not m:
            records.append({"pr": n, "error": "no data block"})
            continue
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError as e:
            records.append({"pr": n, "error": f"bad data block: {e}"})
            continue
        ticked = set(TICK_RE.findall(body))

        touched_after = set()
        if data.get("head") and data["head"] != pr["headRefOid"]:
            cmp = gh_json("api", f"repos/{repo}/compare/{data['head']}...{pr['headRefOid']}")
            if isinstance(cmp, dict):
                touched_after = {f["filename"] for f in cmp.get("files", [])}

        for f in data.get("findings", []):
            f["false_positive"] = f["id"] in ticked
            f["likely_addressed"] = bool(touched_after & set(f.get("files") or []))

        author = (pr.get("author") or {}).get("login")
        human = []
        for c in comments:
            if c is review or is_bot(c.get("user")) or (c.get("user") or {}).get("login") == author:
                continue
            if MARKER in (c.get("body") or ""):
                continue
            human.append({"kind": "discussion", "user": c["user"]["login"], "body": c["body"][:2000]})
        for c in gh_json("api", f"repos/{repo}/pulls/{n}/comments", "--paginate") or []:
            if not is_bot(c.get("user")) and (c.get("user") or {}).get("login") != author:
                human.append({"kind": "inline", "user": c["user"]["login"], "path": c.get("path"),
                              "body": c["body"][:2000]})
        for r in gh_json("api", f"repos/{repo}/pulls/{n}/reviews", "--paginate") or []:
            if r.get("body") and not is_bot(r.get("user")) and (r.get("user") or {}).get("login") != author:
                human.append({"kind": "review", "user": r["user"]["login"], "state": r.get("state"),
                              "body": r["body"][:2000]})

        records.append({"pr": n, "title": pr["title"], "state": pr["state"], "comment_url": review.get("html_url"),
                        "findings": data.get("findings", []), "refuted": data.get("refuted", []),
                        "human_comments": human})

    agg = defaultdict(lambda: {"raised": 0, "prs": set(), "critical": 0, "false_positive": 0,
                               "likely_addressed": 0, "refuted": 0, "examples": []})
    for r in records:
        for f in r.get("findings", []):
            a = agg[f.get("criterion", "unknown")]
            a["raised"] += 1
            a["prs"].add(r["pr"])
            a["critical"] += f.get("severity") in ("critical", "blocking")
            a["false_positive"] += f["false_positive"]
            a["likely_addressed"] += f["likely_addressed"]
            if len(a["examples"]) < 5:
                a["examples"].append({"pr": r["pr"], "id": f["id"], "title": f.get("title"),
                                      "checklist_rule": f.get("checklist_rule"), "false_positive": f["false_positive"]})
        for f in r.get("refuted", []):
            agg[f.get("criterion", "unknown")]["refuted"] += 1

    by_criterion = {k: {**v, "prs": sorted(v["prs"]), "distinct_prs": len(v["prs"])} for k, v in agg.items()}
    out = {"repo": repo, "reviewed_prs": [r["pr"] for r in records], "by_criterion": by_criterion, "records": records}
    with open(args.out, "w") as fh:
        json.dump(out, fh, indent=2)

    print(f"{len(records)} reviewed PRs out of the last {len(prs)}.")
    for k, v in sorted(by_criterion.items(), key=lambda kv: -kv[1]["distinct_prs"]):
        print(f"  {k:<32} prs={v['distinct_prs']:<3} raised={v['raised']:<3} critical={v['critical']:<2} "
              f"fp={v['false_positive']:<2} refuted={v['refuted']:<2} addressed={v['likely_addressed']}")


if __name__ == "__main__":
    main()
