import React, { useState } from 'react';
import { Board, Displayer, Space, Coord } from "../minesweeper/types";

interface ReactDisplayerCompProps {
    board: Board | null,
    onCellClick: (coord: Coord, isRightClick: boolean) => void,
}

export const ReactDisplayerComp = ({ board, onCellClick }: ReactDisplayerCompProps) => {

    const getSpaceColor = (space: Space): string => {
        return space.isOpen 
            ? space.isBomb
                ? "red"
                : "white" 
            : space.isFlagged
                ? "#A55"
                : "gray"
    }

    const onSquareClick = (ridx: number, cidx: number, isRightClick: boolean) => {
        const boardSpace = board?.grid[ridx][cidx];
        if (!boardSpace?.isOpen) {
            // Send event to parent that will run take turn
            onCellClick({ row: ridx, col: cidx }, isRightClick)
        }
    }

    return (
        <div>
            <div>
                {`Game state: ${board?.gameState}`}
            </div>
            {board?.grid.map((row, ridx) => (
                <div key={ridx} style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    {row.map((space, cidx) => (
                        <div 
                            key={cidx}
                            style={{ width: "30px", height: "30px", border: "1px solid red", backgroundColor: getSpaceColor(space) }}
                            onClick={() => onSquareClick(ridx, cidx, false)}
                            onContextMenu={e => {e.preventDefault(); onSquareClick(ridx, cidx, true);}}
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

const reactDisplayer = (onBoardChange: (board: Board) => void, displayDelay: number): Displayer => {
    return {
        displayBoard: (board: Board) => {
            onBoardChange(board);
            return new Promise(resolve => setTimeout(resolve, displayDelay));
        }
    }
}

export default reactDisplayer;
