'use client';
import React, { useMemo, useState } from 'react';
import { Track } from '@/lib/xmlParser';
import { ScoringParams, KeyStrictness } from '@/lib/scoring';
import { CamelotKey, getCamelotNumber, getCamelotLetter } from '@/lib/camelot';

interface Props {
  tracks: Track[];
  params: ScoringParams;
}

interface Group {
  label: string;
  camelots: string[];
  bpmRange: [number, number];
  tracks: Track[];
}

function getNeighbors(camelot: CamelotKey, strictness: KeyStrictness): string[] {
  const n = getCamelotNumber(camelot);
  const l = getCamelotLetter(camelot);
  const wrap = (x: number) => ((x - 1 + 12) % 12) + 1;
  const neighbors: string[] = [camelot];
  neighbors.push(`${wrap(n - 1)}${l}`, `${wrap(n + 1)}${l}`); // adjacent
  neighbors.push(`${n}${l === 'A' ? 'B' : 'A'}`); // relative
  if (strictness === 'Creative') {
    neighbors.push(`${wrap(n - 2)}${l}`, `${wrap(n + 2)}${l}`); // energy±2
  }
  return [...new Set(neighbors)];
}

export default function MixableGroups({ tracks, params }: Props) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const groups = useMemo((): Group[] => {
    const complete = tracks.filter(t => t.isComplete);
    const BPM_BAND = 4;

    // Collect all unique BPM bands
    const bpmBands = new Set<number>();
    for (const t of complete) {
      bpmBands.add(Math.floor(t.bpm! / BPM_BAND) * BPM_BAND);
    }

    // Collect all unique Camelot keys
    const allCamelots = [...new Set(complete.map(t => t.camelot!))];

    const result: Group[] = [];
    const seen = new Set<string>();

    for (const band of Array.from(bpmBands).sort((a, b) => a - b)) {
      const bandTracks = complete.filter(t => Math.floor(t.bpm! / BPM_BAND) * BPM_BAND === band);
      if (bandTracks.length === 0) continue;

      for (const camelot of allCamelots) {
        const neighbors = getNeighbors(camelot as CamelotKey, params.strictness);
        const groupTracks = bandTracks.filter(t => neighbors.includes(t.camelot!));
        if (groupTracks.length < 2) continue;

        // Deduplicate groups by their track sets
        const trackKey = groupTracks.map(t => t.id).sort().join(',');
        if (seen.has(trackKey)) continue;
        seen.add(trackKey);

        const bpmMin = Math.min(...groupTracks.map(t => t.bpm!));
        const bpmMax = Math.max(...groupTracks.map(t => t.bpm!));

        const neighborKeys = neighbors.filter(n => allCamelots.includes(n));
        result.push({
          label: `${neighborKeys.slice(0, 3).join('/')} @ ${Math.round(bpmMin)}–${Math.round(bpmMax)}`,
          camelots: neighborKeys,
          bpmRange: [bpmMin, bpmMax],
          tracks: groupTracks,
        });
      }
    }

    return result.sort((a, b) => b.tracks.length - a.tracks.length);
  }, [tracks, params.strictness]);

  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-[#444460] text-sm">No mixable groups found. Try loading tracks first.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#555570] font-mono">{groups.length} groups found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map(group => {
              const isExpanded = expandedGroup === group.label;
              return (
                <div key={group.label} className="bg-[#16161a] border border-[#2a2a32] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#1e1e24] transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-mono text-[#e8e8f0]">{group.label}</p>
                      <div className="flex gap-1 mt-1">
                        {group.camelots.map(c => (
                          <span key={c} className={`text-[10px] font-mono font-bold px-1 rounded ${
                            c.endsWith('A') ? 'text-[#00e5ff] bg-[#00e5ff10]' : 'text-[#ff3d6b] bg-[#ff3d6b10]'
                          }`}>{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold text-[#00e5ff]">{group.tracks.length}</span>
                      <span className="text-[#444460] text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#2a2a32] p-3 space-y-1">
                      {group.tracks.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-1">
                          <div className="min-w-0">
                            <p className="text-xs text-[#e8e8f0] truncate">{t.title}</p>
                            <p className="text-[10px] text-[#555570] truncate">{t.artist}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-[#555570]">{t.bpm?.toFixed(0)}</span>
                            <span className={`text-[10px] font-mono font-bold px-1 rounded ${
                              t.camelot?.endsWith('A') ? 'text-[#00e5ff]' : 'text-[#ff3d6b]'
                            }`}>{t.camelot}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
