# VietTravelTimer — Architectural & Project State Handoff

**Project Name:** VietTravelTimer  
**Target Platform:** 100% Client-Side Web (PWA / GitHub Pages: `https://<username>.github.io/VietTravelTimer/`)  
**Repository State:** Production-ready (`tsc && vite build` clean, 0 errors)  
**Last Updated:** 2026-11-01  

---

## 1. Project Overview & Tech Stack

### Core Purpose
**VietTravelTimer** is a distraction-free Pomodoro focus web application built around a simulated North–South trans-Vietnam railway journey. It combines:
- A multi-mode customizable Pomodoro clock (Flocus-inspired).
- Lightweight, aesthetic pixel-art animated backgrounds.
- High-contrast satellite railway map and province milestone tracking from Lạng Sơn down to Cà Mau.
- Integrated YouTube audio playback with queuing and procedural ambient sounds (Rain, Brown Noise, Train Rumble).
- Zero-auth, dual-layer cloud synchronization.

### Tech Stack
| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | React 18, TypeScript 5, Vite 5 | SPA shell, strict typing, fast HMR |
| **Styling & UI** | Tailwind CSS 3, Lucide React, Framer Motion | Minimalist monochrome dark design system |
| **Map Engine** | Leaflet 1.9 (ArcGIS World Imagery Satellite) | High-performance 60fps pan/zoom satellite map |
| **Audio & Media** | YouTube IFrame API, Web Audio API | Background music, procedural noise synthesis |
| **Persistence** | LocalStorage, IndexedDB (`VietTravelTimerDB`), KVDB.io | Custom GIFs/wallpapers, sync state, session data |
| **Deployment** | GitHub Pages (`base: '/VietTravelTimer/'` or relative) | Static serverless hosting |

---

## 2. Key Features & Implementation Details

### A. Multi-Mode Pomodoro Clock (`src/components/FocusTimerDisplay.tsx`)
- **Clock Styles (`ClockStyle`):**
  - `ring`: Clean circular SVG countdown ring with progress percentage.
  - `minimal`: High-contrast large typographic digital digits.
  - `flip`: Retro mechanical flip-clock style cards with subtle split shadows.
- **View Positions (`ClockPosition`):**
  - `center`: Centered in the workspace over the background.
  - `mini`: Compact widget docked to the top-right / corner (Flocus-inspired).
  - `zen`: Pure Pixel Zen Mode — completely hides the timer and chrome; movement reveals a floating top bar button to restore controls.
- **Readability Capsule:** High-contrast frosted glass container (`bg-black/60 backdrop-blur-2xl border border-white/10`) ensuring clock legibility over high-brightness or detailed backgrounds.

### B. Pixel Art Background Engine (`src/components/Background.tsx`, `src/components/WallpaperManager.tsx`)
- **Built-in Presets:** Local GIFs in `public/backgrounds/` (`pixel-1.gif`, `pixel-2.gif`, `pixel-3.gif`, `pixel-4.gif`).
- **Visual Picker:** 3-column visual thumbnail grid popover (`Phông nền`) without text clutter.
- **IndexedDB Custom Uploads (`src/utils/customBgStorage.ts`):**
  - Allows users to upload custom GIF/JPG/PNG files (>5MB) directly into browser storage via `VietTravelTimerDB`.
  - Bypasses strict 5MB `localStorage` quotas with zero network round-trip.

### C. Interactive North–South Railway Map (`src/components/RouteStepView.tsx`)
- **Decoupled from 1-Second Timer Ticks:**
  - Map initialization is isolated into a mount-once `useEffect` (`deps: []`).
  - Active route calculations (`journeyInfo`) and station toggles are memoized with `React.memo` and `useCallback`.
  - Dynamic route vectors and station markers update strictly via Leaflet vector layers without remounting `<MapContainer>` or re-fetching `TileLayer` tiles.
- **Zero Black Flash Camera Navigation:**
  - Selecting a station triggers smooth camera navigation via `map.flyTo(targetCoords, zoom, { duration: 0.8, easeLinearity: 0.25 })`.
  - Preserves user gestures without tile tearing or flashing black screens.
- **Trans-Vietnam Route (2,213 km):**
  - Spans from **Ga Lạng Sơn (Đồng Đăng, Km -163)** to **Ga Cà Mau (Đất Mũi, Km 2050)** across 20 intermediate stations (`VIETNAM_STATIONS` in `src/data/trainStations.ts`).
  - Clean satellite view without artificial yellow boundary polyline.
