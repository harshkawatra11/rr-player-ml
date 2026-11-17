# Model tables (SupeRR Selector Season 2 pressure model, hash c34d772dd7, checks 15/15)

## T1. Configuration

| Setting | Value |
|---|---|
| seed | 20261114 |
| dead_lo | 0.03 |
| dead_hi | 0.97 |
| w_swing | 0.5 |
| w_balance | 0.2 |
| w_clock | 0.15 |
| w_wstress | 0.15 |
| ko_uplift | 0.15 |
| hp_thr | 75.0 |
| ext_thr | 90.0 |
| swing_floor_q | 0.05 |
| ridge_alpha | 400.0 |
| min_p | 110 |
| min_o | 110 |
| show_min | 40 |
| active_since | 2025-06-01 |
| floor_z | 0.84 |
| lift_z | 1.28 |
| w_ipl | 1.0 |
| w_full | 0.85 |
| w_assoc | 0.6 |
| boot | 400 |
| full_members | India, Pakistan, West Indies, New Zealand, Bangladesh, Sri Lanka, England, Afghanistan, Australia, Zimbabwe, South Africa, Ireland |
| excluded_nations | Pakistan |
| ineligible | {1318: 'Retired from the IPL', 8: 'Retired from the IPL', 6280: 'Banned from the 2027 IPL'} |
| bar_dips | True |
| half_life | {'bat': 365, 'bowl': 1095} |
| rec_ref | None |
| version | v2 |

## T2. Data used

| Item | Value |
|---|---|
| Rows in ball_by_ball.csv | 2,00,999 |
| Rows dropped: emerging-team events | 6,973 |
| Balls used | 1,93,638 |
| Live balls (win probability 3% to 97%) | 1,72,863 |
| Pressure balls (PI 75 and above) | 43,216 |
| Matches used | 837 |
| Run-margin reconciliation | 99.5% |

## T3. Scoring environment: first-innings runs per legal ball

| Tier | Season | Runs per ball | Par over 120 balls |
|---|---|---|---|
| IPL | 2022 | 1.436 | 172 |
| IPL | 2023 | 1.526 | 183 |
| IPL | 2024 | 1.590 | 191 |
| IPL | 2025 | 1.608 | 193 |
| IPL | 2026 | 1.645 | 197 |
| T20I | 2022 | 1.424 | 171 |
| T20I | 2022/23 | 1.423 | 171 |
| T20I | 2023 | 1.452 | 174 |
| T20I | 2023/24 | 1.256 | 151 |
| T20I | 2024 | 1.435 | 172 |
| T20I | 2024/25 | 1.600 | 192 |
| T20I | 2025 | 1.411 | 169 |
| T20I | 2026 | 1.543 | 185 |

## T4. Win-probability validation, out of fold, grouped by match

| Innings | Balls | Matches | Log loss | Brier | AUC | Boosted log loss | Boosted AUC | Base-rate log loss | Largest calibration gap |
|---|---|---|---|---|---|---|---|---|---|
| inn1 | 99,321 | 805 | 0.636 | 0.222 | 0.690 | 0.637 | 0.683 | 0.693 | 0.025 |
| inn2 | 90,622 | 801 | 0.393 | 0.128 | 0.902 | 0.415 | 0.895 | 0.692 | 0.025 |

## T5. Calibration by predicted decile

