import { Coord } from "../minesweeper/types";

export const onGrid = <T,> (grid: T[][], coord: Coord): Boolean => {
    const { row, col } = coord;
    return col >= 0 && row >= 0 && row < grid.length && col < grid[row].length;
}

export const getCoordKey = (coord: Coord): string => {
    return `r${coord.row}c${coord.col}`
}

export const getAdjacentCoords = <T,> (coord: Coord, grid: T[][], predicate?: (coord: Coord) => boolean): Coord[] => {
    const cIdx = coord.col;
    const rIdx = coord.row;
    return [-1, 0, 1].reduce((acc: Coord[], rInc) => {
        return [
            ...acc,
            ...[-1, 0, 1].reduce((acc: Coord[], cInc) => {
                const adjCoord = { col: cIdx + cInc, row: rIdx + rInc }
                if (rInc == 0 && cInc == 0 || !onGrid(grid, adjCoord) || (predicate && !predicate(adjCoord))) {
                    return acc;
                } else {
                    return [
                        ...acc,
                        adjCoord
                    ]
                }
            }, [])
        ]
    }, []);
}

export const getAdjacentTs = <T,> (coord: Coord, grid: T[][], predicate?: (item: T) => boolean): T[] => {
    const cIdx = coord.col;
    const rIdx = coord.row;
    return [-1, 0, 1].reduce((acc: T[], rInc) => {
        return [
            ...acc,
            ...[-1, 0, 1].reduce((acc: T[], cInc) => {
                const adjCoord = { col: cIdx + cInc, row: rIdx + rInc }
                const adjCell = onGrid(grid, adjCoord) ? grid[adjCoord.row][adjCoord.col] : null
                if (rInc == 0 && cInc == 0 || adjCell == null || (predicate && !predicate(adjCell))) {
                    return acc;
                } else {
                    return [
                        ...acc,
                        adjCell
                    ]
                }
            }, [])
        ]
    }, []);
}
