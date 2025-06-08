import React, { useContext, useEffect, useState } from 'react';
import './App.css';
import FileUploader from "./components/FileUploader";
import { createFrequencyProcessor, parseLine } from "./logic/calculator";
import { FileLinesContext } from "./context/FileLinesContext";
import { LineChart } from "@mui/x-charts";

function App() {
    const { lines } = useContext(FileLinesContext);
    const [frequencyList, setFrequencyList] = useState<{ time: number, frequency: number }[]>([]);

    useEffect(() => {
        const { processSample, frequencyList: freqList } = createFrequencyProcessor();
        lines.forEach(line => {
            const sample = parseLine(line);
            if (!isNaN(sample.value)) {
                processSample(sample);
            }
        });
        setFrequencyList(freqList.slice(1)); // Skip the first item
    }, [lines]);


    // Prepare data for LineChart
    const times = frequencyList.map(entry => entry.time);
    const frequencies = frequencyList.map(entry => entry.frequency);

    // Calculate min and max for y-axis
    const minY = frequencies.length ? Math.min(...frequencies) : 0;
    const maxY = frequencies.length ? Math.max(...frequencies) : 1;

    console.log('MAXMIN', minY, maxY);

    return (
        <div className="app">
            <div>
                <FileUploader/>
                <LineChart
                    xAxis={[{ data: times, label: "Time" }]}
                    yAxis={[{ min: minY, max: maxY, label: "Frequency" }]}
                    series={[
                        {
                            data: frequencies,
                            label: "Frequency",
                            area: false,
                            showMark: false,
                        }
                    ]}
                    width={500}
                    height={300}
                />
            </div>
        </div>
    );
}

export default App;
