import React, { useContext, useEffect, useState } from 'react';
import FileUploader from "./components/FileUploader";
import { calculateFrequencyRateOfChangePercent, createFrequencyProcessor, parseLine } from "./logic/calculator";
import { FileLinesContext } from "./context/FileLinesContext";
import { LineChart } from "@mui/x-charts";
import './App.css';

function App() {
    const { lines } = useContext(FileLinesContext);
    const [frequencyList, setFrequencyList] = useState<{ time: number, frequency: number }[]>([]);
    const [rateOfChangeList, setRateOfChangeList] = useState<{ time: number, frequencyDifference: number, ratePercent: number }[]>([]);
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
        lines.forEach(line => {
            const sample = parseLine(line);
            if (!isNaN(sample.value)) {
                processSample(sample);
            }
        });
        const slicedList = freqList.slice(1);
        setFrequencyList(slicedList);
        setRateOfChangeList(calculateFrequencyRateOfChangePercent(slicedList));
    }, [lines, threshold]);

    useEffect(() => {
        const handleResize = () => setChartWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const times = frequencyList.map(entry => entry.time);
    const frequencies = frequencyList.map(entry => entry.frequency);
    const minY = frequencies.length ? Math.min(...frequencies) : 0;
    const maxY = frequencies.length ? Math.max(...frequencies) : 1;

    const rateOfChangeTimes = rateOfChangeList.map(entry => entry.time);
    const freqChange = rateOfChangeList.map(entry => entry.frequencyDifference);
    const minChangeY = freqChange.length ? Math.min(...freqChange) : 0;
    const maxChangeY = freqChange.length ? Math.max(...freqChange) : 1;

    const percentChange = rateOfChangeList.map(entry => entry.ratePercent);
    const minPercentY = percentChange.length ? Math.min(...percentChange) : 0;
    const maxPercentY = percentChange.length ? Math.max(...percentChange) : 1;

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
                    xAxis={[{ data: times, label: "Time" }]}
                    yAxis={[{ min: minY, max: maxY }]}
                    series={[
                        {
                            data: frequencies,
                            label: "Frequency",
                            area: false,
                            showMark: false,
                        }
                    ]}
                    width={chartWidth}
                    height={300}
                />
                <LineChart
                    xAxis={[{ data: rateOfChangeTimes, label: "Time" }]}
                    yAxis={[{ min: minChangeY, max: maxChangeY }]}
                    series={[
                        {
                            data: freqChange,
                            label: "Frequency Change",
                            area: false,
                            showMark: false,
                        }
                    ]}
                    width={chartWidth}
                    height={300}
                />
                <LineChart
                    xAxis={[{ data: rateOfChangeTimes, label: "Time" }]}
                    yAxis={[{ min: minPercentY, max: maxPercentY }]}
                    series={[
                        {
                            data: freqChange,
                            label: "Percent Change",
                            area: false,
                            showMark: false,
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