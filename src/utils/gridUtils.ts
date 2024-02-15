import { Coord, Space } from "../minesweeper/types";

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
                if ((rInc === 0 && cInc === 0) || !onGrid(grid, adjCoord) || (predicate && !predicate(adjCoord))) {
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
                if ((rInc === 0 && cInc === 0) || adjCell === null || (predicate && !predicate(adjCell))) {
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

export const getSharedNeighbors = <T,> (coord1: Coord, coord2: Coord, grid: T[][], predicate?: (item: T) => boolean): T[] => {
    return getAdjacentCoords(coord1, grid, (adjCoord: Coord) => {
        return isNeighborC(coord2, adjCoord)
            && (!predicate || predicate(grid[adjCoord.row][adjCoord.col]))
    }).map(coord => grid[coord.row][coord.col])
}

export const isNeighborC = (coord1: Coord, coord2: Coord): boolean => {
    const cdiff = coord2.col - coord1.col
    const rdiff = coord2.row - coord1.row
    return Math.abs(cdiff) <= 1 
        && Math.abs(rdiff) <= 1 
        && (cdiff !== 0 || rdiff !== 0)
}

export const isNeighborS = (s1: Space, s2: Space): boolean => {
    const cdiff = s2.col - s1.col
    const rdiff = s2.row - s1.row
    return Math.abs(cdiff) <= 1 
        && Math.abs(rdiff) <= 1 
        && (cdiff !== 0 || rdiff !== 0)
}

export const getCrossSection = (spaces: Space[], grid: Space[][], pred?: (s: Space) => boolean): Space[] => {
    if (spaces.length == 0) { return [] }
    let candidates = getAdjacentTs(spaces[0], grid, pred)
    for (let i = 1; i < spaces.length; i++) {
        candidates = candidates.filter(s => isNeighborS(s, spaces[i]))
    }
    return candidates
}
