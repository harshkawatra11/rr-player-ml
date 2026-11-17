"""Invariants on the written outputs. Run after the model:  python -X utf8 model/verify_outputs.py   Prints VERIFY PASS or the list of failures."""
import json, math, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent; D = ROOT / "public" / "data"
O = json.loads((ROOT / "model" / "model_outputs.json").read_text(encoding="utf-8")); M = json.loads((D / "meta.json").read_text(encoding="utf-8"))
P = {r: json.loads((D / f).read_text(encoding="utf-8")) for r, f in (("bat", "batters.json"), ("bowl", "bowlers.json"))}
G = json.loads((D / "grid.json").read_text(encoding="utf-8")); S = json.loads((D / "showcase.json").read_text(encoding="utf-8")); fails = []
def need(ok, msg):
    if not ok: fails.append(msg)
C = O["config"]; gate = C["min_p"]
need(O["meta"]["checks_passed"] == O["meta"]["checks_total"], "model checks not all passed")
need(O["meta"]["hash"] == M["meta"]["hash"], "hash differs between model_outputs.json and meta.json")
for r in ("bat", "bowl"):
    recs = P[r]; ids = [d["id"] for d in recs]; need(len(ids) == len(set(ids)), f"{r}: duplicate ids")
    top = sorted([d for d in recs if d["rank"] is not None and d["rank"] <= 10], key=lambda d: d["rank"])
    need([d["rank"] for d in top] == list(range(1, 11)), f"{r}: top-10 ranks are not 1 to 10")
    need([d["id"] for d in top] == O["top10"][r], f"{r}: top 10 in the player file differs from model_outputs.json")
    for d in top:
        need(d["nP"] >= gate and d["nO"] >= gate, f"{r}: {d['name']} below the gate")
        need(d["active"] and d["eligible"] and not d["barred"], f"{r}: {d['name']} in the top 10 but not eligible or barred")
        need(d["nation"] not in C["excluded_nations"], f"{r}: {d['name']} has an excluded nation")
        need(str(d["id"]) not in C["ineligible"], f"{r}: {d['name']} is on the ineligible list")
        need(d["lift_class"] != "Dips" or not C["bar_dips"], f"{r}: {d['name']} labelled Dips in the top 10")
    ranked = sorted([d for d in recs if d["rank"] is not None], key=lambda d: d["rank"]); need(all(a["floor"] >= b["floor"] for a, b in zip(ranked, ranked[1:])), f"{r}: ranks are not sorted by floor")
    need(all(d["barred"] in ("", "Dips under pressure") or d["barred"] in C["ineligible"].values() or (ROOT / "model" / "inputs" / "ineligible.csv").exists() for d in recs), f"{r}: unknown barred reason")
    need(all(d["rank"] is None for d in recs if d["barred"]), f"{r}: a barred player carries a rank")
    for d in recs:
        for k, v in d.items():
            if isinstance(v, float): need(math.isfinite(v), f"{r}: {d['name']} {k} is not finite")
    f = O["validation"]["funnel"][r]; need(all(a >= b for a, b in zip(f, f[1:])), f"{r}: eligibility funnel is not decreasing")
    need(O["validation"]["split_half"][r]["n"] >= 80, f"{r}: fewer than 80 players in the split-half test")
    need(r in O["validation"]["oot"], f"{r}: out-of-time test missing")
for w, A in G["wp"].items():
    for row in A:
        need(all(0 <= v <= 1000 for v in row), f"grid {w}: win probability outside 0 to 1"); need(all(b2 >= a2 - 5 for a2, b2 in zip(row, row[1:])), f"grid {w}: falls as balls left rise")
    for j in range(len(A[0])): need(all(A[i + 1][j] <= A[i][j] + 5 for i in range(len(A) - 1)), f"grid {w}: rises as runs needed rise")
for w in range(1, 10): need(all(G["wp"][str(w + 1)][i][j] >= G["wp"][str(w)][i][j] - 5 for i in range(100) for j in range(60)), f"grid: fewer wickets in hand beats more at {w}")
need(all(len(o) == 7 for m in S for o in m["overs"]), "showcase is not over-level")
blob = "".join((D / f).read_text(encoding="utf-8") for f in ("batters.json", "bowlers.json", "meta.json", "teams.json", "showcase.json"))
need(not re.search(r"innings_ball_num|striker_id|over_ball_num|delivery_ist_time|bowl_speed|non_striker", blob), "ball-level keys in public data")
E = O["validation"]["edge"]; need(E["retired_out_charged"] == 0 and E["wide_stumpings_charged"] == E["wide_stumpings"], "edge-case treatment changed")
sub = (ROOT / "submission" / "top10.md").read_text(encoding="utf-8") if (ROOT / "submission" / "top10.md").exists() else ""
need(all(row[1] in sub for row in O["deck"]["top_bat"] + O["deck"]["top_bowl"]), "submission/top10.md does not match the model")
print("\n".join(fails) if fails else ""); print("VERIFY FAIL (%d)" % len(fails) if fails else "VERIFY PASS")
