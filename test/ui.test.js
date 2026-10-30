const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Game2048 } = require('../src/game.js');
const { SoundController } = require('../src/audio.js');
const { GameUI } = require('../src/ui.js');

// Minimal mock DOM for testing UI lifecycle
function createMockElement(id = '', tag = 'div') {
  const children = [];
  const classList = new Set();
  const listeners = {};
  let _innerHTML = '';

  const elem = {
    id,
    tagName: tag.toUpperCase(),
    children,
    textContent: '',
    value: '',
    style: {},
    disabled: false,
    get innerHTML() { return _innerHTML; },
    set innerHTML(val) {
      _innerHTML = val;
      if (val === '') children.length = 0;
    },
    get firstChild() { return children[0] || null; },
    removeChild: (child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    },
    classList: {
      add: (c) => classList.add(c),
      remove: (c) => classList.delete(c),
      contains: (c) => classList.has(c)
    },
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    dispatchEvent: (event) => {
      const handlers = listeners[event] || [];
      handlers.forEach(h => h({ type: event, preventDefault: () => {} }));
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    querySelector: () => ({ textContent: '' }),
    closest: (selector) => {
      if (selector === '.tile') return elem;
      return null;
    },
    remove: function() {
      // noop
    }
  };
  return elem;
}

describe('GameUI Lifecycle & Startup', () => {
  test('automatically starts game and renders 2 initial tiles without user action', () => {
    // Setup mock global environment
    const elements = {
      'board-wrapper': createMockElement('board-wrapper'),
      'tile-container': createMockElement('tile-container'),
      'score-value': createMockElement('score-value'),
      'best-score-value': createMockElement('best-score-value'),
      'score-addition': createMockElement('score-addition'),
      'undo-btn': createMockElement('undo-btn'),
      'new-game-btn': createMockElement('new-game-btn'),
      'sound-toggle-btn': createMockElement('sound-toggle-btn'),
      'theme-select': createMockElement('theme-select'),
      'game-overlay': createMockElement('game-overlay'),
      'overlay-title': createMockElement('overlay-title'),
      'overlay-message': createMockElement('overlay-message'),
      'overlay-action-btn': createMockElement('overlay-action-btn'),
      'overlay-secondary-btn': createMockElement('overlay-secondary-btn'),
      'jackpot-banner': createMockElement('jackpot-banner'),
      'dpad-up': createMockElement('dpad-up'),
      'dpad-down': createMockElement('dpad-down'),
      'dpad-left': createMockElement('dpad-left'),
      'dpad-right': createMockElement('dpad-right')
    };

    global.document = {
      getElementById: (id) => elements[id] || null,
      createElement: (tag) => createMockElement('', tag),
      body: {
        classList: {
          add: () => {},
          remove: () => {}
        }
      }
    };

    const windowListeners = {};
    global.window = {
      addEventListener: (event, handler) => {
        if (!windowListeners[event]) windowListeners[event] = [];
        windowListeners[event].push(handler);
      },
      dispatchEvent: (event, payload = {}) => {
        const handlers = windowListeners[event] || [];
        handlers.forEach(h => h({ type: event, preventDefault: () => {}, ...payload }));
      }
    };

    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };

    const game = new Game2048(4, 2048);
    const sound = new SoundController();
    const ui = new GameUI(game, sound);

    // Verify 2 tiles were automatically spawned and rendered on init
    assert.strictEqual(elements['tile-container'].children.length, 2, 'Must automatically spawn 2 initial tiles on startup');
    assert.strictEqual(ui.game.getAvailableCells().length, 14, 'Must have 14 available cells left out of 16');

    // Test clicking "New Game"
    elements['new-game-btn'].dispatchEvent('click');
    assert.strictEqual(elements['tile-container'].children.length, 2, 'New Game must reset and render 2 fresh tiles');

    // Verify only 2 or 4 tiles are present in new game
    const tiles = ui.game.getAllTiles();
    assert.strictEqual(tiles.length, 2);
    tiles.forEach(tile => {
      assert.ok(tile.value === 2 || tile.value === 4, `Initial tile value must be 2 or 4, got ${tile.value}`);
    });

    // Verify grid alignment formula (no division by 4)
    const pos = ui.getTilePositionCSS(1, 2);
    assert.strictEqual(pos, 'translate(calc(1 * (100% + var(--grid-gap))), calc(2 * (100% + var(--grid-gap))))');

    // Test clicking a tile expands it (grows by 3px on all sides via .tile-expanded class)
    const firstTileElem = elements['tile-container'].children[0];
    assert.strictEqual(firstTileElem.classList.contains('tile-expanded'), false);
    ui.handleTileClick(firstTileElem);
    assert.strictEqual(firstTileElem.classList.contains('tile-expanded'), true, 'Tile must have tile-expanded class when clicked');
    ui.handleTileClick(firstTileElem);
    assert.strictEqual(firstTileElem.classList.contains('tile-expanded'), false, 'Clicking again toggles expansion off');

    // Test mouse swipe / drag across the board
    elements['board-wrapper'].dispatchEvent('mousedown', { button: 0, clientX: 50, clientY: 100 });
    global.window.dispatchEvent('mousemove', { clientX: 180, clientY: 100 });
    global.window.dispatchEvent('mouseup', { clientX: 180, clientY: 100 });
    // Mouse drag of +130px on X triggers right move
  });
});
