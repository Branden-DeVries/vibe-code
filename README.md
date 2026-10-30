# 2048 Game (JavaScript)

A modern, responsive, and fully featured clone of the classic **2048** puzzle game built with pure vanilla JavaScript, HTML5, and CSS3.

![2048 Game](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)

---

## 🎮 Play & Controls

### Objective
Slide numbered tiles on a 4×4 grid. When two tiles with the same number collide, they merge into one with double the value. Reach the **2048** tile to win! You can also continue playing for higher scores after reaching 2048.

### Controls
| Action | Key / Gesture |
| :--- | :--- |
| **Move Up** | <kbd>↑</kbd> or <kbd>W</kbd> or <kbd>K</kbd> or Drag / Swipe Up |
| **Move Down** | <kbd>↓</kbd> or <kbd>S</kbd> or <kbd>J</kbd> or Drag / Swipe Down |
| **Move Left** | <kbd>←</kbd> or <kbd>A</kbd> or <kbd>H</kbd> or Drag / Swipe Left |
| **Move Right** | <kbd>→</kbd> or <kbd>D</kbd> or <kbd>L</kbd> or Drag / Swipe Right |
| **Undo Move** | <kbd>U</kbd> or <kbd>Ctrl+Z</kbd> / <kbd>Cmd+Z</kbd> or Click **Undo** |
| **New Game** | <kbd>R</kbd> or <kbd>N</kbd> or Click **New Game** |
| **Mute/Unmute** | <kbd>M</kbd> or Click Sound Icon (🔊/🔇) |
| **On-screen D-Pad** | Click ▲ / ◀ / ▼ / ▶ buttons |
| **Click Tile** | Click any tile to expand it by 3px on all sides |

---

## ✨ Features

- **Smooth CSS Animations**: Accurate tile sliding, spawn pop-in, and merge pulse effects.
- **Synthesized Sound Effects**: Built-in audio using the Web Audio API (zero external sound files needed). Includes move whooshes, harmonic merge chimes, fanfare on 2048, and game over sounds.
- **🚨 Siren & Jackpot Milestone Audio**: Triggers a dual-tone wailing siren and rapid casino slot-machine jackpot bell/coin cascade celebration whenever you unlock a new highest tile value!
- **Undo History**: Made a misstep? Revert your previous moves with snapshot history.
- **Multiple Color Themes**:
  - **Classic**: The original warm 2048 palette.
  - **Dark**: Low-light eye-friendly theme.
  - **Cyberpunk**: High-contrast neon cyan & magenta theme.
- **Game State & Best Score Persistence**: Automatically saves your board state and high score in `localStorage`.
- **Mobile & Touch Friendly**: Seamless swipe gestures with scroll-locking on the board.
- **Modular Code Architecture**: Clean separation between core logic, audio, and UI rendering.
- **Full Unit Test Suite**: Comprehensive tests covering sliding, merging, win detection, game over detection, undo, and state serialization.

---

## 📁 Project Structure

```text
feature-2048-js/
├── index.html           # Main HTML5 game interface
├── css/
│   └── style.css        # Responsive styling, CSS Grid, themes & animations
├── src/
│   ├── game.js          # Core 2048 engine (grid, vectors, merges, undo)
│   ├── audio.js         # Web Audio API sound synthesizer
│   └── ui.js            # UI controller, event listeners & DOM updates
├── test/
│   └── game.test.js     # Unit test suite using Node.js test runner
├── package.json         # Project metadata and test scripts
└── README.md            # Documentation
```

---

## 🚀 Running the Game

You can run the game directly in any web browser without needing any build tools!

### Option 1: Open Directly
Double-click [`index.html`](index.html) or open it in your browser:
```bash
open index.html # On macOS
```

### Option 2: Run Local Server
Using npm:
```bash
npm start
```
Or with Python:
```bash
python3 -m http.server 8080
```
Then visit: [http://localhost:8080](http://localhost:8080)

---

## 🧪 Running Tests

Run the test suite using Node's built-in test runner:
```bash
npm test
```
All 13 test cases across sliding rules, merges, vector movements, win/loss states, and serialization will execute.
