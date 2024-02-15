import { Board, Move, Coord, Space, Player } from "../minesweeper/types";

const player: Player = {
    newGame: () => Promise.resolve(),
    pickCell: (board: Board): Promise<Move> => {
        const coord = board.grid.reduce((acc: Coord | null, row: Space[], rIdx: number) => {
            if (acc != null) { return acc; }
            const firstFreeCol = row.findIndex(space => !space.isOpen)
            return firstFreeCol !== -1 ? {
                row: rIdx,
                col: firstFreeCol,
            } : null;
        }, null);
        if (coord == null) { console.log("Null move") }
        return Promise.resolve({ coord, action: "POP" })
    }
}

export default player
