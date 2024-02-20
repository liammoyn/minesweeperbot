import { updateSpaceCoordsAndBombsNear } from "../utils/gridUtils";
import { Board, GameState, Space } from "./types";

const factor = (num: number): number[] => {
    const ans = []
    for (let low = 1; low < Math.sqrt(num); low++) {
        if (num % low === 0) {
            let hi = num / low
            ans.push(low)
            ans.push(hi)
        }
    }
    if (Math.floor(Math.sqrt(num)) * Math.sqrt(num) == num) {
        ans.push(Math.sqrt(num))
    }
    return ans.sort((a, b) => a - b)
}

const getGridFromString = (input: String): Space[][] => {
    const factors: number[] = factor(input.length)
    let width: number
    if (factors.length % 2 === 0) {
        width = factors[factors.length / 2]
    } else {
        width = factors[Math.floor(factors.length / 2)]
    }
    const grid = input.split('')
        .reduce((acc: Space[][], c: string, idx: number) => {
                const flagged = c === 'F' || c === 'f'
                const newSpace: Space = {
                    isBomb: c === 'B' || c === 'b' || c === 'F',
                    isOpen: c >= 'A' && c <= 'Z' && !flagged,
                    isFlagged: flagged,
                    bombsNear: 0,
                    row: Math.floor(idx / width),
                    col: idx % width,
                    highlightColor: null
                }
                if (idx % width === 0) {
                    return [ ...acc, [ newSpace ] ]
                } else {
                    const finished = acc.slice(0, -1)
                    return [ ...finished, [ ...acc[acc.length - 1], newSpace ]]
                }
            },
            [] as Space[][]
        )

    return updateSpaceCoordsAndBombsNear(grid);
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

export const getStringFromBoard = (grid: Space[][]): string => {
    let ans = ""
    for (let row of grid) {
        for (let s of row) {
            let nextCar: string
            if (s.isFlagged) {
                nextCar = s.isBomb ? 'F' : 'f'
            } else if (s.isBomb) {
                nextCar = s.isOpen ? 'B' : 'b' 
            } else {
                nextCar = s.isOpen ? 'O' : 'o'
            }
            ans += nextCar
        }
    }
    return ans
}
