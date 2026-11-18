"""Build research/raw/sources.md (one S-ID per unique URL), research/raw/rid_to_sid.json and research/raw/facts.md from the lane files.
Run from the project root:  python -X utf8 research/build_sources.py"""
import re, json, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parent.parent; RAW = ROOT / "research" / "raw"
LANES = ["R-A", "R-B", "R-C1", "R-C2", "R-D", "R-E", "R-Fb", "R-Fw", "R-G"]
URL = re.compile(r"https?://[^\s|)>\]]+")
def clean(s):
    s = re.sub(r"(?<=\d)\s*[–—]\s*(?=\d)", "-", s)
    return re.sub(r"\s*[–—]\s*", " - ", s)
def norm(s):
    for k in ("VERIFIED (search only)", "VERIFIED", "CONFLICT", "NOT YET PUBLISHED", "UNVERIFIABLE", "PREDICTION"):
        if s.upper().startswith(k): return k
    return s
rows = []; seen = {}; sid_of = {}; order = []
for lane in LANES:
    f = RAW / f"{lane}.md"
    if not f.exists(): continue
    for ln in f.read_text(encoding="utf-8").splitlines():
        if not ln.startswith("|"): continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        if len(cells) < 8 or not re.fullmatch(r"[A-Z][A-Za-z]?\d{2,3}", cells[0]): continue
        rid, fact, title, pub = cells[0], clean(cells[1]), clean(cells[2]), clean(cells[3])
        m = URL.search(" ".join(cells[4:-2])) if len(cells) > 8 else URL.search(cells[4])
        url = m.group(0).rstrip(".,;") if m else ""
        accessed = cells[-3]; status = norm(cells[-1])
        rows.append(dict(rid=rid, fact=fact, title=title, pub=pub, url=url, accessed=accessed, status=status, lane=lane))
        if url and url not in sid_of:
            sid_of[url] = "S%02d" % (len(sid_of) + 1); order.append(url)
src = collections.defaultdict(list)
for r in rows:
    r["sid"] = sid_of.get(r["url"], "")
    if r["url"]: src[r["url"]].append(r["rid"])
meta = {}
for r in rows:
    if r["url"] and r["url"] not in meta: meta[r["url"]] = r
L = ["# Sources register", "", "| S-ID | Publisher: title | URL | Accessed | Lane rows |", "|---|---|---|---|---|"]
for u in order:
    r = meta[u]; L.append(f"| {sid_of[u]} | {r['pub']}: {r['title']} | {u} | {r['accessed']} | {', '.join(src[u])} |")
(RAW / "sources.md").write_text("\n".join(L) + "\n", encoding="utf-8", newline="\n")
(RAW / "rid_to_sid.json").write_text(json.dumps({r["rid"]: r["sid"] for r in rows}, indent=0), encoding="utf-8", newline="\n")
F = ["# Facts lookup (cite the S-ID; never cite a row whose status is UNVERIFIABLE as fact)", "", "| R-ID | S-ID | Status | Fact |", "|---|---|---|---|"]
F += [f"| {r['rid']} | {r['sid']} | {r['status']} | {r['fact']} |" for r in rows]
(RAW / "facts.md").write_text("\n".join(F) + "\n", encoding="utf-8", newline="\n")
tally = collections.Counter(r["status"] for r in rows); lanes = collections.Counter(r["lane"] for r in rows)
print("rows", len(rows), "| sources", len(sid_of), "| rows without a URL", sum(1 for r in rows if not r["url"]))
print("by status", dict(tally)); print("by lane", dict(lanes))
