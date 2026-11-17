# SupeRR Selector Season 2: Identify the Most Reliable Players Under Pressure

Source: `raw-data/Round 1 Problem Statement _ SupeRR Selector Season 2.docx.pdf` (2 pages), plus the Unstop page text supplied by the user. Transcribed for reference; the PDF is the authority.

## Round 1 problem statement

Some players thrive when the game is on the line. Others struggle to deliver. But can we use data to distinguish those who consistently rise to the occasion from those whose performances dip under pressure?

### Round 1 challenge

**[C-1]** Build a data-driven system that measures how batters and bowlers perform in high-pressure match situations compared with their usual performance levels.

**[C-2]** Use your system to identify and rank the players who deliver most consistently when it matters.

### What counts as pressure?

**[C-3]** That is for you to define. Pressure might depend on the required run rate, wickets in hand, balls remaining, the stage of an innings, how close the contest is, or a combination of factors. You may consider other relevant match-context signals as well.

**[C-4]** Choose your own approach, explain why your definition is meaningful, and show how it distinguishes pressure situations from ordinary ones. Your method should work for both batting and bowling performance.

### The dataset

**[C-5]** Historical IPL and T20 International (T20I) data from 2022 onwards, including: ball-by-ball data (delivery-level match records in CSV format); supporting data (competitions, teams, players, matches, playing XIs, and competition-team-player mappings). Use these files to connect player performance with match situations across competitions and seasons.

### What you need to submit

**[C-6]** Two ordered top-10 lists: the 10 best-performing batters under pressure and the 10 best-performing bowlers under pressure. Select players in rank order, from 1 to 10, using the dropdown fields on Unstop. Rank 1 is the highest-rated player in each category. Do not repeat a player within the same top-10 list, and ensure the dropdown selections match the rankings explained in the report.

**[C-7]** A methodology report (document upload) that clearly covers:
- Pressure definition: the match situations and indicators used, and why.
- Performance measurement: the batting and bowling metrics, player baselines, and rating or scoring logic.
- Fair comparisons: approach to sample sizes, player eligibility, different match contexts, and the use of IPL and T20I data.
- Evidence for the top 10: the results, comparisons, tables or charts that support the selections and ordering.
- Reliability and limitations: how consistency across matches was checked, and where the model may be less certain.

**[C-8]** The methodology should be transparent enough for someone else to understand and reproduce the approach. Rankings must be supported by analysis of the supplied data, not reputation alone.

**[C-9]** Optional: share your journey. A few photographs, screenshots of the work, or a short video (around 30 to 60 seconds) on how the challenge was approached and one interesting insight. Does not affect evaluation.

**[C-10]** Unstop framing: this is exclusive Rajasthan Royals proprietary data. The task is to analyse it and identify the most reliable players under pressure whom Rajasthan Royals should back at the IPL 2027 auction. It can be combined with relevant publicly available information.
