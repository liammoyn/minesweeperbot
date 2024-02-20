import { Board, Move, Player } from "../minesweeper/types";

const userPlayer = (onAwaitMove: () => Promise<Move>): () => Player => {
    return () => ({
        newGame: () => Promise.resolve(),
        pickCell: (board: Board): Promise<Move> => {
            return onAwaitMove()
        }
    })
}

export default userPlayer;
