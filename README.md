# 🏫 Mahtabrai U.M. Vidyalaya — 3D School Explorer

A fully playable 3D school exploration game built with Three.js and Vite.

## 🚀 Quick Start

```bash
npm install
npm run dev
```
Then open **http://localhost:3000** in your browser.

## 📦 Build for GitHub Pages / Deployment

```bash
npm run build
```
Outputs to `dist/` — upload that folder to any static host.

### Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🎮 Controls

### Desktop
| Key | Action |
|-----|--------|
| W A S D / Arrow Keys | Move |
| Mouse Drag | Look around |
| Click Canvas | Lock mouse (for smooth look) |
| Shift | Run |
| Space | Jump |
| E | Enter / interact with room |
| Escape | Unlock mouse |

### Mobile
- **Left side drag** — Move (virtual joystick)
- **Right side drag** — Look around
- **JUMP button** — Jump
- **RUN button** — Run
- **ENTER button** — Enter room

## 🗺 Campus Map

```
                    [TOP WING: C1 C2 EXAM ROOM C4 C5 TOILET]
                    
[C7]                      [STAGE]                          [C7]
[C6]                                                       [C8]
[C4]              PAVED COURTYARD                          [C9]
[C3]                                                       [C10]
[C2]                                                       [C11]
[C1]   [STAIRWELL]                    [OFFICES][STAIRWELL] [C12]
       [C1 GROUND]
                        [SECOND GATE]
                                             [STAFF HOME]
[GROUND]  [BUS]    PATHWAY               [STAIRWELL]
                                    [RECEPTION][CREATIVE STUDIO]
                        [MAIN GATE]         [GARDEN]
                         MAIN ROAD
```

## ✨ Features

- **24 interactable buildings** — each with a unique room description
- **Animated school uniform character** — walking, running, jumping animations
- **Day/Night cycle** — full 24-hour cycle with dawn, day, dusk, night
- **Ambient sounds** — wind, birds, footsteps, door sounds, jump
- **Real-time minimap** — click to enlarge, shows player position and direction
- **Collision system** — can't walk through walls or buildings
- **Mobile joystick** — correctly oriented (up = forward)
- **Procedural textures** — brick, sandstone, grass, glass, wood, all generated in-engine

## 🛠 Tech Stack

- **Three.js** — 3D rendering
- **Vite** — build tool
- Vanilla JavaScript (no frameworks)

## 📁 File Structure

```
school-game/
├── index.html              — Main HTML
├── package.json            — Dependencies
├── vite.config.js          — Vite config
├── src/
│   ├── main.js             — Entry point
│   ├── style.css           — All styles
│   └── game/
│       ├── game.js         — Main game loop
│       ├── world.js        — Campus builder
│       ├── player.js       — Character + animation
│       ├── input.js        — Keyboard/mouse/touch
│       ├── audio.js        — Sound effects
│       ├── textures.js     — Procedural textures
│       ├── daynight.js     — Day/Night cycle
│       └── minimap.js      — 2D minimap
```
