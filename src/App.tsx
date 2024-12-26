import { useEffect, useState } from 'react';
import consoleDisplayer, { getBoardString } from "./displayers/consoleDisplayer" 
import naivePlayer from "./players/naivePlayer" 
import reactDisplayer, { ReactDisplayerComp } from "./displayers/reactDisplayer"
import noneDisplayer from "./displayers/noneDisplayer"
import minesweeper from './minesweeper/minesweeper';
import { copyBoard, getNewBoard } from './minesweeper/boardGenerator';
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select, TextField } from '@mui/material';
import { Board, Displayer, Player, Move, GameState, Space, BenchmarkResults, BenchmarkResult } from './minesweeper/types';
import userPlayer from './players/userPlayer';
import simplePlayer from './players/simplePlayer';
import { getBoardFromString, getStringFromBoard } from './minesweeper/boardStringInterpretor';
import contextAwarePlayer from './players/contextAwarePlayer';
import contextAwarePlayerV2 from './players/contextAwarePlayerV2';
import benchmarkDisplayer, { BenchmarkDisplayerComp } from './displayers/benchmarkDisplayer';
import { spaceToCoord } from './utils/spaceUtils';
import editorDisplayer, { EditorDisplayerComp } from './displayers/editorDisplayer';
import './App.css';
import cspPlayer from './players/cspPlayer';

