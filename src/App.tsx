import { useEffect, useState } from 'react';
import { Button, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { BoardConfiguration } from './minesweeper/types';
import BotViewer from './pages/BotViewer';
import UserPlay from './pages/UserPlay';
import Benchmark from './pages/Benchmark';
import Editor from './pages/Editor';

import './App.css';

enum PageId {
  "BENCHMARK",
  "BOTVIEWER",
  "USERPLAY",
  "EDITOR"
}

const App = () => {
  const [currentPage, setCurrentPage] = useState<JSX.Element>()
  const [currentPageId, setCurrentPageId] = useState<PageId>(PageId.BOTVIEWER)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [boardConfig, setBoardConfig] = useState<BoardConfiguration>({
    height: 5,
    width: 5,
    bombs: 5
  })

  useEffect(() => {
    if (currentPageId == PageId.BOTVIEWER) {
      setCurrentPage(
        <BotViewer
          boardConfig={boardConfig}
          onBoardConfigChange={(bc) => setBoardConfig(bc)}
        />
      )
    } else if (currentPageId == PageId.USERPLAY) {
      setCurrentPage(
        <UserPlay
          boardConfig={boardConfig}
          onBoardConfigChange={(bc) => setBoardConfig(bc)}
        />
      )
    } else if (currentPageId == PageId.BENCHMARK) {
      setCurrentPage(
        <Benchmark
          boardConfig={boardConfig}
        />
      )
    } else if (currentPageId == PageId.EDITOR) {
      setCurrentPage(
        <Editor
          boardConfig={boardConfig}
          onBoardConfigChange={(bc) => setBoardConfig(bc)}

        />
      )
    }
  }, [currentPageId, boardConfig])

  return (
    <div className="App" style={{ paddingTop: "50px" }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPageId(PageId.BOTVIEWER)}>
              <ListItemText primary={"Bot Viewer"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPageId(PageId.USERPLAY)}>
              <ListItemText primary={"User Play"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPageId(PageId.BENCHMARK)}>
              <ListItemText primary={"Benchmark"} />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton onClick={() => setCurrentPageId(PageId.EDITOR)}>
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
        {currentPage}
      </div>
    </div>
  );
}

export default App;
