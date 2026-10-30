/**
 * 2048 UI Controller & Renderer
 * Handles DOM updates, smooth tile sliding animations,
 * touch gestures, keyboard bindings, and sound effects.
 */

class GameUI {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;

    // DOM Elements
    this.boardWrapper = document.getElementById('board-wrapper');
    this.tileContainer = document.getElementById('tile-container');
    this.scoreDisplay = document.getElementById('score-value');
    this.bestScoreDisplay = document.getElementById('best-score-value');
    this.scoreAddition = document.getElementById('score-addition');
    this.undoBtn = document.getElementById('undo-btn');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.themeSelect = document.getElementById('theme-select');
    this.overlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayMessage = document.getElementById('overlay-message');
    this.overlayActionBtn = document.getElementById('overlay-action-btn');
    this.overlaySecondaryBtn = document.getElementById('overlay-secondary-btn');
    this.jackpotBanner = document.getElementById('jackpot-banner');

    // D-Pad buttons
    this.dpadUp = document.getElementById('dpad-up');
    this.dpadDown = document.getElementById('dpad-down');
    this.dpadLeft = document.getElementById('dpad-left');
    this.dpadRight = document.getElementById('dpad-right');

    // State
    this.domTiles = new Map(); // id -> HTMLElement
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isMouseDown = false;
    this.mouseStartX = 0;
    this.mouseStartY = 0;
    this.mouseMoved = false;
    this.potentialTile = null;
    this.isMoving = false;
    this.storageKey = '2048_saved_game';
    this.bestScoreKey = '2048_best_score';

