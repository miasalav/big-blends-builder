# Big Blends Builder 🎛️

A client-side DJ tool for analysing Rekordbox XML exports using the Camelot Wheel. Upload your full collection, pick a playlist, and get instant harmonic mixing insights — best track matches, optimized set orders, and mixable groups.

No data leaves your browser. No accounts. No backend.

---

## Features

- **Playlist Browser** — upload your full Rekordbox XML and navigate your playlist folders to pick exactly which set to analyse
- **Best Matches** — click any track to see its top 10 harmonically compatible next tracks, scored by key relationship and BPM
- **Best Set Order** — generates 3 optimized set sequences (conservative, balanced, adventurous) using a greedy algorithm with lookahead
- **Mixable Groups** — clusters tracks by Camelot neighborhood and BPM band so you can spot pocket zones instantly
- **CSV & M3U Export** — export any generated set order for use in other tools
- **Adjustable Controls** — tune key strictness (Strict / Normal / Creative), key vs BPM weighting, BPM tolerance, and half/double-time matching

---

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for Rekordbox XML parsing
- 100% client-side — no server, no API calls

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To try it without a real XML file, click **Load Sample XML** on the upload panel.

---

## How to Export from Rekordbox

1. Open Rekordbox
2. Go to **File → Export Collection in xml format**
3. Save the `.xml` file anywhere on your computer
4. Upload it to Big Blends Builder — your playlists will appear automatically

> **Note:** Rekordbox only lets you export the full collection as XML, not individual playlists. Big Blends Builder handles this by letting you select which playlist to analyse after uploading.

---

## Camelot Wheel Logic

Compatibility is scored based on standard Camelot Wheel rules:

| Relation | Description | Score |
|---|---|---|
| Same | Identical key | 1.0 |
| Adjacent | ±1 on the wheel (e.g. 8A → 9A) | 0.9 |
| Relative | Same number, switch A↔B (e.g. 8A → 8B) | 0.85 |
| Energy +2 | ±2 on the wheel *(Creative mode only)* | 0.7 |
| Other | Everything else | 0.2 (or 0.0 in Strict mode) |

The final transition score combines the key score and BPM score weighted by the **Key Weight** slider (default 65% key, 35% BPM).

---

## Project Structure

```
app/
  page.tsx              # Main layout and stage flow (upload → playlist → analyse)
  globals.css

components/
  UploadPanel.tsx        # Drag & drop XML upload
  PlaylistSelector.tsx   # Nested playlist folder tree
  ControlsPanel.tsx      # Strictness, key weight, BPM tolerance sliders
  TrackTable.tsx         # Sortable, searchable track list
  BestMatches.tsx        # Per-track compatibility finder
  BestSetOrder.tsx       # Set order generator + export
  MixableGroups.tsx      # BPM + key cluster cards

lib/
  xmlParser.ts           # Rekordbox XML ingestion + playlist parsing
  camelot.ts             # Authoritative Camelot ↔ musical key mapping
  keyNormalization.ts    # Handles Am, A minor, 8A, Abm, etc.
  scoring.ts             # Key + BPM compatibility scoring
  ordering.ts            # Greedy set order algorithm with lookahead
```

---

## Deployment

Deployed on [Vercel](https://vercel.com). Every push to `main` triggers an automatic redeploy.

---

## License

MIT