- **Sacred Sovereignty Markers (Permanent):**
  - **Quần đảo Hoàng Sa:** `[16.5369, 112.0242]` (`🇻🇳 Quần đảo Hoàng Sa (TP. Đà Nẵng · Việt Nam)`).
  - **Quần đảo Trường Sa:** `[8.6433, 111.9197]` (`🇻🇳 Quần đảo Trường Sa (Tỉnh Khánh Hòa · Việt Nam)`).
  - High-contrast glowing pulse pins and frosted glass labels rendered permanently on `sovereigntyLayer`.
- **Horizontal Station Selector:**
  - Mouse-wheel horizontal scrolling via `onWheel` (`e.currentTarget.scrollLeft += e.deltaY`).
  - Smooth native scrollbars with `shrink-0` station cards.
- **Locomotive Milestone Tooltip (`src/components/BottomPlayerBar.tsx`):**
  - Real-time popover indicator tracking province crossings above the train avatar on the bottom scrubber.

### D. Media Player & Audio Mixer (`src/components/BottomPlayerBar.tsx`, `src/hooks/useYouTubePlayer.ts`, `src/hooks/useAmbientSounds.ts`)
- **YouTube Audio Player:**
  - Headless offscreen IFrame (`fixed -top-[9999px]`).
  - Metadata resolution via oEmbed (`noembed.com`) with fallback title extraction.
  - Playlist queue management, looping (`all` / `one`), and seekable timeline.
  - YouTube postMessage origin mismatch suppressed via explicit `origin` and `enablejsapi: 1` config.
- **Streamlined Ambient Sounds:**
  - Procedural Web Audio API nodes: Train track rumble, Rain, Brown noise.
  - No external audio dependencies or network lag.
- **Mobile Action Drawer (`src/components/MobileActionDrawer.tsx`):**
  - Responsive bottom sheet (`68vh`) providing mobile touch access to Tasks, Notepad, and Ambient Sound mixer.
  - Visible volume slider with touch scrubbing and numeric feedback.

### E. Dual-Layer Auto-Sync (Zero-Auth) (`src/utils/cloudSync.ts`, `src/components/CloudSyncPopover.tsx`)
- **Architecture:**
  - **Layer 1 (Local):** `localStorage` + `BroadcastChannel('viet_travel_timer_sync')` for immediate, zero-latency multi-tab sync.
  - **Layer 2 (Cloud):** REST Key-Value store on `kvdb.io` using an anonymous unique ID (`traveler-xxxx`).
- **Resilience:**
  - Automatic bucket initialization.
  - Graceful fallback: Network drops or 404/400 errors fail silently to local storage without console red spam.
  - Status indicator in header (`☁️ Đã đồng bộ`).

---

## 3. Recent Fixes & Optimizations

1. **Stripped "AI Slop" & Color Clutter:** Standardized the UI chrome to a clean, Apple-inspired monochrome palette (zinc/white/black) with high readability.
2. **Fixed Map Stutter & 1000ms Re-Render Loop:** Resolved Leaflet tile reload and freeze issues caused by timer ticks by decoupling `journeyInfo` and removing dynamic handlers from the map lifecycle.
3. **Removed Mainland Boundary Polyline:** Eliminated the artificial yellow/gold dashed border line while preserving Quần đảo Hoàng Sa and Quần đảo Trường Sa sovereignty markers.
4. **Eliminated Black Flash on Station Selection:** Locked map setup to run strictly once; station selection pans via smooth `flyTo` rather than tearing down the Leaflet instance.
5. **Horizontal Mouse Wheel Scrolling:** Added native `onWheel` interception to translate vertical scroll wheel deltas to horizontal scrolling for the station list.
6. **Mobile UX Restoration:** Built `MobileActionDrawer` to ensure mobile screens have 100% feature parity (Tasks, Notes, Sounds) with dedicated touch sizing.
7. **Cleaned Naming:** Standardized railway branding from legacy "Thống Nhất SE3" to "Đường sắt Việt Nam" with dynamic codes (`SE1` / `SE2`).

---

## 4. Project Directory Structure & Key Files

