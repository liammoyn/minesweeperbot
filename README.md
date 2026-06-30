# Minesweeper AI Solver

## Overview / Motivation

This project has been to create an algorithm for completing Minesweeper most optimally. The current bot uses constraint satisfaction solving to first check all for all spaces that can be determined as either definitely a bomb or definitely not a bomb and it will then use probabilistic methods to make optimal guesses when faced with uncertainty.

My favorite part about Minesweeper is the uncertanty. You can develop logical rules for different scenarios to tip the odds in your favor, but at the end of the day certain boards are just going to require guessing. I originally created this project because I was curious how much of the uncertainty you could remove by playing as optimally as possible. My current algorithm solves about 40% of expert Minesweeper boards (18x30 with 99 bombs), which is about 4 points better than what I was averaging myself.

## Future Enhancements

For the algorithm itself, while it will always pick the tile that is least likely to be a bomb, there is currently no good huristic for breaking ties. Ideally, if two tiles are both equally unlikely to be a bomb, the algorithm should open the tile that is most likely to lead to information that will help avoid future guessing. What this huristic should be is not straightforward at all because it has to balance learning information about already open tiles with the chance of opening a new plot entirely. It seems likely that an optimal approach here would need to use some machine learning techniques.

The UI/UX is very rudementary intentionally on this project. Still, it would be nice to do a more clean-up and beautification of the design if I were to actually host this application.

I would like to add a user game mode that can alert users if they play non-optimal moves, or if they lose despite playing optimally. This is more just sometihing I'd like to see about myself and know how closely my play is to what my algorithm considers optimal.

## The App

This is a [Create React App](https://create-react-app.org/) project written in TypeScript. The UI is organized into four pages, reachable from the menu drawer (the hamburger icon in the top-left):

- **Bot View** — Generate a board and watch a selected bot solve it move-by-move. You can pick the bot, set a delay between moves, step through moves manually, and view/edit the board as a string.
- **User Play** — Play Minesweeper yourself (left-click to open, right-click to flag).
- **Bot Benchmarking** — Run a chosen set of bots over many randomly generated boards and compare their win rates and timing.
- **Board Editor** — Hand-build a specific board layout, useful for testing the bots against particular scenarios.

The available bots (selectable in Bot View and Benchmarking) are `NAIVE`, `SIMPLE`, `CONTEXT`, `CONTEXTV2`, `CSP`, and `COMBINED`, in roughly increasing order of sophistication. `COMBINED` is the constraint-satisfaction + probabilistic solver described above.

## Running the Project

### Prerequisites

- [Node.js](https://nodejs.org/) (tested with Node 22) and npm.

### Install

In the project directory, install dependencies first:

```sh
npm install
```

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page reloads automatically when you edit a source file.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production into the `build` folder.

