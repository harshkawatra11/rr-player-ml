"""Figures for the research PDF. Run after the model:  python -X utf8 model/figures.py   Reads model/model_outputs.json and public/data/*.json."""
import json, pathlib, numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUTD = ROOT / "research" / "figures"; OUTD.mkdir(parents=True, exist_ok=True)
L = lambda p: json.loads((ROOT / p).read_text(encoding="utf-8")); O = L("model/model_outputs.json"); BAT = L("public/data/batters.json"); BOWL = L("public/data/bowlers.json"); G = L("public/data/grid.json"); SC = L("public/data/showcase.json"); TM = L("public/data/teams.json")
PK, NV, BL, GR, PN = "#E50695", "#021D45", "#1226AA", "#8A93A6", "#F5F6FA"; V = O["validation"]
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": NV, "axes.labelcolor": NV, "xtick.color": NV, "ytick.color": NV, "figure.facecolor": "white"})
def save(fig, n): fig.tight_layout(); fig.savefig(OUTD / ("F%02d.png" % n), dpi=200); plt.close(fig); print("F%02d" % n)
def heat(ax, M, xl, yl, cmap, fmt="{:.0f}"):
    im = ax.imshow(M, cmap=cmap, aspect="auto"); ax.set_xticks(range(len(xl))); ax.set_xticklabels(xl); ax.set_yticks(range(len(yl))); ax.set_yticklabels(yl)
    for i in range(M.shape[0]):
        for j in range(M.shape[1]): ax.text(j, i, fmt.format(M[i, j]), ha="center", va="center", color="white" if M[i, j] > (np.nanmin(M) + np.nanmax(M)) / 2 else NV, fontsize=9)
    return im
from matplotlib.colors import LinearSegmentedColormap as LSC
CP = LSC.from_list("p", ["#FFFFFF", "#F7A8D5", PK, "#8A0458"]); CB = LSC.from_list("b", ["#FFFFFF", "#B9C4F3", BL, NV]); CD = LSC.from_list("d", [BL, "#FFFFFF", PK])
# F01 calibration
fig, ax = plt.subplots(1, 2, figsize=(9, 4))
for a, k, t in zip(ax, ("inn1", "inn2"), ("First innings", "Chase")):
    c = np.array(V["wp"][k]["cal"]); a.plot([0, 1], [0, 1], color=GR, lw=1, ls="--"); a.plot(c[:, 2], c[:, 3], color=PK, marker="o", lw=2); a.set_xlabel("Predicted win probability, " + t.lower()); a.set_ylabel("Share actually won")
save(fig, 1)
# F02 model comparison
fig, ax = plt.subplots(figsize=(7, 3.6)); x = np.arange(2); w = 0.26
for i, (k, lab, col) in enumerate((("ll", "Logistic (used)", PK), ("ll_gbm", "Boosted benchmark", BL), ("ll_base", "Base rate", GR))): ax.bar(x + (i - 1) * w, [V["wp"]["inn1"][k], V["wp"]["inn2"][k]], w, label=lab, color=col)
ax.set_xticks(x); ax.set_xticklabels(["First innings", "Chase"]); ax.set_ylabel("Log loss, out of fold (lower is better)"); ax.legend(frameon=False); save(fig, 2)
# F03 bands
B = V["bands"]; fig, ax = plt.subplots(1, 2, figsize=(9, 3.8)); nm = [b["name"].split(" (")[0] for b in B]
ax[0].bar(nm, [100 * b["swing"] for b in B], color=[BL, BL, PK, "#8A0458"]); ax[0].set_ylabel("Mean swing, win probability points per ball")
ax[1].bar(nm, [100 * b["wkt"] for b in B], color=[BL, BL, PK, "#8A0458"]); ax[1].set_ylabel("Wickets per 100 balls"); save(fig, 3)
# F04 where pressure lives
S = V["hp_share"]; M = np.array([[100 * S["%d|%s" % (i, p)] for p in ("PP", "MID", "DEATH")] for i in (1, 2)]); fig, ax = plt.subplots(figsize=(6, 2.8)); heat(ax, M, ["Powerplay", "Middle", "Death"], ["First innings", "Chase"], CP, "{:.0f}%"); save(fig, 4)
# F05, F06 chase grids at 6 wickets in hand
for n, key, cm, sc, lab in ((5, "wp", CD, 10.0, "Win probability, %"), (6, "swing", CP, 100.0, "Swing, points")):
    A = np.array(G[key]["6"]) / sc; fig, ax = plt.subplots(figsize=(8, 4.6)); im = ax.imshow(A[:80].T[::-1], cmap=cm, aspect="auto", extent=[1, 80, 1, 60]); ax.set_xlabel("Runs needed"); ax.set_ylabel("Balls left"); fig.colorbar(im, label=lab); save(fig, n)
# F07, F08 repeatability
for n, r, col in ((7, "bat", PK), (8, "bowl", BL)):
    p = np.array(V["split_half"][r]["points"]); fig, ax = plt.subplots(1, 3, figsize=(11, 3.6))
    for a, (x, y, t) in zip(ax, ((p[:, 0], p[:, 1], "Pressure value"), (p[:, 2], p[:, 3], "Ordinary value"), (p[:, 0] - p[:, 2], p[:, 1] - p[:, 3], "Lift"))):
        a.scatter(x, y, s=14, color=col, alpha=.7); a.axhline(0, color=GR, lw=.6); a.axvline(0, color=GR, lw=.6); a.set_xlabel(t + ", odd matches"); a.set_ylabel(t + ", even matches"); a.text(.04, .92, "r = %.2f" % np.corrcoef(x, y)[0, 1], transform=a.transAxes, color=NV, weight="bold")
    save(fig, n)
