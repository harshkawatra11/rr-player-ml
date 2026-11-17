"""Franchise ledger for the IPL 2027 auction: purse left, squad slots and overseas slots per franchise, with the Royals first.
Run after lane G:  python -X utf8 model/ledger.py   Reads model/inputs/franchise_ledger.csv and purse.csv. Writes public/data/ledger.json and model/ledger_tables.md.
Arithmetic only: purse left = purse - sum of retained contracts; slots left = 25 - retained; overseas slots left = 8 - overseas retained; players needed to reach 18 = max(0, 18 - retained)."""
import json, pathlib, pandas as pd
ROOT = pathlib.Path(__file__).resolve().parent.parent; INP = ROOT / "model" / "inputs"
L = pd.read_csv(INP / "franchise_ledger.csv"); P = pd.read_csv(INP / "purse.csv")
L["overseas"] = L.overseas.astype(str).str.lower().isin(["true", "1", "yes", "y"])
assert L.contract_cr.notna().all(), "every retained player needs a contract amount (or a documented zero for a replacement player)"
g = L.groupby("franchise").agg(retained=("player_name", "size"), overseas=("overseas", "sum"), committed_cr=("contract_cr", "sum")).reset_index()
missing = sorted(set(L.franchise) - set(P.franchise)); assert not missing, f"no purse row for {missing}"
T = P[["franchise", "purse_cr", "basis"]].merge(g, on="franchise", how="left").fillna({"retained": 0, "overseas": 0, "committed_cr": 0.0})
T["retained"] = T.retained.astype(int); T["overseas"] = T.overseas.astype(int)
T["purse_left_cr"] = (T.purse_cr - T.committed_cr).round(2); T["slots_left"] = 25 - T.retained; T["overseas_left"] = 8 - T.overseas; T["needed_to_18"] = (18 - T.retained).clip(lower=0)
T["max_bid_cr"] = (T.purse_left_cr - 0.30 * (T.needed_to_18 - 1).clip(lower=0)).round(2)  # keeps the Rs 30 lakh base price for each other player still needed to reach 18
assert (T.slots_left >= 0).all() and (T.overseas_left >= 0).all(), "a franchise exceeds 25 players or 8 overseas: check the ledger rows"
T = T.sort_values(["franchise", "basis"]); rr = T[T.franchise == "Rajasthan Royals"]
out = dict(rows=T.to_dict("records"), royals=rr.to_dict("records"), retained=L.to_dict("records"), note="Purse left is arithmetic on verified contract amounts. Where the purse itself is disputed both rows are kept.")
(ROOT / "public" / "data" / "ledger.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
md = "# Franchise ledger\n\n| Franchise | Basis | Purse, Rs crore | Retained | Overseas | Committed, Rs crore | Purse left | Slots left | Overseas left | Needed to 18 | Largest possible bid |\n|---|---|---|---|---|---|---|---|---|---|---|\n"
md += "\n".join(f"| {r.franchise} | {r.basis} | {r.purse_cr:.2f} | {r.retained} | {r.overseas} | {r.committed_cr:.2f} | {r.purse_left_cr:.2f} | {r.slots_left} | {r.overseas_left} | {r.needed_to_18} | {r.max_bid_cr:.2f} |" for r in T.itertuples()) + "\n"
(ROOT / "model" / "ledger_tables.md").write_text(md, encoding="utf-8", newline="\n"); print(md); print("LEDGER PASS", len(T), "rows")
