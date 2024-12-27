import { getAdjacentCoords, onGrid } from "../utils/gridUtils";
import { copyBoard } from "./boardGenerator";
import { getStringFromBoard } from "./boardStringInterpretor";
import { Board, Player, Move, Coord, Displayer, GameState } from "./types";

const minesweeper = async (initialBoard: Board, displayer: Displayer, player: Player): Promise<GameState> => {
    let board = copyBoard(initialBoard);
    player.newGame(board)
    const start = Date.now()
    while (["IN_PROGRESS", "NEW" ].includes(board.gameState)) {
        let newBoard
        try {
            newBoard  = await runMove(displayer, board, player);
        } catch (e) {
            console.log("Threw exception with board", board, getStringFromBoard(board.grid))
            throw e
        }
        
        if (newBoard === null || newBoard.gameState === "LOST") {
            if (newBoard !== null) { 
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
    await displayBoard(displayer, board)
    return applyMove(board, move);
}

const displayBoard = (displayer: Displayer, board: Board): Promise<void> => {
    // TODO: Used for displaying mutation of the board for highlight color
    const reloadedBoard = {
        ...board
    }
    return displayer.displayBoard(reloadedBoard)
}

const makeMove = (board: Board, player: Player): Promise<Move> => {
    return player.pickCell(board)
}

const applyMove = (board: Board, move: Move): Board | null => {
    if (move?.coord == null || !onGrid(board.grid, move.coord)) {
        console.error(`Given coord not on grid ${move?.coord?.col}, ${move?.coord?.row}`)
        return null;
    }
    const { row, col } = move.coord;
    const nextSpace = board.grid[row][col];
    if (nextSpace.isOpen) { 
        console.log(`Given space that's already open ${move.coord.col}, ${move.coord.row}`);
        return board;
    }

    if (move.action === "FLAG") {
        const newGrid = board.grid;
        newGrid[row][col].isFlagged = !nextSpace.isFlagged;
        return {
            ...board,
            grid: newGrid,
        }
    }

    // TODO: If first move, don't allow a loss
    if (nextSpace.isBomb) {
        const newGrid = board.grid;
        newGrid[row][col].isOpen = true;
        // console.log(getStringFromBoard(board.grid))
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
        if (newGrid[next.row][next.col]?.bombsNear === 0) {
            const adjacentCoords = getAdjacentCoords(next, newGrid);
            newCoords = adjacentCoords.filter(coord => !newGrid[coord.row][coord.col].isOpen)
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

export default minesweeper;