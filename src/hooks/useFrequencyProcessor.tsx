import { useEffect, useState } from "react";
import {
    average,
    calculateFrequencyRateOfChangePercent,
    centsBetweenFrequencies,
    movingAverageNKMapper, type RateOfChangeEntry, Sample
} from "../logic/calculator";

function useFrequencyProcessor(rawFrequencies: Sample[], movingAverageWindow: number, sliceLength: string) {

    const [averageFrequency, setAverageFrequency] = useState<number>(0);

    const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);

    const [frequencyList, setFrequencyList] = useState<Sample[]>([]);
    const [filteredFrequencyList, setFilteredFrequencyList] = useState<Sample[]>([]);
    const [backgroundFrequencyList, setBackgroundFrequencyList] = useState<Sample[]>([]);

    const [centsDeviationList, setCentsDeviationList] = useState<Sample[]>([]);
    const [filteredCentsDeviationList, setFilteredCentsDeviationList] = useState<Sample[]>([]);
    const [backgroundCentsDeviationList, setBackgroundCentsDeviationList] = useState<Sample[]>([]);

    const [rateOfChangeList, setRateOfChangeList] = useState<RateOfChangeEntry[]>([]);
    const [voltsDeviationList, setVoltsDeviationList] = useState<Sample[]>([]);

    useEffect(() => {
        // Apply sliceLength if valid and not empty
        let frequencies = rawFrequencies
        if (sliceLength !== '') {
            const n = Number(sliceLength);
            if (!isNaN(n) && n > 0) {
                frequencies = frequencies.slice(0, n);
            }
            setLastTimestamp(frequencies[frequencies.length - 1]?.time || undefined);
        } else {
            setLastTimestamp(undefined)
        }

        const calculatedAverage = average(frequencies)
        setAverageFrequency(calculatedAverage)

        setFrequencyList(frequencies);

        const cents = frequencies.map(centsBetweenFrequencies(calculatedAverage))
        const volts = cents.map(
            (entry) => ({ time: entry.time, value: 1000 * entry.value / 1200 }))

        setCentsDeviationList(cents);
        setVoltsDeviationList(volts);

        setRateOfChangeList(calculateFrequencyRateOfChangePercent(frequencies));


        const filteredFrequencies = frequencies.map(movingAverageNKMapper(movingAverageWindow, movingAverageWindow));
        setFilteredFrequencyList(filteredFrequencies);
        setBackgroundFrequencyList(
            frequencies.map((entry, index) => {
                return {
                    ...entry,
                    value: entry.value - filteredFrequencies[index].value + calculatedAverage
                }
            })
        )

        const filteredCents = cents.map(movingAverageNKMapper(movingAverageWindow, movingAverageWindow));
        setFilteredCentsDeviationList(filteredCents);
        setBackgroundCentsDeviationList(
            cents.map((entry, index) => {
                return {
                    ...entry,
                    value: entry.value - filteredCents[index].value
                }
            })
        )
    }, [rawFrequencies, movingAverageWindow, sliceLength]);

    return {
        averageFrequency,
        frequencyList,
        filteredFrequencyList,
        backgroundFrequencyList,
        centsDeviationList,
        filteredCentsDeviationList,
        backgroundCentsDeviationList,
        rateOfChangeList,
        voltsDeviationList,
        lastTimestamp
    }

}

export default useFrequencyProcessor;