# F09, F10 top 10 with intervals; F11, F12 pressure against ordinary
for n, n2, R, col in ((9, 11, BAT, PK), (10, 12, BOWL, BL)):
    T = sorted([d for d in R if d["rank"] and d["rank"] <= 10], key=lambda d: d["rank"])[::-1]; fig, ax = plt.subplots(figsize=(8, 4.4)); y = np.arange(len(T))
    ax.hlines(y, [d["epp"] - 1.28 * d["sd"] for d in T], [d["epp"] + 1.28 * d["sd"] for d in T], color=GR, lw=2); ax.scatter([d["epp"] for d in T], y, color=NV, zorder=3, label="Expected pressure value"); ax.scatter([d["floor"] for d in T], y, color=col, marker="D", zorder=3, label="Floor (ranked on this)")
    ax.set_yticks(y); ax.set_yticklabels(["%d  %s" % (d["rank"], d["name"]) for d in T]); ax.set_xlabel("Value, standardised swing units"); ax.legend(frameon=False, loc="lower right"); save(fig, n)
    Q = [d for d in R if d["qualified"]]; fig, ax = plt.subplots(figsize=(7, 5.4)); ax.scatter([d["xO"] for d in Q], [d["xP"] for d in Q], s=16, color=GR, alpha=.6)
    for d in T: ax.scatter(d["xO"], d["xP"], s=40, color=col); ax.annotate(d["name"].split()[-1], (d["xO"], d["xP"]), fontsize=8, xytext=(4, 3), textcoords="offset points", color=NV)
    ax.axhline(0, color=NV, lw=.6); ax.axvline(0, color=NV, lw=.6); ax.set_xlabel("Ordinary value (raw)"); ax.set_ylabel("Pressure value (raw)"); save(fig, n2)
# F13 stability
SN = V["sensitivity"]; M = np.array([[s["bat_rho"], s["bowl_rho"]] for s in SN]); fig, ax = plt.subplots(figsize=(6, 4.6)); heat(ax, M, ["Batters", "Bowlers"], [s["variant"] for s in SN], CB, "{:.2f}"); save(fig, 13)
# F14 top-10 probability
fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
for a, R, col in zip(ax, (BAT, BOWL), (PK, BL)):
    T = sorted([d for d in R if d["rank"] and d["rank"] <= 15], key=lambda d: d["rank"])[::-1]; a.barh([d["name"] for d in T], [100 * d["p_top10"] for d in T], color=[col if d["rank"] <= 10 else GR for d in T]); a.set_xlabel("Share of 400 resamples in which the player finishes in the top 10, %")
save(fig, 14)
# F15 Royals rank by season, role and phase
RR = [t for t in TM if t["team"] == "Rajasthan Royals"]; seas = sorted({str(t["season"]) for t in RR}); cols = [(r, p) for r in ("bat", "bowl") for p in ("PP", "MID", "DEATH")]
M = np.array([[next((t["rank"] for t in RR if str(t["season"]) == s and t["role"] == r and t["phase"] == p), np.nan) for (r, p) in cols] for s in seas], dtype=float); fig, ax = plt.subplots(figsize=(8, 3.4)); heat(ax, M, ["%s %s" % (("Bat", "Bowl")[r == "bowl"], p) for r, p in cols], seas, CP, "{:.0f}"); save(fig, 15)
# F16 one showcase match
m = SC[0]; ov = [o for o in m["overs"] if o[0] == 2]; fig, ax = plt.subplots(figsize=(8, 3.8)); ax.plot([o[1] for o in ov], [100 * o[2] for o in ov], color=NV, lw=2, marker="o"); ax2 = ax.twinx(); ax2.bar([o[1] for o in ov], [o[3] for o in ov], color=PK, alpha=.25); ax.set_xlabel("Over of the chase"); ax.set_ylabel("Chasing side win probability at the start of the over, %"); ax2.set_ylabel("Mean Pressure Index in the over"); ax2.spines["right"].set_visible(True); save(fig, 16)
# F17 funnel
F = V["funnel"]; lab = ["Any ball", "40 and 40", "Qualified", "Active", "IPL eligible", "Not barred"]; fig, ax = plt.subplots(figsize=(8, 3.4)); x = np.arange(6); ax.bar(x - .2, F["bat"], .4, color=PK, label="Batters"); ax.bar(x + .2, F["bowl"], .4, color=BL, label="Bowlers"); ax.set_xticks(x); ax.set_xticklabels(lab); ax.legend(frameon=False); save(fig, 17)
# F18 lift z scores against the normal curve
fig, ax = plt.subplots(figsize=(8, 3.6)); z = [d["lift_z"] for d in BAT + BOWL if d["qualified"] and d["lift_z"] is not None]; ax.hist(z, bins=24, density=True, color=BL, alpha=.75); xs = np.linspace(-4, 4, 200); ax.plot(xs, np.exp(-xs ** 2 / 2) / np.sqrt(2 * np.pi), color=PK, lw=2); ax.set_xlabel("Lift z score, qualified players (curve: what noise alone would give)"); save(fig, 18)
print("FIGURES DONE")
