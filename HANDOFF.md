# ARCHITECTURAL & STATE HANDOFF SPECIFICATION

**Project Name:** `ytmusic-apple-lyrics` (Focus Hub & Apple Synced Lyrics)  
**Target Environment:** 100% Client-Side Serverless (GitHub Pages / Static Web)  
**Snapshot Timestamp:** 2026-10-30T15:56:38+07:00  
**Build Status:** Clean (`tsc && vite build` exited with code 0 in 1.57s)  

---

## 1. PROJECT OVERVIEW & TECH STACK

### Core Concept & Mission
An all-in-one, distraction-free productivity and music focus workspace combining:
1. **Apple Music-Grade Synced Lyrics Display:** Word-by-word and line-by-line synced lyrics with realistic optical depth-of-field Gaussian blur, dynamic living artwork lighting, and decoupled 60–120 FPS timekeeping.
2. **Focus Hub & Pomodoro Engine:** Anti-throttling countdown timer with synthesized two-tone Apple bell chimes and native browser notifications.
3. **Vietnam Focus Train Journey:** POV railway experience from North to South along the Reunification Railway (`povtrain.mp4`), synchronized with focus timer states (*"Tập trung thì tàu chạy, dừng lại thì tàu dừng"*).
4. **Procedural Ambient White Noise Mixer:** 5 synthesized audio channels generated via the Web Audio API with zero external audio assets.
5. **Zero-Backend / 100% Client-Side:** Deployable straight to GitHub Pages with relative asset resolution (`base: './'`).

### Technology Stack & Dependency Matrix
From `package.json`:

| Dependency | Version | Architectural Purpose |
| :--- | :--- | :--- |
| `react` | `^18.3.1` | Core UI library (Concurrent mode, Hooks, Memo) |
| `react-dom` | `^18.3.1` | DOM renderer |
| `vite` | `^5.4.10` | ESM bundler, dev server, asset pipeline |
| `typescript` | `^5.6.3` | Strict static typing (`noUnusedLocals: true`, `strict: true`) |
| `tailwindcss` | `^3.4.14` | Utility styling, customized Apple & Editorial design token system |
| `lucide-react` | `^0.454.0` | Minimalist iconography |
| `framer-motion` | `^11.11.17` | Physics-based step transitions & tear-off ticket animation |
| `clsx` & `tailwind-merge` | `^2.1.1` / `^2.5.4` | Dynamic class concatenation & conflict resolution |
| `Web Audio API` | Native Browser | Chime synthesis, procedural ambient sound generators |
| `IndexedDB` | Native Browser | High-capacity custom wallpaper storage (>10MB) |

### Build & Compiler Configuration
- **Vite Configuration (`vite.config.ts`):**
  - Dev mode: `base: '/'` for reliable HMR and module resolution.
  - Production build: `base: './'` for seamless GitHub Pages relative asset serving.
- **Tailwind Configuration (`tailwind.config.js`):**
  - Font Families:
    - `font-display`: `['"Plus Jakarta Sans"', 'Inter', 'sans-serif']`
    - `font-mono`: `['"JetBrains Mono"', 'ui-monospace', 'monospace']`
    - `font-apple`: `['Inter', '-apple-system', 'sans-serif']`
  - Solid pure black backdrop `#000000` with matte charcoal panel surfaces `#0d0d0e` and hairline borders `border-white/[0.08]`.

---

## 2. COMPLETE FILE TREE

