'use client';
import React from 'react';
import { ScoringParams, KeyStrictness } from '@/lib/scoring';

interface Props {
  params: ScoringParams;
  onChange: (p: ScoringParams) => void;
}

export default function ControlsPanel({ params, onChange }: Props) {
  const set = (update: Partial<ScoringParams>) => onChange({ ...params, ...update });

  return (
    <div className="bg-[#16161a] border border-[#2a2a32] rounded-lg p-4 space-y-4">
      <h3 className="text-xs font-mono uppercase tracking-widest text-[#666680]">Mixing Controls</h3>

      {/* Key Strictness */}
      <div>
        <label className="text-xs font-mono text-[#888899] mb-2 block">Key Strictness</label>
        <div className="flex gap-2">
          {(['Strict', 'Normal', 'Creative'] as KeyStrictness[]).map(s => (
            <button
              key={s}
              onClick={() => set({ strictness: s })}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all border ${
                params.strictness === s
                  ? 'bg-[#00e5ff15] border-[#00e5ff] text-[#00e5ff]'
                  : 'border-[#2a2a32] text-[#666680] hover:border-[#444460]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Key/BPM Weight */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs font-mono text-[#888899]">Key Weight</label>
          <span className="text-xs font-mono text-[#00e5ff]">{Math.round(params.keyWeight * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#555570]">BPM</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={params.keyWeight}
            onChange={e => set({ keyWeight: parseFloat(e.target.value) })}
            className="flex-1 accent-[#00e5ff]"
          />
          <span className="text-[10px] text-[#555570]">KEY</span>
        </div>
      </div>

      {/* BPM Tolerance */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs font-mono text-[#888899]">BPM Tolerance</label>
          <span className="text-xs font-mono text-[#00e5ff]">±{params.bpmTolerance}</span>
        </div>
        <input
          type="range" min={1} max={12} step={1}
          value={params.bpmTolerance}
          onChange={e => set({ bpmTolerance: parseInt(e.target.value) })}
          className="w-full accent-[#00e5ff]"
        />
      </div>

      {/* Half/Double Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-[#888899]">Half/Double Time</label>
        <button
          onClick={() => set({ halfDoubleEnabled: !params.halfDoubleEnabled })}
          className={`relative inline-flex h-5 w-10 rounded-full transition-colors ${
            params.halfDoubleEnabled ? 'bg-[#00e5ff]' : 'bg-[#2a2a32]'
          }`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
            params.halfDoubleEnabled ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
    </div>
  );
}
