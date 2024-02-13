import { Board, Displayer } from "../minesweeper/types";

export const getBoardString = (board: Board): string => {
    const gridString = board.grid.reduce((acc, row, rdx) => {
        const rowString = row.reduce((acc, space, cdx) => {
            const spaceString = space.isOpen 
                ? space.isBomb
                    ? "X"
                    : space.bombsNear 
                : space.isBomb
                    ? "x"
                    : "o"
            const seperator = cdx > 0 ? " " : ""
            return `${acc}${seperator}${spaceString}`
        }, "");
        const seperator = rdx > 0 ? "\n" : ""
        return `${acc}${seperator}${rowString}`
    }, "");
    return `${board.gameState}\n${gridString}`
}

const displayer: Displayer = {
    displayBoard: (board: Board) => {
        const gameString = getBoardString(board);
        console.log(gameString)
        return Promise.resolve();
    }

}

export default displayer;