```
.
├── HANDOFF.md                           # Comprehensive architecture and state handoff document
├── README.md                            # Project overview and basic setup instructions
├── index.html                           # Root HTML shell with #root mount point
├── package.json                         # Project manifest, dependencies, and build scripts
├── postcss.config.js                    # PostCSS configuration for Tailwind CSS and Autoprefixer
├── tailwind.config.js                   # Design tokens, Apple typography stack, animation configs
├── tsconfig.json                        # TypeScript root configuration with strict compile options
├── tsconfig.node.json                   # TypeScript config for Vite configuration files
├── vite.config.ts                       # Vite build options with relative base path ('./')
│
├── public/
│   ├── povtrain.mp4                     # 87MB Full HD POV video of Vietnam train journey for focus mode
│   └── vietnam-satellite.jpg            # High-resolution dark satellite texture map of Indochina / Vietnam
│
└── src/
    ├── main.tsx                         # React entrypoint mounting <App /> wrapped in <ErrorBoundary>
    ├── vite-env.d.ts                    # Vite client TypeScript reference declarations
    ├── index.css                        # Tailwind directives, range styling, blur classes & ambient float keyframes
    ├── App.tsx                          # Root state orchestrator, layout view switcher, player mounting
    │
    ├── types/
    │   ├── index.ts                     # Core domain interfaces: LyricLineData, LyricWord, SongMetadata, etc.
    │   └── player.ts                    # YouTube player event contracts and YTPlayerError interfaces
    │
    ├── data/
    │   ├── demoSongs.ts                 # Curated demo playlist (Ed Sheeran, Coldplay, Vũ, etc.)
    │   ├── trainStations.ts             # 9 Vietnam Railway stations (HAN -> SGO), km markers, journey math
    │   └── trendingCatalog.ts           # Extended catalog for discovery and instant playback
    │
    ├── hooks/
    │   ├── useYouTubePlayer.ts          # Hidden YouTube IFrame manager, state polling & playback controls
    │   ├── useSmoothTime.ts             # Decoupled 60-120 FPS clock drift lerp engine
    │   ├── useLyrics.ts                 # Orchestrates metadata resolution, LRCLIB query, cache, and offsets
    │   ├── useFocusTimer.ts             # Pomodoro engine with Date.now() timestamp anti-throttling & bell chime
    │   ├── useAmbientSounds.ts          # Procedural Web Audio API sound generator (5 white/brown/nature channels)
    │   ├── useQueue.ts                  # Music playback queue, shuffle, loop-one/all, and history state
    │   ├── useShortcuts.ts              # Global keyboard shortcuts (Space, Arrows, [, ], M, L)
    │   └── useMediaSession.ts           # Native OS lockscreen & notification media controls
    │
    ├── utils/
    │   ├── cleanTitle.ts                # RegEx engine cleaning YouTube title fluff (4K, Official MV, tags)
    │   ├── lrclib.ts                    # LRCLIB API search query execution, candidate deduplication & auto-picker
    │   ├── lrcParser.ts                 # Parses standard [mm:ss.xx] and enhanced syllable <mm:ss.xx> LRC formats
    │   ├── lyricMatcher.ts              # Levenshtein & duration matching score heuristics
    │   ├── lyricsCache.ts               # LocalStorage TTL cache for lyrics and song metadata
    │   ├── syncEngine.ts                # Offset arithmetic and effective playback time calculations
    │   ├── wallpaperStorage.ts          # IndexedDB wrapper for storing high-res user wallpaper blobs
    │   └── youtube.ts                   # Multi-endpoint YouTube metadata resolver (NoEmbed -> oEmbed -> IFrame)
    │
    ├── services/
    │   └── lyricsCache.ts               # Legacy compatibility layer for lyrics caching service
    │
    └── components/
        ├── ErrorBoundary.tsx            # Global React Error Boundary with user-friendly recovery UI
        ├── TrainBookingFlow.tsx         # Orchestrator for 5-step focus train journey (Framer Motion AnimatePresence)
        ├── RouteStepView.tsx            # Step 1: Tactical satellite route selector with SVG track & snap cards
        ├── CabinStepView.tsx            # Step 2: Sleeper coach 03 floorplan & typographic focus intents
        ├── TicketStepView.tsx           # Step 3: Swiss-style monochrome boarding pass with barcode strip
        ├── DepartGateView.tsx           # Step 4: Departure gate screen with countdown & audio unblock
        ├── TrainJourney.tsx             # Step 5: Active trip cockpit HUD dock with real-time train notch
        ├── AlbumArt.tsx                 # Square cover art with Apple-style rounded-3xl corners & ambient shadow
        ├── AlternativeLyricsDrawer.tsx  # Slide-over drawer to search & select alternative lyric versions
        ├── AmbientSoundMixer.tsx        # Multi-channel ambient volume sliders & master mute popover
        ├── AppleHud.tsx                 # Floating pill HUD for volume changes and offset nudges
        ├── Background.tsx               # Dynamic ambient fluid lighting, album color spill & POV train video
        ├── FocusBottomDock.tsx          # Minimal floating bottom dock for timer, train mode, ambient, tasks
        ├── FocusTimerDisplay.tsx        # Hairline circular SVG timer ring with train route integration
        ├── Header.tsx                   # Top navigation bar with Focus Hub link, Catalog, Lyrics, and Queue
        ├── LandingView.tsx              # Fallback catalogue & explore screen
        ├── LyricLine.tsx                # Individual lyric line renderer with progressive blur and word highlight
        ├── LyricsView.tsx               # Native smooth unlocked scrolling lyrics container with vignette overlays
        ├── MiniPlayer.tsx               # Floating compact player for non-lyrics views
        ├── OffsetController.tsx         # Standalone modal controller for lyric timing offsets
        ├── PlayerControls.tsx           # Hairline scrubber with negative remaining time, play/pause, volume
        ├── PlaylistDrawer.tsx           # Track queue and playlist side drawer
        ├── SongModal.tsx                # Unified URL loader, search modal, and manual LRC paste tool
        ├── TaskManager.tsx              # Focus to-do checklist with localStorage persistence
        ├── TrackCard.tsx                # Card component for trending track catalog
        ├── TrainBookingFlow.tsx         # 5-step flight-inspired booking flow: S-curve map, cabin, ticket, pre-departure gate
        ├── TrainJourney.tsx             # Interactive railway progress line with train notch, real-time remaining km HUD
        ├── TrainJourneyBar.tsx          # Compact train progress indicator
        ├── TrainJourneyModal.tsx        # Wrapper connecting TrainBookingFlow to modal consumers
        └── WallpaperManager.tsx         # Wallpaper preset selector and custom image uploader
```

