import React, { useContext, useEffect, useState } from 'react';
import FileUploader from "./components/FileUploader";
import {
    average,
    calculateFrequencyRateOfChangePercent, centsBetweenFrequencies, CentsEntry,
    createFrequencyProcessor, getMinMaxY,
    parseLine,
} from "./logic/calculator";
import type {
    FrequencyEntry,
    RateOfChangeEntry,
} from "./logic/calculator";

import { FileLinesContext } from "./context/FileLinesContext";
import { LineChart } from "@mui/x-charts";
import './App.css';

function App() {
    const { lines } = useContext(FileLinesContext);
    const [averageFrequency, setAverageFrequency] = useState<number>(0);
    const [frequencyList, setFrequencyList] = useState<FrequencyEntry[]>([]);
    const [rateOfChangeList, setRateOfChangeList] = useState<RateOfChangeEntry[]>([]);
    const [centsDeviationList, setCentsDeviationList] = useState<CentsEntry[]>([]);
    const [chartWidth, setChartWidth] = useState(window.innerWidth);
    const [threshold, setThreshold] = useState<number>(() => {
        const stored = localStorage.getItem('threshold');
        return stored ? parseFloat(stored) : 2.5;
    });

    useEffect(() => {
        localStorage.setItem('threshold', threshold.toString());
    }, [threshold]);

    useEffect(() => {
        const { processSample, frequencyList: freqList } = createFrequencyProcessor(threshold);
        const samples = lines.map(parseLine).filter((sample) => !isNaN(sample.value))
        samples.forEach((sample) => {
            processSample(sample);
        })

        // Remove the first entry as it has probably not measured a full
        // interval.
        const slicedList = freqList.slice(1)
        setFrequencyList(slicedList);

        const calculatedAverage = average(slicedList)
        setAverageFrequency(calculatedAverage)

        const cents = slicedList.map(centsBetweenFrequencies(calculatedAverage))
        setCentsDeviationList(cents);

        setRateOfChangeList(calculateFrequencyRateOfChangePercent(slicedList));
    }, [lines, threshold]);

    useEffect(() => {
        const handleResize = () => setChartWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const frequencyTimes = frequencyList.map(entry => entry.time);
    const frequencies = frequencyList.map(entry => entry.frequency);
    const freqYAxis = getMinMaxY(frequencies)

    const rateOfChangeTimes = rateOfChangeList.map(entry => entry.time);
    const freqChange = rateOfChangeList.map(entry => entry.frequencyDifference);
    const changeYAxis = getMinMaxY(freqChange);

    const percentChange = rateOfChangeList.map(entry => entry.ratePercent);
    const percentYAxis = getMinMaxY(percentChange);

    const centsTimes = centsDeviationList.map(entry => entry.time);
    const cents = centsDeviationList.map(entry => entry.cents);
    const centsYAxis = getMinMaxY(cents)


    return (
        <div className="app" style={{ width: '100vw' }}>
            <div>
                <FileUploader/>
                <div style={{ margin: '16px 0' }}>
                    <label>
                        Threshold:&nbsp;
                        <input
                            type="number"
                            step="any"
                            value={threshold}
                            onChange={e => setThreshold(Number(e.target.value))}
                            style={{ width: 80 }}
                        />
                    </label>
                </div>
                <LineChart
                    xAxis={[{ data: frequencyTimes, label: "Time" }]}
                    yAxis={[freqYAxis]}
                    series={[
                        {
                            data: frequencies,
                            label: `Frequency (avg: ${averageFrequency.toFixed(2)} Hz)`,
                            area: false,
                            showMark: false,
                            curve: 'linear'
                        }
                    ]}
                    width={chartWidth}
                    height={300}
                />
                <LineChart
                    xAxis={[{ data: rateOfChangeTimes, label: "Time" }]}
                    yAxis={[changeYAxis]}
                    series={[
                        {
                            data: freqChange,
                            label: "Frequency Change",
                            area: false,
                            showMark: false,
                            curve: 'linear'
                        }
                    ]}
                    width={chartWidth}
                    height={300}
                />
                <LineChart
                    xAxis={[{ data: rateOfChangeTimes, label: "Time" }]}
                    yAxis={[percentYAxis]}
                    series={[
                        {
                            data: percentChange,
                            label: "Percent Change",
                            area: false,
                            showMark: false,
                            curve: 'linear'
                        }
                    ]}
                    width={chartWidth}
                    height={300}
                />
                <LineChart
                    xAxis={[{ data: centsTimes, label: "Time" }]}
                    yAxis={[centsYAxis]}
                    series={[
                        {
                            data: cents,
                            label: `Cents from average (min: ${centsYAxis.min.toFixed(2)}, max: ${centsYAxis.max.toFixed(2)})`,
                            area: false,
                            showMark: false,
                            curve: 'linear'
                        }
                    ]}

                    width={chartWidth}
                    height={300}
                />
            </div>
        </div>
    );
}

export default App;