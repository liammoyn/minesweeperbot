import { useState } from "react";
import { Board, BoardConfiguration, Move, Space } from "../minesweeper/types";
import { spaceToCoord } from "../utils/spaceUtils";
import ReactBoard from "../components/ReactBoard";
import BoardSelector from "../components/BoardSelector";
import { getBoardFromConfig, getPlayerForId } from "../utils/playerUtils";
import minesweeper from "../minesweeper/minesweeper";
import reactDisplayer from "../displayers/reactDisplayer";
import userPlayer from "../players/userPlayer";
import { Button } from "@mui/material";

interface UserPlayProps {
    boardConfig: BoardConfiguration,
    onBoardConfigChange: (b: BoardConfiguration) => void
}

const UserPlay = ({ boardConfig, onBoardConfigChange }: UserPlayProps) => {
    const [currentBoard, setCurrentBoard] = useState<Board | null>(null);

    const [currentMoveResolve, setCurrentMoveResolve] = useState<(m: Move) => void>();

    const runMinesweeper = () => {
        const displayer = reactDisplayer(setCurrentBoard, 0, null)
        const player = getPlayerForId("USER", false, 0, onUserMove)

        let newBoard: Board = getBoardFromConfig(boardConfig)
        setCurrentBoard(newBoard)
        minesweeper(newBoard, displayer, player);
    }

    const onUserMove = (): Promise<Move> => {
        return new Promise((resolve, reject) => {
            setCurrentMoveResolve(() => resolve);
        })
    }

    const onCellClick = (space: Space, isRightClick: boolean) => {
        if (currentMoveResolve && !space.isOpen) {
            const action = isRightClick ? "FLAG" : "POP";
            const move: Move = { coord: spaceToCoord(space), action }
            currentMoveResolve(move)
        }
    }

    return (
        <div>
            <BoardSelector
                boardConfig={boardConfig}
                onBoardConfigChange={bc => onBoardConfigChange(bc)}
                onApply={() => setCurrentBoard(getBoardFromConfig(boardConfig))}
            />
            <Button onClick={runMinesweeper} variant="outlined">
                Play Minesweeper
            </Button>
            {currentBoard && (
                <ReactBoard
                    board={currentBoard}
                    showBomb={false}
                    onCellClick={onCellClick}
                />
            )}
        </div>
    )
}

export default UserPlay
