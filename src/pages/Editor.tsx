import { useState } from "react";
import BoardSelector from "../components/BoardSelector";
import ReactBoard from "../components/ReactBoard";
import { BoardConfiguration, Board } from "../minesweeper/types";
import { getBoardFromConfig } from "../utils/playerUtils";
import EditorOptions from "../components/EditorOptions";


interface EditorProps {
    boardConfig: BoardConfiguration,
    onBoardConfigChange: (b: BoardConfiguration) => void
}

const Editor = ({ boardConfig, onBoardConfigChange }: EditorProps) => {
    const [currentBoard, setCurrentBoard] = useState<Board | null>(getBoardFromConfig(boardConfig));

    const onEditorBoardChange = (newBoard: Board) => {
        setCurrentBoard(newBoard)
    }

    return (
        <div>
            <BoardSelector
                boardConfig={boardConfig}
                onBoardConfigChange={bc => onBoardConfigChange(bc)}
                onApply={() => setCurrentBoard(getBoardFromConfig(boardConfig))}
            />
            {currentBoard && (
                // TODO: Take react board out of editor options
                // TODO: Keep board config consistent
                <EditorOptions
                    board={currentBoard}
                    onCellClick={() => { }}
                    onBoardChange={onEditorBoardChange}
                />
            )}
        </div>
    )
}

export default Editor
