const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Game2048, Tile } = require('../src/game.js');

describe('Game2048 Engine Tests', () => {
  describe('Initialization', () => {
    test('creates 4x4 grid with 2 starting tiles', () => {
      const game = new Game2048(4);
      let count = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (game.grid[r][c] !== null) count++;
        }
      }
      assert.strictEqual(count, 2);
      assert.strictEqual(game.score, 0);
      assert.strictEqual(game.won, false);
      assert.strictEqual(game.over, false);
    });
  });

  describe('Static SlideLine Pure Function', () => {
    test('merges pair and prevents double merge in one move', () => {
      const res = Game2048.slideLine([2, 2, 2, 2]);
      assert.deepStrictEqual(res.line, [4, 4, 0, 0]);
      assert.strictEqual(res.score, 8);
    });

    test('slides past zeroes correctly', () => {
      const res = Game2048.slideLine([0, 2, 0, 2]);
      assert.deepStrictEqual(res.line, [4, 0, 0, 0]);
      assert.strictEqual(res.score, 4);
    });
  });

  describe('Vector Movement & Merging', () => {
    test('moves left and merges tiles', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 0, 2, 0],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [2, 4, 8, 16]
      ]);

      const res = game.move('left');
      assert.strictEqual(res.moved, true);
      assert.strictEqual(res.scoreAdded, 12); // 4 from [2,0,2] + 8 from [4,4]
      const grid = game.getGridValues();
      assert.strictEqual(grid[0][0], 4);
      assert.strictEqual(grid[1][0], 8);
      assert.strictEqual(grid[3][0], 2);
      assert.strictEqual(grid[3][1], 4);
      assert.strictEqual(grid[3][2], 8);
      assert.strictEqual(grid[3][3], 16);
    });

    test('moves right correctly', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 0, 2, 0],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [2, 4, 8, 16]
      ]);

      const res = game.move('right');
      assert.strictEqual(res.moved, true);
      const grid = game.getGridValues();
      assert.strictEqual(grid[0][3], 4);
      assert.strictEqual(grid[1][3], 8);
    });

    test('moves up correctly', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [4, 0, 0, 0],
        [4, 0, 0, 0]
      ]);

      const res = game.move('up');
      assert.strictEqual(res.moved, true);
      const grid = game.getGridValues();
      assert.strictEqual(grid[0][0], 4);
      assert.strictEqual(grid[1][0], 8);
    });

    test('moves down correctly', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [4, 0, 0, 0],
        [4, 0, 0, 0]
      ]);

      const res = game.move('down');
      assert.strictEqual(res.moved, true);
      const grid = game.getGridValues();
      assert.strictEqual(grid[3][0], 8);
      assert.strictEqual(grid[2][0], 4);
    });

    test('does not move or count when no movement is possible', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2]
      ]);

      const res = game.move('left');
      assert.strictEqual(res.moved, false);
      assert.strictEqual(game.history.length, 0);
    });
  });

  describe('Win and Game Over States', () => {
    test('detects win when reaching 2048', () => {
      const game = new Game2048(4, 2048);
      game.setState([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);

      const res = game.move('left');
      assert.strictEqual(res.won, true);
      assert.strictEqual(game.won, true);
    });

    test('allows continuing after win', () => {
      const game = new Game2048(4, 2048);
      game.setState([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);

      game.move('left');
      assert.strictEqual(game.won, true);

      game.continueGame();
      assert.strictEqual(game.keepPlaying, true);
      assert.strictEqual(game.won, false);
    });

    test('detects game over when board has no moves or merges left', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2]
      ]);

      assert.strictEqual(game.hasAvailableMoves(), false);
    });
  });

  describe('New High Tile Value Detection', () => {
    test('triggers isNewHighTile when a merge exceeds current max tile', () => {
      const game = new Game2048(4);
      game.setState([
        [4, 4, 0, 0],
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);
      assert.strictEqual(game.maxTile, 4);

      const res = game.move('left');
      assert.strictEqual(res.isNewHighTile, true);
      assert.strictEqual(res.newHighTileValue, 8);
      assert.strictEqual(game.maxTile, 8);
    });

    test('does not trigger isNewHighTile when merge is below or equal to current max tile', () => {
      const game = new Game2048(4);
      game.setState([
        [8, 0, 0, 0],
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);
      assert.strictEqual(game.maxTile, 8);

      const res = game.move('left');
      assert.strictEqual(res.isNewHighTile, false);
      assert.strictEqual(game.maxTile, 8);
    });
  });

  describe('Undo System', () => {
    test('can undo moves and restore board & score accurately', () => {
      const game = new Game2048(4);
      game.setState([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ], 100);

      assert.strictEqual(game.canUndo(), false);
      game.move('left');
      assert.strictEqual(game.canUndo(), true);
      assert.strictEqual(game.score, 104);

      const restored = game.undo();
      assert.strictEqual(restored, true);
      assert.strictEqual(game.score, 100);
      const grid = game.getGridValues();
      assert.strictEqual(grid[0][0], 2);
      assert.strictEqual(grid[0][1], 2);
      assert.strictEqual(game.canUndo(), false);
    });
  });

  describe('Serialization & Deserialization', () => {
    test('serializes and restores game state perfectly', () => {
      const game = new Game2048(4);
      game.setState([
        [8, 16, 32, 64],
        [0, 2, 4, 0],
        [0, 0, 0, 0],
        [128, 256, 512, 1024]
      ], 1500);
      game.bestScore = 2000;
      game.moveCount = 42;

      const serialized = game.serialize();
      const restoredGame = new Game2048(4);
      const success = restoredGame.deserialize(serialized);

      assert.strictEqual(success, true);
      assert.strictEqual(restoredGame.score, 1500);
      assert.strictEqual(restoredGame.bestScore, 2000);
      assert.strictEqual(restoredGame.moveCount, 42);
      assert.deepStrictEqual(restoredGame.getGridValues(), game.getGridValues());
    });
  });
});
