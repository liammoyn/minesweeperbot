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
const contextAwarePlayer = (): Player => {
    let potentialMoves: Space[] = []

    function tryToFindMoveForSpace(space: Space, candidateNeighbors: Space[], knownBombNumber: number): Move | null {
        let nextMove: Move | null = null
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
        const reprocess: Map<Space, [ Set<Space>, number ]> = new Map()
        let nextMove: Move | null = null

        for (let space of numbersOnEdge) {
            const coord = { row: space.row, col: space.col }
            const nonEmptyNeighbors = getAdjacentTs(coord, board.grid, s => !(s.isOpen && s.bombsNear === 0))
            const candidateNeighbors = nonEmptyNeighbors.filter(s => !s.isOpen && !s.isFlagged)
            const flaggedNeighbors = nonEmptyNeighbors.filter(s => s.isFlagged)
            nextMove = tryToFindMoveForSpace(space, candidateNeighbors, flaggedNeighbors.length)
            if (nextMove != null) {
                console.log("Found normally through:", space)
                return nextMove;
            }


            // Get cross section of all candidateNeighbors to find all spaces that are adjacent to all of them
            // Check if any of these spaces in the cross section are in the numbersOnEdge set
            // If they are, add them to reprocessing queue

            const spacesToReprocess = getCrossSection(
                candidateNeighbors,
                board.grid,
                (s: Space) => !(s.row === space.row && s.col === space.col) && numbersOnEdge.has(s)
            )
            if (space.row === 0 && space.col === 0) {
                console.log(spacesToReprocess)
            }
            spacesToReprocess.forEach(reprocessSpace => {
                const theseEligibleSpaces = new Set(getAdjacentTs(
                    reprocessSpace,
                    board.grid,
                    (s: Space) => !s.isOpen && !s.isFlagged && !isSame(s, space) && !isNeighborS(s, space)
                ))
                let thisExtraBombs = space.bombsNear - flaggedNeighbors.length

                if (theseEligibleSpaces.size > 0) {
                    // let existingEntry = reprocess.get(reprocessSpace)
                    // if (existingEntry !== undefined) {
                    //     let [ oldSpaces, oldExtraBombs ] = existingEntry
                    //     const combinedSpaces = intersection(oldSpaces, theseEligibleSpaces)
                    //     if (combinedSpaces.length > 0) {
                    //         reprocess.set(reprocessSpace, [combinedSpaces, thisExtraBombs + oldExtraBombs])
                    //     }
                    // }



                    reprocess.set(reprocessSpace, [theseEligibleSpaces, thisExtraBombs])
                }

                // let existingEntry = reprocess.get(reprocessSpace)
                // if (existingEntry !== undefined) {
                //     let [oldPred, oldExtraBombs] = existingEntry
                //     let newPred = (s: Space) => thisIsntNeighborPred(s) && oldPred(s)
                //     let newExtraBombs = thisExtraBombs + oldExtraBombs
                //     reprocess.set(reprocessSpace, [newPred, newExtraBombs])
                // } else {
                //     reprocess.set(reprocessSpace, [theseEligibleSpaces, thisExtraBombs])
                // }
            })
        }


        // Then that number's candidates that aren't neighbors of us can be processed 
        //  with (neighborNum - (space.bombsNear - flaggedNeighbors.length)) bombs near

        if (nextMove == null) {
            for (let entry of reprocess) {
                let [ space, [ eligibleSpaces, extraKnownBombCount ]] = entry
                if (space.row === 2 && space.col === 1) {
                    console.log(extraKnownBombCount)
                    console.log("Eligible spaces", eligibleSpaces)
                }
                const coord = { row: space.row, col: space.col }
                const nonEmptyNeighbors = getAdjacentTs(coord, board.grid, s => !(s.isOpen && s.bombsNear === 0))
                const candidateNeighbors = nonEmptyNeighbors.filter(s => !s.isOpen && !s.isFlagged && eligibleSpaces.has(s))
                const flaggedNeighbors = nonEmptyNeighbors.filter(n => n.isFlagged)
                nextMove = tryToFindMoveForSpace(space, candidateNeighbors, flaggedNeighbors.length + extraKnownBombCount)
                if (nextMove != null) {
                    console.log("Found through analysis", space)
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

            console.log(nextMove !== null ? nextMove : "GUESSING ", findBestUncertainMove(potentialMoves))
            if (nextMove == null) {
                nextMove = findBestUncertainMove(potentialMoves)
            }

            board.grid.forEach(row => row.forEach(space => space.highlightColor = "#F22"))
            potentialMoves.forEach(space => board.grid[space.row][space.col].highlightColor = "#22F")
            movesOnEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#0F0")
            numbersOnEdge.forEach(space => board.grid[space.row][space.col].highlightColor = "#FF0")
            board.grid[nextMove.coord?.row!!][nextMove.coord?.col!!].highlightColor = "#000"

            return new Promise(res => {
                setTimeout(() => res(nextMove!!), 500)
            })
        }
    }
}

export default contextAwarePlayer;