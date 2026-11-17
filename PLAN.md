# SupeRR Selector Season 2: Pressure Ratings, Research, Dashboard and Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to run this plan step by step. Steps use checkbox (`- [ ]`) syntax. The main agent and every sub-agent are Sonnet class (`subagent_type: "general-purpose"`, `model: "sonnet"`), at most three sub-agents at once. The job is execution, not design: every design decision is already made below. If a step fails, use the recovery table in section 24 before changing anything.

**Goal:** Rank the ten most reliable batters and ten most reliable bowlers under pressure from the supplied IPL and T20I ball-by-ball data, and ship four things that defend that ranking: a methodology and research PDF for the Unstop upload, an interactive dashboard on GitHub and Vercel, a seven-slide Figma Slides deck, and the two ordered top-10 lists.

**Architecture:** One Python model (`model/pressure_model.py`) is the single source of truth. It rebuilds the match state before every ball, fits a win-probability model, scores every ball on a 0 to 100 Pressure Index, values each ball for batter and bowler in win-probability terms, and shrinks each player's pressure record with a two-level empirical Bayes model. It writes `model/model_outputs.json`, `model/model_tables.md` and `public/data/*.json`. The research document, the dashboard and the deck read those files and never compute a number of their own.

**Tech stack:** Python 3.14 (`python -X utf8`; pandas 3.0, numpy 2.4, scikit-learn 1.9, scipy 1.17, lightgbm 4.7, matplotlib 3.11, markdown-it-py 4.2, PyMuPDF), Node 24, Next.js 16 App Router with static export, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts 3, TanStack Table 8, headless Chrome for the PDF, Figma Slides through the Figma MCP `use_figma` tool, GitHub CLI, Vercel CLI.

## Global Constraints

