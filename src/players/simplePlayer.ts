import { Board, Coord, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentTs } from "../utils/gridUtils";


/**
 * Does not store state from move to move.
 * Highlights moves and numbers that are on the unknown edge.
 * Flags squares that must be bombs.
 * Pops squares that must not be bombs.
 * Picks a tile from the edge at random otherwise.
 */
const simplePlayer = (): Player => {

    return {
        newGame: () => Promise.resolve(),
        pickCell: (board: Board): Promise<Move> => {
            let potentialMoves: Coord[] = []
            let movesOnEdge: Set<Coord> = new Set()
            let numbersOnEdge: Set<Space> = new Set()

            potentialMoves = board.grid.flatMap(row => 
                row.filter(space => !space.isOpen && !space.isFlagged)
                    .map(space => ({
                        row: space.row,
                        col: space.col,
                    })))

            potentialMoves.forEach(coord => {
                const neighbors = getAdjacentTs(coord, board.grid, s => s.isOpen)
                if (neighbors.length > 0) {
                    movesOnEdge.add(coord)
                    neighbors.forEach(n => {
                        numbersOnEdge.add(n)
                    })
                }
            })


            let nextMove: Move | null = null
            numbersOnEdge.forEach(space => {
                const coord = { row: space.row, col: space.col }
                const unopenedNeighbors = getAdjacentTs(coord, board.grid, s => !s.isOpen)
                const bombNeighbors = unopenedNeighbors.filter(n => n.isFlagged)
                if (space.bombsNear === unopenedNeighbors.length) {
                    // Flag a space that must be a bomb
                    const nextNeighbor = unopenedNeighbors.find(un => !un.isFlagged)
                    nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.row, col: nextNeighbor.col }, action: "FLAG" } : null
                } else if (space.bombsNear === bombNeighbors.length) {
                    // Open a space that can't be a bomb
                    const nextNeighbor = unopenedNeighbors.find(un => !un.isFlagged)
                    nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.row, col: nextNeighbor.col }, action: "POP" } : null
                }
            })


            console.log(nextMove)
            if (nextMove == null) {
                // Guess a coordinate
                const coord = potentialMoves[Math.floor(potentialMoves.length / 2)]
                nextMove = { coord: coord, action: "POP" }
            }

            board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
            potentialMoves.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#22F")
            movesOnEdge.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#0F0")
            numbersOnEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#FF0")
            board.grid[nextMove.coord?.row!!][nextMove.coord?.col!!].highlightColor = "#000"

            return new Promise(res => {
                setTimeout(() => res(nextMove!!), 1000)
            })
        }
    }
}

export default simplePlayer;