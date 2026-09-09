/**
 * "Research Sources" tab of the PANDR-5 sheet, v1.1.1. Transcribed verbatim.
 */
export interface Citation {
  ref: number;
  topic: string;
  evidence: string;
  citation: string;
  pmid: string;
  supports: string;
}

export const RESEARCH_NOTE =
  "Inline [n] links in the Guide Sheet and Blank Fillout open the peer-reviewed source. Evidence labels show how directly each paper supports the nearby wording; model-specific rules and extrapolations are identified plainly.";

export const RESEARCH: readonly Citation[] = [
  {
    ref: 1,
    topic: "Twice-weekly muscle frequency",
    evidence: "Direct systematic review + meta-analysis",
    citation:
      "Schoenfeld BJ, Ogborn D, Krieger JW. Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. Sports Med. 2016;46(11):1689–1697. doi:10.1007/s40279-016-0543-8.",
    pmid: "27102172",
    supports:
      "Supports training a muscle twice rather than once weekly in the reviewed volume-equated comparisons. Later evidence indicates frequency matters much less when weekly volume is equated, so this supports 2× as a sound distribution, not a uniquely optimal rule.",
  },
  {
    ref: 2,
    topic: "Frequency, load, sets, and weekly-volume context",
    evidence: "Direct systematic review + Bayesian network meta-analysis",
    citation:
      "Currier BS, Mcleod JC, Banfield L, et al. Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. Br J Sports Med. 2023;57(18):1211–1220. doi:10.1136/bjsports-2023-106807.",
    pmid: "37414459",
    supports:
      "Across 178 strength and 119 hypertrophy studies, all resistance-training prescriptions improved outcomes; multiset twice-weekly training was highest-ranked for hypertrophy. Rankings do not prove one exact split is required.",
  },
  {
    ref: 3,
    topic: "Broad rep/load ranges",
    evidence: "Direct systematic review + network meta-analysis",
    citation:
      "Lopez P, Radaelli R, Taaffe DR, et al. Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. Med Sci Sports Exerc. 2021;53(6):1206–1216. doi:10.1249/MSS.0000000000002585.",
    pmid: "33433148",
    supports:
      "Supports comparable hypertrophy across low, moderate, and high loads when sets are taken to volitional failure; heavier loads better maximize strength. A 6–10 range is compatible with this literature, but the exact range is a programming choice.",
  },
  {
    ref: 4,
    topic: "RIR / proximity-to-failure dose response",
    evidence: "Exploratory meta-regression",
    citation:
      "Robinson ZP, Pelland JC, Remmert JF, et al. Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions. Sports Med. 2024;54(9):2209–2231. doi:10.1007/s40279-024-02069-2.",
    pmid: "38970765",
    supports:
      "Closer-to-failure training was associated with greater hypertrophy, while strength gains were similar across a wider RIR range. The authors call the analysis exploratory; it supports an RIR spectrum, not the exact 3-to-<0 staircase.",
  },
  {
    ref: 5,
    topic: "Adding reps before adding load",
    evidence: "Direct randomized controlled trial",
    citation:
      "Plotkin D, Coleman M, Van Every D, et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. 2022;10:e14142. doi:10.7717/peerj.14142.",
    pmid: "36199287",
    supports:
      "In resistance-trained adults, progressing repetitions and progressing load produced broadly similar adaptations over eight weeks. This directly supports rep progression as viable; it does not validate a final-set-only anchor.",
  },
  {
    ref: 6,
    topic: "Small load increases after exceeding a rep target",
    evidence: "Peer-reviewed position stand",
    citation:
      "American College of Sports Medicine. Progression Models in Resistance Training for Healthy Adults. Med Sci Sports Exerc. 2009;41(3):687–708. doi:10.1249/MSS.0b013e3181915670.",
    pmid: "19204579",
    supports:
      "Recommends increasing load about 2–10% when the trainee can perform 1–2 repetitions over the target. PANDR-5's 2–5% increase fits inside this published range; the exact 2–3% reduction rule is a practical extrapolation.",
  },
  {
    ref: 7,
    topic: "Using RIR to prescribe and adjust load",
    evidence: "Direct reliability study",
    citation:
      "Lovegrove S, Hughes LJ, Mansfield SK, Read PJ, Price P, Patterson SD. Repetitions in Reserve Is a Reliable Tool for Prescribing Resistance Training Load. J Strength Cond Res. 2022;36(10):2696–2700. doi:10.1519/JSC.0000000000003952.",
    pmid: "36135029",
    supports:
      "Supports RIR as a reasonably reliable tool for prescribing bench-press and deadlift loads. Reliability does not make every session-to-session adjustment threshold exact.",
  },
  {
    ref: 8,
    topic: "RIR-based autoregulation and individual adjustment",
    evidence: "Systematic review + meta-analysis",
    citation:
      "Hickmott LM, Chilibeck PD, Shaw KA, Butcher SJ. The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy: A Systematic Review and Meta-Analysis. Sports Med Open. 2022;8(1):9. doi:10.1186/s40798-021-00404-9.",
    pmid: "35038063",
    supports:
      "Autoregulated and standardized load prescription produced similar strength gains overall. Supports adjusting training to present performance; the PANDR-5 decision rules remain a model-specific implementation.",
  },
  {
    ref: 9,
    topic: "Why failure / beyond-failure work is limited",
    evidence: "Direct systematic review + meta-analysis of acute fatigue",
    citation:
      "Vieira JG, Sardeli AV, Dias MR, et al. Effects of Resistance Training to Muscle Failure on Acute Fatigue: A Systematic Review and Meta-Analysis. Sports Med. 2022;52(5):1103–1125. doi:10.1007/s40279-021-01602-x.",
    pmid: "34881412",
    supports:
      "Failure training produces greater acute fatigue, muscle damage, perceived exertion, and recovery demands. Supports reserving the hardest sets. It does not directly prove that machine or isolation failure is safer than free-weight failure.",
  },
  {
    ref: 10,
    topic: "Failure versus non-failure adaptations",
    evidence: "Direct systematic review + meta-analysis",
    citation:
      "Grgic J, Schoenfeld BJ, Orazem J, Sabol F. Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis. J Sport Health Sci. 2022;11(2):202–211. doi:10.1016/j.jshs.2021.01.007.",
    pmid: "33497853",
    supports:
      "Failure was not generally required for strength or hypertrophy. Supports using non-failure work for most sets and treating failure selectively; the technical-failure distinction is a coaching/safety convention, not a directly tested outcome.",
  },
  {
    ref: 11,
    topic: "Drop sets as a beyond-failure technique",
    evidence: "Systematic review + meta-analysis",
    citation:
      "Sødal LK, Kristiansen E, Larsen S, van den Tillaar R. Effects of Drop Sets on Skeletal Muscle Hypertrophy: A Systematic Review and Meta-analysis. Sports Med Open. 2023;9(1):66. doi:10.1186/s40798-023-00620-5.",
    pmid: "37523092",
    supports:
      "Drop sets produced similar hypertrophy to traditional sets and may be time-efficient. The evidence base is small; it supports optional use, not superiority or a specific placement rule.",
  },
  {
    ref: 12,
    topic: "Past-failure partial repetitions",
    evidence: "Direct controlled trial; narrow population/exercise",
    citation:
      "Larsen S, Swinton PA, Sandberg NO, et al. Resistance training beyond momentary failure: the effects of past-failure partials on gastrocnemius muscle hypertrophy in untrained males. Front Physiol. 2025;16:1494323. doi:10.3389/fpsyg.2025.1494323.",
    pmid: "39995432",
    supports:
      "A small untrained-male calf study found greater gastrocnemius growth with past-failure lengthened partials. This is experimental, exercise-specific evidence and should not be generalized to all muscles or exercises.",
  },
  {
    ref: 13,
    topic: "Non-competing / paired-set performance",
    evidence: "Systematic review + meta-analysis",
    citation:
      "Zhang X, Weakley J, Li H, Li Z, García-Ramos A. Superset Versus Traditional Resistance Training Prescriptions: A Systematic Review and Meta-analysis Exploring Acute and Chronic Effects on Mechanical, Metabolic, and Perceptual Variables. Sports Med. 2025;55(4):953–975. doi:10.1007/s40279-025-02176-8.",
    pmid: "39903375",
    supports:
      "Supersets maintained similar repetitions and volume load overall in less time; agonist–antagonist pairings maintained volume better than same-biomechanics pairings. Chest–biceps itself was not directly compared, so that pairing is a biomechanical inference.",
  },
  {
    ref: 14,
    topic: "Chest and triceps contribution to bench pressing",
    evidence: "Systematic review of bench-press EMG",
    citation:
      "Stastny P, Golas A, Blazek D, et al. A systematic review of surface electromyography analyses of the bench press movement task. PLoS One. 2017;12(2):e0171632. doi:10.1371/journal.pone.0171632.",
    pmid: "28170449",
    supports:
      "Finds pectoralis major and triceps brachii show similarly high activity in the bench press, supporting their prime-mover/synergist overlap. EMG is evidence of activation, not a precise hypertrophy set-credit measurement.",
  },
  {
    ref: 15,
    topic: "Low biceps involvement in barbell bench pressing",
    evidence: "Direct crossover EMG study",
    citation:
      "Solstad TE, Andersen V, Shaw M, et al. A Comparison of Muscle Activation between Barbell Bench Press and Dumbbell Flyes in Resistance-Trained Males. J Sports Sci Med. 2020;19(4):645–651.",
    pmid: "33239937",
    supports:
      "Directly measured pectoralis, deltoid, triceps, and biceps activity; biceps activation was higher in flyes than barbell bench press. Supports comparatively low biceps overlap in pressing, but not zero involvement.",
  },
  {
    ref: 16,
    topic: "Fractional set allocation and diminishing returns",
    evidence: "Direct systematic review + meta-regression",
    citation:
      "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC. The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains. Sports Med. 2026;56(2):481–505. doi:10.1007/s40279-025-02344-w.",
    pmid: "41343037",
    supports:
      "Directly compared total, fractional (indirect sets counted as 0.5), and direct-only counting; fractional counting fit best. Supports set-equivalent accounting and diminishing returns, but not exact exercise-by-exercise multipliers.",
  },
  {
    ref: 17,
    topic: "Rep ranges, autonomy, and enjoyment",
    evidence: "Direct crossover study",
    citation:
      "Emanuel A, Har-Nir I, Rozen Smukas II, Halperin I. The effect of self-selecting the number of repetitions on motor performance and psychological outcomes. Psychol Res. 2021;85(6):2398–2407. doi:10.1007/s00426-020-01402-4.",
    pmid: "32778961",
    supports:
      "An 8–12 self-selected rep range produced similar performance and enjoyment to fixed reps and greater perceived autonomy. This supports flexibility and preference, not long-term adherence by itself.",
  },
  {
    ref: 18,
    topic: "Perceptual response to failure versus non-failure",
    evidence: "Direct randomized longitudinal study",
    citation:
      "Refalo MC, Helms ER, Hamilton DL, Fyfe JJ. The Effect of Proximity-To-Failure on Perceptual Responses to Resistance Training. Eur J Sport Sci. 2025;25(3):e12266. doi:10.1002/ejsc.12266.",
    pmid: "39960821",
    supports:
      "Training at 1–2 RIR produced less discomfort, lower exertion, and more positive feelings than momentary failure. This makes the sustainability rationale plausible, but long-term adherence was not directly measured.",
  },
];

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

export function getCitation(ref: number): Citation | undefined {
  return RESEARCH.find((c) => c.ref === ref);
}
