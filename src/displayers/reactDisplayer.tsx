import React, { useState } from 'react';
import { Board, Displayer } from "../minesweeper/types";
import { getBoardString } from "./consoleDisplayer";

export const ReactDisplayerComp = ({ board }: { board: Board | null }) => {

    return (
        <div>
            {board == null ? "null board" : getBoardString(board)}
        </div>
    )
}

const reactDisplayer = (onBoardChange: (board: Board) => void): Displayer => {
    return {
        displayBoard: (board: Board) => {
            onBoardChange(board);
        }
    }
}

export default reactDisplayer;