| Innings | Bin | Balls | Predicted | Actual |
|---|---|---|---|---|
| inn1 | 0 to 10% | 1,012 | 0.064 | 0.185 |
| inn1 | 10 to 20% | 4,271 | 0.159 | 0.174 |
| inn1 | 20 to 30% | 8,701 | 0.254 | 0.255 |
| inn1 | 30 to 40% | 12,320 | 0.353 | 0.331 |
| inn1 | 40 to 50% | 20,260 | 0.455 | 0.452 |
| inn1 | 50 to 60% | 26,228 | 0.550 | 0.572 |
| inn1 | 60 to 70% | 15,206 | 0.643 | 0.624 |
| inn1 | 70 to 80% | 7,302 | 0.745 | 0.720 |
| inn1 | 80 to 90% | 3,353 | 0.842 | 0.839 |
| inn1 | 90 to 100% | 668 | 0.932 | 0.897 |
| inn2 | 0 to 10% | 18,421 | 0.033 | 0.025 |
| inn2 | 10 to 20% | 9,261 | 0.149 | 0.145 |
| inn2 | 20 to 30% | 7,411 | 0.248 | 0.269 |
| inn2 | 30 to 40% | 6,952 | 0.349 | 0.356 |
| inn2 | 40 to 50% | 6,734 | 0.449 | 0.445 |
| inn2 | 50 to 60% | 5,589 | 0.550 | 0.558 |
| inn2 | 60 to 70% | 5,642 | 0.650 | 0.662 |
| inn2 | 70 to 80% | 6,025 | 0.752 | 0.777 |
| inn2 | 80 to 90% | 7,010 | 0.852 | 0.840 |
| inn2 | 90 to 100% | 17,577 | 0.971 | 0.959 |

## T6. Win-probability coefficients

| Innings | Term | Coefficient |
|---|---|---|
| inn1 | z | 4.1651 |
| inn1 | z_x_progress | 0.7748 |
| inn1 | wk_x_remaining | -1.7624 |
| inn1 | ipl | -0.2567 |
| inn1 | ipl_x_z | 1.5471 |
| inn1 | intercept | 0.2988 |
| inn2 | log_need_over_resource | -4.1018 |
| inn2 | that_x_log_balls | -3.3311 |
| inn2 | rrr_minus_env | 0.3087 |
| inn2 | last24_ramp_x_that | 0.1787 |
| inn2 | ipl | 0.2031 |
| inn2 | ipl_x_that | -0.4501 |
| inn2 | intercept | -0.1474 |

## T7. Pressure bands

| Band | Balls | Mean swing, points | Mean win probability | Mean over | Wickets down | Share in chases | Wicket rate | Dot rate | Boundary rate | Strike rate |
|---|---|---|---|---|---|---|---|---|---|---|
| Routine (PI under 50) | 86,431 | 0.91 | 0.49 | 9.5 | 2.3 | 32% | 5.1% | 30% | 18% | 141 |
| Elevated (50 to 75) | 43,216 | 1.36 | 0.49 | 8.4 | 2.1 | 30% | 5.0% | 32% | 19% | 141 |
| High (75 to 90) | 25,929 | 1.85 | 0.49 | 9.7 | 2.4 | 64% | 5.3% | 31% | 19% | 143 |
| Extreme (90 and above) | 17,287 | 3.70 | 0.47 | 13.8 | 4.3 | 81% | 6.8% | 28% | 17% | 140 |

## T8. Share of live balls that are pressure balls

| Where | Share |
|---|---|
| Innings 1, DEATH | 32% |
| Innings 1, MID | 3% |
| Innings 1, PP | 10% |
| Innings 2, DEATH | 76% |
| Innings 2, MID | 43% |
| Innings 2, PP | 32% |
| Knockout matches | 60% |
| League and bilateral matches | 24% |

## T9. Repeatability: odd matches against even matches

| Role | Players | Pressure value | Ordinary value | Lift | Pressure half against ordinary half |
|---|---|---|---|---|---|
| bat | 87 | +0.37 | +0.20 | +0.16 | +0.18 |
| bowl | 101 | +0.07 | +0.18 | −0.07 | +0.17 |

## T10. Prior estimated from the qualified pool

| Role | Pool | Mean pressure | Mean ordinary | Spread pressure | Spread ordinary | Correlation | Ball noise pressure | Ball noise ordinary |
|---|---|---|---|---|---|---|---|---|
| bat | 114 | +0.073 | +0.038 | 0.094 | 0.059 | 0.95 | 1.57 | 1.76 |
| bowl | 120 | +0.033 | +0.058 | 0.053 | 0.065 | 0.81 | 1.54 | 1.73 |

## T11. Eligibility funnel