    this.init();
  }

  init() {
    this.loadBestScore();
    this.loadTheme();
    this.updateSoundBtn();
    this.setupListeners();

    // Check if saved state exists
    let hasSavedState = false;
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (savedState) {
        hasSavedState = this.game.deserialize(savedState);
        if (this.game.over) {
          hasSavedState = false;
        }
      }
    } catch {
      hasSavedState = false;
    }

    if (!hasSavedState) {
      this.game.init();
    }

    this.clearDomTiles();
    this.render();
  }

  clearDomTiles() {
    if (this.tileContainer) {
      this.tileContainer.innerHTML = '';
      while (this.tileContainer.firstChild) {
        this.tileContainer.removeChild(this.tileContainer.firstChild);
      }
    }
    this.domTiles.clear();
  }

  loadBestScore() {
    try {
      const savedBest = localStorage.getItem(this.bestScoreKey);
      if (savedBest !== null) {
        this.game.bestScore = parseInt(savedBest, 10) || 0;
      }
    } catch {
      this.game.bestScore = 0;
    }
    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = this.game.bestScore;
    }
  }

  saveGame() {
    try {
      localStorage.setItem(this.storageKey, this.game.serialize());
      localStorage.setItem(this.bestScoreKey, this.game.bestScore);
    } catch {
      // LocalStorage safety
    }
  }

  loadTheme() {
    let savedTheme = 'classic';
    try {
      savedTheme = localStorage.getItem('2048_theme') || 'classic';
    } catch {
      savedTheme = 'classic';
    }
    this.setTheme(savedTheme);
    if (this.themeSelect) {
      this.themeSelect.value = savedTheme;
    }
  }

  setTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-cyberpunk');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else if (theme === 'cyberpunk') {
      document.body.classList.add('theme-cyberpunk');
    }
    try {
      localStorage.setItem('2048_theme', theme);
    } catch {
      // LocalStorage safety
    }
  }

  updateSoundBtn() {
    if (this.soundToggleBtn) {
      this.soundToggleBtn.textContent = this.sound.enabled ? '🔊' : '🔇';
      this.soundToggleBtn.title = this.sound.enabled ? 'Mute Sounds' : 'Unmute Sounds';
    }
  }

  setupListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Mouse drag / swipe & click controls on board
    if (this.boardWrapper) {
      this.boardWrapper.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

      // Touch swipe controls on board
      this.boardWrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.boardWrapper.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      this.boardWrapper.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    // Buttons
    if (this.newGameBtn) {
      this.newGameBtn.addEventListener('click', () => this.restartGame());
    }

    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => this.handleUndo());
    }

    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        this.sound.toggleSound();
        this.updateSoundBtn();
      });
    }

    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }

    // D-Pad buttons
    if (this.dpadUp) this.dpadUp.addEventListener('click', () => this.triggerMove('up'));
    if (this.dpadDown) this.dpadDown.addEventListener('click', () => this.triggerMove('down'));
    if (this.dpadLeft) this.dpadLeft.addEventListener('click', () => this.triggerMove('left'));
    if (this.dpadRight) this.dpadRight.addEventListener('click', () => this.triggerMove('right'));

    // Overlay action buttons
    if (this.overlayActionBtn) {
      this.overlayActionBtn.addEventListener('click', () => {
        if (this.game.won && !this.game.keepPlaying) {
          this.game.continueGame();
          this.overlay.classList.remove('active');
        } else {
          this.restartGame();
        }
      });
    }

    if (this.overlaySecondaryBtn) {
      this.overlaySecondaryBtn.addEventListener('click', () => {
        this.restartGame();
      });
    }
  }

  handleKeyDown(e) {
    const key = e.key;
    const handledKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 's', 'a', 'd', 'W', 'S', 'A', 'D',
      'k', 'j', 'h', 'l', 'K', 'J', 'H', 'L'
    ];

    if (handledKeys.includes(key)) {
      e.preventDefault();
      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'k':
        case 'K':
          this.triggerMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
        case 'j':
        case 'J':
          this.triggerMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'h':
        case 'H':
          this.triggerMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
        case 'l':
        case 'L':
          this.triggerMove('right');
          break;
      }
    } else if (key === 'u' || key === 'U' || (e.ctrlKey && key === 'z') || (e.metaKey && key === 'z')) {
      e.preventDefault();
      this.handleUndo();
    } else if (key === 'r' || key === 'R' || key === 'n' || key === 'N') {
      e.preventDefault();
      this.restartGame();
    } else if (key === 'm' || key === 'M') {
      e.preventDefault();
      this.sound.toggleSound();
      this.updateSoundBtn();
    }
  }

  handleMouseDown(e) {
    if (e.button !== 0) return; // Only primary (left) button
    this.isMouseDown = true;
    this.mouseStartX = e.clientX;
    this.mouseStartY = e.clientY;
    this.mouseMoved = false;

    // Check if clicked on a tile
    const target = e.target;
    this.potentialTile = target && target.closest ? target.closest('.tile') : null;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;
    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    if (Math.hypot(dx, dy) > 8) {
      this.mouseMoved = true;
    }
  }

  handleMouseUp(e) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;

    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minSwipeDistance = 30;

    if (Math.max(absDx, absDy) >= minSwipeDistance) {
      // Mouse drag / swipe
      if (absDx > absDy) {
        this.triggerMove(dx > 0 ? 'right' : 'left');
      } else {
        this.triggerMove(dy > 0 ? 'down' : 'up');
      }
    } else if (!this.mouseMoved && this.potentialTile) {
      // Direct click on a tile
      this.handleTileClick(this.potentialTile);
    }

    this.potentialTile = null;
  }

  handleTileClick(tileElement) {
    if (!tileElement) return;
    const wasExpanded = tileElement.classList.contains('tile-expanded');
    // Clear any currently expanded tiles
    this.domTiles.forEach(el => el.classList.remove('tile-expanded'));
    if (!wasExpanded) {
      tileElement.classList.add('tile-expanded');
    }
  }

  handleTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      e.preventDefault();
    }
  }

  handleTouchMove(e) {
    // Prevent screen scroll while swiping game board
    e.preventDefault();
  }

  handleTouchEnd(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const minSwipeDistance = 30;

    if (Math.max(absDx, absDy) > minSwipeDistance) {
      if (absDx > absDy) {
        this.triggerMove(dx > 0 ? 'right' : 'left');
      } else {
        this.triggerMove(dy > 0 ? 'down' : 'up');
      }
    } else if (Math.max(absDx, absDy) < 8) {
      const tile = e.target && e.target.closest ? e.target.closest('.tile') : null;
      if (tile) {
        this.handleTileClick(tile);
      }
    }
  }

  triggerMove(direction) {
    if (this.game.over) return;

    // Reset expanded tile state on move
    this.domTiles.forEach(el => el.classList.remove('tile-expanded'));

    const result = this.game.move(direction);
    if (result.moved) {
      this.sound.playMove();

      if (result.scoreAdded > 0) {
        if (result.isNewHighTile) {
          this.sound.playSirenAndJackpot(result.newHighTileValue);
          this.showJackpotAlert(result.newHighTileValue);
        } else {
          this.sound.playMerge(result.mergedTiles.length > 0 ? result.mergedTiles[0].value : 4);
        }
        this.showScoreAddition(result.scoreAdded);
      }

      this.render();
      this.saveGame();

      if (result.won) {
        this.sound.playWin();
        this.showWinModal();
      } else if (result.over) {
        this.sound.playGameOver();
        this.showGameOverModal();
      }
    }
  }

  showJackpotAlert(value) {
    if (!this.jackpotBanner) return;
    this.jackpotBanner.textContent = `🚨 JACKPOT! New Tile: ${value}! 🎰`;
    this.jackpotBanner.classList.remove('animate');
    void this.jackpotBanner.offsetWidth; // Force reflow
    this.jackpotBanner.classList.add('animate');
  }

  handleUndo() {
    if (this.game.undo()) {
      this.sound.playUndo();
      this.overlay.classList.remove('active');
      this.clearDomTiles();
      this.render();
      this.saveGame();
    }
  }

  restartGame() {
    this.overlay.classList.remove('active');
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Safety
    }
    this.game.init();
    this.clearDomTiles();
    this.render();
    this.saveGame();
  }

  showScoreAddition(added) {
    if (!this.scoreAddition) return;
    this.scoreAddition.textContent = `+${added}`;
    this.scoreAddition.classList.remove('score-addition');
    void this.scoreAddition.offsetWidth; // Reflow to re-trigger animation
    this.scoreAddition.classList.add('score-addition');
  }

  showWinModal() {
    this.overlayTitle.textContent = 'You Win!';
    this.overlayMessage.textContent = 'Congratulations! You reached the 2048 tile!';
    this.overlayActionBtn.textContent = 'Keep Going';
    if (this.overlaySecondaryBtn) {
      this.overlaySecondaryBtn.style.display = 'inline-flex';
      this.overlaySecondaryBtn.textContent = 'New Game';
    }
    this.overlay.classList.add('active');
  }

  showGameOverModal() {
    this.overlayTitle.textContent = 'Game Over!';
    this.overlayMessage.textContent = 'No more moves available. Better luck next time!';
    this.overlayActionBtn.textContent = 'Try Again';
    if (this.overlaySecondaryBtn) {
      this.overlaySecondaryBtn.style.display = 'none';
    }
    this.overlay.classList.add('active');
  }

  getTilePositionCSS(x, y) {
    return `translate(calc(${x} * (100% + var(--grid-gap))), calc(${y} * (100% + var(--grid-gap))))`;
  }

  render() {
    // Update score displays
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.game.score;
    if (this.bestScoreDisplay) this.bestScoreDisplay.textContent = this.game.bestScore;

    // Update Undo button state
    if (this.undoBtn) {
      this.undoBtn.disabled = !this.game.canUndo();
    }

    if (!this.tileContainer) return;

    // Prepare active tiles set
    const activeTileIds = new Set();
    const currentTiles = this.game.getAllTiles();

    // Render or update each tile
    currentTiles.forEach(tile => {
      activeTileIds.add(tile.id);
      let element = this.domTiles.get(tile.id);

      if (!element) {
        element = document.createElement('div');
        element.className = `tile tile-${tile.value > 2048 ? 'super' : tile.value}`;
        if (tile.isNew) {
          element.classList.add('tile-new');
        }
        if (tile.mergedFrom) {
          element.classList.add('tile-merged');
        }

        const inner = document.createElement('div');
        inner.className = 'tile-inner';
        inner.textContent = tile.value;
        element.appendChild(inner);

        // Position
        element.style.transform = this.getTilePositionCSS(tile.x, tile.y);

        element.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleTileClick(element);
        });

        this.tileContainer.appendChild(element);
        this.domTiles.set(tile.id, element);
      } else {
        // Tile already in DOM, slide it to its current position
        const isExpanded = element.classList.contains('tile-expanded');
        element.style.transform = this.getTilePositionCSS(tile.x, tile.y);
        element.className = `tile tile-${tile.value > 2048 ? 'super' : tile.value}`;
        if (tile.mergedFrom) {
          element.classList.add('tile-merged');
        }
        if (isExpanded) {
          element.classList.add('tile-expanded');
        }
        const inner = element.querySelector('.tile-inner');
        if (inner) inner.textContent = tile.value;
      }
    });

    // Remove old tiles not in active board
    this.domTiles.forEach((element, id) => {
      if (!activeTileIds.has(id)) {
        element.remove();
        this.domTiles.delete(id);
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameUI };
}
