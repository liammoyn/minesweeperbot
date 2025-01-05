import { useEffect, useState } from 'react';
import { Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { Menu } from '@material-ui/icons';
import { BoardConfiguration } from './minesweeper/types';
import BotViewer from './pages/BotViewer';
import UserPlay from './pages/UserPlay';
import Benchmark from './pages/Benchmark';
import Editor from './pages/Editor';
import { getPageTitle, PageId } from './utils/pageUtils';

import './App.css';

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
    <div style={{ display: "flex", flexDirection: "row", alignItems: "start" }}>
      <div style={{ padding: "20px" }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={() => setDrawerOpen(true)}
          edge="start"
          sx={[
            {
              mr: 2,
            },
            drawerOpen && { display: 'none' },
          ]}
        >
          <Menu />
        </IconButton>
      </div>
      <div style={{ textAlign: "center", paddingTop: "10px", flex: 1 }}>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div style={{ textAlign: "center", fontSize: "1.2em", borderBottom: "2px solid gray" }} >
            {getPageTitle(currentPageId)}
          </div>
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
          <div style={{  padding: "5px", paddingBottom: "15px" }}>
            {getPageTitle(currentPageId)}
          </div>
          {currentPage}
        </div>
      </div>
    </div>
  );
}

export default App;
