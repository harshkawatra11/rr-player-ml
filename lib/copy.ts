/** Every user-facing sentence that is not built from data lives here, so one lint pass covers the voice of the site.
 *  Rules: no dashes, no exclamation marks, none of the banned words in PLAN.md section 2.2. */
export const COPY = {
  siteTitle: "Reliable Under Pressure | SupeRR Selector Season 2",
  siteDescription:
    "A pressure rating for batters and bowlers built from IPL and T20I ball-by-ball data, with the Rajasthan Royals auction view.",
  footer:
    "Derived from Rajasthan Royals data supplied for SupeRR Selector Season 2. No ball-level data is published here.",
  logoNote: "Logos and images identify organisations and players named in public sources; no partnership or endorsement is implied.",
  team: "Team IdeaForge",
  author: "Harsh Kawatra, Delhi Technological University",
  repoUrl: "https://github.com/harshkawatra11/rr-player-ml",
  researchPath: "/research.pdf",
  dashUrl: "https://rr-ml-harsh.vercel.app",
  nav: [
    { href: "/", label: "War Room", hint: "The two lists" },
    { href: "/pressure", label: "Pressure Lab", hint: "How pressure is defined" },
    { href: "/situation", label: "Situation Room", hint: "Score one moment" },
    { href: "/players", label: "Explorer", hint: "Every rated player" },
    { href: "/compare", label: "Compare", hint: "Two to four players" },
    { href: "/auction", label: "Royals Board", hint: "Gaps and targets" },
    { href: "/method", label: "Method", hint: "How to reproduce it" },
  ],
  home: {
    kicker: "SupeRR Selector Season 2, Round 1",
    title: "Who stays reliable when the match is on the line",
    lede:
      "We value every ball in win-probability terms, score how much pressure each ball carries, and rank players on the level we are 80% sure they exceed.",
    findingsTitle: "Three findings behind the lists",
    firmNote: "Firm names hold a top-10 place in at least 65% of 400 resamples of whole matches.",
  },
  situation: {
    title: "Situation Room",
    lede: "Set a chase state and read how much pressure it carries, then see who has the best pressure record for that stage.",
    decided: "The chase is effectively decided, so the ball sits outside the pressure scale.",
    bestRecords: "Best pressure records for this stage",
    minBalls: "30 pressure balls minimum in the stage",
  },
  explorer: {
    title: "Explorer",
    lede: "Every player with at least 40 pressure balls and 40 ordinary balls. Only eligible players with 110 of each are ranked.",
    belowGate: "Below the sample gate: shown for context, not ranked.",
  },
  auction: {
    title: "Royals Board",
    lede: "Where the Royals are short under pressure, which rated players fit that gap, and what is publicly known about each.",
    emptyAvailability:
      "Retention and release lists were not public when this was built. Players are ordered by rank; statuses will be added when published.",
    unverifiedTitle: "Status not yet public",
    note: "Auction statuses come from public sources and can change. Each row shows its date and source.",
  },
  method: {
    title: "Method",
    lede: "Ten steps from a ball in the file to a rank in the list, with the checks that guard each one.",
  },
  limits: [
    "A few hundred decided matches train the win-probability model, so every ball value carries that model's error.",
    "Fielding, wicket-keeping, captaincy, dew, pitch and boundary size are not modelled.",
    "Run outs of the non-striker are not charged to the striker, and partnerships are not modelled.",
    "The win-probability model is fitted on the same matches it values; out-of-fold figures are the ones quoted.",
    "Tier weights, component weights and thresholds are judgements; the stability table shows what moves when they change.",
    "Pressure lift does not repeat in this data. That is a finding about five seasons and a few hundred pressure balls a player.",
    "No World Cup matches are in the file; T20I coverage is bilateral series, tri-series and Asia Cup events.",
    "Nationality of IPL-only players is not in the data and comes from public sources.",
    "Batting pressure value barely predicts itself on later seasons; the batting list describes the recent record.",
    "The sample gate moved from 120 to 110 balls during the audit; the 120 list is on the Method page.",
  ],
} as const;
