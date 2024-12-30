import { Board, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentTs, isNeighborS } from "../utils/gridUtils";
import { isSame } from "../utils/spaceUtils";
import { tryToFindMoveForEdge } from "./contextAwarePlayerV2";
import cspPlayer from "./cspPlayer";

/**
 * Uses contextAwarePlayerV2's logic at first, if it can't get a definitive answer it then uses cspPlayer's logic.
 * Should be equivilent to cspPlayer's accuracy while being significantly faster.
 */
const combinedPlayer = (setHighlights: boolean, delayMs: number): Player => {
    const cspPlayerInst = cspPlayer(false, 0)
    let potentialMoves: Space[] = []

    return {
        newGame: (board: Board): Promise<void> => {
            potentialMoves = board.grid.flatMap(row => 
                row.filter(space => !space.isOpen && !space.isFlagged)
            )
            cspPlayerInst.newGame(board)
            return Promise.resolve()
        },
        pickCell: (board: Board): Promise<Move> => {
            potentialMoves = potentialMoves.filter(space => !space.isOpen && !space.isFlagged)
            let movesOnEdge: Set<Space> = new Set()
            let numbersOnEdge: Set<Space> = new Set()
            let movesOffEdge: Set<Space> = new Set()
            let unknownBombs = 0
            
            potentialMoves.forEach(space => {
                if (space.isBomb) {
                    unknownBombs++
                }
                const neighbors = getAdjacentTs(space, board.grid, s => s.isOpen)
                if (neighbors.length > 0) {
                    movesOnEdge.add(space)
                    neighbors.forEach(n => {
                        numbersOnEdge.add(n)
                    })
                } else {
                    movesOffEdge.add(space)
                }
            })

            let maybeNextMove = tryToFindMoveForEdge(board, numbersOnEdge)
            let nextMovePromise: Promise<Move>
            if (maybeNextMove == null) {
                // console.warn("Using CSP player")
                nextMovePromise = cspPlayerInst.pickCell(board)
            } else {
                nextMovePromise = Promise.resolve(maybeNextMove!!)
            }

            return nextMovePromise.then(nextMove => {
                if (setHighlights) {
                    board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
                    movesOffEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#22F")
                    movesOnEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#0F0")
                    numbersOnEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#FF0")
                    board.grid[nextMove.coord?.row!!][nextMove.coord?.col!!].highlightColor = "#000"
                }
    
                if (delayMs > 0) {
                    return new Promise(res => {
                        setTimeout(() => res(nextMove!!), delayMs)
                    })
                } else {
                    return Promise.resolve(nextMove!!)
                }
            })
        }
    }
}

export default combinedPlayer