---

## 3. SUBSYSTEM IMPLEMENTATION & ARCHITECTURE DETAILS

### 1. YouTube & Audio Engine (`useYouTubePlayer.ts`)
- **IFrame Mounting & Isolation:**
  - A hidden `<div>` with an autogenerated ID (`yt-player-${random}`) is mounted in `App.tsx` positioned off-screen (`fixed -top-[9999px] -left-[9999px] w-12 h-12 opacity-[0.001] pointer-events-none`).
  - The component is **never unmounted** when switching between `focus-hub`, `full-lyrics`, or `catalog` views, guaranteeing uninterrupted playback.
  - The YouTube IFrame API script (`https://www.youtube.com/iframe_api`) is injected once dynamically.
- **Time & State Polling Mechanism:**
  - Standard YouTube player `onStateChange` callbacks can be delayed by browser throttling. To maintain accuracy, a `100ms` `window.setInterval` polls `player.getPlayerState()`, `player.getCurrentTime()`, `player.getDuration()`, and `player.getPlaybackRate()`.
  - When playing (`state === 1`), time updates are routed into the decoupled **60–120 FPS Timing Engine** (`useSmoothTime.ts`).
  - When the player encounters clock drift ($>350\text{ ms}$ delta between estimated system time and YouTube player clock), it applies a smooth $120\text{ ms}$ sine ease-out interpolation (`lerp`) rather than jarringly jumping frames.
- **Autoplay & Volume Management:**
  - If a user triggers a song change, `player.loadVideoById(videoId)` is called if playback was already initiated; otherwise `player.cueVideoById(videoId)` prepares the track.
  - Initial volume is set to 85%. Volume changes mutate the player directly via `player.setVolume(val)` and show the floating `AppleHud`.

