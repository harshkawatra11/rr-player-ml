"""Model v2: the fixes and decisions of the 17 Nov 2026 audit (PLAN.md section AU).
Run once from the project root:  python -X utf8 model/patch_v2.py
Writes model/pressure_model.v1.py (a copy of v1) and rewrites model/pressure_model.py. Refuses to run twice."""
import pathlib, sys

def patches():
    return [
        # P1: decided-match filter matched "Super Kings" and "Super Giants"
        (r'"Tied|Super|No Result|Abandon|one over"', r'r"\bTie|Super Over|No Result|Abandon|one over"'),
        # P2: shortened matches with no revision recorded; DLS chases with no revised target are dropped
        (r'''    b["maxballs"] = np.where(b.innings == 1, b.first_inn_revised_overs.fillna(120), b.second_inn_revised_overs.fillna(120))''',
         r'''    L1 = b[b.innings == 1].groupby("match_id").agg(l1=("legal", "sum"), w1=("wk", "sum")); res = b.groupby("match_id").result.first(); rev = b.groupby("match_id").first_inn_revised_overs.first()
    RED = set(L1[(L1.l1 <= 114) & (L1.w1 < 10)].index) & set(res[~res.str.contains("No Result|Abandon", case=False)].index) & set(rev[rev.isna()].index); cap = (np.ceil(L1.l1 / 6) * 6).to_dict()
    fio = b.first_inn_revised_overs.copy(); sio = b.second_inn_revised_overs.copy(); mk = b.match_id.isin(RED); fio[mk] = b.match_id[mk].map(cap); sio[mk] = b.match_id[mk].map(cap)
    DLSU = set(b.loc[b.result.str.contains("D/L|DLS", case=False) & b.revised_target.isna(), "match_id"]); b = b[~((b.innings == 2) & b.match_id.isin(DLSU))].copy(); fio = fio[b.index]; sio = sio[b.index]
    globals()["RED"] = RED; globals()["DLSU"] = DLSU
    b["maxballs"] = np.where(b.innings == 1, fio.fillna(120), sio.fillna(120)); b["reduced"] = fio.notna().values'''),
        # P3: the resources fit uses full-length first innings only
        (r'f1 = b[(b.innings == 1) & b.first_inn_revised_overs.isna()]', r'f1 = b[(b.innings == 1) & ~b.reduced]'),
        # P4: a tactical retired-out is not charged to the batter
        (r'(b.is_wicket & (b.dismissed_player_id.fillna(b.striker_id) == b.striker_id)).values.astype(float)',
         r'(b.is_wicket & (b.dismissed_player_id.fillna(b.striker_id) == b.striker_id) & ~b.dismissal_type.eq("Retire Out")).values.astype(float)'),
        # P5: a stumping off a wide is charged to the batter (no runs, no ball used)
        (r'b["d_bat"] = np.where(wide, np.nan, nxt(rb, b.st_out.values, np.where(nb, 0.0, 1.0)) - b.wp0.values)',
         r'b["d_bat"] = np.where(wide & (b.st_out.values == 0), np.nan, nxt(np.where(wide, 0.0, rb), b.st_out.values, np.where(nb | wide, 0.0, 1.0)) - b.wp0.values)'),
        # P6: smooth last-overs ramp in place of the step at 12 balls, plus the IPL indicator in the chase model
        (r'(bl <= 12) * lr])', r'np.clip((24 - bl) / 24, 0, 1) * lr, ip, ip * lr])'),
        # P7 to P17: carry the IPL indicator through both win-probability models, the swing calculation and the chase grid
        (r'def x2(rn, bl, R, env_rpb):', r'def x2(rn, bl, R, env_rpb, ip):'),
        (r'def x1(runs, wk, bl, R, env_rpb):', r'def x1(runs, wk, bl, R, env_rpb, ip):'),
        (r'wk / 10 * (bl / 120)])', r'wk / 10 * (bl / 120), ip, ip * z])'),
        (r'd1.R.values, d1.env_rpb.values)', r'd1.R.values, d1.env_rpb.values, (d1.tier == "IPL").values.astype(float))'),
        (r'd2.R.values, d2.env_rpb.values)', r'd2.R.values, d2.env_rpb.values, (d2.tier == "IPL").values.astype(float))'),
        (r'def WP(inn, runs, wk, bl, target, envf, env_rpb):', r'def WP(inn, runs, wk, bl, target, envf, env_rpb, ip):'),
        (r'x1(runs[a], wk[a], bl[a], R[a], env_rpb[a])', r'x1(runs[a], wk[a], bl[a], R[a], env_rpb[a], ip[a])'),
        (r'x2(rn, bl[c], R[c], env_rpb[c])', r'x2(rn, bl[c], R[c], env_rpb[c], ip[c])'),
        (r'er=A("env_rpb"))', r'er=A("env_rpb"), ip=(b.tier == "IPL").values.astype(float))'),
        (r'S["bl"] - l, S["tg"], S["ef"], S["er"])', r'S["bl"] - l, S["tg"], S["ef"], S["er"], S["ip"])'),
        (r'b["wp0"] = WP(S["inn"], S["runs"], S["wk"], S["bl"], S["tg"], S["ef"], S["er"])', r'b["wp0"] = WP(S["inn"], S["runs"], S["wk"], S["bl"], S["tg"], S["ef"], S["er"], S["ip"])'),
        (r'np.full(n, ef), np.full(n, er)); w0 = WP(*a)', r'np.full(n, ef), np.full(n, er), np.ones(n)); w0 = WP(*a)'),
        (r'a[4], a[5], a[6]) - w0)', r'a[4], a[5], a[6], a[7]) - w0)'),
        (r'names=["z", "z_x_progress", "wk_x_remaining"]', r'names=["z", "z_x_progress", "wk_x_remaining", "ipl", "ipl_x_z"]'),
        (r'names=["log_need_over_resource", "that_x_log_balls", "rrr_minus_env", "last12_x_that"]', r'names=["log_need_over_resource", "that_x_log_balls", "rrr_minus_env", "last24_ramp_x_that", "ipl", "ipl_x_that"]'),
        # P18: resources in the Duckworth-Lewis form, fitted by least squares; smooth and monotone by construction
        (r'''    res = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.05, num_leaves=15, min_child_samples=200, monotone_constraints=[1, 1, 1], **lk)
    res.fit(f1[["bl", "wih", "envf"]].values, (f1.inn_total - f1.runs_before).values)
    def Rf(bl, wih, envf):
        r = res.predict(np.column_stack([bl, wih, envf])); return np.where((bl <= 0) | (wih <= 0), 0.0, np.maximum(r, 0.0))''',
         r'''    from scipy.optimize import least_squares
    U = f1.bl.values.astype(float); Wk = f1.wih.values.astype(int); Y = (f1.inn_total - f1.runs_before).values / f1.envf.values
    def Fw(p): inc = np.concatenate([[p[2]], p[3:]]); c = np.cumsum(inc); return c / c[-1]
    def Zf(p, u, w): F = Fw(p)[w - 1]; return p[0] * F * (1 - np.exp(-p[1] * u / F))
    fit = least_squares(lambda p: Zf(p, U, Wk) - Y, x0=np.r_[250.0, 0.01, np.full(10, 0.1)], bounds=(np.r_[1.0, 1e-4, np.full(10, 1e-4)], np.r_[1000.0, 1.0, np.full(10, 10.0)]))
    PR = fit.x; globals()["DLPAR"] = dict(Z0=float(PR[0]), b=float(PR[1]), F=[float(v) for v in Fw(PR)])
    def Rf(bl, wih, envf):
        w = np.clip(np.asarray(wih).astype(int), 1, 10); r = Zf(PR, np.maximum(np.asarray(bl, float), 0.0), w) * np.asarray(envf, float); return np.where((np.asarray(bl) <= 0) | (np.asarray(wih) <= 0), 0.0, np.maximum(r, 0.0))'''),
        # P19: configuration of the 17 Nov decisions
        (r'min_p=120, min_o=120', r'min_p=110, min_o=110'),
        (r'excluded_nations=["Pakistan"])', r'excluded_nations=["Pakistan"], ineligible={1318: "Retired from the IPL", 8: "Retired from the IPL", 6280: "Banned from the 2027 IPL"}, bar_dips=True, half_life={"bat": 365, "bowl": 1095}, rec_ref=None, version="v2")'),
        # P23: recency weighting; a ball's weight halves every half_life days before the latest match in the data (batters 1 year, bowlers 3 years, chosen by the out-of-time test)
        (r'def agg(core, role, tierw=True):', r'''def rec(d, role):
    hl = CFG["half_life"][role]
    if not hl: return 1.0
    ref = pd.Timestamp(CFG["rec_ref"] or REFDATE)
    return 0.5 ** ((ref - pd.to_datetime(d.match_date)).dt.days.clip(lower=0).values / hl)
def agg(core, role, tierw=True):'''),
        (r'"w": d.w.values if tierw else 1.0,', r'"w": (d.w.values if tierw else 1.0) * rec(d, role),'),
        (r'w = d.w.values; v = d[vc].values', r'w = d.w.values * rec(d, role); v = d[vc].values'),
        (r'WP, Rf, val, coef = fit_wp(b)', r'REFDATE = str(b.match_date.max()); WP, Rf, val, coef = fit_wp(b)'),
        (r'", ".join(v)] for k, v in CFG.items()]', r'", ".join(str(x) for x in v)] for k, v in CFG.items()]'),
        # P20: barred players (retired from the IPL, or Dips) keep their record but take no rank; rank_pre is the rank before the bars
        (r'RT = {}; PRI = {}; SH = {}; TOP = {}; FUN = {}',
         r'''INEL = {int(k): v for k, v in CFG["ineligible"].items()}
if (MODEL / "inputs" / "ineligible.csv").exists(): INEL.update({int(r_.player_id): str(r_.reason) for r_ in pd.read_csv(MODEL / "inputs" / "ineligible.csv").itertuples()})
RET = set(INEL)
RT = {}; PRI = {}; SH = {}; TOP = {}; FUN = {}'''),
        (r'R["eligible"] = R.qualified & R.active & ~R.nation.isin(CFG["excluded_nations"])',
         r'R["eligible_pre"] = R.qualified & R.active & ~R.nation.isin(CFG["excluded_nations"]); R["barred"] = np.where(R.index.isin(list(RET)), pd.Series(R.index).map(INEL).fillna("").values, np.where(CFG["bar_dips"] & (R.lift_class == "Dips"), "Dips under pressure", "")); R["eligible"] = R.eligible_pre & (R.barred == ""); Pre = R[R.eligible_pre].sort_values("floor", ascending=False); R["rank_pre"] = np.nan; R.loc[Pre.index, "rank_pre"] = np.arange(1, len(Pre) + 1)'),
        (r'int(R.eligible.sum())]', r'int(R.eligible_pre.sum()), int(R.eligible.sum())]'),
        (r'FUN[r][4] >= 60', r'FUN[r][5] >= 60'),
        (r'eligible=bool(r["eligible"]),', r'eligible=bool(r["eligible"]), barred=r["barred"], rank_pre=None if r["rank_pre"] != r["rank_pre"] else int(r["rank_pre"]),'),
        (r'"Qualified (120 and 120)", "And active", "And IPL-eligible"]', r'"Qualified (110 and 110)", "And active", "And IPL-eligible", "And not barred"]'),
        # P21: new checks, the out-of-time test, gate sensitivity, barred players and the edge-case ledger
        (r'ck("every dashboard record is JSON safe"',
         r'''GRID = chase_grid()
ck("chase win probability never falls as balls left rise", sum(int((np.diff(np.array(GRID["wp"][w]), axis=1) < -5).sum()) for w in GRID["wp"]) == 0)
BIAS = {f"{i}|{p}|{t}": float(q.wp0.mean() - q.batwin.mean()) for (i, p, t), q in b[b.decided].groupby(["innings", "phase", "tier"])}
ck("calibration bias under 0.02 in every innings, phase and tier cell", max(abs(v) for v in BIAS.values()) < 0.02)
EDGE = dict(reduced_inferred=sorted(int(x) for x in RED), dls_chases_dropped=sorted(int(x) for x in DLSU), retired_out_rows=int((b.dismissal_type == "Retire Out").sum()), retired_out_charged=int(((b.dismissal_type == "Retire Out") & (b.st_out > 0)).sum()),
            wide_stumpings=int((b.extras_type.eq("wide") & (b.st_out > 0)).sum()), wide_stumpings_charged=int((b.extras_type.eq("wide") & (b.st_out > 0) & b.d_bat.notna()).sum()), matches_not_decided=int(b[~b.decided].match_id.nunique()))
ck("edge cases handled: shortened matches inferred, retired out not charged, stumpings off wides charged", len(EDGE["reduced_inferred"]) >= 1 and EDGE["retired_out_charged"] == 0 and EDGE["wide_stumpings_charged"] == EDGE["wide_stumpings"])
ck("no barred player in a top 10", all((TOP[r].barred == "").all() for r in TOP))
def oot(cut="2025-01-01"):
    CFG["rec_ref"] = cut; out = {}; E0 = b[~b.dead & (b.match_date < cut)].copy(); L0 = core[core.match_date >= cut]
    for r_ in ("bat", "bowl"): E0["v_" + r_] = E0["u_" + r_] - E0.groupby(["innings", "phase", "band", "pace_or_spin"])["u_" + r_].transform("mean")
    apply_opp(E0, opp_effects(E0))
    for r_ in ("bat", "bowl"):
        Re, sP, sO = agg(E0, r_); pr_ = fit_prior(Re, sP, sO); Re["epp"], Re["sd"], _ = eb(Re.xP.values, Re.xO.values, Re.neP.fillna(0).values, Re.neO.fillna(0).values, sP, sO, pr_); Re["floor"] = Re.epp - CFG["floor_z"] * Re.sd
        Re["all"] = (Re.xP * Re.neP + Re.xO * Re.neO) / (Re.neP + Re.neO); Rl, _, _ = agg(L0, r_)
        j = Re.join(Rl[["xP", "nP", "xO", "nO"]], rsuffix="_l"); j = j[(j.nP >= 60) & (j.nO >= 60) & (j.nP_l >= 60)]; w_ = j.nP_l.values; y_ = j.xP_l.values
        def wc(x):
            x = np.asarray(x, float); mx, my = np.average(x, weights=w_), np.average(y_, weights=w_); return float(np.average((x - mx) * (y_ - my), weights=w_) / np.sqrt(np.average((x - mx) ** 2, weights=w_) * np.average((y_ - my) ** 2, weights=w_)))
        def top(c): t_ = j.sort_values(c, ascending=False).head(10); return float(np.average(t_.xP_l, weights=t_.nP_l))
        out[r_] = dict(players=int(len(j)), corr={k: wc(v) for k, v in (("raw_pressure", j.xP), ("raw_ordinary", j.xO), ("all_balls", j["all"]), ("expected", j.epp), ("floor", j.floor), ("raw_lift", j.xP - j.xO))},
                       lift_persist=float(np.corrcoef(j.xP - j.xO, j.xP_l - j.xO_l)[0, 1]), top10_future={k: top(c) for k, c in (("raw_pressure", "xP"), ("floor", "floor"), ("expected", "epp"), ("all_balls", "all"))}, pool_future=float(np.average(y_, weights=w_)))
    CFG["rec_ref"] = None; return out
OOT = oot()
HLT = {}; _hl = dict(CFG["half_life"])
for hl_ in (None, 1095, 730, 365, 180):
    CFG["half_life"] = {"bat": hl_, "bowl": hl_}; o_ = oot(); HLT[str(hl_) if hl_ else "none"] = {r_: dict(corr=o_[r_]["corr"]["floor"], top10=o_[r_]["top10_future"]["floor"], pool=o_[r_]["pool_future"]) for r_ in o_}
CFG["half_life"] = _hl
GATES = {}
_keep = (CFG["min_p"], CFG["min_o"])
for gt in (100, 110, 120, 140):
    CFG["min_p"] = CFG["min_o"] = gt; GATES[gt] = {}
    for r_ in ("bat", "bowl"):
        R2, _, _, _ = rate(core, r_); R2 = R2.join(RT[r_][["name", "nation", "active"]]); el = R2[R2.qualified & R2.active & ~R2.nation.isin(CFG["excluded_nations"]) & ~R2.index.isin(list(RET)) & ~(CFG["bar_dips"] & (R2.lift_class == "Dips"))].copy()
        GATES[gt][r_] = list(el.sort_values("floor", ascending=False).name.head(10))
CFG["min_p"], CFG["min_o"] = _keep
BARRED = {r_: [[str(x["name"]), int(x["rank_pre"]), str(x["barred"]), float(x["lift_z"])] for _, x in RT[r_][(RT[r_].barred != "") & (RT[r_].rank_pre <= 30)].sort_values("rank_pre").iterrows()] for r_ in ("bat", "bowl")}
ck("every dashboard record is JSON safe"'''),
        # P22: carry the new results into the deck values, the outputs and the tables
        (r'OUT = dict(meta=dict(model=', r'''DECK.update(oot={r_: dict(players=OOT[r_]["players"], top_raw=f'{OOT[r_]["top10_future"]["raw_pressure"]:.3f}', top_floor=f'{OOT[r_]["top10_future"]["floor"]:.3f}', pool=f'{OOT[r_]["pool_future"]:.3f}', corr_raw=f2(OOT[r_]["corr"]["raw_pressure"]), corr_floor=f2(OOT[r_]["corr"]["floor"]), lift=sg(OOT[r_]["lift_persist"])) for r_ in OOT},
            gates={str(k): v for k, v in GATES.items()}, barred=BARRED, edge=EDGE, bias_max=f"{max(abs(v) for v in BIAS.values()):.3f}", gate=str(CFG["min_p"]), dl=DLPAR, half_life=CFG["half_life"], hl_test=HLT)
OUT = dict(meta=dict(model='''),
        (r'T = "# Model tables', r'''OUT["validation"].update(oot=OOT, bias=BIAS, gates={str(k): v for k, v in GATES.items()}, edge=EDGE, barred=BARRED, resources=DLPAR, half_life_test=HLT)
T = "# Model tables'''),
        (r'wr(MODEL / "model_outputs.json", OUT)', r'''T += mdt("T19. Out-of-time test: ratings from 2022 to 2024 against pressure value in 2025 to 2026", ["Role", "Players", "Corr, raw pressure", "Corr, raw ordinary", "Corr, all balls", "Corr, expected value", "Corr, floor", "Corr, raw lift", "Lift early against late", "Top 10 by raw pressure, later value", "Top 10 by floor, later value", "Pool average, later value"],
    [[r_, v["players"], sg(v["corr"]["raw_pressure"]), sg(v["corr"]["raw_ordinary"]), sg(v["corr"]["all_balls"]), sg(v["corr"]["expected"]), sg(v["corr"]["floor"]), sg(v["corr"]["raw_lift"]), sg(v["lift_persist"]), sg(v["top10_future"]["raw_pressure"], 3), sg(v["top10_future"]["floor"], 3), sg(v["pool_future"], 3)] for r_, v in OOT.items()])
T += mdt("T20. Edge cases and how the model treats them", ["Case", "Count or ids", "Treatment"], [["Shortened matches with no revision recorded", ", ".join(str(x) for x in EDGE["reduced_inferred"]), "Both innings capped at the first innings length, rounded up to a full over"], ["DLS chases with no revised target", ", ".join(str(x) for x in EDGE["dls_chases_dropped"]), "Chase innings dropped from valuation and training"], ["Retired out", EDGE["retired_out_rows"], "Not charged to the batter or the bowler"], ["Stumpings off wides", EDGE["wide_stumpings"], "Charged to the batter with no runs and no ball used"], ["Matches not decided (ties, super overs, no result)", EDGE["matches_not_decided"], "Valued ball by ball, never used to train win probability"]])
T += mdt("T21. Top 10 at four sample gates (balls of each kind)", ["Gate", "Batters", "Bowlers"], [[k, ", ".join(v["bat"]), ", ".join(v["bowl"])] for k, v in GATES.items()])
T += mdt("T22. Rated players barred from a top-10 place", ["Role", "Player", "Rank before the bar", "Reason", "Lift z"], [[r_, n, rp, why, sg(z)] for r_ in BARRED for n, rp, why, z in BARRED[r_]])
T += mdt("T24. Choosing the recency half-life: ratings from 2022 to 2024 weighted toward 1 Jan 2025, against pressure value in 2025 to 2026", ["Half-life", "Batters: corr", "Batters: top 10 later", "Bowlers: corr", "Bowlers: top 10 later", "Pool later, batters", "Pool later, bowlers"], [[k, sg(v["bat"]["corr"]), sg(v["bat"]["top10"], 3), sg(v["bowl"]["corr"]), sg(v["bowl"]["top10"], 3), sg(v["bat"]["pool"], 3), sg(v["bowl"]["pool"], 3)] for k, v in HLT.items()])
T += mdt("T23. Resources curve (Duckworth-Lewis form fitted to this data)", ["Parameter", "Value"], [["Z0, runs from a full innings in the average environment", f'{DLPAR["Z0"]:.1f}'], ["b, decay rate", f'{DLPAR["b"]:.4f}']] + [[f"F({w}), share of full resources with {w} wickets in hand", f"{v:.3f}"] for w, v in enumerate(DLPAR["F"], 1)])
wr(MODEL / "model_outputs.json", OUT)'''),
        (r'wr(PUB / "grid.json", chase_grid())', r'wr(PUB / "grid.json", GRID)'),
        # P24: consistency across matches (evidence only, never used to rank): pressure matches with 4 or more pressure balls, share with a positive contribution, decisive matches (own pressure balls added 15 or more win-probability points), worst match
        (r'REC = {r: records(r) for r in ("bat", "bowl")}', r'''def consistency(role):
    idc, _, dc = ROLE[role]; q = core[core.hp & core[dc].notna()].groupby([idc, "match_id"])[dc].agg(["sum", "size"]); q = q[q["size"] >= 4]; q["pts"] = q["sum"] * 100
    g_ = q.groupby(level=0).pts; return pd.DataFrame({"pm": g_.size(), "pos_share": g_.apply(lambda s: float((s > 0).mean())), "decisive": g_.apply(lambda s: int((s >= 15).sum())), "costly": g_.apply(lambda s: int((s <= -15).sum())), "worst": g_.min(), "best": g_.max()})
CONS = {r_: consistency(r_) for r_ in ("bat", "bowl")}
REC = {r: records(r) for r in ("bat", "bowl")}'''),
        (r'd["splits"] = {k: S[k].get(pid, []) for k in SPLITKEYS}; d["matches"] = TM.get(pid, []); out.append(d)',
         r'c_ = CONS[role].loc[pid] if pid in CONS[role].index else None; d.update(pm=int(c_.pm) if c_ is not None else 0, pos_share=float(c_.pos_share) if c_ is not None else None, decisive=int(c_.decisive) if c_ is not None else 0, costly=int(c_.costly) if c_ is not None else 0, worst=float(c_.worst) if c_ is not None else None, best=float(c_.best) if c_ is not None else None); d["splits"] = {k: S[k].get(pid, []) for k in SPLITKEYS}; d["matches"] = TM.get(pid, []); out.append(d)'),
        (r'T += mdt("T24. Choosing the recency half-life', r'''T += mdt("T25. Consistency across matches for the two top 10s (matches with 4 or more pressure balls; decisive means the player's own pressure balls added 15 or more win-probability points, costly means they cost 15 or more)", ["Role", "Rank", "Player", "Pressure matches", "Share helping", "Decisive", "Costly", "Best match, points", "Worst match, points"],
    [[r_, d_["rank"], d_["name"], d_["pm"], f'{100 * d_["pos_share"]:.0f}%' if d_["pos_share"] is not None else "n/a", d_["decisive"], d_["costly"], sg(d_["best"], 1) if d_["best"] is not None else "n/a", sg(d_["worst"], 1) if d_["worst"] is not None else "n/a"] for r_ in ("bat", "bowl") for d_ in sorted([x for x in REC[r_] if x["rank"] and x["rank"] <= 10], key=lambda x: x["rank"])])
T += mdt("T24. Choosing the recency half-life'''),
        (r'print("MODEL PASS" if all(CHECKS.values()) else "MODEL FAIL")', r'''print("OUT OF TIME", {r_: (OOT[r_]["top10_future"]["raw_pressure"], OOT[r_]["top10_future"]["floor"], OOT[r_]["pool_future"]) for r_ in OOT}, "| GATE", CFG["min_p"], "| BARRED", {r_: [x[0] for x in BARRED[r_]] for r_ in BARRED})
print("MODEL PASS" if all(CHECKS.values()) else "MODEL FAIL")'''),
    ]

if __name__ == "__main__":
    ROOT = pathlib.Path(__file__).resolve().parent.parent; F = ROOT / "model" / "pressure_model.py"; src = F.read_text(encoding="utf-8")
    if 'version="v2"' in src: sys.exit("already patched: model/pressure_model.py is v2")
    v1 = src
    for i, (a, c) in enumerate(patches(), 1):
        n = src.count(a)
        if n != 1: sys.exit(f"patch {i} matched {n} times, nothing written: {a[:80]}")
        src = src.replace(a, c)
    (ROOT / "model" / "pressure_model.v1.py").write_text(v1, encoding="utf-8", newline="\n"); F.write_text(src, encoding="utf-8", newline="\n"); print("PATCHED", len(patches()), "replacements; v1 kept as model/pressure_model.v1.py")
