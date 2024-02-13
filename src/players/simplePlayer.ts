import { Board, Coord, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentCoords, getAdjacentTs } from "../utils/gridUtils";


/**
 * Does not store state from move to move.
 * Highlights moves and numbers that are on the unknown edge.
 * Flags squares that must be bombs.
 * Does not look for squares that must not be bombs.
 */
const simplePlayer = (): Player => {

    return {
        pickCell: (board: Board): Promise<Move> => {
            let potentialMoves: Coord[] = []
            let movesOnEdge: Set<Coord> = new Set()
            let numbersOnEdge: Set<Space> = new Set()

            potentialMoves = board.grid.flatMap(row => 
                row.filter(space => !space.isOpen && !space.isFlagged)
                    .map(space => ({
                        row: space.r,
                        col: space.c,
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
                const coord = { row: space.r, col: space.c }
                const unopenedNeighbors = getAdjacentTs(coord, board.grid, s => !s.isOpen)
                const bombNeighbors = unopenedNeighbors.filter(n => n.isFlagged)
                if (space.bombsNear == unopenedNeighbors.length) {
                    // Flag a space that must be a bomb
                    const nextNeighbor = unopenedNeighbors.find(un => !un.isFlagged)
                    nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.r, col: nextNeighbor.c }, action: "FLAG" } : null
                } else if (space.bombsNear == bombNeighbors.length) {
                    // Open a space that can't be a bomb
                    const nextNeighbor = unopenedNeighbors.find(un => !un.isFlagged)
                    nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.r, col: nextNeighbor.c }, action: "POP" } : null
                }
            })


            console.log(nextMove)

            board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
            potentialMoves.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#22F")
            movesOnEdge.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#0F0")
            numbersOnEdge.forEach(space => board.grid[space.r][space.c].highlightColor = "#FF0")



            if (nextMove == null) {
                nextMove = { coord: potentialMoves[0], action: "POP" }
            }
            return new Promise(res => {
                setTimeout(() => res(nextMove!!), 1000)
            })
        }
    }
}

export default simplePlayer;