### 2. Synced Lyrics Engine (`lrclib.ts`, `cleanTitle.ts`, `lrcParser.ts`, `LyricsView.tsx`, `LyricLine.tsx`)
- **Title Cleaning RegEx Pipeline (`cleanTitle`):**
  1. Strips channel suffixes (`- Topic`, `VEVO`, `Official Channel`).
  2. Strips bracketed noise tags: `[Official Music Video]`, `(Lyrics)`, `[4K 60FPS]`, `(Prod. by...)`, `[Visualizer]`, etc.
  3. Detects `"Artist - Title"` patterns across delimiter variations (`-`, `–`, `—`, `:`).
  4. Strips featured artist markers (`ft.`, `feat.`) to generate a primary query and up to 4 fallback query variations.
- **LRCLIB Search & Auto-Selection:**
  - Executes `https://lrclib.net/api/search?q=${encodeURIComponent(query)}` with an 8-second `AbortController` timeout.
  - Automatically filters candidates with `Boolean(track.syncedLyrics && track.syncedLyrics.trim().length > 0)`.
  - If the YouTube track duration is known, it sorts candidates by minimal duration delta (`Math.abs(track.duration - ytDuration)`), immediately selecting the closest synced track without blocking on strict title equality.
- **Parsing & Syllable Support (`lrcParser`):**
  - Parses standard timestamps `[mm:ss.xx]` and Enhanced LRC syllable markers `<mm:ss.xx>`.
  - Computes exact `startTime` and `endTime` for every line and individual syllable token.
- **Rendering & Optical Depth-of-Field Blur (`LyricLine` & `LyricsView`):**
  - **Active Line (`distance === 0`):** Pure white (`text-white`), bold (`font-bold`), large (`text-3xl sm:text-4xl lg:text-[42px]`), sharp (`filter: none`), line height `leading-[1.25]`. Word-by-word progress is filled via CSS variable `--p` text clipping gradient.
  - **Inactive Lines (`distance >= 1`):** Substantially scaled down (`text-xl sm:text-2xl lg:text-[23px]`, ~55% of active line) with progressive optical blur:
    - Distance 1: `lyric-blur-1` ($1.8\text{ px}$ blur), `text-white/40`.
    - Distance 2: `lyric-blur-2` ($2.8\text{ px}$ blur), `text-white/25`.
    - Distance $\ge 3$: `lyric-blur-3` ($3.8\text{ px}$ blur), `text-white/15`.
  - **Interactive Hover:** Hovering over any line smoothly removes blur (`blur: 0px`), raises opacity to `text-white`, and allows single-click seeking.
