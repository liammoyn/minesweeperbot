import React, { useState } from 'react';
import { Board, Displayer, Space } from "../minesweeper/types";
import { getBoardString } from "./consoleDisplayer";

export const ReactDisplayerComp = ({ board }: { board: Board | null }) => {

    const getSpaceColor = (space: Space): string => {
        return space.isOpen 
            ? space.isBomb
                ? "red"
                : "white" 
            : "gray"
    }

    const onSquareClick = (ridx: number, cidx: number) => {
        const boardSpace = board?.grid[ridx][cidx];
        if (!boardSpace?.isOpen) {
            // Send event to parent that will run take turn
        }
    }

    return (
        <div>
            <div>
                {`Game state: ${board?.gameState}`}
            </div>
            {board?.grid.map((row, ridx) => (
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    {row.map((space, cidx) => (
                        <div 
                            style={{ width: "30px", height: "30px", border: "1px solid red", backgroundColor: getSpaceColor(space) }}
                            onClick={() => onSquareClick(ridx, cidx)}
                        >
                            {
                                space.isOpen 
                                ? space.isBomb
                                    ? "X"
                                    : space.bombsNear 
                                : space.isBomb
                                    ? "x"
                                    : ""
                            }
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

const reactDisplayer = (onBoardChange: (board: Board) => void): Displayer => {
    return {
        displayBoard: (board: Board) => {
            onBoardChange(board);
            return new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

export default reactDisplayer;
