import { Board, Displayer } from "../minesweeper/types";

const reactDisplayer = (onBoardChange: (board: Board) => void, displayDelay: number, stepResolve: (() => Promise<void>) | null): Displayer => {
    return {
        displayBoard: (board: Board) => {
            onBoardChange(board);
            if (stepResolve) {
                return stepResolve()
            } else {
                return new Promise(resolve => setTimeout(resolve, displayDelay));
            }
        }
    }
}

export default reactDisplayer;
