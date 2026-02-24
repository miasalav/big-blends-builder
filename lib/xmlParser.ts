import { normalizeKey } from './keyNormalization';

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  rawKey: string | null;
  canonicalKey: string | null;
  camelot: string | null;
  prettyKey: string;
  isComplete: boolean;
}

export interface PlaylistNode {
  id: string;
  name: string;
  type: 'folder' | 'playlist';
  trackIds: string[]; // only populated for type=playlist
  children: PlaylistNode[];
}

export interface ParsedCollection {
  allTracks: Track[];
  trackById: Map<string, Track>;       // keyed by Rekordbox TrackID string
  playlists: PlaylistNode[];           // nested tree
  hasPlaylists: boolean;
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function getAttr(attrs: Record<string, unknown>, ...names: string[]): string {
  for (const name of names) {
    for (const key of Object.keys(attrs)) {
      if (key.toLowerCase() === name.toLowerCase()) {
        const val = String(attrs[key] ?? '').trim();
        if (val && val !== 'NA' && val !== 'None') return val;
      }
    }
  }
  return '';
}

function buildTrack(attrs: Record<string, unknown>, rbId: string): Track {
  const title = getAttr(attrs, 'Name', 'NAME', 'Title', 'TITLE') || 'Unknown Title';
  const artist = getAttr(attrs, 'Artist', 'ARTIST') || 'Unknown Artist';
  const bpmRaw = getAttr(attrs, 'AverageBpm', 'BPM', 'averagebpm');
  const bpm = bpmRaw ? parseFloat(bpmRaw) : null;
  const rawKey = getAttr(attrs, 'Tonality', 'TONALITY', 'Key', 'KEY') || null;

  const normalized = normalizeKey(rawKey);
  const isComplete = bpm !== null && !isNaN(bpm) && normalized.camelot !== null;
  const id = hashStr(`${title}|${artist}|${bpmRaw}|${rawKey}`);

  return {
    id,
    title,
    artist,
    bpm: bpm && !isNaN(bpm) ? bpm : null,
    rawKey,
    canonicalKey: normalized.canonicalKey || null,
    camelot: normalized.camelot,
    prettyKey: normalized.prettyKey,
    isComplete,
  };
}

// Recursively parse a NODE element from the fast-xml-parser result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePlaylistNode(node: any, depth = 0): PlaylistNode | null {
  if (!node) return null;

  const name = String(node.Name ?? node.name ?? 'Untitled');
  const nodeType = String(node.Type ?? node.type ?? '0');
  const isFolder = nodeType === '0';
  const id = hashStr(`${name}|${depth}|${nodeType}`);

  if (isFolder) {
    const rawChildren = node.NODE ?? node.node ?? [];
    const childArray: unknown[] = Array.isArray(rawChildren) ? rawChildren : rawChildren ? [rawChildren] : [];
    const children = childArray
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => parsePlaylistNode(c, depth + 1))
      .filter((c): c is PlaylistNode => c !== null);
    return { id, name, type: 'folder', trackIds: [], children };
  } else {
    // Playlist — collect TRACK entries
    const rawTracks = node.TRACK ?? node.track ?? [];
    const trackArray: unknown[] = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackIds = trackArray.map((t: any) => String(t.Key ?? t.key ?? '')).filter(Boolean);
    return { id, name, type: 'playlist', trackIds, children: [] };
  }
}

