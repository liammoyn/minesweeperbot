import { useEffect, useState } from 'react';
import { Board, Space, Coord, BoardConfiguration } from "../minesweeper/types";
import { updateSpaceCoordsAndBombsNear } from '../utils/gridUtils';
import { isSame, spaceToCoord } from '../utils/spaceUtils';
import { getBoardFromConfig } from '../utils/playerUtils';
import BoardSelector from '../components/BoardSelector';
import ReactBoard from '../components/ReactBoard';
import { getBoardFromString, getStringFromBoard } from '../minesweeper/boardStringInterpretor';

const SELECTED_COLOR = "/#FA0"

interface EditorProps {
    boardConfig: BoardConfiguration,
    onBoardConfigChange: (b: BoardConfiguration) => void
}

// TODO: Update board config based on editor's board
const Editor = ({ boardConfig, onBoardConfigChange }: EditorProps) => {
    const [currentBoard, setCurrentBoard] = useState<Board>(getBoardFromString("ooooboooo"));
    const [selectedCoords, setSelectedCoords] = useState<Coord[]>([]);

    useEffect(() => {
        if (boardConfig.width > 0 && boardConfig.height > 0) {
            let newGrid = currentBoard.grid
            const currentHeight = newGrid.length
            const newHeight = boardConfig.height
            let direction = currentHeight < newHeight ? 1 : -1
            for (let i = currentHeight; i !== newHeight; i += direction) {
                if (direction == 1) {
                    newGrid = addRow(newGrid)
                } else {
                    newGrid = deleteRow(newGrid)
                }
            }
            const currentWidth = newGrid[0].length
            const newWidth = boardConfig.width
            direction = currentWidth < newWidth ? 1 : -1
            for (let i = currentWidth; i !== newWidth; i += direction) {
                if (direction == 1) {
                    newGrid = addCol(newGrid)
                } else {
                    newGrid = deleteCol(newGrid)
                }
            }
            const currentBombs = newGrid.reduce((acc, row) => acc + row.reduce((acc1, s) => acc1 + (s.isBomb ? 1 : 0), 0), 0)
            const newBombs = boardConfig.bombs
            direction = currentBombs < newBombs ? 1 : -1
            for (let i = currentBombs; i !== newBombs; i += direction) {
                if (direction == 1) {
                    newGrid = addBomb(newGrid, i)
                } else {
                    newGrid = deleteBomb(newGrid, i)
                }
            }
            setCurrentBoard({
                grid: updateSpaceCoordsAndBombsNear(newGrid),
                gameState: currentBoard.gameState
            })
        }
    }, [boardConfig])

    useEffect(() => {
        if (currentBoard == null) { return; }
        setCurrentBoard(addSelectedHighlightColor(currentBoard, selectedCoords))
    }, [selectedCoords])

    useEffect(() => {
        if (currentBoard == null) { return; }
        if (selectedCoords.length > 0) {
            document.addEventListener("keydown", onKeyDown)
        } else {
            document.removeEventListener("keydown", onKeyDown)
        }

        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [selectedCoords, currentBoard])

    const addRow = (currentGrid: Space[][]): Space[][] => {
        return [
            ...currentGrid,
            currentGrid[currentGrid.length - 1].slice().map(s => ({ ...s, isBomb: false, isFlagged: false, isOpen: false }))
        ]
    }

    const deleteRow = (currentGrid: Space[][]): Space[][] => {
        return currentGrid.slice(0, -1)
    }

    const addCol = (currentGrid: Space[][]): Space[][] => {
        return currentGrid.map(row => [...row, { ...row[row.length - 1], isBomb: false, isFlagged: false, isOpen: false }])
    }

    const deleteCol = (currentGrid: Space[][]): Space[][] => {
        return currentGrid.map(row => row.slice(0, -1))
    }

    const addBomb = (currentGrid: Space[][], currentBombs: number): Space[][] => {
        const nonBombSpaces = currentGrid[0].length * currentGrid.length - currentBombs
        let newBombIdx = Math.floor(Math.random() * nonBombSpaces)
        const newGrid = currentGrid.map(row => row.map(s => {
            if (s.isBomb) {
                return s
            } else {
                if (newBombIdx-- == 0) {
                    return { ...s, isBomb: true}
                } else {
                    return s
                }
            }
        }))
        return newGrid
    }

    const deleteBomb = (currentGrid: Space[][], currentBombs: number): Space[][] => {
        let removedBombIdx = Math.floor(Math.random() * currentBombs)
        const newGrid = currentGrid.map(row => row.map(s => {
            if (!s.isBomb) {
                return s
            } else {
                if (removedBombIdx-- == 0) {
                    return { ...s, isBomb: false}
                } else {
                    return s
                }
            }
        }))
        return newGrid
    }

    const onSquareClick = (space: Space, isRightClick: boolean, isShiftClick: boolean) => {
        console.log("Is shift", isShiftClick)
        const thisCoord = spaceToCoord(space)
        const alreadySelectedCoord = selectedCoords.find(sc => isSame(sc, thisCoord))
        if (alreadySelectedCoord != null) {
            setSelectedCoords(selectedCoords.filter(sc => !isSame(sc, thisCoord)))
        } else {
            if (isShiftClick) {
                setSelectedCoords([...selectedCoords, thisCoord])
            } else {
                setSelectedCoords([thisCoord])
            }
        }
    }

    const onKeyDown = (event: KeyboardEvent) => {
        if (currentBoard !== null && selectedCoords.length > 0) {
            const selectedSpaces = selectedCoords.map(sc => currentBoard.grid[sc.row][sc.col])
            let newBoard: Board | null = currentBoard
            switch (event.key) {
                case "b":
                    newBoard = onChangeProperty(
                        currentBoard,
                        selectedCoords,
                        !selectedSpaces[0].isBomb,
                        !selectedSpaces[0].isBomb ? false : null,
                        null,
                    )
                    break;
                case "o":
                    newBoard = onChangeProperty(
                        currentBoard,
                        selectedCoords,
                        !selectedSpaces[0].isOpen ? false : null,
                        !selectedSpaces[0].isOpen,
                        null,
                    )
                    break;
                case "f":
                    newBoard = onChangeProperty(
                        currentBoard,
                        selectedCoords,
                        null,
                        !selectedSpaces[0].isFlagged ? false : null,
                        !selectedSpaces[0].isFlagged,
                    )
                    break;
            }
            setCurrentBoard(newBoard as Board)
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
        <div>
            <BoardSelector
                boardConfig={boardConfig}
                onBoardConfigChange={bc => onBoardConfigChange(bc)}
                onApply={() => setCurrentBoard(getBoardFromConfig(boardConfig))}
            />
            {currentBoard && (
                <ReactBoard
                    board={currentBoard}
                    onCellClick={onSquareClick}
                    showBomb={true}
                />
            )}
        </div>
    )
}

export default Editor
