import React, { useEffect, useState } from 'react';
import consoleDisplayer from "./displayers/consoleDisplayer" 
import reactDisplayer, { ReactDisplayerComp } from "./displayers/reactDisplayer"
import minesweeper from './minesweeper/minesweeper';
import { Button, MenuItem, Select, TextField } from '@mui/material';
import './App.css';
import { Board, Displayer } from './minesweeper/types';

const App = () => {
  const [height, setHeight] = useState(5);
  const [width, setWidth] = useState(5);
  const [bombs, setBombs] = useState(5);
  const [displayerId, setDisplayerId] = useState("CONSOLE");
  const [displayer, setDisplayer] = useState<Displayer>(consoleDisplayer);

  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    switch (displayerId) {
      case "CONSOLE":
        setDisplayer(consoleDisplayer);
        break;
      case "REACT":
        setDisplayer(reactDisplayer(setBoard));
    }

  }, [displayerId])

  const runMinesweeper = () => {
    console.log(`Running with ${width} ${height} ${bombs}`)
    minesweeper(width, height, bombs, displayer);
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
          {/* <MenuItem value={"REACT"}>React</MenuItem> */}
        </Select>
        <Button onClick={runMinesweeper} variant="outlined">
          Play Minesweeper
        </Button>
      </div>
      {/* <div style={{ paddingTop: "50px"}}>
        {displayerId == "REACT" && (
          <div>
            <ReactDisplayerComp
              board={board}
            />
          </div>
        )}
      </div> */}
    </div>
  );
}

export default App;