| Role | Any ball | 40 or more in each state | Qualified (110 and 110) | And active | And IPL-eligible | And not barred |
|---|---|---|---|---|---|---|
| bat | 788 | 226 | 114 | 100 | 97 | 87 |
| bowl | 577 | 221 | 120 | 107 | 101 | 83 |

## T12. Top 10 batters under pressure

| Rank | Player | Latest IPL side | Pressure balls | Pressure value | Ordinary value | Expected pressure value | Floor | Floor, points per 100 pressure balls | Top-10 probability | Rank range | Lift class |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Vaibhav Sooryavanshi | Rajasthan Royals | 119 | +0.68 | +0.39 | +0.337 | +0.278 | +72 | 94% | 1 to 6 | Rises |
| 2 | Abhishek Sharma | Sunrisers Hyderabad | 351 | +0.28 | +0.26 | +0.267 | +0.220 | +57 | 93% | 1 to 8 | Steady |
| 3 | Tim David | Royal Challengers Bengaluru | 444 | +0.27 | +0.29 | +0.223 | +0.171 | +44 | 68% | 1 to 24 | Steady |
| 4 | Heinrich Klaasen | Sunrisers Hyderabad | 319 | +0.35 | +0.18 | +0.217 | +0.164 | +42 | 79% | 2 to 15 | Steady |
| 5 | Virat Kohli | Royal Challengers Bengaluru | 597 | +0.24 | +0.16 | +0.189 | +0.142 | +37 | 69% | 3 to 19 | Steady |
| 6 | Shreyas Iyer | Punjab Kings | 409 | +0.24 | +0.16 | +0.186 | +0.137 | +36 | 61% | 3 to 23 | Steady |
| 7 | Ishan Kishan | Sunrisers Hyderabad | 438 | +0.15 | +0.16 | +0.164 | +0.115 | +30 | 39% | 4 to 32 | Steady |
| 8 | Lokesh Rahul | Delhi Capitals | 429 | +0.24 | +0.11 | +0.161 | +0.112 | +29 | 37% | 5 to 32 | Steady |
| 9 | Suryakumar Yadav | Mumbai Indians | 527 | +0.18 | +0.12 | +0.156 | +0.110 | +29 | 40% | 5 to 32 | Steady |
| 10 | Namboori Tilak Varma | Mumbai Indians | 698 | +0.20 | +0.09 | +0.152 | +0.109 | +28 | 36% | 5 to 30 | Steady |

## T13. Top 10 bowlers under pressure

| Rank | Player | Latest IPL side | Pressure balls | Pressure value | Ordinary value | Expected pressure value | Floor | Floor, points per 100 pressure balls | Top-10 probability | Rank range | Lift class |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Jasprit Bumrah | Mumbai Indians | 455 | +0.27 | +0.18 | +0.122 | +0.091 | +24 | 90% | 1 to 11 | Steady |
| 2 | Bhuvneshwar Kumar | Royal Challengers Bengaluru | 709 | +0.22 | +0.17 | +0.120 | +0.091 | +24 | 89% | 1 to 11 | Steady |
| 3 | Josh Hazlewood | Royal Challengers Bengaluru | 421 | +0.30 | +0.17 | +0.120 | +0.088 | +23 | 81% | 1 to 14 | Steady |
| 4 | Sunil Narine | Kolkata Knight Riders | 400 | +0.25 | +0.20 | +0.118 | +0.087 | +22 | 90% | 1 to 11 | Steady |
| 5 | Kuldeep Yadav | Delhi Capitals | 443 | +0.20 | +0.13 | +0.093 | +0.063 | +16 | 62% | 3 to 21 | Steady |
| 6 | Varun Chakravarthy | Kolkata Knight Riders | 516 | +0.10 | +0.19 | +0.092 | +0.063 | +16 | 58% | 3 to 24 | Steady |
| 7 | Rashid Khan | Gujarat Titans | 662 | +0.15 | +0.13 | +0.087 | +0.059 | +15 | 56% | 3 to 26 | Steady |
| 8 | Mustafizur Rahman | Kolkata Knight Riders | 370 | +0.14 | +0.16 | +0.087 | +0.056 | +14 | 45% | 5 to 24 | Steady |
| 9 | Krunal Pandya | Royal Challengers Bengaluru | 360 | +0.19 | +0.12 | +0.082 | +0.050 | +13 | 38% | 4 to 30 | Steady |
| 10 | Trent Boult | Mumbai Indians | 517 | +0.21 | +0.06 | +0.078 | +0.048 | +12 | 31% | 6 to 30 | Rises |

