import { Board, Coord, Move, Player, Space } from "../minesweeper/types";

/**
 * Questions to answer:
 * How many ways can N bombs be arranged in X unknown squares?
 * How do we construct a CSP from some set of unknown squares and neighboring numbers?
 * - How do we divide squares into distinct groups?
 * - How do we model constraints between squares?
 * What is the number of arangements for an unknown edge with M bombs for all satisfiable M?
 * Given all possible arrangements for an edge or plane, what square has the lowest probability of being a bomb?
 */
const cspPlayer: Player = {
    newGame: () => Promise.resolve(),
    pickCell: (board: Board): Promise<Move> => {
        const coord = board.grid.reduce((acc: Coord | null, row: Space[], rIdx: number) => {
            if (acc != null) { return acc; }
            const firstFreeCol = row.findIndex(space => !space.isOpen)
            return firstFreeCol != -1 ? {
                row: rIdx,
                col: firstFreeCol,
            } : null;
        }, null);
        if (coord == null) { console.log("Null move") }
        return Promise.resolve({ coord, action: "POP" })
    }
}

export default cspPlayer
