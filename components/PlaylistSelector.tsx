'use client';
import React, { useState } from 'react';
import { PlaylistNode, Track, resolvePlaylistTracks } from '@/lib/xmlParser';

interface Props {
  playlists: PlaylistNode[];
  trackById: Map<string, Track>;
  totalCollectionCount: number;
  onSelect: (tracks: Track[], label: string) => void;
}

function countTracksInNode(node: PlaylistNode, trackById: Map<string, Track>): number {
  if (node.type === 'playlist') {
    return node.trackIds.filter(id => trackById.has(id)).length;
  }
  return node.children.reduce((sum, c) => sum + countTracksInNode(c, trackById), 0);
}

function PlaylistTreeNode({
  node,
  trackById,
  depth,
  onSelect,
}: {
  node: PlaylistNode;
  trackById: Map<string, Track>;
  depth: number;
  onSelect: (tracks: Track[], label: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const count = countTracksInNode(node, trackById);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#1e1e24] rounded transition-colors text-left group"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="text-[#555570] text-xs transition-transform" style={{ transform: open ? 'rotate(90deg)' : undefined }}>▶</span>
          <svg className="w-3.5 h-3.5 text-[#ffb800] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm text-[#c8c8d8] flex-1 truncate">{node.name}</span>
          <span className="text-[10px] font-mono text-[#444460] shrink-0 mr-1">{count}</span>
        </button>
        {open && (
          <div>
            {node.children.map(child => (
              <PlaylistTreeNode
                key={child.id}
                node={child}
                trackById={trackById}
                depth={depth + 1}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Playlist leaf
  return (
    <button
      onClick={() => {
        const tracks = resolvePlaylistTracks(node, trackById);
        onSelect(tracks, node.name);
      }}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#00e5ff0a] hover:border-l-2 hover:border-[#00e5ff] rounded transition-all text-left group"
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      disabled={count === 0}
    >
      <svg className="w-3.5 h-3.5 text-[#00e5ff60] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <span className={`text-sm flex-1 truncate transition-colors ${count === 0 ? 'text-[#444460]' : 'text-[#e8e8f0] group-hover:text-[#00e5ff]'}`}>
        {node.name}
      </span>
      <span className={`text-[10px] font-mono shrink-0 mr-1 ${count === 0 ? 'text-[#333340]' : 'text-[#555570] group-hover:text-[#00e5ff80]'}`}>
        {count}
      </span>
    </button>
  );
}

export default function PlaylistSelector({ playlists, trackById, totalCollectionCount, onSelect }: Props) {
  return (
    <div className="bg-[#0d0d0f] border border-[#2a2a32] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2a2a32] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest text-[#e8e8f0]">Select Playlist</h2>
          <p className="text-[10px] text-[#444460] mt-0.5">{totalCollectionCount} tracks in collection</p>
        </div>
        <button
          onClick={() => onSelect(Array.from(trackById.values()), 'Full Collection')}
          className="text-xs font-mono px-3 py-1.5 border border-[#2a2a32] text-[#666680] hover:border-[#00e5ff60] hover:text-[#00e5ff] rounded transition-all"
        >
          Use Full Collection
        </button>
      </div>

      {/* Tree */}
      <div className="py-2 max-h-[480px] overflow-y-auto">
        {playlists.length === 0 ? (
          <p className="text-center text-[#444460] text-xs py-8 font-mono">No playlists found in XML</p>
        ) : (
          playlists.map(node => (
            <PlaylistTreeNode
              key={node.id}
              node={node}
              trackById={trackById}
              depth={0}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-[#1e1e24]">
        <p className="text-[10px] text-[#333344] font-mono">Click a playlist to analyze it · Greyed items have no matched tracks</p>
      </div>
    </div>
  );
}
