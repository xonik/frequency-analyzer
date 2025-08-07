import React, { useContext, useEffect, useState } from 'react';
import SamplesFileUploader from "./components/SamplesFileUploader";
import AnalyzedFileUploader from "./components/AnalyzedFileUploader";
import {
    average,
    calculateFrequencyRateOfChangePercent, centsBetweenFrequencies,
    createFrequencyProcessor, filterByMedianDeviation, filterByPercentile, movingAverageNKMapper,
    parseLine, Sample
} from "./logic/calculator";
import type {
    RateOfChangeEntry,
} from "./logic/calculator";

import { SampleFileLinesContext } from "./context/SampleFileLinesContext";
import { AnalyzedFileLinesContext } from "./context/AnalyzedFileLinesContext";
import BitmapPlot from "./components/BitmapPlot";
import CommonLineChart from "./components/CommonLineChart";
import Dropdown from "./components/Dropdown";
import usePersistedState from "./hooks/usePersistedState";
import './App.css';

function App() {
    const { lines } = useContext(SampleFileLinesContext);
    const { lines: analyzedLines } = useContext(AnalyzedFileLinesContext);
    const [averageFrequency, setAverageFrequency] = useState<number>(0);
    const [waveSamples, setWaveSamples] = useState<Sample[]>([]);

    const [rawFrequencies, setRawFrequencies] = useState<Sample[]>([]);
    const [pwSamples, setPwSamples] = useState<Sample[]>([]);
    const [frequencyList, setFrequencyList] = useState<Sample[]>([]);
    const [filteredFrequencyList, setFilteredFrequencyList] = useState<Sample[]>([]);
    const [backgroundFrequencyList, setBackgroundFrequencyList] = useState<Sample[]>([]);

    const [centsDeviationList, setCentsDeviationList] = useState<Sample[]>([]);
    const [filteredCentsDeviationList, setFilteredCentsDeviationList] = useState<Sample[]>([]);
    const [backgroundCentsDeviationList, setBackgroundCentsDeviationList] = useState<Sample[]>([]);

    const [rateOfChangeList, setRateOfChangeList] = useState<RateOfChangeEntry[]>([]);
    const [voltsDeviationList, setVoltsDeviationList] = useState<Sample[]>([]);
    const [chartWidth, setChartWidth] = useState(window.innerWidth);
    const [loading, setLoading] = useState(false);
    const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);

    const [frequencyColumn, setFrequencyColumn] = usePersistedState<number>('frequencyColumn', 1);
    const [waveColumn, setWaveColumn] = usePersistedState<number>('waveColumn', 1);
    const [sliceLength, setSliceLength] = usePersistedState<string>('sliceLength', '');
    const [movingAverageWindow, setMovingAverageWindow] = usePersistedState<number>('movingAverageWindow', 4);
    const [threshold, setThreshold] = usePersistedState<number>("threshold", 2.5);

    const columnNames = lines.length > 0 ? lines[0].split(',').slice(1) : [];


    useEffect(() => {
        let waveSamples = lines.slice(1).map(line => parseLine(line, waveColumn));
        if (lastTimestamp) {
            const firstToCut = waveSamples.findIndex(sample => sample.time > lastTimestamp)
            waveSamples = waveSamples.slice(0, firstToCut)
        }
        setWaveSamples(waveSamples)
    }, [lines, waveColumn, lastTimestamp]);

    useEffect(() => {
        let frequencySamples = analyzedLines.slice(1).map(line => parseLine(line, 1));
        let pwSamples = analyzedLines.slice(1).map(line => parseLine(line, 2));

        if (lastTimestamp) {
            const firstFreqToCut = frequencySamples.findIndex(sample => sample.time > lastTimestamp)
            frequencySamples = frequencySamples.slice(0, firstFreqToCut)

            const firstPwToCut = pwSamples.findIndex(sample => sample.time > lastTimestamp)
            pwSamples = pwSamples.slice(0, firstPwToCut)
        }
        setRawFrequencies(frequencySamples)
        setPwSamples(pwSamples)
        setWaveSamples([])
    }, [analyzedLines]);

    useEffect(() => {
        setPwSamples([])
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
            setRawFrequencies(freqList.slice(1))
        }, 10)
    }, [lines, threshold, frequencyColumn]);


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

        setLoading(false);
    }, [rawFrequencies, movingAverageWindow]);

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
                    <SamplesFileUploader/>
                    <AnalyzedFileUploader/>
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
                    <label style={{ marginLeft: 8 }}>
                        Moving avg window:&nbsp;
                        <input
                            type="number"
                            step="1"
                            min="1"
                            value={movingAverageWindow}
                            onChange={e => setMovingAverageWindow(Number(e.target.value))}
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
                {waveSamples.length > 0 && <BitmapPlot
                    label={`${columnNames[waveColumn - 1] || 'Waveform'} waveform`}
                    samples={waveSamples}
                    width={chartWidth - 100}
                    height={200}
                    marginLeft={55}
                    marginRight={40}/>
                }
                {pwSamples.length > 0 && <CommonLineChart
                    data={[pwSamples]}
                    yProp="value"
                    seriesLabels={['Pulse width']}
                    width={chartWidth}
                />
                }
                <CommonLineChart
                    data={[backgroundFrequencyList, frequencyList, filteredFrequencyList]}
                    yProp="value"
                    seriesLabels={['Background', `Frequency (avg: ${averageFrequency.toFixed(2)} Hz), ${columnNames[frequencyColumn - 1] || ''}`, 'Filtered frequency']}
                    width={chartWidth}
                />
                <CommonLineChart
                    data={[backgroundCentsDeviationList, centsDeviationList, filteredCentsDeviationList]}
                    yProp="value"
                    seriesLabels={['Background', "Cents from average", 'Filtered cents']}
                    width={chartWidth}
                />
                <CommonLineChart
                    data={[voltsDeviationList]}
                    yProp="value"
                    seriesLabels={["Millivolts from average"]}
                    width={chartWidth}
                />
                <CommonLineChart
                    data={[rateOfChangeList]}
                    yProp="frequencyDifference"
                    seriesLabels={["Frequency Change"]}
                    width={chartWidth}
                />
                <CommonLineChart
                    data={[rateOfChangeList]}
                    yProp="ratePercent"
                    seriesLabels={["Percent Change"]}
                    width={chartWidth}
                    height={300}
                />
            </div>
        </div>
    );
}

export default App;