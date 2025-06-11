import React, { useContext, useEffect, useState } from 'react';
import FileUploader from "./components/FileUploader";
import {
    average,
    calculateFrequencyRateOfChangePercent, centsBetweenFrequencies, CentsEntry,
    createFrequencyProcessor, filterByMedianDeviation, filterByPercentile,
    parseLine, Sample, VoltsEntry,
} from "./logic/calculator";
import type {
    FrequencyEntry,
    RateOfChangeEntry,
} from "./logic/calculator";

import { FileLinesContext } from "./context/FileLinesContext";
import BitmapPlot from "./components/BitmapPlot";
import CommonLineChart from "./components/CommonLineChart";
import Dropdown from "./components/Dropdown";
import usePersistedState from "./hooks/usePersistedState";
import './App.css';

function App() {
    const { lines } = useContext(FileLinesContext);
    const [averageFrequency, setAverageFrequency] = useState<number>(0);
    const [waveSamples, setWaveSamples] = useState<Sample[]>([]);
    const [frequencyList, setFrequencyList] = useState<FrequencyEntry[]>([]);
    const [rateOfChangeList, setRateOfChangeList] = useState<RateOfChangeEntry[]>([]);
    const [centsDeviationList, setCentsDeviationList] = useState<CentsEntry[]>([]);
    const [voltsDeviationList, setVoltsDeviationList] = useState<VoltsEntry[]>([]);
    const [chartWidth, setChartWidth] = useState(window.innerWidth);
    const [loading, setLoading] = useState(false);
    const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);

    const [frequencyColumn, setFrequencyColumn] = usePersistedState<number>('frequencyColumn', 1);
    const [waveColumn, setWaveColumn] = usePersistedState<number>('waveColumn', 1);
    const [sliceLength, setSliceLength] = usePersistedState<string>('sliceLength', '');
    const [medianFilter, setMedianFilter] = usePersistedState<boolean>('medianFilter', false);
    const [medianDeviation, setMedianDeviation] = usePersistedState<number>('medianDeviation', 0.5);
    const [percentileFilter, setPercentileFilter] = usePersistedState<boolean>('percentileFilter', false);
    const [percentile, setPercentile] = usePersistedState<number>('percentile', 95);
    const [threshold, setThreshold] = usePersistedState<number>("threshold", 2.5);

    const columnNames = lines.length > 0 ? lines[0].split(',').slice(1) : [];


    useEffect(() => {
        let waveSamples = lines.slice(1).map(line => parseLine(line, waveColumn));
        if(lastTimestamp){
            const firstToCut = waveSamples.findIndex(sample => sample.time > lastTimestamp)
            waveSamples = waveSamples.slice(0, firstToCut)
        }
        setWaveSamples(waveSamples)
    }, [lines, waveColumn, lastTimestamp]);

    useEffect(() => {
        setLoading(true);

        setTimeout(() => { // Simulate async, remove if not needed

            if (lines.length < 1) {
                setLoading(false);
                return
            }

            const { processSample, frequencyList: freqList } = createFrequencyProcessor(threshold);
            const samples = lines.slice(1).map((line) => parseLine(line, frequencyColumn))

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
                    slicedList = slicedList.slice(0, n);
                }
                setLastTimestamp(slicedList[slicedList.length - 1]?.time || undefined);
            } else {
                setLastTimestamp(undefined)
            }

            if (medianFilter) {
                slicedList = filterByMedianDeviation(slicedList, medianDeviation);
            }

            if (percentileFilter) {
                const lowerPercentile = (100-percentile) / 100
                const upperPercentile = percentile / 100
                slicedList = filterByPercentile(slicedList, lowerPercentile, upperPercentile);
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
    }, [lines, threshold, sliceLength, medianFilter, frequencyColumn, medianDeviation, percentileFilter, percentile]);

    useEffect(() => {
        const handleResize = () => setChartWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                        Cycles:&nbsp;
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
                    <label style={{ marginLeft: 8 }}>
                        Max deviation:&nbsp;
                        <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={medianDeviation}
                            onChange={e => setMedianDeviation(Number(e.target.value))}
                            style={{ width: 60 }}
                        />
                    </label>
                    <label style={{ marginLeft: 24 }}>
                        <input
                            type="checkbox"
                            checked={percentileFilter}
                            onChange={e => setPercentileFilter(e.target.checked)}
                        />
                        &nbsp;Percentile filter
                    </label>
                    <label style={{ marginLeft: 8 }}>
                        Percentile:&nbsp;
                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={percentile}
                            onChange={e => setPercentile(Number(e.target.value))}
                            style={{ width: 60 }}
                        />
                    </label>
                    <Dropdown
                        label="Frequency column:"
                        value={frequencyColumn}
                        options={columnNames}
                        onChange={setFrequencyColumn}
                        disabled={columnNames.length === 0}
                        style={{ marginLeft: 24 }}
                    />
                    <Dropdown
                        label="Wave column:"
                        value={waveColumn}
                        options={columnNames}
                        onChange={setWaveColumn}
                        disabled={columnNames.length === 0}
                        style={{ marginLeft: 24 }}
                    />
                </div>
                <BitmapPlot
                    label={`${columnNames[waveColumn - 1] || 'Waveform'} waveform`}
                    samples={waveSamples}
                    width={chartWidth - 100}
                    height={200}
                    marginLeft={55}
                    marginRight={40}/>
                <CommonLineChart
                    data={frequencyList}
                    yProp="frequency"
                    seriesLabel={`Frequency (avg: ${averageFrequency.toFixed(2)} Hz), ${columnNames[frequencyColumn - 1] || ''}`}
                    width={chartWidth}
                />
                <CommonLineChart
                    data={centsDeviationList}
                    yProp="cents"
                    seriesLabel="Cents from average"
                    width={chartWidth}
                />
                <CommonLineChart
                    data={voltsDeviationList}
                    yProp="volts"
                    seriesLabel="Millivolts from average"
                    width={chartWidth}
                />
                <CommonLineChart
                    data={rateOfChangeList}
                    yProp="frequencyDifference"
                    seriesLabel="Frequency Change"
                    width={chartWidth}
                />
                <CommonLineChart
                    data={rateOfChangeList}
                    yProp="ratePercent"
                    seriesLabel="Percent Change"
                    width={chartWidth}
                    height={300}
                />
            </div>
        </div>
    );
}

export default App;