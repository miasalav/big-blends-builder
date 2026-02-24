'use client';
import React, { useState, useMemo } from 'react';
import { parseCollection, ParsedCollection, Track, SAMPLE_XML } from '@/lib/xmlParser';
import { ScoringParams, DEFAULT_SCORING } from '@/lib/scoring';
import { clearScoreCache } from '@/lib/ordering';
import UploadPanel from '@/components/UploadPanel';
import ControlsPanel from '@/components/ControlsPanel';
import PlaylistSelector from '@/components/PlaylistSelector';
import TrackTable from '@/components/TrackTable';
import BestMatches from '@/components/BestMatches';
import BestSetOrder from '@/components/BestSetOrder';
import MixableGroups from '@/components/MixableGroups';

type Stage = 'upload' | 'select-playlist' | 'analyze';
type Tab = 'tracks' | 'matches' | 'order' | 'groups';

export default function Home() {
  const [stage, setStage] = useState<Stage>('upload');
  const [collection, setCollection] = useState<ParsedCollection | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistLabel, setPlaylistLabel] = useState<string>('');
  const [params, setParams] = useState<ScoringParams>(DEFAULT_SCORING);
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const [isLoading, setIsLoading] = useState(false);

  const handleXml = (xml: string) => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const parsed = parseCollection(xml);
        setCollection(parsed);
        clearScoreCache();

        if (parsed.hasPlaylists) {
          setStage('select-playlist');
        } else {
          setTracks(parsed.allTracks);
          setPlaylistLabel('Full Collection');
          setStage('analyze');
          setActiveTab('tracks');
        }
      } catch (e) {
        console.error('Parse error:', e);
        alert('Failed to parse XML. Please check your Rekordbox export.');
      }
      setIsLoading(false);
    }, 10);
  };

  const handlePlaylistSelect = (selectedTracks: Track[], label: string) => {
    setTracks(selectedTracks);
    setPlaylistLabel(label);
    clearScoreCache();
    setStage('analyze');
    setActiveTab('tracks');
  };

  const handleParamsChange = (p: ScoringParams) => {
    setParams(p);
    clearScoreCache();
  };

  const handleReset = () => {
    setStage('upload');
    setCollection(null);
    setTracks([]);
    setPlaylistLabel('');
    clearScoreCache();
  };

  const handleBackToPlaylists = () => {
    if (collection?.hasPlaylists) {
      setStage('select-playlist');
    } else {
      handleReset();
    }
  };

  const stats = useMemo(() => ({
    total: tracks.length,
    complete: tracks.filter(t => t.isComplete).length,
    missingBpm: tracks.filter(t => t.bpm === null).length,
    missingKey: tracks.filter(t => t.camelot === null).length,
  }), [tracks]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'tracks', label: 'All Tracks', count: stats.total },
    { id: 'matches', label: 'Best Matches' },
    { id: 'order', label: 'Best Set Order' },
    { id: 'groups', label: 'Mixable Groups' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      {/* Header */}
      <header className="border-b border-[#2a2a32] bg-[#0d0d0f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-wider text-[#e8e8f0]"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              BIG<span className="text-[#00e5ff]">.</span>BLENDS
            </h1>
            <p className="text-xs text-[#444460]" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
              Rekordbox XML → Camelot Wheel Mixing
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            {stage !== 'upload' && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#555570]">
                <button onClick={handleReset} className="hover:text-[#888899] transition-colors">Upload</button>
                <span className="text-[#333344]">/</span>
                {stage === 'analyze' && collection?.hasPlaylists ? (
                  <>
                    <button onClick={handleBackToPlaylists} className="hover:text-[#888899] transition-colors">Playlists</button>
                    <span className="text-[#333344]">/</span>
                    <span className="text-[#00e5ff] truncate max-w-[180px]">{playlistLabel}</span>
                  </>
                ) : stage === 'select-playlist' ? (
                  <span className="text-[#00e5ff]">Select Playlist</span>
                ) : (
                  <span className="text-[#00e5ff] truncate max-w-[200px]">{playlistLabel}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
              <span className="text-xs font-mono text-[#444460]">CLIENT-SIDE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── STAGE 1: Upload ── */}
        {stage === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <UploadPanel onXml={handleXml} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-3 flex flex-col items-center justify-center h-72 border border-dashed border-[#2a2a32] rounded-xl">
              <div className="text-center space-y-3 px-8">
                <div className="text-5xl opacity-20">🎛️</div>
                <p className="text-[#444460] font-mono text-sm uppercase tracking-widest">No tracks loaded</p>
                <p className="text-[#333344] text-xs leading-relaxed">
                  Upload your full Rekordbox XML export — playlists will be detected automatically
                  so you can pick exactly which one to analyse
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 2: Playlist Selector ── */}
        {stage === 'select-playlist' && collection && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <UploadPanel onXml={handleXml} isLoading={isLoading} />
              <div className="bg-[#16161a] border border-[#2a2a32] rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#444460]">Collection Stats</p>
                {[
                  { label: 'Total tracks', value: collection.allTracks.length, color: '#e8e8f0' },
                  { label: 'With key', value: collection.allTracks.filter(t => t.camelot).length, color: '#00e5ff' },
                  { label: 'With BPM', value: collection.allTracks.filter(t => t.bpm).length, color: '#00e5ff' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-[#666680]">{s.label}</span>
                    <span className="font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <PlaylistSelector
                playlists={collection.playlists}
                trackById={collection.trackById}
                totalCollectionCount={collection.allTracks.length}
                onSelect={handlePlaylistSelect}
              />
            </div>
          </div>
        )}

        {/* ── STAGE 3: Analyze ── */}
        {stage === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <UploadPanel onXml={handleXml} isLoading={isLoading} />
              <ControlsPanel params={params} onChange={handleParamsChange} />
              <div className="bg-[#16161a] border border-[#2a2a32] rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#444460]">Analysing</p>
                <p className="text-sm text-[#e8e8f0] font-medium truncate" title={playlistLabel}>
                  {playlistLabel}
                </p>
                {collection?.hasPlaylists && (
                  <button
                    onClick={handleBackToPlaylists}
                    className="w-full py-1.5 text-xs font-mono text-[#555570] hover:text-[#00e5ff] border border-[#2a2a32] hover:border-[#00e5ff40] rounded transition-all"
                  >
                    ← Switch Playlist
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: stats.total, color: '#e8e8f0' },
                  { label: 'Complete', value: stats.complete, color: '#00e5ff' },
                  { label: 'No BPM', value: stats.missingBpm, color: stats.missingBpm > 0 ? '#ff3d6b' : '#444460' },
                  { label: 'No Key', value: stats.missingKey, color: stats.missingKey > 0 ? '#ff3d6b' : '#444460' },
                ].map(s => (
                  <div key={s.label} className="bg-[#16161a] border border-[#2a2a32] rounded-lg p-3 text-center">
                    <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-mono text-[#555570] uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="border-b border-[#2a2a32] flex gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-[#00e5ff] text-[#00e5ff]'
                        : 'border-transparent text-[#555570] hover:text-[#888899]'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-[#16161a] border border-[#2a2a32] rounded-xl p-4">
                {activeTab === 'tracks' && <TrackTable tracks={tracks} />}
                {activeTab === 'matches' && <BestMatches tracks={tracks} params={params} />}
                {activeTab === 'order' && <BestSetOrder tracks={tracks} params={params} />}
                {activeTab === 'groups' && <MixableGroups tracks={tracks} params={params} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
