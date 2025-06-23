export type RateOfChangeEntry = { time: number, frequencyDifference: number, ratePercent: number }
export type Sample = { time: number, value: number }

export function parseLine(line: string, valueColumn: number): Sample {
    const parts = line.split(',')
    const time = parseFloat(parts[0])
    const value = parseFloat(parts[valueColumn])
    return {
        time,
        value
    }
}

export function createFrequencyProcessor(threshold = 2.5) {
    let prevSample: Sample | null = null
    let isHigh = false;
    let maxInCycle = 0;
    const frequencyList: Sample[] = []

    function processSample(sample: Sample) {
        // used for debouncing, we won't allow a state change unless the signal
        // has reached a certain amplitude since last state change.
        const amplitude = sample.value - threshold
        if (isHigh && amplitude > maxInCycle || !isHigh && amplitude < maxInCycle) {
            maxInCycle = amplitude
        }
        if (prevSample === null) {
            prevSample = sample
            isHigh = sample.value >= threshold
        } else if (!isHigh && sample.value >= threshold && maxInCycle < -0.5) {
            const timeDiff = sample.time - prevSample.time
            if (timeDiff > 0) {
                const frequency = roundToFiveSignificantDigits(1 / timeDiff)
                frequencyList.push({ time: sample.time, value: frequency })
            }
            isHigh = true
            maxInCycle = 0
            prevSample = sample
        } else if (isHigh && sample.value < threshold && maxInCycle > 0.5) {
            isHigh = false
            maxInCycle = 1
        }
    }

    return { processSample, frequencyList }
}

export function calculateFrequencyRateOfChangePercent(frequencies: Sample[]): RateOfChangeEntry[] {
    const rates: RateOfChangeEntry[] = []
    for (let i = 1; i < frequencies.length; i++) {
        const prev = frequencies[i - 1]
        const curr = frequencies[i]
        const dt = curr.time - prev.time
        if (dt !== 0 && prev.value !== 0) {
            const frequencyDifference = curr.value - prev.value

            // There is something here that may be improved. The ratePercent does not take into account the spacing
            // of the samples, not sure if that makes stuff
            const ratePercent = (frequencyDifference / prev.value) * 100
            rates.push({ time: curr.time, frequencyDifference, ratePercent })
        }
    }
    return rates
}

function roundToFiveSignificantDigits(num: number): number {
    return Number(num.toPrecision(5))
}

export function centsBetweenFrequencies(f1: number) {
    return ({ time, value: f2 }: Sample): Sample => {
        if (f1 <= 0 || f2 <= 0) throw new Error("Frequencies must be positive numbers.");
        const cents = 1200 * Math.log2(f2 / f1);
        return {
            time,
            value: cents
        }
    }
}

export function average(values: Sample[]): number {
    if (values.length === 0) return NaN;
    const sum = values.reduce((acc, val) => acc + val.value, 0);
    return sum / values.length;
}

export function getMinMaxY(values: number[]): { min: number, max: number } {
    if (values.length === 0) return { min: 0, max: 1 };
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

function medianFrequency(entries: Sample[]): number {
    if (entries.length === 0) return NaN;
    const freqs = entries.map(e => e.value).sort((a, b) => a - b);
    const mid = Math.floor(freqs.length / 2);
    if (freqs.length % 2 === 0) {
        return (freqs[mid - 1] + freqs[mid]) / 2;
    } else {
        return freqs[mid];
    }
}

export function filterByMedianDeviation(entries: Sample[], maxDeviation = 0.5): Sample[] {
    const median = medianFrequency(entries);
    if (isNaN(median) || median === 0) return [];
    return entries.filter(e => Math.abs(e.value - median) / median <= maxDeviation);
}

export function filterByPercentile(entries: Sample[], lower = 0.025, upper = 0.975): Sample[] {
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => a.value - b.value);
    const lowerIdx = Math.floor(lower * sorted.length);
    const upperIdx = Math.ceil(upper * sorted.length) - 1;
    const min = sorted[lowerIdx].value;
    const max = sorted[upperIdx].value;
    return entries.filter(e => e.value >= min && e.value <= max);
}

export function movingAverageNKMapper(prevSamples: number, nextSamples: number) {
    return (sample: Sample, i: number, samples: Sample[]): Sample => {
        let sum = 0;
        let count = 0;
        for (let offset = -prevSamples; offset <= nextSamples; offset++) {
            const idx = i + offset;
            const value = (idx >= 0 && idx < samples.length)
                ? samples[idx].value
                : sample.value;
            sum += value;
            count++;
        }
        return {
            time: sample.time,
            value: sum / count
        };
    };
}