## T14. Ranks 11 to 30, batters

| Rank | Player | Latest IPL side | Pressure balls | Floor | Top-10 probability | Lift class |
|---|---|---|---|---|---|---|
| 11 | Prabhsimran Singh | Punjab Kings | 348 | +0.104 | 35% | Steady |
| 12 | Shubman Gill | Gujarat Titans | 577 | +0.102 | 31% | Steady |
| 13 | Jos Buttler | Gujarat Titans | 530 | +0.091 | 23% | Steady |
| 14 | Mitchell Marsh | Lucknow Super Giants | 375 | +0.091 | 26% | Steady |
| 15 | Rashid Khan | Gujarat Titans | 142 | +0.088 | 23% | Steady |
| 16 | Riyan Parag | Rajasthan Royals | 268 | +0.083 | 20% | Steady |
| 17 | Reeza Hendricks | n/a | 119 | +0.082 | 22% | Rises |
| 18 | Sai Sudharsan | Gujarat Titans | 346 | +0.080 | 7% | Steady |
| 19 | Ryan Rickelton | Mumbai Indians | 139 | +0.080 | 22% | Steady |
| 20 | Josh Inglis | Lucknow Super Giants | 158 | +0.077 | 17% | Steady |
| 21 | Venkatesh Iyer | Royal Challengers Bengaluru | 266 | +0.071 | 9% | Steady |
| 22 | Ashutosh Sharma | Delhi Capitals | 159 | +0.067 | 10% | Steady |
| 23 | Daryl Mitchell | Chennai Super Kings | 165 | +0.064 | 7% | Steady |
| 24 | Sam Curran | Rajasthan Royals | 275 | +0.064 | 13% | Steady |
| 25 | Quinton de Kock | Mumbai Indians | 225 | +0.058 | 20% | Steady |
| 26 | Devdutt Padikkal | Royal Challengers Bengaluru | 256 | +0.055 | 6% | Rises |
| 27 | Jonny Bairstow | Mumbai Indians | 141 | +0.054 | 6% | Rises |
| 28 | Sanju Samson | Chennai Super Kings | 361 | +0.054 | 8% | Steady |
| 29 | Naman Dhir | Mumbai Indians | 120 | +0.054 | 7% | Steady |
| 30 | Shashank Singh | Punjab Kings | 164 | +0.051 | 6% | Steady |

## T15. Ranks 11 to 30, bowlers

| Rank | Player | Latest IPL side | Pressure balls | Floor | Top-10 probability | Lift class |
|---|---|---|---|---|---|---|
| 11 | Noor Ahmad | Chennai Super Kings | 348 | +0.046 | 35% | Steady |
| 12 | Nathan Ellis | Chennai Super Kings | 299 | +0.046 | 29% | Steady |
| 13 | Kagiso Rabada | Gujarat Titans | 400 | +0.042 | 24% | Rises |
| 14 | Matheesha Pathirana | Kolkata Knight Riders | 354 | +0.042 | 26% | Steady |
| 15 | Lungi Ngidi | Delhi Capitals | 161 | +0.042 | 24% | Steady |
| 16 | Mitchell Santner | Mumbai Indians | 295 | +0.041 | 26% | Rises |
| 17 | Ravindra Jadeja | Rajasthan Royals | 268 | +0.040 | 22% | Steady |
| 18 | Wanindu Hasaranga | Lucknow Super Giants | 492 | +0.035 | 14% | Steady |
| 19 | Jofra Archer | Rajasthan Royals | 255 | +0.034 | 18% | Steady |
| 20 | Eshan Malinga | Sunrisers Hyderabad | 130 | +0.032 | 18% | Steady |
| 21 | Mahedi Hasan | n/a | 172 | +0.029 | 23% | Steady |
| 22 | Patrick Cummins | Sunrisers Hyderabad | 251 | +0.028 | 15% | Steady |
| 23 | Mohammed Shami | Lucknow Super Giants | 435 | +0.027 | 18% | Steady |
| 24 | Axar Patel | Delhi Capitals | 516 | +0.026 | 7% | Steady |
| 25 | Lockie Ferguson | Punjab Kings | 337 | +0.025 | 9% | Steady |
| 26 | Harpreet Brar | Punjab Kings | 154 | +0.023 | 12% | Steady |
| 27 | Mohammed Siraj | Gujarat Titans | 548 | +0.023 | 6% | Steady |
| 28 | Mujeeb Ur Rahman | Mumbai Indians | 236 | +0.022 | 4% | Steady |
| 29 | Jason Holder | Gujarat Titans | 464 | +0.020 | 4% | Steady |
| 30 | Yuzvendra Chahal | Punjab Kings | 614 | +0.009 | 2% | Steady |

