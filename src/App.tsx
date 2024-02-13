import React, { useEffect, useState } from 'react';
import './App.css';
import consoleDisplayer from "./displayers/consoleDisplayer" 
import naivePlayer from "./players/naivePlayer" 
import reactDisplayer, { ReactDisplayerComp } from "./displayers/reactDisplayer"
import minesweeper from './minesweeper/minesweeper';
import { Button, MenuItem, Select, TextField } from '@mui/material';
import { Board, Displayer, Player, Coord, Move } from './minesweeper/types';
import userPlayer from './players/userPlayer';
import simplePlayer from './players/simplePlayer';

const App = () => {
  const [height, setHeight] = useState(5);
  const [width, setWidth] = useState(5);
  const [bombs, setBombs] = useState(5);
  const [displayerId, setDisplayerId] = useState("REACT");
  const [displayer, setDisplayer] = useState<Displayer>(consoleDisplayer);
  const [playerId, setPlayerId] = useState("SIMPLE");
  const [player, setPlayer] = useState<Player>(naivePlayer);

  const [currentMoveResolve, setCurrentMoveResolve] = useState<(m: Move) => void>();

  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    const displayDelay = getDisplayDelay(playerId)
    switch (displayerId) {
      case "CONSOLE":
        setDisplayer(consoleDisplayer);
        break;
      case "REACT":
        setDisplayer(reactDisplayer(setBoard, displayDelay));
        break;
    }
  }, [displayerId, playerId])

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
    }
  }, [playerId])

  const runMinesweeper = () => {
    console.log(`Running with ${width} ${height} ${bombs}`)
    minesweeper(width, height, bombs, displayer, player);
  }

  const getDisplayDelay = (playerId: string): number => {
    switch (playerId) {
      case "NAIVE":
        return 1000;
      case "USER":
        return 0;
      case "SIMPLE":
        return 1000;
    }
    return 1000;
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

  return (
    <div className="App" style={{ paddingTop: "50px" }}>
      <div>
        <TextField
          label="Height"
          type="number"
          value={height}
          onChange={({ target }) => setHeight(target.value as unknown as number)}
        />
        <TextField
          label="Width"
          type="number"
          value={width}
          onChange={({ target }) => setWidth(target.value as unknown as number)}
        />
        <TextField
          label="Bombs"
          type="number"
          value={bombs}
          onChange={({ target }) => setBombs(target.value as unknown as number)}
        />
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
        </Select>
        <Button onClick={runMinesweeper} variant="outlined">
          Play Minesweeper
        </Button>
      </div>
      <div style={{ paddingTop: "50px"}}>
        {displayerId == "REACT" && (
          <div>
            <ReactDisplayerComp
              board={board}
              onCellClick={onCellClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
