import naivePlayer from "../players/naivePlayer";
import { sleep } from "../utils/debugFuncs";
import { Board, Player, Move, Space, Coord, Displayer } from "./types";

const minesweeper = async (cols: number, row: number, bombs: number, displayer: Displayer) => {
    const player = naivePlayer;

    let board = getNewBoard(cols, row, bombs);
    
    while (["IN_PROGRESS", "NEW" ].includes(board.gameState)) {
        const newBoard = await runMove(displayer, board, player);
        
        if (newBoard == null || newBoard.gameState == "LOST") {
            if (newBoard != null) { 
                displayBoard(displayer, newBoard)
            } else {
                console.log("null board")
            }
            return "LOST"
        }
        board = newBoard
    }
    displayBoard(displayer, board)
    return board.gameState
}


const runMove = async (displayer: Displayer, board: Board, player: Player): Promise<Board | null> => {
    // Display board
    await displayBoard(displayer, board)
    const move: Move = await makeMove(board, player);
    return applyMove(board, move);
}

const displayBoard = (displayer: Displayer, board: Board): Promise<void> => {
    return displayer.displayBoard(board)
}

const makeMove = (board: Board, player: Player): Promise<Move> => {
    return player.pickCell(board)
}

const applyMove = (board: Board, move: Move): Board | null => {
    // TODO: If first move, don't allow a loss

    if (move?.coord == null || !onGrid(board.grid, move.coord)) {
        console.log(`Given coord not on grid ${move?.coord?.col}, ${move?.coord?.row}`)
        return null;
    }
    const { row, col } = move.coord;
    const nextSpace = board.grid[row][col];
    if (nextSpace.isOpen) { 
        console.log(`Given space that's already open ${move.coord.col}, ${move.coord.row}`);
        return null;
    }
    if (nextSpace.isBomb) {
        const newGrid = board.grid;
        newGrid[row][col].isOpen = true;
        return {
            ...board,
            grid: newGrid,
            gameState: "LOST"
        }
    }
    
    // Pop new spaces
    const newGrid = board.grid
    const queue = [ move.coord ]
    while (queue.length > 0) {
        const next = queue.shift() as Coord
        if (!onGrid(newGrid, next) || newGrid[next.row][next.col].isOpen) { continue; }
        newGrid[next.row][next.col].isOpen = true;
        let newCoords: Coord[] = []
        if (newGrid[next.row][next.col]?.bombsNear == 0) {
            newCoords = [-1, 0, 1].reduce((acc: Coord[], r) => {
                return [...acc, ...[-1, 0, 1].reduce((acc: Coord[], c) => {
                    const nextCoord = (r == 0 && c == 0) ? null : { row: next.row + r, col: next.col + c};
                    // Add to pop queue if not the space were evaluating now, the space is on the board, and the space is unopened
                    const addToQueue = nextCoord != null && onGrid(newGrid, nextCoord) && !newGrid[nextCoord.row][nextCoord.col].isOpen
                    return addToQueue ? [ ...acc, nextCoord ] : acc
                }, [])]
            }, []);
        }
        newCoords.forEach(coord => { queue.push(coord) });
    }

    // Check if won: Every space is open or is a bomb
    const gameWon = newGrid.every(row => {
        return row.every((space) => space.isOpen || space.isBomb);
    })
    const newState = gameWon ? "WON" : "IN_PROGRESS";
    
    return {
        ...board,
        grid: newGrid,
        gameState: newState,
    };
}

const onGrid = <T,> (grid: T[][], coord: Coord): Boolean => {
    const { row, col } = coord;
    return col >= 0 && row >= 0 && row < grid.length && col < grid[row].length;
}

const generateGrid = (width: number, height: number, bombs: number): Space[][] => {
    const totalSpaces = width * height;
    const spaceList: Space[] = new Array(totalSpaces)
        .fill({ isOpen: false, isBomb: false })
        .map((s, idx) => {
            return (idx < bombs) ? 
                {
                    ...s,
                    isBomb: true
                } : 
                s
        })
    const randomize = <T,>(list: T[]): T[] => {
        for (let i = 0; i < list.length; i++) {
            const swapIdx = Math.floor(Math.random() * (list.length - i) + i)
            const temp = list[swapIdx]
            list[swapIdx] = list[i]
            list[i] = temp;
        }
        return list;
    }
    const randomizedList = randomize(spaceList)
    let emptyGrid: Space[][] = new Array(height).fill(undefined)
    emptyGrid = emptyGrid.map(_ => new Array(width).fill(undefined))
    const spaceGrid = randomizedList.reduce((acc, cur, idx) => {
        const row = Math.floor(idx / width);
        const col = idx % width;
        acc[row][col] = cur;
        return acc
    }, emptyGrid);
    const populateBombCounts = (grid: Space[][]): Space[][] => {
        return grid.map((row, rIdx) => {
            return row.map((space, cIdx) => {
                let bombCount = 0;
                if (!space.isBomb) {
                    bombCount = [-1, 0, 1].reduce((acc, r) => acc + [-1, 0, 1].reduce((acc, c) => {
                        const isOnGrid = onGrid(spaceGrid, { col: cIdx + c, row: rIdx + r })
                        const inc = (c == 0 && r == 0 || !isOnGrid) || !grid[rIdx + r][cIdx + c].isBomb ? 0 : 1;
                        return acc + inc;
                    }, 0), 0);
                }
                return {
                    ...space,
                    bombsNear: bombCount
                }
            });
        })
    }
    return populateBombCounts(spaceGrid)
}



const getNewBoard = (width: number, height: number, bombs: number): Board => {
    if (width < 3 || height < 3 || bombs < 1 || bombs >= width * height) {
        throw 'Illegal arguments'
    }
    const grid = generateGrid(width, height, bombs);
    console.log(grid)
    return {
        grid,
        gameState: "NEW"
    }
}

export default minesweeper;