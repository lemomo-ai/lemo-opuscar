# Hybrid 2D/3D Render Engine

A high-performance hybrid rendering pipeline combining 3D perspective projection, G-buffer cel-shading, ink outlines, and procedural toon animation. Directly integrates with FFmpeg for streaming video generation outputting iOS-playable H.264/AAC vertical format (720x1280 or 1080x1920) videos.

## Core Modules

- **`build.py`**: `HybridPipeline` orchestrates resolution, focal length, camera controllers, canvas rasterization, and direct FFmpeg pipe streaming (`libx264`, `yuv420p`, high profile 4.1, `+faststart`).
- **`whoa_stage.py`**: Stage environments and episode-specific 3D props:
  - **The Great Emu War**: 3D field-tripod mounted Lewis Mk I light machine gun (with muzzle flash starburst, smoke, recoil, and flying brass casings), running Outback emu silhouettes, eucalyptus trees, ranch fences, and ammo crates.
  - **Eiffel Tower Con**: Eiffel Tower lattice truss with iron cross-girders, scrap dealer cart with discarded steel beams, and oxy-acetylene cutting blowtorch with spark shower.
  - **London Beer Flood (1814)**: St. Giles Georgian brick brewery streetscape, ruptured 22-foot fermentation vat with burst iron hoops, floating oak beer barrels, and turbulent porter wave flood with creamy stout foam crests.
  - **Roman Beach**: Sandy shore, cliffs, animated waves, and sea shells.
- **`toon_cast.py`**: Stylized cartoon character rasterizer with expressive gestures, animated walking cycles, slouch hats, and accessories (aiming machine gun, binoculars, beer tankards).
- **`render_emu_war.py`**: Full episode director script combining `build.py`, `whoa_stage.py`, and `toon_cast.py` with multi-track audio mixing (`emu_voice.mp3` + `foley_emu_war.wav`).

## Quick Start

### 1. Fast Preview Render (15 fps, 10s)
```bash
python3 render_emu_war.py --fast --out preview.mp4
```

### 2. Full Episode Production Render (30 fps, 35.5s)
```bash
python3 render_emu_war.py --fps 30 --duration 35.5 --out emu_war_episode.mp4
```

The resulting MP4 files are optimized for Apple iOS QuickTime / Safari / Photos as well as web distribution.
