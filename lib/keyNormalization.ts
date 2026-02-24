import { keyToCamelot, CamelotKey } from './camelot';

export interface NormalizedKey {
  canonicalKey: string;
  camelot: CamelotKey | null;
  prettyKey: string;
}

const ENHARMONICS: Record<string, string> = {
  'DB': 'C#',
  'EB': 'D#',
  'GB': 'F#',
  'AB': 'G#',
  'BB': 'A#',
};

export function normalizeKey(raw: string | null | undefined): NormalizedKey {
  if (!raw || raw.trim() === '' || raw === 'NA' || raw === 'None') {
    return { canonicalKey: '', camelot: null, prettyKey: '' };
  }

  let s = raw.trim();

  // Check if already Camelot
  if (/^(1[0-2]|[1-9])[AB]$/i.test(s)) {
    const camelot = s.toUpperCase() as CamelotKey;
    return { canonicalKey: camelot, camelot, prettyKey: camelot };
  }

  // Replace unicode accidentals
  s = s.replace(/♭/g, 'b').replace(/♯/g, '#');

  const upper = s.toUpperCase();

  // Determine mode
  let mode: 'MAJOR' | 'MINOR' = 'MAJOR';
  if (/MINOR|MIN\b/.test(upper)) {
    mode = 'MINOR';
  } else if (/MAJOR|MAJ\b/.test(upper)) {
    mode = 'MAJOR';
  } else {
    // Check trailing M for minor (e.g. Am, C#m)
    // Strip any mode words and look at the bare token
    const stripped = s.replace(/\s*(major|maj|minor|min)\s*/gi, '').trim();
    if (/^[A-G][#b]?[Mm]$/.test(stripped) && !stripped.toUpperCase().endsWith('MA')) {
      mode = 'MINOR';
    }
  }

  // Extract tonic: first character A-G plus optional # or b
  const tonicMatch = s.match(/^([A-Ga-g][#b]?)/);
  if (!tonicMatch) {
    return { canonicalKey: '', camelot: null, prettyKey: raw };
  }

  let tonic = tonicMatch[1].toUpperCase();

  // Enharmonic canonicalization (flats -> sharps)
  if (ENHARMONICS[tonic]) {
    tonic = ENHARMONICS[tonic];
  }

  const canonicalKey = `${tonic} ${mode}`;
  const camelot = keyToCamelot.get(canonicalKey) ?? null;

  const prettyKey = `${tonic}${mode === 'MINOR' ? 'm' : ''}`;

  return { canonicalKey, camelot, prettyKey };
}
