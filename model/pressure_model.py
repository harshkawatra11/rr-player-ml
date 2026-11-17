"""SupeRR Selector Season 2 pressure model. Single source of truth for every number in the research, the dashboard and the deck.
Run from the project root:  python -X utf8 model/pressure_model.py      (RR_DRY=1 computes and prints, writes nothing)
Reads  raw-data/*.csv, model/inputs/nation_overrides.csv (optional), model/inputs/availability.csv (optional)
Writes model/model_outputs.json, model/model_tables.md, model/out/balls.pkl, public/data/{meta,batters,bowlers,teams,grid,showcase}.json
Nothing ball-level is written under public/. No dashes anywhere: the minus sign is U+2212."""
import os, json, hashlib, time, warnings, pathlib
import numpy as np, pandas as pd
from scipy import sparse
from scipy.stats import spearmanr
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import GroupKFold
from sklearn.metrics import log_loss, brier_score_loss, roc_auc_score
import lightgbm as lgb
warnings.filterwarnings("ignore")
ROOT = pathlib.Path(os.environ["RR_ROOT"]) if os.environ.get("RR_ROOT") else pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "raw-data"; MODEL = ROOT / "model"; PUB = ROOT / "public" / "data"; DRY = os.environ.get("RR_DRY") == "1"; T0 = time.time()
CFG = dict(seed=20261114, dead_lo=0.03, dead_hi=0.97, w_swing=0.50, w_balance=0.20, w_clock=0.15, w_wstress=0.15, ko_uplift=0.15,
           hp_thr=75.0, ext_thr=90.0, swing_floor_q=0.05, ridge_alpha=400.0, min_p=110, min_o=110, show_min=40,
           active_since="2025-06-01", floor_z=0.84, lift_z=1.28, w_ipl=1.0, w_full=0.85, w_assoc=0.60, boot=400,
           full_members=["India", "Pakistan", "West Indies", "New Zealand", "Bangladesh", "Sri Lanka", "England", "Afghanistan", "Australia", "Zimbabwe", "South Africa", "Ireland"],
           excluded_nations=["Pakistan"], ineligible={1318: "Retired from the IPL", 8: "Retired from the IPL", 6280: "Banned from the 2027 IPL"}, bar_dips=True, half_life={"bat": 365, "bowl": 1095}, rec_ref=None, version="v2")
CHECKS = {}
def ck(name, ok): CHECKS[name] = bool(ok); print(("PASS " if ok else "FAIL ") + name)
def grp(n):
    s = str(int(round(abs(n))))
    if len(s) > 3: h, t = s[:-3], s[-3:]; h = ",".join([h[max(i - 2, 0):i] for i in range(len(h), 0, -2)][::-1]); s = h + "," + t
    return ("−" if n < 0 else "") + s
def sg(x, dp=2):
    v = round(float(x), dp); return ("+" if v > 0 else "−" if v < 0 else "") + f"{abs(v):.{dp}f}"
