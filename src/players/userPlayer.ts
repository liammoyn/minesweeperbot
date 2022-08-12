import { Board, Move, Coord, Space, Player } from "../minesweeper/types";

const userPlayer = (onAwaitMove: () => Promise<Move>): Player => {
    return {
        pickCell: (board: Board): Promise<Move> => {
            return onAwaitMove()
        }
    }
}

export default userPlayer;