## T16. Stability of the ranking

| Variant | Batters: rank correlation | Batters: top 10 kept | Bowlers: rank correlation | Bowlers: top 10 kept |
|---|---|---|---|---|
| Swing only | 0.98 | 8 | 0.96 | 8 |
| Equal weights | 0.92 | 5 | 0.98 | 8 |
| No knockout uplift | 0.99 | 9 | 1.00 | 8 |
| Threshold PI 67 | 0.95 | 8 | 0.99 | 10 |
| Threshold PI 80 | 0.96 | 9 | 0.99 | 8 |
| Threshold PI 90 | 0.96 | 6 | 0.98 | 8 |
| IPL balls only | 0.85 | 7 | 0.80 | 5 |
| No opposition adjustment | 0.99 | 10 | 0.98 | 9 |
| No tier weights | 1.00 | 10 | 1.00 | 10 |

## T17. Rajasthan Royals under pressure, IPL, by season, role and phase

| Season | Role | Phase | Mean value | Pressure balls | Rank of 10 |
|---|---|---|---|---|---|
| 2022 | bat | ALL | +0.02 | 681 | 5 |
| 2022 | bat | DEATH | +0.08 | 204 | 2 |
| 2022 | bat | MID | −0.04 | 149 | 7 |
| 2022 | bat | PP | +0.01 | 328 | 3 |
| 2022 | bowl | ALL | +0.05 | 974 | 7 |
| 2022 | bowl | DEATH | +0.11 | 273 | 1 |
| 2022 | bowl | MID | −0.03 | 432 | 8 |
| 2022 | bowl | PP | +0.13 | 269 | 4 |
| 2023 | bat | ALL | −0.01 | 532 | 8 |
| 2023 | bat | DEATH | +0.10 | 234 | 3 |
| 2023 | bat | MID | −0.01 | 157 | 7 |
| 2023 | bat | PP | −0.18 | 141 | 9 |
| 2023 | bowl | ALL | +0.11 | 437 | 2 |
| 2023 | bowl | DEATH | +0.03 | 205 | 7 |
| 2023 | bowl | MID | +0.19 | 100 | 2 |
| 2023 | bowl | PP | +0.16 | 132 | 4 |
| 2024 | bat | ALL | +0.05 | 559 | 2 |
| 2024 | bat | DEATH | +0.07 | 184 | 4 |
| 2024 | bat | MID | −0.02 | 226 | 4 |
| 2024 | bat | PP | +0.12 | 149 | 2 |
| 2024 | bowl | ALL | +0.15 | 729 | 4 |
| 2024 | bowl | DEATH | +0.11 | 312 | 2 |
| 2024 | bowl | MID | +0.25 | 242 | 4 |
| 2024 | bowl | PP | +0.07 | 175 | 7 |
| 2025 | bat | ALL | +0.11 | 455 | 3 |
| 2025 | bat | DEATH | −0.12 | 211 | 9 |
| 2025 | bat | MID | +0.11 | 132 | 4 |
| 2025 | bat | PP | +0.52 | 112 | 1 |
| 2025 | bowl | ALL | +0.09 | 372 | 3 |
| 2025 | bowl | DEATH | −0.02 | 206 | 10 |
| 2025 | bowl | MID | +0.14 | 111 | 4 |
| 2025 | bowl | PP | +0.41 | 55 | 1 |
| 2026 | bat | ALL | +0.23 | 378 | 2 |
| 2026 | bat | DEATH | +0.21 | 149 | 2 |
| 2026 | bat | MID | +0.13 | 110 | 4 |
| 2026 | bat | PP | +0.35 | 119 | 3 |
| 2026 | bowl | ALL | −0.01 | 673 | 7 |
| 2026 | bowl | DEATH | −0.08 | 208 | 9 |
| 2026 | bowl | MID | +0.06 | 283 | 6 |
| 2026 | bowl | PP | −0.04 | 182 | 5 |

