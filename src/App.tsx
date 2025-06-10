import React, { useContext, useEffect, useState } from 'react';
import FileUploader from "./components/FileUploader";
import {
    average,
    calculateFrequencyRateOfChangePercent, centsBetweenFrequencies, CentsEntry,
    createFrequencyProcessor, filterByMedianDeviation, findValueColumn, getMinMaxY,
    parseLine, VoltsEntry,
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
    const [voltsDeviationList, setVoltsDeviationList] = useState<VoltsEntry[]>([]);
    const [chartWidth, setChartWidth] = useState(window.innerWidth);
    const [valueColumn, setValueColumn] = useState<number>(1);


    const [threshold, setThreshold] = useState<number>(() => {
        const stored = localStorage.getItem('threshold');
        return stored ? parseFloat(stored) : 2.5;
    });
    const [sliceLength, setSliceLength] = useState<string>(() => {
        return localStorage.getItem('sliceLength') ?? '';
    });

    const [medianFilter, setMedianFilter] = useState<boolean>(() => {
        const stored = localStorage.getItem('medianFilter');
        return stored ? stored === 'true' : false;
    });

    const [loading, setLoading] = useState(false);

    const columnNames = lines.length > 0 ? lines[0].split(',').slice(1) : [];

    useEffect(() => {
        localStorage.setItem('threshold', threshold.toString());
    }, [threshold]);

    useEffect(() => {
        localStorage.setItem('sliceLength', sliceLength);
    }, [sliceLength]);

    useEffect(() => {
        localStorage.setItem('medianFilter', medianFilter.toString());
    }, [medianFilter]);

    useEffect(() => {
        setLoading(true);

        setTimeout(() => { // Simulate async, remove if not needed

            if(lines.length < 1) {
                setLoading(false);
                return
            }

            const { processSample, frequencyList: freqList } = createFrequencyProcessor(threshold);

            const samples = lines.slice(1).map((line) => parseLine(line, valueColumn))

            samples.forEach((sample) => {
                processSample(sample);
            })

            // Remove the first entry as it has probably not measured a full
            // interval.
            let slicedList = freqList.slice(1)

            // Apply sliceLength if valid and not empty
            if (sliceLength !== '') {
                const n = Number(sliceLength);
                if (!isNaN(n) && n > 0) {
                    slicedList = slicedList.slice(-n);
                }
            }

            if (medianFilter) {
                slicedList = filterByMedianDeviation(slicedList)
            }

            setFrequencyList(slicedList);

            const calculatedAverage = average(slicedList)
            setAverageFrequency(calculatedAverage)

            const cents = slicedList.map(centsBetweenFrequencies(calculatedAverage))
            const volts = cents.map(
                (entry) => ({ time: entry.time, volts: 1000 * entry.cents / 1200 }))
            setCentsDeviationList(cents);
            setVoltsDeviationList(volts);

            setRateOfChangeList(calculateFrequencyRateOfChangePercent(slicedList));
            setLoading(false);
        }, 10);
    }, [lines, threshold, sliceLength, medianFilter, valueColumn]);

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

    const voltsTimes = voltsDeviationList.map(entry => entry.time);
    const volts = voltsDeviationList.map(entry => entry.volts);
    const voltsYAxis = getMinMaxY(volts)

    return (
        <div className="app" style={{ width: '100vw' }}>
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="spinner"/>
                </div>
            )}
            <div>
                <div className="input-row">
                    <FileUploader/>
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
                    <label style={{ marginLeft: 24 }}>
                        Samples:&nbsp;
                        <input
                            type="number"
                            step="1"
                            min="1"
                            value={sliceLength}
                            onChange={e => setSliceLength(e.target.value)}
                            style={{ width: 80 }}
                            placeholder="All"
                        />
                    </label>
                    <label style={{ marginLeft: 24 }}>
                        <input
                            type="checkbox"
                            checked={medianFilter}
                            onChange={e => setMedianFilter(e.target.checked)}
                        />
                        &nbsp;Median filter
                    </label>
                    <label style={{ marginLeft: 24 }}>
                        Value column:&nbsp;
                        <select
                            value={valueColumn}
                            onChange={e => setValueColumn(Number(e.target.value))}
                            disabled={columnNames.length === 0}
                        >
                            {columnNames.map((name, idx) => (
                                <option key={idx + 1} value={idx + 1}>{name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <LineChart
                    xAxis={[{ data: frequencyTimes, label: "Time" }]}
                    yAxis={[freqYAxis]}
                    series={[
                        {
                            data: frequencies,
                            label: `Frequency (avg: ${averageFrequency.toFixed(2)} Hz), ${columnNames[valueColumn - 1] || ''}`,
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
                <LineChart
                    xAxis={[{ data: voltsTimes, label: "Time" }]}
                    yAxis={[voltsYAxis]}
                    series={[
                        {
                            data: volts,
                            label: `Millivolts from average (min: ${voltsYAxis.min.toFixed(2)}, max: ${voltsYAxis.max.toFixed(2)})`,
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
            </div>
        </div>
    );
}

export default App;