```
VietTravelTimer/
├── index.html                           # App entry shell (Title, meta, Leaflet CDN fallback)
├── package.json                         # Dependencies, scripts (tsc && vite build)
├── vite.config.ts                       # Base path configuration for GitHub Pages
├── tailwind.config.js                   # Design tokens, typography, monochrome colors
├── HANDOFF.md                           # Master architectural specification
│
├── public/
│   └── backgrounds/
│       ├── pixel-1.gif                  # Train Cabin (Dawn)
│       ├── pixel-2.gif                  # Train Cabin (Sunset)
│       ├── pixel-3.gif                  # Train Cabin (Night Rain)
│       └── pixel-4.gif                  # Lo-fi Room & Balcony
│
└── src/
    ├── main.tsx                         # Entry point rendering <App />
    ├── App.tsx                          # Root orchestrator: Timer, Player, Sync, Routing
    ├── index.css                        # Tailwind directives, custom scrollbars, animations
    │
    ├── components/
    │   ├── BottomPlayerBar.tsx          # Bottom dock: playback, animated train track, milestone popup
    │   ├── CabinStepView.tsx            # Booking Flow Step 2: Sleeper berths & focus intent
    │   ├── ClockSettingsPopover.tsx     # Timer settings popover (Style, Position, Durations)
    │   ├── CloudSyncPopover.tsx         # Zero-auth Sync ID management & manual sync
    │   ├── DepartGateView.tsx           # Booking Flow Step 4: Pre-departure countdown gate
    │   ├── FlocusActionBar.tsx          # Top bar widget controls (Tasks, Notes, Sounds)
    │   ├── FocusTimerDisplay.tsx        # Pomodoro Display: Minimal, Ring, Flip Clock
    │   ├── MobileActionDrawer.tsx       # Bottom drawer sheet for mobile screens (<md)
    │   ├── PlaylistDrawer.tsx           # YouTube queue drawer
    │   ├── RouteStepView.tsx            # Full-bleed Leaflet satellite map & station carousel
    │   ├── TaskManager.tsx              # Focus task list with completion & local persistence
    │   ├── TicketStepView.tsx           # Booking Flow Step 3: Digital boarding pass
    │   ├── TrainBookingFlow.tsx         # 5-step modal workflow orchestrator
    │   ├── TrainJourney.tsx             # Mini train cockpit overlay
    │   └── WallpaperManager.tsx         # Visual GIF thumbnail picker & custom uploader
    │
    ├── data/
    │   ├── backgrounds.ts               # Background presets config
    │   ├── demoSongs.ts                 # Default music tracks
    │   ├── railwayMilestones.ts         # Province km milestones from Lạng Sơn to Cà Mau
    │   └── trainStations.ts             # 20 Vietnam Railway stations, coordinates, journey math
    │
    ├── hooks/
    │   ├── useAmbientSounds.ts          # Procedural Web Audio API sound generator
    │   ├── useFocusTimer.ts             # Drift-proof Pomodoro timer engine (Date.now())
    │   ├── useQueue.ts                  # Music playback queue state & loop controls
    │   ├── useShortcuts.ts              # Global keyboard shortcuts
    │   └── useYouTubePlayer.ts          # YouTube IFrame bridge & state observer
    │
    └── utils/
        ├── cloudSync.ts                 # Dual sync engine: BroadcastChannel + KVDB.io
        ├── customBgStorage.ts           # IndexedDB storage for user-uploaded custom GIFs
        ├── wallpaperStorage.ts          # IndexedDB fallback for high-res wallpapers
        └── youtube.ts                   # YouTube URL parser & oEmbed metadata resolver
```

---

## 5. Next Steps & Backlog

1. **Authentication Upgrade (Optional):**
   - Provide an optional Google Sign-in (Firebase/Supabase) to complement or supersede anonymous Sync IDs for multi-device sync across network boundaries.
2. **Dynamic Train Fleet Naming:**
   - Add contextual naming based on routes: standard SE1/SE2/SE3 for Hanoi–Saigon vs. Concept Express for Lạng Sơn / Cà Mau segments.
3. **PWA Offline Support:**
   - Add a lightweight Service Worker manifest to allow offline Pomodoro usage with cached procedural ambient sounds and local GIFs.
4. **Performance Audits on Low-End Mobile:**
   - Optimize memory consumption when multiple heavy animated GIFs are stored in IndexedDB on low-RAM mobile browsers.

---

## 6. Build & Verification Commands

```bash
# Install dependencies
npm install

# Run dev server with HMR
npm run dev

# Compile TypeScript & verify production build
npm run build

# Preview production build locally
npm run preview
```