- **Scroll Behavior:**
  - Programmatic centering uses `activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
  - Native scrolling remains unlocked (`overscroll-contain`, `no-scrollbar`), allowing user exploration without fighting the player.

### 3. Focus Timer / Pomodoro Engine (`useFocusTimer.ts`)
- **Anti-Throttling Architecture:**
  - Avoids simple tick-decrementing intervals (`remaining - 1`), which freeze when tabs are backgrounded.
  - Records target timestamp: `endTime = Date.now() + remainingSeconds * 1000`.
  - Every 250ms tick computes: `Math.max(0, Math.round((endTime - Date.now()) / 1000))`. This guarantees 100% time accuracy across background tab sleeps.
- **Modes Supported:**
  - `Focus`: 25 minutes ($1500\text{ s}$).
  - `Short Break`: 5 minutes ($300\text{ s}$).
  - `Long Break`: 15 minutes ($900\text{ s}$).
- **Audio Chime Synthesis (`AudioContext`):**
  - Synthesizes a clean two-tone chime without external audio assets.
  - **Tone 1:** Sine oscillator at $587.33\text{ Hz}$ (D5) with exponential decay over $0.9\text{ s}$.
  - **Tone 2:** Staggered ($+160\text{ ms}$) Sine oscillator at $880.00\text{ Hz}$ (A5) with exponential decay over $1.2\text{ s}$.
- **Browser Notifications:** Automatically triggers `new Notification(...)` when the timer reaches `00:00`.

### 4. Vietnam Train Journey Module (`TrainJourney.tsx`, `trainStations.ts`, `Background.tsx`)
- **Station Dataset & Routing:**
  - 9 major North-South stations: Hà Nội (HAN, km 0), Ninh Bình (NBI, km 115), Vinh (VIN, km 319), Huế (HUE, km 688), Đà Nẵng (DAN, km 791), Quy Nhơn (QNH, km 1096), Nha Trang (NTR, km 1315), Phan Thiết (PTH, km 1551), Sài Gòn (SGO, km 1726).
  - Stored in `localStorage` (`ytlyrics_train_journey`). Default route: Hà Nội $\rightarrow$ Đà Nẵng.
  - Prevents identical station selection by automatically swapping endpoints.
- **5-Step Flight-Inspired Booking Flow (`TrainBookingFlow.tsx`):**
  - **State Machine:** Governed by `JourneyStep = 'ROUTE' | 'CABIN' | 'TICKET' | 'DEPART' | 'ACTIVE'`.
  - **Step 1 (ROUTE):** Handcrafted SVG map of Vietnam's S-curve with the 9 North-South stations (HAN to SGO), hairline track (`stroke-white/15` dashed), active segment highlight (`url(#routeGradient)`), destination carousel, distance delta (`Δ km`), and estimated focus sessions.
  - **Step 2 (CABIN):** Blueprint layout of Reunification Sleeper Coach (Toa Giường Nằm Khoang 4 - Toa 03), corridor on left, 4 compartments with 4 berths each (2 Lower, 2 Upper), inline focus intent selector (`💻 Lập trình`, `📚 Học tập`, `✍️ Viết lách`, `📖 Đọc sách`, `🧘 Thiền định`).
  - **Step 3 (TICKET):** Centered digital boarding pass (Apple Wallet aesthetic) with 3-letter codes (`HAN` ➔ `DAN`), perforated tear-line cutout notches, details grid, and handcrafted SVG barcode strip.
  - **Step 4 (DEPART):** Pre-departure gate announcement (*"Cửa toa đã đóng. Tàu sẵn sàng khởi hành."*), central pill CTA (`"Khởi hành (GO)"`) unblocking Web AudioContext, activating `povtrain.mp4` video, starting the timer, and syncing the intent to `TaskManager`.
  - **Step 5 (ACTIVE):** Active trip HUD in `TrainJourney.tsx` displaying remaining time (`mm:ss`), dynamically decreasing remaining distance (`km`), and advancing train notch (`🚂`).
- **POV Video Handling & Synchronization:**
  - Asset located at `public/povtrain.mp4` ($87\text{ MB}$, converted from ProRes/QuickTime to web-optimized H.264 MP4).
  - Referenced safely via `${(import.meta as any).env?.BASE_URL || './'}povtrain.mp4`.
  - Embedded via `<video ref={videoRef} src={videoSrc} loop muted playsInline />`.
  - **Playback Sync:** Controlled via `useEffect` tracking `focusTimer.isRunning`:
    - `isRunning === true` $\rightarrow$ `videoRef.current.play()`.
    - `isRunning === false` $\rightarrow$ `videoRef.current.pause()`.
    - Fallback: Gracefully switches to dynamic wallpapers if video fails to load (`onError`).
- **Progress Tracking:**
  - Route completion is directly calculated from the focus timer:
    $$\text{Progress \%} = \min\left(100, \max\left(0, \frac{\text{totalDuration} - \text{remainingSeconds}}{\text{totalDuration}} \times 100\right)\right)$$
  - Real-time remaining distance:
    $$\text{remainingKm} = \max\left(0, \text{totalDistance} \times \left(1 - \frac{\text{Progress}}{100}\right)\right)$$

### 5. Auxiliary Features
- **Task Manager (`TaskManager.tsx`):**
  - Manages items with `{ id, text, completed, createdAt }`.
  - Persisted in `localStorage` under `ytlyrics_tasks` and active task ID under `ytlyrics_active_task_id`.
  - Displays the active task directly below the circular timer ring with a one-click completion toggle.
- **Ambient White Noise Mixer (`useAmbientSounds.ts`):**
  - 100% procedural Web Audio synthesis across 5 channels:
    1. **Rain:** Pink noise buffer + Bandpass ($800\text{ Hz}$) + Highpass ($400\text{ Hz}$).
    2. **Campfire:** Low-rumble noise buffer + random non-periodic crackle burst generator.
    3. **Ocean Waves:** White noise + Biquad Lowpass filter modulated by a low-frequency oscillator (LFO at $0.08\text{ Hz}$, $12\text{ s}$ surge cycle).
    4. **Deep Brown Noise:** Integrated Brownian 6dB/octave low-frequency rumble.
    5. **Night Forest:** Ambient filtered breeze + high-frequency random chirp generator.
  - Can play concurrently with YouTube music. Channel volumes are stored in `ytlyrics_ambient_volumes`.
- **Wallpaper Storage & Dynamic Lighting (`wallpaperStorage.ts`, `Background.tsx`):**
  - High-res custom wallpapers uploaded by users are stored as Blobs in `IndexedDB` (`ytlyrics_wallpaper_db`) to prevent `localStorage` $5\text{ MB}$ quota exceptions.
  - Default background uses Apple Music living artwork: 3 multi-point radial blur orbs ($110\text{ px} - 130\text{ px}$ Gaussian blur) with GPU-accelerated drift keyframes (`animate-ambient-1`, `animate-ambient-2`) blended with YouTube artwork spill (`scale-150`, `blur-[95px]`, `mix-blend-screen`).

---

## 4. KNOWN BUGS, RUNTIME GLITCHES & TECHNICAL DEBT

1. **Browser Autoplay Gate (User Gesture Requirement):**
   - Under Chrome/Safari Autoplay Policy, initiating music or ambient sounds on fresh page load without prior user click will trigger a silent promise rejection or pause until the first interaction.
2. **Video Asset Weight ($87\text{ MB}$ `povtrain.mp4`):**
   - While `povtrain.mp4` resides in `public/` and serves reliably on local environments and GitHub Pages, on low-bandwidth mobile connections it can take several seconds to stream. A compressed $1080\text{p}/720\text{p}$ version ($\approx 15-20\text{ MB}$) would improve initial load times.
3. **LRCLIB Rate Limits:**
   - LRCLIB is a shared public API. If a user pastes several YouTube URLs in rapid succession, searches could theoretically hit HTTP 429. An exponential backoff in `searchLrclib` is recommended if high volume is anticipated.
4. **YouTube IFrame Restricted Embeds (Code 101 / 150):**
   - Certain music publishers (e.g., Sony Music Japan, specific VEVO releases) disallow third-party embedded playback. The player catches this via `onError` and displays an explicit toast notification, but cannot override YouTube's server-side licensing block.
5. **Redundant Unused Packages:**
   - `framer-motion` is listed in `package.json` dependencies but minimal animations are currently delegated to native Tailwind CSS / GPU keyframes. It can either be leveraged for route transitions or uninstalled to shave $\approx 35\text{ KB}$ off the production bundle.

---

## 5. NEXT PLANNED DELIVERABLES

1. **Syllable-Accurate Karaoke Glow:**
   - Further refine word-level animation easing for Vietnamese diacritics and fast tempo tracks.
2. **Train Station Milestones Overlay:**
   - Introduce subtle milestone toasts as the train reaches intermediate stations (e.g. *"Tàu đã đi qua Ga Huế • 688 km"*).
3. **Offline Audio Caching (PWA / Service Worker):**
   - Register a lightweight Service Worker to cache procedural ambient sound buffers and static presets for complete offline focus sessions.
4. **Spotify / Apple Music URL Importer:**
   - Add a resolver converting Spotify/Apple Music share links into YouTube IDs via search matching.
