"""Assemble research/parts/*.md into rr-pressure-research.md and run the acceptance gates.  python -X utf8 research/assemble.py"""
import re, io, json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent; O = json.loads((ROOT / "model" / "model_outputs.json").read_text(encoding="utf-8")); D = O["deck"]
BAN = ["here's", "let's", "bottom line", "delve", "game-changer", "game changer", "unlock", "it's not just", "make no mistake", "landscape", "robust", "seamless", "holistic", "tapestry", "paradigm", "navigate", "revolutioni", "cutting-edge",
       "leverage", "empower", "transformative", "journey", "synergy", "world-class", "best-in-class", "next-gen", "reimagine", "supercharge", "harness", "crucial", "pivotal", "furthermore", "moreover", "in today's", "ever-evolving", "imagine",
       "testament", "elevate", "what if", "picture this", "dive into", "deep dive", "groundbreaking", "state-of-the-art", "plethora", "myriad", "underscore", "showcase", "foster", "bolster", "spearhead", "nuanced", "intricate", "meticulous",
       "realm", "fast-paced", "in conclusion", "it is important to note", "vibrant", "valuable insights", "clutch gene"]
MIN_WORDS, MIN_TABLES, QA = 52000, 150, "33"
secs = {}
for p in sorted((HERE / "parts").glob("part-*.md")):
    t = p.read_text(encoding="utf-8").replace("\r", ""); assert not re.search(r"^# ", t, re.M), ("H1 in a part", p.name)
    for mm in re.finditer(r"^## (\d+|Appendix C)[.:] .*?(?=^## |\Z)", t, re.M | re.S): k = mm.group(1); assert k not in secs, ("duplicate section", k); secs[k] = mm.group(0).strip() + "\n\n"
want = [str(i) for i in range(35)]; miss = [k for k in want + ["Appendix C"] if k not in secs]
tb = lambda r: "%s, %s and %s" % (D["top_" + r][0][1], D["top_" + r][1][1], D["top_" + r][2][1])
head = ("# Reliable Under Pressure: Rating Batters and Bowlers When the Match Is on the Line\n\n**In our model the most reliable batters under pressure are %s and the most reliable bowlers are %s; a player's extra under pressure does not repeat from one half of his matches to the other (%s for batters, %s for bowlers), so the rating blends each pressure record with the everyday record behind it and ranks on the level we are 80%% sure the player exceeds.**\n\n"
        "Team IdeaForge: Harsh Kawatra (Delhi Technological University, Team Leader)\n\nPrepared for: Rajasthan Royals and Unstop, SupeRR Selector Season 2, Round 1\n\n---\n\n") % (tb("bat"), tb("bowl"), D["sh"]["bat"]["r_lift"], D["sh"]["bowl"]["r_lift"])
body = "## PART A: THE METHODOLOGY REPORT\n\nPart A answers the five things the brief asks a methodology report to cover. Model hash %s.\n\n" % D["hash"] + "".join(secs.get(k, "") for k in want[:9]) + "## PART B: THE RESEARCH BEHIND THE REPORT\n\nPart B holds the depth behind each choice in Part A.\n\n" + "".join(secs.get(k, "") for k in want[9:])
src = {}; sp = HERE / "raw" / "sources.md"
if sp.exists():
    for ln in sp.read_text(encoding="utf-8").splitlines():
        c = [x.strip() for x in ln.strip().strip("|").split("|")]
        if len(c) >= 4 and re.fullmatch(r"S\d+", c[0]): src[c[0]] = c
cited = sorted(set(re.findall(r"\bS\d+\b", " ".join(re.findall(r"\[([^\]]*)\]", body)))), key=lambda s: int(s[1:])); missS = [s for s in cited if s not in src]
bib = "## Appendix A: Bibliography\n\n| ID | Source | Available at | Accessed |\n|---|---|---|---|\n" + "\n".join("| %s | %s | %s | %s |" % (s, src[s][1], src[s][2], src[s][3]) for s in cited if s in src) + "\n\n"
mt = re.sub(r"^# .*\n", "", (ROOT / "model" / "model_tables.md").read_text(encoding="utf-8"), count=1); full = head + body + bib + "## Appendix B: Model tables\n\n" + mt.replace("\n## T", "\n### T").replace("## T1.", "### T1.", 1) + secs.get("Appendix C", "")
(HERE / "rr-pressure-research.md").write_text(full, encoding="utf-8", newline="\n")
low = full.lower(); pre33 = re.split(r"^## 33\.", body, flags=re.M)[0]; figs = set(re.findall(r"figures/(F\d\d)\.png", full))
res = dict(words=len(full.split()), tables=len(re.findall(r"^\|[ :|-]+\|\s*$", full, re.M)), dashes=len(re.findall("[—–]", full)), exclamations=full.count("!") - full.count("!["), q_outside_qa=pre33.count("?"),
           banned=sorted({w for w in BAN if w in low}), missing_sections=miss, missing_S=missS, figures=len(figs), missing_figure_files=[f for f in figs if not (HERE / "figures" / (f + ".png")).exists()],
           answers=len(re.findall(r"^\*\*Answer\.\*\*", body, re.M)), h2_numbered=len(re.findall(r"^## \d+\.", body, re.M)), placeholders=len(re.findall(r"TODO|TBD|Lorem|\bxyz\b|PLACEHOLDER|\[citation|<\.\.\.>", full)),
           not_x_but_y=len(re.findall(r"\bnot (?:just|only|merely)\b", low)), hash_ok=D["hash"] in full, top_names_ok=all(r[1] in full for r in D["top_bat"] + D["top_bowl"]))
ok = (res["words"] >= MIN_WORDS and res["tables"] >= MIN_TABLES and res["dashes"] == 0 and res["exclamations"] == 0 and res["q_outside_qa"] == 0 and not res["banned"] and not miss and not missS and res["figures"] >= 18 and not res["missing_figure_files"]
      and res["answers"] >= res["h2_numbered"] and res["placeholders"] == 0 and res["not_x_but_y"] <= 2 and res["hash_ok"] and res["top_names_ok"])
print(json.dumps(res, ensure_ascii=False, indent=1)); print("ASSEMBLY PASS" if ok else "ASSEMBLY FAIL"); sys.exit(0 if ok else 1)
