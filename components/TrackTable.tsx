'use client';
import React, { useState, useMemo } from 'react';
import { Track } from '@/lib/xmlParser';

interface Props {
  tracks: Track[];
}

type SortKey = 'title' | 'artist' | 'bpm' | 'camelot';

const PAGE_SIZE = 50;

function CamelotBadge({ camelot }: { camelot: string | null }) {
  if (!camelot) return <span className="text-[#444460] text-xs">—</span>;
  const isMinor = camelot.endsWith('A');
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
      isMinor ? 'bg-[#00e5ff18] text-[#00e5ff] border border-[#00e5ff30]'
               : 'bg-[#ff3d6b18] text-[#ff3d6b] border border-[#ff3d6b30]'
    }`}>
      {camelot}
    </span>
  );
}

export default function TrackTable({ tracks }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tracks.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [tracks, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortKey === 'title') { av = a.title; bv = b.title; }
      else if (sortKey === 'artist') { av = a.artist; bv = b.artist; }
      else if (sortKey === 'bpm') { av = a.bpm ?? 0; bv = b.bpm ?? 0; }
      else if (sortKey === 'camelot') { av = a.camelot ?? ''; bv = b.camelot ?? ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)}
      className={`text-left text-xs font-mono uppercase tracking-wider transition-colors ${
        sortKey === k ? 'text-[#00e5ff]' : 'text-[#555570] hover:text-[#888899]'
      }`}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        placeholder="Search title or artist…"
        className="w-full bg-[#0d0d0f] border border-[#2a2a32] rounded px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#444460] focus:outline-none focus:border-[#00e5ff60]"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a32]">
              <th className="pb-2 pr-4 text-left"><SortBtn k="title" label="Title" /></th>
              <th className="pb-2 pr-4 text-left"><SortBtn k="artist" label="Artist" /></th>
              <th className="pb-2 pr-4 text-left"><SortBtn k="bpm" label="BPM" /></th>
              <th className="pb-2 pr-4 text-left"><SortBtn k="camelot" label="Key" /></th>
              <th className="pb-2 text-left"><span className="text-xs font-mono text-[#555570]">Status</span></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(track => (
              <tr key={track.id} className="border-b border-[#1e1e24] hover:bg-[#1e1e24] transition-colors">
                <td className="py-2 pr-4 text-[#e8e8f0] max-w-[200px] truncate">{track.title}</td>
                <td className="py-2 pr-4 text-[#888899] max-w-[150px] truncate">{track.artist}</td>
                <td className="py-2 pr-4 font-mono text-[#888899]">
                  {track.bpm ? track.bpm.toFixed(1) : <span className="text-[#ff3d6b] text-xs">—</span>}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1">
                    <CamelotBadge camelot={track.camelot} />
                    {track.prettyKey && track.camelot && (
                      <span className="text-[10px] text-[#555570]">{track.prettyKey}</span>
                    )}
                  </div>
                </td>
                <td className="py-2">
                  {!track.isComplete && (
                    <div className="flex gap-1">
                      {!track.bpm && <span className="text-[10px] px-1 py-0.5 bg-[#ff3d6b18] text-[#ff3d6b] border border-[#ff3d6b30] rounded">NO BPM</span>}
                      {!track.camelot && <span className="text-[10px] px-1 py-0.5 bg-[#ff3d6b18] text-[#ff3d6b] border border-[#ff3d6b30] rounded">NO KEY</span>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#555570] font-mono">{sorted.length} tracks</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs font-mono border border-[#2a2a32] rounded disabled:opacity-30 hover:border-[#444460] transition-colors">
              ← Prev
            </button>
            <span className="px-3 py-1 text-xs font-mono text-[#666680]">{page + 1} / {totalPages}</span>
            <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs font-mono border border-[#2a2a32] rounded disabled:opacity-30 hover:border-[#444460] transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
