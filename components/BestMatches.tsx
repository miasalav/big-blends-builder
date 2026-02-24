'use client';
import React, { useState, useMemo } from 'react';
import { Track } from '@/lib/xmlParser';
import { ScoringParams, scoreTransition, TransitionInsight } from '@/lib/scoring';
import { CamelotKey } from '@/lib/camelot';

interface Props {
  tracks: Track[];
  params: ScoringParams;
}

const matchCache = new Map<string, TransitionInsight[]>();

function getMatches(track: Track, allTracks: Track[], params: ScoringParams): TransitionInsight[] {
  const cacheKey = `${track.id}|${params.keyWeight}|${params.bpmTolerance}|${params.halfDoubleEnabled}|${params.strictness}`;
  if (matchCache.has(cacheKey)) return matchCache.get(cacheKey)!;

  const others = allTracks.filter(t => t.id !== track.id && t.isComplete);
  const scored = others.map(t => scoreTransition(
    track.id, t.id,
    track.camelot as CamelotKey, t.camelot as CamelotKey,
    track.bpm!, t.bpm!,
    params
  ));
  scored.sort((a, b) => b.totalScore - a.totalScore);
  const top10 = scored.slice(0, 10);
  matchCache.set(cacheKey, top10);
  return top10;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 0.8 ? '#00e5ff' : score >= 0.5 ? '#ffb800' : '#ff3d6b';
  return (
    <span className="font-mono text-xs font-bold" style={{ color }}>
      {(score * 100).toFixed(0)}
    </span>
  );
}

function RelBadge({ rel }: { rel: string }) {
  const colors: Record<string, string> = {
    same: 'text-[#00e5ff] border-[#00e5ff30] bg-[#00e5ff10]',
    adjacent: 'text-[#00ff88] border-[#00ff8830] bg-[#00ff8810]',
    relative: 'text-[#ffb800] border-[#ffb80030] bg-[#ffb80010]',
    'energy+2': 'text-[#ff8800] border-[#ff880030] bg-[#ff880010]',
    other: 'text-[#666680] border-[#2a2a32] bg-transparent',
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors[rel] ?? colors.other}`}>
      {rel}
    </span>
  );
}

export default function BestMatches({ tracks, params }: Props) {
  const completeTracks = useMemo(() => tracks.filter(t => t.isComplete), [tracks]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredTracks = useMemo(() => {
    const q = search.toLowerCase();
    return completeTracks.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [completeTracks, search]);

  const trackMap = useMemo(() => new Map(tracks.map(t => [t.id, t])), [tracks]);

  const selected = selectedId ? trackMap.get(selectedId) : null;
  const matches = useMemo(() => {
    if (!selected || !selected.isComplete) return [];
    return getMatches(selected, completeTracks, params);
  }, [selected, completeTracks, params]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Track selector */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tracks…"
          className="w-full bg-[#0d0d0f] border border-[#2a2a32] rounded px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#444460] focus:outline-none focus:border-[#00e5ff60]"
        />
        <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
          {filteredTracks.map(track => (
            <button
              key={track.id}
              onClick={() => setSelectedId(track.id)}
              className={`w-full text-left px-3 py-2 rounded border transition-all ${
                selectedId === track.id
                  ? 'border-[#00e5ff] bg-[#00e5ff0a]'
                  : 'border-[#2a2a32] hover:border-[#444460] hover:bg-[#1e1e24]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-[#e8e8f0] truncate">{track.title}</p>
                  <p className="text-xs text-[#666680] truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#555570]">{track.bpm?.toFixed(0)}</span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                    track.camelot?.endsWith('A')
                      ? 'text-[#00e5ff] border-[#00e5ff30] bg-[#00e5ff10]'
                      : 'text-[#ff3d6b] border-[#ff3d6b30] bg-[#ff3d6b10]'
                  }`}>{track.camelot}</span>
                </div>
              </div>
            </button>
          ))}
          {filteredTracks.length === 0 && (
            <p className="text-center text-[#444460] text-sm py-8">No complete tracks found</p>
          )}
        </div>
      </div>

      {/* Matches panel */}
      <div>
        {selected ? (
          <div className="space-y-3">
            <div className="bg-[#0d0d0f] border border-[#00e5ff30] rounded-lg p-3">
              <p className="text-xs font-mono text-[#00e5ff] uppercase tracking-wider mb-1">Selected Track</p>
              <p className="text-sm text-[#e8e8f0] font-medium">{selected.title}</p>
              <p className="text-xs text-[#666680]">{selected.artist} · {selected.bpm?.toFixed(1)} BPM · {selected.camelot} ({selected.prettyKey})</p>
            </div>
            <div className="space-y-2">
              {matches.map((m, i) => {
                const t = trackMap.get(m.toId);
                if (!t) return null;
                return (
                  <div key={m.toId} className="flex items-center gap-3 bg-[#16161a] border border-[#2a2a32] rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-[#444460] w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8e8f0] truncate">{t.title}</p>
                      <p className="text-xs text-[#666680] truncate">{t.artist} · {t.bpm?.toFixed(1)} BPM · {t.camelot}</p>
                      <p className="text-[10px] text-[#555570] mt-0.5">{m.explanation}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <ScoreBadge score={m.totalScore} />
                      <RelBadge rel={m.keyRelation} />
                    </div>
                  </div>
                );
              })}
              {matches.length === 0 && (
                <p className="text-center text-[#444460] text-sm py-8">No compatible tracks found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 border border-dashed border-[#2a2a32] rounded-lg">
            <p className="text-[#444460] text-sm">← Select a track to see best matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
