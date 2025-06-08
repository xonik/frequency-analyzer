
type FrequencyEntry = { time: number, frequency: number }
type RateOfChangeEntry = { time: number, frequencyDifference: number, ratePercent: number }
type Sample = { time: number, value: number }

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
            console.log({ time: curr.time, frequencyDifference, ratePercent })
        }
    }
    return rates
}

function roundToFiveSignificantDigits(num: number): number {
    return Number(num.toPrecision(5))
}
