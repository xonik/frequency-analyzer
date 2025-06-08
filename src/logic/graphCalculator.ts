import { Point } from "./types";
import { solveForX } from "./diodeClipperSolver";

export function calculatePoints(numberOfPoints: number) {
    const points: Point[] = []
    for (let i = 0; i < numberOfPoints; i += 10) {
        points.push({
            x: i, y: i * i
        })
    }
    return points
}

/*
export function findGoodParams(maxInput: number, gain: number, maxClipperOut: number) {
    const maxX = solveForX(maxClipperOut)
    const inputGain = maxX / maxInput
    const clipperOutGain = inputGain * gain

    const outputGain = 1 / (clipperOutGain)

    return {
        inputGain,
        clipperOutGain,
    }
}*/
