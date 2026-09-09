/**
 * The author's own words: the Reddit post, the Active Rest prescriptions, and
 * the sheet's changelog. Citation markers like [3] refer to `research.ts`.
 */

export const POST_TITLE =
  "The MOST OVERKILL science-based workout split in existence. (AKA... the PANDR-5 Model)";

export const POST_SOURCE_URL = "https://www.reddit.com/r/Biohackers/s/03L5SIkLo8";

export const MODEL_NAME =
  "PPLUL, Abating, Non-competing, Double Progression, 5-day (AKA... the PANDR-5 Model)";

/** Intro paragraphs from the Reddit post, before the model description. */
export const POST_INTRO: readonly string[] = [
  "Disclaimer: Yes, this is indeed the most overkill science-based workout split I have ever seen. Also, yes, I made it. No, this is not some stupid paid promotional post. Also, no, this was not the result of an AI-induced schizo psychosis episode at 3am 🥹",
  "I am recovering from an injury, and sadly don't have the mental bandwidth to try it out on myself... at least not yet. Hence why I chose the \"Exercise, Fitness & Recovery\" flair and not the \"Protocols & Self-Experiments\" flair. That being said, this is a very experimental model, and I cannot claim any more than that. Do with this information what you please, I just wanted to put it out there for those of you who are neurotic about science-based lifting or think it's fun. Again, it IS overkill, you don't need it. But give it a shot if you want! What follows from here is an explanation of the concepts and research it is based on.",
];

/**
 * The model description, with the citation markers as they appear in the
 * Guide Sheet. Each string is one paragraph.
 */
export const POST_BODY: readonly string[] = [
  "The PANDR-5™ model is a structured five-day Push, Pull, Legs, Upper, Lower plan that hits each muscle twice per week. [1][2] Every lift uses a relatively wide rep range (e.g., 6–10) with a planned RIR staircase between 3 - <0 RIR. [3][4] You keep one load across sets and add reps over time. [5] When the final set reaches the top of the range at 0–1 RIR, increase the load 2–5% next session and restart at the low end. [6][7] If that last set overshoots the cap at the target RIR, treat it the same (add weight next time). [6] If the last set falls below the floor at 0–1 RIR, reduce the load slightly (about 2–3%) next session; if it's within the range but easier than 1 RIR, keep the load and chase reps until the anchor set lands at ≤1 RIR. [5][7][8] *When a movement includes a beyond-failure finisher (<0 RIR), use the preceding set as your progression anchor. [9][10] If that set reaches the top of the rep range at its assigned RIR, increase the load by 2–5% next session. The extra work past failure doesn't change the load bump. [11][12]",
  "You use the same weight for all sets, adding reps over time until your final set can hit the top of the range without exceeding your target RIR. [5][6] When that happens, you increase the weight slightly and restart at the low end of the range. [5][7] For heavy barbell compounds, 0 RIR is treated as technical failure (last clean rep), while supported machines and isolations can safely be taken to true failure and occasionally beyond (<0). [9][10] Beyond failure sets are strategically placed only (for the most part) on the last set of the last exercise of a given muscle group. [9][11][12]",
  "The split uses non-competing pairs (NCP) to maximize performance. [13] For chest days, I pair chest with biceps. In pressing movements, the triceps work as prime synergists with the pecs, so training triceps would compete with pressing. [14] By contrast, the biceps contribute little to pressing (they act as elbow antagonists and primarily as shoulder stabilizers) so overlap is minimal. [14][15] That lets me press heavy without arm pre-fatigue, then train biceps hard without compromising performance. [13][14]",
  "The weekly set targets for each muscle group are calculated roughly (!) using the concept of fractional set allocation (also called effective sets or set-equivalent estimation in some research literature). [16] This method accounts for the fact that multi-joint lifts stimulate multiple muscles to varying degrees. [16] For example, a bench press provides full set credit to the chest, partial set credit to the triceps, and minimal direct stimulus to the biceps. [14][15][16] By assigning ≤1.0 of a set to each muscle based on its role in the movement, the program ensures each muscle hits an optimal weekly volume without unnecessary overlap or fatigue spillover. [2][16] Note* Given the limited research, this concept is applied conservatively. [16] The set-equivalent multipliers represent approximate averages for managing weekly volume, not exact prescriptions for each muscle's involvement in a specific movement.",
  "This method (somewhat experimentally) balances effort and recovery, gives a clear and consistent trigger for progression, and naturally adjusts to your current strength level while keeping training enjoyable and sustainable. [8][17][18]",
];

/** Blank Fillout tab intro, on how to log. */
export const LOGGING_NOTES: readonly string[] = [
  "In keeping with the PANDR-5 methodology, the load for each exercise stays consistent across all working sets. [5] This means you don't need to log weight for every set, just record the load once. Likewise, when logging reps, you only need to record the number achieved on your final set of the exercise. That last set is your progression anchor. [5][6][7] The one exception is if the exercise ends with a beyond-failure finisher (<0 RIR); in that case, use the preceding set as the anchor. [9][10] If that anchor set reaches the top of the rep range at its assigned RIR, increase the load by 2–5% next session. [6][7] The extra work past failure doesn't affect when you bump the weight. [11][12]",
  "While I recommend running the default exercise selections unless you're experienced, it's possible to swap exercises if needed for preference, equipment, or circumstances. The individual lifts are less structurally important than the overarching methodology. If you do make swaps, make sure you research the prime movers and synergists so you can correctly update the fractional set allocation in the main guide sheet. [14][15][16] This keeps total volume per muscle accurate. [16]",
];

export interface ActiveRestText {
  decisionRule: string;
  otherwise: string;
  nutrition: string;
  sleep: string;
  guardrails: string;
  /** Only on the second rest day of the cycle. */
  weeklyCheck?: string;
}

const REST_COMMON = {
  decisionRule:
    "If sleep was poor, you feel run-down, resting HR is up, or soreness is lingering, take passive rest (easy steps only, no planned cardio).",
  otherwise:
    "Otherwise do 20–30 min very easy aerobic work at conversational pace (≈40–60% max HR) plus 5–10 min mobility.",
  nutrition:
    "Hit 1.6–2.2 g/kg protein, spread across the day; hydrate; optional 30–40 g protein before bed.",
  sleep: "Aim 7–9 h; dark, cool room; screens off the last hour.",
  guardrails: "No failure work, no HIIT, no \"make-up\" lifting.",
};

export const ACTIVE_REST: Record<"rest1" | "rest2", ActiveRestText> = {
  rest1: { ...REST_COMMON },
  rest2: {
    ...REST_COMMON,
    weeklyCheck:
      "If two or more red flags appear (performance dip, nagging joints, poor sleep), schedule a 1-week pivot next week (halve sets, keep loads similar), then resume normal training.",
  },
};

export interface ChangelogEntry {
  version: string;
  changes: readonly string[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: "1.1.1",
    changes: [
      "Changed Lat Pullover (D15 & D31) rep range from 15 - 20 to 12 - 15.",
      "Changed Incline Pushups (D34) reps from 15 - 20 to 10 - 20.",
    ],
  },
  {
    version: "1.1.0",
    changes: [
      "Introduced the Blank Fillout sheet version of the PANDR-5 model.",
      "Introduced semantic versioning update numbering system (i.e. v#.#.#).",
      "Replaced sissy squats (previously D24) with Dumbbell Heel-Elevated Squat (now D23). Replaced due to not being able to conveniently load with weight for double progression scheme.",
      "Leg extensions (previously D23) moved to after Dumbbell Heel-Elevated Squat (now D23).",
    ],
  },
];
