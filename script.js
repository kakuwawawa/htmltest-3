class Node {
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.nodes = this.createGrid(width, height);
    }

    createGrid(width, height) {
        const nodes = [];
        for (let x = 0; x < width; x++) {
            nodes[x] = [];
            for (let y = 0; y < height; y++) {
                nodes[x][y] = new Node(x, y);
            }
        }
        return nodes;
    }

    getNode(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.nodes[x][y];
        }
        return null;
    }

    getNeighbors(node) {
        const neighbors = [];
        const { x, y } = node;
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, 
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        for (const direction of directions) {
            const neighbor = this.getNode(x + direction.dx, y + direction.dy);
            if (neighbor && neighbor.walkable) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }
}

function aStar(grid, startNode, endNodes) {
    const openList = [];
    const closedList = new Set();
    openList.push(startNode);
    let endNodeReached = null;

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift();
        if (endNodes.includes(currentNode)) {
            endNodeReached = currentNode;
            break;
        }
        closedList.add(currentNode);

        for (const neighbor of grid.getNeighbors(currentNode)) {
            if (closedList.has(neighbor)) continue;
            const tentativeG = currentNode.g + 1;
            if (!openList.includes(neighbor) || tentativeG < neighbor.g) {
                neighbor.g = tentativeG;
                neighbor.h = Math.min(...endNodes.map(endNode => heuristic(neighbor, endNode)));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = currentNode;
                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                }
            }
        }
    }
    const path = [];
    let temp = endNodeReached;
    while (temp) {
        path.push(temp);
        temp = temp.parent;
    }
    return path.reverse();
}

function heuristic(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('gridSize');
    const gridContainer = document.getElementById('gridContainer');
    let grid;
    let startNode;
    let endNodes = [];
    let isSettingStart = false;
    let isAddingEnd = false;

    const createGridElement = (size) => {
        const backgroundImage = new Image();
        backgroundImage.src = 'background.jpg';
        backgroundImage.onload = () => {
            const width = backgroundImage.width;
            const height = backgroundImage.height;
            const cellWidth = Math.floor(width / size);
            const cellHeight = Math.floor(height / size);

            gridElement.innerHTML = '';
            gridElement.style.gridTemplateColumns = `repeat(${size}, ${cellWidth}px)`;
            gridElement.style.width = `${width}px`;
            gridElement.style.height = `${height}px`;

            grid = new Grid(size, size);
            startNode = grid.getNode(0, 0);
            endNodes = [grid.getNode(size - 1, size - 1)];
            startNode.walkable = true;
            endNodes[0].walkable = true;

            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.style.width = `${cellWidth}px`;
                    cell.style.height = `${cellHeight}px`;
                    const node = grid.getNode(x, y);
                    if (node === startNode) cell.classList.add('start');
                    if (endNodes.includes(node)) cell.classList.add('end');
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        if (isSettingStart) {
                            startNode = node;
                            updateGridClasses(size);
                        } else if (isAddingEnd) {
                            if (endNodes.includes(node)) {
                                endNodes = endNodes.filter(n => n !== node);
                            } else {
                                endNodes.push(node);
                            }
                            updateGridClasses(size);
                        } else if (node !== startNode && !endNodes.includes(node)) {
                            node.walkable = !node.walkable;
                            cell.classList.toggle('wall');
                        }
                    });
                    gridElement.appendChild(cell);
                }
            }
        };
    };

    const updateGridClasses = (size) => {
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const cell = gridElement.children[y * size + x];
                const node = grid.getNode(x, y);
                cell.classList.remove('start', 'end', 'path');
                if (node === startNode) cell.classList.add('start');
                if (endNodes.includes(node)) cell.classList.add('end');
            }
        }
    };

    createGridElement(10); // Default grid size

    gridSizeSelect.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value, 10);
        createGridElement(newSize);
    });

    document.getElementById('startButton').addEventListener('click', () => {
        const path = aStar(grid, startNode, endNodes);
        for (const node of path) {
            const cell = gridElement.children[node.y * grid.width + node.x];
            if (node !== startNode && !endNodes.includes(node)) {
                cell.classList.add('path');
            }
        }
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        createGridElement(parseInt(gridSizeSelect.value, 10));
    });

    gridElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isSettingStart = true;
        } else if (e.touches.length === 2) {
            isAddingEnd = true
