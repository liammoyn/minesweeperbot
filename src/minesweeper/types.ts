
export interface Displayer {
    displayBoard: (board: Board) => Promise<void>
}

export interface Player {
    pickCell: (board: Board) => Promise<Move>
};

export interface Coord {
    row: number,
    col: number
}

export interface Move {
    coord: Coord | null
}

export interface Space {
    isOpen: boolean,
    isBomb: boolean,
    bombsNear?: number,
}

export interface Board {
    grid: Space[][],
    gameState: "IN_PROGRESS" | "NEW" | "WON" | "LOST"
}