const App = () => {
  const [height, setHeight] = useState(5);
  const [width, setWidth] = useState(5);
  const [bombs, setBombs] = useState(5);
  const [displayerId, setDisplayerId] = useState("REACT");
  const [displayer, setDisplayer] = useState<Displayer>(consoleDisplayer);
  const [playerId, setPlayerId] = useState("CONTEXTV2");
  const [player, setPlayer] = useState<Player>(contextAwarePlayer(true, 1000));
  const [benchmarkPlayers, setBenchmarkPlayers] = useState({
    NAIVE: false,
    SIMPLE: false,
    CONTEXT: false,
    CONTEXTV2: false,
    CSP: false
  })

  const [useStepper, setUseStepper] = useState<boolean>(false);
  const [currentStepResolve, setCurrentStepResolve] = useState<() => void>();

  const [useCustomBoard, setUseCustomBoard] = useState<boolean>(false);
  const [customBoardString, setCustomBoardString] = useState<string>("");

  const [showBoardString, setShowBoardString] = useState<boolean>(false);
  const [currentBoardString, setCurrentBoardString] = useState<string>("");

  const [currentMoveResolve, setCurrentMoveResolve] = useState<(m: Move) => void>();

  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults>([]);

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
      case "BENCHMARK":
        setDisplayer(benchmarkDisplayer());
        break;
      case "EDITOR":
        setBoard(getBoardFromString("ooooboooo"))
        setDisplayer(editorDisplayer(setBoard, displayDelay, useStepper ? onWaitForNextStep : null));
        break;
    }
  }, [displayerId, playerId, useStepper])

  useEffect(() => {
    setPlayer(getPlayerForId(playerId))
  }, [playerId])

  const runMinesweeper = () => {
    let newBoard: Board
    if (displayerId === "EDITOR" && (board?.gameState === "NEW" || board?.gameState === "IN_PROGRESS")) {
      newBoard = board!!
    } else if (useCustomBoard) {
      newBoard = getBoardFromString(customBoardString)
    } else {
      console.log(`Running with ${width} ${height} ${bombs}`)
      newBoard = getNewBoard(width, height, bombs)
    }
    minesweeper(newBoard, displayer, player);
  }

  const benchmarkBot = async () => {
    setDisplayerId("BENCHMARK")
    
    const batchSize = 1000

    const playerIds = Object.entries(benchmarkPlayers).filter(([_, checked]) => checked).map(([k, _]) => k)
    console.log(playerIds)
    const boards = new Array(batchSize).fill("").map(() => getNewBoard(width, height, bombs))

    const resultPromises: Promise<BenchmarkResult>[] = boards.map(board => {
      const gamePromises = playerIds.map(pid => 
        minesweeper(copyBoard(board), noneDisplayer, getPlayerForId(pid, false, 0))
          .then(gameState => ({ [pid]: gameState }))
          .catch(e => {
            console.error(`Caught error while evaluating ${pid} for board ${getBoardString(board)}`, e)
            throw e
          })
      )
      const ans: Promise<BenchmarkResult> = Promise.all(gamePromises)
        .then((gameStates) => {
          return {
            initialBoard: board,
            results: gameStates.reduce((acc, cur) => ({ ...acc, ...cur }), {})
          }
        })
      return ans
    })
    
    Promise.all(resultPromises)
      .then(results => setBenchmarkResults(results))
      .catch(e => console.error("Caught error while finishing benchmarking", e))
  }

  const getPlayerForId = (playerId: string, showHighlights: boolean = true, delayMs: number = 100): Player => {
    switch (playerId) {
      case "NAIVE":
        return naivePlayer
      case "USER":
        return userPlayer(onUserMove)()
      case "SIMPLE":
        return simplePlayer(showHighlights, delayMs)
      case "CONTEXT":
        return contextAwarePlayer(showHighlights, delayMs)
      case "CONTEXTV2":
        return contextAwarePlayerV2(showHighlights, delayMs)
      case "CSP":
        return cspPlayer(showHighlights, delayMs)
    }
    return naivePlayer;
  }

  const getDisplayDelay = (playerId: string): number => {
    switch (playerId) {
      case "NAIVE":
        return 1000;
      case "USER":
        return 0;
      case "EDITOR":
        return 0;
    }
    return 500;
  }

  const onUserMove = (): Promise<Move> => {
    return new Promise((resolve, reject) => {
      setCurrentMoveResolve(() => resolve);
    })
  }

  const onEditorBoardChange = (newBoard: Board) => {
    setBoard(newBoard)
  }

  const onCellClick = (space: Space, isRightClick: boolean) => {
    if (currentMoveResolve && !space.isOpen) {
      const action = isRightClick ? "FLAG" : "POP";
      const move: Move = { coord: spaceToCoord(space), action }
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

  const onBenchmarkPlayersChange = (playerId: string, playerOn: boolean) => {
    setBenchmarkPlayers({
      ...benchmarkPlayers,
      [playerId]: playerOn
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
                onKeyDown={(e) => e.keyCode === 13 && setBoard(getBoardFromString(customBoardString)) }
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
          <MenuItem value={"BENCHMARK"}>Benchmark</MenuItem>
          <MenuItem value={"EDITOR"}>Editor</MenuItem>
        </Select>
        {displayerId != "BENCHMARK" && (
          <>
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
          </>
        )}
        {displayerId == "BENCHMARK" && (
          <>
            <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
              <FormGroup>
                <FormControlLabel
                  label="Naive"
                  control={<Checkbox 
                    checked={benchmarkPlayers.NAIVE} 
                    onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)} 
                    name="NAIVE"
                  />}
                />
                <FormControlLabel
                  label="Simple"
                  control={<Checkbox 
                    checked={benchmarkPlayers.SIMPLE} 
                    onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)} 
                    name="SIMPLE"
                  />}
                />
                <FormControlLabel
                  label="Context"
                  control={<Checkbox 
                    checked={benchmarkPlayers.CONTEXT} 
                    onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)} 
                    name="CONTEXT"
                  />}
                />
                <FormControlLabel
                  label="ContextV2"
                  control={<Checkbox 
                    checked={benchmarkPlayers.CONTEXTV2} 
                    onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)} 
                    name="CONTEXTV2"
                  />}
                />
                <FormControlLabel
                  label="CSP"
                  control={<Checkbox 
                    checked={benchmarkPlayers.CSP} 
                    onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)} 
                    name="CSP"
                  />}
                />
              </FormGroup>
            </FormControl>
            <Button onClick={benchmarkBot} variant="outlined">
              Benchmark Bot
            </Button>
            <div>
              <BenchmarkDisplayerComp
                benchmarkResults={benchmarkResults}
              />
            </div>
          </>
        )}
      </div>
      {board !== null && (
        <div style={{ paddingTop: "20px", paddingBottom: "20px" }}>
          {displayerId === "REACT" ? (
            <div>
              <ReactDisplayerComp
                board={board}
                onCellClick={onCellClick}
                showBomb={playerId !== "USER"}
              />
            </div>
          ) : displayerId === "EDITOR" ? (
            <div>
              <EditorDisplayerComp
                board={board}
                onCellClick={onCellClick}
                onBoardChange={onEditorBoardChange}
              />
            </div>
          ) : (<div />)}
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
  );
}

export default App;
