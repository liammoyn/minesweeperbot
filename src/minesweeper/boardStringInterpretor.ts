import { populateBombCounts } from "./boardGenerator";
import { Board, GameState, Space } from "./types";


const getGridFromString = (input: String): Space[][] => {
    const sideLength = Math.sqrt(input.length)
    if (sideLength % 1 !== 0) {
        throw "Board string can only make square grids atm sorry"
    }
    const grid = input.split('')
        .reduce((acc: Space[][], c: string, idx: number) => {
                const newSpace: Space = {
                    isBomb: c === 'B' || c === 'b',
                    isOpen: c >= 'A' && c <= 'Z',
                    isFlagged: c === 'F' || c === 'f',
                    bombsNear: 0,
                    r: Math.floor(idx / sideLength),
                    c: idx % sideLength,
                    highlightColor: "none"
                }
                if (idx % sideLength == 0) {
                    return [ ...acc, [ newSpace ] ]
                } else {
                    const finished = acc.slice(0, -1)
                    return [ ...finished, [ ...acc[acc.length - 1], newSpace ]]
                }
            },
            [] as Space[][]
        )

    return populateBombCounts(grid);
}

const findGameState = (grid: Space[][]): GameState => {
    if (grid.every(r => r.every(s => !s.isOpen))) {
        return "NEW"
    } else if (grid.every(r => r.every(s => s.isOpen || s.isBomb))) {
        return "WON"
    } else if (grid.some(r => r.some(s => s.isOpen && s.isBomb))) {
        return "LOST"
    } else {
        return "IN_PROGRESS"
    }
}

export const getBoardFromString = (input: string): Board => {
    const grid = getGridFromString(input);
    const gameState = findGameState(grid);
    return {
        grid,
        gameState,
    }
}
