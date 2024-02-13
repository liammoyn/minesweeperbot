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
                ? "#990"
                : "#AAA"
    }

    const getBorderColor = (space: Space): string => {
        return space.highlightColor == null ? "red" : space.highlightColor
    }

    const onSquareClick = (ridx: number, cidx: number, isRightClick: boolean) => {
        const boardSpace = board?.grid[ridx][cidx];
        console.log(`{
            row: ${ridx},
            col: ${cidx},
            isBomb: ${boardSpace?.isBomb},
            isFlagged: ${boardSpace?.isFlagged},
            isOpen: ${boardSpace?.isOpen},
            bombsNear: ${boardSpace?.bombsNear},
            highlightColor: ${boardSpace?.highlightColor},
        }`)
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
                            style={{
                                width: "30px",
                                height: "30px",
                                border: `1px solid ${getBorderColor(space)}`,
                                backgroundColor: getSpaceColor(space) }}
                            onClick={() => onSquareClick(ridx, cidx, false)}
                            onContextMenu={e => {e.preventDefault(); onSquareClick(ridx, cidx, true);}}
                        >
                            {
                                space.isOpen 
                                ? space.isBomb
                                    ? "x"
                                    : space.bombsNear 
                                : space.isFlagged
                                    ? "F"
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
