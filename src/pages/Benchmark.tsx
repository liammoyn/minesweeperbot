import { useState } from "react";
import { BenchmarkResult, BenchmarkResults, BoardConfiguration, GameState } from "../minesweeper/types";
import minesweeper from "../minesweeper/minesweeper";
import { getNewBoard } from "../minesweeper/boardGenerator";
import { getStringFromBoard } from "../minesweeper/boardStringInterpretor";
import { getBoardString } from "../displayers/consoleDisplayer";
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, TextField } from "@mui/material";
import BenchmarkComp from "../components/BenchmarkComp";
import noneDisplayer from "../displayers/noneDisplayer";
import { getPlayerForId } from "../utils/playerUtils";

interface BenchmarkProps {
    boardConfig: BoardConfiguration
}

const Benchmark = ({ boardConfig }: BenchmarkProps) => {
    const [benchmarkGames, setBenchmarkGames] = useState<number>(1000);
    const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults>([]);
    const [benchmarkPlayers, setBenchmarkPlayers] = useState({
        NAIVE: false,
        SIMPLE: false,
        CONTEXT: false,
        CONTEXTV2: false,
        CSP: false,
        COMBINED: false,
    })


    const benchmarkBot = async () => {
        const start = Date.now()
        const batchSize = benchmarkGames

        const playerIds = Object.entries(benchmarkPlayers).filter(([_, checked]) => checked).map(([k, _]) => k)
        const boards = new Array(batchSize).fill("").map(() => getNewBoard(boardConfig.width, boardConfig.height, boardConfig.bombs))

        const resultPromises: Promise<BenchmarkResult>[] = boards.map(board => {
            const gamePromises = playerIds.map(pid => {
                const timeLimitPromise = new Promise<{ [playerId: string]: GameState }>((res) => setTimeout(() => {
                    console.info("Timed out waiting to complete game", pid, getStringFromBoard(board.grid))
                    res({ [pid]: "LOST" })
                }, 600_000));

                const gamePromise = minesweeper(board, noneDisplayer, getPlayerForId(pid, false, 0))
                    .then(gameState => {
                        // console.info(`[App] Finished game execution in ${(Date.now() - start) / 1000} s`, getStringFromBoard(board.grid))
                        return { [pid]: gameState }
                    })
                    .catch(e => {
                        console.error(`Caught error while evaluating ${pid} for board ${getBoardString(board)}`, e)
                        throw e
                    })

                return Promise.race([timeLimitPromise, gamePromise])
            })
            const ans: Promise<BenchmarkResult> = Promise.all(gamePromises)
                .then((gameStates) => {
                    return {
                        initialBoard: board,
                        results: gameStates.reduce((acc, cur) => ({ ...acc, ...cur }), {})
                    }
                })
            return ans
        })

        Promise.all(resultPromises)
            .then(results => {
                console.log(`Execution took ${(Date.now() - start) / 1000} s for ${batchSize} games`)
                setBenchmarkResults(results)
            })
            .catch(e => console.error("Caught error while finishing benchmarking", e))
    }

    const onBenchmarkPlayersChange = (playerId: string, isPlayerOn: boolean) => {
        setBenchmarkPlayers({
            ...benchmarkPlayers,
            [playerId]: isPlayerOn
        })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
                <FormGroup>
                    <FormControlLabel
                        label="Naive"
                        control={<Checkbox
                            checked={benchmarkPlayers.NAIVE}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="NAIVE"
                        />}
                    />
                    <FormControlLabel
                        label="Simple"
                        control={<Checkbox
                            checked={benchmarkPlayers.SIMPLE}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="SIMPLE"
                        />}
                    />
                    <FormControlLabel
                        label="Context"
                        control={<Checkbox
                            checked={benchmarkPlayers.CONTEXT}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="CONTEXT"
                        />}
                    />
                    <FormControlLabel
                        label="ContextV2"
                        control={<Checkbox
                            checked={benchmarkPlayers.CONTEXTV2}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="CONTEXTV2"
                        />}
                    />
                    <FormControlLabel
                        label="CSP"
                        control={<Checkbox
                            checked={benchmarkPlayers.CSP}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="CSP"
                        />}
                    />
                    <FormControlLabel
                        label="Combined"
                        control={<Checkbox
                            checked={benchmarkPlayers.COMBINED}
                            onChange={e => onBenchmarkPlayersChange(e.target.name, e.target.checked)}
                            name="COMBINED"
                        />}
                    />
                </FormGroup>
            </FormControl>
            <TextField
                label="Benchmark Games"
                type="number"
                value={benchmarkGames}
                onChange={({ target }) => setBenchmarkGames(parseInt(target.value ?? 0))}
            />
            <div style={{ padding: "10px" }}>
                <Button onClick={benchmarkBot} variant="outlined">
                    Benchmark Bot
                </Button>
            </div>

            <BenchmarkComp
                    benchmarkResults={benchmarkResults}
                />
        </div>
    )
}

export default Benchmark
