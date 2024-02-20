import { useEffect, useState } from 'react';
import { Board, Displayer, Space, Coord } from "../minesweeper/types";
import { ReactDisplayerComp } from './reactDisplayer';
import { Button } from '@mui/material';
import { getBoardFromString } from '../minesweeper/boardStringInterpretor';
import { updateSpaceCoordsAndBombsNear } from '../utils/gridUtils';
import { isSame, spaceToCoord } from '../utils/spaceUtils';

interface EditorDisplayerCompProps {
    board: Board | null,
    onCellClick: (coord: Space, isRightClick: boolean) => void,
    onBoardChange: (newBoard: Board) => void,
}

const SELECTED_COLOR = "/#FA0"

export const EditorDisplayerComp = ({ board, onCellClick, onBoardChange }: EditorDisplayerCompProps) => {
    const [selectedCoord, setSelectedCoord] = useState<Coord | null>(null);

    useEffect(() => {
        if (board == null) { return; }
        const newBoard: Board = {
            gameState: board.gameState,
            grid: board.grid.map((row, rIdx) => row.map((s, cIdx) => {
                if (selectedCoord?.col == cIdx && selectedCoord?.row == rIdx) {
                    return {
                        ...s,
                        highlightColor: SELECTED_COLOR
                    }
                } else if (s.highlightColor == SELECTED_COLOR) {
                    return {
                        ...s,
                        highlightColor: null
                    }
                } else {
                    return s
                }
            }))
        }
        onBoardChange(newBoard)
    }, [selectedCoord])

    const addRow = () => {
        if (board == null) {
            onBoardChange(getBoardFromString("ooo"))
            return;
        }
        const newBoard: Board = { 
            grid: updateSpaceCoordsAndBombsNear([
                ...board.grid,
                board.grid[board.grid.length - 1].slice()
            ]),
            gameState: board.gameState
        }
        onBoardChange(newBoard)
    }

    const deleteRow = () => {
        if (board == null) {
            return;
        }
        const newBoard: Board = { 
            grid: updateSpaceCoordsAndBombsNear(board.grid.slice(0, -1)),
            gameState: board.gameState
        }
        onBoardChange(newBoard)
    }

    const addCol = () => {
        if (board == null) {
            onBoardChange(getBoardFromString("ooo"))
            return;
        }
        const newBoard: Board = { 
            grid: updateSpaceCoordsAndBombsNear(board.grid.map(row => [...row, row[row.length - 1]])),
            gameState: board.gameState
        }
        onBoardChange(newBoard)
    }

    const deleteCol = () => {
        if (board == null) {
            return;
        }
        const newBoard: Board = { 
            grid: updateSpaceCoordsAndBombsNear(board.grid.map(row => row.slice(0, -1))),
            gameState: board.gameState
        }
        onBoardChange(newBoard)
    }

    const onSquareClick = (space: Space, isRightClick: boolean) => {
        const thisCoord = spaceToCoord(space)
        if (isSame(thisCoord, selectedCoord)) {
            setSelectedCoord(null)
        } else {
            setSelectedCoord(thisCoord)
        }
        onCellClick(space, isRightClick)
    }

    const onChangeProperty = (
        coord: Coord,
        bomb: boolean | null = null,
        open: boolean | null = null,
        flagged: boolean | null = null,
    ) => {
        if (board == null) { return; }
        const newBoard: Board = {
            gameState: board.gameState,
            grid: updateSpaceCoordsAndBombsNear(
                board.grid.map((row, rIdx) => row.map((s, cIdx) => {
                    if (coord?.col == cIdx && coord?.row == rIdx) {
                        return {
                            ...s,
                            isBomb: bomb == null ? s.isBomb : bomb,
                            isOpen: open == null ? s.isOpen : open,
                            isFlagged: flagged == null ? s.isFlagged : flagged,
                        }
                    } else {
                        return s
                    }
                }))
            )
        }
        onBoardChange(newBoard)
    }

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
            <ReactDisplayerComp
                board={board}
                onCellClick={onSquareClick}
                showBomb={true}
            />
            <Button onClick={addRow} variant="outlined">Add Row</Button>
            <Button onClick={deleteRow} variant="outlined">Delete Row</Button>
            <Button onClick={addCol} variant="outlined">Add Col</Button>
            <Button onClick={deleteCol} variant="outlined">Delete Col</Button>
        </div>
    )
}

const editorDisplayer = (onBoardChange: (board: Board) => void, displayDelay: number, stepResolve: (() => Promise<void>) | null): Displayer => {
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

export default editorDisplayer;
