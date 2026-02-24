// Authoritative Camelot <-> Musical Key mapping

export type CamelotKey = string; // e.g. "8A", "9B"

export interface KeyInfo {
  tonic: string;
  mode: 'MAJOR' | 'MINOR';
  pretty: string;
  synonyms: string[];
}

export const camelotToKey: Map<CamelotKey, KeyInfo> = new Map([
  // MINOR (A wheel)
  ['1A',  { tonic: 'G#', mode: 'MINOR', pretty: 'G#m / Abm', synonyms: ['G# MINOR', 'AB MINOR'] }],
  ['2A',  { tonic: 'D#', mode: 'MINOR', pretty: 'D#m / Ebm', synonyms: ['D# MINOR', 'EB MINOR'] }],
  ['3A',  { tonic: 'A#', mode: 'MINOR', pretty: 'A#m / Bbm', synonyms: ['A# MINOR', 'BB MINOR'] }],
  ['4A',  { tonic: 'F',  mode: 'MINOR', pretty: 'Fm',        synonyms: ['F MINOR'] }],
  ['5A',  { tonic: 'C',  mode: 'MINOR', pretty: 'Cm',        synonyms: ['C MINOR'] }],
  ['6A',  { tonic: 'G',  mode: 'MINOR', pretty: 'Gm',        synonyms: ['G MINOR'] }],
  ['7A',  { tonic: 'D',  mode: 'MINOR', pretty: 'Dm',        synonyms: ['D MINOR'] }],
  ['8A',  { tonic: 'A',  mode: 'MINOR', pretty: 'Am',        synonyms: ['A MINOR'] }],
  ['9A',  { tonic: 'E',  mode: 'MINOR', pretty: 'Em',        synonyms: ['E MINOR'] }],
  ['10A', { tonic: 'B',  mode: 'MINOR', pretty: 'Bm',        synonyms: ['B MINOR'] }],
  ['11A', { tonic: 'F#', mode: 'MINOR', pretty: 'F#m / Gbm', synonyms: ['F# MINOR', 'GB MINOR'] }],
  ['12A', { tonic: 'C#', mode: 'MINOR', pretty: 'C#m / Dbm', synonyms: ['C# MINOR', 'DB MINOR'] }],
  // MAJOR (B wheel)
  ['1B',  { tonic: 'B',  mode: 'MAJOR', pretty: 'B',         synonyms: ['B MAJOR'] }],
  ['2B',  { tonic: 'F#', mode: 'MAJOR', pretty: 'F# / Gb',   synonyms: ['F# MAJOR', 'GB MAJOR'] }],
  ['3B',  { tonic: 'C#', mode: 'MAJOR', pretty: 'C# / Db',   synonyms: ['C# MAJOR', 'DB MAJOR'] }],
  ['4B',  { tonic: 'G#', mode: 'MAJOR', pretty: 'G# / Ab',   synonyms: ['G# MAJOR', 'AB MAJOR'] }],
  ['5B',  { tonic: 'D#', mode: 'MAJOR', pretty: 'D# / Eb',   synonyms: ['D# MAJOR', 'EB MAJOR'] }],
  ['6B',  { tonic: 'A#', mode: 'MAJOR', pretty: 'A# / Bb',   synonyms: ['A# MAJOR', 'BB MAJOR'] }],
  ['7B',  { tonic: 'F',  mode: 'MAJOR', pretty: 'F',         synonyms: ['F MAJOR'] }],
  ['8B',  { tonic: 'C',  mode: 'MAJOR', pretty: 'C',         synonyms: ['C MAJOR'] }],
  ['9B',  { tonic: 'G',  mode: 'MAJOR', pretty: 'G',         synonyms: ['G MAJOR'] }],
  ['10B', { tonic: 'D',  mode: 'MAJOR', pretty: 'D',         synonyms: ['D MAJOR'] }],
  ['11B', { tonic: 'A',  mode: 'MAJOR', pretty: 'A',         synonyms: ['A MAJOR'] }],
  ['12B', { tonic: 'E',  mode: 'MAJOR', pretty: 'E',         synonyms: ['E MAJOR'] }],
]);

// Build reverse map: canonicalKeyString -> Camelot
export const keyToCamelot: Map<string, CamelotKey> = new Map();
for (const [camelot, info] of camelotToKey.entries()) {
  for (const syn of info.synonyms) {
    keyToCamelot.set(syn, camelot);
  }
}

export function getCamelotNumber(camelot: CamelotKey): number {
  return parseInt(camelot.replace(/[AB]/i, ''), 10);
}

export function getCamelotLetter(camelot: CamelotKey): string {
  return camelot.slice(-1).toUpperCase();
}

export function camelotDistance(a: CamelotKey, b: CamelotKey): { numDiff: number; sameLetter: boolean } {
  const na = getCamelotNumber(a);
  const nb = getCamelotNumber(b);
  const la = getCamelotLetter(a);
  const lb = getCamelotLetter(b);
  const diff = Math.abs(na - nb);
  const numDiff = Math.min(diff, 12 - diff);
  return { numDiff, sameLetter: la === lb };
}
