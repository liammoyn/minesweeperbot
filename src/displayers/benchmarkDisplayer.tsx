import { useEffect, useState } from "react";
import { BenchmarkResults, Board, Displayer } from "../minesweeper/types";

const benchmarkDisplayer = (): Displayer => {
    return {
        displayBoard: (board: Board) => {
            return Promise.resolve()
        }
    }
}

export default benchmarkDisplayer;
