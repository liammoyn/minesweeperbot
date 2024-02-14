import { Space, Coord } from "../minesweeper/types";

export const spaceToCoord = (space: Space): Coord => ({
    col: space.col,
    row: space.row
})
