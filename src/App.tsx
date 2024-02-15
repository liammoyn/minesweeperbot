import { useEffect, useState } from 'react';
import './App.css';
import consoleDisplayer from "./displayers/consoleDisplayer" 
import naivePlayer from "./players/naivePlayer" 
import reactDisplayer, { ReactDisplayerComp } from "./displayers/reactDisplayer"
import minesweeper from './minesweeper/minesweeper';
import { getNewBoard } from './minesweeper/boardGenerator';
import { Button, Checkbox, MenuItem, Select, TextField } from '@mui/material';
import { Board, Displayer, Player, Coord, Move } from './minesweeper/types';
import userPlayer from './players/userPlayer';
import simplePlayer from './players/simplePlayer';
import { getBoardFromString, getStringFromBoard } from './minesweeper/boardStringInterpretor';
import contextAwarePlayer from './players/contextAwarePlayer';

const App = () => {
  const [height, setHeight] = useState(5);
  const [width, setWidth] = useState(5);
  const [bombs, setBombs] = useState(5);
  const [displayerId, setDisplayerId] = useState("REACT");
  const [displayer, setDisplayer] = useState<Displayer>(consoleDisplayer);
  const [playerId, setPlayerId] = useState("CONTEXT");
  const [player, setPlayer] = useState<Player>(naivePlayer);

  const [useStepper, setUseStepper] = useState<boolean>(false);
  const [currentStepResolve, setCurrentStepResolve] = useState<() => void>();

  const [useCustomBoard, setUseCustomBoard] = useState<boolean>(false);
  const [customBoardString, setCustomBoardString] = useState<string>("");

  const [showBoardString, setShowBoardString] = useState<boolean>(false);
  const [currentBoardString, setCurrentBoardString] = useState<string>("");

  const [currentMoveResolve, setCurrentMoveResolve] = useState<(m: Move) => void>();

  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    if (showBoardString) {
      setCurrentBoardString(board == null ? "" : getStringFromBoard(board.grid!!))
    }
  }, [showBoardString, board])

  useEffect(() => {
    const displayDelay = getDisplayDelay(playerId)
    switch (displayerId) {
      case "CONSOLE":
        setDisplayer(consoleDisplayer);
        break;
      case "REACT":
        setDisplayer(reactDisplayer(setBoard, displayDelay, useStepper ? onWaitForNextStep : null));
        break;
    }
  }, [displayerId, playerId, useStepper])

  useEffect(() => {
    switch (playerId) {
      case "NAIVE":
        setPlayer(naivePlayer);
        break;
      case "USER":
        setPlayer(userPlayer(onUserMove))
        break;
      case "SIMPLE":
        setPlayer(simplePlayer())
        break;
      case "CONTEXT":
        setPlayer(contextAwarePlayer())
        break;
    }
  }, [playerId])

  const runMinesweeper = () => {
    let board: Board
    if (useCustomBoard) {
      board = getBoardFromString(customBoardString)
    } else {
      console.log(`Running with ${width} ${height} ${bombs}`)
      board = getNewBoard(width, height, bombs)
    }
    minesweeper(board, displayer, player);
  }

  const getDisplayDelay = (playerId: string): number => {
    switch (playerId) {
      case "NAIVE":
        return 1000;
      case "USER":
        return 0;
    }
    return 500;
  }

  const onUserMove = (): Promise<Move> => {
    return new Promise((resolve, reject) => {
      setCurrentMoveResolve(() => resolve);
    })
  }

  const onCellClick = (coord: Coord, isRightClick: boolean) => {
    const action = isRightClick ? "FLAG" : "POP";
    const move: Move = { coord, action }
    if (currentMoveResolve) {
      currentMoveResolve(move)
    }
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
    <div className="App" style={{ paddingTop: "50px" }}>
      <div>
        <div style={{ paddingBottom: "5px" }}>
          <div>
            <label>Use Custom Board?</label>
            <Checkbox
              checked={useCustomBoard}
              onChange={({ target }) => setUseCustomBoard(target.checked)}
            />
          </div>
          {useCustomBoard ? (
            <div>
              <TextField
                label="Board String"
                type="string"
                value={customBoardString}
                onChange={({ target }) => setCustomBoardString(target.value as unknown as string)}
              />
            </div>
          ) : (
            <div>
              <TextField
                label="Height"
                type="number"
                value={height}
                onChange={({ target }) => setHeight(parseInt(target.value))}
              />
              <TextField
                label="Width"
                type="number"
                value={width}
                onChange={({ target }) => setWidth(parseInt(target.value))}
              />
              <TextField
                label="Bombs"
                type="number"
                value={bombs}
                onChange={({ target }) => setBombs(parseInt(target.value))}
              />
            </div>
          )}
        </div>
        <Select
          label="Displayer"
          value={displayerId}
          onChange={({ target }) => setDisplayerId(target.value)}
        >
          <MenuItem value={"CONSOLE"}>Console</MenuItem>
          <MenuItem value={"REACT"}>React</MenuItem>
        </Select>
        <Select
          label="Player"
          value={playerId}
          onChange={({ target }) => setPlayerId(target.value)}
        >
          <MenuItem value={"USER"}>User</MenuItem>
          <MenuItem value={"NAIVE"}>Naive</MenuItem>
          <MenuItem value={"SIMPLE"}>Simple</MenuItem>
          <MenuItem value={"CONTEXT"}>Context Aware</MenuItem>
        </Select>
        <div>
          <label>Use Stepper?</label>
          <Checkbox
            checked={useStepper}
            onChange={({ target }) => setUseStepper(target.checked)}
          />
        </div>
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
      {board !== null && (
        <div style={{ paddingTop: "20px", paddingBottom: "20px" }}>
          {displayerId === "REACT" && (
            <div>
              <ReactDisplayerComp
                board={board}
                onCellClick={onCellClick}
                showBomb={playerId !== "USER"}
              />
              {useStepper && (
                <div style={{ paddingTop: "10px" }}>
                  <Button onClick={stepForward} variant="outlined">
                    Step
                  </Button>
                </div>
              )}
              {showBoardString && (
                <div>{currentBoardString}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
