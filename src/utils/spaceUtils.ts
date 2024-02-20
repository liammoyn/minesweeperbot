import { Space, Coord } from "../minesweeper/types";

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
