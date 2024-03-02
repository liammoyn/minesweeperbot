import { Board, Displayer, Space } from "../minesweeper/types";

interface ReactDisplayerCompProps {
    board: Board | null,
    onCellClick: (space: Space, isRightClick: boolean, isShiftClick: boolean) => void,
    showBomb: boolean,
}

export const ReactDisplayerComp = ({ board, onCellClick, showBomb }: ReactDisplayerCompProps) => {

    const getTextColor = (space: Space): string => {
        const openBlankColor = (num: number): string => {
            switch (num) {
                case 1: return "#22F"
                case 2: return "#2C2"
                case 3: return "#F22"
                case 4: return "#62F"
                case 5: return "#922"
                case 6: return "#299"
                case 7: return "#BA5"
                case 8: return "#555"
            }
            return "#FFF"
        }
        return space.isOpen
            ? openBlankColor(space.bombsNear)
            : "#FFF"
    }

    const getBackgroundColor = (space: Space, gameFinished: boolean): string => {
        if ((space.highlightColor?.split("/")?.length || 0) > 1) {
            return space.highlightColor?.split("/")[1]!!
        }
        return space.isBomb
            ? space.isOpen || gameFinished
                ? "#F00"
                : space.isFlagged ? "#FA0" : "#888"
            : space.isOpen
                ? "#DDD"
                : space.isFlagged ? "#FA0" : "#888"
    }

    const getBorderColor = (space: Space): string => {
        return space.highlightColor == null || space.highlightColor.split("/")[0].length === 0 
            ? "#999"
            : space.highlightColor.split("/")[0]
    }

    const onSquareClick = (ridx: number, cidx: number, isRightClick: boolean, isShiftClick: boolean) => {
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
        if (boardSpace != null) {
            // Send event to parent that will run take turn
            onCellClick(boardSpace!!, isRightClick, isShiftClick)
        }
    }

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
            <div>
                {`Game state: ${board?.gameState}`}
            </div>
            <div style={{ border: "2px solid #111", width: "min-content", padding: "5px" }}>
                {board?.grid.map((row, ridx) => (
                    <div key={ridx} style={{ display: "flex", flexDirection: "row", justifyContent: "center", width: "min-content" }}>
                        {row.map((space, cidx) => (
                            <div 
                                key={cidx}
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    border: `1px solid ${getBorderColor(space)}`,
                                    backgroundColor: getBackgroundColor(space, board.gameState === "WON" || board.gameState === "LOST"),
                                    color: getTextColor(space),
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                    lineHeight: "30px",
                                }}
                                onClick={(e) => onSquareClick(ridx, cidx, false, e.shiftKey)}
                                onContextMenu={e => {e.preventDefault(); onSquareClick(ridx, cidx, true, e.shiftKey);}}
                            >
                                {
                                    space.isOpen 
                                    ? space.isBomb
                                        ? "x"
                                        : space.bombsNear 
                                    : space.isFlagged
                                        ? "F"
                                        : space.isBomb
                                            ? showBomb ? "x" : ""
                                            : ""
                                }
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

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
