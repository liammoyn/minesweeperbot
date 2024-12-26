import { useEffect, useState } from "react";
import { BenchmarkResults, Board, Displayer } from "../minesweeper/types";

interface BenchmarkDisplayerCompProps {
    benchmarkResults: BenchmarkResults
}

type PlayerToWins = { [playerId: string]: number }

export const BenchmarkDisplayerComp = ({ benchmarkResults }: BenchmarkDisplayerCompProps) => {
    const [playerToWins, setPlayerToWins] = useState<PlayerToWins>({})
    const [totalGames, setTotalGames] = useState<number>(0)
    
    useEffect(() => {
        setTotalGames(benchmarkResults.length)
        if (benchmarkResults.length > 0) {
            const ptw: PlayerToWins = Object.fromEntries(Object.entries(benchmarkResults[0].results).map(e => [e[0], 0]))
            benchmarkResults.forEach(benchmarkResult => {
                Object.entries(benchmarkResult.results).forEach(([pid, gamestate]) => {
                    if (gamestate == "WON") {
                        ptw[pid]++
                    }
                })
            })
            setPlayerToWins(ptw)
        } else {
            setPlayerToWins({})
        }
    }, [benchmarkResults])

    return (
        <div>
            <div>
                <label>Games Played:</label>
                <div>{totalGames}</div>
            </div>
            <div style={{ display: "flex", flexFlow: "row", alignItems: "top", justifyContent: "center" }}>
                {
                    Object.entries(playerToWins).map(([pid, wins]) => (
                        <div style={{ display: "flex", flexFlow: "column", alignItems: "start", padding: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <label style={{ paddingRight: "2px" }}>Player:</label>
                                <div>{pid}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <label style={{ paddingRight: "2px" }}>Wins:</label>
                                <div>{wins}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <label style={{ paddingRight: "2px" }}>Win Percentage:</label>
                                <div>{`${100 * wins / totalGames}%`}</div>
                            </div>
                        </div>
                    ))
                }
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
