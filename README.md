# YTMusic Apple Lyrics 🎵

A production-ready, 100% client-side web application that transforms any YouTube music link into an Apple Music-style synchronized lyrics player. Designed to run completely serverless, zero API keys required, and ready for instant deployment to **GitHub Pages**.

![YTMusic Apple Lyrics](https://img.shields.io/badge/Status-Production%20Ready-success)
![Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

---

## ✨ Features

- 🎧 **Hidden YouTube Audio Engine:** Seamless playback driven by the official YouTube IFrame Player API (hidden without triggering browser autoplay blockers).
- 📜 **Apple Music Synced Lyrics View:**
  - Vertically scrollable with top and bottom progressive fade masks.
  - Active line highlight: `scale(1.02)`, bold white, crisp focus.
  - Inactive lines with Gaussian depth blur (`filter: blur(2.5px)`), clear on hover.
  - Smooth auto-scrolling with target scroll aligned at 35%-40% of the viewport.
  - Click any lyric to instantly seek playback to that timestamp.
  - Manual scroll detection with "Sync to Current" floating badge.
- 🎨 **Aesthetic Apple Music Interface:**
  - 1:1 cropped square album art container with ambient dynamic glow shadow.
  - Static blurred background using thumbnail with `filter: blur(90px) saturate(1.5) brightness(0.38)` and scale compensation (zero GPU canvas lag).
  - Apple Music playback controls: Play/Pause, Next, Previous, Shuffle, Repeat, and Volume slider.
  - Interactive scrubbing progress bar with elapsed and remaining time.
- ⏱️ **MV Intro Offset Compensator:**
  - Fast `-0.5s`, `+0.5s`, and Reset controls to compensate for music video cinematic intros or dialogues that desync standard LRC files.
  - Detailed fine-tuning popover (`-1.0s`, `-0.1s`, `+0.1s`, `+1.0s`).
- 🔍 **Smart Title Cleaner & LRCLIB Lyrics Engine:**
  - Intelligently strips YouTube clutter: `(Official Music Video)`, `[MV]`, `[HD]`, `4K`, `(Lyrics)`, `ft.`, `feat.`, etc.
  - Queries LRCLIB API client-side to automatically fetch synchronized `.LRC` lyrics.
  - Manual search override and **"Paste Custom .LRC"** modal for rare or custom tracks.
- 🚀 **100% Client-Side & Serverless:**
  - Configured with `base: './'` in `vite.config.ts`.
  - Automated GitHub Actions workflow included for direct deployment to GitHub Pages.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

The output will be created in `./dist/` ready to be served statically or uploaded to any hosting service (GitHub Pages, Cloudflare Pages, Vercel, Netlify).

---

## 🌐 Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In your repository settings, go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and publish the site!

---

## 🔗 URL Sharing

You can share direct links to songs using the `?v=` parameter:
```
https://yourusername.github.io/ytmusic-apple-lyrics/?v=4NRXx6U8ABQ
```

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide React
- **Audio API:** YouTube IFrame Player API
- **Lyrics Source:** LRCLIB.net
- **Metadata API:** NoEmbed.com
