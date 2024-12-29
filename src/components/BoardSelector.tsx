import { Checkbox, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { BoardConfiguration } from "../minesweeper/types";

interface BoardSelectorProps {
    boardConfig: BoardConfiguration,
    onBoardConfigChange: (bc: BoardConfiguration) => void
    onApply?: () => void
}

const BoardSelector = ({ boardConfig, onBoardConfigChange, onApply }: BoardSelectorProps) => {
    const [height, setHeight] = useState(5);
    const [width, setWidth] = useState(5);
    const [bombs, setBombs] = useState(5);

    const [useCustomBoard, setUseCustomBoard] = useState<boolean>(false);
    const [customBoardString, setCustomBoardString] = useState<string>("");

    useEffect(() => {
        setHeight(boardConfig.height)
        setWidth(boardConfig.width)
        setBombs(boardConfig.bombs)
        if (boardConfig.gridString && boardConfig.gridString !== customBoardString) {
            setCustomBoardString(boardConfig.gridString!!)
        }
    }, [boardConfig])

    const onAttributeChange = (h: number, w: number, b: number) => {
        onBoardConfigChange({
            height: h,
            width: w,
            bombs: b,
        })
    }

    const onBoardStringChange = (newString: string) => {
        setCustomBoardString(newString)
        onBoardConfigChange({
            ...boardConfig,
            gridString: newString
        })
    }

    const onUseCustomBoardChange = (useCustom: boolean) => {
        if (useCustom) {
            onBoardConfigChange({
                ...boardConfig,
                gridString: customBoardString
            })
        } else {
            onAttributeChange(height, width, bombs)
        }
        setUseCustomBoard(useCustom)
    }

    return (
        <div style={{ paddingBottom: "5px" }}>
            <div>
                <label>Use Custom Board?</label>
                <Checkbox
                    checked={useCustomBoard}
                    onChange={({ target }) => onUseCustomBoardChange(target.checked)}
                />
            </div>
            {useCustomBoard ? (
                <div>
                    <TextField
                        label="Board String"
                        type="string"
                        value={customBoardString}
                        onChange={({ target }) => onBoardStringChange(target.value as unknown as string)}
                        onKeyDown={(e) => e.keyCode === 13 && onApply && onApply()}
                    />
                </div>
            ) : (
                <div>
                    <TextField
                        label="Height"
                        type="number"
                        value={height}
                        onChange={({ target }) => onAttributeChange(parseInt(target.value ?? 0), width, bombs)}
                    />
                    <TextField
                        label="Width"
                        type="number"
                        value={width}
                        onChange={({ target }) => onAttributeChange(height, parseInt(target.value ?? 0), bombs)}
                    />
                    <TextField
                        label="Bombs"
                        type="number"
                        value={bombs}
                        onChange={({ target }) => onAttributeChange(height, width, parseInt(target.value ?? 0))}
                    />
                </div>
            )}
        </div>
    )
}

export default BoardSelector
