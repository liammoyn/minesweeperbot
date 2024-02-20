import { updateSpaceCoordsAndBombsNear } from "../utils/gridUtils";
import { Space, Board } from "./types";

const generateGrid = (width: number, height: number, bombs: number): Space[][] => {
    const totalSpaces = width * height;
    const spaceList: Space[] = new Array(totalSpaces)
        .fill({ isOpen: false, isBomb: false, isFlagged: false })
        .map((s, idx) => {
            return (idx < bombs) ? 
                {
                    ...s,
                    isBomb: true
                } : 
                s
        })
    const randomize = <T,>(list: T[]): T[] => {
        for (let i = 0; i < list.length; i++) {
            const swapIdx = Math.floor(Math.random() * (list.length - i) + i)
            const temp = list[swapIdx]
            list[swapIdx] = list[i]
            list[i] = temp;
        }
        return list;
    }
    const randomizedList = randomize(spaceList)
    let emptyGrid: Space[][] = new Array(height).fill(undefined)
    emptyGrid = emptyGrid.map(_ => new Array(width).fill(undefined))
    const spaceGrid = randomizedList.reduce((acc, cur, idx) => {
        const row = Math.floor(idx / width);
        const col = idx % width;
        acc[row][col] = {
            ...cur,
            row: row,
            col: col,
        };
        return acc
    }, emptyGrid);
    return updateSpaceCoordsAndBombsNear(spaceGrid)
}

export const getNewBoard = (width: number, height: number, bombs: number): Board => {
    if (width < 3 || height < 3 || bombs < 1 || bombs >= width * height) {
        throw Error('Illegal arguments')
    }
    const grid = generateGrid(width, height, bombs);
    return {
        grid,
        gameState: "NEW"
    }
}