- Working folder for everything: `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\rr-player-ml` (written `RR\` below). Case-study workspace used read-only as a tool and reference source: `C:\Users\harsh\Desktop\HARSH\PPTS-CASE-STUDY\nsut-innovators-court` (written `NIC\` below). Never write inside `NIC\`.
- The six CSVs in `RR\raw-data\` are Rajasthan Royals proprietary data. The GitHub repo is **public with no raw data**: `raw-data/` and `model/out/` are git-ignored and vercel-ignored. Nothing ball-level is ever written under `public/`. Showcase match series are over-level only.
- Rankings come from the supplied data only. Public information is used for the auction overlay (availability, squads, prices) and for citing method literature, never to move a player up or down the two top-10 lists.
- Player pool for the two submitted lists: active (a ball faced or bowled on or after 2025-06-01) and able to register for the IPL (players whose T20I side is Pakistan are excluded), at least 120 pressure balls and 120 ordinary balls in the role. Players retained by other franchises stay in the lists.
- Deck: exactly 7 slides: 1 cover, 4 core, 1 appendix, 1 thank-you. Figma Slides, 1920 by 1080, native vector nodes only, no imported chart images.
- Palette (from the brief PDF's own colours): pink `#E50695`, navy `#021D45`, royal blue `#1226AA`, soft panel `#F5F6FA`. Pink and blue are the two most visible colours on every deliverable.
- Team block everywhere: `TEAM IDEAFORGE`; one row: `Harsh Kawatra | Delhi Technological University (DTU) | Team Leader`. Solo entry. Contact line `harshkawatra11@gmail.com` appears only on the thank-you slide and the research cover.
- Language, all deliverables: zero em dashes and en dashes (ranges use "to", minus is U+2212), no exclamation marks, no question marks outside the judges' Q&A section, no hooks, no rhetorical openers, no "not just X but Y". Banned words: section 2.2. Never write the word "leverage"; the statistic is called **swing**.
- Never coin a product, programme or strategy name. Metric names are plain descriptions: Pressure Index, swing, pressure value, expected pressure value, floor, lift.
- Never invent a quote, an interview, a price, a retention decision or an injury. Every external fact carries a source row with a URL and an access date, or it is not written.
- Text sizes on slides: headline 40 pt (34 minimum), panel title 22 pt, body 22 pt, secondary text 18 pt in nodes named `SEC`, source line 14 pt, fine print 16 pt. Nothing else below 18 pt.
- Git: commit after every step that says so. Commit messages carry no `Co-Authored-By` trailer (the user's standing rule from the case-study workspace). Never commit `raw-data/` or `model/out/`.
- Python is always `python -X utf8` (the 3.14 install on PATH). The 3.12 install lacks lightgbm; do not use it.

---

## Context

Rajasthan Royals and Unstop run SupeRR Selector Season 2. Round 1 asks entrants to build a data-driven system that measures how batters and bowlers perform in high-pressure situations compared with their usual level, then rank the players who deliver most consistently when it matters. The Unstop page frames the purpose: identify the most reliable players under pressure whom Rajasthan Royals should back at the IPL 2027 auction. The submission is two ordered top-10 lists chosen from dropdowns plus one uploaded methodology document that must cover five things: pressure definition, performance measurement, fair comparisons, evidence for the top 10, and reliability and limitations.

The user wants more than the minimum: a large interactive dashboard (the biggest build), a very deep research document, and a consulting-grade Figma deck, all built in this folder with the folder conventions, deck kit, `case-competition-deck` skill and humanizer practice of the case-study workspace.

The method in this plan was prototyped on the real data during planning and dry-run end to end in memory (nothing written to disk). It runs in about 30 seconds and passes 10 of 10 checks. Its most important finding shapes the whole argument: what a player does under pressure, over and above his normal level, does not repeat from one half of his matches to the other (split-half correlation of pressure lift is 0.00 for batters and −0.15 for bowlers), while overall quality does repeat. So the honest way to rank reliability under pressure is to blend a player's pressure record with his ordinary record in the proportion the data supports, and rank on the level we are 80% sure he exceeds.

---

## AUDIT OF 17 NOV 2026 AND AMENDMENTS (read this first; it overrides any earlier section it disagrees with)

### AU.1 Where execution stopped

Done and logged in `RR\build-log.md`: B0 to B4, M1 to M3 (model v1, hash `3b4c16147f`), W1 and most of W2 to W3 (Next.js 16.4.6 scaffold in `RR\`, `lib\types.ts`, `data.ts`, `format.ts`, `pressure.ts`, `board.ts`, `copy.ts`, `scale.ts`, three test files with 19 passing tests, shared components, routes `/` and `/method`, guard scripts `scripts\lint-copy.mjs` and `scripts\check-public.mjs`; `npm run build` passes). Lanes A, B and C1 written to `research\raw\`. Lanes C2, D and E stopped on an account rate limit with partial work saved. No git repository exists yet (the scaffold's own `.git` was discarded with the temporary folder); W1's `git init` is still owed.

Tooling facts learned during execution (keep):
- npm rejects a folder name starting with an underscore; the temporary scaffold folder is `rrweb`.
- Windows PowerShell 5.1 `Set-Content -Encoding utf8` writes a byte-order mark, which breaks `package.json`, `tsconfig.json` and Turbopack. Edit JSON and config files with the Write or Edit tools, never with PowerShell `Set-Content`.
- `next.config.ts` must set `turbopack.root` to the project folder (a stray lockfile in the home folder confuses root detection), and must not set `cacheComponents` (the starter adds it; static export does not need it).
- TanStack Table resolves to v9 by default; it is pinned to v8.
- `vitest.config.mts` (not `.ts`).
- Chart marks use series blue `#3553E0` (the dataviz validator fails brand blue `#1226AA` on its lightness band); brand blue stays for text and structure; pink `#E50695` is used for marks and large text, deep pink `#8A0458` for small text.
- The model script needs `__file__`; when executing it in memory set it in the globals dict, or set `RR_ROOT`.

### AU.2 The dataset is verified unchanged

On 17 Nov 2026 the data files were re-saved and a second data pack was downloaded (`Downloads\6af458274c1e8_data_pack (1)`). All seven files in `raw-data\`, the original pack and the second pack are byte-identical (SHA-256 first 16: ball_by_ball `01e2b4379edfbab6`, mapping `1ded4e42a9336185`, competitions `507ceb7189f972d4`, matches `bb100ab84b8b9a15`, playing_eleven `7517c73722a28d5d`, teams `a65e5922a9b3bf49`, brief PDF `8f7965c616d4a64b`). `raw-data\6af855c0e8386_ball_by_ball.csv` is the same file as `ball_by_ball.csv`.

Data quality, verified: 1 over of 32,338 has more than six legal balls; 3 completed overs of 30,626 have fewer than six; innings totals match stated run margins in 98.8% of unrevised run-margin results and wicket margins in 408 of 409; the three names carried by two ids (Abdul Samad, Basil Hameed, Haider Ali) are six different people (for example Abdul Samad 6922 is Pakistan, 7446 is LSG and SRH), so keying on id is correct; no player is listed for two T20I sides; 12 rows carry a dismissed id with no wicket and are harmless.

### AU.3 What the model audit found

Every test below was run on 17 Nov 2026 against the real data, in memory, with nothing written.

| # | Test | Result | Verdict |
|---|---|---|---|
| 1 | Out-of-time win probability: train 2022 to 2024, test 2025 to 2026 | Chase AUC 0.917, log loss 0.373 (base 0.695); first innings AUC 0.688, log loss 0.641 (base 0.694) | Holds up out of time |
| 2 | Calibration by tier, v1 | IPL chase worst bin off by 0.105; side batting first in the IPL over-predicted by 4 to 5 points, in T20Is under-predicted by 2 to 3 | **Defect** (fixed by 6 and 8) |
| 3 | Decided-match filter | The pattern `Tied\|Super\|...` matches "Chennai Super Kings" and "Lucknow Super Giants": all 31 CSK wins and all 34 LSG wins (65 matches) were dropped from win-probability training | **Bug** (fix P1) |
| 4 | Shortened matches with no revision recorded | 10 matches; 6 are genuinely shortened (for example 15795 India in Ireland, 12 overs; 31278 IPL 2024, 16 overs) and were valued as 20 overs a side; 4 DLS chases have no revised target in the data | **Defect** (fix P2) |
| 5 | Last-12-balls feature | A step at 12 balls left: the 12-to-13 step is 1.83 times its neighbouring steps | **Defect** (fix P6) |
| 6 | Monotonicity of chase win probability | 592 of 60,000 grid cells get worse as balls left rise, caused by the piecewise-flat tree resources model | **Defect** (fix P18) |
| 7 | Credit rules | 25 stumpings off wides never charged to the batter; 6 tactical retired-outs (including Dhoni, Ashwin, Sai Sudharsan) charged as dismissals | **Defect** (fixes P4, P5) |
| 8 | IPL indicator in both win-probability models | Every innings, phase and tier cell within 1.7 points after adding it | Adopted (P6 to P17) |
| 9 | Heavy tails of ball values (kurtosis about 8) | Winsorising at the 1st and 99th percentile: rank correlation 0.991 both roles | Stable |
| 10 | Pressure value against classic stats | Rank correlation with pressure strike rate 0.70, with economy 0.59, with wicket rate 0.51 | Sane |
| 11 | Dead-ball threshold 2/98 or 5/95 instead of 3/97 | Rank correlation 0.983 to 0.993, top 10 kept 9 or 10 | Stable |
| 12 | Prior correlation | Bowlers' unclipped estimate is 1.05 (above 1): pressure value adds no measurable signal beyond ordinary value for bowlers | Disclose; the 0.95 cap stays |
| 13 | **Out-of-time test of the rating** (ratings from 2022 to 2024, outcome is pressure value in 2025 to 2026, v1 model) | Bowlers: top 10 by raw pressure numbers delivered **0.030** later, below the pool average of 0.059; top 10 by our floor delivered **0.118**. Batters: raw 0.136, floor 0.157, pool 0.125. Lift early against lift late: −0.08 batters, −0.14 bowlers | The rating beats raw pressure numbers out of time; this becomes a model output and a deck exhibit (AU.6) |
| 14 | Sample gate | Under the final model, two batters sit at 119 pressure balls (Sooryavanshi, Hendricks); gates of 100 and 110 give identical lists; 120 swaps them for Iyer and Kohli; bowling list identical at every gate | User chose 110 (D10) |
| 15 | Eligibility facts | Andre Russell (id 1318) retired from the IPL as a player on 30 Nov 2025 (lane C1); MS Dhoni (id 8) retired on 17 Nov 2026 ([ANI](https://www.aninews.in/news/sports/cricket/end-of-an-era-ms-dhoni-ends-ipl-playing-career-after-19-seasons20261117164202/)) and was already outside the lists (last ball 20 May 2025) | Retirees barred (D12) |
| 16 | Players labelled Dips in the final top 10 without a rule | Bowlers: Chakravarthy, Mohsin Khan, Muzarabani, Duffy; batters: Patidar, Salt | Dips barred from the top 10 (D11) |
| 17 | Equal weight for every season (raised by the user over Suryakumar Yadav) | A 2022 ball counted as much as a 2026 ball. Out-of-time test by half-life (T24): batters predict best at 1 year, bowlers at 3 years. Suryakumar moves from 2nd to 9th | **Design gap** (fix P23, D15) |
| 18 | Eligibility from public facts | Harry Brook (would rank 3rd) has a two-season IPL ban covering 2026 and 2027 per most sources | Barred (D16), pending official confirmation |
| 19 | Consistency across matches, the brief's own words | Not reported at player level in v1 | Added as evidence, not used to rank (P24, T25) |

Edge cases checked and handled or disclosed: wickets on wides (40: 25 stumpings, 15 run outs), wickets on no-balls (8 run outs), run outs (598: 328 striker, 270 non-striker, none of a third player), retired out (6), penalty rows (1), extras-two rows (36), chase balls after the target (0 left), last-ball ties possible (7 balls), balls at the dead-ball edge (2,908), players within 15 balls of a gate (16 batters, 13 bowlers), qualified players with no nation in the data (16 batters, 12 bowlers, including Patidar, Arya, Narine, Krunal Pandya, Mohsin Khan; filled by `nation_overrides.csv`), no-result and abandoned matches (1,753 balls in 24 matches: valued, never used for training), Pakistan exclusion (Haris Rauf would rank about 9th among bowlers if eligible: state this in the report).

### AU.4 Decisions locked on 17 Nov 2026

| # | Decision | Consequence |
|---|---|---|
| D9 | Resources curve in the published Duckworth-Lewis form, fitted to this data: R(u, w) = Z0 x F(w) x (1 − exp(−b x u ÷ F(w))) x environment factor, F rising with wickets in hand | Patch P18; zero monotonicity violations; better chase fit |
| D10 | Sample gate 110 pressure balls and 110 ordinary balls (was 120). The report states that the gate moved during the audit, why, and shows the 120 list beside it | `CFG min_p=min_o=110`; table T21 |
| D11 | A player labelled Dips (lift z below −1.28) cannot take a top-10 place; he stays in the research and dashboard with the reason shown | `CFG bar_dips=True`; field `barred` |
| D12 | Players publicly confirmed retired from the IPL cannot take a top-10 place (extended by D16 to bans); ids in `model/inputs/ineligible.csv` with a source each | Russell 1318, Dhoni 8, Brook 6280 at planning time |
| D13 | Model version 2 replaces version 1 everywhere; every v1 number in this plan (sections 3.9, 5, 7) is superseded by the v2 run | Step M4 |
| D14 | Rajasthan Royals auction context gets a verified franchise ledger: purse, retained players and salaries, overseas slots, squad slots, trades | Lane G (AU.7) |
| D15 | Recency weighting: a ball's weight halves every 365 days for batters and every 1,095 days for bowlers, measured back from the latest match in the data. The values were chosen by the out-of-time test (T24): batting form is recent, bowling quality is durable. The user's instruction (17 Nov): a six hit in 2022 must not count the same as one hit in 2026 | Patch P23; `CFG half_life`; gates still count raw balls |
| D16 | The bar list covers any player who cannot be bought at the 2027 auction: retired from the IPL, or banned. Ids and reasons live in `model/inputs/ineligible.csv` (header `player_id,name,reason,date,source_rid`) | Planning time: Russell 1318 (retired), Dhoni 8 (retired 17 Nov 2026), Brook 6280 (two-season ban covering 2026 and 2027 per most sources; lane G confirms against an official page) |
| D17 | The CSVs are the prime source for every rating. Public sources (web, the user's browser, training knowledge) explain the numbers and decide eligibility; they never move a rank directly. When a rated player's numbers drop sharply, lane F finds the reason and the report states it | Lane F (AU.7a) |

### AU.5 Model version 2: the patch script (embedded; step M4)

<!-- FILE: model/patch_v2.py -->
```python
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
```

Run (step M4), from `RR\`:

```
python -X utf8 model/patch_v2.py
python -X utf8 model/pressure_model.py
python -X utf8 model/figures.py
python -X utf8 model/verify_outputs.py
```

Verified at planning time on 17 Nov 2026 by extracting this exact block from the plan, applying it in memory and running the result with `RR_DRY=1`: 44 replacements, about 45 seconds plus the half-life loop. Expected tail of the model run:

```
CHECKS 15/15 HASH c34d772dd7
TOP10 BAT: Vaibhav Sooryavanshi, Abhishek Sharma, Tim David, Heinrich Klaasen, Virat Kohli, Shreyas Iyer, Ishan Kishan, Lokesh Rahul, Suryakumar Yadav, Namboori Tilak Varma
TOP10 BOWL: Jasprit Bumrah, Bhuvneshwar Kumar, Josh Hazlewood, Sunil Narine, Kuldeep Yadav, Varun Chakravarthy, Rashid Khan, Mustafizur Rahman, Krunal Pandya, Trent Boult
OUT OF TIME {'bat': (0.111, 0.117, 0.125), 'bowl': (0.117, 0.205, 0.066)} | GATE 110 | BARRED {'bat': ['Harry Brook', 'Andre Russell', 'Phil Salt', 'Glenn Phillips', 'Rajat Patidar'], 'bowl': ['Mohsin Khan', 'Blessing Muzarabani', 'Jacob Duffy', 'Arshdeep Singh', 'Corbin Bosch']}
MODEL PASS
```

If `model/inputs/ineligible.csv` or `nation_overrides.csv` adds rows later, the hash changes; accept it, log it, and use the new numbers everywhere (D13).

### AU.6 Version 2 numbers (planning time, hash `c34d772dd7`, recency weighted; these replace sections 3.9, 5 and 7 for every writer, builder and slide)

| Rank | Batter | Pressure balls | Pressure value | Ordinary value | Floor | Points per 100 pressure balls | Top-10 probability | Rank range | Lift |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Vaibhav Sooryavanshi | 119 | +0.68 | +0.39 | +0.278 | +72 | 94% | 1 to 6 | Rises |
| 2 | Abhishek Sharma | 351 | +0.28 | +0.26 | +0.220 | +57 | 93% | 1 to 8 | Steady |
| 3 | Tim David | 444 | +0.27 | +0.29 | +0.171 | +44 | 68% | 1 to 24 | Steady |
| 4 | Heinrich Klaasen | 319 | +0.35 | +0.18 | +0.164 | +42 | 79% | 2 to 15 | Steady |
| 5 | Virat Kohli | 597 | +0.24 | +0.16 | +0.142 | +37 | 69% | 3 to 19 | Steady |
| 6 | Shreyas Iyer | 409 | +0.24 | +0.16 | +0.137 | +36 | 61% | 3 to 23 | Steady |
| 7 | Ishan Kishan | 438 | +0.15 | +0.16 | +0.115 | +30 | 39% | 4 to 32 | Steady |
| 8 | Lokesh Rahul | 429 | +0.24 | +0.11 | +0.112 | +29 | 37% | 5 to 32 | Steady |
| 9 | Suryakumar Yadav | 527 | +0.18 | +0.12 | +0.110 | +29 | 40% | 5 to 32 | Steady |
| 10 | Namboori Tilak Varma | 698 | +0.20 | +0.09 | +0.109 | +28 | 36% | 5 to 30 | Steady |

| Rank | Bowler | Pressure balls | Pressure value | Ordinary value | Floor | Points per 100 | Top-10 probability | Rank range | Lift |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Jasprit Bumrah | 455 | +0.27 | +0.18 | +0.091 | +24 | 90% | 1 to 11 | Steady |
| 2 | Bhuvneshwar Kumar | 709 | +0.22 | +0.17 | +0.091 | +24 | 89% | 1 to 11 | Steady |
| 3 | Josh Hazlewood | 421 | +0.30 | +0.17 | +0.088 | +23 | 81% | 1 to 14 | Steady |
| 4 | Sunil Narine | 400 | +0.25 | +0.20 | +0.087 | +22 | 90% | 1 to 11 | Steady |
| 5 | Kuldeep Yadav | 443 | +0.20 | +0.13 | +0.063 | +16 | 62% | 3 to 21 | Steady |
| 6 | Varun Chakravarthy | 516 | +0.10 | +0.19 | +0.063 | +16 | 58% | 3 to 24 | Steady |
| 7 | Rashid Khan | 662 | +0.15 | +0.13 | +0.059 | +15 | 56% | 3 to 26 | Steady |
| 8 | Mustafizur Rahman | 370 | +0.14 | +0.16 | +0.056 | +14 | 45% | 5 to 24 | Steady |
| 9 | Krunal Pandya | 360 | +0.19 | +0.12 | +0.050 | +13 | 38% | 4 to 30 | Steady |
| 10 | Trent Boult | 517 | +0.21 | +0.06 | +0.048 | +12 | 31% | 6 to 30 | Rises |

Pressure and ordinary values in these two tables are recency weighted. Pressure balls are raw counts.

Other v2 values: 2,00,999 raw rows; 1,72,863 live balls; 43,216 pressure balls; 837 matches; chase AUC 0.90, log loss 0.393; first innings AUC 0.69, log loss 0.636; largest calibration gap 0.025; largest innings, phase and tier bias 0.014; swing ratio Extreme to Routine 4.1 (0.91, 1.36, 1.85, 3.70 points); wicket rate 5.1% Routine to 6.8% Extreme; pressure share: chase death 76%, chase middle 43%, chase powerplay 32%, first-innings death 32%, first-innings powerplay 10%, first-innings middle 3%, knockouts 60% against 24% in league matches; split-half (unweighted): batters pressure +0.37, ordinary +0.20, lift +0.16; bowlers pressure +0.07, ordinary +0.18, lift −0.07; prior correlation batters 0.95 (capped), bowlers 0.81; eligibility funnel batters 788, 226, 114, 100, 97, 87 and bowlers 577, 221, 120, 107, 101, 83; stability rank correlations 0.80 to 1.00 (lowest: IPL balls only); firm names (top-10 probability 65% or more) 5 batters and 4 bowlers; resources curve Z0 305.9, b 0.0072, F(1..10) 0.054, 0.091, 0.154, 0.228, 0.357, 0.459, 0.575, 0.713, 0.854, 1.000.

Half-life choice (T24; correlation of the floor with later pressure value, and the later value of the top 10):

| Half-life | Batters corr | Batters top 10 later | Bowlers corr | Bowlers top 10 later |
|---|---|---|---|---|
| None | +0.042 | +0.105 | +0.401 | +0.205 |
| 3 years | +0.040 | +0.105 | **+0.408** | **+0.205** |
| 2 years | +0.041 | +0.115 | +0.405 | +0.202 |
| 1 year | +0.051 | **+0.117** | +0.377 | +0.169 |
| 6 months | +0.058 | +0.113 | +0.291 | +0.134 |

Batters: 1 year gives the best top 10 and close to the best correlation. Bowlers: 3 years is best on both counts.

Out-of-time test with the chosen half-lives (T19): bowlers (60 players): top 10 by our floor delivered **+0.205** in 2025 and 2026, against +0.117 for the top 10 by raw pressure numbers and a pool average of +0.066. Batters (53 players): +0.117 for the floor top 10, +0.111 for the raw top 10, pool +0.125.

The honest reading, required in research section 7 and on slide 3: **for bowlers the rating predicts later pressure performance and clearly beats raw pressure numbers; for batters no early measure predicts later pressure value, ours included, so the batting list is a statement about the recent record, firm in its top four and soft from rank 5.**

Suryakumar Yadav, the user's question of 17 Nov, answered from the data:
- **The data is current.** It runs to 1 Nov 2026.
- **The timeline.** His last T20I in the file is 31 Jan 2026. India then played 24 T20Is without him, all captained by Shreyas Iyer.
- **His pressure value by year:**

| Year | IPL | T20I |
|---|---|---|
| 2022 | +0.17 | +0.35 |
| 2023 | +0.28 | +0.29 |
| 2024 | +0.02 | +0.53 (7 balls) |
| 2025 | **+0.31** (101 pressure balls, strike rate 183) | −0.35 |
| 2026 | −0.09 (16 pressure balls) | +1.12 (6 balls) |

- **His rank.** Without recency weighting he ranked 2nd on the strength of 2022 and 2023. With it he ranks 9th, with a 40% top-10 probability, held up mainly by IPL 2025.
- **What the report says.** The reasons for the decline are lane F's job. The report states his rank, its softness and the timeline, and lane F supplies the reasons.

Rajasthan Royals in 2026 under pressure (unchanged by recency): batting 2nd of 10 overall (powerplay 3rd, middle 4th, death 2nd); bowling 7th overall (powerplay 5th, middle 6th, death 9th). Gap cells (rank 6th or lower): bowling middle and bowling death. Royals in the ratings: Sooryavanshi batting 1st, Parag 16th, Curran 24th, Jaiswal 39th, Hetmyer 40th; Jadeja bowling 17th, Archer 19th, Sandeep Sharma 43rd. No Royals bowler is in the top 10.

Barred players to show (T22):
- Batters: Harry Brook (rank 3 before the bar, banned from the 2027 IPL), Andre Russell (7, retired from the IPL), Phil Salt (15, Dips), Glenn Phillips (18, Dips), Rajat Patidar (20, Dips).
- Bowlers: Mohsin Khan (11), Blessing Muzarabani (12), Jacob Duffy (20), Arshdeep Singh (26), Corbin Bosch (30), all Dips.

Gate sensitivity (T21): 100 and 110 give the same names; 120 drops Sooryavanshi and adds Shubman Gill.

### AU.7 Lane G: franchise ledger and news verification (new; verifier V-G, then Main)

The user asked on 17 Nov 2026 for every circulating claim about purses, trades and retentions to be verified, and for a purse calculation per franchise, because the whole exercise serves Rajasthan Royals. The user also pasted a summary of auction rules; treat every line of it as a claim to verify, never as a source.

**Timing.** Retention and release lists were due on 17 Nov 2026 (deadline moved from 15 Nov, lane A). Run lane G no earlier than the day the IPL publishes them on iplt20.com or the franchises publish them on their official sites. Before that, write `PREDICTION` rows only, in a separate table, and never mix them with verified rows.

**Claims to verify, one row each in `research/raw/R-G.md`** (lane schema of section 10; statuses add `PREDICTION`):

| # | Claim | What lane A already found |
|---|---|---|
| G1 | 2027 is a mini-auction with no fixed retention limit | Reported by media; official regulations cover 2025 to 2027 |
| G2 | Squad maximum 25, minimum 18, at most 8 overseas | 25 and 8 found; minimum 18 marked UNVERIFIABLE (A39) |
| G3 | No right-to-match cards at the 2027 auction | Media explainers only |
| G4 | A retained player costs his existing contract, no retention slabs | Not yet checked |
| G5 | Auction purse per franchise: ₹125 crore (user's summary) | **Conflict**: lane A found reports of ₹130 crore (A13, A14); no official figure |
| G6 | Salary cap ₹157 crore, covering purse, performance pay and match fees | Found in the official regulations |
| G7 | Match fee ₹7.5 lakh per Playing XI and Impact Player appearance, above the contract | Not yet checked |
| G8 | A player who withdraws after being bought can be banned for two seasons | Not yet checked |
| G9 | Uncapped Indian rule: no international appearance or central contract for five calendar years | Not yet checked |
| G10 | Trades: Hardik Pandya MI to PBKS for Arshdeep Singh; Rishabh Pant and Kuldeep Yadav; T Natarajan and Zeeshan Ansari; CSK and SRH (Liam Livingstone, Jack Edwards for Khaleel Ahmed, Nathan Ellis) | Hardik and Arshdeep confirmed on iplt20.com 11 Nov; the rest reported official by lane A; re-verify each against an iplt20.com advisory |
| G11 | Each franchise's retained and released players, with contract amounts and overseas status | Due 17 Nov |
| G12 | The Royals' ownership change and staff for 2027 | Lane B: sale to the Mittal family and Adar Poonawalla cleared by the Competition Commission on 17 Sep 2026, board approval outstanding |
| G13 | Retirements and bans announced around the deadline (Dhoni confirmed 17 Nov; Brook's ban period has one conflicting source; check for others, especially rated players) | Feeds `model/inputs/ineligible.csv` |

**Outputs.**
1. `research/raw/R-G.md`: 60 to 150 rows.
2. `model/inputs/franchise_ledger.csv`: one row per retained player, with header `franchise,player_id,player_name,overseas,contract_cr,status,status_date,source_rid`; `status` is `RETAINED` or `TRADED_IN`; `player_id` is taken from `public/data/*.json` or the mapping file when the player exists in the data, and left empty otherwise.
3. `model/inputs/purse.csv`: header `franchise,purse_cr,basis,source_rid`. Use one row per franchise with the verified purse. If G5 is still in conflict, write the ₹125 crore and ₹130 crore rows both, with `basis` set to `reported_low` and `reported_high`.
4. Update `model/inputs/availability.csv` (section 9) and `model/inputs/ineligible.csv`. Header `player_id,name,reason,date,source_rid`; `reason` is exactly `Retired from the IPL` or `Banned from the 2027 IPL`. Rows at planning time:
   - `1318,Andre Russell,Retired from the IPL,2025-11-30,<C1 row id>`
   - `8,Mahendra Singh Dhoni,Retired from the IPL,2026-11-17,<G row id>`
   - `6280,Harry Brook,Banned from the 2027 IPL,2025-03,<G row id>`

   Planning-time sources:
   - Dhoni: [ANI, 17 Nov 2026](https://www.aninews.in/news/sports/cricket/end-of-an-era-ms-dhoni-ends-ipl-playing-career-after-19-seasons20261117164202/)
   - Brook: [Flashscore](https://www.flashscore.com/news/cricket-ipl-england-s-harry-brook-handed-two-year-ban-from-ipl-after-late-withdrawal/MREOWow8) and [Cricxtasy via Dailyhunt](https://m.dailyhunt.in/news/india/english/cricxtasycom-epaper-cricxtas/can+harry+brook+play+in+ipl+2027+when+will+he+be+eligible+for+the+auction-newsid-n727065363) give 2026 and 2027; [Business Upturn](https://businessupturn.com/sports/cricket/ipl/heres-why-harry-brook-was-banned-from-ipl-for-two-years/) gives 2025 and 2026. Lane G settles it on an official page. If the official ban ended with 2026, delete his row and rerun.
5. Rerun the model (M4 commands); then run `model/ledger.py`.

<!-- FILE: model/ledger.py -->
```python
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
```

The ₹30 lakh base price in `max_bid_cr` is an assumption (A-row in research section 31) until lane G verifies the 2027 minimum base price; replace the constant if a different figure is verified. `scripts/check-public.mjs` must add `ledger.json` to its allowed list in the same step.

**Where the ledger is used.** Dashboard `/auction` gets a "Franchise ledger" panel: a table with the Royals row pinned first, and bars of purse left by franchise. Research sections 25 and 26 get the ledger tables and the claim verdicts G1 to G13. Slide 5 gets the Royals' purse left, slots left and overseas slots left, plus the three franchises with the most purse left; these are the rivals for each target. The target board (11.3) adds a column showing which franchises can afford a player at his last public price.

**Current teams.** Trades move rated players: Nathan Ellis (bowling 8th) is reported traded from CSK to SRH, and Kuldeep Yadav (bowling 5th) is part of the Pant trade. The data's "latest IPL side" therefore goes stale. Every place that shows a team (dashboard, research, deck) shows `team_2027` from `availability.csv` when it is verified, and the data's latest side otherwise, labelled "2026 side".

### AU.7a Lane F, rewritten: form-drop investigation (verifier V-F, two agents)

The user's instruction (17 Nov 2026): when a player's numbers drop sharply, find the reason on the internet. Do not assume a 2022 performance carries into 2027. Build the team you would actually field.

**Who to investigate.** Main first writes `research/raw/form_flags.csv` with this script:

```python
import json, pandas as pd
rows = []
for f, role in (("public/data/batters.json", "bat"), ("public/data/bowlers.json", "bowl")):
    for d in json.load(open(f, encoding="utf-8")):
        r = d["rank"] or d["rank_pre"]
        if not r or r > 30: continue
        yr = {k: (n, v) for k, n, v, _, _ in d["splits"]["year_hp"]}
        late = [yr.get(f"{y}|P", (0, None)) for y in ("2025", "2026")]; early = [yr.get(f"{y}|P", (0, None)) for y in ("2022", "2023", "2024")]
        wl = sum(n for n, _ in late); we = sum(n for n, _ in early)
        vl = sum(n * (v or 0) for n, v in late) / wl if wl else None; ve = sum(n * (v or 0) for n, v in early) / we if we else None
        rows.append(dict(player_id=d["id"], name=d["name"], role=role, rank=d["rank"], rank_pre=d["rank_pre"], last_ball=d["last"], pressure_value_2022_24=ve, pressure_value_2025_26=vl, balls_2025_26=wl, drop=(ve - vl) if (ve is not None and vl is not None) else None,
                         flag=bool((ve is not None and vl is not None and ve - vl >= 0.20) or (d["last"] or "") < "2026-01-01")))
pd.DataFrame(rows).to_csv("research/raw/form_flags.csv", index=False); print(sum(r["flag"] for r in rows), "flagged of", len(rows))
```

A player is flagged when either holds:
- his pressure value fell by 0.20 or more from 2022 to 2024 to 2025 to 2026;
- he has not played since the end of 2025.

**What the verifier finds** for every flagged player, plus every player in either top 10 whatever his flag:
- Injuries and surgeries since 2024, with dates and expected return.
- Dropped from, or recalled to, a national side; captaincy changes (for example India's T20I captaincy passing from Suryakumar Yadav to Shreyas Iyer in 2026, which the data already shows).
- Retirements from any format.
- Bans or suspensions.
- Domestic form in 2025 and 2026 (Syed Mushtaq Ali Trophy, Ranji Trophy, overseas leagues), with figures and sources.
- Age on 1 Mar 2027.
- Workload limits announced by the player's board.

Rows go into `research/raw/R-F.md` with the section 10 schema. Facts only, with sources: no opinion of the player's quality.

**How the findings are used:**
1. **Eligibility.** A verified retirement from the IPL, a ban covering 2027, or an injury officially ruling the player out of the whole 2027 IPL goes into `model/inputs/ineligible.csv` with its reason. The reason column then also allows `Ruled out of IPL 2027`. These are the only findings that change a list, and only by barring.
2. **Explanation.** Every other finding goes into research section 20 or 21 (the player's dossier), the Profile page on the dashboard (a "Context" panel with dated, sourced lines), and the Royals board (a risk column). The rating already weighs recent form through D15. A news item never moves a rank by hand.
3. **Report wording.** For each top-10 player with a flag, research section 7 states the flag, the reason found and what it means for the 2027 auction, in one sentence each.

### AU.8 Recovering the three lanes stopped by the rate limit

Lanes C2 (bowler availability), D (prices) and E (method literature) stopped on 15 Nov with partial work saved. Resume each by sending a SendMessage to the agent: "Continue from where you stopped. Re-read your output file first, keep every row already written, and finish the brief." If SendMessage reports that the agent no longer exists, re-dispatch the original prompt from section 23.1, adding: "A partial file may exist; read it first and extend it." Lane F (player context) is still to run. After the official lists appear, re-run lane C1 and lane C2 against them, and refresh `C1-summary.csv`, `C2-summary.csv` and `availability.csv`.

### AU.9 `model/verify_outputs.py` (embedded; runs after every model run; not executed at planning time)

<!-- FILE: model/verify_outputs.py -->
```python
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
```

### AU.10 What changes downstream

**Submission.** Rewrite `submission/top10.md` after M4, from the v2 output (same script as M3). Add a section "Players barred from the lists and why", listing table T22 with sources.

**Dashboard.**
- Records gain `barred` and `rank_pre`. Add these two fields to `lib/types.ts`.
- `LeaderTable` is unchanged; it shows ranked players only.
- Explorer and Profile show a "Barred: <reason>" badge with the rank the player would hold without the bar.
- `/method`:
  - The funnel has six steps; the last is "And not barred".
  - Add a panel "Out of time": two grouped bars per role (top 10 by raw numbers, top 10 by our floor, pool average) with the caption from AU.6.
  - Add a panel "Gate sensitivity" from `deck.gates`.
  - Add a panel "Edge cases" from table T20.
  - The step list says 110 balls and the Duckworth-Lewis resources form.
- `/auction` gets the ledger panel (AU.7).
- `lib/copy.ts`: the limits list gains "Batting pressure value barely predicts itself two seasons ahead; the batting list describes the record to date" and "The sample gate moved from 120 to 110 balls during the audit; the 120 list is on the Method page."
- Update the War Room KPI tile for repeatability, and every hard-coded 120.

**Research** (section 11.2; Part A stays within the brief's five headings):
- Section 2 gains the Duckworth-Lewis resources form and table T23.
- Section 3 gains the credit-rule edge cases (T20).
- Section 4 states the 110-ball gate, the audit history and T21.
- Sections 5 and 6 use the v2 lists.
- Section 7 opens with the out-of-time test (T19) and the honest reading in AU.6, then the bars (T22), then the limits.
- New section 12A, "The audit: five defects found and fixed before submission" (the AU.3 table), 1,200 words, writer W-B.
- Section 33 gains questions on the gate change, the bars, Dhoni and Russell, and why batting is less predictable.

**Deck.**
- S3's moneyshot becomes the out-of-time result for bowlers: "+0.205 against +0.127", the top 10 by our floor against the top 10 by raw pressure numbers in the following seasons. The split-half figures move to a supporting panel.
- S4 uses the v2 lists, with one line under each table naming the barred players.
- S5 uses the v2 Royals gap cells (bowling middle and death) and the ledger numbers.
- S6 A2 gains the gate row.
- Headline h3 becomes: `f"Ranked on our floor, the top 10 bowlers from 2022 to 2024 added {top_floor} a pressure ball in 2025 and 2026, against {top_raw} for the top 10 by raw pressure numbers"` (assert 160 characters or fewer).

**Plan text superseded.** Section 3.8's 120 becomes 110. Section 5 and 7 tables give way to AU.6. The check count 11 becomes 15. The FINDINGS line now also prints OUT OF TIME.

### AU.12 The report standard: the brief's five headings, written as a cricket analyst would (overrides section 11.2 for Part A)

The user (17 Nov 2026) wants Part A to read like the work of an analyst who could say "this side wins this match, and this player wins it for them". Part A has exactly five sections, titled with the brief's own words, in the brief's order. Each must contain every item below; writers W-A to W-D read this section before section 11.2.

**Analyst conventions, applied in every section:**
- 100 win-probability points is one match. Points per 100 pressure balls ÷ 100 is matches swung per 100 pressure balls. Always give this conversion beside a value or floor; for example, a floor of +29 points per 100 pressure balls is about 0.29 matches swung per 100 pressure balls.
- Pair every model number with its cricket meaning: the over, the equation, the wickets in hand.
- Calibration is stated as a forecaster would put it: "when the model gives the chasing side 70%, chasing sides won N in 10" (from T5).
- Name the match for every example: date, teams, competition, over and equation, all taken from `showcase.json` or a player's `matches` list.

| Brief heading | Section | Required content and exhibits |
|---|---|---|
| **Pressure definition: the match situations and indicators you used, and why** | 1 | The formula in a box. A table of the four signals and the knockout uplift, each tied to the brief's own list (required rate, wickets in hand, balls remaining, stage, closeness), with its weight and the reason for it. Dead balls and why. The four bands. **Proof that it separates situations:** T7 (swing 4.1 times, wicket rate 5.1% to 6.8%), T8 (where pressure lives: chase death 76% against first-innings middle 3%, knockouts 60% against 24%), F03, F04, F05 and F06. **Three named match moments**, from the 12 showcase chases, with the Pressure Index worked out: one Extreme, one High, one Routine. Why not swing alone, and the sensitivity rows of T16 |
| **Performance measurement: the batting and bowling metrics, player baselines, and rating or scoring logic** | 2 | Ball value in win-probability terms. The win-probability model and its accuracy (T4, T5, T6; out of time: chase AUC 0.917). The Duckworth-Lewis resources curve (T23). The credit rules for batter and bowler as a table, including the edge cases (T20). **Two baselines:** the league in the same innings, phase, band and bowling kind; and the player's own ordinary record. Opposition adjustment. **Rating logic:** the two-level formula in a box, the 80% floor, recency half-lives with the evidence (T24). A worked example by hand for the rank-1 batter and the rank-1 bowler. Classic stats beside the model (strike rate, economy, dot and boundary share, dismissal rate in each state) with their rank agreement (0.70 strike rate, 0.59 economy) |
| **Fair comparisons: your approach to sample sizes, player eligibility, different match contexts, and the use of IPL and T20I data** | 3 | **Sample sizes:** the 110-ball gate, its history (120 to 110 during the audit, and why), T21 showing the 120 list, and how the floor penalises thin records. **Eligibility:** the funnel (T11, six steps); active since June 2025; able to register for the IPL (Pakistan players; ineligible list with sources); the Dips bar and its reason; T22. **Match contexts:** scoring environment by tier and season (T3); innings, phase, band and pace or spin baselines; opposition strength; knockouts. **IPL and T20I:** tier weights 1.00, 0.85, 0.60 and why; the share of each top-10 player's pressure balls from the IPL; the "IPL balls only" stability row |
| **Evidence for your top 10: the results, comparisons, tables or charts that support your selections and ordering** | 4 | The two ranked tables (AU.6), F09 and F10. **Consistency across matches (T25):** pressure matches, share helping, decisive and costly matches. **One card per player (20 cards):** role and position or bowling type; pressure against ordinary for value, rate, dismissals or wickets; phase heat row; five biggest pressure matches, named; top-10 probability and rank range; lift class; flags and context from lane F; 2027 status. **Ordering:** for each pair of neighbours, one sentence saying what separates them and whether the gap is inside the uncertainty. The barred players, and where they would have ranked |
| **Reliability and limitations: how you checked consistency across matches, and where your model may be less certain** | 5 | **Checks:** match-level bootstrap (F14, rank ranges); odd against even matches (T9, F07, F08); out-of-time test (T19) with the honest reading in AU.6; the half-life test (T24); stability under nine variants (T16); calibration by innings, phase and tier; edge cases (T20); the audit's five defects found and fixed. **Where we are less certain:** the soft ranks (6 to 10 in both lists); batting predictability; the two batters on 119 pressure balls; bowlers' pressure record adding little beyond ordinary record (prior correlation); data limits (no fielding, venue or partnerships); disputed facts (Brook's ban period, purses). Each limit gets one sentence on what it could change |

**Acceptance for Part A**, checked by the critic in step R7 and added to `research/assemble.py` as a gate:
- the five H2 titles contain the five headings verbatim;
- every table named above appears in its section;
- the 20 player cards exist;
- the three named match moments exist;
- the matches-swung conversion appears at least once in each of sections 2 and 4.

### AU.11 Revised step order from here

| Step | Who | Action | Done when |
|---|---|---|---|
| A0 | Main | `git init -b main` in `RR\` (owed from W1). Log AU.1 to AU.4 in `DECISIONS.md` | Repository exists |
| M4 | Main | Copy the updated plan over `RR\PLAN.md`. Extract only the three AU files with the AU extractor below. Write `model/inputs/ineligible.csv` (AU.7 item 4). Run the four M4 commands | `CHECKS 15/15`, `MODEL PASS`, `FIGURES DONE`, `VERIFY PASS`; the hash is `c34d772dd7`, or the change is logged |
| M5 | Main | Rewrite `submission/top10.md` from v2 | `VERIFY PASS` again |
| R1b | Main | Resume lanes C2, D and E (AU.8); dispatch F | Four lane files complete |
| G1L | V-G, after official retention lists exist | Lane G (AU.7) | `R-G.md`, `franchise_ledger.csv`, `purse.csv` |
| F1 | V-F (two agents: batters, bowlers) | Lane F, form-drop investigation (AU.7a) | `R-F.md`, `form_flags.csv` |
| G2L | Main | Re-run C1 and C2 against the official lists; update `availability.csv` and `ineligible.csv` (from lanes F and G); rerun the M4 commands; run `model/ledger.py` | `MODEL PASS`, `VERIFY PASS`, `LEDGER PASS` |
| W2b | Main | Dashboard changes in AU.10; extend `check-public` | `npm test`, `check:public`, `lint:copy`, `build` all pass |
| then | | Continue at W4 in section 22.1, with the research, deck and publishing steps exactly as written, reading every number from v2 files | |

**AU extractor.** Never run the section 22.2 extractor again: it would rewrite `model/pressure_model.py` back to v1 from section 6. Use this one, which reads only the AU section. Pipe it into `python -X utf8 -` through a PowerShell here-string, from `RR\`:

```python
import re, io, pathlib
t = io.open("PLAN.md", encoding="utf-8").read(); a = t.index("## AUDIT OF 17 NOV 2026"); b = t.index("## PART 0. HOW TO READ"); n = 0
for m in re.finditer(r"<!-- FILE: (\S+) -->\n```\w*\n(.*?)\n```\n", t[a:b], re.S):
    p = pathlib.Path(m.group(1)); assert p.name in ("patch_v2.py", "ledger.py", "verify_outputs.py"), p
    p.parent.mkdir(parents=True, exist_ok=True); io.open(p, "w", encoding="utf-8", newline="\n").write(m.group(2) + "\n"); n += 1; print("wrote", p)
print("extracted", n, "files")
```

Expected: `extracted 3 files`.

---

## PART 0. HOW TO READ THIS PLAN

### 0.1 Parts

| Part | Sections | What it holds |
|---|---|---|
| I | 1 to 2 | The brief, the user's locked decisions, folder layout, ground rules |
| II | 3 to 5 | The solved case: the method, the argument, the planning-time numbers |
| III | 6 to 9 | The model: embedded code, run commands, expected output, figures |
| IV | 10 to 13 | External research lanes and the research document |
| V | 14 to 17 | The dashboard |
| VI | 18 to 21 | The Figma deck |
| VII | 22 to 26 | Execution sequence, sub-agent prompts, recovery, checklists, end-to-end verification |

### 0.2 Roles

| Role | Model | Does | Never does |
|---|---|---|---|
| Main | Sonnet | Runs every step in section 22 in order, runs the model, builds the dashboard shell, makes every Figma call, logs to `build-log.md` | Changes the method, the weights, the thresholds or a number by hand |
| Verifiers V-A to V-F | Sonnet sub-agents | Web research for one lane each (section 10), writing `research/raw/R-<lane>.md` | Write prose for the document, guess a fact, cite a page they did not open |
| Writers W-A to W-G | Sonnet sub-agents | Write the research parts (section 11) from model files and verified lane rows | Browse, compute new statistics, invent facts |
| Builders B-1 to B-3 | Sonnet sub-agents | Build dashboard pages from the page specs (section 15) | Change the data contract in section 14 |
| Critic CR | Sonnet sub-agent | Critique mode of the `case-competition-deck` skill on the research and on the deck | Edit files |

### 0.3 Execution contract

DO:
1. Read sections 1 to 5 fully before the first step. Every later choice depends on them.
2. Copy this plan to `RR\PLAN.md` in step B0 and work from that copy.
3. Run a command, compare its output with the "Done when" text, then log `STATUS: PASS` or `STATUS: FAIL` with the output line in `RR\build-log.md`.
4. Take every number from `model/model_outputs.json`, `model/model_tables.md` or a `VERIFIED` lane row. Copy, never retype from memory.
5. When the model output differs from a planning-time number in section 5, the model output wins. Record the difference in `RR\DECISIONS.md` as `date | step | decision | why`.

DO NOT:
1. Do not change `CFG` in the model. The sensitivity table already tests the alternatives.
2. Do not move a player in the top-10 lists for any reason outside the model.
3. Do not write ball-level data to `public/` or commit `raw-data/`.
4. Do not edit a generated file by hand (`model_outputs.json`, `public/data/*.json`, `deck/build/*`, `deck/values.js`).
5. Do not publish, push or deploy before the gate step that says so (G1 for GitHub, G2 for Vercel). Both gates need the user's confirmation in the session.
6. Do not rebuild a Figma slide from part 2 onward; a failed part means rerunning the slide from part 1.
7. Do not open `NIC\marksoc-case`, `NIC\arthikkhayal-case` or any `lsr-caseforchange` material as a style model. The approved models are `NIC\polygenesis-dtu` (research depth and deck pipeline) and `NIC\dreamforge-case` (register).

---

## PART I. CONTEXT AND RULES

## 1. The brief

### 1.1 Case lines (IDs are used as tags in the research document)

Source: `RR\raw-data\Round 1 Problem Statement _ SupeRR Selector Season 2.docx.pdf` (2 pages) and the Unstop page text the user pasted.

| ID | Case line |
|---|---|
| C-1 | Build a data-driven system that measures how batters and bowlers perform in high-pressure match situations compared with their usual performance levels. |
| C-2 | Use the system to identify and rank the players who deliver most consistently when it matters. |
| C-3 | Pressure is ours to define. It might depend on the required run rate, wickets in hand, balls remaining, the stage of an innings, how close the contest is, or a combination. Other match-context signals are allowed. |
| C-4 | Explain why the definition is meaningful and show how it distinguishes pressure situations from ordinary ones. The method must work for both batting and bowling. |
| C-5 | Data: historical IPL and T20I data from 2022 onwards. Ball-by-ball CSV plus competitions, teams, players, matches, playing XIs and competition-team-player mappings. |
| C-6 | Submission 1: two ordered top-10 lists (batters, bowlers), rank 1 to 10, chosen from dropdowns on Unstop. No player repeated within a list. Dropdowns must match the report. |
| C-7 | Submission 2: a methodology report covering pressure definition; performance measurement (metrics, baselines, rating logic); fair comparisons (sample sizes, eligibility, match contexts, use of IPL and T20I data); evidence for the top 10 (results, comparisons, tables or charts); reliability and limitations (consistency across matches, where the model is less certain). |
| C-8 | The methodology must be transparent enough for someone else to understand and reproduce. Rankings must be supported by analysis of the supplied data, not reputation alone. |
| C-9 | Optional: photographs, screenshots or a 30 to 60 second video of the process. Does not affect evaluation. |
| C-10 | Unstop framing: this is exclusive Rajasthan Royals proprietary data; identify the most reliable players under pressure whom Rajasthan Royals should back at the IPL 2027 auction; the data may be combined with relevant publicly available information. |

### 1.2 Decisions the user locked (14 Nov 2026)

| # | Decision | Consequence |
|---|---|---|
| D1 | Public GitHub repo, no raw data | `.gitignore` and `.vercelignore` exclude `raw-data/` and `model/out/`; only player-level and over-level aggregates ship |
| D2 | Top-10 pool is active and IPL-eligible players, retained players included | Eligibility rule in section 3.8; a separate Royals target board overlays availability |
| D3 | Unstop upload is one bookmarked PDF: methodology report in front, long research behind | Research document has Part A (the five rubric headings, with charts) and Part B (depth) |
| D4 | Solo entry: Harsh Kawatra under Team IdeaForge | One-row team table on cover, thank-you and research cover |
| D5 | Deck is 1 cover, 4 core, 1 appendix, 1 thank-you | Seven slides, section 19 |
| D6 | Palette is Rajasthan Royals pink and blue | Token block in section 18.2, CSS tokens in section 15.1 |
| D7 | Cover carries a real mind map with brand image placeholders; image placeholders across the deck where real organisations or people appear | `node3`, `logoSlot`, `imgSlot` helpers; logo pipeline in section 20 |
| D8 | Everything is built inside `RR\`, with the case-folder layout of the case-study workspace | Section 1.4. The planner's assumption; tell the user in the first status message so it can be redirected |

### 1.3 Facts about the data, verified at planning time

| Fact | Value |
|---|---|
| `ball_by_ball.csv` | 200,999 rows, 33 columns, 867 matches, sorted by `match_id`, no duplicate `(match_id, innings, innings_ball_num)` |
| `matches.csv` | 883 matches, 22 Jan 2022 to 1 Nov 2026; 16 have no ball-by-ball rows |
| Competitions | IPL 2022 to 2026 (74, 74, 71, 74, 74 matches with balls); T20I series 2022 to 2026 (about 470 matches); two emerging-team events (30 matches, `match_format` T20 but not IPL) which the model drops |
| No `players.csv` | Player names come from `ball_by_ball.csv` and `competition_team_player_mapping.csv`. Three names map to two ids each (Abdul Samad, Basil Hameed, Haider Ali): always key on id |
| Run semantics | `runs` is batter runs. Total for a ball is `runs + extras1_runs + extras_2_runs`. Innings totals rebuilt this way match the stated run margin in 98.8% of unrevised run-margin results and the wicket margin in 408 of 409 |
| Illegal deliveries | `extras_type` in `wide`, `Overstep`, `other` (`other` behaves as a no-ball: one extra, batter runs allowed). Legal balls per over come out at 6 in 31,519 of 32,350 overs |
| Revised overs | `first_inn_revised_overs` and `second_inn_revised_overs` are in **balls** (the 2023 final shows 90 for 15 overs). 25 matches |
| Super overs | `innings` 3 and 4, 38 rows, excluded |
| Wickets | `is_wicket` true on 10,881 rows; run outs can dismiss the non-striker (271 of 600) |
| Team ids | Rajasthan Royals is `team_id` 3. IPL 2026 is `comp_id` 3298 |
| Scoring environment | First-innings runs per ball by tier and season range from 1.42 (T20I 2022) to 1.65 (IPL 2026); the model carries this as an environment factor |
| Unused columns | `bowl_speed` is zero on 39% of rows; `stroke`, `delivery_style`, `over_or_around`, `on_or_off` are complete enough for descriptive splits only |

### 1.4 Folder layout (create exactly this)

```
RR\
  .gitignore  .vercelignore  README.md  PLAN.md  DECISIONS.md  build-log.md
  raw-data\                      (existing; git-ignored; never modified)
  case\01-brief.md               (verbatim transcription of the PDF with IDs C-1 to C-10)
  model\pressure_model.py  figures.py  model_outputs.json  model_tables.md
        inputs\availability.csv  inputs\nation_overrides.csv   (written in step R3 from lane C)
        out\                     (git-ignored: balls.pkl)
  research\raw\R-A.md .. R-F.md  sources.md
           parts\part-A.md .. part-G.md
           figures\F01.png .. F24.png
           assemble.py  build_pdf.py
           rr-pressure-research.md  .html  .pdf     (the Unstop upload)
           critique.md
  deck\  (ported tooling, section 18)  slides\s01.js .. s07.js  shots\  logos\  build\
         slide-ids.json  figma.md  TeamIdeaForge_SupeRR_Selector.pdf
  app\  components\  lib\  public\data\*.json  package.json  next.config.ts  (the dashboard, section 14 to 17)
  submission\top10.md            (the two lists exactly as they must be entered on Unstop)
```

## 2. Ground rules

### 2.1 Content integrity

- Every number in prose, on a slide or on a dashboard label traces to one of: the brief (`[C-n]`), the model (`[M]` or a model table `[T n]`), a verified source row (`[S nn]`), or a stated assumption (`[A nn]`).
- Model results are always introduced as "in our model". Bootstrap results are "in our resampling". Nothing is described as proven.
- The Royals target board is a recommendation built on public availability information that can change. Every row shows its status date. If lane C cannot verify a player's status, the status is `UNVERIFIED` and the row says so.
- No statement that Rajasthan Royals has decided, bid, retained or released anyone unless a `VERIFIED` row supports it.
- Real organisations and players appear under their own names. Logos and photos carry the line "Logos and images identify organisations and players named in public sources; no partnership or endorsement is implied."

### 2.2 Language

Register: a strategy and analytics team's memo to a franchise's cricket operations group. First person plural, declarative, plain words, short sentences mixed with a few longer ones, a number in most sentences. British spelling.

Banned words and phrases (lint lists in `research/assemble.py` and `deck/copy_check.py` enforce them): here's, let's, bottom line, delve, game-changer, game changer, unlock, it's not just, make no mistake, landscape, robust, seamless, holistic, tapestry, paradigm, navigate, revolutioni, cutting-edge, leverage, empower, transformative, journey, synergy, world-class, best-in-class, next-gen, reimagine, supercharge, harness, crucial, pivotal, furthermore, moreover, in today's, ever-evolving, imagine, testament, elevate, what if, picture this, dive into, deep dive, groundbreaking, state-of-the-art, plethora, myriad, underscore, showcase, foster, bolster, spearhead, nuanced, intricate, meticulous, realm, fast-paced, in conclusion, it is important to note, vibrant, valuable insights, clutch gene.

Replacements to use: "stability checks" (never "robustness checks"), "swing" (never "leverage"), "pressure value" (never "clutch score"), "holds up" or "stable" (never "robust").

### 2.3 Humanizer

Every writer and every slide-copy change runs the humanizer skill (`C:\Users\harsh\.claude\skills\humanizer\SKILL.md`; invoke with the Skill tool, `skill: "humanizer"`) in file mode on its own prose before finishing. Prose only: tables, numbers, tags, headings and quoted case text stay unchanged. Strongest tells first: not-X-but-Y contrasts, one-line closers, staged run-ups, forced triads, dashes, stock AI words, inflated significance, "-ing" riders, bold labels (the `**Answer.**` lead is the only bold label kept), writing about the document itself. Then reread for the five tells that survive rewrites: contrasts, closers, triads, dashes, bold labels. The humanizer never adds a fact, a number or a source. A large diff after the pass means the writer brief was not followed; note it in the build log.

| Touchpoint | When | What | Pass test |
|---|---|---|---|
| HU1 | Each writer, before replying | File-mode pass on its own part | Self-check one-liner (section 12.3) prints 0 tell hits |
| HU2 | Step R6, after `ASSEMBLY PASS` | Main samples 12 paragraphs across parts and counts tells | Under 1 tell a paragraph on average; worst three fixed |
| HU3 | Step K2 | Every string in `deck/make_values.py` headlines, panel titles and callouts | No contrast, closer, triad or dash |
| HU4 | Step K8 | Critic counts tells in `deck/slide-copy.md` | Zero |
| HU5 | Step W7 | Every user-facing string in the dashboard (`lib/copy.ts`) | Zero dashes, zero banned words (`npm run lint:copy`) |

### 2.4 The case-competition-deck skill

The skill lives at `NIC\.claude\skills\case-competition-deck\` (also packed as `NIC\case-competition-deck.skill`). The Skill tool cannot load it from `RR\` in the first session, so step B1 copies the folder to `RR\.claude\skills\case-competition-deck\` and every agent **reads the files directly** with the Read tool: `SKILL.md`, then `references\structure.md`, `rhetoric.md`, `archetypes.md`, `frameworks.md`, `critique_rubric.md`, and `references\case_types\strategy.md` and `operations.md` (the closest case types; this is a sports analytics and resource allocation case, so treat case-type frameworks as extrapolation, per the skill's own calibration note).

| Touchpoint | When | What to do | Pass test |
|---|---|---|---|
| A | Step B2 | Read the skill files above. Confirm section 4 of this plan carries: contrarian answer, seed, symmetric treatment, three scenarios, one moneyshot, double synthesis, action titles, pre-empted weaknesses | Logged in `build-log.md` with the calibration note |
| B | Every writer prompt | Writers read `rhetoric.md` and the frameworks named for their sections in section 11.2 | Each H2 is the locked finding; each framework appears |
| C | Step R7 | Critique mode on the research (prompt 23.4), re-based from a 100-slide M&A deck to a methodology report | `research/critique.md`; every score under 4 fixed or reason logged |
| D | Step K2 | Slide mode check of the four core slides against `archetypes.md`: two-chart action-title slide, symmetric comparison grid, the moneyshot, three-scenario projection, sensitivity matrix | Mapping table appended to `deck/figma.md` |
| E | Step K2 | Before building: four core headlines are full-sentence findings with a number; S3 carries "CONCLUSIVELY", S5 carries "THEREFORE"; exactly one `CARD: MONEYSHOT` (S3) | Logged |
| F | Step K8 | Critique mode on the built deck (prompt 23.5) | `deck/critique.md`; allowed fixes applied |
| G | Steps R8 and K9 | Polish search: TODO, Insert, Placeholder, TBD, Lorem, xyz, undefined, NaN, and names of other cases (SwiftKart, Dream Forge, BeyondTech, Eurogrip, Satoshi, HarvestBox, Tikau, PRAMAAN, SwasthyaGrid, VoltEdge, Ather) | Nothing found |

### 2.5 Tags used in the research document

`[C-3]` case line; `[M]` model output; `[T5]` model table; `[S12]` external source; `[A04]` assumption; `[F09]` figure. Every paragraph that states a number carries at least one tag.

---

## PART II. THE SOLVED CASE

## 3. The method (locked)

Read this section as the specification. The code in section 6 implements exactly this and was run at planning time.

### 3.1 Data preparation

1. Keep innings 1 and 2. Drop super overs. Drop the two emerging-team competitions (`match_format` T20 and name not starting `IPL`).
2. A ball is illegal when `extras_type` is `wide`, `Overstep` or `other`. Ball total is `runs + extras1_runs + extras_2_runs`.
3. Before every ball, rebuild: runs so far, wickets down, legal balls bowled, balls left (`maxballs − legal balls bowled`, where `maxballs` is 120 or the revised figure, which is already in balls), wickets in hand, and for innings 2 the target (`revised_target` when present, else first-innings total plus 1) and runs needed.
4. Scoring environment: first-innings runs per legal ball for each tier and season, divided by the all-data figure, gives `envf`. It lets a 190 par in IPL 2026 and a 170 par in a 2022 T20I be treated correctly.
5. Tier weight per ball: IPL 1.00; T20I between two of the twelve full-member sides 0.85; any T20I involving an associate side 0.60.

### 3.2 Resources and win probability

- **Resources** `R(balls left, wickets in hand, envf)`: expected further runs in a first innings, from a gradient-boosted regressor constrained to rise with each input (lightgbm, 300 trees, 15 leaves, minimum 200 balls a leaf), clipped at zero.
- **Chase win probability**: logistic regression on four features: `log(runs needed ÷ (R + 1))`; that term times `log(1 + balls left) ÷ log(121)`; required rate per ball minus the environment rate; the first term again when 12 or fewer balls remain.
- **First-innings win probability**: logistic regression on three features: `z = (runs so far + R − par) ÷ par` where `par = 120 × environment runs per ball`; `z × innings progress`; `wickets down ÷ 10 × share of balls left`.
- Terminal rules in a chase: target reached is 1; out of balls or wickets is 0, or 0.5 when scores are level.
- Trained on decided matches only (no ties, super overs, no-results or abandonments). Validated by 5-fold cross-validation grouped by match, against a monotone gradient-boosted classifier and against the base rate.

Planning-time validation (out of fold): chase log loss 0.398, Brier 0.128, AUC 0.900 (boosted benchmark 0.418, 0.134, 0.893; base rate 0.693). First innings log loss 0.633, Brier 0.221, AUC 0.693 (benchmark 0.642, 0.226, 0.674). Largest calibration gap in any decile bin holding 1,500 or more balls: 0.048. The plain logistic model beats the boosted one in both innings, which is why it is the one used: fewer parameters, published coefficients, and it can be reproduced by hand.

### 3.3 Swing

For every ball, **swing** is the expected absolute movement in win probability from that one delivery: the sum over seven outcomes (wide, wicket, dot, 1, 2, 4, 6) of the league frequency of that outcome in that innings and phase, times the absolute change in win probability if it happens. Swing is the model's answer to "how much can this ball change who wins". It folds required rate, wickets in hand, balls remaining and closeness into one number because all four enter through win probability.

### 3.4 The Pressure Index

Balls where win probability is below 3% or above 97% are **dead** and are removed from everything that follows (10.2% of balls). For every live ball:

`raw = (0.50 × S + 0.20 × B + 0.15 × T + 0.15 × W) × (1 + 0.15 × knockout)`

| Component | Definition | Brief signal it carries [C-3] |
|---|---|---|
| S, swing | Percentile of swing among all balls | Required rate, balls remaining, wickets in hand, closeness, as one learned quantity |
| B, balance | `1 − |2 × win probability − 1|` | How close the contest is |
| T, clock | `(legal balls bowled ÷ innings balls)²` | Stage of the innings; lifts the death overs in both innings |
| W, wicket stress | Wickets down minus the league average at that over and innings, divided by 3, clipped to 0 to 1 | Wickets in hand relative to where a side normally is: a collapse |
| Knockout | 1 for a final, qualifier, eliminator or semi-final | Match stakes |

The **Pressure Index (PI)** is the percentile of `raw` among live balls, 0 to 100. Bands: Routine below 50, Elevated 50 to 75, High 75 to 90, Extreme 90 and above. A **pressure ball** has PI of 75 or more: one live ball in four.

Why a composite and not swing alone: swing alone puts 46% of chase balls and only 6% of first-innings balls in the top quarter, because first-innings win probability moves slowly. Batting first in the last five overs and rebuilding after early wickets are pressure in any dressing room. The clock and wicket-stress terms bring those in. The sensitivity table shows the ranking barely moves when swing is used alone (rank correlation 0.98 for batters and 0.99 for bowlers), so the composite changes the definition's coverage without changing who is good.

Planning-time evidence that the index separates situations: mean swing per ball rises across the four bands, 0.94, 1.43, 1.88 and 3.76 percentage points of win probability; the wicket rate rises from 5.1% of balls in Routine to 6.6% in Extreme; pressure balls are 77% of chase death overs, 43% of chase middle overs, 34% of chase powerplays, 25% of first-innings death overs, 14% of first-innings powerplays, 2% of first-innings middle overs, and 53% of knockout balls against 24% of league balls.

### 3.5 Valuing a ball

- **Batter credit**: change in batting-side win probability from his own runs and his own dismissal, using a counterfactual next state. Wides give the batter nothing. Byes and leg byes count as a dot for him. On a no-ball his runs count and no ball is used up. A run out of the non-striker is not charged to the striker.
- **Bowler credit**: the negative of the change from runs charged to him (batter runs plus wides and no-ball extras, never byes or leg byes) and wickets credited to him (never run outs, retirements or obstruction).
- Divide each credit by the ball's swing (floored at the 5th percentile of swing). This puts a boundary in a tight finish and a boundary in the eighth over on one scale: how well the ball went relative to how much was at stake.
- Subtract the league mean of that quantity for the same innings, phase, pressure band and bowling kind (pace or spin). The result is **value**: zero is the league-average result in that kind of situation. This is what "compared with their usual level, in comparable situations" means in practice [C-1].

### 3.6 Opposition adjustment

One ridge regression per role (penalty 400, tier weights as sample weights) of value on a batter effect and a bowler effect. A batter's value on a ball has the bowler's effect removed; a bowler's has the batter's effect removed. Facing or bowling to weaker players earns less.

### 3.7 The rating

For each player and role:

- `xP` = tier-weighted mean adjusted value on pressure balls; `xO` = the same on ordinary balls (PI under 75). Effective sample sizes use the weights.
- **Two-level empirical Bayes**. Players' true pressure and ordinary levels are treated as drawn from a bivariate normal whose means, spreads and correlation are estimated from the qualified pool by the method of moments (observed spread minus average sampling noise). Each player's **expected pressure value (EPP)** is the posterior mean of his pressure level given both his pressure record and his ordinary record.
- **Floor** = EPP minus 0.84 posterior standard deviations: the level we are 80% sure he exceeds. **Players are ranked on the floor.** A player with a short or volatile pressure record has a wide interval and a lower floor. This is what "most reliable" means in the model [C-2].
- **Lift** = raw `xP − xO` with its standard error. Class: `Rises` when z is above 1.28, `Dips` when below −1.28, otherwise `Steady`.
- **Consistency evidence**: 400 bootstrap resamples of whole matches give each player a probability of finishing in the top 10 and a 10th to 90th percentile rank range.
- **Repeatability**: split matches into odd and even; correlate each half's pressure value, ordinary value and lift across players with 50 or more balls in every cell.

Why this is the right estimator, not a convenience. Planning-time repeatability: batters 0.24 pressure, 0.25 ordinary, 0.00 lift; bowlers −0.07 pressure, 0.15 ordinary, −0.15 lift. The estimated correlation between true pressure level and true ordinary level is 0.84 for batters and 0.95 for bowlers. In words: there is no evidence in five seasons of data that some players reliably raise their game under pressure by more than others, and strong evidence that good players are good in both states. An estimator that ranked on raw pressure numbers alone would mostly rank noise. The two-level model weights each source by how much it actually predicts.

### 3.8 Eligibility

| Gate | Rule | Planning-time count (batters, bowlers) |
|---|---|---|
| Any ball in the role | | 885 strikers, 646 bowlers before dropping emerging events |
| Qualified | 120 or more pressure balls and 120 or more ordinary balls | 119, 116 |
| Active | A ball on or after 2025-06-01 | |
| IPL-eligible | T20I side is not Pakistan (from the mapping file; `model/inputs/nation_overrides.csv` fills players with no T20I rows after lane C) | 100, 98 |

The dashboard also shows players with 40 or more balls in each state, marked "below the sample gate" and unranked.

### 3.9 Stability checks built into the model

| Variant | Batters: rank correlation, top-10 kept | Bowlers: rank correlation, top-10 kept |
|---|---|---|
| Swing only | 0.98, 9 | 0.99, 10 |
| Equal weights on the four components | 0.93, 7 | 0.83, 7 |
| No knockout uplift | 0.99, 8 | 0.98, 8 |
| Pressure threshold at PI 67 | 0.98, 8 | 0.82, 5 |
| Pressure threshold at PI 80 | 0.93, 7 | 0.99, 9 |
| Pressure threshold at PI 90 | 0.98, 5 | 0.98, 8 |
| IPL balls only | 0.95, 9 | 0.93, 5 |
| No opposition adjustment | 1.00, 9 | 0.98, 9 |
| No tier weights | 1.00, 9 | 1.00, 10 |

Reading to carry into every deliverable: the batting list is stable at the top five and soft from six to ten; the bowling list is firm for the first four names and soft below, because bowlers' floors sit close together. Say this plainly; it is the "where the model is less certain" answer [C-7].

### 3.10 Limits to state (never hide)

1. 740 decided matches train the win-probability model; a single ball's value carries that model's error.
2. No fielding, no wicket-keeping, no captaincy, no dew, pitch or boundary size. Venue enters only through the season and tier environment.
3. Non-striker run outs are not charged; partnerships are not modelled.
4. The win-probability model is fitted on the same matches it values. With 9 coefficients against 174,000 balls the optimism is small, and the out-of-fold figures are the ones quoted.
5. Tier weights and component weights are judgements; the stability table shows what moves when they change.
6. Pressure lift is not repeatable in this data. That is a finding about five seasons and about 120 to 700 pressure balls a player, not a claim that nerve does not exist.
7. No World Cup matches are in the file; T20I coverage is bilateral series, tri-series and Asia Cup events.
8. Player nationality for IPL-only players is not in the data.

## 4. The argument

### 4.1 Case type and calibration

Closest skill case types: strategy (a resource allocation choice under uncertainty: where a franchise spends auction money) with an operations-style measurement system at its centre. The skill's patterns come from M&A decks; structure and rhetoric transfer, case-type frameworks are extrapolation. Say so once in the research document's control section.

### 4.2 The contrarian answer

| | The obvious answer the brief invites | Our answer |
|---|---|---|
| Method | Find the pressure situations, compute strike rate and economy there, rank | Value every ball in win-probability terms against the league in the same situation, then rank on a shrunk floor |
| Belief | Some players have a pressure gear; find them and pay for it | Pressure lift does not repeat (0.00 and −0.15 split-half). Quality repeats. The reliable pressure players are the ones whose pressure record is backed by their everyday record |
| Auction use | Pay a premium for famous finishers and death bowlers | Pay for the floor, not the highlight reel. Discount a reputation built on a handful of finishes; do not discount a quiet player with a high floor |

Do-not and do table for the summary (the only place a contrast structure is allowed, and both halves carry numbers).

### 4.3 The moneyshot

One number, on slide 3 as `CARD: MONEYSHOT`: the split-half correlation of pressure lift, shown as two giant numerals (batters and bowlers) beside the correlation of the rating itself. Caption: "How much of a player's extra under pressure carries from one half of his matches to the other." Everything before it sets it up; the top-10 lists follow from it.

### 4.4 Eight-section logic compressed to seven slides

| Skill section | Where it lives | Device |
|---|---|---|
| Executive summary | S1 cover verdict card; S2 headline | Recommendation in the headline |
| Context | S2 left band | The data and what the brief asks; seeds "pressure is rarer and more lopsided than it feels" |
| Actors | S4 | Symmetric treatment: batters and bowlers get identical panels |
| Quantitative analysis | S2 and S3 | Pressure bands, validation, repeatability |
| Feasibility of the obvious answer | S3 | Raw pressure ranking against the rating; "CONCLUSIVELY" card |
| Recommended alternative | S4 and S5 | Top-10 lists; Royals target board; "THEREFORE" card on S5 |
| Conclusion | S7 | One THEREFORE line, no new content |
| Appendix | S6 | Assumptions, stability, limits, sources |

### 4.5 Frameworks by slide and section

MECE issue tree (the brief's question into three branches: define, measure, decide); Pyramid Principle (answer first on every section); weighted scoring with the formula shown (Pressure Index); three scenarios (rank range 10th, median, 90th percentile from the bootstrap stands in for bear, base, bull); sensitivity matrix (section 3.9); 2 by 2 positioning (expected pressure value against lift); risk register with probability and impact (limits); KPI tree (win probability to swing to value to rating); stakeholder map on the cover (who shapes a pressure moment and an auction).

### 4.6 Sixteen insights the deliverables must carry (numbers are filled from the model at run time)

1. One live ball in four is a pressure ball by construction; they are not spread evenly: 77% of chase death overs against 2% of first-innings middle overs.
2. Knockout balls are pressure balls more than twice as often as league balls (53% against 24%).
3. The average pressure-band ball moves win probability four times as much as a routine ball (3.76 against 0.94 points in the Extreme band).
4. Wickets fall faster under extreme pressure (6.6% of balls against 5.1%).
5. A nine-coefficient logistic model predicts chase outcomes out of fold with AUC 0.90 and beats a boosted model.
6. First-innings win probability is far less certain (AUC 0.69), which is why first-innings pressure is defined with the clock and wicket stress, not swing alone.
7. Pressure lift does not repeat for batters (0.00).
8. Pressure lift does not repeat for bowlers (−0.15).
9. Ordinary-state value does repeat (0.25 batters, 0.15 bowlers), and true pressure and ordinary levels correlate at 0.84 and 0.95.
10. So a pressure record is best read together with the ordinary record; the rating does exactly that, with weights estimated from the data.
11. The batting top five each have a top-10 probability of 0.85 or more in resampling.
12. The bowling list is firm for four names and soft after that.
13. Elite bowlers' edge narrows under pressure in raw terms; for the best of them it is still the largest in the pool.
14. The list is stable to the weighting (0.93 to 1.00 rank correlation for batters across nine variants).
15. The Royals' own pressure record by phase (from the team table) shows where the squad needs help; the target board is built against those cells.
16. The model's limits are specific and listed; none of them moves the top four of either list in the stability table.

## 5. Planning-time numbers (hash `3b4c16147f`; the run in step M1 must reproduce or supersede them)

Dry run, 14 Nov 2026, in memory: `CHECKS 10/10 HASH 3b4c16147f`, runtime 29.6 seconds.

| Rank | Batter | IPL team | Pressure balls | xP | xO | EPP | Floor | P(top 10) |
|---|---|---|---|---|---|---|---|---|
| 1 | Vaibhav Sooryavanshi | Rajasthan Royals | 156 | 0.435 | 0.482 | 0.279 | 0.228 | 0.93 |
| 2 | Heinrich Klaasen | Sunrisers Hyderabad | 245 | 0.470 | 0.151 | 0.227 | 0.183 | 0.94 |
| 3 | Tim David | Royal Challengers Bengaluru | 382 | 0.273 | 0.263 | 0.218 | 0.175 | 0.86 |
| 4 | Abhishek Sharma | Sunrisers Hyderabad | 437 | 0.217 | 0.225 | 0.208 | 0.169 | 0.87 |
| 5 | Suryakumar Yadav | Mumbai Indians | 567 | 0.219 | 0.202 | 0.203 | 0.167 | 0.92 |
| 6 | Andre Russell | Kolkata Knight Riders | 218 | 0.292 | 0.147 | 0.162 | 0.114 | 0.46 |
| 7 | Rajat Patidar | Royal Challengers Bengaluru | 197 | 0.166 | 0.198 | 0.151 | 0.103 | 0.36 |
| 8 | Shubman Gill | Gujarat Titans | 552 | 0.160 | 0.116 | 0.139 | 0.103 | 0.32 |
| 9 | Jos Buttler | Gujarat Titans | 430 | 0.143 | 0.131 | 0.139 | 0.102 | 0.35 |
| 10 | Shreyas Iyer | Punjab Kings | 412 | 0.190 | 0.106 | 0.139 | 0.099 | 0.35 |

| Rank | Bowler | IPL team | Pressure balls | xP | xO | EPP | Floor | P(top 10) |
|---|---|---|---|---|---|---|---|---|
| 1 | Josh Hazlewood | Royal Challengers Bengaluru | 404 | 0.287 | 0.195 | 0.132 | 0.108 | 0.81 |
| 2 | Jasprit Bumrah | Mumbai Indians | 436 | 0.131 | 0.227 | 0.125 | 0.101 | 0.84 |
| 3 | Sunil Narine | Kolkata Knight Riders | 341 | 0.156 | 0.209 | 0.119 | 0.095 | 0.81 |
| 4 | Varun Chakravarthy | Kolkata Knight Riders | 435 | 0.095 | 0.194 | 0.111 | 0.089 | 0.69 |
| 5 | Blessing Muzarabani | Kolkata Knight Riders | 178 | 0.088 | 0.274 | 0.116 | 0.088 | 0.66 |
| 6 | Mohsin Khan | Lucknow Super Giants | 228 | 0.298 | 0.197 | 0.112 | 0.083 | 0.56 |
| 7 | Bhuvneshwar Kumar | Royal Challengers Bengaluru | 639 | 0.180 | 0.137 | 0.104 | 0.082 | 0.53 |
| 8 | Rashid Khan | Gujarat Titans | 576 | 0.078 | 0.153 | 0.095 | 0.074 | 0.41 |
| 9 | Nathan Ellis | Chennai Super Kings | 282 | 0.212 | 0.163 | 0.101 | 0.074 | 0.41 |
| 10 | Kuldeep Yadav | Delhi Capitals | 397 | 0.146 | 0.137 | 0.094 | 0.072 | 0.41 |

IPL team is the latest IPL side in the mapping file, not a statement about 2027. Value units are standardised swing units: 0.20 means the player's balls go one fifth of a typical swing better than the league-average result in the same situation. The dashboard and deck also show the plain-language conversion the model writes: win-probability points added per 100 pressure balls.

---

## PART III. THE MODEL

## 6. `model/pressure_model.py` (embedded; create the file with exactly this content)

Extraction rule for every embedded file in this plan: the file's content is the fenced block that follows its `<!-- FILE: path -->` marker, byte for byte. Step B3 runs the extractor in section 22.2.

Run: `python -X utf8 model/pressure_model.py` from `RR\`. Environment switches: `RR_DRY=1` computes and prints without writing a file; `RR_ROOT` overrides the project root (only the planner's dry run needs it).

<!-- FILE: model/pressure_model.py -->
```python
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
           hp_thr=75.0, ext_thr=90.0, swing_floor_q=0.05, ridge_alpha=400.0, min_p=120, min_o=120, show_min=40,
           active_since="2025-06-01", floor_z=0.84, lift_z=1.28, w_ipl=1.0, w_full=0.85, w_assoc=0.60, boot=400,
           full_members=["India", "Pakistan", "West Indies", "New Zealand", "Bangladesh", "Sri Lanka", "England", "Afghanistan", "Australia", "Zimbabwe", "South Africa", "Ireland"],
           excluded_nations=["Pakistan"])
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
    b["maxballs"] = np.where(b.innings == 1, b.first_inn_revised_overs.fillna(120), b.second_inn_revised_overs.fillna(120))
    b["bl"] = (b.maxballs - b.legal_before).astype(float); b["wih"] = (10 - b.wk_before).astype(float)
    b["target"] = np.where(b.innings == 2, b.revised_target.fillna(b.t1 + 1), 0.0); b["rn"] = b.target - b.runs_before
    b["batwin"] = (b.win_team_id == b.batting_team_id).astype(float)
    b["decided"] = b.win_team_id.notna() & ~b.result.str.contains("Tied|Super|No Result|Abandon|one over", case=False)
    it = b.groupby(["match_id", "innings"]).tot.sum().unstack(); mi = m.set_index("match_id"); mg = mi.result.str.extract(r"(\d+)\s*(?i:run)")[0].astype(float)
    rr = pd.DataFrame({"d": it[1] - it[2], "mg": mg, "rev": mi.revised_target}).dropna(subset=["d", "mg"]); rr = rr[rr.rev.isna()]; recon = float((rr.d == rr.mg).mean())
    n_matches_raw = int(b.match_id.nunique()); n_emg = int((b.tier == "EMG").sum())
    b = b[(b.tier != "EMG") & (b.bl > 0) & (b.wih > 0) & ((b.innings == 1) | ((b.rn > 0) & b.t1.notna()))].copy()
    env = b[b.innings == 1].groupby(["tier", "season"]).agg(r=("tot", "sum"), l=("legal", "sum")); env["env_rpb"] = env.r / env.l
    b = b.merge(env[["env_rpb"]].reset_index(), on=["tier", "season"], how="left"); glob = b[b.innings == 1].tot.sum() / b[b.innings == 1].legal.sum(); b["envf"] = b.env_rpb / glob
    b["phase"] = np.select([b.overid <= 6, b.overid <= 15], ["PP", "MID"], "DEATH")
    return b.reset_index(drop=True), m, tn, mp, dict(n_raw=n_raw, recon=recon, glob_rpb=float(glob), env=env.reset_index(), n_matches_raw=n_matches_raw, n_emg=n_emg)

# ---------- 2. resources and win probability ----------
def x2(rn, bl, R, env_rpb):
    lr = np.log(np.maximum(rn, 0.5) / (R + 1.0)); return np.column_stack([lr, lr * np.log1p(np.maximum(bl, 0)) / np.log(121), np.clip(6 * rn / np.maximum(bl, 1), 0, 36) / 6 - env_rpb, (bl <= 12) * lr])
def x1(runs, wk, bl, R, env_rpb):
    par = env_rpb * 120; z = (runs + R - par) / par; return np.column_stack([z, z * (1 - bl / 120), wk / 10 * (bl / 120)])
def fit_wp(b):
    lk = dict(random_state=CFG["seed"], n_jobs=1, deterministic=True, force_row_wise=True, verbose=-1)
    f1 = b[(b.innings == 1) & b.first_inn_revised_overs.isna()]
    res = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.05, num_leaves=15, min_child_samples=200, monotone_constraints=[1, 1, 1], **lk)
    res.fit(f1[["bl", "wih", "envf"]].values, (f1.inn_total - f1.runs_before).values)
    def Rf(bl, wih, envf):
        r = res.predict(np.column_stack([bl, wih, envf])); return np.where((bl <= 0) | (wih <= 0), 0.0, np.maximum(r, 0.0))
    b["R"] = Rf(b.bl.values, b.wih.values, b.envf.values)
    d1 = b[(b.innings == 1) & b.decided]; d2 = b[(b.innings == 2) & b.decided]
    F1 = x1(d1.runs_before.values.astype(float), d1.wk_before.values.astype(float), d1.bl.values, d1.R.values, d1.env_rpb.values)
    F2 = x2(d2.rn.values.astype(float), d2.bl.values, d2.R.values, d2.env_rpb.values); val = {}
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
    def WP(inn, runs, wk, bl, target, envf, env_rpb):
        wih = 10 - wk; R = Rf(bl, wih, envf); p = np.zeros(len(inn)); a = inn == 1; c = ~a
        if a.any(): p[a] = m1.predict_proba(x1(runs[a], wk[a], bl[a], R[a], env_rpb[a]))[:, 1]
        if c.any():
            rn = target[c] - runs[c]; pc = m2.predict_proba(x2(rn, bl[c], R[c], env_rpb[c]))[:, 1]; done = (bl[c] <= 0) | (wih[c] <= 0)
            p[c] = np.where(rn <= 0, 1.0, np.where(done, np.where(rn == 1, 0.5, 0.0), pc))
        return p
    coef = dict(inn1=dict(names=["z", "z_x_progress", "wk_x_remaining"], coef=[float(v) for v in m1.coef_[0]], intercept=float(m1.intercept_[0])),
                inn2=dict(names=["log_need_over_resource", "that_x_log_balls", "rrr_minus_env", "last12_x_that"], coef=[float(v) for v in m2.coef_[0]], intercept=float(m2.intercept_[0])))
    return WP, Rf, val, coef

# ---------- 3. swing (expected win-probability movement of one ball), credits, and the Pressure Index ----------
OC = {"wd": (1, 0, 0), "W": (0, 1, 1), "0": (0, 0, 1), "1": (1, 0, 1), "2": (2, 0, 1), "4": (4, 0, 1), "6": (6, 0, 1)}
def add_swing(b, WP):
    A = lambda c: b[c].values.astype(float); S = dict(inn=A("innings"), runs=A("runs_before"), wk=A("wk_before"), bl=A("bl"), tg=A("target"), ef=A("envf"), er=A("env_rpb"))
    nxt = lambda r, w, l: WP(S["inn"], S["runs"] + r, S["wk"] + w, S["bl"] - l, S["tg"], S["ef"], S["er"])
    b["wp0"] = WP(S["inn"], S["runs"], S["wk"], S["bl"], S["tg"], S["ef"], S["er"])
    b["oc"] = np.select([b.extras_type.eq("wide"), b.is_wicket, b.runs.eq(0), b.runs.eq(1), b.runs.isin([2, 3]), b.runs.isin([4, 5]), b.runs.eq(6)], ["wd", "W", "0", "1", "2", "4", "6"], "0")
    P = b.groupby(["innings", "phase"]).oc.value_counts(normalize=True).unstack(fill_value=0); pk = b[["innings", "phase"]].merge(P.reset_index(), on=["innings", "phase"], how="left"); sw = np.zeros(len(b))
    for k, v in OC.items(): sw += pk[k].values * np.abs(nxt(*v) - b.wp0.values)
    b["swing"] = sw; b["dead"] = (b.wp0 < CFG["dead_lo"]) | (b.wp0 > CFG["dead_hi"])
    wide = b.extras_type.eq("wide").values; nb = b.extras_type.isin(["Overstep", "other"]).values; rb = b.runs.values.astype(float)
    b["st_out"] = (b.is_wicket & (b.dismissed_player_id.fillna(b.striker_id) == b.striker_id)).values.astype(float)
    b["bw_out"] = (b.is_wicket & ~b.dismissal_type.isin(["RunOut", "Retire Out", "Obstracting the field", "Obstructing the field"])).values.astype(float)
    b["bowl_runs"] = rb + np.where(wide | nb, b.extras1_runs.values, 0.0)
    b["d_bat"] = np.where(wide, np.nan, nxt(rb, b.st_out.values, np.where(nb, 0.0, 1.0)) - b.wp0.values)
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
def agg(core, role, tierw=True):
    idc, vc, dc = ROLE[role]; d = core[core[vc].notna()]
    x = pd.DataFrame({"pid": d[idc].values, "hp": d.hp.values, "w": d.w.values if tierw else 1.0, "v": d[vc].values, "dd": d[dc].values, "ipl": (d.tier == "IPL").values})
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
    idc, vc, _ = ROLE[role]; d = core[core[vc].notna()]; rng = np.random.default_rng(CFG["seed"]); pid = pd.Categorical(d[idc]); mid = pd.Categorical(d.match_id); w = d.w.values; v = d[vc].values; hp = d.hp.values
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
WP, Rf, val, coef = fit_wp(b); P = add_swing(b, WP)
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
RT = {}; PRI = {}; SH = {}; TOP = {}; FUN = {}
for role in ("bat", "bowl"):
    R, pr, sdP, sdO = rate(core, role); R["name"] = names.reindex(R.index).values; R["nation"] = nation.reindex(R.index).values; R["ipl_team"] = ipl_last.ipl_team.reindex(R.index).values
    R["last"] = last.reindex(R.index).values; R["active"] = R["last"] >= CFG["active_since"]; R["eligible"] = R.qualified & R.active & ~R.nation.isin(CFG["excluded_nations"])
    E = R[R.eligible].sort_values("floor", ascending=False); R["rank"] = np.nan; R.loc[E.index, "rank"] = np.arange(1, len(E) + 1)
    R = R.join(bootstrap(core, role, pr, sdP, sdO, list(E.index)))
    FUN[role] = [int(len(R)), int(((R.nP >= CFG["show_min"]) & (R.nO >= CFG["show_min"])).sum()), int(R.qualified.sum()), int((R.qualified & R.active).sum()), int(R.eligible.sum())]
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
        d = dict(id=int(pid), name=r["name"], role=role, nation=sv(r["nation"]), ipl_team=sv(r["ipl_team"]), last=r["last"], rank=None if r["rank"] != r["rank"] else int(r["rank"]), qualified=bool(r["qualified"]), active=bool(r["active"]), eligible=bool(r["eligible"]),
                 hand=sv(hand.get(pid)), pos=float(bpos.get(pid, np.nan)), bowl_type=sv(btype.get(pid)), bowl_kind=sv(bkind.get(pid)), nP=int(r["nP"]), nO=int(r["nO"]), iplP=int(r["iplP"]), xP=r["xP"], xO=r["xO"], epp=r["epp"], sd=r["sd"], floor=r["floor"],
                 floor_pp100=r["floor"] * SWP * 1e4, epp_pp100=r["epp"] * SWP * 1e4, lift=r["lift"], lift_z=r["lift_z"], lift_class=r["lift_class"], p_top10=r["p_top10"], p_top20=r["p_top20"], rank_lo=r["rank_lo"], rank_hi=r["rank_hi"], wpaP=r["wpaP"], wpaAll=r["wpaAll"])
        for c in ("rateP", "rateO", "runsP", "runsO", "ballsP", "ballsO", "outsP", "outsO", "dotP", "dotO", "bndP", "bndO"): d[c] = r[c]
        d["splits"] = {k: S[k].get(pid, []) for k in SPLITKEYS}; d["matches"] = TM.get(pid, []); out.append(d)
    return out
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
        a = (np.full(n, 2.0), np.zeros(n), np.full(n, 10.0 - wih), BLf, RNf, np.full(n, ef), np.full(n, er)); w0 = WP(*a); sw = np.zeros(n)
        for k, (r_, w_, l_) in OC.items(): sw += np.where(mid, P.loc[(2, "MID"), k], P.loc[(2, "DEATH"), k]) * np.abs(WP(a[0], a[1] + r_, a[2] + w_, a[3] - l_, a[4], a[5], a[6]) - w0)
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
ck("ten unique names in each top 10", all(len(TOP[r]) == 10 and TOP[r].name.nunique() == 10 for r in TOP)); ck("at least 60 eligible players per role", all(FUN[r][4] >= 60 for r in FUN))
ck("no excluded nation in a top 10", all(not TOP[r].nation.isin(CFG["excluded_nations"]).any() for r in TOP))
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
OUT = dict(meta=dict(model="SupeRR Selector Season 2 pressure model", hash=H, checks_passed=sum(CHECKS.values()), checks_total=len(CHECKS), generated=time.strftime("%Y-%m-%d")), checks=CHECKS, config=CFG,
           data=dict(raw_rows=info["n_raw"], matches=int(b.match_id.nunique()), balls_used=int(len(b)), live=int(len(live)), dead_share=float(b.dead.mean()), recon=info["recon"], emerging_rows_dropped=info["n_emg"], env=info["env"].to_dict("records"), glob_rpb=info["glob_rpb"]),
           validation=dict(wp=val, coef=coef, bands=[dict(band=k, name=BN[k], **{c: float(bands.loc[k, c]) for c in ("n", "swing", "wp", "over", "wk_down", "inn2", "wkt", "dot", "bnd", "sr")}) for k in BK], hp_share=hp_share, hp_ko=hp_ko, hp_inn=hp_inn, swing_pressure_mean=SWP,
                           outcome_probs={f"{i}|{p}": {k: float(P.loc[(i, p), k]) for k in OC} for (i, p) in P.index}, split_half=SH, prior=PRI, sensitivity=SENS, funnel=FUN),
           top10={r: [int(i) for i in TOP[r].index] for r in TOP}, top30={r: [{k: d[k] for k in d if k not in ("splits", "matches")} for d in REC[r] if d["rank"] is not None and d["rank"] <= 30] for r in REC},
           rr=dict(team=RRT.to_dict("records"), squad=SQUAD), availability=AVAIL, deck=DECK)
T = "# Model tables (SupeRR Selector Season 2 pressure model, hash %s, checks %d/%d)\n\n" % (H, sum(CHECKS.values()), len(CHECKS))
T += mdt("T1. Configuration", ["Setting", "Value"], [[k, v if not isinstance(v, list) else ", ".join(v)] for k, v in CFG.items()])
T += mdt("T2. Data used", ["Item", "Value"], [["Rows in ball_by_ball.csv", grp(info["n_raw"])], ["Rows dropped: emerging-team events", grp(info["n_emg"])], ["Balls used", grp(len(b))], ["Live balls (win probability 3% to 97%)", grp(len(live))], ["Pressure balls (PI 75 and above)", grp(int(live.hp.sum()))], ["Matches used", grp(int(b.match_id.nunique()))], ["Run-margin reconciliation", f"{100 * info['recon']:.1f}%"]])
T += mdt("T3. Scoring environment: first-innings runs per legal ball", ["Tier", "Season", "Runs per ball", "Par over 120 balls"], [[r.tier, r.season, f"{r.env_rpb:.3f}", f"{120 * r.env_rpb:.0f}"] for r in info["env"].itertuples()])
T += mdt("T4. Win-probability validation, out of fold, grouped by match", ["Innings", "Balls", "Matches", "Log loss", "Brier", "AUC", "Boosted log loss", "Boosted AUC", "Base-rate log loss", "Largest calibration gap"], [[k, grp(v["balls"]), v["matches"], f"{v['ll']:.3f}", f"{v['brier']:.3f}", f"{v['auc']:.3f}", f"{v['ll_gbm']:.3f}", f"{v['auc_gbm']:.3f}", f"{v['ll_base']:.3f}", f"{v['cal_gap']:.3f}"] for k, v in val.items()])
T += mdt("T5. Calibration by predicted decile", ["Innings", "Bin", "Balls", "Predicted", "Actual"], [[k, f"{c[0] * 10} to {c[0] * 10 + 10}%", grp(c[1]), f"{c[2]:.3f}", f"{c[3]:.3f}"] for k, v in val.items() for c in v["cal"]])
T += mdt("T6. Win-probability coefficients", ["Innings", "Term", "Coefficient"], [[k, n_, f"{c_:.4f}"] for k, v in coef.items() for n_, c_ in list(zip(v["names"], v["coef"])) + [("intercept", v["intercept"])]])
T += mdt("T7. Pressure bands", ["Band", "Balls", "Mean swing, points", "Mean win probability", "Mean over", "Wickets down", "Share in chases", "Wicket rate", "Dot rate", "Boundary rate", "Strike rate"], [[BN[k], grp(bands.n[k]), f"{100 * bands.swing[k]:.2f}", f2(bands.wp[k]), f"{bands.over[k]:.1f}", f"{bands.wk_down[k]:.1f}", pc(bands.inn2[k]), f"{100 * bands.wkt[k]:.1f}%", pc(bands["dot"][k]), pc(bands.bnd[k]), f"{bands.sr[k]:.0f}"] for k in BK])
T += mdt("T8. Share of live balls that are pressure balls", ["Where", "Share"], [[f"Innings {k.split('|')[0]}, {k.split('|')[1]}", pc(v)] for k, v in hp_share.items()] + [["Knockout matches", pc(hp_ko.get(1, 0))], ["League and bilateral matches", pc(hp_ko.get(0, 0))]])
T += mdt("T9. Repeatability: odd matches against even matches", ["Role", "Players", "Pressure value", "Ordinary value", "Lift", "Pressure half against ordinary half"], [[r, SH[r]["n"], sg(SH[r]["r_pressure"]), sg(SH[r]["r_ordinary"]), sg(SH[r]["r_lift"]), sg(SH[r]["r_cross"])] for r in SH])
T += mdt("T10. Prior estimated from the qualified pool", ["Role", "Pool", "Mean pressure", "Mean ordinary", "Spread pressure", "Spread ordinary", "Correlation", "Ball noise pressure", "Ball noise ordinary"], [[r, v["pool"], sg(v["muP"], 3), sg(v["muO"], 3), f"{v['tauP']:.3f}", f"{v['tauO']:.3f}", f2(v["rho"]), f2(v["sdP"]), f2(v["sdO"])] for r, v in PRI.items()])
T += mdt("T11. Eligibility funnel", ["Role", "Any ball", "40 or more in each state", "Qualified (120 and 120)", "And active", "And IPL-eligible"], [[r] + [grp(x) for x in FUN[r]] for r in FUN])
HD = ["Rank", "Player", "Latest IPL side", "Pressure balls", "Pressure value", "Ordinary value", "Expected pressure value", "Floor", "Floor, points per 100 pressure balls", "Top-10 probability", "Rank range", "Lift class"]
T += mdt("T12. Top 10 batters under pressure", HD, toprows("bat")) + mdt("T13. Top 10 bowlers under pressure", HD, toprows("bowl"))
for i, r in ((14, "bat"), (15, "bowl")): T += mdt("T%d. Ranks 11 to 30, %s" % (i, "batters" if r == "bat" else "bowlers"), ["Rank", "Player", "Latest IPL side", "Pressure balls", "Floor", "Top-10 probability", "Lift class"], [[d["rank"], d["name"], d["ipl_team"] or "n/a", grp(d["nP"]), sg(d["floor"], 3), pc(d["p_top10"]), d["lift_class"]] for d in REC[r] if d["rank"] and 10 < d["rank"] <= 30])
T += mdt("T16. Stability of the ranking", ["Variant", "Batters: rank correlation", "Batters: top 10 kept", "Bowlers: rank correlation", "Bowlers: top 10 kept"], DECK["sens"])
T += mdt("T17. Rajasthan Royals under pressure, IPL, by season, role and phase", ["Season", "Role", "Phase", "Mean value", "Pressure balls", "Rank of 10"], DECK["rr"])
T += mdt("T18. Rajasthan Royals 2026 squad in the ratings", ["Player", "Batting rank", "Batting floor", "Bowling rank", "Bowling floor"], [[s["name"], (s["bat"] or {}).get("rank") or "n/a", sg(s["bat"]["floor"], 3) if s["bat"] else "n/a", (s["bowl"] or {}).get("rank") or "n/a", sg(s["bowl"]["floor"], 3) if s["bowl"] else "n/a"] for s in SQUAD])
wr(MODEL / "model_outputs.json", OUT); wr(MODEL / "model_tables.md", T)
wr(PUB / "meta.json", dict(meta=OUT["meta"], config=CFG, data=OUT["data"], validation=OUT["validation"], top10=OUT["top10"], deck=DECK, rr=OUT["rr"], availability=AVAIL))
wr(PUB / "batters.json", REC["bat"]); wr(PUB / "bowlers.json", REC["bowl"]); wr(PUB / "teams.json", TEAMS.to_dict("records")); wr(PUB / "grid.json", chase_grid()); wr(PUB / "showcase.json", showcase())
if not DRY: (MODEL / "out").mkdir(parents=True, exist_ok=True); core.to_pickle(MODEL / "out" / "balls.pkl"); print("wrote model/out/balls.pkl", len(core))
print("CHECKS %d/%d HASH %s" % (sum(CHECKS.values()), len(CHECKS), H)); print("TOP10 BAT:", ", ".join(TOP["bat"].name)); print("TOP10 BOWL:", ", ".join(TOP["bowl"].name))
print("FINDINGS lift repeatability bat %s bowl %s | firm names bat %d bowl %d | runtime %.0f s" % (DECK["sh"]["bat"]["r_lift"], DECK["sh"]["bowl"]["r_lift"], DECK["firm"]["bat"], DECK["firm"]["bowl"], time.time() - T0))
print("MODEL PASS" if all(CHECKS.values()) else "MODEL FAIL")
```

## 7. Running the model and what it must print

Verified at planning time on 15 Nov 2026 by extracting the block above from this plan and executing it with `RR_DRY=1` (nothing written): 352 lines, about 37 seconds.

```
python -X utf8 model/pressure_model.py
```

Expected tail of the output (step M1 "Done when"):

```
CHECKS 11/11 HASH 3b4c16147f
TOP10 BAT: Vaibhav Sooryavanshi, Heinrich Klaasen, Tim David, Abhishek Sharma, Suryakumar Yadav, Andre Russell, Rajat Patidar, Shubman Gill, Jos Buttler, Shreyas Iyer
TOP10 BOWL: Josh Hazlewood, Jasprit Bumrah, Sunil Narine, Varun Chakravarthy, Blessing Muzarabani, Mohsin Khan, Bhuvneshwar Kumar, Rashid Khan, Nathan Ellis, Kuldeep Yadav
FINDINGS lift repeatability bat 0.00 bowl −0.15 | firm names bat 5 bowl 5 | runtime 37 s
MODEL PASS
```

Files and planning-time sizes: `model/model_outputs.json` 68 KB; `model/model_tables.md` 15 KB, 18 tables T1 to T18; `public/data/meta.json` 25 KB; `batters.json` 453 KB (234 records); `bowlers.json` 413 KB (224 records); `teams.json` 43 KB; `grid.json` 419 KB; `showcase.json` 24 KB (12 matches, over-level); `model/out/balls.pkl` (git-ignored).

Other planning-time values the documents will quote (the run supersedes them): 2,00,999 raw rows; 1,74,270 live balls; 43,569 pressure balls; 837 matches used; mean swing on a pressure ball 2.63 points; share of qualified players labelled Rises or Dips: 24% of batters and 16% of bowlers against 20% expected from noise alone; eligibility funnel batters 784, 234, 119, 105, 100 and bowlers 576, 224, 116, 106, 98.

If the hash differs but `MODEL PASS` prints: accept the run, log old and new hash and both top-10 lists in `DECISIONS.md`, and use the new numbers everywhere. If `MODEL FAIL` prints: section 24.

### 7.1 The Royals' own numbers (planning time; feeds slide 5 and research sections 25 to 28)

| Season | Role | All | Powerplay | Middle | Death |
|---|---|---|---|---|---|
| 2025 | Batting, mean value and rank of 10 | +0.14, 2nd | +0.38, 1st | +0.07, 7th | −0.05, 5th |
| 2025 | Bowling | +0.09, 3rd | +0.05, 5th | +0.11, 2nd | +0.13, 5th |
| 2026 | Batting | +0.19, 2nd | +0.20, 2nd | +0.01, 7th | +0.36, 2nd |
| 2026 | Bowling | −0.01, 7th | +0.05, 6th | +0.03, 7th | −0.15, 8th |

Reading: under pressure the Royals bat like a top-two side and, in 2026, bowled like a bottom-four side, worst at the death. Middle-overs batting ranked 7th in both seasons. In the 2026 squad list the ratings place Vaibhav Sooryavanshi 1st and Yashasvi Jaiswal 18th among batters; the best-placed Royals bowlers are Ravindra Jadeja 22nd and Jofra Archer 27th. No Royals bowler is in the top 20. A **gap cell** is any role and phase where the Royals rank 6th or lower in the latest season: at planning time bowling in all three phases and batting in the middle overs.

### 7.2 Data integrity and the re-sent CSV

On 15 Nov 2026 the organisers mailed a file described as an updated `ball_by_ball.csv`. The copy saved as `raw-data\6af855c0e8386_ball_by_ball.csv` is byte-identical to the original (`SHA-256 01e2b4379edfbab6a6e456d304cb3c70f554cb312ef93d9588f3f32a82cb396e`, 41,071,837 bytes, 200,999 rows). The model reads `raw-data\ball_by_ball.csv` only.

- [ ] Step B4 recomputes both hashes: `python -X utf8 -c "import hashlib,glob;[print(hashlib.sha256(open(f,'rb').read()).hexdigest()[:16],f) for f in glob.glob('raw-data/*ball_by_ball*.csv')]"`.
- If they still match: log "re-sent file identical" in `DECISIONS.md` and continue. Ask the user once whether the mail's attachment was the file saved, because the mail could not be read from this session.
- If a different file has since been saved: keep the old one as `raw-data\ball_by_ball.v1.csv`, copy the new one to `raw-data\ball_by_ball.csv`, rerun the model, and treat every planning-time number in sections 3, 5 and 7 as superseded. The check "raw rows 200,999" will then fail by design: update that one constant in the model to the new row count, log it, and rerun.

## 8. `model/figures.py` (embedded; not executed at planning time, fix forward if a call fails)

Writes `research/figures/F01.png` to `F18.png` at 200 dpi from the model's JSON files. Charts use the palette only: pink `#E50695`, navy `#021D45`, blue `#1226AA`, grey `#8A93A6`, panel `#F5F6FA`. No chart title inside the image (the document supplies the caption); axis labels in plain words; no dashes in any label.

<!-- FILE: model/figures.py -->
```python
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
F = V["funnel"]; lab = ["Any ball", "40 and 40", "Qualified", "Active", "IPL eligible"]; fig, ax = plt.subplots(figsize=(8, 3.4)); x = np.arange(5); ax.bar(x - .2, F["bat"], .4, color=PK, label="Batters"); ax.bar(x + .2, F["bowl"], .4, color=BL, label="Bowlers"); ax.set_xticks(x); ax.set_xticklabels(lab); ax.legend(frameon=False); save(fig, 17)
# F18 lift z scores against the normal curve
fig, ax = plt.subplots(figsize=(8, 3.6)); z = [d["lift_z"] for d in BAT + BOWL if d["qualified"] and d["lift_z"] is not None]; ax.hist(z, bins=24, density=True, color=BL, alpha=.75); xs = np.linspace(-4, 4, 200); ax.plot(xs, np.exp(-xs ** 2 / 2) / np.sqrt(2 * np.pi), color=PK, lw=2); ax.set_xlabel("Lift z score, qualified players (curve: what noise alone would give)"); save(fig, 18)
print("FIGURES DONE")
```

Done when: `FIGURES DONE` prints and 18 PNG files exist. Read F01, F05, F09 and F15 with the Read tool and confirm axes are labelled, no text overlaps, and the colours are pink, blue and navy.

## 9. Derived inputs the model reads back (written in step R3)

`model/inputs/nation_overrides.csv`, header `player_id,nation`: one row for every qualified player whose `nation` is empty in `batters.json` or `bowlers.json` (players with no T20I rows, for example IPL-only Indians). Source: lane C rows.

`model/inputs/availability.csv`, header `player_id,name,role,status,team_2026,team_2027,last_price_cr,overseas,age,status_date,source_id,note`. One row for each of the top 40 eligible batters and top 40 eligible bowlers by rank. `status` is exactly one of `RETAINED`, `RELEASED`, `AUCTION_POOL`, `TRADED`, `NOT_IN_IPL`, `UNVERIFIED`. After writing both files rerun the model; the hash must not change (neither file moves a rating unless a nation override makes a player Pakistan, which would be logged as a decision).

---

## PART IV. RESEARCH

## 10. External research lanes (web; verifiers V-A to V-F)

Row schema for every lane file `research/raw/R-<lane>.md` (one markdown table):

`| R-ID | Fact (one sentence, with the number) | Source title | Publisher | URL | Date accessed | Verbatim snippet (25 words or fewer) | Status |`

Status is one of `VERIFIED` (page opened, snippet copied), `VERIFIED (search only)`, `CONFLICT` (two sources disagree: write both rows), `NOT YET PUBLISHED`, `UNVERIFIABLE`. R-IDs are the lane letter plus two digits (`A01`). 35 to 70 rows a lane. Source preference: BCCI and IPL official pages, franchise official pages, ICC, ESPNcricinfo, Cricbuzz, Wisden, national boards, then major newspapers. Never Wikipedia as the only source for a price or a retention.

| Lane | Verifier | Questions | Seeds |
|---|---|---|---|
| A. The IPL 2027 auction | V-A | Auction date and venue; mini or mega; purse per franchise; retention and release deadline and rules; squad size and overseas limits; right-to-match status; impact-player rule status for 2027; trade window dates; any rule change announced after IPL 2026 | iplt20.com news, BCCI releases, ESPNcricinfo auction explainers |
| B. Rajasthan Royals | V-B | 2025 and 2026 finishing positions and records; 2026 squad with roles; captain and coaching staff; ownership changes; retentions and releases for 2027 and purse left; trades in and out since IPL 2026; home venues; publicly stated priorities | rajasthanroyals.com, iplt20.com team page, ESPNcricinfo squad pages |
| C. Availability of the rated players | V-C (split in two agents: batters, bowlers) | For each of the top 40 eligible batters and top 40 eligible bowlers in `model_tables.md` T12 to T15 plus ranks 31 to 40 from `public/data/*.json`: nationality, age, 2026 franchise, 2027 status, last auction or retention price, overseas or Indian, capped or uncapped, any injury or availability notice | Franchise retention announcements, iplt20.com player pages, ESPNcricinfo player pages |
| D. Prices | V-D | Top prices by role at the last two auctions; average price of the top ten buys by role; uncapped price records; purse spent on top three buys per franchise; any published valuation study | iplt20.com auction pages, ESPNcricinfo auction trackers |
| E. Method literature | V-E | Duckworth-Lewis-Stern resources; the WASP win and score predictor; win-probability models in cricket; the baseball idea this plan calls swing (Tango's index) and win probability added; evidence on whether pressure performance persists (baseball, basketball, cricket); empirical Bayes shrinkage (Efron and Morris; James and Stein); ESPNcricinfo Smart Stats and CricViz impact measures; adjusted plus-minus and ridge | Original papers, publisher pages, ESPNcricinfo explainers |
| F. Player context | V-F | For the 20 ranked players: role, batting position or bowling type as publicly described, notable public facts from 2025 to 2026 that a reader would expect acknowledged (injury lay-offs, format retirements, captaincy), nothing about form that the model already measures | ESPNcricinfo profiles, board releases |

When a lane finds that a fact is not yet public (for example retentions not announced), it writes `NOT YET PUBLISHED` rows with the page checked. Writers then say so in plain words and the target board shows `UNVERIFIED`.

After the lanes return, Main builds `research/raw/sources.md` (`| S-ID | Publisher (date) Title | URL | Accessed | Lane rows |`, one row per unique URL, S01 upward) and the two input CSVs in section 9.

## 11. The research document

### 11.1 Format

One markdown file assembled from parts, rendered to HTML and PDF. Header block, then `---`, then the body:

```
# Reliable Under Pressure: Rating Batters and Bowlers When the Match Is on the Line
**<one sentence answer built in step R5 from model_outputs.json: names ranks 1 to 3 of each list and the repeatability finding>**
Team IdeaForge: Harsh Kawatra (Delhi Technological University, Team Leader)
Prepared for: Rajasthan Royals and Unstop, SupeRR Selector Season 2, Round 1
---
```

Rules: writers never write an H1; every numbered H2 opens with a bold `**Answer.**` paragraph of two to four sentences; every table is introduced by a sentence and followed by what it shows; figures are inserted as `![F09. caption](figures/F09.png)` on their own line with the caption in the alt text; every section that feeds a slide ends with `Exhibit for the deck: ...`; question marks only in section 33.

### 11.2 Outline (use the H2 titles exactly; numbers in titles are filled from the model in step R5 where shown as `<...>`)

| § | H2 title | Must contain | Tables (min) | Figures | Words (min) | Writer |
|---|---|---|---|---|---|---|
| | **PART A: THE METHODOLOGY REPORT** | | | | | |
| 0 | Document control: every number traces to the data, the model or a cited source | Purpose and readers; tag legend; model hash and rerun command; what this document does not contain; the calibration note on the deck skill; the data-integrity note from 7.2 | 3 | | 700 | W-A |
| 1 | The answer on one page: the two top-10 lists and the three findings behind them | Both top-10 tables (T12, T13); the do-not and do table from 4.2; three findings; how to read value units | 4 | F09, F10 | 1,200 | W-A |
| 2 | Pressure definition: one live ball in four, scored on stakes, balance, clock and wickets | [C-3] [C-4]. The four components and the knockout uplift with the formula in a blockquote; dead balls; bands; why not swing alone; evidence it separates situations (T7, T8); one worked ball from a showcase match at over level | 5 | F03, F04, F05, F06 | 2,200 | W-A |
| 3 | Performance measurement: value in win-probability terms against the league in the same situation | [C-1] [C-7]. Win probability model and validation (T4 to T6); batter and bowler credit rules as a table; division by swing; the cell baseline; opposition adjustment; the two-level rating with the formula; floor; lift classes | 6 | F01, F02 | 2,600 | W-B |
| 4 | Fair comparisons: sample gates, eligibility, tier weights and scoring environment | [C-7]. Funnel (T11); tier weights and why; environment (T3); IPL and T20I mix for each top-10 player; what the gates exclude | 5 | F17 | 1,600 | W-B |
| 5 | Evidence for the top 10 batters | One row of evidence per player: pressure and ordinary value, expected value, floor, points per 100 pressure balls, strike rate and dismissals in each state, top-10 probability, rank range, lift class; a phase heat table (player by phase under pressure) | 5 | F09, F11 | 2,000 | W-C |
| 6 | Evidence for the top 10 bowlers | Symmetric with section 5: economy and wickets in each state | 5 | F10, F12 | 2,000 | W-C |
| 7 | Reliability and limitations: firm at the top, soft from sixth, and why | [C-7]. Bootstrap results (F14); repeatability (T9); stability table (T16); the eight limits in 3.10, each with what it could change | 4 | F07, F08, F13, F14 | 1,800 | W-D |
| 8 | Reproduce it in six commands | Environment, commands, expected output, file map | 2 | | 500 | W-D |
| | **PART B: THE RESEARCH BEHIND THE REPORT** | | | | | |
| 9 | How we read the brief: an issue tree in three branches | MECE tree as a nested table; coverage matrix mapping C-1 to C-10 to sections and slides | 3 | | 1,000 | W-A |
| 10 | The data: six files, what each column means, and what we rebuilt | Column dictionary for all six files; the reconciliation tests; the quirks in 1.3; what was dropped and why | 8 | | 2,200 | W-A |
| 11 | What earlier work says: resources, win probability, swing, shrinkage and whether pressure skill persists | Lane E, every claim tagged; how each idea is used here and where we depart from it | 4 | | 2,400 | W-E |
| 12 | Win probability in depth | Features in words and symbols; coefficients (T6); calibration deciles (T5); why logistic beat boosting; terminal rules; examples at six match states read from `grid.json` | 6 | F01, F02, F05 | 2,200 | W-B |
| 13 | The Pressure Index in depth: components, weights, and the alternatives we rejected | Each component's distribution; the five alternatives tested (T16 variants) and what each changed | 5 | F04, F06 | 2,000 | W-B |
| 14 | Where pressure lives: innings, phases, knockouts, seasons and competitions | T7, T8 expanded by season and tier (from `meta.json`) | 5 | F04 | 1,500 | W-D |
| 15 | How the league behaves under pressure | Strike rate, dot, boundary and wicket rates by band; what changes and what does not | 4 | F03 | 1,300 | W-D |
| 16 | Valuing a ball: six worked examples | Six balls described at state level (innings, over, runs needed, wickets) with before and after win probability from `grid.json`; never a ball-level extract from the raw file beyond those six | 6 | | 1,400 | W-B |
| 17 | Opposition and competition: what the adjustment does to the list | T16 rows for the adjustment and the tier weights; who moves most | 3 | | 1,100 | W-D |
| 18 | The two-level model, derived and worked by hand for one player | Algebra of the posterior in a blockquote; a full numeric pass for rank 1 batter using T10 and his row | 4 | | 1,600 | W-B |
| 19 | Repeatability: the test that shaped the rating | T9; F07, F08, F18; share labelled Rises or Dips against the 20% noise expectation; what this does and does not say | 3 | F07, F08, F18 | 1,500 | W-D |
| 20 | Ten batter dossiers | One sub-section per player, same template: role and public context [F rows], pressure record by phase, innings, pace and spin, season; five biggest pressure matches; what would move him | 20 | | 4,500 | W-C |
| 21 | Ten bowler dossiers | Symmetric with section 20 | 20 | | 4,500 | W-C |
| 22 | Ranks 11 to 30 and the near misses | T14, T15; who is one good season from the list | 4 | | 1,300 | W-C |
| 23 | Rises, Steady, Dips: what the labels can bear | Counts by class; the players labelled; why a label is weak evidence | 3 | F18 | 1,000 | W-D |
| 24 | Rajasthan Royals under pressure, 2022 to 2026 | T17, T18; F15; the gap cells in 7.1 | 5 | F15 | 1,800 | W-F |
| 25 | The IPL 2027 auction: rules, purse and calendar | Lane A | 4 | | 1,300 | W-F |
| 26 | The Royals' squad and its gaps | Lane B joined to T18 | 4 | | 1,400 | W-F |
| 27 | The target board: who to back, in what order | Section 11.3 rules applied; every row with status, date and source | 5 | | 2,000 | W-F |
| 28 | Price discipline: what a floor is worth | Lane D; price bands by role; a rule for walking away; three bidding scenarios (tight, base, aggressive purse share) | 4 | | 1,300 | W-F |
| 29 | Risks: a register with probability, impact, early signal and response | Ten risks, model and auction | 2 | | 900 | W-F |
| 30 | What we would build next | Fielding, venue, partnerships, tracking data, live use on match day | 1 | | 600 | W-G |
| 31 | Assumptions register | A01 upward: every judgement (weights, thresholds, gates) with basis and what changes if it is wrong | 2 | | 1,000 | W-G |
| 32 | The dashboard: what each screen answers | One sub-section per route in section 15 with the public URL | 2 | | 800 | W-G |
| 33 | Thirty questions a judge could ask, answered | `**N. Question?**` then 60 to 110 words | 0 | | 2,600 | W-G |
| 34 | Slide blueprint | The seven slides: headline, panels, the number each carries | 2 | | 600 | W-G |
| App A | Bibliography | Built by `assemble.py` from cited S-IDs | | | | Main |
| App B | Model tables | `model/model_tables.md` inserted, H1 removed | | | | Main |
| App C | Glossary and short forms | 40 terms | 1 | | 700 | W-G |

Totals to hit: 52,000 words or more, 150 tables or more, 18 figures placed at least once each.

Part-file mapping: `part-A.md` holds §0, 1, 2, 9, 10 (W-A); `part-B.md` §3, 4, 12, 13, 16, 18 (W-B); `part-C.md` §5, 6, 20, 21, 22 (W-C); `part-D.md` §7, 8, 14, 15, 17, 19, 23 (W-D); `part-E.md` §11 (W-E); `part-F.md` §24 to 29 (W-F); `part-G.md` §30 to 34 and Appendix C (W-G). `assemble.py` orders sections by number, not by part.

### 11.3 Target board rules (deterministic; used by W-F and by the dashboard)

1. Candidates: eligible players ranked 1 to 40 in either role.
2. Fit: a batter fits when the Royals have a batting gap cell and his pressure value in that phase (from `splits.phase_hp`) is above zero with 30 or more balls; a bowler likewise for bowling gap cells.
3. Tier 1, back first: rank 1 to 20, status `RELEASED` or `AUCTION_POOL`, fits a gap cell. Tier 2, back if price allows: rank 21 to 40 with the same status, or rank 1 to 20 that does not fit a gap cell. Trade watch: rank 1 to 20, status `RETAINED` or `TRADED`. Not shown: `NOT_IN_IPL` unless rank 1 to 10 (shown as "register interest").
4. `UNVERIFIED` rows stay on the board in a separate block headed "Status not yet public", ordered by rank.
5. Order inside a tier: floor, highest first. No price is invented; the price column is the last public price with its year, or blank.

## 12. Research build

### 12.1 `research/assemble.py` (embedded)

<!-- FILE: research/assemble.py -->
```python
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
```

### 12.2 `research/build_pdf.py`

Create it by copying `NIC\polygenesis-dtu\research\build_pdf.py` (85 lines; markdown-it to HTML and CSS, headless Chrome `--print-to-pdf`, PyMuPDF bookmarks) and making exactly these changes:

1. `NAME = "rr-pressure-research"`.
2. `md.options["html"] = False` stays. Images work through standard markdown; add to the CSS: `img { max-width: 100%; display: block; margin: 4mm auto 2mm; } p:has(> img) { page-break-inside: avoid; }`.
3. CSS variables: `--p:#1226AA; --pd:#021D45; --a:#E50695; --tint:#DDE3FA; --ink:#0A0A0A; --grey:#F5F6FA; --line:#D5D9E6;`.
4. Footer string in `@bottom-left`: `"Reliable Under Pressure  |  Team IdeaForge"`, colour `#1226AA`.
5. `TAG` regex: `\[((?:C-\d+|A\d{2}|M|T\d{1,2}|S\d+|F\d{2})(?:, ?(?:C-\d+|A\d{2}|M|T\d{1,2}|S\d+|F\d{2}))*)\]`.
6. Cover: kicker `Rajasthan Royals  |  SupeRR Selector Season 2  |  Round 1 methodology and research`; h1 `Reliable<br>Under Pressure<br><span style="font-size:20pt;font-weight:700;color:#E50695">Rating batters and bowlers when the match is on the line</span>`; meta block `<b>Team IdeaForge</b><br>Harsh Kawatra, Delhi Technological University (DTU), Team Leader<br>harshkawatra11@gmail.com<br><br>{prepared}`.
7. Bookmarks: level 1 for `PART A`, `PART B`, appendices; level 2 for numbered sections; level 3 for `T\d+\.` headings. Replace the bookmark list comprehension's level expression with: `1 if title.startswith(("PART", "Appendix")) else 2`.

Run: `python -X utf8 research/build_pdf.py`. Done when: return code 0, PDF over 1.5 MB, bookmarks 40 or more; then Read pages 1, 3, one table page and one figure page as images and confirm cover colours, table header fill navy, figure not split across pages.

### 12.3 Writer self-check (every writer runs this on its own part before replying; replace PART)

```
python -X utf8 -c "import re,io;t=io.open(r'research/parts/part-PART.md',encoding='utf-8').read();b=re.split(r'^## 33\.',t,flags=re.M)[0];print(len(t.split()),len(re.findall(r'^\|[ :|-]+\|\s*$',t,re.M)),len(re.findall('[—–]',t)),t.count('!')-t.count('!['),b.count('?'),len(re.findall(r'\bnot (?:just|only|merely)\b|\bat its core\b|\bserves as\b|\bpivotal\b|\bcrucial\b|\bseamless|\bleverage|\brobust',t,re.I)))"
```

Six numbers: words, tables, dashes, exclamations, stray question marks, tell hits. The last four must be 0.

## 13. Critique

Step R7 runs the skill's critique mode on the assembled document (prompt 23.4). The rubric assumes a 100-slide M&A deck; re-base it: "structure" means the five rubric headings of the brief are each answered in Part A and findable from the contents page; "moneyshot" means the repeatability result is stated with its number in sections 1, 7 and 19; "defensive depth" means every Part A claim has a Part B section; "third-party validation" means lane E sources are cited for each method choice.

---

## PART V. THE DASHBOARD (the biggest build)

## 14. Stack, scaffold and data contract

### 14.1 Skills to load before writing dashboard code

Main and every builder invoke, in this order, with the Skill tool: `vercel:nextjs`, `vercel:shadcn`, `dataviz` (before the first chart, every agent), `impeccable:impeccable` (design pass in step W6), `vercel:react-best-practices` (after each page), `vercel:deploy` (step G2 only).

### 14.2 Scaffold (step W1)

`create-next-app` refuses a non-empty folder, so scaffold beside and move in:

```
npx create-next-app@latest _web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

Move every file and folder from `_web\` to `RR\` except `_web\.git` and `_web\README.md`; merge `_web\.gitignore` into `RR\.gitignore`; delete `_web\`. Then:

```
npm i recharts @tanstack/react-table clsx
npm i -D vitest
npx shadcn@latest init -d
npx shadcn@latest add button card badge tabs table slider select input tooltip toggle-group separator
```

`next.config.ts`: `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }`. `tsconfig.json` `exclude`: add `model`, `research`, `deck`, `raw-data`, `case`.

`.gitignore` additions: `raw-data/`, `model/out/`, `__pycache__/`, `*.pkl`, `.vercel`, `deck/build/`, `deck/derived/`, `research/*.html`.
`.vercelignore`: `raw-data`, `model`, `research/raw`, `research/parts`, `deck`, `case`, `*.py`, `*.pkl`.

`package.json` scripts: `"dev": "next dev"`, `"build": "next build"`, `"test": "vitest run"`, `"lint:copy": "node scripts/lint-copy.mjs"`, `"check:public": "node scripts/check-public.mjs"`.

### 14.3 Data contract (fixed; builders never change it)

All data is static JSON in `public/data/`, written by the model. Server components read it with `fs` at build time through `lib/data.ts`; client components receive props.

| File | Shape |
|---|---|
| `meta.json` | `{ meta:{hash,checks_passed,checks_total,generated}, config, data, validation:{wp:{inn1,inn2:{ll,brier,auc,ll_gbm,auc_gbm,ll_base,cal:[[bin,n,pred,act]],cal_gap}}, coef, bands:[{band,name,n,swing,wp,over,wk_down,inn2,wkt,dot,bnd,sr}], hp_share:{"1|PP":..}, hp_ko, hp_inn, swing_pressure_mean, outcome_probs, split_half:{bat,bowl:{n,r_pressure,r_ordinary,r_lift,r_cross,points:[[P0,P1,O0,O1]]}}, prior, sensitivity:[{variant,bat_rho,bat_kept,bat_n,bowl_rho,bowl_kept,bowl_n}], funnel}, top10:{bat:[id],bowl:[id]}, deck, rr:{team:[{season,team,role,phase,mean,size,rank}],squad:[{id,name,bat,bowl}]}, availability:[...] }` |
| `batters.json`, `bowlers.json` | Array of player records sorted by floor. Keys: `id, name, role, nation, ipl_team, last, rank, qualified, active, eligible, hand, pos, bowl_type, bowl_kind, nP, nO, iplP, xP, xO, epp, sd, floor, floor_pp100, epp_pp100, lift, lift_z, lift_class, p_top10, p_top20, rank_lo, rank_hi, wpaP, wpaAll, rateP, rateO, runsP, runsO, ballsP, ballsO, outsP, outsO, dotP, dotO, bndP, bndO, splits, matches`. `rate` is strike rate for batters and economy for bowlers. `splits` has five keys (`phase_hp`, `inn_hp`, `pace_or_spin_hp`, `year_hp`, `band`), each a list of `[key, balls, mean value, rate, dismissals or wickets]`; keys with `|P` are pressure balls, `|O` ordinary. `matches` is up to five `[date, competition, opponent, pressure balls, win-probability points added, runs, balls, dismissals or wickets]` |
| `teams.json` | Array `{season, team, role, phase, mean, size, rank}`, IPL pressure balls only; `phase` is `PP`, `MID`, `DEATH` or `ALL` |
| `grid.json` | `{rn:[1,100], bl:[1,60], env_rpb, wp:{"1".."10": [100][60] ints, win probability times 1000}, swing:{...: ints, swing times 10000}, swing_q:[201], raw_q:[201], exp_wk:{"2|15":..}, weights:{swing,balance,clock,wstress,ko}}` indexed `[runs needed − 1][balls left − 1]` for a chase in the latest IPL scoring environment |
| `showcase.json` | 12 IPL chases with the highest mean Pressure Index: `{id,date,comp,home,away,result,overs:[[innings,over,win probability of the batting side at the start of the over,mean PI,runs,wickets,batting side]]}` |

`lib/types.ts` declares these shapes exactly. `lib/data.ts` exports `getMeta()`, `getPlayers(role)`, `getPlayer(role,id)`, `getTeams()`, `getGrid()`, `getShowcase()`, and `slim(record)` which drops `splits` and `matches` for list pages.

### 14.4 `lib/pressure.ts` (client-side Pressure Index for the Situation Room; implement exactly)

```ts
export function pctl(q: number[], v: number): number { // q has 201 ascending quantiles
  let lo = 0, hi = q.length - 1; if (v <= q[0]) return 0; if (v >= q[hi]) return 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (q[m] <= v) lo = m; else hi = m; }
  return (lo + (v - q[lo]) / Math.max(q[hi] - q[lo], 1e-12)) / (q.length - 1);
}
export function situation(g: Grid, need: number, balls: number, wih: number, knockout: boolean) {
  const wp = g.wp[String(wih)][need - 1][balls - 1] / 1000, swing = g.swing[String(wih)][need - 1][balls - 1] / 10000;
  const over = Math.min(20, Math.floor((120 - balls) / 6) + 1), expWk = g.exp_wk[`2|${over}`] ?? 0;
  const S = pctl(g.swing_q, swing), B = 1 - Math.abs(2 * wp - 1), T = ((120 - balls) / 120) ** 2, W = Math.min(1, Math.max(0, (10 - wih - expWk) / 3));
  const w = g.weights, raw = (w.swing * S + w.balance * B + w.clock * T + w.wstress * W) * (1 + (knockout ? w.ko : 0));
  const dead = wp < 0.03 || wp > 0.97, pi = dead ? null : 100 * pctl(g.raw_q, raw);
  const band = pi === null ? "Decided" : pi >= 90 ? "Extreme" : pi >= 75 ? "High" : pi >= 50 ? "Elevated" : "Routine";
  return { wp, swing, S, B, T, W, pi, band, phase: balls <= 30 ? "DEATH" : "MID" };
}
```

Vitest cases (`lib/pressure.test.ts`): `pctl` returns 0 below the first quantile and 1 above the last; for fixed balls and wickets, win probability falls as runs needed rises across the whole grid row; `situation(g, 12, 6, 5, false).band` is `Extreme` or `High`; `situation(g, 90, 12, 3, false).band` is `Decided`.

## 15. Design system and pages

### 15.1 Tokens (`app/globals.css`, Tailwind 4 `@theme`)

`--color-rr-pink:#E50695; --color-rr-navy:#021D45; --color-rr-blue:#1226AA; --color-rr-ink:#0A0F1F; --color-rr-panel:#F5F6FA; --color-rr-line:#D5D9E6; --color-rr-pink-tint:#FCE1F1; --color-rr-blue-tint:#DDE3FA; --color-rr-good:#1E8A4C; --color-rr-bad:#D7263D;`

Fonts through `next/font/google`: Montserrat 600, 700, 800 for headings and numerals (the brief's own typeface), Inter 400, 500, 600 for body. Shell: navy left rail (logo placeholder, eight nav items, model hash and data date at the foot) and a white content area on `rr-panel`; pink is the single accent for active states, the pressure series and rank 1 to 10 marks; blue is the ordinary-state series. Sequential heat scale: white to pink to `#8A0458`. Diverging scale: blue, white, pink. Minus signs render as U+2212 through `lib/format.ts` (`sgn(x, dp)`, `pct(x)`, `grp(n)` Indian grouping). Every chart has a one-line caption stating what it shows and the unit; every page footer states "Derived from Rajasthan Royals data supplied for SupeRR Selector Season 2. No ball-level data is published here."

Shared components (`components/`): `Shell`, `KpiTile`, `LeaderTable` (rank, name, side, floor bar with an interval whisker from `epp − 1.28 sd` to `epp + 1.28 sd`, top-10 probability pill, `LiftChip`), `HeatGrid` (SVG, takes rows, columns, values, scale), `IntervalBar`, `Dumbbell` (pressure against ordinary), `BandBars`, `ScatterXY` (Recharts), `MatchWorm` (Recharts line plus bars), `PlayerSearch`, `SourceNote`, `EmptyState`.

### 15.2 Routes

| Route | Builder | What it answers | Panels (all numbers from the JSON files) |
|---|---|---|---|
| `/` War Room | Main | Who are the 20, and how sure are we | Verdict sentence from `deck`; four `KpiTile`s (balls, pressure balls, chase AUC, lift repeatability for both roles); two `LeaderTable`s side by side; "three findings" strip; firm against soft note (`deck.firm`); links to method and research PDF |
| `/pressure` Pressure Lab | B-1 | What counts as pressure and does it separate situations | Chase heat map from `grid.json` with a win probability or swing toggle and a wickets-in-hand slider (1 to 10), hover read-out; formula card with the four weights as a segmented bar; `BandBars` for swing and wicket rate by band plus the band table; 2 by 3 `HeatGrid` of pressure share by innings and phase; knockout against league tiles; match replay: pick one of 12 showcase chases, `MatchWorm` of win probability by over with mean PI bars |
| `/situation` Situation Room | B-1 | How much pressure is this exact moment, and who has the record for it | Inputs: runs needed, balls left, wickets in hand, knockout toggle; outputs from `lib/pressure.ts`: win probability, swing in points, PI gauge, band, the four component bars; "best records for this phase": top 8 eligible batters and top 8 eligible bowlers by pressure value in the implied phase (`splits.phase_hp` key `DEATH|P` or `MID|P`, 30 balls minimum), each linking to the profile |
| `/players` Explorer | B-2 | Where does any player stand | Role toggle; TanStack table (rank, player, side, nation, pressure balls, pressure value, ordinary value, expected value, floor, points per 100, top-10 probability, lift class); filters: eligible only, side, nation, lift class, minimum pressure balls slider, text search; `ScatterXY` of ordinary against pressure value with the top 10 in pink, click to open a profile; CSV download of the visible rows |
| `/players/[role]/[id]` Profile | B-2 | One player's whole pressure record | `generateStaticParams` over both JSON files. Header (name, side, nation, hand or bowling type, rank, floor, rank range); `Dumbbell` rows for value, rate, dismissal or wicket rate, dot share, boundary share (pressure against ordinary); 3 by 2 `HeatGrid` phase by state; innings split; pace against spin split; season line (`year_hp`); four-band bars; five biggest pressure matches table; neighbours ranked two above and two below; a "below the sample gate" banner when `qualified` is false |
| `/compare` | B-3 | Two to four players side by side | Query string `?ids=bat-123,bowl-456`; `PlayerSearch` to add; table of the headline measures; grouped bars for pressure and ordinary value; phase heat rows; rank-range strips |
| `/auction` Royals board | B-3 | Where the Royals are short and who fills it | `HeatGrid` of Royals rank by season and role-phase from `teams.json` with gap cells outlined; squad table from `meta.rr.squad`; target board built by `lib/board.ts` (rules in 11.3) from `meta.availability`, three tiers plus "Status not yet public"; filters: role, tier, overseas; each row shows status date and source id; `EmptyState` text when `availability` is empty: "Retention and release lists were not public when this was built. Players are ordered by rank; statuses will be added when published." |
| `/method` | Main | Can someone reproduce this | Ten numbered steps; calibration lines; model comparison bars; split-half scatters from `split_half.points`; stability table; eligibility funnel; the eight limits; hash, run command, links to the repo and the research PDF |

`lib/board.ts` implements 11.3 as a pure function `board(meta, batters, bowlers)` returning `{tier1, tier2, tradeWatch, unverified, gapCells}`; vitest covers: empty availability puts every candidate in `unverified`; a `RELEASED` bowler ranked 5 with a positive death value lands in `tier1` when bowling death is a gap cell; a `RETAINED` player ranked 3 lands in `tradeWatch`.

### 15.3 Scripts

`scripts/check-public.mjs`: fails unless `public/data` holds exactly `meta.json, batters.json, bowlers.json, teams.json, grid.json, showcase.json`, the folder totals under 2.5 MB, and no file contains the strings `innings_ball_num`, `striker_id`, `over_ball_num` or `delivery_ist_time`.

`scripts/lint-copy.mjs`: scans `lib/copy.ts` and every string literal and JSX text in `app/**/*.tsx` and `components/**/*.tsx`; fails on U+2014, U+2013, `!` in JSX text, or any banned word in 2.2.

## 16. Dashboard acceptance

- [ ] `npm test` passes (pressure, board, format).
- [ ] `npm run check:public` and `npm run lint:copy` pass.
- [ ] `npm run build` exports without error; `out/` contains `index.html` and one folder per player profile (458 at planning time).
- [ ] `npx serve out` then, with the Chrome tools (`tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `computer` screenshot, `read_console_messages`), open each of the eight routes at 1440 by 900 and at 390 by 844: no console error, no horizontal scroll, top-10 names equal `meta.deck.top_bat` and `top_bowl` in order, Situation Room read-out changes when an input changes.
- [ ] Design pass with `impeccable:impeccable` in critique mode on `/`, `/pressure` and one profile; apply fixes rated high.

## 17. Publishing gates

**G1, GitHub (ask the user in the session before running):**

```
git init -b main
git add -A
git ls-files | findstr /i "raw-data balls.pkl"      (must print nothing)
git commit -m "SupeRR Selector Season 2: pressure model, research, dashboard"
gh repo create rr-player-ml --public --source . --remote origin --push
```

**G2, Vercel (ask the user before running).** At planning time `vercel whoami` printed `gursimrannkaurr`, which is not the account name used on GitHub (`harshkawatra11`). Stop and ask the user which Vercel account and scope to deploy under; run `vercel login` if they say to switch. Then `vercel link --yes`, `vercel --prod`, open the URL, repeat the route checks of section 16 on the live site, and write the URL into `DECISIONS.md`, `README.md`, `lib/copy.ts` (research and deck links), research section 32, and `deck/make_values.py` (`DASH_URL`).

Copy `research/rr-pressure-research.pdf` to `public/research.pdf` before the final build so the dashboard and the deck can link to it.

---

## PART VI. THE FIGMA DECK

## 18. Tooling port and palette

Read `NIC\CLAUDE.md` in full before step K0 (density doctrine, build workflow, failure modes). Where it disagrees with this plan (22 pt floor against 18 pt `SEC` text, the old `deck-system` kit against the generator pipeline), this plan wins: the pipeline below is the newer one used on the last five decks.

### 18.1 Port (step K0; each replacement must match exactly once, assert it)

1. Copy from `NIC\polygenesis-dtu\deck\` to `RR\deck\`: `gen.py`, `_extras.js`, `_x2.js`, `_x3.js`, `_v1.js`, `_sweeps.js`, `metrics.json`, `preview.py`, `copy_check.py`, `logo_rects.js`, `setup.js`, `make_pdf.py`. Copy `NIC\verdict-mnc\deck\preamble.js` to `RR\deck\_lib_preamble.js` and `NIC\verdict-mnc\deck\mock_figma.js` to `RR\deck\_lib_mock.js`.
2. `gen.py`: replace `LIB = ROOT / "verdict-mnc" / "deck" / "preamble.js"; MOCKSRC = ROOT / "verdict-mnc" / "deck" / "mock_figma.js"` with `LIB = DECK / "_lib_preamble.js"; MOCKSRC = DECK / "_lib_mock.js"`; `NS = 10` with `NS = 7`; both `tuple(range(1, 11))` with `tuple(range(1, 8))`. `BT` already resolves to `RR\`, so `model/model_outputs.json` is found.
3. `_extras.js`: replace the whole line beginning `const RIBN=` with `const RIBN=["PRESSURE","THE RATING","THE TOP 10","THE AUCTION"];` and the line beginning `const RIBAP=` with `const RIBAP=["A1 ASSUMPTIONS","A2 STABILITY","A3 LIMITS","A4 SOURCES"];`. Replace the body of the last `function coverTop(s){...}` with:

```js
function coverTop(s){ addChip(s,64,48,800,56,"RAJASTHAN ROYALS  |  SUPERR SELECTOR SEASON 2  |  ROUND 1",C.primaryDeep,C.white,22);
  logoSlot(s,884,36,88,80,"Rajasthan Royals"); logoSlot(s,980,36,150,80,"Unstop"); logoSlot(s,1138,36,110,80,"IPL");
  addChip(s,1556,48,300,56,V.team.name,C.primaryDeep,C.white,22);
  addWireH(s,64,1856,140,C.ink,2.5); [64,512,960,1408,1856].forEach(cx=>addEllipse(s,cx-8,132,16,16,C.white,C.ink,2)); }
```

4. `_sweeps.js` and `copy_check.py`: in `ABSENT` add `"VoltEdge","Ather","Dayita"`; in the banned list add `"clutch gene"`. In `copy_check.py` extend `ALLOW` with every `name` and `ipl_team` in `model_outputs.json` `top30`, plus: Rajasthan Royals, Team IdeaForge, Harsh Kawatra, Delhi Technological University, Pressure Index, Sawai Mansingh Stadium, SupeRR Selector, Indian Premier League, First Innings, Top Ten.
5. `setup.js`: change both `10` slide counts to `7` (`all().length < 7`, `slice(0, 7)` twice, `slice(7)`), and `names` to `["01 Cover","02 Pressure","03 The Rating","04 The Top 10","05 The Auction","06 Appendix","07 Thank You"]`.
6. `make_pdf.py`: `range(1, 8)`; output `TeamIdeaForge_SupeRR_Selector.pdf`.
7. Add to `gen.py mock`, before the node run: for every `tbl(` call that can be parsed, nothing; instead rely on rule K-3 in 21.2 (row length equals column count), which is checked by the assertion in `make_values.py`.

### 18.2 `deck/_palette.js` (embedded)

<!-- FILE: deck/_palette.js -->
```js
const C = {
  primary:{r:0.071,g:0.149,b:0.667}, primaryDeep:{r:0.008,g:0.114,b:0.271},
  accent:{r:0.898,g:0.024,b:0.584}, alert:{r:0.843,g:0.149,b:0.239},
  tint:{r:0.867,g:0.890,b:0.980}, alertTint:{r:0.992,g:0.886,b:0.886},
  blue:{r:0.071,g:0.149,b:0.667}, blueDeep:{r:0.008,g:0.114,b:0.271}, blueTint:{r:0.867,g:0.890,b:0.980},
  good:{r:0.118,g:0.541,b:0.298}, goodTint:{r:0.863,g:0.953,b:0.894}, accentTint:{r:0.988,g:0.882,b:0.945},
  ink:{r:0.039,g:0.039,b:0.039}, surface:{r:0.929,g:0.929,b:0.929},
  surfaceAlt:{r:0.961,g:0.965,b:0.980}, white:{r:1,g:1,b:1}
};
const HG=[null,{r:0.988,g:0.882,b:0.945},{r:0.969,g:0.659,b:0.835},{r:0.937,g:0.373,b:0.710},{r:0.898,g:0.024,b:0.584},{r:0.541,g:0.016,b:0.345}];
const HR=[null,{r:0.933,g:0.945,b:0.988},{r:0.725,g:0.769,b:0.953},{r:0.431,g:0.510,b:0.878},{r:0.071,g:0.149,b:0.667}];
```

Roles in use: navy `primaryDeep` for the active ribbon tag, chips, dark cards and the hub; blue `primary` for panel titles, the section chip and ordinary-state marks; pink `accent` for back-cards, inactive ribbon tags, pressure-state marks, verdict text on navy and rank 1 to 10 highlights; `HG` is the pink heat ramp, `HR` the blue one.

### 18.3 Helper cheat-sheet (all exist after `gen.py pre`; signatures are exact)

`skelBT(s,active,counter,chip,chipW,title,source,o)` wipes the slide and draws ribbon, chip, counter, 40 pt `HEADLINE`, source line. `rail(s,x,y,h,label,color,fg)`. `pnl(s,x,y,w,h,title,o)` returns the panel frame (22 pt title, rule at y 39; content starts at y 46). `tbl(p,x,y,cw,heads,rows,o)` with `o{size,hh,rh,align,fills,strip,rc,bold,hf,name}`. `hgrid(p,x,y,rl,cl,cells,o)` with cells `{t,f,tc}` and `o{lw,cw,rh,hh,corner,name,size}`. `cols(p,x,y,w,h,cats,series,o)` with `o{max,totals,bw,size}`. `lcS(p,x,y,w,h,series,xl,o)` with `o{yMin,yMax,yTicks,padL,padR}`. `kpi(s,x,y,w,h,num,label,o)`. `layered(p,x,y,w,h,front,name,back)`. `segBar(p,x,y,w,h,segs)`. `fun(p,x,y,w,tiers,o)`. `bub(p,cx,cy,d,label,fill,fg)`. `fbox(p,x,y,w,h,head,body,o)`. `badgeList(p,x,y,w,items,o)`. `callout(p,x,y,w,h,lead,text,o)`. `node3(p,x,y,w,h,title,sub,brands,o)` (a brand string starting `IMG:` makes an image slot, otherwise a logo slot). `logoSlot(p,x,y,w,h,brand)`, `imgSlot(p,x,y,w,h,name,cap)`. `T`, `TL`, `sT`, `sTL`, `sRT` for text (`s` variants are 18 pt `SEC`). `hcell(v)` pink heat cell 1 to 5, `dvCell(v)` diverging cell, `heatFill(v)`. `addDiagonalWire`, `addWireH`, `dashedH`, `dashedV`, `arrow`, `addEllipse`, `addRect`, `addFrame`, `addText`, `addChip`, `teamBT(p,x,y,cw)`, `srcLine`, `fine`, `measureW`, `fmtN`, `nm`.

Naming rules the validators depend on: every container is named with a prefix `PANEL:`, `CARD:`, `KPI:` or `TABLE:` (the helpers do this); the moneyshot card is named exactly `CARD: MONEYSHOT`; nothing sits below y 1036 except the source line.

## 19. The seven slides

Content area: x 116 to 1856 when rails are used (rails at x 64, 40 px wide), else x 64 to 1856; y 310 to 1032; gutters 12 px. Each slide file is `deck/slides/sNN.js`; each part is a block `{ const s = await figma.getNodeByIdAsync("SN"); ... }`, parts separated by `// ===== PART =====`, the first part calls `skelBT` (or `wipe` and `coverTop` on S1 and S7), each slide ends with `results.push({slide:s.id,total:s.findAll(()=>true).length,top:s.children.length});`. Every number is a `V.` key from `values.js`. Use `NIC\polygenesis-dtu\deck\slides\s01.js`, `s04.js`, `s09.js` and `s10.js` as code models for the cover, a heat-grid slide, the appendix and the thank-you slide.

### S1 Cover

| Zone | Rect (x, y, w, h) | Content |
|---|---|---|
| Top | via `coverTop(s)` | Chips, three logo slots (Rajasthan Royals, Unstop, IPL), wire |
| Title | 64, 150 | "RELIABLE" 132 pt Poppins ExtraBold ink; "UNDER PRESSURE" 64 pt in `C.accent` at y 318 |
| Subtitle | 64, 412, 920 | 22 pt navy: `V.sub` |
| Verdict | 64, 500, 920, 270 | `layered` navy card named `CARD: verdict`, pink back; `V.verdict` 24 pt `C.accent`; `V.verdict2` 22 pt white |
| Team | 64, 786 and 64, 846 | "TEAM IDEAFORGE" 40 pt `C.primary`; `teamBT(s,64,846,[280,460,180])` (one row) |
| Mind map | 1016, 150, 840, 882 | `panel(... "WHO SHAPES A PRESSURE BALL, AND WHO BIDS ON IT", {fill:C.tint, layered:true})` |

Mind map, panel coordinates: insight line `V.map_line` at (16, 58), 22 pt Inter Bold. Hub centre (420, 462): ellipse 210 by 210, `C.primaryDeep`, drawn after the wires; inside it a `logoSlot` 136 by 40 "Rajasthan Royals", `V.pct_hp` at 26 pt `C.accent`, "of live balls are pressure balls" 18 pt white. Eight `node3` nodes, each 252 by 160, at columns x 16, 294, 572 and rows y 124, 382, 640 (the centre cell of the middle row stays empty for the hub). Eight solid 2.5 px ink wires from the hub centre to each node centre, drawn first.

| Node | Title | Sub line (18 pt) | Slots |
|---|---|---|---|
| 1 | THE BATTER | `V.n_bat` (rank 1 batter and his floor) | `IMG:<rank 1 batter>`, `IMG:<rank 2 batter>` |
| 2 | THE CHASE | `V.n_chase` (share of chase death-over balls that are pressure balls) | `IMG:Sawai Mansingh Stadium` |
| 3 | THE BOWLER | `V.n_bowl` | `IMG:<rank 1 bowler>`, `IMG:<rank 2 bowler>` |
| 4 | THE DATA | `V.n_data` (balls and matches) | `IPL`, `ICC` |
| 5 | THE KNOCKOUT | `V.n_ko` | `IMG:IPL trophy` |
| 6 | THE RIVALS | "Nine other purses bid on the same names" | three franchise logos: the latest IPL sides of ranks 1 to 3 that are not the Royals |
| 7 | THE AUCTION | `V.n_auction` (date or "date not yet announced", lane A) | `BCCI`, `IPL` |
| 8 | THE ROYALS | `V.n_rr` (batting and bowling rank under pressure, latest season) | `Rajasthan Royals` |

Below the grid: three flow chips at y 812, x 16, 294, 572, each 252 by 36: "DEFINE PRESSURE", "VALUE EVERY BALL", "RANK ON THE FLOOR" (the last in `C.accent`), joined by two `arrow`s; `fine(pm,16,856,808,"Logos and images identify organisations and players named in public sources; no partnership or endorsement is implied.")`. Source line `V.src[0]`.

### S2 Pressure (ribbon 0, counter "2 / 7", chip "PRESSURE, DEFINED AND TESTED", headline `V.h2`)

Rails: `rail(s,64,310,240,"THE DEFINITION",C.primaryDeep)`, `rail(s,64,562,232,"THE PROOF",C.accent)`, `rail(s,64,806,226,"WHERE IT LIVES",C.primary)`.

| Band | Panel (x, w) | Form | Content |
|---|---|---|---|
| 1 | 116, 560 "THE PRESSURE INDEX: FOUR SIGNALS, ONE SCORE" | Formula callout plus segmented bar | Tinted box with the formula from 3.4 on two lines; `segBar` of the weights 50, 20, 15, 15 labelled Swing, Balance, Clock, Wicket stress; chip "Knockout matches: +15%" |
| 1 | 688, 600 "EACH SIGNAL IS ONE THE BRIEF NAMES" | Table 4 rows | Signal, What it measures, Weight (`V.signals`) |
| 1 | 1300, 556 "A NINE-COEFFICIENT MODEL CALLS CHASES" | Two KPI numerals plus grouped bars | `V.auc2` "chase AUC, out of fold", `V.auc1` "first innings"; `cols` of log loss for the logistic model, the boosted benchmark and the base rate, both innings (`V.ll_bars`) |
| 2 | 116, 620 "SWING RISES ACROSS THE FOUR BANDS" | Bars with an in-chart callout | `cols` of `V.band_swing_n`; callout on the fourth bar: `V.swing_ratio + " times a routine ball"` |
| 2 | 748, 560 "THE LEAGUE UNDER PRESSURE" | Table 4 rows by 6 | Band, Balls, Swing, Wicket rate, Dot rate, Strike rate (`V.bands_tbl`), Extreme row in `C.accentTint` |
| 2 | 1320, 536 "PREDICTED AGAINST ACTUAL, CHASES" | Line chart | `lcS` two series over ten deciles: predicted (blue), actual (pink) from `V.cal2`; note `V.cal_gap` |
| 3 | 116, 640 "SHARE OF BALLS THAT ARE PRESSURE BALLS" | Heat grid 2 by 3 plus two tiles | `hgrid` rows First innings, Chase; columns Powerplay, Middle, Death; cells `hcell` on five steps; right: `V.share_ko` "knockouts", `V.share_league` "league matches" |
| 3 | 768, 520 "THE LIST BARELY MOVES IF SWING IS USED ALONE" | Table 3 rows | Variant, Batters correlation, Top 10 kept, Bowlers correlation, Top 10 kept: rows Swing only, Equal weights, No knockout uplift (`V.sens3`) |
| 3 | 1300, 556 | Dark callout `CARD: so what` | "SO WHAT: " + `V.so2` |

Nine panels, seven forms. Source `V.src[1]`.

### S3 The rating (ribbon 1, counter "3 / 7", chip "MEASURE, THEN SHRINK", headline `V.h3`)

Rails: "VALUE A BALL" (navy), "THE TEST" (pink), "THE RATING" (blue), same geometry as S2.

| Band | Panel (x, w) | Form | Content |
|---|---|---|---|
| 1 | 116, 700 "FROM ONE BALL TO ONE VALUE: FIVE STEPS" | Flow of five `fbox`es with arrows | Win probability before; after his own runs and wicket; divide by swing; minus the league mean in the same situation; minus the opponent's effect |
| 1 | 828, 520 "WHO GETS THE CREDIT" | Table 5 rows | Event, Batter, Bowler for: wide; bye or leg bye; no-ball; run out; caught, bowled, LBW, stumped |
| 1 | 1360, 496 "FAIR COMPARISONS" | Funnel plus chips | `fun` of the batter funnel (`V.fun_bat`), bowler figures beside each tier (`V.fun_bowl`); chips "IPL 1.00", "T20I full members 0.85", "T20I with an associate 0.60" |
| 2 | 116, 600 | `CARD: MONEYSHOT` (layered, navy, pink back) | Two numerals at 84 pt `C.accent`: `V.lift_bat`, `V.lift_bowl`, labelled "batters" and "bowlers"; caption 22 pt white: "How much of a player's extra under pressure carries from one half of his matches to the other" |
| 2 | 728, 560 "WHAT REPEATS AND WHAT DOES NOT" | Grouped bars plus table | `cols` of six bars: pressure value, ordinary value, lift, for batters (pink) and bowlers (blue); `tbl` 2 rows by 4 below (`V.sh_tbl`) |
| 2 | 1300, 556 "RISES AND DIPS ARE NO MORE COMMON THAN NOISE" | Segmented bars | Two `segBar`s (batters, bowlers) Rises, Steady, Dips from `V.lift_mix`; dashed marker at the 20% noise expectation; numerals `V.lift_share_bat`, `V.lift_share_bowl` |
| 3 | 116, 640 "THE RATING: TWO RECORDS, WEIGHTED BY WHAT EACH PREDICTS" | Formula callout plus table | Formula on two lines: "Expected pressure value = pool mean + k1 x (pressure record − mean) + k2 x (ordinary record − mean)" and "Floor = expected value − 0.84 x uncertainty"; `tbl` 2 rows: Role, Spread under pressure, Spread ordinary, Correlation (`V.prior_tbl`) |
| 3 | 768, 520 "RANKED ON RAW PRESSURE NUMBERS, THE LIST IS MOSTLY NOISE" | Table 5 rows | The five eligible batters with the highest raw pressure value: Player, Pressure balls, Raw rank, Rating rank (`V.rawtop`) |
| 3 | 1300, 556 | Dark callout `CARD: conclusively` | "CONCLUSIVELY: " + `V.con3` |

Source `V.src[2]`.

### S4 The top 10 (ribbon 2, counter "4 / 7", chip "THE TWO LISTS", headline `V.h4`)

Symmetric halves: batters left, bowlers right, identical forms. Rails: `rail(s,64,310,400,"THE LISTS",C.primaryDeep)`, `rail(s,64,722,310,"THE EVIDENCE",C.accent)`.

| Band | Panel (x, y, w, h) | Form | Content |
|---|---|---|---|
| 1 | 116, 310, 864, 400 "TOP 10 BATTERS UNDER PRESSURE" | Table 10 rows, 18 pt, `rh` 32, `hh` 34, with a bar in the last column | Columns and widths `[38,236,170,84,86,86,84,52]`: #, Player, Latest IPL side, Pressure balls, Pressure value, Ordinary value, Floor, then the top-10 probability drawn as a bar scaled to 100% with its number (`V.top_bat`); row strip pink for ranks whose probability is 65% or more, tint otherwise; an `imgSlot` 60 by 34 for the rank 1 player's photo at the right end of the title row |
| 1 | 992, 310, 864, 400 "TOP 10 BOWLERS UNDER PRESSURE" | Same | `V.top_bowl` |
| 2 | 116, 722, 424, 310 "EXPECTED VALUE AND FLOOR, BATTERS" | Range-dot rows | Ten rows: track from `epp − 1.28 sd` to `epp + 1.28 sd` (ink 2 px), navy dot at expected value, pink diamond at the floor, 18 pt surname at left (`V.iv_bat`); legend with `lgS` |
| 2 | 552, 722, 428, 310 "PRESSURE VALUE BY PHASE, BATTERS" | Heat grid 10 by 3 | `hgrid` rows surnames, columns Powerplay, Middle, Death; `dvCell` on the value; cells with fewer than 30 balls show "n/a" on white (`V.ph_bat`) |
| 2 | 992, 722, 424, 310 | Range-dot rows | `V.iv_bowl` |
| 2 | 1428, 722, 428, 310 | Heat grid | `V.ph_bowl` |

Source `V.src[3]`. Six panels, four forms, mirrored.

### S5 The auction (ribbon 3, counter "5 / 7", chip "WHAT THE ROYALS SHOULD DO", headline `V.h5`)

Rails: "THE GAP" (navy), "THE TARGETS" (pink), "THE RULES" (blue), geometry as S2.

| Band | Panel (x, w) | Form | Content |
|---|---|---|---|
| 1 | 116, 640 "ROYALS UNDER PRESSURE: RANK OF 10, BY SEASON AND PHASE" | Heat grid 5 by 6 | Rows seasons; columns Bat PP, Bat Mid, Bat Death, Bowl PP, Bowl Mid, Bowl Death; rank 1 to 3 `C.goodTint`, 4 to 5 white, 6 to 10 pink ramp (`V.rr_grid`); a `logoSlot` 64 by 34 "Rajasthan Royals" in the title row |
| 1 | 768, 520 "THE 2026 SQUAD IN THE RATINGS" | Table 6 rows | Player, Batting rank, Bowling rank: the six squad members with the best rank in either role (`V.squad6`) |
| 1 | 1300, 556 "BATTING HOLDS, BOWLING SLIPS" | Two numerals plus line chart | `V.rr_bat_rank`, `V.rr_bowl_rank` (latest season, ordinal words "2nd", "7th"); `lcS` two series by season: batting rank, bowling rank; note "lower is better" |
| 2 | 116, 1100 "THE TARGET BOARD" | Table 8 rows | Tier, Player, Role, Rank, Floor, Gap it fits, 2027 status, Last public price (`V.board`); when availability is empty the status column reads "not yet public" and the panel title gains "(STATUS NOT YET PUBLIC)" |
| 2 | 1228, 628 "FLOOR AGAINST LIFT, TOP 20 BOWLERS" | Bubble scatter with two axes | `bub` per bowler at x = lift z, y = floor; top 10 in pink, 11 to 20 in blue tint; dashed lines at lift z of −1.28 and +1.28; surnames on the top five (`V.sc_bowl`) |
| 3 | 116, 560 "THREE BIDDING RULES" | Numbered badge list | `V.rules` (three lines, each with a number) |
| 3 | 688, 560 "WHERE THIS COULD BE WRONG" | Table 4 rows with heat cells | Risk, Likelihood, Effect, Response (`V.risks`) |
| 3 | 1260, 596 | Dark callout `CARD: therefore` plus link row | "THEREFORE: " + `V.thanks`; link row "Open the dashboard" with `V.dash_url` (hyperlink set, then verified by a second read) |

Source `V.src[4]`.

### S6 Appendix (`skelBT(s,0,"A1","APPENDIX",250,V.h6,V.src[5],{labels:RIBAP})`)

| Panel (x, y, w, h) | Form | Content |
|---|---|---|
| 64, 310, 900, 722 "A1. ASSUMPTIONS AND SETTINGS" | Table 12 rows | ID, Setting, Value, Basis (`V.assump`: the twelve `CFG` judgements) |
| 976, 310, 880, 330 "A2. STABILITY OF THE RANKING" | Table 9 rows with heat cells on the correlations | `V.sens` |
| 976, 652, 430, 380 "A3. LIMITS" | Numbered list, 18 pt | The eight limits of 3.10, one line each (`V.limits`) |
| 1418, 652, 438, 380 "A4. SOURCES AND SHORT FORMS" | `BIBLIO` text 16 pt | `V.biblio` |

### S7 Thank you

Follow `NIC\polygenesis-dtu\deck\slides\s10.js`: `wipe(s); coverTop(s);` "THANK YOU" 104 pt centred at y 176; `layered(s,260,370,1400,150,C.primaryDeep,"CARD: therefore")` with "THEREFORE: " + `V.thanks` at 26 pt `C.accent`; "TEAM IDEAFORGE" label; `teamBT(s,480,604,[280,500,180])`; two link rows at y 740 and y 800 ("Open the dashboard", "Read the methodology and research document") with hyperlinks to `V.dash_url` and `V.research_url`; contact line `harshkawatra11@gmail.com` at y 866, 22 pt; hash line at y 910; wire at y 1012; `srcLine(s,V.src[6])`.

## 20. `deck/make_values.py` contract

`build(O)` receives `model_outputs.json` and returns `V`. It also reads `public/data/batters.json` and `bowlers.json` (path from `__file__` is not available under `exec`; use `pathlib.Path.cwd()` and run `gen.py` from `RR\`). Requirements:

- Assert `O["meta"]["checks_passed"] == O["meta"]["checks_total"]`.
- `V.team = {"name": "TEAM IDEAFORGE", "rows": [["Harsh Kawatra", "Delhi Technological University (DTU)", "Team Leader"]]}`.
- Copy every key of `O["deck"]`; add every key named in section 19.
- Headlines built from data, each asserted 160 characters or fewer and free of dashes, question marks and banned words:
  - `h2 = f"One live ball in four is a pressure ball; it moves win probability {swing_ratio} times as far as a routine ball and covers {share['2|DEATH']} of chase death overs"` (136 characters at planning time)
  - `h3 = f"A player's extra under pressure does not repeat ({lift_bat} batters, {lift_bowl} bowlers) while everyday value does, so we blend both records and rank on an 80% floor"`
  - `h4 = f"{b1}, {b2} and {b3} lead the batters, {w1}, {w2} and {w3} the bowlers; {firm_bat} batters and {firm_bowl} bowlers stay top 10 in at least 65% of resamples"` using surnames (155 characters at planning time; if other names push it past 160, name two players a list instead of three)
  - `h5 = f"Under pressure the Royals bat {rr_bat_rank} of 10 and bowl {rr_bowl_rank}: back high-floor bowlers first, and pay for the floor, never the highlight reel"`
  - `h6 = f"Twelve settings, nine stability variants and eight limits: the top {min_kept} names of each list survive every variant but one"` where the claim is computed from `sens`; if it is false for the data, use `"Twelve settings, nine stability variants and eight limits behind the two lists"`.
- Switch for the central finding: when both absolute lift correlations are under 0.15 use the wording above; otherwise replace "does not repeat" with "repeats only weakly" in `h3`, `verdict`, `con3` and `thanks`, and log the switch.
- `verdict = "Back the floor, not the finish: " + ...` is not allowed (contrast). Use: `verdict = f"{b1} and {w1} top the two lists; pressure lift does not repeat, so the Royals should buy proven floors, bowlers first."` and `verdict2` naming data size and hash.
- `src[0..6]`: source lines 230 characters or fewer, each ending `| Model hash {hash}`; S1 to S4 cite "Rajasthan Royals data pack, SupeRR Selector Season 2 | Team analysis"; S5 adds the lane A to D publishers actually cited.
- `must`: the six top-3 surnames, the hash, `auc2`, both lift correlations.
- Every table row list is asserted to have the same length as its header list (the NaN-width bug the offline mock does not catch).
- `ph_bat` and `ph_bowl` cells come from `splits.phase_hp` keys `PP|P`, `MID|P`, `DEATH|P`; `rawtop` from eligible records sorted by `xP`; `sc_bowl` from eligible bowlers ranked 1 to 20; `board` from `lib/board.ts` rules re-implemented in Python (same rules, 11.3), capped at 8 rows.

## 21. Build, logos, QA

### 21.1 Sequence (Main only; one Figma call at a time)

1. One ToolSearch call: `select:mcp__figma-mcp__whoami,mcp__figma-mcp__create_new_file,mcp__figma-mcp__create_session,mcp__figma-mcp__use_figma,mcp__figma-mcp__get_screenshot,mcp__figma-mcp__upload_assets,ReadMcpResourceTool`. Load the `figma-use` skill (`skill://figma/figma-use/SKILL.md`) and pass `skillNames: "resource:figma-use"` on every `use_figma` call.
2. `whoami`; `create_new_file` with `editorType: "slides"`, plan key `team::1564294484048272772`, name "Reliable Under Pressure | Team IdeaForge | SupeRR Selector S2"; `create_session`; write file key, URL and session id to `deck/figma.md` before anything else.
3. `use_figma(setup.js)`; expect `count: 7`, four `true` in `fontsOk`, `extra: []`; write `deck/slide-ids.json` as `{"S1":"..."}` through `S7`.
4. `python -X utf8 deck/gen.py pre`, then `python -X utf8 deck/gen.py mock`. Done when seven lines read `sNN OK`. Then `python -X utf8 deck/copy_check.py` prints `copy issues 0`, and `python -X utf8 deck/preview.py 1 2 3 4 5 6 7` renders `shots/preview_NN.png`; Read each preview and compare with the inspiration screenshots list in 21.3.
5. `python -X utf8 deck/gen.py bind`. Build S2 first: run each `build/slide_02_K.js` part in order (each must return `warnings: []`), run `build/v1_02.js` (expect `clean: true`), `get_screenshot` at 1600, save to `shots/s2.png`, Read it, check against 21.2. Stop and fix before building S3, S4, S5, S6, S1, S7 in that order.
6. `build/sweeps.js`: expect `radiusFixed` any number, `moneyshot: 1`, `fontLow: []`, `copy: []`, `missing: []`, `presentBad: []`. `build/v1_all.js`: `clean: true`.
7. Logos and images (21.4). Rerun sweeps.
8. Restore slide names if Figma reset them. Final screenshots at 3840 to `shots/hi_s01.png` to `hi_s07.png`; `python -X utf8 deck/make_pdf.py`.

Limits: every composed part under 50,000 characters (the generator asserts it; split at a panel boundary with a new `// ===== PART =====` block when it fails). On an idle-timeout message, run a read-only child-count check before rerunning. On HTTP 429 wait 60 seconds and rerun the slide from part 1.

### 21.2 Per-screenshot checks (the K-card)

K-1 no empty region larger than about 120 by 120 px. K-2 headline is two lines, a full sentence with a number. K-3 every table cell is filled, no "undefined", "NaN" or "null". K-4 rails read bottom to top, centred in their bars (else set `RAILROT=false` in `_x2.js`). K-5 the four status colours are used consistently: pink for pressure and top 10, blue for ordinary, navy for structure, green and red only for good and bad cells. K-6 the active ribbon tag matches the slide. K-7 S3 shows exactly one moneyshot card and "CONCLUSIVELY"; S5 shows "THEREFORE". K-8 S4's two halves are mirror images in geometry. K-9 text near a card does not touch it (the validator misses unnamed text over cards: look). K-10 source line on one line.

### 21.3 Inspiration to open before building (read-only screenshots with `get_screenshot`)

Prime `hOJVMGv9nIhDmayTT7DmOt`: 5:7 and 5:8 (heat maps with the base cell marked), 5:10 (winner column outlined), 5:16 (appendix). `UidfYOpqRKbPxXKJMhftJV`: 2:2 (the blue cover with an eight-node logo mind map, the geometry S1 copies), 2:5 (rails and a blue heat table). `KJQkGsLgbeLU9vNy24p78y`: 2:40 (logo strips in nodes), 13:6 (ranked table with a highlighted row, the model for S4). `YoiazGGOribfg69EjEDIlP`: 2:2 and 2:5 (cricket subject with app logos). `vAIyXmljHlFDuwQo6RsoIN`: 2:6 (heat table plus formula callout, the model for S2 band 3). Density bar from these decks: 220 to 350 words and 5 to 9 panels a core slide at 22 pt, up to 500 words where 18 pt secondary text is used; 300 to 450 nodes a core slide.

### 21.4 Logos and image slots

1. Run `build/slots.js`; save to `deck/slots.json`.
2. Source files into `deck/logos/` with a `manifest.json` of `{brand, file, source_url, licence, w, h}`. Logos (Rajasthan Royals, IPL, BCCI, ICC, Unstop, franchise logos): Wikimedia Commons search `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=10&format=json&srsearch=<brand>%20logo` with a generic descriptive User-Agent, download through `Special:FilePath/<File>?width=600` (URL-encode the title). The Royals crest can also be cropped from page 1 of the brief PDF at 300 dpi with PyMuPDF (clip about `fitz.Rect(470, 60, 560, 130)`), which is the organiser's own artwork. Read every file to confirm it is the right brand.
3. Photos (players, Sawai Mansingh Stadium, trophy): only Wikimedia Commons files under CC BY or CC BY-SA, credit added to that slide's source line through `deck/overrides.json`. If no openly licensed photo exists for a player, leave the dashed placeholder with its caption: the user asked for image placeholders, and an empty labelled slot is correct. Never use a press or agency photo.
4. `upload_assets` per slot (`count: 1`, `nodeId`, scale mode `FIT` for logos; for photos reshape the slot to the photo's aspect first), then POST the bytes with the right `Content-Type` (POST, never PUT). Success is `{"success":true,...}`. Screenshot the cover and S4 afterwards.

---

## PART VII. EXECUTION

## 22. Sequence

### 22.1 Step table

Log every step in `RR\build-log.md` as `## <step> STATUS: PASS|FAIL` with the output line that proves it. Commit where the last column says so (commits start after step W1 creates the repo locally with `git init -b main`; never push before G1).

| Step | Who | Action | Done when | Commit |
|---|---|---|---|---|
| B0 | Main | Copy this plan to `RR\PLAN.md`. Create `DECISIONS.md` (header row `date \| step \| decision \| why`) and `build-log.md`. Record decisions D1 to D8 | Files exist | |
| B1 | Main | Copy `NIC\.claude\skills\case-competition-deck\` to `RR\.claude\skills\case-competition-deck\`. Write `RR\.gitignore` and `.vercelignore` (14.2) | Folder has `SKILL.md` and `references\` | |
| B2 | Main | Skill touchpoint A (2.4). Read `NIC\CLAUDE.md` | Logged | |
| B3 | Main | Extract embedded files with the extractor in 22.2 | Prints `extracted 4 files`: `model/pressure_model.py`, `model/figures.py`, `research/assemble.py`, `deck/_palette.js` | |
| B4 | Main | Data integrity check (7.2). Transcribe the brief PDF to `case/01-brief.md` verbatim with IDs C-1 to C-10 | Hashes logged; brief file exists | |
| M1 | Main | `python -X utf8 model/pressure_model.py` | Tail matches section 7, `MODEL PASS` | |
| M2 | Main | `python -X utf8 model/figures.py`; view F01, F05, F09, F15 | `FIGURES DONE`, 18 files | |
| M3 | Main | Write `submission/top10.md`: both lists, rank 1 to 10, names exactly as in `model_tables.md` T12 and T13, with player ids | File exists; names match `TOP10` lines | |
| W1 | Main | Scaffold the dashboard (14.2); `git init -b main`; first commit | `npm run build` succeeds on the starter | yes |
| R1 | V-A, V-B, V-C1, then V-C2, V-D, V-E, then V-F | Lanes (prompt 23.1), three at a time, background | Six lane files, 35 to 70 rows each, statuses filled | |
| W2 | Main (while R1 runs) | `lib/types.ts`, `lib/data.ts`, `lib/format.ts`, `lib/pressure.ts`, `lib/board.ts`, `lib/copy.ts`, tests, tokens, `Shell`, shared components (15.1) | `npm test` passes | yes |
| W3 | Main | Routes `/` and `/method` | Both render with real data in `npm run dev` | yes |
| W4 | B-1, B-2, B-3 | Remaining routes (prompt 23.3), in parallel, each builder touching only its own `app/<route>` folder and new files under `components/<route>/` | Each replies with files written and `npm run build` result | yes |
| R2 | Main | Build `research/raw/sources.md` from the lanes | One row per unique URL | |
| R3 | Main | Write `model/inputs/nation_overrides.csv` and `availability.csv` (section 9) from lane C; rerun M1 and M2 | `MODEL PASS`, same top-10 lists; any change logged | yes |
| R4 | W-A to W-F | Writers (prompt 23.2), three at a time; W-G last, after reading the other parts | Seven part files; each writer's six self-check numbers reported | |
| R5 | Main | `python -X utf8 research/assemble.py` | `ASSEMBLY PASS` | |
| R6 | Main | HU2 sample; expansion line (23.2) to any writer whose sections are under their minimum | Pass tests in 2.3 | |
| R7 | CR | Research critique (prompt 23.4) | `research/critique.md`; fixes applied; R5 rerun | |
| R8 | Main | `python -X utf8 research/build_pdf.py`; view four pages; touchpoint G polish search | PDF over 1.5 MB, 40 or more bookmarks, nothing found | yes |
| W5 | Main | Integrate builders' routes; fix type errors; `npm test`, `check:public`, `lint:copy`, `build` | All pass | yes |
| W6 | Main | Browser checks and design pass (section 16) | Section 16 boxes ticked | yes |
| W7 | Main | HU5 on `lib/copy.ts`; copy `research/rr-pressure-research.pdf` to `public/research.pdf`; rebuild | Pass | yes |
| G1 | Main, after the user confirms | GitHub publish (section 17) | Repo URL logged; `git ls-files` shows no raw data | |
| G2 | Main, after the user confirms the Vercel account | Vercel deploy (section 17); write the URL everywhere it is needed; rebuild and redeploy once | Live URL passes the route checks | yes |
| K0 | Main | Deck port (18.1); write `deck/make_values.py` (section 20) and the seven slide files (section 19) | `gen.py pre` succeeds | |
| K1 | Main | `gen.py mock`, `copy_check.py`, `preview.py`; view seven previews | Seven `sNN OK`, `copy issues 0` | yes |
| K2 | Main | Touchpoints D and E; HU3 | Logged | |
| K3 to K7 | Main | Figma build, S2 first (21.1 steps 1 to 6) | Sweeps clean, `v1_all` clean | |
| K8 | CR | Deck critique (prompt 23.5); HU4 | `deck/critique.md`; allowed fixes applied through `make_values.py` or the slide files, then rebuilt | |
| K9 | Main | Logos and images (21.4); final screenshots; `make_pdf.py`; touchpoint G | Seven-page PDF; nothing found | yes |
| Z1 | Main | End-to-end verification (section 26) | All seven checks pass | |
| Z2 | Main | `README.md` (what this is, live URL, how to rerun, data notice); final commit and push; final report to the user: the two lists, the four deliverable locations, what is unverified, the Unstop steps | Report sent | yes |

Parallelism: R1 lanes and W2 to W3 overlap; R4 writers and W4 builders must not overlap with each other in more than three agents at once. The deck (K steps) starts only after R8 and G2, because its source lines and links need the final hash and URLs.

### 22.2 Extractor (run in step B3 from `RR\`)

```
python -X utf8 -c "import re,io,pathlib;t=io.open('PLAN.md',encoding='utf-8').read();n=0
for m in re.finditer(r'<!-- FILE: (\S+) -->\n```\w*\n(.*?)\n```\n',t,re.S):
    p=pathlib.Path(m.group(1));p.parent.mkdir(parents=True,exist_ok=True);io.open(p,'w',encoding='utf-8',newline='\n').write(m.group(2)+'\n');n+=1;print('wrote',p)
print('extracted',n,'files')"
```

In PowerShell pass the script through a here-string piped to `python -X utf8 -` if quoting fails.

## 23. Sub-agent prompts

### 23.1 Verifier (replace LANE and the question list from section 10)

> You are verifier V-LANE for a cricket analytics case. Working folder `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\rr-player-ml`. Read `PLAN.md` sections 1, 2.1 and 10 first. Your lane: LANE, with these questions: QUESTIONS. For lane C also read `model/model_tables.md` tables T12 to T15 and take player names and ids from `public/data/batters.json` and `bowlers.json` (ranks 1 to 40, `eligible` true).
>
> Use web search and open the pages; today is DATE. Write one markdown table to `research/raw/R-LANE.md` with the columns `R-ID | Fact | Source title | Publisher | URL | Date accessed | Verbatim snippet (25 words or fewer) | Status`. 35 to 70 rows. One fact a row, with its number or name. Status is VERIFIED only if you opened the page and copied the snippet from it; otherwise use VERIFIED (search only), CONFLICT (write both rows), NOT YET PUBLISHED (name the page you checked) or UNVERIFIABLE. Prefer official IPL, BCCI, franchise and ICC pages, then ESPNcricinfo and Cricbuzz. Never guess a price, a retention or a date. Never include the user's name or email in any request.
>
> Reply with: rows written by status, the five facts most likely to change before the auction, and anything the plan assumes that you found to be false. Edit no other file.

### 23.2 Writer (replace PART and SECTIONS from 11.2)

> You are writer W-PART. Write sections SECTIONS of a consulting-grade methodology and research document into `research/parts/part-PART.md`. Working folder `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\rr-player-ml`.
>
> Skills first. Read `.claude/skills/case-competition-deck/SKILL.md`, `references/rhetoric.md` and the `references/frameworks.md` entries for the frameworks named in PLAN 4.5. Then invoke the `humanizer` skill with the Skill tool and keep its tells list beside you while you write.
>
> Read first, fully: `PLAN.md` sections 1 to 5, 7, 11 and 12.3; `case/01-brief.md`; `model/model_tables.md`; `model/model_outputs.json` (`validation`, `deck`, `top30`, `rr`); the player records you need from `public/data/batters.json` and `bowlers.json`; `research/raw/sources.md` and the lane files your sections use; the figures in `research/figures/` that 11.2 assigns to you (view each one you cite). For register only, the first 200 lines of `C:\Users\harsh\Desktop\HARSH\PPTS-CASE-STUDY\nsut-innovators-court\polygenesis-dtu\research\voltedge-ather-research.md`.
>
> Rules. (1) Use the exact H2 titles of PLAN 11.2 as `## N. Title`, `### N.M` for sub-sections, never an H1. Open every H2 with a bold `**Answer.**` paragraph of two to four sentences. (2) Cover every "Must contain" item and meet the minimum words, tables and figures; more is welcome when every paragraph carries evidence. (3) Every number carries a tag: `[C-n]`, `[M]`, `[T n]`, `[S nn]`, `[A nn]` or `[F nn]`. Use only numbers from the brief, the model files, or a VERIFIED or VERIFIED (search only) lane row. (4) Do not browse. Compute nothing beyond sums, differences, ratios and products of tagged numbers, and show the arithmetic the first time. (5) Write "in our model" for model results and "in our resampling" for bootstrap results. Never present a rating as proof of character or nerve. (6) Keep both top-10 lists, every rank and every number exactly as in the model files. State the firm and soft parts of each list wherever a list appears. (7) Players and organisations appear under their real names; say nothing about a player that is not in the data or a source row. Auction statuses carry their date. (8) Coin no name for the method, the rating or the strategy. Never write the word "leverage"; the statistic is swing.
>
> Style. First person plural, declarative, plain words, mostly short sentences with some longer ones, reasoning shown, a number in most sentences. Zero em dashes and en dashes; ranges use "to"; the minus sign is U+2212. No hooks, rhetorical questions or exclamation marks; question marks only in section 33. Banned words: PLAN 2.2. Introduce every table with a sentence and follow it with what it shows. Insert figures as `![F09. Caption in plain words](figures/F09.png)`. End every slide-feeding section with `Exhibit for the deck: ...`.
>
> Humanizer pass before you finish (HU1): file mode on your part; prose only; numbers, tags, tables, headings and quotes unchanged; add no fact.
>
> Save after your first two sections and extend. Run the self-check in PLAN 12.3 and fix until the last four numbers are 0 and words and tables meet the minimums. Reply with the six numbers, the sections written and any figure or fact you wanted but could not find. Edit no other file.

Expansion line (step R6): "Section N is at X words against a minimum of Y. Add evidence-bearing paragraphs and tables from the model files and lane rows only; do not pad."

### 23.3 Dashboard builder (replace ROUTES)

> You are builder B-n. Build these routes of a Next.js 16 static-export dashboard: ROUTES. Working folder `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\rr-player-ml`. Invoke the skills `vercel:nextjs`, `vercel:shadcn` and `dataviz` first. Read `PLAN.md` sections 14, 15 and 16, then `lib/types.ts`, `lib/data.ts`, `lib/format.ts`, `lib/copy.ts`, `app/layout.tsx`, `app/page.tsx` and everything in `components/`.
>
> Rules. Create files only under `app/<your route>/` and `components/<your route>/`; reuse the shared components; never edit `lib/`, `public/data/` or another route. Data comes only from `lib/data.ts`. Colours only from the tokens in `app/globals.css`: pink marks pressure and the top 10, blue marks the ordinary state, navy is structure. Every chart gets a one-line caption with its unit. All user-facing strings go through `lib/copy.ts` additions that you list in your reply (Main merges them), with no dashes, no exclamation marks and none of the banned words in PLAN 2.2. Pages must work at 390 px wide without horizontal scroll. No new dependency without listing it in your reply.
>
> Done when `npm run build` succeeds with your routes. Reply with the files written, the strings to add to `lib/copy.ts`, and the build result.

### 23.4 Research critic

> You are critic CR. Read `.claude/skills/case-competition-deck/SKILL.md` and `references/critique_rubric.md`, then `PLAN.md` sections 1, 3, 4 and 13, then `research/rr-pressure-research.md` in full. Run the skill's critique mode, re-based as PLAN 13 says. Score each rubric dimension 1 to 5 with one sentence of evidence and a specific fix. Then check, and list every failure with its section number: (a) each of the five things brief line C-7 requires is answered in Part A; (b) both top-10 tables match `model/model_tables.md` T12 and T13 exactly; (c) the repeatability finding carries its numbers in sections 1, 7 and 19; (d) every limit in PLAN 3.10 appears in section 7; (e) no section claims certainty the stability table does not support; (f) count humanizer tells in ten paragraphs you pick at random. Write `research/critique.md`. Edit no other file.

### 23.5 Deck critic

> You are critic CR. Read the skill files as in 23.4, then `PLAN.md` sections 4, 19 and 21.2, then `deck/slide-copy.md` and the seven screenshots `deck/shots/hi_s01.png` to `hi_s07.png`. Critique mode, re-based to a seven-slide deck. Score each dimension, then check: every core headline is a full-sentence finding with a number; exactly one moneyshot (S3); "CONCLUSIVELY" on S3 and "THEREFORE" on S5 and S7; S4's halves are symmetric; every panel is a chart, a diagram or a table with numbers; no empty region; K-1 to K-10 of PLAN 21.2 per slide; zero humanizer tells in the copy. List fixes as (slide, panel, change), restricted to wording, an added number from `values.js`, or a geometry move. Write `deck/critique.md`. Edit no other file.

## 24. Recovery

| Symptom | Action |
|---|---|
| `MODEL FAIL` on "raw rows 200,999" | A different CSV is in place: follow 7.2 |
| `MODEL FAIL` on calibration or win-probability checks | Do not tune. Confirm the six CSVs are the originals (hashes), rerun; if it persists stop and report the printed `WP` line to the user |
| `MODEL FAIL` on "ten unique names" or eligibility | Check `model/inputs/nation_overrides.csv` for a wrong row; remove it and rerun |
| Hash differs, `MODEL PASS` | Accept, log, use the new numbers everywhere (section 7) |
| `ModuleNotFoundError` | `python -m pip install <package>` for the 3.14 interpreter; never switch interpreters |
| `figures.py` raises | Fix the failing call only; the figure list and numbering stay |
| A lane returns under 35 rows or mostly unverified | Rerun the verifier once with the missing questions listed; then proceed with what exists and mark gaps `NOT YET PUBLISHED` |
| Retentions not public | Leave `availability.csv` rows as `UNVERIFIED`; the board, section 27 and slide 5 use the "status not yet public" wording already specified |
| `ASSEMBLY FAIL` | Read the JSON: the failing key names the fix (words, tables, banned, missing sections, missing sources, dashes). Send the owning writer the expansion or correction line |
| PDF blank or fonts wrong | Confirm Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`; rerun with network on (Google Fonts) |
| `create-next-app` refuses or `npm run build` fails on `model/` or `deck/` files | Confirm the `tsconfig.json` excludes and that `eslint` ignores `deck`, `model`, `research` |
| A builder edited a shared file | Revert that file from git; re-apply only its own route |
| `gen.py pre` assertion fails | A port replacement did not match once: open the file, apply 18.1 by hand to the exact line, rerun |
| Mock prints `FAIL` | Read the issue list: `textOut` or `cellWrap` (shorten the string in `make_values.py` or widen the column), `fontFloor` (use the `s` text helpers for 18 pt), `textCollision` (move the later text by the overlap plus 6 px), part length over 49,900 (add a `// ===== PART =====` split) |
| `use_figma` returns warnings | Soft `overflow:` from `fitText` is a warning only: check the screenshot. Anything else: fix the slide file, `gen.py bind N`, rerun the slide from part 1 |
| Session limit or rate limit kills sub-agents | Wait, then re-dispatch the same prompt from scratch; never ask a new agent to "continue" another's half-written file without telling it to read the file first |

## 25. Checklists

**Unstop submission (the user does the upload; Main prepares it):**
- [ ] `submission/top10.md` lists both rankings 1 to 10; the names are spelled exactly as in the data (the dropdown uses the organiser's names).
- [ ] `research/rr-pressure-research.pdf` opens with the cover, contents, Part A before Part B, bookmarks present.
- [ ] The report's section 1 tables equal `submission/top10.md`.
- [ ] Optional journey material: three dashboard screenshots and one deck screenshot in `submission/journey/`.

**Final report to the user must state:** the two lists; where each deliverable is (PDF path, Figma URL, deck PDF path, GitHub URL, Vercel URL); model hash; which auction statuses are unverified and as of what date; that the re-sent CSV matched the original; the two things only the user can do (Unstop dropdowns and upload; confirming the Vercel account).

## 26. End-to-end verification (step Z1)

1. Rerun `python -X utf8 model/pressure_model.py`: `MODEL PASS`, hash equal to the one printed in the research cover section, on S7 and in the dashboard's left rail.
2. Rebuild one number by hand: for the rank 1 batter take `xP`, `xO`, `nP`, `nO` from `batters.json` and the prior from `model_tables.md` T10, compute the expected pressure value with the formula in 3.7 using the effective sample sizes approximated by the ball counts, and confirm it is within 0.02 of `epp`.
3. Pick three numbers on the deck (one each from S2, S3, S4) and find each in `model_outputs.json`, in the research document and on the dashboard: identical in all four places.
4. `git ls-files | findstr /i "raw-data .pkl"` prints nothing; the live site's `/data/batters.json` contains no ball-level keys (`npm run check:public` against the deployed files).
5. Search the research markdown, `deck/slide-copy.md` and `lib/copy.ts` for U+2014, U+2013 and every banned word: zero hits.
6. Open the live dashboard on a phone-sized viewport and a desktop viewport: eight routes load, the Situation Room responds, the two leaderboards match the submission file.
7. Read the seven final slide screenshots once more against 21.2, and the PDF's first page, one table page and one figure page.

## Self-review record (planner, 15 Nov 2026)

- Brief coverage: C-1 and C-2 in sections 3.5 to 3.7; C-3 and C-4 in 3.3 and 3.4; C-5 in 1.3 and 3.1; C-6 in step M3 and section 25; C-7's five headings map one to one to research sections 2, 3, 4, 5 and 6, and 7; C-8 in research section 8 and the public repo; C-9 in section 25; C-10 in sections 7.1, 11.3 and slide 5.
- User requirements: dashboard at the folder root, pushed to GitHub and Vercel behind two confirmation gates; research document with no length ceiling and a 52,000-word floor; Figma-native deck of exactly seven slides in pink and blue with a logo and image mind map on the cover; `case-competition-deck` touchpoints A to G; humanizer touchpoints HU1 to HU5; heat maps, tables, bars and lines on every core slide.
- Verified by execution at planning time: the model file exactly as embedded (11 of 11 checks, hash `3b4c16147f`). Not executed at planning time: `model/figures.py`, `research/assemble.py`, the dashboard code, the slide scripts. Their steps carry acceptance checks and recovery rows for that reason.
- Open items that need the user: which Vercel account to deploy under (G2); whether the organisers' mail attachment is the file that was saved (7.2); confirmation that building research and deck inside `rr-player-ml` (D8) matches the intent.

