import { Button, Checkbox, MenuItem, Select, TextField } from "@mui/material"
import BoardSelector from "../components/BoardSelector"
import { Board, BoardConfiguration, Displayer, Player } from "../minesweeper/types"
import { useEffect, useState } from "react"
import combinedPlayer from "../players/combinedPlayer"
import reactDisplayer from "../displayers/reactDisplayer"
import { getBoardFromConfig, getPlayerForId } from "../utils/playerUtils"
import { getBoardFromString, getStringFromBoard } from "../minesweeper/boardStringInterpretor"
import { getNewBoard } from "../minesweeper/boardGenerator"
import minesweeper from "../minesweeper/minesweeper"
import ReactBoard from "../components/ReactBoard"

interface BotViewerProps {
    boardConfig: BoardConfiguration,
    onBoardConfigChange: (b: BoardConfiguration) => void
}

const BotViewer = ({ boardConfig, onBoardConfigChange }: BotViewerProps) => {
    const [currentBoard, setCurrentBoard] = useState<Board | null>(null);

    const [playerId, setPlayerId] = useState("COMBINED");
    const [player, setPlayer] = useState<Player>(combinedPlayer(true, 0));

    const [showBoardString, setShowBoardString] = useState<boolean>(false);
    const [currentBoardString, setCurrentBoardString] = useState<string>("");

    const [delayMillis, setDelayMillis] = useState<number>(0)
    const [useStepper, setUseStepper] = useState<boolean>(false);
    const [currentStepResolve, setCurrentStepResolve] = useState<() => void>();

    const [displayer, setDisplayer] = useState<Displayer>(reactDisplayer(setCurrentBoard, 0, null));

    useEffect(() => {
        if (showBoardString) {
            setCurrentBoardString(currentBoard == null ? "" : getStringFromBoard(currentBoard.grid!!))
        }
    }, [showBoardString, currentBoard])

    useEffect(() => {
        setDisplayer(reactDisplayer(setCurrentBoard, delayMillis, useStepper ? onWaitForNextStep : null));
    }, [delayMillis, playerId, useStepper])

    useEffect(() => {
        setPlayer(getPlayerForId(playerId, true, delayMillis))
    }, [playerId])

    const runMinesweeper = () => {
        let newBoard: Board = getBoardFromConfig(boardConfig)
        setCurrentBoard(newBoard)
        minesweeper(newBoard, displayer, player);
    }

    const stepForward = () => {
        if (currentStepResolve) {
            currentStepResolve()
        }
    }

    const onWaitForNextStep = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            setCurrentStepResolve(() => resolve);
        })
    }

    return (
        <>
            <BoardSelector
                boardConfig={boardConfig}
                onBoardConfigChange={bc => onBoardConfigChange(bc)}
                onApply={() => setCurrentBoard(getBoardFromConfig(boardConfig))}
            />
            <Select
                label="Player"
                value={playerId}
                onChange={({ target }) => setPlayerId(target.value)}
            >
                <MenuItem value={"USER"}>User</MenuItem>
                <MenuItem value={"NAIVE"}>Naive</MenuItem>
                <MenuItem value={"SIMPLE"}>Simple</MenuItem>
                <MenuItem value={"CONTEXT"}>Context Aware</MenuItem>
                <MenuItem value={"CONTEXTV2"}>Context Aware V2</MenuItem>
                <MenuItem value={"CSP"}>CSP</MenuItem>
                <MenuItem value={"COMBINED"}>Combined</MenuItem>
            </Select>
            <div style={{ paddingTop: "10px" }}>
                <label>Use Stepper?</label>
                <Checkbox
                    checked={useStepper}
                    onChange={({ target }) => setUseStepper(target.checked)}
                />
                {!useStepper && (
                    <TextField
                        label="DelayMs"
                        type="number"
                        value={delayMillis}
                        onChange={({ target }) => setDelayMillis(parseInt(target.value ?? 0))}
                    />
                )}
                <div>
                    <label>Show Board String?</label>
                    <Checkbox
                        checked={showBoardString}
                        onChange={({ target }) => setShowBoardString(target.checked)}
                    />
                </div>
                <Button onClick={runMinesweeper} variant="outlined">
                    Play Minesweeper
                </Button>
            </div>
            {currentBoard != null && (
                <div style={{ paddingBottom: "20px" }}>
                    {useStepper && (
                        <div style={{ paddingTop: "10px" }}>
                            <Button onClick={stepForward} variant="outlined">
                                Step
                            </Button>
                        </div>
                    )}
                    <ReactBoard
                        board={currentBoard}
                        showBomb={true}
                    />
                    {showBoardString && (
                        <div>{currentBoardString}</div>
                    )}
                </div>
            )}
        </>
    )
}

export default BotViewer
