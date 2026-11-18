export type Role = "bat" | "bowl";
export type LiftClass = "Rises" | "Steady" | "Dips";
export type Phase = "PP" | "MID" | "DEATH";

/** One split row: [key, balls, mean value, rate (strike rate or economy), dismissals or wickets]. Keys ending "|P" are pressure balls, "|O" ordinary. */
export type SplitRow = [string, number, number | null, number | null, number];
/** One pressure match: [date, competition, opponent, pressure balls, win-probability points added, runs, balls, dismissals or wickets]. */
export type MatchRow = [string, string, string, number, number | null, number, number, number];

export interface Player {
  id: number;
  name: string;
  role: Role;
  nation: string | null;
  ipl_team: string | null;
  last: string | null;
  rank: number | null;
  qualified: boolean;
  active: boolean;
  eligible: boolean;
  barred: string;
  rank_pre: number | null;
  pm: number;
  pos_share: number | null;
  decisive: number;
  costly: number;
  worst: number | null;
  best: number | null;
  hand: string | null;
  pos: number | null;
  bowl_type: string | null;
  bowl_kind: string | null;
  nP: number;
  nO: number;
  iplP: number;
  xP: number | null;
  xO: number | null;
  epp: number;
  sd: number;
  floor: number;
  floor_pp100: number;
  epp_pp100: number;
  lift: number | null;
  lift_z: number | null;
  lift_class: LiftClass;
  p_top10: number | null;
  p_top20: number | null;
  rank_lo: number | null;
  rank_hi: number | null;
  wpaP: number | null;
  wpaAll: number | null;
  rateP: number | null;
  rateO: number | null;
  runsP: number | null;
  runsO: number | null;
  ballsP: number | null;
  ballsO: number | null;
  outsP: number | null;
  outsO: number | null;
  dotP: number | null;
  dotO: number | null;
  bndP: number | null;
  bndO: number | null;
  splits: {
    phase_hp: SplitRow[];
    inn_hp: SplitRow[];
    pace_or_spin_hp: SplitRow[];
    year_hp: SplitRow[];
    band: SplitRow[];
  };
  matches: MatchRow[];
}

export type SlimPlayer = Omit<Player, "splits" | "matches">;

export interface Band {
  band: string;
  name: string;
  n: number;
  swing: number;
  wp: number;
  over: number;
  wk_down: number;
  inn2: number;
  wkt: number;
  dot: number;
  bnd: number;
  sr: number;
}

export interface WpValidation {
  balls: number;
  matches: number;
  base_rate: number;
  ll: number;
  brier: number;
  auc: number;
  ll_gbm: number;
  brier_gbm: number;
  auc_gbm: number;
  ll_base: number;
  cal: [number, number, number, number][];
  cal_gap: number;
}

export interface SplitHalf {
  n: number;
  r_pressure: number;
  r_ordinary: number;
  r_lift: number;
  r_cross: number;
  points: [number, number, number, number][];
}

export interface Prior {
  muP: number;
  muO: number;
  a: number;
  d: number;
  c: number;
  tauP: number;
  tauO: number;
  rho: number;
  pool: number;
  sdP: number;
  sdO: number;
}

export interface SensRow {
  variant: string;
  bat_rho: number;
  bat_kept: number;
  bat_n: number;
  bowl_rho: number;
  bowl_kept: number;
  bowl_n: number;
}

export interface TeamRow {
  season: string | number;
  team: string;
  role: Role;
  phase: Phase | "ALL";
  mean: number;
  size: number;
  rank: number;
}

export interface SquadRow {
  id: number;
  name: string;
  bat: { rank: number | null; floor: number; nP: number; qualified: boolean; lift_class: LiftClass } | null;
  bowl: { rank: number | null; floor: number; nP: number; qualified: boolean; lift_class: LiftClass } | null;
}

export interface AvailabilityRow {
  player_id: number;
  name: string;
  role: Role;
  status: "RETAINED" | "RELEASED" | "AUCTION_POOL" | "TRADED" | "NOT_IN_IPL" | "UNVERIFIED";
  team_2026: string | null;
  team_2027: string | null;
  last_price_cr: number | null;
  overseas: boolean | string | null;
  age: number | null;
  status_date: string | null;
  source_id: string | null;
  note: string | null;
}

