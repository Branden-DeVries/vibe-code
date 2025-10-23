class Game2048 {
    constructor() {
        this.gridSize = 6;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameWon = false;
        this.gameOver = false;

        this.gridContainer = document.getElementById('grid-container');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');

        this.init();
    }

    init() {
        this.setupGrid();
        this.setupEventListeners();
        this.newGame();
    }

    setupGrid() {
        // Create grid cells
        this.gridContainer.innerHTML = '';
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gridContainer.appendChild(cell);
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.move('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.move('down');
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.move('left');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.move('right');
            }
        });

        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });

        // Retry button
        document.querySelector('.retry-button').addEventListener('click', () => {
            this.newGame();
        });
    }

    newGame() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.gameWon = false;
        this.gameOver = false;
        this.updateScore();
        this.hideMessage();
        this.tileContainer.innerHTML = '';

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
            return true;
        }
        return false;
    }

    move(direction) {
        if (this.gameOver) return;

        let moved = false;
        const oldGrid = JSON.stringify(this.grid);

        if (direction === 'left') {
            moved = this.moveLeft();
        } else if (direction === 'right') {
            moved = this.moveRight();
        } else if (direction === 'up') {
            moved = this.moveUp();
        } else if (direction === 'down') {
            moved = this.moveDown();
        }

        // Check if the grid actually changed
        if (moved && oldGrid !== JSON.stringify(this.grid)) {
            this.addRandomTile();
            this.render();
            this.updateScore();

            if (this.hasWon() && !this.gameWon) {
                this.gameWon = true;
                this.showMessage('You Win!');
            } else if (this.isGameOver()) {
                this.gameOver = true;
                this.showMessage('Game Over!');
            }
        }
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const originalRow = [...this.grid[row]];
            const newRow = this.slideAndMerge(this.grid[row]);
            this.grid[row] = newRow;
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
                moved = true;
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const originalRow = [...this.grid[row]];
            const reversed = this.grid[row].slice().reverse();
            const newRow = this.slideAndMerge(reversed).reverse();
            this.grid[row] = newRow;
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
                moved = true;
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const originalColumn = [...column];
            const newColumn = this.slideAndMerge(column);
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = newColumn[row];
            }
            if (JSON.stringify(originalColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            for (let row = 0; row < this.gridSize; row++) {
                column.push(this.grid[row][col]);
            }
            const originalColumn = [...column];
            const reversed = column.slice().reverse();
            const newColumn = this.slideAndMerge(reversed).reverse();
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = newColumn[row];
            }
            if (JSON.stringify(originalColumn) !== JSON.stringify(newColumn)) {
                moved = true;
            }
        }
        return moved;
    }

    slideAndMerge(line) {
        // Remove zeros
        let newLine = line.filter(cell => cell !== 0);

        // Merge adjacent equal tiles
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                this.score += newLine[i];
                newLine.splice(i + 1, 1);
            }
        }

        // Fill with zeros
        while (newLine.length < this.gridSize) {
            newLine.push(0);
        }

        return newLine;
    }

    hasWon() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        // Check if there are any empty cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check if any adjacent cells can be merged
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                // Check right
                if (col < this.gridSize - 1 && this.grid[row][col + 1] === current) {
                    return false;
                }
                // Check down
                if (row < this.gridSize - 1 && this.grid[row + 1][col] === current) {
                    return false;
                }
            }
        }

        return true;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
        } else {
            this.bestScoreElement.textContent = this.bestScore;
        }
    }

    showMessage(message) {
        this.gameMessage.querySelector('p').textContent = message;
        this.gameMessage.classList.remove('hidden');
    }

    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }

    render() {
        this.tileContainer.innerHTML = '';

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    tile.textContent = value;

                    const cellSize = (this.tileContainer.offsetWidth - 50) / this.gridSize;
                    const gap = 10;

                    tile.style.left = `${col * (cellSize + gap)}px`;
                    tile.style.top = `${row * (cellSize + gap)}px`;

                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
