import { Board, Move, Player, Space, Coord } from "../minesweeper/types";
import { getAdjacentTs, getCrossSection, isNeighborS } from "../utils/gridUtils";
import { coordToString, isSame, spaceToCoord, stringToCoord } from "../utils/spaceUtils";

/*

{
    c1: {
        1: [[c2, c3], [c4]],
        2: [[c5, c6]]
    },
    c2: {
        1: [[c1, c3]]
    },
    c3: {
        1: [[c1, c2]]
        2: [[c4, c5], [c6, c7, c8]]
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

    type CountToConstraints = {
        [countKey: number]: string[][]
    }
    type MoveGraph = {
        [coordKey: string]: CountToConstraints
    }

    const checkExhaustive = (moveGraph: MoveGraph): Move | null => {


        return null
    }

    // Create the graph with all moves on the edge
    const makeGraph = (movesOnEdge: Set<Space>, grid: Space[][]): MoveGraph => {
        const moveGraph: MoveGraph = {}
        for (let space of movesOnEdge) {
            const graphEdges: CountToConstraints = {}
            const numberNeighbors = getAdjacentTs(space, grid, s => s.isOpen && s.bombsNear > 0)
            for (let numberNeighbor of numberNeighbors) {
                const adjacentCloseds = getAdjacentTs(numberNeighbor, grid, s => !isSame(s, space) && !s.isOpen)
                const count = numberNeighbor.bombsNear - adjacentCloseds.reduce((acc, cur) => acc + Number(cur.isFlagged) , 0)
                const adjacentMoves = adjacentCloseds.filter(s => !s.isFlagged).map(s => coordToString(s))
                graphEdges[count] = [ ...(graphEdges[count] ?? []), adjacentMoves ]
            }
            for (let countKey in graphEdges) {
                graphEdges[countKey].sort((a, b) => a.length - b.length)
            }

            moveGraph[coordToString(space)] = graphEdges
        }

        return moveGraph
    }

    // Find moves that can be determined by looking at a single coordinate at a time
    const findEasyMoves = (moveGraph: MoveGraph): Move | null => {
        for (let ckey in moveGraph) {
            for (let countKey in moveGraph[ckey]) {
                const count = Number(countKey)
                let constraints = moveGraph[ckey][count]

                for (let constraint of constraints) {
                    if (constraint.length < count) {
                        return {
                            coord: stringToCoord(ckey),
                            action: "FLAG"
                        }
                    } else if (count == 0) {
                        return {
                            coord: stringToCoord(ckey),
                            action: "POP"
                        }
                    }
                }

                for (let i = 0; i < constraints.length - 1; i++) {
                    for (let j = i + 1; j < constraints.length; j++) {
                        let smallSet = new Set(constraints[i])
                        let bigSet = new Set(constraints[j])
                        if (smallSet.size < bigSet.size && Array.from(smallSet.values()).every(s => bigSet.has(s))) {
                            return {
                                coord: stringToCoord(Array.from(bigSet).filter(s => !smallSet.has(s))[0]),
                                action: "POP"
                            }
                        }
                    }
                }
            }
        }
        return null
    }

    // Split the move graph into 1 or more unconnected graphs
    const splitGraph = (moveGraph: MoveGraph): MoveGraph[] => {
        const result = []
        const visited = new Set<String>()
        for (let coord of Object.keys(moveGraph)) {
            if (visited.has(coord)) {
                continue;
            }
            const thisVisited = new Set<string>()
            let todos: string[] = [ coord ]
            while (todos.length > 0) {
                const cur = todos.pop()!!
                if (thisVisited.has(cur)) {
                    continue;
                } else {
                    thisVisited.add(cur)
                }
                const allNeighborCoords = Object.values(moveGraph[cur])
                    .flat()
                    .flat()
                    .filter(c => !thisVisited.has(c))
                const nextCoords: Set<string> = new Set(allNeighborCoords)
                todos = [ ...todos, ...nextCoords]
            }
            const subMap: MoveGraph = {}
            thisVisited.forEach(visitedCoord => subMap[visitedCoord] = moveGraph[visitedCoord])
            thisVisited.forEach(visitedCoord => visited.add(visitedCoord))
            result.push(subMap)
        }
        return result;
    }

    const findMove = (movesOnEdge: Set<Space>, grid: Space[][]): Move => {
        // Construct graph of moves on edge
        const moveGraph = makeGraph(movesOnEdge, grid)
        console.log("Full Graph", moveGraph)

        let maybeMove = findEasyMoves(moveGraph)
        
        // Reduce using backtracking
        /*
        Rules for graph:
        If a node has an edge who's count - 1 == some adjacents.length, then the node is a bomb (and other adjacents)
        Then remove the node from all other adjacents that they appear in and lower the count
        If during this process, any node now has an adjacents who's length == count - 1, this node is not a bomb (and other ajacents)
        */
       
        if (maybeMove == null) {
            const subGraphs = splitGraph(moveGraph)
            for (let subGraph of subGraphs) { 
                maybeMove = checkExhaustive(subGraph)
                if (maybeMove != null) {
                    return maybeMove
                }
            }
        }


        return maybeMove ?? {
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