## T18. Rajasthan Royals 2026 squad in the ratings

| Player | Batting rank | Batting floor | Bowling rank | Bowling floor |
|---|---|---|---|---|
| Ravindra Jadeja | 50 | +0.002 | 17 | +0.040 |
| Adam Milne | n/a | n/a | n/a | −0.005 |
| Sandeep Sharma | n/a | n/a | 43 | −0.007 |
| Dasun Shanaka | 51 | +0.001 | n/a | −0.033 |
| Shimron Hetmyer | 40 | +0.026 | n/a | n/a |
| Jofra Archer | n/a | −0.019 | 19 | +0.034 |
| Sam Curran | 24 | +0.064 | 71 | −0.036 |
| Riyan Parag | 16 | +0.083 | n/a | −0.021 |
| Tushar Deshpande | n/a | n/a | 52 | −0.014 |
| Yashasvi Jaiswal | 39 | +0.027 | n/a | n/a |
| Dhruv Jurel | n/a | −0.037 | n/a | n/a |
| Sushant Mishra | n/a | n/a | n/a | n/a |
| Nandre Burger | n/a | n/a | 66 | −0.028 |
| Ravi Bishnoi | n/a | n/a | n/a | −0.029 |
| Kuldeep Sen | n/a | n/a | n/a | +0.003 |
| Donovan Ferreira | n/a | +0.025 | n/a | n/a |
| Yudhvir Singh | n/a | n/a | n/a | −0.017 |
| Shubham Dubey | n/a | −0.035 | n/a | n/a |
| Kwena Maphaka | n/a | n/a | n/a | −0.053 |
| Yash Punja | n/a | n/a | n/a | −0.004 |
| Lhuan Pretorius | n/a | n/a | n/a | n/a |
| Emanjot Singh Chahal | n/a | n/a | n/a | n/a |
| Aman Rao Perala | n/a | n/a | n/a | n/a |
| Vignesh Puthur | n/a | n/a | n/a | n/a |
| Vaibhav Sooryavanshi | 1 | +0.278 | n/a | n/a |
| Ravi Singh | n/a | n/a | n/a | n/a |
| Brijesh Sharma | n/a | n/a | n/a | −0.014 |

## T19. Out-of-time test: ratings from 2022 to 2024 against pressure value in 2025 to 2026

| Role | Players | Corr, raw pressure | Corr, raw ordinary | Corr, all balls | Corr, expected value | Corr, floor | Corr, raw lift | Lift early against late | Top 10 by raw pressure, later value | Top 10 by floor, later value | Pool average, later value |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bat | 53 | −0.02 | +0.04 | +0.02 | +0.03 | +0.05 | −0.04 | +0.07 | +0.111 | +0.117 | +0.125 |
| bowl | 60 | +0.22 | +0.29 | +0.33 | +0.40 | +0.41 | +0.01 | −0.24 | +0.117 | +0.205 | +0.066 |

## T20. Edge cases and how the model treats them

