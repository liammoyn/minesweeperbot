import { Space, Coord } from "../minesweeper/types";

export const coordToString = (coord: Coord) => `${coord.col}#${coord.row}`

export const stringToCoord = (coordString: string): Coord => ({
    col: parseInt(coordString.split("#")[0]),
    row: parseInt(coordString.split("#")[1]),
})

export const spaceToCoord = (space: Space): Coord => ({
    col: space.col,
    row: space.row
})

export const isSame = (c1: Coord | null, c2: Coord | null): boolean => {
    if (c1 == null || c2 == null) {
        return c1 == c2
    }
    return c1.col === c2.col && c1.row === c2.row
}
