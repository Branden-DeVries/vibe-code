/**
 * 2048 Game Engine
 * Fully featured game logic with tile tracking, vector movement,
 * undo support, win/loss detection, and state serialization.
 */

class Tile {
  constructor(x, y, value, id) {
    this.x = x; // column (0..size-1)
    this.y = y; // row (0..size-1)
    this.value = value;
    this.id = id;
    this.previousPosition = null;
    this.mergedFrom = null; // [tile1, tile2]
    this.isNew = true;
  }

  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }

  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }

  clone() {
    const t = new Tile(this.x, this.y, this.value, this.id);
    t.previousPosition = this.previousPosition ? { ...this.previousPosition } : null;
    t.isNew = this.isNew;
    return t;
  }
}

class Game2048 {
  constructor(size = 4, target = 2048) {
    this.size = size;
    this.target = target;
    this.grid = []; // 2D array of Tile or null
    this.score = 0;
    this.bestScore = 0;
    this.moveCount = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.tileIdCounter = 1;
    this.history = [];
    this.maxHistory = 15;
    this.init();
  }

  /**
   * Initializes a new clean game.
   */
  init() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.moveCount = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.history = [];
    this.tileIdCounter = 1;
    this.maxTile = 0;

    this.spawnTile();
    this.spawnTile();
    this.maxTile = this.getMaxTileValue();
  }

  /**
   * Returns the highest tile value currently on the board.
   */
  getMaxTileValue() {
    let max = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] && this.grid[r][c].value > max) {
          max = this.grid[r][c].value;
        }
      }
    }
    return max;
  }

  createEmptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  /**
   * Helper to return numeric values representation (e.g. for simple checks or test asserts)
   */
  getGridValues() {
    return this.grid.map(row => row.map(tile => (tile ? tile.value : 0)));
  }

  /**
   * Manually sets board values (primarily for tests)
   */
  setState(matrix, score = 0, won = false, over = false) {
    this.grid = this.createEmptyGrid();
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = matrix[r][c];
        if (val > 0) {
          const tile = new Tile(c, r, val, this.tileIdCounter++);
          tile.isNew = false;
          this.grid[r][c] = tile;
        }
      }
    }
    this.score = score;
    this.won = won;
    this.over = over;
    this.maxTile = this.getMaxTileValue();
  }

  /**
   * Returns list of empty cell coordinates { x, y }
   */
  getAvailableCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          cells.push({ x: c, y: r });
        }
      }
    }
    return cells;
  }

  /**
   * Spawns a new tile at a random empty cell.
   * 90% chance of 2, 10% chance of 4.
   */
  spawnTile() {
    const available = this.getAvailableCells();
    if (available.length === 0) return null;

    const index = Math.floor(Math.random() * available.length);
    const cell = available[index];
    const value = Math.random() < 0.9 ? 2 : 4;
    const tile = new Tile(cell.x, cell.y, value, this.tileIdCounter++);
    this.grid[cell.y][cell.x] = tile;
    return tile;
  }

  /**
   * Prepare tiles for movement: save previous positions and clear merge flags.
   */
  prepareTiles() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (tile) {
          tile.mergedFrom = null;
          tile.savePosition();
          tile.isNew = false;
        }
      }
    }
  }

  /**
   * Save snapshot to undo history.
   */
  saveSnapshot() {
    const gridSnapshot = this.grid.map(row =>
      row.map(tile => (tile ? tile.clone() : null))
    );
    this.history.push({
      grid: gridSnapshot,
      score: this.score,
      moveCount: this.moveCount,
      won: this.won,
      over: this.over,
      tileIdCounter: this.tileIdCounter,
      maxTile: this.maxTile
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Reverts to previous move.
   */
  undo() {
    if (this.history.length === 0) return false;
    const state = this.history.pop();
    this.grid = state.grid.map(row =>
      row.map(tile => (tile ? tile.clone() : null))
    );
    this.score = state.score;
    this.moveCount = state.moveCount;
    this.won = state.won;
    this.over = state.over;
    this.tileIdCounter = state.tileIdCounter;
    this.maxTile = state.maxTile !== undefined ? state.maxTile : this.getMaxTileValue();
    return true;
  }

  canUndo() {
    return this.history.length > 0;
  }

  /**
   * Direction vectors for movement
   */
  getVector(direction) {
    const map = {
      up: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }
    };
    return map[direction] || null;
  }

  buildTraversals(vector) {
    const traversals = { x: [], y: [] };
    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }

  findFarthestPosition(cell, vector) {
    let previous;
    let current = { x: cell.x, y: cell.y };

    do {
      previous = current;
      current = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.withinBounds(current) && !this.grid[current.y][current.x]);

    return {
      farthest: previous,
      next: current
    };
  }

  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }

  /**
   * Main movement method
   */
  move(direction) {
    if (this.over) return { moved: false, reason: 'game_over' };

    const vector = this.getVector(direction);
    if (!vector) return { moved: false, reason: 'invalid_direction' };

    const traversals = this.buildTraversals(vector);
    let moved = false;
    let scoreAdded = 0;
    let justWon = false;
    const mergedTiles = [];

    // Save snapshot of current board before preparing and shifting
    this.saveSnapshot();
    this.prepareTiles();

    traversals.y.forEach(y => {
      traversals.x.forEach(x => {
        const tile = this.grid[y][x];
        if (tile) {
          const positions = this.findFarthestPosition({ x, y }, vector);
          const nextTile = this.withinBounds(positions.next)
            ? this.grid[positions.next.y][positions.next.x]
            : null;

          if (nextTile && nextTile.value === tile.value && !nextTile.mergedFrom) {
            // Merge condition
            const merged = new Tile(
              positions.next.x,
              positions.next.y,
              tile.value * 2,
              this.tileIdCounter++
            );
            merged.mergedFrom = [tile, nextTile];

            this.grid[positions.next.y][positions.next.x] = merged;
            this.grid[tile.y][tile.x] = null;

            tile.updatePosition(positions.next);

            scoreAdded += merged.value;
            mergedTiles.push(merged);

            // Win check
            if (merged.value >= this.target && !this.won && !this.keepPlaying) {
              this.won = true;
              justWon = true;
            }

            moved = true;
          } else {
            // Normal slide to farthest empty cell
            if (positions.farthest.x !== tile.x || positions.farthest.y !== tile.y) {
              this.grid[positions.farthest.y][positions.farthest.x] = tile;
              this.grid[tile.y][tile.x] = null;
              tile.updatePosition(positions.farthest);
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      this.moveCount++;
      this.score += scoreAdded;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
      }

      let isNewHighTile = false;
      let newHighTileValue = this.maxTile;

      for (const m of mergedTiles) {
        if (m.value > this.maxTile) {
          isNewHighTile = true;
          this.maxTile = m.value;
          newHighTileValue = m.value;
        }
      }

      const newTile = this.spawnTile();

      if (!this.hasAvailableMoves()) {
        this.over = true;
      }

      return {
        moved: true,
        scoreAdded,
        score: this.score,
        bestScore: this.bestScore,
        won: justWon,
        over: this.over,
        newTile,
        mergedTiles,
        isNewHighTile,
        newHighTileValue
      };
    } else {
      // Discard snapshot since no move actually occurred
      this.history.pop();
      return { moved: false };
    }
  }

  /**
   * Pure line sliding helper for verification & compatibility
   */
  static slideLine(line) {
    const nonZero = line.filter(val => val !== 0);
    const result = [];
    let score = 0;
    let merged = false;

    for (let i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        result.push(mergedVal);
        score += mergedVal;
        merged = true;
        i++;
      } else {
        result.push(nonZero[i]);
      }
    }

    while (result.length < line.length) {
      result.push(0);
    }

    return { line: result, score, merged };
  }

  /**
   * Checks if moves or merges are possible
   */
  hasAvailableMoves() {
    if (this.getAvailableCells().length > 0) return true;

    // Check horizontal adjacent
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        if (this.grid[y][x].value === this.grid[y][x + 1].value) return true;
      }
    }

    // Check vertical adjacent
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size - 1; y++) {
        if (this.grid[y][x].value === this.grid[y + 1][x].value) return true;
      }
    }

    return false;
  }

  /**
   * Allows continuing past 2048
   */
  continueGame() {
    this.keepPlaying = true;
    this.won = false;
  }

  /**
   * Returns a clean flat list of active tiles for the UI to render
   */
  getAllTiles() {
    const tiles = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (tile) {
          tiles.push(tile);
          if (tile.mergedFrom) {
            tile.mergedFrom.forEach(sourceTile => tiles.push(sourceTile));
          }
        }
      }
    }
    return tiles;
  }

  /**
   * Serialize game state to JSON for localStorage
   */
  serialize() {
    return JSON.stringify({
      size: this.size,
      target: this.target,
      grid: this.getGridValues(),
      score: this.score,
      bestScore: this.bestScore,
      moveCount: this.moveCount,
      won: this.won,
      over: this.over,
      keepPlaying: this.keepPlaying,
      maxTile: this.maxTile
    });
  }

  /**
   * Restore game state from JSON
   */
  deserialize(jsonStr) {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!data || !Array.isArray(data.grid)) return false;

      this.size = data.size || 4;
      this.target = data.target || 2048;
      this.score = data.score || 0;
      this.bestScore = data.bestScore || 0;
      this.moveCount = data.moveCount || 0;
      this.won = Boolean(data.won);
      this.over = Boolean(data.over);
      this.keepPlaying = Boolean(data.keepPlaying);
      this.maxTile = data.maxTile || 0;
      this.history = [];

      this.grid = this.createEmptyGrid();
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const val = data.grid[r][c];
          if (val > 0) {
            const tile = new Tile(c, r, val, this.tileIdCounter++);
            tile.isNew = false;
            this.grid[r][c] = tile;
          }
        }
      }
      if (!this.maxTile) this.maxTile = this.getMaxTileValue();
      return true;
    } catch {
      return false;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game2048, Tile };
}
