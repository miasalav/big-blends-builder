import { CamelotKey, getCamelotNumber, getCamelotLetter } from './camelot';

export type KeyStrictness = 'Strict' | 'Normal' | 'Creative';
export type KeyRelation = 'same' | 'adjacent' | 'relative' | 'energy+2' | 'other';
export type BpmMode = 'direct' | 'half' | 'double';

export interface TransitionInsight {
  fromId: string;
  toId: string;
  keyRelation: KeyRelation;
  bpmDelta: number;
  bpmMode: BpmMode;
  keyScore: number;
  bpmScore: number;
  totalScore: number;
  explanation: string;
}

export interface ScoringParams {
  keyWeight: number; // 0..1, default 0.65
  bpmTolerance: number; // 1..12, default 6
  halfDoubleEnabled: boolean;
  strictness: KeyStrictness;
}

export const DEFAULT_SCORING: ScoringParams = {
  keyWeight: 0.65,
  bpmTolerance: 6,
  halfDoubleEnabled: true,
  strictness: 'Normal',
};

export function computeKeyScore(
  from: CamelotKey,
  to: CamelotKey,
  strictness: KeyStrictness
): { score: number; relation: KeyRelation } {
  const fn = getCamelotNumber(from);
  const tn = getCamelotNumber(to);
  const fl = getCamelotLetter(from);
  const tl = getCamelotLetter(to);

  const numDiff = Math.abs(fn - tn);
  const wrappedDiff = Math.min(numDiff, 12 - numDiff);

  if (fn === tn && fl === tl) {
    return { score: 1.0, relation: 'same' };
  }
  if (wrappedDiff === 1 && fl === tl) {
    return { score: 0.9, relation: 'adjacent' };
  }
  if (fn === tn && fl !== tl) {
    return { score: 0.85, relation: 'relative' };
  }
  if (wrappedDiff === 2 && fl === tl && strictness === 'Creative') {
    return { score: 0.7, relation: 'energy+2' };
  }

  const score = strictness === 'Strict' ? 0.0 : 0.2;
  return { score, relation: 'other' };
}

const DEFAULT_BPM_THRESHOLDS = [
  { delta: 1, score: 1.0 },
  { delta: 3, score: 0.85 },
  { delta: 6, score: 0.65 },
  { delta: 10, score: 0.35 },
];

function bpmScoreFromDelta(delta: number, tolerance: number): number {
  // Scale thresholds by tolerance/6 ratio
  const scale = tolerance / 6;
  const scaled = DEFAULT_BPM_THRESHOLDS.map(t => ({ delta: t.delta * scale, score: t.score }));
  for (const t of scaled) {
    if (delta <= t.delta) return t.score;
  }
  return 0.1;
}

export function computeBpmScore(
  bpm1: number,
  bpm2: number,
  params: ScoringParams
): { score: number; delta: number; mode: BpmMode } {
  const candidates: { delta: number; mode: BpmMode }[] = [
    { delta: Math.abs(bpm1 - bpm2), mode: 'direct' },
  ];
  if (params.halfDoubleEnabled) {
    candidates.push({ delta: Math.abs(bpm1 - bpm2 / 2), mode: 'half' });
    candidates.push({ delta: Math.abs(bpm1 - bpm2 * 2), mode: 'double' });
  }
  candidates.sort((a, b) => a.delta - b.delta);
  const best = candidates[0];
  return {
    score: bpmScoreFromDelta(best.delta, params.bpmTolerance),
    delta: best.delta,
    mode: best.mode,
  };
}

export function scoreTransition(
  fromId: string,
  toId: string,
  fromCamelot: CamelotKey,
  toCamelot: CamelotKey,
  fromBpm: number,
  toBpm: number,
  params: ScoringParams
): TransitionInsight {
  const { score: keyScore, relation: keyRelation } = computeKeyScore(fromCamelot, toCamelot, params.strictness);
  const { score: bpmScore, delta: bpmDelta, mode: bpmMode } = computeBpmScore(fromBpm, toBpm, params);
  const totalScore = params.keyWeight * keyScore + (1 - params.keyWeight) * bpmScore;

  const bpmModeStr = bpmMode === 'direct' ? '' : ` ${bpmMode}-time`;
  const explanation = `Key: ${keyRelation} (${fromCamelot}→${toCamelot}), BPM${bpmModeStr} Δ=${bpmDelta.toFixed(1)}`;

  return { fromId, toId, keyRelation, bpmDelta, bpmMode, keyScore, bpmScore, totalScore, explanation };
}
