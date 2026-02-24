'use client';
import React, { useState, useMemo } from 'react';
import { Track } from '@/lib/xmlParser';
import { ScoringParams } from '@/lib/scoring';
import { generateSetVariants, SetVariant } from '@/lib/ordering';

interface Props {
  tracks: Track[];
  params: ScoringParams;
}

function exportCSV(variant: SetVariant) {
  const rows = [['Title', 'Artist', 'BPM', 'Camelot', 'OriginalKey']];
  for (const t of variant.tracks) {
    rows.push([
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.artist.replace(/"/g, '""')}"`,
      t.bpm?.toFixed(1) ?? '',
      t.camelot ?? '',
      t.rawKey ?? '',
    ]);
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${variant.label.replace(/ /g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportM3U(variant: SetVariant) {
  const lines = ['#EXTM3U'];
  for (const t of variant.tracks) {
    lines.push(`#EXTINF:${Math.round((t.bpm ?? 0) * 60)},${t.artist} - ${t.title}`);
    lines.push(`${t.title}.mp3`);
  }
  const blob = new Blob([lines.join('\n')], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${variant.label.replace(/ /g, '_')}.m3u`;
  a.click();
  URL.revokeObjectURL(url);
}

const relationColors: Record<string, string> = {
  same: '#00e5ff',
  adjacent: '#00ff88',
  relative: '#ffb800',
  'energy+2': '#ff8800',
  other: '#444460',
};

export default function BestSetOrder({ tracks, params }: Props) {
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<SetVariant[] | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const v = generateSetVariants(tracks, params);
      setVariants(v);
      setGenerating(false);
    }, 10);
  };

  const current = variants?.[activeVariant];

  return (
    <div className="space-y-4">
      {!variants ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-[#666680] text-sm">Generate an optimized set order from your complete tracks.</p>
          <button
            onClick={generate}
            disabled={generating}
            className="px-6 py-3 bg-[#00e5ff15] border border-[#00e5ff] text-[#00e5ff] font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-[#00e5ff25] transition-all disabled:opacity-50"
          >
            {generating ? 'Calculating…' : '⚡ Generate Set Order'}
          </button>
        </div>
      ) : (
        <>
          {/* Variant tabs */}
          <div className="flex gap-2">
            {variants.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVariant(i)}
                className={`flex-1 py-2 px-3 text-xs font-mono uppercase tracking-wider rounded border transition-all ${
                  activeVariant === i
                    ? 'border-[#00e5ff] bg-[#00e5ff10] text-[#00e5ff]'
                    : 'border-[#2a2a32] text-[#666680] hover:border-[#444460]'
                }`}
              >
                <div>{v.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">Score: {(v.totalScore * 100).toFixed(0)}</div>
              </button>
            ))}
          </div>

          {/* Export buttons */}
          {current && (
            <div className="flex gap-2">
              <button onClick={() => exportCSV(current)}
                className="px-3 py-1.5 text-xs font-mono border border-[#2a2a32] text-[#888899] hover:border-[#00e5ff60] hover:text-[#00e5ff] rounded transition-all">
                ↓ Export CSV
              </button>
              <button onClick={() => exportM3U(current)}
                className="px-3 py-1.5 text-xs font-mono border border-[#2a2a32] text-[#888899] hover:border-[#00e5ff60] hover:text-[#00e5ff] rounded transition-all">
                ↓ Export M3U
              </button>
              <button onClick={generate}
                className="px-3 py-1.5 text-xs font-mono border border-[#2a2a32] text-[#555570] hover:border-[#444460] rounded transition-all ml-auto">
                ↺ Regenerate
              </button>
            </div>
          )}

          {/* Track list */}
          {current && (
            <div className="space-y-1">
              {current.tracks.map((track, i) => {
                const transition = i > 0 ? current.transitions[i - 1] : null;
                const isExpanded = expandedIdx === i;
                return (
                  <div key={track.id}>
                    {transition && (
                      <div className="flex items-center gap-2 py-1 px-3">
                        <div className="h-px flex-1 bg-[#1e1e24]" />
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{
                            color: relationColors[transition.keyRelation],
                            background: `${relationColors[transition.keyRelation]}15`,
                            border: `1px solid ${relationColors[transition.keyRelation]}30`,
                          }}
                        >
                          {transition.keyRelation} · Δ{transition.bpmDelta.toFixed(1)} · {(transition.totalScore * 100).toFixed(0)}
                        </span>
                        <div className="h-px flex-1 bg-[#1e1e24]" />
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedIdx(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 bg-[#16161a] border border-[#2a2a32] rounded-lg px-3 py-2 hover:border-[#444460] transition-all text-left"
                    >
                      <span className="text-xs font-mono text-[#444460] w-6 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
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
                    </button>
                    {isExpanded && transition && (
                      <div className="ml-9 mt-1 mb-1 px-3 py-2 bg-[#0d0d0f] border border-[#2a2a32] rounded text-xs text-[#666680] font-mono">
                        {transition.explanation} · Key: {(transition.keyScore * 100).toFixed(0)} · BPM: {(transition.bpmScore * 100).toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
