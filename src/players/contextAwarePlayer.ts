import { Board, Coord, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentTs, isNeighborS } from "../utils/gridUtils";


/**
 * Does not store state from move to move.
 * Highlights moves and numbers that are on the unknown edge.
 * Flags squares that must be bombs.
 * Pops squares that must not be bombs.
 * 
 * Uses context of other numbered squares to find bombs / frees.
 */
const contextAwarePlayer = (): Player => {

    function tryToFindMove(space: Space, candidateNeighbors: Space[], knownBombNumber: number): Move | null {
        let nextMove: Move | null = null
        if (space.bombsNear === candidateNeighbors.length + knownBombNumber) {
            // All unopened spaces must be bombs, since this on edge there is at least one unflagged one
            const nextNeighbor = candidateNeighbors.find(un => !un.isFlagged)
            nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.r, col: nextNeighbor.c }, action: "FLAG" } : null
        } else if (space.bombsNear === knownBombNumber) {
            // All unopened and unflagged spaces must be safe
            const nextNeighbor = candidateNeighbors.find(un => !un.isFlagged)
            nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.r, col: nextNeighbor.c }, action: "POP" } : null
        }
        return nextMove
    }

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
            
            const reprocess: Map<Space, [ (s: Space) => boolean, number ]> = new Map()

            let nextMove: Move | null = null
            numbersOnEdge.forEach(space => {
                const coord = { row: space.r, col: space.c }
                const nonEmptyNeighbors = getAdjacentTs(coord, board.grid, s => !(s.isOpen && s.bombsNear === 0))
                const candidateNeighbors = nonEmptyNeighbors.filter(s => !s.isOpen && !s.isFlagged)
                const flaggedNeighbors = nonEmptyNeighbors.filter(s => s.isFlagged)
                if (nextMove == null) {
                    nextMove = tryToFindMove(space, candidateNeighbors, flaggedNeighbors.length)
                }

                // If all of our candidates are neighbors of a number:
                // Then that number's candidates that aren't neighbors of us can be processed 
                //  with (neighborNum - (space.bombsNear - flaggedNeighbors.length)) bombs near

                const numberedCandidateNeighbors = nonEmptyNeighbors.filter(s => s.isOpen && numbersOnEdge.has(s))
                for (let adjSpace of numberedCandidateNeighbors) {
                    if (candidateNeighbors.every(cn => isNeighborS(cn, adjSpace))) {
                        reprocess.set(adjSpace, [(s: Space) => !isNeighborS(s, space), space.bombsNear - flaggedNeighbors.length])
                    }
                }
            })

            if (nextMove == null) {
                for (let entry of reprocess) {
                    let [ space, [ pred, extraKnownBombCount ]] = entry
                    const coord = { row: space.r, col: space.c }
                    const nonEmptyNeighbors = getAdjacentTs(coord, board.grid, s => !(s.isOpen && s.bombsNear === 0))
                    const candidateNeighbors = nonEmptyNeighbors.filter(s => !s.isOpen && !s.isFlagged && pred(s))
                    const flaggedNeighbors = nonEmptyNeighbors.filter(n => n.isFlagged)
                    if (nextMove == null) {
                        nextMove = tryToFindMove(space, candidateNeighbors, flaggedNeighbors.length + extraKnownBombCount)
                    }
                }
            }

            console.log(nextMove)

            board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
            potentialMoves.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#22F")
            movesOnEdge.forEach(coord => board.grid[coord.row][coord.col].highlightColor = "#0F0")
            numbersOnEdge.forEach(space => board.grid[space.r][space.c].highlightColor = "#FF0")
            if (nextMove != null) {
                const nm = nextMove as Move
                board.grid[nm.coord?.row!!][nm.coord?.col!!].highlightColor = "#000"
            }


            if (nextMove == null) {
                const coord = potentialMoves[0]
                nextMove = { coord: coord, action: "POP" }
            }
            return new Promise(res => {
                setTimeout(() => res(nextMove!!), 1000)
            })
        }
    }
}

export default contextAwarePlayer;