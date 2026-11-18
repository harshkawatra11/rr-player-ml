# Writer brief for the research document (read this first, fully)

Project folder: `C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\rr-player-ml`. You write part of a consulting-grade methodology and research document for the Rajasthan Royals SupeRR Selector Season 2, Round 1 (rank the most reliable batters and bowlers under pressure; recommend what the Royals should do at the IPL 2027 auction). The reader is a Royals analyst or judge who distrusts a single number. Write as a cricket analyst who can say which side wins a match and which player wins it for them.

## Read first, in this order
1. `PLAN.md`: section AU (the 17 Nov 2026 audit; it overrides every older section), then sections 2.2 and 2.3, 3, 11.1, 11.2 (your sections, minimum words, tables and figures) and 12.3 (the self-check).
2. `case/01-brief.md` (the brief, lines C-1 to C-10).
3. `model/model_tables.md` (tables T1 to T25), `model/model_outputs.json` (keys `deck`, `validation`, `top30`, `rr`), `public/data/batters.json` and `bowlers.json` (one record per player: pressure and ordinary value, floor, rank, rank range, top-10 probability, lift class, `splits`, `matches`, consistency fields `pm`, `pos_share`, `decisive`, `costly`, `best`, `worst`, `barred`, `rank_pre`), `public/data/showcase.json` (twelve IPL chases, over level), `public/data/teams.json` (IPL sides by phase).
4. Facts from the web: `research/raw/facts.md` (every lane row with its S-ID and status) and `research/raw/sources.md`. Cite a web fact by its S-ID, for example `[S41]`. Use only rows whose status is VERIFIED, or CONFLICT (then state the conflict). Never state an UNVERIFIABLE or NOT YET PUBLISHED row as fact; say the matter is not yet public and give the date.
5. Figures in `research/figures/` (view each one you cite): F01 calibration, F02 model comparison, F03 pressure bands, F04 pressure share by innings and phase, F05 chase win probability grid, F06 chase swing grid, F07 and F08 split-half repeatability (batters, bowlers), F09 and F10 top-10 with 80% ranges, F11 and F12 pressure against ordinary value, F13 stability, F14 top-10 probability, F15 Royals rank by season, F16 one showcase chase, F17 eligibility funnel, F18 lift z scores.

## The numbers (version 2, hash c34d772dd7)
Use only numbers that appear in the model files, in the PLAN section AU.6, or in a VERIFIED lane row. Compute nothing beyond sums, differences, ratios and products of tagged numbers, and show the arithmetic the first time. The model files win over any number written in a prompt. Present a model result as "in our model", a resampling result as "in our resampling". 100 win-probability points is one match: always give the matches-swung conversion beside a floor (a floor of +29 points per 100 pressure balls is about 0.29 matches swung per 100 pressure balls).

## Wording cautions from the literature lane (these are binding)
- Write "no evidence in this window" or "does not repeat in this data", never "does not exist". A single-season test cannot see a small clutch spread.
- Our statistic is called swing. Never write the word leverage. Our measure is called the Pressure Index; ESPNcricinfo Smart Stats already uses that name for a different measure (it multiplies runs by pressure; ours is a percentile of a four-signal composite and divides credit by swing). State that difference once in section 2.
- The Duckworth-Lewis form is cited "as given in teaching notes" [use the S-ID for lane E row E06]; our fit is to this data.
- The bivariate prior is our own extension of standard shrinkage (Efron and Morris; Brown). Say so.
- The recency half-lives (batters 1 year, bowlers 3 years) are chosen by our out-of-time test (T24); no source sets them.
- Batting pressure value does not predict itself on later seasons, ours included; bowling does. Say this wherever the lists are discussed.

## Style
First person plural, declarative, plain words, mostly short sentences with some longer ones, reasoning shown, a number in most sentences. British spelling. Zero em dashes and en dashes anywhere: ranges use "to", the minus sign is U+2212. No hooks, no rhetorical questions (except section 33), no exclamation marks, no "not just X but Y", no "imagine". Banned words and phrases are in PLAN 2.2 (read the list). Introduce every table with a sentence and follow it with what it shows. Expand each short form on first use in a section.

Structure rules: use the exact H2 titles from PLAN 11.2 as `## N. Title` (section 35 is "## 35. The audit before submission: five defects found and fixed"); `### N.M` for sub-sections; never an H1. Open every numbered H2 with a bold `**Answer.**` paragraph of two to four sentences. Every number carries a tag: `[C-n]` brief line, `[M]` model, `[T n]` model table, `[S nn]` web source, `[A nn]` assumption, `[F nn]` figure. Insert figures as `![F09. Caption in plain words](figures/F09.png)` on their own line. End every slide-feeding section with `Exhibit for the deck: ...`. The five Part A headings (PLAN AU.12) must appear in the titles of sections 2, 3, 4, 5, 6 and 7 exactly as PLAN 11.2 writes them.

Players and organisations appear under their real names. Say nothing about a player that is not in the data or a VERIFIED row. Auction statuses carry their date. Coin no name for the method, the rating or a strategy. Never invent a quote, an interview, a price, a retention or an injury. Never include the user's name or email address anywhere.

## Before you reply
1. Invoke the `humanizer` skill with the Skill tool and run it in file mode on your own part: prose only; numbers, tags, tables, headings and quotes unchanged; add no fact. Reread for contrasts, closers, triads, dashes and bold labels (the `**Answer.**` lead is the only bold label).
2. Run the self-check one-liner of PLAN 12.3 on your part file (replace PART). Fix until dashes, exclamation marks, stray question marks and tell hits are all 0 and your words and tables meet the minimums.
3. Save your part to `research/parts/part-<LETTER>.md` after your first two sections and extend as you go. Edit no other file.
4. Reply with the six self-check numbers, the sections written, and any figure or fact you wanted but could not find.
