import { getBoardString } from "../displayers/consoleDisplayer";
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

    type Configuration = {
        [coordKey: string]: boolean | undefined
    }

    const isValidConstraints = (countToConstraints: CountToConstraints): boolean => {
        if (countToConstraints[0]?.length > 0) {
            // This and every other 0 constraint is not bomb
            const notBombs = new Set(countToConstraints[0].flat())
            const brokenConstraint = Object.entries(countToConstraints)
                .find(([countS, constraints]) => {
                    const count = Number(countS)
                    return count > 0 && constraints.find(constraint => {
                        const unknownCount = constraint.reduce((acc, cur) => acc + (notBombs.has(cur) ? 0 : 1), 0)
                        return unknownCount < count 
                    })
                })
            if (brokenConstraint != undefined) {
                // console.log("Constraint was broken for c2c", brokenConstraint, countToConstraints)
                return false
            }
        }
        return true
    }

    const reduceGraph = (moveGraph: MoveGraph, coord: string, isBomb: boolean, grid: Space[][]): {
        "newGraph": MoveGraph,
        "newConfiguration": Configuration
    } | null => {
        let configuration: Configuration = { [coord]: isBomb }

        /*
        Rules for graph:
        If a node has an edge who's count - 1 == some adjacents.length, then the node is a bomb (and other adjacents)
        Then remove the node from all other adjacents that they appear in and lower the count
        If during this process, any node now has an adjacents who's length == count - 1, this node is not a bomb (and other ajacents)
        */

        let newGraph: MoveGraph = { ...moveGraph }
        delete newGraph[coord]
        const thisCountToConstraints = moveGraph[coord]
        if (thisCountToConstraints == null) { return null }

        // console.log("In Reduce Graph", isBomb, coord, moveGraph)
        const newGrid = getNewGrid(grid, coord, isBomb)
        // console.log(getBoardString({ grid: newGrid, gameState: "IN_PROGRESS" }))
        if (isBomb) {
            // Every 1-count constraint coord is not a bomb
            // Every constraint that uses this coord should remove this coord and be reduced by 1
            const allEffectedCoords = new Set(Object.values(thisCountToConstraints).flat().flat())
            const newNotBombs = new Set(thisCountToConstraints[1]?.flat() ?? [])

            for (let effectedCoord of allEffectedCoords) {
                const newCountToConstraints: CountToConstraints = {}
                const effectedCountToConstraints = moveGraph[effectedCoord]
                for (let [countS, constraints] of Object.entries(effectedCountToConstraints)) {
                    let [loweredConstraints, sameConstraints] = constraints.reduce((acc: string[][][], constraint: string[]) => {
                        if (constraint.indexOf(coord) == -1) {
                            return [ acc[0], [ ...acc[1], constraint ] ]
                        } else {
                            return [ [ ...acc[0], constraint.filter(c => c != coord) ], acc[1] ]
                        }
                    }, [[], []])
                    if (loweredConstraints.length > 0) {
                        newCountToConstraints[Number(countS) - 1] = [ ...(newCountToConstraints[Number(countS) - 1] ?? []), ...loweredConstraints]
                    }
                    if (sameConstraints.length > 0) {
                        newCountToConstraints[Number(countS)] = [ ...(newCountToConstraints[Number(countS)] ?? []), ...sameConstraints]
                    }
                }
                if (!isValidConstraints(newCountToConstraints)) {
                    return null
                }
                newGraph[effectedCoord] = newCountToConstraints
            }
            for (let notBombCoord of newNotBombs) {
                // console.log(`Checking not bomb ${notBombCoord} while trying ${coord} ${isBomb} bomb`)
                const res = reduceGraph(newGraph, notBombCoord, false, newGrid)
                if (res == null) {
                    console.log(`Could not process ${notBombCoord} as safe on`, newGraph)
                    return null
                }
                newGraph = res.newGraph
                // TODO: Maybe throw error if new configuration conflicts with old configuration?
                configuration = { ...configuration, ...res.newConfiguration }
            }
        } else {
            // Every N-Count constraint where constraint.length == N are all bombs
            // Every constraint that uses this coord should remove this coord
            const allEffectedCoords = new Set(Object.values(thisCountToConstraints).flat().flat())
            const newBombs = new Set(
                    Object.entries(thisCountToConstraints).flatMap(([countS, constraints]) => {
                        return constraints.filter(c => c.length == Number(countS))
                    }).flat()
            )
            for (let effectedCoord of allEffectedCoords) {
                const effectedCountToConstraints = moveGraph[effectedCoord]
                const newCountToConstraints: CountToConstraints = Object.fromEntries(Object.entries(effectedCountToConstraints)
                    .map(([countS, constraints]) => {
                        const newConstraints = constraints.map(constraint => constraint.filter(c => c != coord))
                        return [countS, newConstraints]
                    })
                )
                if (!isValidConstraints(newCountToConstraints)) {
                    return null
                }
                newGraph[effectedCoord] = newCountToConstraints
            }
            for (let bombCoord of newBombs) {
                // console.log(`Checking bomb ${bombCoord} while trying ${coord} ${isBomb} bomb`)
                const res = reduceGraph(newGraph, bombCoord, true, newGrid)
                if (res == null) {
                    console.log(`Could not process ${bombCoord} as bomb on`, newGraph)
                    return null
                }
                newGraph = res.newGraph
                // TODO: Maybe throw error if new configuration conflicts with old configuration?
                configuration = { ...configuration, ...res.newConfiguration }
            }            
        }

        return {
            "newGraph": newGraph,
            "newConfiguration": configuration
        }
    }

    const getNewGrid = (grid: Space[][], coord: string, isBomb: boolean): Space[][] => {
        return grid.map((r, ri) => r.map((s, ci) => {
            if (coordToString({row: ri, col: ci}) == coord) {
                if (isBomb) {
                    return { ...s, isFlagged: true }
                } else {
                    return { ...s, isOpen: true }
                }
            } else {
                return s
            }
        }))
    }

    const reduceRecur = (moveGraph: MoveGraph, grid: Space[][]): Configuration[] => {
        const coords = Object.keys(moveGraph).sort() // TODO: This is probably too ineffcient
        if (coords.length == 0) {
            return []
        }
        // TODO: Add memoization
        const thisCoord = coords[0]

        const results = []

        // console.log("In reduce recur", moveGraph, thisCoord)
        // console.log(getBoardString({ grid: grid, gameState: "IN_PROGRESS" }))
        // Assume thisCoord == bomb
        const bombReduceAttempt = reduceGraph(moveGraph, thisCoord, true, grid)
        if (bombReduceAttempt != null) {
            const {newGraph: bombGraph, newConfiguration: bombConfiguration} = bombReduceAttempt
            // Check if config is done, recur on this function if not
            if (Object.keys(bombGraph).length == 0) {
                results.push(bombConfiguration)
            } else {
                reduceRecur(bombGraph, grid).map(partialConfig => {
                    return { ...bombConfiguration, ...partialConfig }
                }).forEach(completeConfig => {
                    results.push(completeConfig)
                })
            }
        } else {
            console.log("Attempt to reduce was invalid", moveGraph, thisCoord, true)
        }

        // Assume thisCoord != bomb
        // console.log("Attempt not is bomb", thisCoord, moveGraph)
        const notBombReduceAttempt = reduceGraph(moveGraph, thisCoord, false, grid)
        if (notBombReduceAttempt != null) {
            const {newGraph: notBombGraph, newConfiguration: notBombConfiguration} = notBombReduceAttempt
            // Check if config is done, recur on this function if not
            if (Object.keys(notBombGraph).length == 0) {
                results.push(notBombConfiguration)
            } else {
                reduceRecur(notBombGraph, grid).map(partialConfig => {
                    return { ...notBombConfiguration, ...partialConfig }
                }).forEach(completeConfig => {
                    results.push(completeConfig)
                })
            }
        } else {
            console.log("Attempt to reduce was invalid", moveGraph, thisCoord, true)
        }

        // Combine results when thisCoord == bomb and thisCoord != bomb
        return results
    }

    const generateCoordinateProbabilities = (moveGraph: MoveGraph, grid: Space[][]): { [coord: string]: number } => {
        const allValidConfigurations = reduceRecur(moveGraph, grid)
        // console.log("All valid configurations", allValidConfigurations)
        const coordinateBombProbability = Object.fromEntries(Object.entries(moveGraph)
            .map(([coord, _]) => {
                const configsAsBomb = allValidConfigurations.reduce((total: number, curConfig: Configuration) => {
                    const bombCount = curConfig[coord] ? 1 : 0
                    return total + bombCount
                }, 0)
                return [coord, configsAsBomb / allValidConfigurations.length]
            })
        )
        // console.log("Coordinate Probabilities", coordinateBombProbability)
        return coordinateBombProbability
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
        // console.log("Full Graph", moveGraph)

        let maybeMove = findEasyMoves(moveGraph)
        
        // Reduce using backtracking

        let bestGuessOnEdge: [string, number] = ["", 2]
        if (maybeMove == null) {
            const subGraphs = splitGraph(moveGraph)
            for (let subGraph of subGraphs) { 
                const coordinateProbabilities = generateCoordinateProbabilities(subGraph, grid)
                
                const coordinateBombProbabilityList = Object.entries(coordinateProbabilities)
                const definitelyFlag = coordinateBombProbabilityList.find(([_, prob]) => prob == 1)
                if (definitelyFlag != undefined) {
                    return {
                        "coord": stringToCoord(definitelyFlag[0]),
                        "action": "FLAG"
                    }
                }

                const leastLikelyBomb = coordinateBombProbabilityList.reduce((acc: [string, number], cur) => {
                    if (cur[1] < acc[1]) {
                        return cur
                    } else {
                        return acc
                    }
                }, ["", 2])
                console.log(`Coord ${leastLikelyBomb[0]} is best with probability of bomb ${leastLikelyBomb[1] * 100}%`)
                if (leastLikelyBomb[1] == 0) {
                    return {
                        "coord": stringToCoord(leastLikelyBomb[0]),
                        "action": "POP"
                    }
                }

                if (leastLikelyBomb[1] < bestGuessOnEdge[1]) {
                    bestGuessOnEdge = leastLikelyBomb
                }
            }
        }

        // TODO: check if it's better to guess somewhere off the edge

        return maybeMove ?? {
            coord: bestGuessOnEdge[0] != "" ? stringToCoord(bestGuessOnEdge[0]) : movesOnEdge.values().next().value,
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