def J(o):
    if isinstance(o, dict): return {str(k): J(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [J(v) for v in o]
    if isinstance(o, np.bool_): return bool(o)
    if isinstance(o, np.integer): return int(o)
    if isinstance(o, (float, np.floating)): return None if (o != o or abs(o) == float("inf")) else round(float(o), 4)
    return o
def wr(path, obj):
    text = obj if isinstance(obj, str) else json.dumps(J(obj), ensure_ascii=False, separators=(",", ":"))
    if DRY: print("dry", path.relative_to(ROOT).as_posix(), len(text)); return
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(text, encoding="utf-8", newline="\n"); print("wrote", path.relative_to(ROOT).as_posix(), len(text))
def mdt(title, heads, rows): return "## " + title + "\n\n| " + " | ".join(heads) + " |\n|" + "---|" * len(heads) + "\n" + "\n".join("| " + " | ".join(str(c) for c in r) + " |" for r in rows) + "\n\n"

# ---------- 1. load and rebuild the match state before every ball ----------
def load():
    comp = pd.read_csv(RAW / "competitions.csv"); m = pd.read_csv(RAW / "matches.csv"); t = pd.read_csv(RAW / "teams.csv")
    mp = pd.read_csv(RAW / "competition_team_player_mapping.csv"); b = pd.read_csv(RAW / "ball_by_ball.csv", low_memory=False); n_raw = len(b)
    m = m.merge(comp, on="comp_id", how="left"); tn = t.drop_duplicates("team_id").set_index("team_id").team_name
    m["tier"] = np.where(m.comp_name.str.startswith("IPL"), "IPL", np.where(m.match_format == "T20I", "T20I", "EMG"))
    full = set(CFG["full_members"]); m["assoc"] = ~(m.home_team.isin(full) & m.away_team.isin(full))
    m["w"] = np.where(m.tier == "IPL", CFG["w_ipl"], np.where(m.assoc, CFG["w_assoc"], CFG["w_full"]))
    m["ko"] = ((m.knock_out == 1) | m.stage.isin(["Final", "Qualifier", "Eliminator", "Semi Final"])).astype(int)
    b = b[b.innings <= 2].sort_values(["match_id", "innings", "innings_ball_num"]).reset_index(drop=True)
    b["illegal"] = b.extras_type.isin(["wide", "Overstep", "other"]); b["legal"] = (~b.illegal).astype(int)
    b["tot"] = b.runs + b.extras1_runs + b.extras_2_runs; b["wk"] = b.is_wicket.astype(int)
    g = b.groupby(["match_id", "innings"])
    b["runs_before"] = g.tot.cumsum() - b.tot; b["wk_before"] = g.wk.cumsum() - b.wk; b["legal_before"] = g.legal.cumsum() - b.legal
    b["inn_total"] = g.tot.transform("sum")
    b = b.merge(m[["match_id", "tier", "season", "w", "ko", "win_team_id", "first_inn_revised_overs", "second_inn_revised_overs", "revised_target", "result", "comp_name", "match_date"]], on="match_id", how="left")
    t1 = b[b.innings == 1].groupby("match_id").tot.sum().rename("t1"); b = b.merge(t1, on="match_id", how="left")
    L1 = b[b.innings == 1].groupby("match_id").agg(l1=("legal", "sum"), w1=("wk", "sum")); res = b.groupby("match_id").result.first(); rev = b.groupby("match_id").first_inn_revised_overs.first()
    RED = set(L1[(L1.l1 <= 114) & (L1.w1 < 10)].index) & set(res[~res.str.contains("No Result|Abandon", case=False)].index) & set(rev[rev.isna()].index); cap = (np.ceil(L1.l1 / 6) * 6).to_dict()
    fio = b.first_inn_revised_overs.copy(); sio = b.second_inn_revised_overs.copy(); mk = b.match_id.isin(RED); fio[mk] = b.match_id[mk].map(cap); sio[mk] = b.match_id[mk].map(cap)
    DLSU = set(b.loc[b.result.str.contains("D/L|DLS", case=False) & b.revised_target.isna(), "match_id"]); b = b[~((b.innings == 2) & b.match_id.isin(DLSU))].copy(); fio = fio[b.index]; sio = sio[b.index]
    globals()["RED"] = RED; globals()["DLSU"] = DLSU
    b["maxballs"] = np.where(b.innings == 1, fio.fillna(120), sio.fillna(120)); b["reduced"] = fio.notna().values
    b["bl"] = (b.maxballs - b.legal_before).astype(float); b["wih"] = (10 - b.wk_before).astype(float)
    b["target"] = np.where(b.innings == 2, b.revised_target.fillna(b.t1 + 1), 0.0); b["rn"] = b.target - b.runs_before
    b["batwin"] = (b.win_team_id == b.batting_team_id).astype(float)
    b["decided"] = b.win_team_id.notna() & ~b.result.str.contains(r"\bTie|Super Over|No Result|Abandon|one over", case=False)
    it = b.groupby(["match_id", "innings"]).tot.sum().unstack(); mi = m.set_index("match_id"); mg = mi.result.str.extract(r"(\d+)\s*(?i:run)")[0].astype(float)
    rr = pd.DataFrame({"d": it[1] - it[2], "mg": mg, "rev": mi.revised_target}).dropna(subset=["d", "mg"]); rr = rr[rr.rev.isna()]; recon = float((rr.d == rr.mg).mean())
    n_matches_raw = int(b.match_id.nunique()); n_emg = int((b.tier == "EMG").sum())
    b = b[(b.tier != "EMG") & (b.bl > 0) & (b.wih > 0) & ((b.innings == 1) | ((b.rn > 0) & b.t1.notna()))].copy()
    env = b[b.innings == 1].groupby(["tier", "season"]).agg(r=("tot", "sum"), l=("legal", "sum")); env["env_rpb"] = env.r / env.l
    b = b.merge(env[["env_rpb"]].reset_index(), on=["tier", "season"], how="left"); glob = b[b.innings == 1].tot.sum() / b[b.innings == 1].legal.sum(); b["envf"] = b.env_rpb / glob
    b["phase"] = np.select([b.overid <= 6, b.overid <= 15], ["PP", "MID"], "DEATH")
    return b.reset_index(drop=True), m, tn, mp, dict(n_raw=n_raw, recon=recon, glob_rpb=float(glob), env=env.reset_index(), n_matches_raw=n_matches_raw, n_emg=n_emg)

# ---------- 2. resources and win probability ----------
def x2(rn, bl, R, env_rpb, ip):
    lr = np.log(np.maximum(rn, 0.5) / (R + 1.0)); return np.column_stack([lr, lr * np.log1p(np.maximum(bl, 0)) / np.log(121), np.clip(6 * rn / np.maximum(bl, 1), 0, 36) / 6 - env_rpb, np.clip((24 - bl) / 24, 0, 1) * lr, ip, ip * lr])
def x1(runs, wk, bl, R, env_rpb, ip):
    par = env_rpb * 120; z = (runs + R - par) / par; return np.column_stack([z, z * (1 - bl / 120), wk / 10 * (bl / 120), ip, ip * z])
def fit_wp(b):
    lk = dict(random_state=CFG["seed"], n_jobs=1, deterministic=True, force_row_wise=True, verbose=-1)
    f1 = b[(b.innings == 1) & ~b.reduced]
    from scipy.optimize import least_squares
    U = f1.bl.values.astype(float); Wk = f1.wih.values.astype(int); Y = (f1.inn_total - f1.runs_before).values / f1.envf.values
    def Fw(p): inc = np.concatenate([[p[2]], p[3:]]); c = np.cumsum(inc); return c / c[-1]
    def Zf(p, u, w): F = Fw(p)[w - 1]; return p[0] * F * (1 - np.exp(-p[1] * u / F))
    fit = least_squares(lambda p: Zf(p, U, Wk) - Y, x0=np.r_[250.0, 0.01, np.full(10, 0.1)], bounds=(np.r_[1.0, 1e-4, np.full(10, 1e-4)], np.r_[1000.0, 1.0, np.full(10, 10.0)]))
    PR = fit.x; globals()["DLPAR"] = dict(Z0=float(PR[0]), b=float(PR[1]), F=[float(v) for v in Fw(PR)])
    def Rf(bl, wih, envf):
        w = np.clip(np.asarray(wih).astype(int), 1, 10); r = Zf(PR, np.maximum(np.asarray(bl, float), 0.0), w) * np.asarray(envf, float); return np.where((np.asarray(bl) <= 0) | (np.asarray(wih) <= 0), 0.0, np.maximum(r, 0.0))
    b["R"] = Rf(b.bl.values, b.wih.values, b.envf.values)
    d1 = b[(b.innings == 1) & b.decided]; d2 = b[(b.innings == 2) & b.decided]
    F1 = x1(d1.runs_before.values.astype(float), d1.wk_before.values.astype(float), d1.bl.values, d1.R.values, d1.env_rpb.values, (d1.tier == "IPL").values.astype(float))
    F2 = x2(d2.rn.values.astype(float), d2.bl.values, d2.R.values, d2.env_rpb.values, (d2.tier == "IPL").values.astype(float)); val = {}
    for nm, F, d, cols, mono in [("inn1", F1, d1, ["runs_before", "bl", "wih", "envf"], [1, 1, 1, -1]), ("inn2", F2, d2, ["rn", "bl", "wih", "envf"], [-1, 1, 1, 0])]:
        y = d.batwin.values; oof = np.zeros(len(d)); oog = np.zeros(len(d))
        for tr, te in GroupKFold(5).split(F, y, d.match_id.values):
            oof[te] = LogisticRegression(max_iter=3000).fit(F[tr], y[tr]).predict_proba(F[te])[:, 1]
            oog[te] = lgb.LGBMClassifier(n_estimators=200, learning_rate=0.03, num_leaves=8, min_child_samples=400, monotone_constraints=mono, **lk).fit(d[cols].values[tr], y[tr]).predict_proba(d[cols].values[te])[:, 1]
        cal = pd.DataFrame({"p": oof, "y": y}); cal["bin"] = np.minimum((cal.p * 10).astype(int), 9); cb = cal.groupby("bin").agg(n=("y", "size"), pred=("p", "mean"), act=("y", "mean")).reset_index(); big = cb[cb.n >= 1500]
        val[nm] = dict(balls=int(len(d)), matches=int(d.match_id.nunique()), base_rate=float(y.mean()), ll=float(log_loss(y, oof)), brier=float(brier_score_loss(y, oof)), auc=float(roc_auc_score(y, oof)),
                       ll_gbm=float(log_loss(y, oog)), brier_gbm=float(brier_score_loss(y, oog)), auc_gbm=float(roc_auc_score(y, oog)), ll_base=float(log_loss(y, np.full(len(y), y.mean()))),
                       cal=[[int(r.bin), int(r.n), float(r.pred), float(r.act)] for r in cb.itertuples()], cal_gap=float((big.pred - big.act).abs().max()))
    m1 = LogisticRegression(max_iter=3000).fit(F1, d1.batwin.values); m2 = LogisticRegression(max_iter=3000).fit(F2, d2.batwin.values)
    def WP(inn, runs, wk, bl, target, envf, env_rpb, ip):
        wih = 10 - wk; R = Rf(bl, wih, envf); p = np.zeros(len(inn)); a = inn == 1; c = ~a
        if a.any(): p[a] = m1.predict_proba(x1(runs[a], wk[a], bl[a], R[a], env_rpb[a], ip[a]))[:, 1]
        if c.any():
            rn = target[c] - runs[c]; pc = m2.predict_proba(x2(rn, bl[c], R[c], env_rpb[c], ip[c]))[:, 1]; done = (bl[c] <= 0) | (wih[c] <= 0)
            p[c] = np.where(rn <= 0, 1.0, np.where(done, np.where(rn == 1, 0.5, 0.0), pc))
        return p
    coef = dict(inn1=dict(names=["z", "z_x_progress", "wk_x_remaining", "ipl", "ipl_x_z"], coef=[float(v) for v in m1.coef_[0]], intercept=float(m1.intercept_[0])),
                inn2=dict(names=["log_need_over_resource", "that_x_log_balls", "rrr_minus_env", "last24_ramp_x_that", "ipl", "ipl_x_that"], coef=[float(v) for v in m2.coef_[0]], intercept=float(m2.intercept_[0])))
    return WP, Rf, val, coef

# ---------- 3. swing (expected win-probability movement of one ball), credits, and the Pressure Index ----------
OC = {"wd": (1, 0, 0), "W": (0, 1, 1), "0": (0, 0, 1), "1": (1, 0, 1), "2": (2, 0, 1), "4": (4, 0, 1), "6": (6, 0, 1)}
def add_swing(b, WP):
    A = lambda c: b[c].values.astype(float); S = dict(inn=A("innings"), runs=A("runs_before"), wk=A("wk_before"), bl=A("bl"), tg=A("target"), ef=A("envf"), er=A("env_rpb"), ip=(b.tier == "IPL").values.astype(float))
    nxt = lambda r, w, l: WP(S["inn"], S["runs"] + r, S["wk"] + w, S["bl"] - l, S["tg"], S["ef"], S["er"], S["ip"])
    b["wp0"] = WP(S["inn"], S["runs"], S["wk"], S["bl"], S["tg"], S["ef"], S["er"], S["ip"])
    b["oc"] = np.select([b.extras_type.eq("wide"), b.is_wicket, b.runs.eq(0), b.runs.eq(1), b.runs.isin([2, 3]), b.runs.isin([4, 5]), b.runs.eq(6)], ["wd", "W", "0", "1", "2", "4", "6"], "0")
    P = b.groupby(["innings", "phase"]).oc.value_counts(normalize=True).unstack(fill_value=0); pk = b[["innings", "phase"]].merge(P.reset_index(), on=["innings", "phase"], how="left"); sw = np.zeros(len(b))
    for k, v in OC.items(): sw += pk[k].values * np.abs(nxt(*v) - b.wp0.values)
    b["swing"] = sw; b["dead"] = (b.wp0 < CFG["dead_lo"]) | (b.wp0 > CFG["dead_hi"])
    wide = b.extras_type.eq("wide").values; nb = b.extras_type.isin(["Overstep", "other"]).values; rb = b.runs.values.astype(float)
    b["st_out"] = (b.is_wicket & (b.dismissed_player_id.fillna(b.striker_id) == b.striker_id) & ~b.dismissal_type.eq("Retire Out")).values.astype(float)
    b["bw_out"] = (b.is_wicket & ~b.dismissal_type.isin(["RunOut", "Retire Out", "Obstracting the field", "Obstructing the field"])).values.astype(float)
    b["bowl_runs"] = rb + np.where(wide | nb, b.extras1_runs.values, 0.0)
    b["d_bat"] = np.where(wide & (b.st_out.values == 0), np.nan, nxt(np.where(wide, 0.0, rb), b.st_out.values, np.where(nb | wide, 0.0, 1.0)) - b.wp0.values)
    b["d_bowl"] = -(nxt(b.bowl_runs.values, b.bw_out.values, b.legal.values.astype(float)) - b.wp0.values)
    fl = b.swing.quantile(CFG["swing_floor_q"]); b["u_bat"] = b.d_bat / b.swing.clip(lower=fl); b["u_bowl"] = b.d_bowl / b.swing.clip(lower=fl)
    b["cS"] = b.swing.rank(pct=True); b["cB"] = 1 - (2 * b.wp0 - 1).abs(); b["cT"] = (b.legal_before / b.maxballs) ** 2
    ew = b.groupby(["innings", "overid"]).wk_before.transform("mean"); b["cW"] = ((b.wk_before - ew) / 3).clip(0, 1)
    return P
def set_pressure(b, ws, wb, wt, ww, ko, thr):
    raw = (ws * b.cS + wb * b.cB + wt * b.cT + ww * b.cW) * (1 + ko * b.ko); live = ~b.dead
    b["PI"] = np.nan; b.loc[live, "PI"] = raw[live].rank(pct=True) * 100; b["hp"] = b.PI >= thr
    b["band"] = np.select([b.PI >= 90, b.PI >= 75, b.PI >= 50], ["b4", "b3", "b2"], "b1")
    for r in ("bat", "bowl"): b["v_" + r] = b["u_" + r] - b[live].groupby(["innings", "phase", "band", "pace_or_spin"])["u_" + r].transform("mean")
    return raw

# ---------- 4. opposition adjustment and ratings ----------
def opp_effects(core):
    bi = {p: i for i, p in enumerate(core.striker_id.unique())}; wi = {p: i for i, p in enumerate(core.bowler_id.unique())}; out = {}
    for vc in ("v_bat", "v_bowl"):
        d = core[core[vc].notna()]; n = len(d); r = np.arange(n)
        X = sparse.hstack([sparse.csr_matrix((np.ones(n), (r, d.striker_id.map(bi).values)), shape=(n, len(bi))), sparse.csr_matrix((np.ones(n), (r, d.bowler_id.map(wi).values)), shape=(n, len(wi)))]).tocsr()
        c = Ridge(alpha=CFG["ridge_alpha"]).fit(X, d[vc].values, sample_weight=d.w.values).coef_
        out[vc] = (pd.Series(c[:len(bi)], index=list(bi)), pd.Series(c[len(bi):], index=list(wi)))
    return out
def apply_opp(core, eff, on=True):
    core["va_bat"] = core.v_bat - (core.bowler_id.map(eff["v_bat"][1]).values if on else 0.0)
    core["va_bowl"] = core.v_bowl - (core.striker_id.map(eff["v_bowl"][0]).values if on else 0.0)
ROLE = {"bat": ("striker_id", "va_bat", "d_bat"), "bowl": ("bowler_id", "va_bowl", "d_bowl")}
def rec(d, role):
    hl = CFG["half_life"][role]
    if not hl: return 1.0
    ref = pd.Timestamp(CFG["rec_ref"] or REFDATE)
    return 0.5 ** ((ref - pd.to_datetime(d.match_date)).dt.days.clip(lower=0).values / hl)
def agg(core, role, tierw=True):
    idc, vc, dc = ROLE[role]; d = core[core[vc].notna()]
    x = pd.DataFrame({"pid": d[idc].values, "hp": d.hp.values, "w": (d.w.values if tierw else 1.0) * rec(d, role), "v": d[vc].values, "dd": d[dc].values, "ipl": (d.tier == "IPL").values})
    x["wv"] = x.w * x.v; x["w2"] = x.w ** 2
    g = x.groupby(["pid", "hp"]).agg(n=("v", "size"), sw=("w", "sum"), swv=("wv", "sum"), sw2=("w2", "sum"), wpa=("dd", "sum"), ipl=("ipl", "sum")).unstack("hp").fillna(0.0)
    nz = lambda s: s.replace(0, np.nan)
    R = pd.DataFrame({"nP": g[("n", True)], "nO": g[("n", False)], "xP": g[("swv", True)] / nz(g[("sw", True)]), "xO": g[("swv", False)] / nz(g[("sw", False)]),
                      "neP": g[("sw", True)] ** 2 / nz(g[("sw2", True)]), "neO": g[("sw", False)] ** 2 / nz(g[("sw2", False)]),
                      "wpaP": g[("wpa", True)] * 100, "wpaAll": (g[("wpa", True)] + g[("wpa", False)]) * 100, "iplP": g[("ipl", True)]})
    return R, float(x[x.hp].v.std()), float(x[~x.hp].v.std())
def fit_prior(R, sdP, sdO):
    e = R[(R.nP >= CFG["min_p"]) & (R.nO >= CFG["min_o"])]; a = float(e.xP.var() - np.mean(sdP ** 2 / e.neP)); d = float(e.xO.var() - np.mean(sdO ** 2 / e.neO)); c = float(np.cov(e.xP, e.xO)[0, 1])
    a = max(a, 1e-5); d = max(d, 1e-5); lim = 0.95 * np.sqrt(a * d); c = float(np.clip(c, -lim, lim))
    return dict(muP=float(e.xP.mean()), muO=float(e.xO.mean()), a=a, d=d, c=c, tauP=float(np.sqrt(a)), tauO=float(np.sqrt(d)), rho=float(c / np.sqrt(a * d)), pool=int(len(e)))
def eb(xP, xO, neP, neO, sdP, sdO, pr):
    a, d, c = pr["a"], pr["d"], pr["c"]; s1 = sdP ** 2 / np.maximum(neP, 1e-9); s2 = sdO ** 2 / np.maximum(neO, 1e-9); det = (a + s1) * (d + s2) - c * c
    K11 = (a * (d + s2) - c * c) / det; K12 = c * s1 / det; K21 = c * s2 / det; K22 = (d * (a + s1) - c * c) / det; eP = np.nan_to_num(xP - pr["muP"]); eO = np.nan_to_num(xO - pr["muO"])
    pP = pr["muP"] + K11 * eP + K12 * eO; pO = pr["muO"] + K21 * eP + K22 * eO; V11 = a - (K11 * a + K12 * c)
    return pP, np.sqrt(np.maximum(V11, 0)), pO
def rate(core, role, tierw=True):
    R, sdP, sdO = agg(core, role, tierw); pr = fit_prior(R, sdP, sdO)
    R["epp"], R["sd"], R["opost"] = eb(R.xP.values, R.xO.values, R.neP.fillna(0).values, R.neO.fillna(0).values, sdP, sdO, pr)
    R["floor"] = R.epp - CFG["floor_z"] * R.sd; R["qualified"] = (R.nP >= CFG["min_p"]) & (R.nO >= CFG["min_o"])
    R["lift"] = R.xP - R.xO; R["lift_z"] = R.lift / np.sqrt(sdP ** 2 / R.neP + sdO ** 2 / R.neO)
    R["lift_class"] = np.select([R.lift_z > CFG["lift_z"], R.lift_z < -CFG["lift_z"]], ["Rises", "Dips"], "Steady")
    return R, pr, sdP, sdO
def split_half(core, role):
    idc, vc, _ = ROLE[role]; d = core[core[vc].notna()]; h = (d.match_id.rank(method="dense").astype(int) % 2).values
    x = pd.DataFrame({"pid": d[idc].values, "hp": d.hp.values, "h": h, "v": d[vc].values}); g = x.groupby(["pid", "hp", "h"]).v.agg(["mean", "size"]).unstack(["hp", "h"])
    ok = (g["size"] >= 50).all(axis=1); mm = g["mean"][ok]; P0, P1, O0, O1 = mm[(True, 0)], mm[(True, 1)], mm[(False, 0)], mm[(False, 1)]
    pts = [[float(a), float(b_), float(c), float(d_)] for a, b_, c, d_ in zip(P0, P1, O0, O1)]
    return dict(n=int(ok.sum()), r_pressure=float(P0.corr(P1)), r_ordinary=float(O0.corr(O1)), r_lift=float((P0 - O0).corr(P1 - O1)), r_cross=float((P0.corr(O1) + P1.corr(O0)) / 2), points=pts)
def bootstrap(core, role, pr, sdP, sdO, elig_ids):
    idc, vc, _ = ROLE[role]; d = core[core[vc].notna()]; rng = np.random.default_rng(CFG["seed"]); pid = pd.Categorical(d[idc]); mid = pd.Categorical(d.match_id); w = d.w.values * rec(d, role); v = d[vc].values; hp = d.hp.values
    def M(val, mask): return sparse.csr_matrix((val[mask], (pid.codes[mask], mid.codes[mask])), shape=(len(pid.categories), len(mid.categories)))
    A = {k: M(val, mk) for k, val, mk in [("swP", w, hp), ("svP", w * v, hp), ("s2P", w * w, hp), ("swO", w, ~hp), ("svO", w * v, ~hp), ("s2O", w * w, ~hp)]}
    pos = {p: i for i, p in enumerate(pid.categories)}; idx = np.array([pos[p] for p in elig_ids]); nm = len(mid.categories); ranks = np.zeros((CFG["boot"], len(idx)))
    for i in range(CFG["boot"]):
        k = rng.multinomial(nm, np.ones(nm) / nm).astype(float); s = {q: (A[q] @ k)[idx] for q in A}
        xP = s["svP"] / np.maximum(s["swP"], 1e-9); xO = s["svO"] / np.maximum(s["swO"], 1e-9); neP = s["swP"] ** 2 / np.maximum(s["s2P"], 1e-9); neO = s["swO"] ** 2 / np.maximum(s["s2O"], 1e-9)
        pP, sd, _ = eb(xP, xO, neP, neO, sdP, sdO, pr); ranks[i] = (-(pP - CFG["floor_z"] * sd)).argsort().argsort() + 1
    return pd.DataFrame({"p_top10": (ranks <= 10).mean(0), "p_top20": (ranks <= 20).mean(0), "rank_lo": np.percentile(ranks, 10, axis=0), "rank_hi": np.percentile(ranks, 90, axis=0)}, index=elig_ids)

# ---------- 5. run: state, win probability, pressure, ratings ----------
b, m, tn, mp, info = load(); print("loaded", len(b), "balls after filters; raw rows", info["n_raw"], "| reconciliation", round(info["recon"], 4))
REFDATE = str(b.match_date.max()); WP, Rf, val, coef = fit_wp(b); P = add_swing(b, WP)
BASE = (CFG["w_swing"], CFG["w_balance"], CFG["w_clock"], CFG["w_wstress"], CFG["ko_uplift"], CFG["hp_thr"]); RAWPI = set_pressure(b, *BASE)
core = b[~b.dead].copy(); eff = opp_effects(core); apply_opp(core, eff)
names = pd.concat([core[["striker_id", "striker_name"]].set_axis(["pid", "name"], axis=1), core[["bowler_id", "bowler_name"]].set_axis(["pid", "name"], axis=1)]).groupby("pid").name.agg(lambda s: s.mode().iat[0])
mpm = mp.merge(m[["comp_id", "tier", "season"]].drop_duplicates("comp_id"), on="comp_id", how="left")
nation = mpm[mpm.tier == "T20I"].groupby("player_id").team_name.agg(lambda s: s.mode().iat[0])
if (MODEL / "inputs" / "nation_overrides.csv").exists():
    ov = pd.read_csv(MODEL / "inputs" / "nation_overrides.csv").set_index("player_id").nation; nation = ov.combine_first(nation)
ipl_last = mpm[mpm.tier == "IPL"].sort_values("season").groupby("player_id").agg(ipl_team=("team_name", "last"), ipl_season=("season", "last"))
last = pd.concat([core.groupby("striker_id").match_date.max(), core.groupby("bowler_id").match_date.max()]).groupby(level=0).max()
hand = core.groupby("striker_id").batting_type.agg(lambda s: s.mode().iat[0]); btype = core.groupby("bowler_id").bowling_type.agg(lambda s: s.mode().iat[0]); bkind = core.groupby("bowler_id").pace_or_spin.agg(lambda s: s.mode().iat[0]); bpos = core.groupby("striker_id").batting_order.median()
INEL = {int(k): v for k, v in CFG["ineligible"].items()}
if (MODEL / "inputs" / "ineligible.csv").exists(): INEL.update({int(r_.player_id): str(r_.reason) for r_ in pd.read_csv(MODEL / "inputs" / "ineligible.csv").itertuples()})
RET = set(INEL)
RT = {}; PRI = {}; SH = {}; TOP = {}; FUN = {}
for role in ("bat", "bowl"):
    R, pr, sdP, sdO = rate(core, role); R["name"] = names.reindex(R.index).values; R["nation"] = nation.reindex(R.index).values; R["ipl_team"] = ipl_last.ipl_team.reindex(R.index).values
    R["last"] = last.reindex(R.index).values; R["active"] = R["last"] >= CFG["active_since"]; R["eligible_pre"] = R.qualified & R.active & ~R.nation.isin(CFG["excluded_nations"]); R["barred"] = np.where(R.index.isin(list(RET)), pd.Series(R.index).map(INEL).fillna("").values, np.where(CFG["bar_dips"] & (R.lift_class == "Dips"), "Dips under pressure", "")); R["eligible"] = R.eligible_pre & (R.barred == ""); Pre = R[R.eligible_pre].sort_values("floor", ascending=False); R["rank_pre"] = np.nan; R.loc[Pre.index, "rank_pre"] = np.arange(1, len(Pre) + 1)
    E = R[R.eligible].sort_values("floor", ascending=False); R["rank"] = np.nan; R.loc[E.index, "rank"] = np.arange(1, len(E) + 1)
    R = R.join(bootstrap(core, role, pr, sdP, sdO, list(E.index)))
    FUN[role] = [int(len(R)), int(((R.nP >= CFG["show_min"]) & (R.nO >= CFG["show_min"])).sum()), int(R.qualified.sum()), int((R.qualified & R.active).sum()), int(R.eligible_pre.sum()), int(R.eligible.sum())]
    RT[role] = R; PRI[role] = dict(pr, sdP=sdP, sdO=sdO); SH[role] = split_half(core, role); TOP[role] = R[R["rank"] <= 10].sort_values("rank")
    print(f"\n== {role}: pool {pr['pool']} eligible {len(E)} | tauP {pr['tauP']:.3f} tauO {pr['tauO']:.3f} rho {pr['rho']:.2f} | split-half pressure {SH[role]['r_pressure']:.2f} ordinary {SH[role]['r_ordinary']:.2f} lift {SH[role]['r_lift']:.2f}")
    print(TOP[role][["name", "ipl_team", "nP", "xP", "xO", "epp", "floor", "lift_class", "p_top10", "rank_lo", "rank_hi"]].round(3).to_string(index=False))

# ---------- 6. stability checks ----------
def variant(label, ws, wb, wt, ww, ko, thr, ipl_only=False, opp=True, tierw=True):
    set_pressure(b, ws, wb, wt, ww, ko, thr); c2 = b[~b.dead].copy(); apply_opp(c2, eff, opp); row = {"variant": label}
    if ipl_only: c2 = c2[c2.tier == "IPL"]
    for role in ("bat", "bowl"):
        R2, _, _, _ = rate(c2, role, tierw); base = RT[role]; ids = [i for i in base.index[base.eligible.values] if i in R2.index and bool(R2.qualified.get(i, False))]
        f2 = R2.loc[ids].floor; top2 = set(f2.sort_values(ascending=False).head(10).index); row[role + "_rho"] = float(spearmanr(base.loc[ids].floor, f2).statistic); row[role + "_kept"] = int(len(top2 & set(TOP[role].index))); row[role + "_n"] = len(ids)
    return row
W4 = (CFG["w_swing"], CFG["w_balance"], CFG["w_clock"], CFG["w_wstress"]); KO = CFG["ko_uplift"]
SENS = [variant("Swing only", 1, 0, 0, 0, 0, 75), variant("Equal weights", .25, .25, .25, .25, KO, 75), variant("No knockout uplift", *W4, 0, 75), variant("Threshold PI 67", *W4, KO, 67), variant("Threshold PI 80", *W4, KO, 80),
        variant("Threshold PI 90", *W4, KO, 90), variant("IPL balls only", *W4, KO, 75, ipl_only=True), variant("No opposition adjustment", *W4, KO, 75, opp=False), variant("No tier weights", *W4, KO, 75, tierw=False)]
RAWPI = set_pressure(b, *BASE); live = b[~b.dead]; print(pd.DataFrame(SENS).round(3).to_string(index=False))

# ---------- 7. descriptive layers for the documents and the dashboard ----------
BN = {"b1": "Routine (PI under 50)", "b2": "Elevated (50 to 75)", "b3": "High (75 to 90)", "b4": "Extreme (90 and above)"}
bands = live.groupby("band").agg(n=("runs", "size"), swing=("swing", "mean"), wp=("wp0", "mean"), over=("overid", "mean"), wk_down=("wk_before", "mean"), inn2=("innings", lambda s: (s == 2).mean()), wkt=("wk", "mean"),
                                 dot=("oc", lambda s: (s == "0").mean()), bnd=("oc", lambda s: s.isin(["4", "6"]).mean()), runs=("runs", "sum"), legal=("legal", "sum")); bands["sr"] = 100 * bands.runs / bands.legal
hp_share = {f"{i}|{p}": float(v) for (i, p), v in live.groupby(["innings", "phase"]).hp.mean().items()}; hp_ko = {int(k): float(v) for k, v in live.groupby("ko").hp.mean().items()}; hp_inn = {int(k): float(v) for k, v in live.groupby("innings").hp.mean().items()}
SWP = float(live[live.hp].swing.mean()); core["year"] = core.match_date.str[:4]; tagc = np.where(core.hp, "P", "O")
for c in ("phase", "pace_or_spin", "year"): core[c + "_hp"] = core[c].astype(str) + "|" + tagc
core["inn_hp"] = core.innings.astype(str) + "|" + tagc
def classic(role):
    if role == "bat":
        d = core[~core.extras_type.eq("wide")]; x = pd.DataFrame({"pid": d.striker_id.values, "hp": d.hp.values, "r": d.runs.values, "b": 1, "o": d.st_out.values, "dot": (d.runs.values == 0).astype(int), "bnd": (d.is_four | d.is_six).values.astype(int)})
    else:
        d = core; x = pd.DataFrame({"pid": d.bowler_id.values, "hp": d.hp.values, "r": d.bowl_runs.values, "b": d.legal.values, "o": d.bw_out.values, "dot": ((d.bowl_runs.values == 0) & (d.legal.values == 1)).astype(int), "bnd": (d.is_four | d.is_six).values.astype(int)})
    g = x.groupby(["pid", "hp"]).sum().unstack("hp").fillna(0.0); k = 100 if role == "bat" else 6; nz = lambda s: s.replace(0, np.nan); o = {}
    for t, h in (("P", True), ("O", False)):
        o["rate" + t] = k * g[("r", h)] / nz(g[("b", h)]); o["runs" + t] = g[("r", h)]; o["balls" + t] = g[("b", h)]; o["outs" + t] = g[("o", h)]; o["dot" + t] = g[("dot", h)] / nz(g[("b", h)]); o["bnd" + t] = g[("bnd", h)] / nz(g[("b", h)])
    return pd.DataFrame(o)
def splits(role, by):
    idc, vc, _ = ROLE[role]; d = core[core[vc].notna()]; bat = role == "bat"
    x = pd.DataFrame({"pid": d[idc].values, "k": d[by].astype(str).values, "v": d[vc].values, "r": (d.runs if bat else d.bowl_runs).values, "b": 1 if bat else d.legal.values, "o": (d.st_out if bat else d.bw_out).values})
    g = x.groupby(["pid", "k"]).agg(n=("v", "size"), v=("v", "mean"), r=("r", "sum"), b=("b", "sum"), o=("o", "sum")).reset_index(); g["rate"] = (100 if bat else 6) * g.r / g.b.replace(0, np.nan); out = {}
    for pid, q in g.groupby("pid"): out[pid] = [[k, int(n), float(v), float(rt), int(o)] for k, n, v, rt, o in zip(q.k, q.n, q.v, q.rate, q.o)]
    return out
def top_matches(role, k=5):
    idc, vc, dc = ROLE[role]; d = core[core.hp & core[vc].notna()]; bat = role == "bat"
    x = pd.DataFrame({"pid": d[idc].values, "match_id": d.match_id.values, "opp": (d.bowling_team_id if bat else d.batting_team_id).map(tn).values, "wpa": d[dc].values * 100, "r": (d.runs if bat else d.bowl_runs).values, "b": 1 if bat else d.legal.values, "o": (d.st_out if bat else d.bw_out).values})
    g = x.groupby(["pid", "match_id", "opp"]).agg(n=("wpa", "size"), wpa=("wpa", "sum"), r=("r", "sum"), b=("b", "sum"), o=("o", "sum")).reset_index().merge(m[["match_id", "match_date", "comp_name"]], on="match_id")
    g = g.sort_values("wpa", ascending=False).groupby("pid").head(k); out = {}
    for pid, q in g.groupby("pid"): out[pid] = [[dt, cn, op, int(n), float(w_), int(r_), int(b_), int(o_)] for dt, cn, op, n, w_, r_, b_, o_ in zip(q.match_date, q.comp_name, q.opp, q.n, q.wpa, q.r, q.b, q.o)]
    return out
SPLITKEYS = ("phase_hp", "inn_hp", "pace_or_spin_hp", "year_hp", "band")
def records(role):
    R = RT[role].join(classic(role)); S = {k: splits(role, k) for k in SPLITKEYS}; TM = top_matches(role); out = []; sv = lambda x: x if isinstance(x, str) else None
    for pid, r in R[(R.nP >= CFG["show_min"]) & (R.nO >= CFG["show_min"])].sort_values("floor", ascending=False).iterrows():
        d = dict(id=int(pid), name=r["name"], role=role, nation=sv(r["nation"]), ipl_team=sv(r["ipl_team"]), last=r["last"], rank=None if r["rank"] != r["rank"] else int(r["rank"]), qualified=bool(r["qualified"]), active=bool(r["active"]), eligible=bool(r["eligible"]), barred=r["barred"], rank_pre=None if r["rank_pre"] != r["rank_pre"] else int(r["rank_pre"]),
                 hand=sv(hand.get(pid)), pos=float(bpos.get(pid, np.nan)), bowl_type=sv(btype.get(pid)), bowl_kind=sv(bkind.get(pid)), nP=int(r["nP"]), nO=int(r["nO"]), iplP=int(r["iplP"]), xP=r["xP"], xO=r["xO"], epp=r["epp"], sd=r["sd"], floor=r["floor"],
                 floor_pp100=r["floor"] * SWP * 1e4, epp_pp100=r["epp"] * SWP * 1e4, lift=r["lift"], lift_z=r["lift_z"], lift_class=r["lift_class"], p_top10=r["p_top10"], p_top20=r["p_top20"], rank_lo=r["rank_lo"], rank_hi=r["rank_hi"], wpaP=r["wpaP"], wpaAll=r["wpaAll"])
        for c in ("rateP", "rateO", "runsP", "runsO", "ballsP", "ballsO", "outsP", "outsO", "dotP", "dotO", "bndP", "bndO"): d[c] = r[c]
        c_ = CONS[role].loc[pid] if pid in CONS[role].index else None; d.update(pm=int(c_.pm) if c_ is not None else 0, pos_share=float(c_.pos_share) if c_ is not None else None, decisive=int(c_.decisive) if c_ is not None else 0, costly=int(c_.costly) if c_ is not None else 0, worst=float(c_.worst) if c_ is not None else None, best=float(c_.best) if c_ is not None else None); d["splits"] = {k: S[k].get(pid, []) for k in SPLITKEYS}; d["matches"] = TM.get(pid, []); out.append(d)
    return out
def consistency(role):
    idc, _, dc = ROLE[role]; q = core[core.hp & core[dc].notna()].groupby([idc, "match_id"])[dc].agg(["sum", "size"]); q = q[q["size"] >= 4]; q["pts"] = q["sum"] * 100
    g_ = q.groupby(level=0).pts; return pd.DataFrame({"pm": g_.size(), "pos_share": g_.apply(lambda s: float((s > 0).mean())), "decisive": g_.apply(lambda s: int((s >= 15).sum())), "costly": g_.apply(lambda s: int((s <= -15).sum())), "worst": g_.min(), "best": g_.max()})
CONS = {r_: consistency(r_) for r_ in ("bat", "bowl")}
REC = {r: records(r) for r in ("bat", "bowl")}
def team_table():
    d = core[(core.tier == "IPL") & core.hp]; rows = []
    for role, tcol, vc in (("bat", "batting_team_id", "va_bat"), ("bowl", "bowling_team_id", "va_bowl")):
        q = d[d[vc].notna()]; g = q.groupby(["season", tcol, "phase"])[vc].agg(["mean", "size"]).reset_index(); g2 = q.groupby(["season", tcol])[vc].agg(["mean", "size"]).reset_index(); g2["phase"] = "ALL"
        g = pd.concat([g, g2]); g["team"] = g[tcol].map(tn); g["role"] = role; rows.append(g[["season", "team", "role", "phase", "mean", "size"]])
    T = pd.concat(rows, ignore_index=True); T["rank"] = T.groupby(["season", "role", "phase"])["mean"].rank(ascending=False).astype(int); return T
TEAMS = team_table(); RRT = TEAMS[TEAMS.team == "Rajasthan Royals"].sort_values(["season", "role", "phase"])
byid = {r: {d["id"]: d for d in REC[r]} for r in REC}
sq = mp[(mp.comp_name == "IPL 2026") & (mp.team_name == "Rajasthan Royals")].drop_duplicates("player_id")
SQUAD = [dict(id=int(p), name=n, bat=({k: byid["bat"][p][k] for k in ("rank", "floor", "nP", "qualified", "lift_class")} if p in byid["bat"] else None), bowl=({k: byid["bowl"][p][k] for k in ("rank", "floor", "nP", "qualified", "lift_class")} if p in byid["bowl"] else None)) for p, n in zip(sq.player_id, sq.player_name)]
def chase_grid():
    er = float(info["env"].query("tier == 'IPL'").sort_values("season").env_rpb.iloc[-1]); ef = er / info["glob_rpb"]; rn = np.arange(1, 101); bl = np.arange(1, 61); out = {"rn": [1, 100], "bl": [1, 60], "env_rpb": er, "wp": {}, "swing": {}}
    RN, BL = np.meshgrid(rn, bl, indexing="ij"); n = RN.size; RNf = RN.ravel().astype(float); BLf = BL.ravel().astype(float); mid = BLf > 30
    for wih in range(1, 11):
        a = (np.full(n, 2.0), np.zeros(n), np.full(n, 10.0 - wih), BLf, RNf, np.full(n, ef), np.full(n, er), np.ones(n)); w0 = WP(*a); sw = np.zeros(n)
        for k, (r_, w_, l_) in OC.items(): sw += np.where(mid, P.loc[(2, "MID"), k], P.loc[(2, "DEATH"), k]) * np.abs(WP(a[0], a[1] + r_, a[2] + w_, a[3] - l_, a[4], a[5], a[6], a[7]) - w0)
        out["wp"][wih] = (w0.reshape(len(rn), len(bl)) * 1000).round().astype(int).tolist(); out["swing"][wih] = (sw.reshape(len(rn), len(bl)) * 10000).round().astype(int).tolist()
    q = np.linspace(0, 1, 201); out["swing_q"] = [float(v) for v in b.swing.quantile(q)]; out["raw_q"] = [float(v) for v in RAWPI[~b.dead].quantile(q)]
    out["exp_wk"] = {f"{i}|{o}": float(v) for (i, o), v in b.groupby(["innings", "overid"]).wk_before.mean().items()}; out["weights"] = dict(swing=CFG["w_swing"], balance=CFG["w_balance"], clock=CFG["w_clock"], wstress=CFG["w_wstress"], ko=CFG["ko_uplift"])
    return out
def showcase(k=12):
    q = live[(live.tier == "IPL") & (live.innings == 2)].groupby("match_id").agg(pi=("PI", "mean"), n=("PI", "size")); out = []
    for mid_ in q[q.n >= 100].sort_values("pi", ascending=False).head(k).index:
        d = b[b.match_id == mid_]; mr = m[m.match_id == mid_].iloc[0]; ov = d.groupby(["innings", "overid"]).agg(wp=("wp0", "first"), pi=("PI", "mean"), runs=("tot", "sum"), wk=("wk", "sum"), bat=("batting_team_id", "first")).reset_index()
        out.append(dict(id=int(mid_), date=mr.match_date, comp=mr.comp_name, home=mr.home_team, away=mr.away_team, result=mr.result, overs=[[int(r.innings), int(r.overid), float(r.wp), float(r.pi), int(r.runs), int(r.wk), tn.get(r.bat)] for r in ov.itertuples()]))
    return out
AVAIL = pd.read_csv(MODEL / "inputs" / "availability.csv").to_dict("records") if (MODEL / "inputs" / "availability.csv").exists() else []

# ---------- 8. checks, hash, outputs ----------
print("WP", json.dumps({k: {q: round(v[q], 4) for q in ("ll", "brier", "auc", "ll_gbm", "auc_gbm", "ll_base", "cal_gap")} for k, v in val.items()}))
ck("raw rows 200,999", info["n_raw"] == 200999); ck("innings totals reconcile with run margins in at least 98% of matches", info["recon"] >= 0.98)
ck("win probability beats the base rate out of fold, both innings", val["inn1"]["ll"] < val["inn1"]["ll_base"] - 0.03 and val["inn2"]["ll"] < val["inn2"]["ll_base"] - 0.15)
ck("calibration gap under 0.08 in every well-filled bin", max(val["inn1"]["cal_gap"], val["inn2"]["cal_gap"]) < 0.08)
ck("pressure bands rise in mean swing", bool((bands.swing.diff().dropna() > 0).all())); ck("high-pressure share is 25% of live balls", abs(live.hp.mean() - 0.25) < 0.005)
ck("cell-centred value averages zero", abs(live.v_bat.mean()) < 1e-6 and abs(live.v_bowl.mean()) < 1e-6)
ck("ten unique names in each top 10", all(len(TOP[r]) == 10 and TOP[r].name.nunique() == 10 for r in TOP)); ck("at least 60 eligible players per role", all(FUN[r][5] >= 60 for r in FUN))
ck("no excluded nation in a top 10", all(not TOP[r].nation.isin(CFG["excluded_nations"]).any() for r in TOP))
GRID = chase_grid()
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
ck("every dashboard record is JSON safe", all(json.dumps(J(REC[r])) for r in REC))
key = {r: [[str(n), round(float(f), 4)] for n, f in zip(TOP[r].name, TOP[r].floor)] for r in TOP}; H = hashlib.sha1(json.dumps([key, {k: round(v["ll"], 5) for k, v in val.items()}], sort_keys=True).encode()).hexdigest()[:10]
pc = lambda x: f"{100 * x:.0f}%"; f2 = lambda x: f"{x:.2f}"; BK = ["b1", "b2", "b3", "b4"]
def toprows(role): return [[int(r["rank"]), r["name"], r["ipl_team"] if isinstance(r["ipl_team"], str) else "n/a", grp(r["nP"]), sg(r["xP"]), sg(r["xO"]), sg(r["epp"], 3), sg(r["floor"], 3), sg(r["floor"] * SWP * 1e4, 0), pc(r["p_top10"]), f"{r['rank_lo']:.0f} to {r['rank_hi']:.0f}", r["lift_class"]] for _, r in TOP[role].iterrows()]
qs = {r: RT[r][RT[r].qualified] for r in RT}
DECK = dict(hash=H, n_balls=grp(info["n_raw"]), n_live=grp(len(live)), n_pressure=grp(int(live.hp.sum())), n_matches=grp(int(b.match_id.nunique())), dead_share=pc(b.dead.mean()),
            auc2=f2(val["inn2"]["auc"]), ll2=f"{val['inn2']['ll']:.3f}", auc1=f2(val["inn1"]["auc"]), ll1=f"{val['inn1']['ll']:.3f}", auc2_gbm=f2(val["inn2"]["auc_gbm"]), cal_gap=f"{max(val['inn1']['cal_gap'], val['inn2']['cal_gap']):.3f}",
            band_swing=[f"{100 * bands.swing[k]:.2f}" for k in BK], band_wkt=[f"{100 * bands.wkt[k]:.1f}%" for k in BK], band_n=[grp(bands.n[k]) for k in BK], band_names=[BN[k] for k in BK], swing_ratio=f"{bands.swing['b4'] / bands.swing['b1']:.1f}",
            share={k: pc(v) for k, v in hp_share.items()}, share_ko=pc(hp_ko.get(1, 0)), share_league=pc(hp_ko.get(0, 0)), share_inn1=pc(hp_inn[1]), share_inn2=pc(hp_inn[2]),
            sh={r: {k: sg(SH[r][k]) for k in ("r_pressure", "r_ordinary", "r_lift")} for r in SH}, sh_n={r: SH[r]["n"] for r in SH}, rho={r: f2(PRI[r]["rho"]) for r in PRI}, funnel=FUN,
            lift_share={r: pc((qs[r].lift_class != "Steady").mean()) for r in qs}, lift_chance=pc(0.20), top_bat=toprows("bat"), top_bowl=toprows("bowl"),
            sens=[[s["variant"], f2(s["bat_rho"]), str(s["bat_kept"]), f2(s["bowl_rho"]), str(s["bowl_kept"])] for s in SENS], min_rho={r: f2(min(s[r + "_rho"] for s in SENS)) for r in ("bat", "bowl")},
            firm={r: int((TOP[r].p_top10 >= 0.65).sum()) for r in TOP}, swp=f"{100 * SWP:.2f}",
            rr=[[str(r.season), r.role, r.phase, sg(r["mean"]), int(r["size"]), int(r["rank"])] for _, r in RRT.iterrows()])
DECK.update(oot={r_: dict(players=OOT[r_]["players"], top_raw=f'{OOT[r_]["top10_future"]["raw_pressure"]:.3f}', top_floor=f'{OOT[r_]["top10_future"]["floor"]:.3f}', pool=f'{OOT[r_]["pool_future"]:.3f}', corr_raw=f2(OOT[r_]["corr"]["raw_pressure"]), corr_floor=f2(OOT[r_]["corr"]["floor"]), lift=sg(OOT[r_]["lift_persist"])) for r_ in OOT},
            gates={str(k): v for k, v in GATES.items()}, barred=BARRED, edge=EDGE, bias_max=f"{max(abs(v) for v in BIAS.values()):.3f}", gate=str(CFG["min_p"]), dl=DLPAR, half_life=CFG["half_life"], hl_test=HLT)
OUT = dict(meta=dict(model="SupeRR Selector Season 2 pressure model", hash=H, checks_passed=sum(CHECKS.values()), checks_total=len(CHECKS), generated=time.strftime("%Y-%m-%d")), checks=CHECKS, config=CFG,
           data=dict(raw_rows=info["n_raw"], matches=int(b.match_id.nunique()), balls_used=int(len(b)), live=int(len(live)), dead_share=float(b.dead.mean()), recon=info["recon"], emerging_rows_dropped=info["n_emg"], env=info["env"].to_dict("records"), glob_rpb=info["glob_rpb"]),
           validation=dict(wp=val, coef=coef, bands=[dict(band=k, name=BN[k], **{c: float(bands.loc[k, c]) for c in ("n", "swing", "wp", "over", "wk_down", "inn2", "wkt", "dot", "bnd", "sr")}) for k in BK], hp_share=hp_share, hp_ko=hp_ko, hp_inn=hp_inn, swing_pressure_mean=SWP,
                           outcome_probs={f"{i}|{p}": {k: float(P.loc[(i, p), k]) for k in OC} for (i, p) in P.index}, split_half=SH, prior=PRI, sensitivity=SENS, funnel=FUN),
           top10={r: [int(i) for i in TOP[r].index] for r in TOP}, top30={r: [{k: d[k] for k in d if k not in ("splits", "matches")} for d in REC[r] if d["rank"] is not None and d["rank"] <= 30] for r in REC},
           rr=dict(team=RRT.to_dict("records"), squad=SQUAD), availability=AVAIL, deck=DECK)
OUT["validation"].update(oot=OOT, bias=BIAS, gates={str(k): v for k, v in GATES.items()}, edge=EDGE, barred=BARRED, resources=DLPAR, half_life_test=HLT)
T = "# Model tables (SupeRR Selector Season 2 pressure model, hash %s, checks %d/%d)\n\n" % (H, sum(CHECKS.values()), len(CHECKS))
T += mdt("T1. Configuration", ["Setting", "Value"], [[k, v if not isinstance(v, list) else ", ".join(str(x) for x in v)] for k, v in CFG.items()])
T += mdt("T2. Data used", ["Item", "Value"], [["Rows in ball_by_ball.csv", grp(info["n_raw"])], ["Rows dropped: emerging-team events", grp(info["n_emg"])], ["Balls used", grp(len(b))], ["Live balls (win probability 3% to 97%)", grp(len(live))], ["Pressure balls (PI 75 and above)", grp(int(live.hp.sum()))], ["Matches used", grp(int(b.match_id.nunique()))], ["Run-margin reconciliation", f"{100 * info['recon']:.1f}%"]])
T += mdt("T3. Scoring environment: first-innings runs per legal ball", ["Tier", "Season", "Runs per ball", "Par over 120 balls"], [[r.tier, r.season, f"{r.env_rpb:.3f}", f"{120 * r.env_rpb:.0f}"] for r in info["env"].itertuples()])
T += mdt("T4. Win-probability validation, out of fold, grouped by match", ["Innings", "Balls", "Matches", "Log loss", "Brier", "AUC", "Boosted log loss", "Boosted AUC", "Base-rate log loss", "Largest calibration gap"], [[k, grp(v["balls"]), v["matches"], f"{v['ll']:.3f}", f"{v['brier']:.3f}", f"{v['auc']:.3f}", f"{v['ll_gbm']:.3f}", f"{v['auc_gbm']:.3f}", f"{v['ll_base']:.3f}", f"{v['cal_gap']:.3f}"] for k, v in val.items()])
T += mdt("T5. Calibration by predicted decile", ["Innings", "Bin", "Balls", "Predicted", "Actual"], [[k, f"{c[0] * 10} to {c[0] * 10 + 10}%", grp(c[1]), f"{c[2]:.3f}", f"{c[3]:.3f}"] for k, v in val.items() for c in v["cal"]])
T += mdt("T6. Win-probability coefficients", ["Innings", "Term", "Coefficient"], [[k, n_, f"{c_:.4f}"] for k, v in coef.items() for n_, c_ in list(zip(v["names"], v["coef"])) + [("intercept", v["intercept"])]])
T += mdt("T7. Pressure bands", ["Band", "Balls", "Mean swing, points", "Mean win probability", "Mean over", "Wickets down", "Share in chases", "Wicket rate", "Dot rate", "Boundary rate", "Strike rate"], [[BN[k], grp(bands.n[k]), f"{100 * bands.swing[k]:.2f}", f2(bands.wp[k]), f"{bands.over[k]:.1f}", f"{bands.wk_down[k]:.1f}", pc(bands.inn2[k]), f"{100 * bands.wkt[k]:.1f}%", pc(bands["dot"][k]), pc(bands.bnd[k]), f"{bands.sr[k]:.0f}"] for k in BK])
T += mdt("T8. Share of live balls that are pressure balls", ["Where", "Share"], [[f"Innings {k.split('|')[0]}, {k.split('|')[1]}", pc(v)] for k, v in hp_share.items()] + [["Knockout matches", pc(hp_ko.get(1, 0))], ["League and bilateral matches", pc(hp_ko.get(0, 0))]])
T += mdt("T9. Repeatability: odd matches against even matches", ["Role", "Players", "Pressure value", "Ordinary value", "Lift", "Pressure half against ordinary half"], [[r, SH[r]["n"], sg(SH[r]["r_pressure"]), sg(SH[r]["r_ordinary"]), sg(SH[r]["r_lift"]), sg(SH[r]["r_cross"])] for r in SH])
T += mdt("T10. Prior estimated from the qualified pool", ["Role", "Pool", "Mean pressure", "Mean ordinary", "Spread pressure", "Spread ordinary", "Correlation", "Ball noise pressure", "Ball noise ordinary"], [[r, v["pool"], sg(v["muP"], 3), sg(v["muO"], 3), f"{v['tauP']:.3f}", f"{v['tauO']:.3f}", f2(v["rho"]), f2(v["sdP"]), f2(v["sdO"])] for r, v in PRI.items()])
T += mdt("T11. Eligibility funnel", ["Role", "Any ball", "40 or more in each state", "Qualified (110 and 110)", "And active", "And IPL-eligible", "And not barred"], [[r] + [grp(x) for x in FUN[r]] for r in FUN])
HD = ["Rank", "Player", "Latest IPL side", "Pressure balls", "Pressure value", "Ordinary value", "Expected pressure value", "Floor", "Floor, points per 100 pressure balls", "Top-10 probability", "Rank range", "Lift class"]
T += mdt("T12. Top 10 batters under pressure", HD, toprows("bat")) + mdt("T13. Top 10 bowlers under pressure", HD, toprows("bowl"))
for i, r in ((14, "bat"), (15, "bowl")): T += mdt("T%d. Ranks 11 to 30, %s" % (i, "batters" if r == "bat" else "bowlers"), ["Rank", "Player", "Latest IPL side", "Pressure balls", "Floor", "Top-10 probability", "Lift class"], [[d["rank"], d["name"], d["ipl_team"] or "n/a", grp(d["nP"]), sg(d["floor"], 3), pc(d["p_top10"]), d["lift_class"]] for d in REC[r] if d["rank"] and 10 < d["rank"] <= 30])
T += mdt("T16. Stability of the ranking", ["Variant", "Batters: rank correlation", "Batters: top 10 kept", "Bowlers: rank correlation", "Bowlers: top 10 kept"], DECK["sens"])
T += mdt("T17. Rajasthan Royals under pressure, IPL, by season, role and phase", ["Season", "Role", "Phase", "Mean value", "Pressure balls", "Rank of 10"], DECK["rr"])
T += mdt("T18. Rajasthan Royals 2026 squad in the ratings", ["Player", "Batting rank", "Batting floor", "Bowling rank", "Bowling floor"], [[s["name"], (s["bat"] or {}).get("rank") or "n/a", sg(s["bat"]["floor"], 3) if s["bat"] else "n/a", (s["bowl"] or {}).get("rank") or "n/a", sg(s["bowl"]["floor"], 3) if s["bowl"] else "n/a"] for s in SQUAD])
T += mdt("T19. Out-of-time test: ratings from 2022 to 2024 against pressure value in 2025 to 2026", ["Role", "Players", "Corr, raw pressure", "Corr, raw ordinary", "Corr, all balls", "Corr, expected value", "Corr, floor", "Corr, raw lift", "Lift early against late", "Top 10 by raw pressure, later value", "Top 10 by floor, later value", "Pool average, later value"],
    [[r_, v["players"], sg(v["corr"]["raw_pressure"]), sg(v["corr"]["raw_ordinary"]), sg(v["corr"]["all_balls"]), sg(v["corr"]["expected"]), sg(v["corr"]["floor"]), sg(v["corr"]["raw_lift"]), sg(v["lift_persist"]), sg(v["top10_future"]["raw_pressure"], 3), sg(v["top10_future"]["floor"], 3), sg(v["pool_future"], 3)] for r_, v in OOT.items()])
T += mdt("T20. Edge cases and how the model treats them", ["Case", "Count or ids", "Treatment"], [["Shortened matches with no revision recorded", ", ".join(str(x) for x in EDGE["reduced_inferred"]), "Both innings capped at the first innings length, rounded up to a full over"], ["DLS chases with no revised target", ", ".join(str(x) for x in EDGE["dls_chases_dropped"]), "Chase innings dropped from valuation and training"], ["Retired out", EDGE["retired_out_rows"], "Not charged to the batter or the bowler"], ["Stumpings off wides", EDGE["wide_stumpings"], "Charged to the batter with no runs and no ball used"], ["Matches not decided (ties, super overs, no result)", EDGE["matches_not_decided"], "Valued ball by ball, never used to train win probability"]])
T += mdt("T21. Top 10 at four sample gates (balls of each kind)", ["Gate", "Batters", "Bowlers"], [[k, ", ".join(v["bat"]), ", ".join(v["bowl"])] for k, v in GATES.items()])
T += mdt("T22. Rated players barred from a top-10 place", ["Role", "Player", "Rank before the bar", "Reason", "Lift z"], [[r_, n, rp, why, sg(z)] for r_ in BARRED for n, rp, why, z in BARRED[r_]])
T += mdt("T25. Consistency across matches for the two top 10s (matches with 4 or more pressure balls; decisive means the player's own pressure balls added 15 or more win-probability points, costly means they cost 15 or more)", ["Role", "Rank", "Player", "Pressure matches", "Share helping", "Decisive", "Costly", "Best match, points", "Worst match, points"],
    [[r_, d_["rank"], d_["name"], d_["pm"], f'{100 * d_["pos_share"]:.0f}%' if d_["pos_share"] is not None else "n/a", d_["decisive"], d_["costly"], sg(d_["best"], 1) if d_["best"] is not None else "n/a", sg(d_["worst"], 1) if d_["worst"] is not None else "n/a"] for r_ in ("bat", "bowl") for d_ in sorted([x for x in REC[r_] if x["rank"] and x["rank"] <= 10], key=lambda x: x["rank"])])
T += mdt("T24. Choosing the recency half-life: ratings from 2022 to 2024 weighted toward 1 Jan 2025, against pressure value in 2025 to 2026", ["Half-life", "Batters: corr", "Batters: top 10 later", "Bowlers: corr", "Bowlers: top 10 later", "Pool later, batters", "Pool later, bowlers"], [[k, sg(v["bat"]["corr"]), sg(v["bat"]["top10"], 3), sg(v["bowl"]["corr"]), sg(v["bowl"]["top10"], 3), sg(v["bat"]["pool"], 3), sg(v["bowl"]["pool"], 3)] for k, v in HLT.items()])
T += mdt("T23. Resources curve (Duckworth-Lewis form fitted to this data)", ["Parameter", "Value"], [["Z0, runs from a full innings in the average environment", f'{DLPAR["Z0"]:.1f}'], ["b, decay rate", f'{DLPAR["b"]:.4f}']] + [[f"F({w}), share of full resources with {w} wickets in hand", f"{v:.3f}"] for w, v in enumerate(DLPAR["F"], 1)])
wr(MODEL / "model_outputs.json", OUT); wr(MODEL / "model_tables.md", T)
wr(PUB / "meta.json", dict(meta=OUT["meta"], config=CFG, data=OUT["data"], validation=OUT["validation"], top10=OUT["top10"], deck=DECK, rr=OUT["rr"], availability=AVAIL))
wr(PUB / "batters.json", REC["bat"]); wr(PUB / "bowlers.json", REC["bowl"]); wr(PUB / "teams.json", TEAMS.to_dict("records")); wr(PUB / "grid.json", GRID); wr(PUB / "showcase.json", showcase())
if not DRY: (MODEL / "out").mkdir(parents=True, exist_ok=True); core.to_pickle(MODEL / "out" / "balls.pkl"); print("wrote model/out/balls.pkl", len(core))
print("CHECKS %d/%d HASH %s" % (sum(CHECKS.values()), len(CHECKS), H)); print("TOP10 BAT:", ", ".join(TOP["bat"].name)); print("TOP10 BOWL:", ", ".join(TOP["bowl"].name))
print("FINDINGS lift repeatability bat %s bowl %s | firm names bat %d bowl %d | runtime %.0f s" % (DECK["sh"]["bat"]["r_lift"], DECK["sh"]["bowl"]["r_lift"], DECK["firm"]["bat"], DECK["firm"]["bowl"], time.time() - T0))
print("OUT OF TIME", {r_: (OOT[r_]["top10_future"]["raw_pressure"], OOT[r_]["top10_future"]["floor"], OOT[r_]["pool_future"]) for r_ in OOT}, "| GATE", CFG["min_p"], "| BARRED", {r_: [x[0] for x in BARRED[r_]] for r_ in BARRED})
print("MODEL PASS" if all(CHECKS.values()) else "MODEL FAIL")
