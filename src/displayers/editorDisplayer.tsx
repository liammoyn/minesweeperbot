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
    const [selectedCoords, setSelectedCoords] = useState<Coord[]>([]);

    useEffect(() => {
        if (board == null) { return; }
        onBoardChange(addSelectedHighlightColor(board, selectedCoords))
    }, [selectedCoords])

    useEffect(() => {
        if (board == null) { return; }
        if (selectedCoords.length > 0) {
            document.addEventListener("keydown", onKeyDown)
        } else {
            document.removeEventListener("keydown", onKeyDown)
        }

        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [selectedCoords, board])

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

    const onSquareClick = (space: Space, isRightClick: boolean, isShiftClick: boolean) => {
        console.log("Is shift", isShiftClick)
        const thisCoord = spaceToCoord(space)
        const alreadySelectedCoord = selectedCoords.find(sc => isSame(sc, thisCoord))
        if (alreadySelectedCoord != null) {
            setSelectedCoords(selectedCoords.filter(sc => !isSame(sc, thisCoord)))
        } else {
            if (isShiftClick) {
                setSelectedCoords([ ...selectedCoords, thisCoord ])
            } else {
                setSelectedCoords([ thisCoord ])
            }
        }
        onCellClick(space, isRightClick)
    }

    const onKeyDown = (event: KeyboardEvent) => {
        if (board !== null && selectedCoords.length > 0) {
            const selectedSpaces = selectedCoords.map(sc => board.grid[sc.row][sc.col])
            let newBoard: Board | null = board
            switch (event.key) {
                case "b":
                    newBoard = onChangeProperty(
                        board,
                        selectedCoords,
                        !selectedSpaces[0].isBomb,
                        null,
                        null,
                    )
                    break;
                case "o":
                    newBoard = onChangeProperty(
                        board,
                        selectedCoords,
                        null,
                        !selectedSpaces[0].isOpen,
                        null,
                    )
                    break;
                case "f":
                    newBoard = onChangeProperty(
                        board,
                        selectedCoords,
                        null,
                        null,
                        !selectedSpaces[0].isFlagged,
                    )
                    break;
            }
            onBoardChange(newBoard as Board)
        }
    }

    const onChangeProperty = (
        board: Board,
        coords: Coord[],
        bomb: boolean | null = null,
        open: boolean | null = null,
        flagged: boolean | null = null,
    ): Board | null => {
        console.log(coords, bomb, open, flagged)
        if (board == null) { return null; }
        const newBoard: Board = {
            gameState: board.gameState,
            grid: updateSpaceCoordsAndBombsNear(
                board.grid.map((row, rIdx) => row.map((s, cIdx) => {
                    if (coords.some(c => c.col === cIdx && c.row === rIdx)) {
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
        return addSelectedHighlightColor(newBoard, coords)
    }

    const addSelectedHighlightColor = (board: Board, selectedCoords: Coord[]): Board => {
        const newBoard: Board = {
            gameState: board.gameState,
            grid: board.grid.map((row, rIdx) => row.map((s, cIdx) => {
                if (selectedCoords.some(sc => sc.col === cIdx && sc.row === rIdx)) {
                    return {
                        ...s,
                        highlightColor: SELECTED_COLOR
                    }
                } else if (s.highlightColor === SELECTED_COLOR) {
                    return {
                        ...s,
                        highlightColor: null
                    }
                } else {
                    return s
                }
            }))
        }
        return newBoard
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
