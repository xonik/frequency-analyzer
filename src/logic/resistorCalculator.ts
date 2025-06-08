export const resistorSeries = {
    E12: [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820],
    E24: [
        100, 110, 120, 130, 150, 160,
        180, 200, 220, 240, 270, 300,
        330, 360, 390, 430, 470, 510,
        560, 620, 680, 750, 820, 910
    ],
    E48: [
        100, 105, 110, 115, 121, 127,
        133, 140, 147, 154, 162, 169,
        178, 187, 196, 205, 215, 226,
        237, 249, 261, 274, 287, 301,
        316, 332, 348, 365, 383, 402,
        422, 442, 464, 487, 511, 536,
        562, 590, 619, 649, 681, 715,
        750, 787, 825, 866, 909, 953,
    ],
    E96: [
        100, 102, 105, 107, 110, 113,
        115, 118, 121, 124, 127, 130,
        133, 137, 140, 143, 147, 150,
        154, 158, 162, 165, 169, 174,
        178, 182, 187, 191, 196, 200,
        205, 210, 215, 221, 226, 232,
        237, 243, 249, 255, 261, 267,
        274, 280, 287, 294, 301, 309,
        316, 324, 332, 340, 348, 357,
        365, 374, 383, 392, 402, 412,
        422, 432, 442, 453, 464, 475,
        487, 499, 511, 523, 536, 549,
        562, 576, 590, 604, 619, 634,
        649, 665, 681, 698, 715, 732,
        750, 768, 787, 806, 825, 845,
        866, 887, 909, 931, 953, 976,
    ]
}

export type ResistorSeriesKey = keyof typeof resistorSeries

const multipliers = [0.01, 0.1, 1, 10, 100, 1000, 10000, 100000] // 1 to 10MOhm

// TODO: This could perhaps be even better if we allow resistors from two multipliers down?

function getExpandedSeries(series: number[]) {
    return series.flatMap((value, valueIndex) => {
        return [value, ...series
            .map((lowerValue) => value + 0.1 * lowerValue)
            .filter((sum) => series[valueIndex + 1] === undefined || sum < series[valueIndex + 1])
        ]
    })
}


function getAllResistorValues(series: number[], combineTwo = false) {

    let values: number[] = []
    let expandedSeries = getExpandedSeries(series) // Adds intermediate resistors to get a finer resolution

    multipliers.forEach((multiplier, multiplierIndex) => {

        const selectedSeries = combineTwo && multiplierIndex > 0 ? expandedSeries : series

        values = [...values, ...selectedSeries.map((value) => {
            return Math.round((1000 * (value * multiplier))) / 1000
        })]
    })

    return values
}
// TODO: Improve min/max to account for both r1 and r2 min/max.
function findLeastError(r2Min: number, r2Max: number, targetGain: number, key: ResistorSeriesKey, expression: (r1: number, r2: number) => number) {

    const series = resistorSeries[key]
    if (!series) {
        return
    }
    const resistors = getAllResistorValues(series)

    const r2Candidates = resistors.filter((value) => value >= r2Min && value <= r2Max)

    let smallestError = Number.MAX_VALUE
    let bestGain = Number.MAX_VALUE
    let bestR1 = 0
    let bestR2 = 0

    // Can be optimised with binary searching
    r2Candidates.forEach((r2) => {
        resistors.forEach((r1) => {
            const gain = expression(r1, r2)
            const error = Math.abs(targetGain - gain)
            if (error < smallestError) {
                smallestError = error
                bestR1 = r1
                bestR2 = r2
                bestGain = gain
            }
        })
    })

    console.log(`Resistor divider: Best alternative for gain ${targetGain} is r1=${bestR1}, r2=${bestR2}`)
    console.log(`gain = ${bestGain.toPrecision(3)}, abs error = ${smallestError.toPrecision(3)}, error % ${(smallestError * 100 / targetGain).toPrecision(3)}`)

    return {
        r1: bestR1,
        r2: bestR2,
        gain: bestGain,
        error: smallestError
    }
}

// TODO: allow combining two resistors
export function findResistorDividerCombo(r2Min: number, r2Max: number, targetGain: number, key: ResistorSeriesKey) {
    return findLeastError(
        r2Min,
        r2Max,
        targetGain,
        key,
        (r1: number, r2: number) => r2 / (r1 + r2)
    )
}

export function findInvertingGainCombo(rfMin: number, rfMax: number, targetGain: number, key: ResistorSeriesKey) {
    return findLeastError(
        rfMin,
        rfMax,
        targetGain,
        key,
        (rIn: number, rf: number) => rf / rIn
    )
}

export function findNonInvertingGainCombo(rfMin: number, rfMax: number, targetGain: number, key: ResistorSeriesKey) {
    if (targetGain < 1) {
        console.log('Cannot get a gain lower than 1')
        return {
            r1: Number.NaN,
            r2: Number.NaN,
            gain: 0,
            error: Number.POSITIVE_INFINITY
        }
    }
    return findLeastError(
        rfMin,
        rfMax,
        targetGain,
        key,
        (rIn: number, rf: number) => 1 + rf / rIn
    )
}