export interface Deck {
  hash: string;
  n_balls: string;
  n_live: string;
  n_pressure: string;
  n_matches: string;
  dead_share: string;
  auc2: string;
  ll2: string;
  auc1: string;
  ll1: string;
  auc2_gbm: string;
  cal_gap: string;
  band_swing: string[];
  band_wkt: string[];
  band_n: string[];
  band_names: string[];
  swing_ratio: string;
  share: Record<string, string>;
  share_ko: string;
  share_league: string;
  share_inn1: string;
  share_inn2: string;
  sh: Record<Role, { r_pressure: string; r_ordinary: string; r_lift: string }>;
  sh_n: Record<Role, number>;
  rho: Record<Role, string>;
  funnel: Record<Role, number[]>;
  lift_share: Record<Role, string>;
  lift_chance: string;
  top_bat: string[][];
  top_bowl: string[][];
  sens: string[][];
  min_rho: Record<Role, string>;
  firm: Record<Role, number>;
  swp: string;
  rr: (string | number)[][];
  oot: Record<Role, { players: number; top_raw: string; top_floor: string; pool: string; corr_raw: string; corr_floor: string; lift: string }>;
  gates: Record<string, Record<Role, string[]>>;
  barred: Record<Role, [string, number, string, number][]>;
  edge: { reduced_inferred: number[]; dls_chases_dropped: number[]; retired_out_rows: number; retired_out_charged: number; wide_stumpings: number; wide_stumpings_charged: number; matches_not_decided: number };
  bias_max: string;
  gate: string;
  dl: { Z0: number; b: number; F: number[] };
  half_life: Record<Role, number | null>;
  hl_test: Record<string, Record<Role, { corr: number; top10: number; pool: number }>>;
}

export interface Meta {
  meta: { model: string; hash: string; checks_passed: number; checks_total: number; generated: string };
  config: Record<string, unknown>;
  data: {
    raw_rows: number;
    matches: number;
    balls_used: number;
    live: number;
    dead_share: number;
    recon: number;
    emerging_rows_dropped: number;
    glob_rpb: number;
    env: { tier: string; season: string; r: number; l: number; env_rpb: number }[];
  };
  validation: {
    wp: { inn1: WpValidation; inn2: WpValidation };
    coef: Record<string, { names: string[]; coef: number[]; intercept: number }>;
    bands: Band[];
    hp_share: Record<string, number>;
    hp_ko: Record<string, number>;
    hp_inn: Record<string, number>;
    swing_pressure_mean: number;
    outcome_probs: Record<string, Record<string, number>>;
    split_half: Record<Role, SplitHalf>;
    prior: Record<Role, Prior>;
    sensitivity: SensRow[];
    funnel: Record<Role, number[]>;
  };
  top10: Record<Role, number[]>;
  deck: Deck;
  rr: { team: TeamRow[]; squad: SquadRow[] };
  availability: AvailabilityRow[];
}

export interface Grid {
  rn: [number, number];
  bl: [number, number];
  env_rpb: number;
  /** keyed by wickets in hand "1".."10"; indexed [runs needed - 1][balls left - 1]; win probability times 1000 */
  wp: Record<string, number[][]>;
  /** swing times 10000 */
  swing: Record<string, number[][]>;
  swing_q: number[];
  raw_q: number[];
  exp_wk: Record<string, number>;
  weights: { swing: number; balance: number; clock: number; wstress: number; ko: number };
}

export interface ShowcaseMatch {
  id: number;
  date: string;
  comp: string;
  home: string;
  away: string;
  result: string;
  /** [innings, over, win probability of the batting side at the start of the over, mean PI, runs, wickets, batting side] */
  overs: [number, number, number | null, number | null, number, number, string | null][];
}

export interface LedgerRow {
  franchise: string;
  basis: string;
  purse_cr: number;
  retained: number;
  overseas: number;
  committed_cr: number;
  purse_left_cr: number;
  slots_left: number;
  overseas_left: number;
  needed_to_18: number;
  max_bid_cr: number;
}

export interface Ledger {
  rows: LedgerRow[];
  royals: LedgerRow[];
  note: string;
}
