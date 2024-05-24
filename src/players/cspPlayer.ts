import { Board, Move, Player, Space, Coord } from "../minesweeper/types";
import { getAdjacentTs, getCrossSection, isNeighborS } from "../utils/gridUtils";
import { coordToString, isSame, spaceToCoord, stringToCoord } from "../utils/spaceUtils";

/*

{
    c1: {
        1: [c2, c3],
        1: [c4],
        2: [c5, c6]
    },
    c2: {
        1: [c1, c3]
    }
}

*/



/**
 * Questions to answer:
 * How many ways can N bombs be arranged in X unknown squares?
 * How do we construct a CSP from some set of unknown squares and neighboring numbers?
 * - How do we divide squares into distinct groups?
 * - How do we model constraints between squares?
 * What is the number of arangements for an unknown edge with M bombs for all satisfiable M?
 * Given all possible arrangements for an edge or plane, what square has the lowest probability of being a bomb?
 */
const cspPlayer = (setHighlights: boolean, delayMs: number): Player => {
    let potentialMoves: Space[] = []

    type MoveGraph = {
        [key: string]: {
            "count": number,
            "adjacents": string[]
        }[]
    }    

    const makeGraph = (movesOnEdge: Set<Space>, grid: Space[][]): MoveGraph => {
        const moveGraph: MoveGraph = {}
        for (let space of movesOnEdge) {
            const graphEdges = []
            const numberNeighbors = getAdjacentTs(space, grid, s => s.isOpen && s.bombsNear > 0)
            for (let numberNeighbor of numberNeighbors) {
                const adjacentMoves = getAdjacentTs(numberNeighbor, grid, s => !isSame(s, space) && !s.isOpen)
                graphEdges.push({
                    "count": numberNeighbor.bombsNear - adjacentMoves.reduce((acc, cur) => acc + Number(cur.isFlagged) , 0),
                    "adjacents": adjacentMoves.filter(s => !s.isFlagged).map(s => coordToString(s))
                })
            }
            moveGraph[coordToString(space)] = graphEdges.sort((a, b) => a.count - b.count)
        }

        return moveGraph
    }

    const findMove = (movesOnEdge: Set<Space>, grid: Space[][]): Move => {
        // Construct graph of moves on edge
        const moveGraph = makeGraph(movesOnEdge, grid)
        console.log(moveGraph)

        for (let ckey in moveGraph) {
            for (let constraint of moveGraph[ckey]) {
                if (constraint.adjacents.length < constraint.count) {
                    return {
                        coord: stringToCoord(ckey),
                        action: "FLAG"
                    }
                } else if (constraint.count == 0) {
                    return {
                        coord: stringToCoord(ckey),
                        action: "POP"
                    }
                }
            }

            const groupedByCount = moveGraph[ckey].reduce((acc, cur) => {
                if (acc[cur.count] == null) {
                    acc[cur.count] = [cur.adjacents]
                } else {
                    acc[cur.count] = [ ...acc[cur.count], cur.adjacents ].sort((a, b) => a.length - b.length)
                }
                return acc
            }, {} as { [n: number]: string[][] })
            let ans = null
            Object.values(groupedByCount).forEach(constraints => {
                for (let i = 0; i < constraints.length - 1; i++) {
                    for (let j = i + 1; j < constraints.length; j++) {
                        let smallSet = new Set(constraints[i])
                        let bigSet = new Set(constraints[j])
                        if (smallSet.size < bigSet.size && Array.from(smallSet.values()).every(s => bigSet.has(s))) {
                            ans = {
                                coord: stringToCoord(Array.from(bigSet).filter(s => !smallSet.has(s))[0]),
                                action: "POP"
                            }
                            break;
                        }
                    }
                }
            })

            if (ans != null) {
                return ans
            }
        }
        // Reduce using backtracking
        /*
        Rules for graph:
        If a node has an edge who's count - 1 == some adjacents.length, then the node is a bomb (and other adjacents)
        Then remove the node from all other adjacents that they appear in and lower the count
        If during this process, any node now has an adjacents who's length == count - 1, this node is not a bomb (and other ajacents)

        */


        return {
            coord: movesOnEdge.values().next().value,
            action: "POP"
        }
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


            let nextMove: Move = movesOnEdge.size > 0 
                ? findMove(movesOnEdge, board.grid)
                : { coord: potentialMoves[0], action: "POP" }


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
        }
    }
}

export default cspPlayer
