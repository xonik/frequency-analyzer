
export type FrequencyEntry = { time: number, frequency: number }
export type CentsEntry = { time: number, cents: number }
export type RateOfChangeEntry = { time: number, frequencyDifference: number, ratePercent: number }
export type Sample = { time: number, value: number }

export function parseLine(line: string): Sample {
    const parts = line.split(',')
    const time = parseFloat(parts[0])
    const value = parseFloat(parts[1])
    return {
        time,
        value
    }
}

export function createFrequencyProcessor(threshold = 2.5) {
    let prevSample: Sample | null = null
    let isHigh = false;
    const frequencyList: FrequencyEntry[] = []

    function processSample(sample: Sample) {
        if (prevSample !== null && !isHigh && sample.value >= threshold) {
            const timeDiff = sample.time - prevSample.time
            if (timeDiff > 0) {
                const frequency = roundToFiveSignificantDigits(1 / timeDiff)
                frequencyList.push({ time: sample.time, frequency })
            }
            isHigh = true
            prevSample = sample
        } else if (isHigh && sample.value < threshold) {
            isHigh = false
        } else if (prevSample === null) {
            prevSample = sample
            isHigh = sample.value >= threshold
        }
    }

    return { processSample, frequencyList }
}

export function calculateFrequencyRateOfChangePercent(frequencies: FrequencyEntry[]): RateOfChangeEntry[] {
    const rates: RateOfChangeEntry[] = []
    for (let i = 1; i < frequencies.length; i++) {
        const prev = frequencies[i - 1]
        const curr = frequencies[i]
        const dt = curr.time - prev.time
        if (dt !== 0 && prev.frequency !== 0) {
            const frequencyDifference = curr.frequency - prev.frequency

            // There is something here that may be improved. The ratePercent does not take into account the spacing
            // of the samples, not sure if that makes stuff
            const ratePercent = (frequencyDifference / prev.frequency) * 100
            rates.push({ time: curr.time, frequencyDifference, ratePercent })
        }
    }
    return rates
}

function roundToFiveSignificantDigits(num: number): number {
    return Number(num.toPrecision(5))
}

export function centsBetweenFrequencies(f1: number){
    return ({time, frequency: f2}: FrequencyEntry): CentsEntry => {
        if (f1 <= 0 || f2 <= 0) throw new Error("Frequencies must be positive numbers.");
        return {
            time,
            cents: 1200 * Math.log2(f2 / f1),
        }
    }
}

export function average(values: FrequencyEntry[]): number {
    if (values.length === 0) return NaN;
    const sum = values.reduce((acc, val) => acc + val.frequency, 0);
    return sum / values.length;
}

export function getMinMaxY(values: number[]): { min: number, max: number } {
    if (values.length === 0) return { min: 0, max: 1 };
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}
