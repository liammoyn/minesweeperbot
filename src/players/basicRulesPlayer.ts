import { Board, Coord, Move, Player, Space } from "../minesweeper/types";
import { getAdjacentCoords, getCoordKey, onGrid } from "../utils/gridUtils";

interface ProcInfo {
    coord: Coord
    unknownAdjacentBombs: number // a - b
    unknownAdjacentSquares: number // c
    unknownAdjacentSquareList: Coord[]
}




const basicRulesPlayer = (): Player => {
    let board: Board;

    /** Next coordinates to try opening */
    let nextQueue: Coord[];
    /** Next known bombs to process */
    let bombQueue: Coord[]
    /** Next open squares to process */
    let todoQueue: Coord[];
    /** Next coordinates with uncertainties */
    let processQueue: { [key: string]: ProcInfo }



    const popNextQueue = (): Promise<Coord> => {
        // Get coord x
        const coord = nextQueue.shift();
        if (coord == undefined) {
            throw "Pop PQ called with empty PQ"
        }
        // Find PQs that have x in list
        // - Decrement c
        // - Run proc A
        const adjacentCoords = getAdjacentCoords(coord, board.grid);
        adjacentCoords.forEach(adjCoord => {
            const adjPq = processQueue[getCoordKey(adjCoord)]
            if (adjPq) {
                adjPq.unknownAdjacentSquares -= 1;
                adjPq.unknownAdjacentSquareList = adjPq.unknownAdjacentSquareList.filter(coord => coord == adjCoord)
                addUpdateSquareInProcessQueue(adjPq.coord)
            }
        })
        // Return move to board
        // return new Promise((resolve, reject) => {
        //     resolve(coord);
        // })
        // Wait for next move
        const newGrid = board.grid
        // If was num, then add to TQ
        if (newGrid[coord?.row][coord?.row].bombsNear > 0) {
            todoQueue.push(coord);
        }
        // If was blank find all new nums
        else {
            // TODO
            // - Add new nums to TQ
        }
        // TODO: Remove
        return Promise.resolve({ row: 1, col: 1 })
    }

    const popBombQueue = (): Move => {
        // Get coord x
        const coord = bombQueue.shift();
        if (coord == undefined) {
            throw "Pop BQ called with empty BQ"
        }
        // Find PQs that have x in listconst adjacentCoords = actOnAdjacentCoords(coord, board.grid, x => x);
        // - Decrement (a-b)
        // - Run proc A
        const adjacentCoords = getAdjacentCoords(coord, board.grid, sp => !board.grid[sp.row][sp.col].isOpen);
        adjacentCoords.forEach(adjCoord => {
            const adjPq = processQueue[getCoordKey(adjCoord)]
            if (adjPq) {
                adjPq.unknownAdjacentBombs -= 1;
                adjPq.unknownAdjacentSquareList = adjPq.unknownAdjacentSquareList.filter(coord => coord == adjCoord)
                addUpdateSquareInProcessQueue(adjPq.coord)
            }
        })

        // Flag Bomb
        return {
            coord,
            action: "FLAG",
        }
    }

    const popTodoQueue = () => {
        // Get coord x
        // Find adjacent squares unknownAdjacentSquareList
        // Remove popped squares
        // Remove known bombs, #=b
        // - unknownAdjacentBombs = (x.bombsLeft - b)
        // unknownAdjacentSquare = unknownAdjacentSquareList.length

        // Run ProcA
    }

    // ProcA
    const addUpdateSquareInProcessQueue = (coord: Coord) => {
        // For argument x
        // If a-b == 0
        // - Add all unknownAdjacentSquareList to NQ
        // If a-b == c unknownAdjacentSquareList to BQ
        // Else add x to PQ
    }


    const popProcessQueue = () => {

    }

    /**
     * Add each space to the grid into the queue that needs to be processed.
     * Include info on adjacent cells.
     */
    const addAllToPQ = (grid: Space[][]) => {
        grid.forEach((row, ridx) => {
            row.forEach((space, cidx) => {
                const thisCoord = { row: ridx, col: cidx };
                const coordList: Coord[] = getAdjacentCoords(thisCoord, grid);
                const procInfo: ProcInfo = {
                    coord: thisCoord,
                    unknownAdjacentBombs: 0,
                    unknownAdjacentSquares: coordList.length,
                    unknownAdjacentSquareList: coordList,
                }
                processQueue[getCoordKey(thisCoord)] = procInfo;
            })
        })
    }

    const pickMoveFromPQ = (): Move => {
        const keys = Object.keys(processQueue);
        const pickedProcessQueue = processQueue[Math.floor(Math.random() * keys.length)]
        return { coord: pickedProcessQueue.coord, action: "POP" }
    }

    return {
        pickCell: (board: Board): Promise<Move> => {
            // If board.gameState() == "NEW", add all squares to PQ
            if (board.gameState === "NEW") {
                addAllToPQ(board.grid)
            }

            // If NQ.length > 0, return popNextQueue()
            if (nextQueue.length > 0) {
                return popNextQueue().then(coord => ({ coord, action: "POP"}))
            }
            // Elif BQ.length > 0, loop call popBombQueue()
            if (bombQueue.length > 0) {
                return Promise.resolve(popBombQueue())
            }
            // Elif TQ.length > 0, loop call popTodoQueue()
            while (todoQueue.length > 0) {
                popTodoQueue()
            }
            // If NQ.length > 0, return popNextQueue()
            if (nextQueue.length > 0) {
                return popNextQueue().then(coord => ({ coord, action: "POP"}))
            }
            // Elif PQ.length > 0, return random coord from PQ
            if (Object.keys(processQueue).length > 0) {
                const move = pickMoveFromPQ()
                return Promise.resolve(move)
                // TODO: Check picked square
            }
            // Else error - Something went wrong
            else {
                throw "Nothing in bombQueue, todoQueue, nextQueue, or processQueue"
            }
        }
    }
}