export function parseCollection(xmlString: string): ParsedCollection {
  const trackById = new Map<string, Track>(); // rbId -> Track
  const allTracks: Track[] = [];
  let playlists: PlaylistNode[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', isArray: () => false });
    const result = parser.parse(xmlString);

    const root = result?.DJ_PLAYLISTS ?? result?.dj_playlists ?? result;

    // Parse COLLECTION
    const collection = root?.COLLECTION ?? root?.collection;
    if (collection) {
      const rawTracks = collection.TRACK ?? collection.track ?? [];
      const trackArray = Array.isArray(rawTracks) ? rawTracks : [rawTracks];
      for (const t of trackArray) {
        if (!t) continue;
        const rbId = String(t.TrackID ?? t.trackid ?? t.TRACKID ?? '');
        const track = buildTrack(t as Record<string, unknown>, rbId);
        allTracks.push(track);
        if (rbId) trackById.set(rbId, track);
      }
    }

    // Parse PLAYLISTS tree
    const playlistsRoot = root?.PLAYLISTS ?? root?.playlists;
    if (playlistsRoot) {
      const rootNode = playlistsRoot.NODE ?? playlistsRoot.node;
      const rootArray = Array.isArray(rootNode) ? rootNode : rootNode ? [rootNode] : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const node of rootArray as any[]) {
        const parsed = parsePlaylistNode(node);
        if (parsed) playlists.push(parsed);
      }
    }
  } catch (e) {
    console.error('fast-xml-parser failed, falling back to DOMParser', e);
    // DOMParser fallback
    if (typeof window !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');

      // Parse collection tracks
      doc.querySelectorAll('COLLECTION > TRACK').forEach(el => {
        const obj: Record<string, unknown> = {};
        for (const attr of Array.from(el.attributes)) obj[attr.name] = attr.value;
        const rbId = String(obj.TrackID ?? '');
        const track = buildTrack(obj, rbId);
        allTracks.push(track);
        if (rbId) trackById.set(rbId, track);
      });

      // Parse playlists (DOM fallback — simplified flat list)
      doc.querySelectorAll('NODE[Type="1"]').forEach(el => {
        const name = el.getAttribute('Name') ?? 'Untitled';
        const id = hashStr(name + 'playlist');
        const trackIds: string[] = [];
        el.querySelectorAll('TRACK').forEach(t => {
          const key = t.getAttribute('Key');
          if (key) trackIds.push(key);
        });
        playlists.push({ id, name, type: 'playlist', trackIds, children: [] });
      });
    }
  }

  // Filter out empty folders from top-level
  const hasPlaylists = playlists.length > 0 && countPlaylists(playlists) > 0;

  return { allTracks, trackById, playlists, hasPlaylists };
}

function countPlaylists(nodes: PlaylistNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === 'playlist') count++;
    count += countPlaylists(n.children);
  }
  return count;
}

/** Resolve a playlist's trackIds against the collection map */
export function resolvePlaylistTracks(
  node: PlaylistNode,
  trackById: Map<string, Track>
): Track[] {
  const tracks: Track[] = [];
  for (const rbId of node.trackIds) {
    const t = trackById.get(rbId);
    if (t) tracks.push(t);
  }
  return tracks;
}

// Legacy compat — kept for sample XML button
export function parseTracks(xmlString: string): Track[] {
  return parseCollection(xmlString).allTracks;
}

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <COLLECTION Entries="8">
    <TRACK TrackID="1" Name="Windowlicker" Artist="Aphex Twin" AverageBpm="92.00" Tonality="F#m" />
    <TRACK TrackID="2" Name="Szamar Madar" Artist="Venetian Snares" AverageBpm="174.00" Tonality="Dm" />
    <TRACK TrackID="3" Name="Dead Cities" Artist="The Future Sound of London" AverageBpm="98.00" Tonality="Cm" />
    <TRACK TrackID="4" Name="Theme From Q" Artist="Actress" AverageBpm="124.00" Tonality="Gm" />
    <TRACK TrackID="5" Name="Untitled 7" Artist="Burial" AverageBpm="140.00" Tonality="Bbm" />
    <TRACK TrackID="6" Name="Infolepsy" Artist="Clark" AverageBpm="128.00" Tonality="Em" />
    <TRACK TrackID="7" Name="Cascades" Artist="Objekt" AverageBpm="132.00" Tonality="Am" />
    <TRACK TrackID="8" Name="No Key Track" Artist="Andy Stott" AverageBpm="118.00" Tonality="" />
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT" Count="2">
      <NODE Type="0" Name="Sets" Count="2">
        <NODE Type="1" Name="Late Night Warehouse" KeyType="0" Entries="4">
          <TRACK Key="1" />
          <TRACK Key="6" />
          <TRACK Key="7" />
          <TRACK Key="4" />
        </NODE>
        <NODE Type="1" Name="Ambient Excursions" KeyType="0" Entries="3">
          <TRACK Key="3" />
          <TRACK Key="5" />
          <TRACK Key="8" />
        </NODE>
      </NODE>
      <NODE Type="1" Name="All Tracks" KeyType="0" Entries="8">
        <TRACK Key="1" /><TRACK Key="2" /><TRACK Key="3" /><TRACK Key="4" />
        <TRACK Key="5" /><TRACK Key="6" /><TRACK Key="7" /><TRACK Key="8" />
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;

