import React, { useState } from 'react';
import { Board, Displayer, Space, Coord } from "../minesweeper/types";

interface BenchmarkDisplayerCompProps {
    gamesPlayed: number,
    wins: number,
}

export const BenchmarkDisplayerComp = ({ gamesPlayed, wins }: BenchmarkDisplayerCompProps) => {

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center" }}>
            <div>
                <label>Games Played:</label>
                <div>{gamesPlayed}</div>
            </div>
            <div>
                <label>Wins:</label>
                <div>{wins}</div>
            </div>
            <div>
                <label>Win Percentage:</label>
                <div>{`${100 * wins / gamesPlayed}%`}</div>
            </div>
        </div>
    )
}

const benchmarkDisplayer = (): Displayer => {
    return {
        displayBoard: (board: Board) => {
            return Promise.resolve()
        }
    }
}

export default benchmarkDisplayer;
