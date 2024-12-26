import { Board, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentTs, getCrossSection, isNeighborS } from "../utils/gridUtils";
import { isSame, spaceToCoord } from "../utils/spaceUtils";


/**
 * Does not store state from move to move.
 * Highlights moves and numbers that are on the unknown edge.
 * Flags squares that must be bombs.
 * Pops squares that must not be bombs.
 * Uses context of other numbered squares to find bombs / frees.
 * Tries to optimize computation.
 */
const contextAwarePlayerV2 = (setHighlights: boolean, delayMs: number): Player => {
    let potentialMoves: Space[] = []

    function tryToFindMoveForSpace(space: Space, candidateNeighbors: Space[], knownBombNumber: number): Move | null {
        let nextMove: Move | null = null
        if (candidateNeighbors.length === 0) { return nextMove }
        if (space.bombsNear === candidateNeighbors.length + knownBombNumber) {
            // All unopened spaces must be bombs, since this on edge there is at least one unflagged one
            const nextNeighbor = candidateNeighbors.find(un => !un.isFlagged)
            nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.row, col: nextNeighbor.col }, action: "FLAG" } : null
        } else if (space.bombsNear === knownBombNumber) {
            // All unopened and unflagged spaces must be safe
            const nextNeighbor = candidateNeighbors.find(un => !un.isFlagged)
            nextMove = nextNeighbor != null ? { coord: { row: nextNeighbor.row, col: nextNeighbor.col }, action: "POP" } : null
        }
        return nextMove
    }

    function tryToFindMoveForEdge(board: Board, numbersOnEdge: Set<Space>): Move | null {
        let nextMove: Move | null = null
        let spaceToCandidates: Map<Space, Space[]> = new Map()
        let spaceToFlags: Map<Space, number> = new Map()

        for (let space of numbersOnEdge) {
            const coord = { row: space.row, col: space.col }
            const nonEmptyNeighbors = getAdjacentTs(coord, board.grid, s => !(s.isOpen && s.bombsNear === 0))
            const candidateNeighbors = nonEmptyNeighbors.filter(s => !s.isOpen && !s.isFlagged)
            const flaggedNeighbors = nonEmptyNeighbors.filter(s => s.isFlagged)
            nextMove = tryToFindMoveForSpace(space, candidateNeighbors, flaggedNeighbors.length)
            if (nextMove != null) {
                return nextMove;
            }

            spaceToCandidates.set(space, candidateNeighbors)
            spaceToFlags.set(space, flaggedNeighbors.length)
        }


        for (let space of numbersOnEdge) {
            // For each space, get a list of numbers who's candidates are all adjacent to this space.
            const theseCandidates = spaceToCandidates.get(space)!!
            const possibleNumbers = new Set(
                theseCandidates.flatMap(candidate => getAdjacentTs(
                    candidate,
                    board.grid,
                    s => numbersOnEdge.has(s) && !isSame(s, space)
                ))
            )
            const usefulNumbers = Array.from(possibleNumbers).filter(s => {
                const thoseCandidates = spaceToCandidates.get(s)
                return thoseCandidates?.every(c => isNeighborS(space, c))
            })

            // For each  of usefulNumbers, attempt to reprocess this space's candidates that aren't shared with number
            for (let numberSpace of usefulNumbers) {
                const eligibleSpaces = theseCandidates.filter(c => !isNeighborS(c, numberSpace))
                const thisFlags = spaceToFlags.get(space)!!
                const extraBombs = numberSpace.bombsNear - spaceToFlags.get(numberSpace)!!
                nextMove = tryToFindMoveForSpace(space, eligibleSpaces, thisFlags + extraBombs)
                if (nextMove !== null) {
                    return nextMove
                }
            }

            // For each permutation of usefulNumbers who's candidate numbers are distinct, attempt to reprocess
            // this space's candidates that aren't shared with any number in the permutation
            // TODO: This is slow
            const noSharedCandidates = (s1: Space, s2: Space) => {
                const c1s = spaceToCandidates.get(s1)!!
                const c2s = spaceToCandidates.get(s2)!!
                return c1s.every(c1 => c2s.every(c2 => !isSame(c1, c2)))
            }
            const permutations: Space[][] = []
            for (let i = 0; i < usefulNumbers.length; i++) {
                const thisNumber = usefulNumbers[i]
                const newPermutations: Space[][] = [[thisNumber]]
                for (let j = 0; j < permutations.length; j++) {
                    const thisPerm = permutations[j]
                    if (thisPerm.every(s => noSharedCandidates(s, thisNumber))) {
                        newPermutations.push([...thisPerm, thisNumber])
                    }
                }
                permutations.push(...newPermutations)
            }

            for (let permutation of permutations) {
                if (permutation.length == 1) { continue; }
                const eligibleSpaces = theseCandidates.filter(c => permutation.every(numberSpace => !isNeighborS(numberSpace, c)))
                const thisFlags = spaceToFlags.get(space)!!
                const extraBombs = permutation.reduce((acc, cur) => acc + (cur.bombsNear - spaceToFlags.get(cur)!!), 0)
                nextMove = tryToFindMoveForSpace(space, eligibleSpaces, thisFlags + extraBombs)
                if (nextMove !== null) {
                    return nextMove
                }
            }
        }

        return null
    }

    function findBestUncertainMove(possibleMoves: Space[]): Move {
        // Guess a coordinate
        const space = possibleMoves[0]
        const coord = spaceToCoord(space)
        return { coord: coord, action: "POP" }
    }

    return {
        newGame: (board: Board): Promise<void> => {
            potentialMoves = board.grid.flatMap(row => 
                row.filter(space => !space.isOpen && !space.isFlagged)
            )
            return Promise.resolve()
        },
        pickCell: (board: Board): Promise<Move> => {
            potentialMoves = potentialMoves.filter(space => !space.isOpen && !space.isFlagged)
            let movesOnEdge: Set<Space> = new Set()
            let numbersOnEdge: Set<Space> = new Set()
            
            potentialMoves.forEach(space => {
                const neighbors = getAdjacentTs(space, board.grid, s => s.isOpen)
                if (neighbors.length > 0) {
                    movesOnEdge.add(space)
                    neighbors.forEach(n => {
                        numbersOnEdge.add(n)
                    })
                }
            })
            
            let nextMove = tryToFindMoveForEdge(board, numbersOnEdge)

            if (nextMove == null) {
                nextMove = findBestUncertainMove(potentialMoves)
            }

            if (setHighlights) {
                board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
                potentialMoves.forEach(space => board.grid[space.row][space.col].highlightColor = "#22F")
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
        }
    }
}

export default contextAwarePlayerV2;