import { useEffect, useState } from 'react';
import consoleDisplayer, { getBoardString } from "./displayers/consoleDisplayer"
import naivePlayer from "./players/naivePlayer"
import reactDisplayer from "./displayers/reactDisplayer"
import noneDisplayer from "./displayers/noneDisplayer"
import minesweeper from './minesweeper/minesweeper';
import { getNewBoard } from './minesweeper/boardGenerator';
import { Button, Checkbox, Drawer, FormControl, FormControlLabel, FormGroup, List, ListItem, ListItemButton, ListItemText, MenuItem, Select, TextField } from '@mui/material';
import { Board, Displayer, Player, Move, GameState, Space, BenchmarkResults, BenchmarkResult, BoardConfiguration } from './minesweeper/types';
import userPlayer from './players/userPlayer';
import simplePlayer from './players/simplePlayer';
import { getBoardFromString, getStringFromBoard } from './minesweeper/boardStringInterpretor';
import contextAwarePlayer from './players/contextAwarePlayer';
import contextAwarePlayerV2 from './players/contextAwarePlayerV2';
import { spaceToCoord } from './utils/spaceUtils';
import './App.css';
import cspPlayer from './players/cspPlayer';
import combinedPlayer from './players/combinedPlayer';
import BotViewer from './pages/BotViewer';
import UserPlay from './pages/UserPlay';
import Benchmark from './pages/Benchmark';
import Editor from './pages/Editor';
import BenchmarkComp from './components/BenchmarkComp';
import BoardSelector from './components/BoardSelector';
import ReactBoard from './components/ReactBoard';
import EditorOptions from './components/EditorOptions';
import { getPlayerForId } from './utils/playerUtils';

enum Page {
  "BENCHMARK",
  "BOTVIEWER",
  "USERPLAY",
  "EDITOR"
}

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.BOTVIEWER)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [boardConfig, setBoardConfig] = useState<BoardConfiguration>({
    height: 5,
    width: 5,
    bombs: 5
  })

  const [displayerId, setDisplayerId] = useState("REACT");
  const [displayer, setDisplayer] = useState<Displayer>(consoleDisplayer);
  const [playerId, setPlayerId] = useState("COMBINED");
  const [player, setPlayer] = useState<Player>(combinedPlayer(true, 0));

  const [delayMillis, setDelayMillis] = useState<number>(0)
  const [useStepper, setUseStepper] = useState<boolean>(false);
  const [currentStepResolve, setCurrentStepResolve] = useState<() => void>();


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
      case "BENCHMARK":
        setDisplayer(noneDisplayer);
        break;
      case "EDITOR":
        setBoard(getBoardFromString("ooooboooo"))
        setDisplayer(reactDisplayer(setBoard, displayDelay, useStepper ? onWaitForNextStep : null));
        break;
    }
  }, [displayerId, playerId, useStepper])

  useEffect(() => {
    setPlayer(getPlayerForId(playerId, true, delayMillis, onUserMove))
  }, [playerId])

  const runMinesweeper = () => {
    let newBoard: Board
    // if (displayerId === "EDITOR" && (board?.gameState === "NEW" || board?.gameState === "IN_PROGRESS")) {
    //   newBoard = board!!
    // } else if (useCustomBoard) {
    if (boardConfig?.gridString != null) {
      newBoard = getBoardFromString(boardConfig.gridString)
    } else {
      newBoard = getNewBoard(boardConfig.width, boardConfig.height, boardConfig.bombs)
    }
    minesweeper(newBoard, displayer, player);
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
    return 0;
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

  

  const getPage = (currentPage: Page) => {
    if (currentPage == Page.BOTVIEWER) {
      return (<BotViewer />)
    } else if (currentPage == Page.USERPLAY) {
      return (<UserPlay />)
    } else if (currentPage == Page.BENCHMARK) {
      setDisplayerId("BENCHMARK")
      return (<Benchmark
        boardConfig={boardConfig}
      />)
    } else if (currentPage == Page.EDITOR) {
      return (<Editor />)
    }
  }

  return (
    <div className="App" style={{ paddingTop: "50px" }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPage(Page.BOTVIEWER)}>
              <ListItemText primary={"Bot Viewer"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPage(Page.USERPLAY)}>
              <ListItemText primary={"User Play"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPage(Page.BENCHMARK)}>
              <ListItemText primary={"Benchmark"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPage(Page.EDITOR)}>
              <ListItemText primary={"Editor"} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <div>
        <Button onClick={() => setDrawerOpen(true)}>
          Open Drawer
        </Button>
      </div>
      <div>
        {getPage(currentPage)}
      </div>
      <div>
        <BoardSelector
          boardConfig={boardConfig}
          onBoardConfigChange={bc => setBoardConfig(bc)}
        />

        <Select
          label="Displayer"
          value={displayerId}
          onChange={({ target }) => setDisplayerId(target.value)}
        >
          <MenuItem value={"CONSOLE"}>Console</MenuItem>
          <MenuItem value={"REACT"}>React</MenuItem>
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
      </div>
      {board !== null && (
        <div style={{ paddingTop: "20px", paddingBottom: "20px" }}>
          {displayerId === "REACT" ? (
            <div>
              <ReactBoard
                board={board}
                onCellClick={onCellClick}
                showBomb={playerId !== "USER"}
              />
            </div>
          ) : displayerId === "EDITOR" ? (
            <div>
              {/* TODO: Remove React board from editor options */}
              <EditorOptions
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