| Case | Count or ids | Treatment |
|---|---|---|
| Shortened matches with no revision recorded | 15795, 16754, 23674, 29984, 31278, 48514 | Both innings capped at the first innings length, rounded up to a full over |
| DLS chases with no revised target | 20182, 23674, 24822, 28334 | Chase innings dropped from valuation and training |
| Retired out | 6 | Not charged to the batter or the bowler |
| Stumpings off wides | 34 | Charged to the batter with no runs and no ball used |
| Matches not decided (ties, super overs, no result) | 32 | Valued ball by ball, never used to train win probability |

## T21. Top 10 at four sample gates (balls of each kind)

| Gate | Batters | Bowlers |
|---|---|---|
| 100 | Vaibhav Sooryavanshi, Abhishek Sharma, Tim David, Heinrich Klaasen, Virat Kohli, Shreyas Iyer, Ishan Kishan, Lokesh Rahul, Suryakumar Yadav, Namboori Tilak Varma | Jasprit Bumrah, Bhuvneshwar Kumar, Sunil Narine, Josh Hazlewood, Varun Chakravarthy, Kuldeep Yadav, Mustafizur Rahman, Rashid Khan, Noor Ahmad, Nathan Ellis |
| 110 | Vaibhav Sooryavanshi, Abhishek Sharma, Tim David, Heinrich Klaasen, Virat Kohli, Shreyas Iyer, Ishan Kishan, Lokesh Rahul, Suryakumar Yadav, Namboori Tilak Varma | Jasprit Bumrah, Bhuvneshwar Kumar, Josh Hazlewood, Sunil Narine, Kuldeep Yadav, Varun Chakravarthy, Rashid Khan, Mustafizur Rahman, Krunal Pandya, Trent Boult |
| 120 | Abhishek Sharma, Tim David, Heinrich Klaasen, Virat Kohli, Shreyas Iyer, Ishan Kishan, Suryakumar Yadav, Namboori Tilak Varma, Lokesh Rahul, Shubman Gill | Jasprit Bumrah, Bhuvneshwar Kumar, Sunil Narine, Josh Hazlewood, Varun Chakravarthy, Kuldeep Yadav, Mustafizur Rahman, Rashid Khan, Noor Ahmad, Krunal Pandya |
| 140 | Abhishek Sharma, Tim David, Heinrich Klaasen, Virat Kohli, Shreyas Iyer, Ishan Kishan, Suryakumar Yadav, Lokesh Rahul, Namboori Tilak Varma, Shubman Gill | Jasprit Bumrah, Bhuvneshwar Kumar, Sunil Narine, Josh Hazlewood, Varun Chakravarthy, Kuldeep Yadav, Mustafizur Rahman, Rashid Khan, Noor Ahmad, Nathan Ellis |

## T22. Rated players barred from a top-10 place

| Role | Player | Rank before the bar | Reason | Lift z |
|---|---|---|---|---|
| bat | Harry Brook | 3 | Banned from the 2027 IPL | +0.51 |
| bat | Andre Russell | 7 | Retired from the IPL | +2.00 |
| bat | Phil Salt | 15 | Dips under pressure | −2.45 |
| bat | Glenn Phillips | 18 | Dips under pressure | −1.56 |
| bat | Rajat Patidar | 20 | Dips under pressure | −1.89 |
| bowl | Mohsin Khan | 11 | Dips under pressure | −1.73 |
| bowl | Blessing Muzarabani | 12 | Dips under pressure | −1.99 |
| bowl | Jacob Duffy | 20 | Dips under pressure | −1.77 |
| bowl | Arshdeep Singh | 26 | Dips under pressure | −1.42 |
| bowl | Corbin Bosch | 30 | Dips under pressure | −2.74 |

## T25. Consistency across matches for the two top 10s (matches with 4 or more pressure balls; decisive means the player's own pressure balls added 15 or more win-probability points, costly means they cost 15 or more)

