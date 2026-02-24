import { Track } from './xmlParser';
import { scoreTransition, ScoringParams, TransitionInsight } from './scoring';
import { CamelotKey } from './camelot';

export interface SetVariant {
  label: string;
  tracks: Track[];
  transitions: TransitionInsight[];
  totalScore: number;
}

const scoreCache = new Map<string, TransitionInsight>();

export function getCachedScore(
  from: Track,
  to: Track,
  params: ScoringParams
): TransitionInsight {
  const key = `${from.id}|${to.id}`;
  if (scoreCache.has(key)) return scoreCache.get(key)!;
  const insight = scoreTransition(
    from.id,
    to.id,
    from.camelot as CamelotKey,
    to.camelot as CamelotKey,
    from.bpm!,
    to.bpm!,
    params
  );
  scoreCache.set(key, insight);
  return insight;
}

export function clearScoreCache() {
  scoreCache.clear();
}

function greedyOrder(
  tracks: Track[],
  startIdx: number,
  alpha: number,
  params: ScoringParams
): SetVariant {
  const remaining = [...tracks];
  const ordered: Track[] = [remaining.splice(startIdx, 1)[0]];
  const transitions: TransitionInsight[] = [];

  while (remaining.length > 0) {
    const curr = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestVal = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const s = getCachedScore(curr, remaining[i], params);
      let future = 0;
      if (remaining.length > 1) {
        // 1-step lookahead
        let maxFuture = 0;
        const sampleSize = Math.min(remaining.length, 20);
        for (let j = 0; j < sampleSize; j++) {
          if (j === i) continue;
          const fs = getCachedScore(remaining[i], remaining[j], params);
          if (fs.totalScore > maxFuture) maxFuture = fs.totalScore;
        }
        future = maxFuture;
      }
      const val = s.totalScore + alpha * future;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    transitions.push(getCachedScore(curr, next, params));
    ordered.push(next);
  }

  const totalScore = transitions.reduce((sum, t) => sum + t.totalScore, 0) /
    Math.max(transitions.length, 1);

  return { label: '', tracks: ordered, transitions, totalScore };
}

function findBestSeedIndex(tracks: Track[], params: ScoringParams): number {
  if (tracks.length <= 3) return 0;
  const sample = Math.min(tracks.length, 50);
  let bestScore = -Infinity;
  let bestIdx = 0;
  for (let i = 0; i < tracks.length; i++) {
    let avg = 0;
    const sampleTracks = tracks.slice(0, sample).filter((_, j) => j !== i);
    for (const t of sampleTracks) {
      avg += getCachedScore(tracks[i], t, params).totalScore;
    }
    avg /= sampleTracks.length;
    if (avg > bestScore) { bestScore = avg; bestIdx = i; }
  }
  return bestIdx;
}

export function generateSetVariants(tracks: Track[], params: ScoringParams): SetVariant[] {
  const complete = tracks.filter(t => t.isComplete);
  if (complete.length < 2) return [];

  const seed = findBestSeedIndex(complete, params);

  const alphas = [0.25, 0.35, 0.45];
  const labels = ['Conservative Flow', 'Balanced Flow', 'Adventurous Flow'];

  return alphas.map((alpha, i) => {
    const v = greedyOrder(complete, seed, alpha, params);
    v.label = labels[i];
    return v;
  });
}