| Role | Rank | Player | Pressure matches | Share helping | Decisive | Costly | Best match, points | Worst match, points |
|---|---|---|---|---|---|---|---|---|
| bat | 1 | Vaibhav Sooryavanshi | 10 | 80% | 5 | 1 | +36.8 | −15.4 |
| bat | 2 | Abhishek Sharma | 35 | 57% | 4 | 1 | +32.1 | −16.8 |
| bat | 3 | Tim David | 36 | 58% | 7 | 2 | +94.1 | −26.1 |
| bat | 4 | Heinrich Klaasen | 20 | 80% | 5 | 0 | +47.4 | −7.3 |
| bat | 5 | Virat Kohli | 35 | 57% | 4 | 0 | +28.0 | −12.8 |
| bat | 6 | Shreyas Iyer | 25 | 64% | 7 | 2 | +66.6 | −19.2 |
| bat | 7 | Ishan Kishan | 31 | 61% | 4 | 0 | +26.2 | −12.5 |
| bat | 8 | Lokesh Rahul | 30 | 57% | 4 | 3 | +55.6 | −44.4 |
| bat | 9 | Suryakumar Yadav | 42 | 55% | 8 | 2 | +38.9 | −25.5 |
| bat | 10 | Namboori Tilak Varma | 45 | 49% | 10 | 6 | +87.2 | −29.0 |
| bowl | 1 | Jasprit Bumrah | 35 | 63% | 5 | 5 | +43.1 | −32.7 |
| bowl | 2 | Bhuvneshwar Kumar | 59 | 56% | 10 | 8 | +66.7 | −56.9 |
| bowl | 3 | Josh Hazlewood | 36 | 58% | 10 | 3 | +79.0 | −43.9 |
| bowl | 4 | Sunil Narine | 35 | 60% | 8 | 1 | +44.9 | −18.1 |
| bowl | 5 | Kuldeep Yadav | 39 | 62% | 6 | 2 | +40.1 | −40.8 |
| bowl | 6 | Varun Chakravarthy | 37 | 54% | 8 | 3 | +112.0 | −27.6 |
| bowl | 7 | Rashid Khan | 54 | 63% | 10 | 3 | +51.4 | −32.7 |
| bowl | 8 | Mustafizur Rahman | 27 | 59% | 5 | 4 | +63.6 | −71.0 |
| bowl | 9 | Krunal Pandya | 23 | 74% | 6 | 1 | +43.5 | −17.0 |
| bowl | 10 | Trent Boult | 42 | 55% | 7 | 1 | +28.7 | −50.3 |

## T24. Choosing the recency half-life: ratings from 2022 to 2024 weighted toward 1 Jan 2025, against pressure value in 2025 to 2026

| Half-life | Batters: corr | Batters: top 10 later | Bowlers: corr | Bowlers: top 10 later | Pool later, batters | Pool later, bowlers |
|---|---|---|---|---|---|---|
| none | +0.04 | +0.105 | +0.40 | +0.205 | +0.125 | +0.066 |
| 1095 | +0.04 | +0.105 | +0.41 | +0.205 | +0.125 | +0.066 |
| 730 | +0.04 | +0.115 | +0.40 | +0.202 | +0.125 | +0.066 |
| 365 | +0.05 | +0.117 | +0.38 | +0.169 | +0.125 | +0.066 |
| 180 | +0.06 | +0.113 | +0.29 | +0.134 | +0.125 | +0.066 |

## T23. Resources curve (Duckworth-Lewis form fitted to this data)

| Parameter | Value |
|---|---|
| Z0, runs from a full innings in the average environment | 305.9 |
| b, decay rate | 0.0072 |
| F(1), share of full resources with 1 wickets in hand | 0.054 |
| F(2), share of full resources with 2 wickets in hand | 0.091 |
| F(3), share of full resources with 3 wickets in hand | 0.154 |
| F(4), share of full resources with 4 wickets in hand | 0.228 |
| F(5), share of full resources with 5 wickets in hand | 0.357 |
| F(6), share of full resources with 6 wickets in hand | 0.459 |
| F(7), share of full resources with 7 wickets in hand | 0.575 |
| F(8), share of full resources with 8 wickets in hand | 0.713 |
| F(9), share of full resources with 9 wickets in hand | 0.854 |
| F(10), share of full resources with 10 wickets in hand | 1.000 |

