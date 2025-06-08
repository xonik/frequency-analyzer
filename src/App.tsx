import React, { useState } from 'react';
import './App.css';
import { LineChart } from "@mui/x-charts";
import {
    findDeviationFromLinear,
    solveDiodeClipperForXRange,
    solveForX,
} from "./logic/diodeClipperSolver";
import { Point } from "./logic/types";
import {
    findNonInvertingGainCombo,
    findResistorDividerCombo, resistorSeries,
} from "./logic/resistorCalculator";
import type { ResistorSeriesKey } from "./logic/resistorCalculator";
import { parseComponentValue, printComponentValue } from "./logic/valueParser";

function App() {

    //const points = calculatePoints(100)

    const [I0, setI0] = useState(printComponentValue(2 / 1000000000))
    const [Vt, setVt] = useState(printComponentValue(25 / 1000))
    const [n, setN] = useState(printComponentValue(1.9))
    const [maxOpampSignal, setMaxOpampSignal] = useState(printComponentValue(10.5))

    const [Rg, setRg] = useState('1k')
    const [Rf, setRf] = useState('10k')
    const [gainSlider, setGainSlider] = useState(1)
    const [scaleSlider, setScaleSlider] = useState(0)
    const [maxClipperOutputSlider, setMaxClipperOutputSlider] = useState(0)


    const [maxCircuitOut, setMaxCircuitOut] = useState('10')
    const [maxClipperOut, setMaxClipperOut] = useState('0.6')
    const [endToEndLinearGain, setEndToEndLinearGain] = useState('1')
    const [clippingPointStartPercent, setClippingPointStartPercent] = useState('3')
    const [selectedResistorSeries, setSelectedResistorSeries] = useState<ResistorSeriesKey>('E12')


    const solverParams = {
        I0: parseComponentValue(I0),
        Vt: parseComponentValue(Vt),
        n: parseComponentValue(n),
        Rg: parseComponentValue(Rg),
        Rf: parseComponentValue(Rf),
    }

    const maxCircuitOutVolts = parseComponentValue(maxCircuitOut)
    const maxClipperOutVolts = parseComponentValue(maxClipperOut)

    const maxClipperInputVolts = solveForX(maxClipperOutVolts, solverParams)

    const clipperGain = 1 + (solverParams.Rf / solverParams.Rg)
    const postClipperGain = maxCircuitOutVolts / maxClipperOutVolts

    const endToEndLinearGainValue = parseComponentValue(endToEndLinearGain)
    const totalGain = clipperGain * postClipperGain / endToEndLinearGainValue
    const inputAttenuation = 1 / totalGain
    const maxInputVolts = maxClipperInputVolts * totalGain

    const stepInterval = 0.001
    const points = solveDiodeClipperForXRange(0, maxClipperInputVolts, stepInterval, solverParams)
    const pointsWithLinearAndDiff = findDeviationFromLinear(points, clipperGain)
    const linearYs = pointsWithLinearAndDiff.map((point) => point.yLinear)

    const clippingPointStartPercentValue = parseComponentValue(clippingPointStartPercent)
    const clippingPointInClipper = pointsWithLinearAndDiff.find((point) =>
        point.yDiffPercent > clippingPointStartPercentValue
    )

    const clippingPointsLine = points.map((point) => clippingPointInClipper?.y ?? 0)

    const clippingPointInput = (clippingPointInClipper?.x ?? 0) * totalGain

    console.log(pointsWithLinearAndDiff)

    const suggestedResistorDivider = findResistorDividerCombo(1000, 100000, inputAttenuation, selectedResistorSeries)
    const suggestedPostGainResistors = findNonInvertingGainCombo(1000, 100000, postClipperGain, selectedResistorSeries)

    findNonInvertingGainCombo(500, 100000, 0.2, 'E12')

    const five: Point[] = []
    for (let i = 0; i < 100; i += 10) {
        five.push({
            x: i, y: 1000
        })
    }

    const updateGainSlider = (valueString: string) => {
        const value = Number.parseInt(valueString)
        const rgValue = parseComponentValue(Rg)
        setRf(printComponentValue(rgValue * (1 + value * 0.25)))
        setGainSlider(value)
    }

    const updateScaleSlider = (valueString: string) => {
        const value = Number.parseInt(valueString)
        const currentRelationship = clipperGain - 1
        setRg(printComponentValue(value * 100))
        setRf(printComponentValue(currentRelationship * value * 100))
        setScaleSlider(value)
    }

    const updateMaxClipperOutputSlider = (valueString: string) => {
        const value = Number.parseInt(valueString)
        setMaxClipperOut(`${value / 100}`)
        setMaxClipperOutputSlider(value)
    }

    return (
        <div className="app">
            <div className="params">
                <table>
                    <thead>
                    <tr>
                        <th>Constants</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>I_0</td>
                        <td><input type="text" value={I0} onChange={(event) => setI0(event.target.value)}></input> Amps
                        </td>
                    </tr>
                    <tr>
                        <td>V_t</td>
                        <td><input type="text" value={Vt} onChange={(event) => setVt(event.target.value)}></input> Volts
                        </td>
                    </tr>
                    <tr>
                        <td>n</td>
                        <td><input type="text" value={n} onChange={(event) => setN(event.target.value)}></input></td>
                    </tr>
                    <tr>
                        <td>Max opamp signal voltage</td>
                        <td>
                            {/* any higher than this and op amps elsewhere in the circuit clips */}
                            <input
                                type="text"
                                value={maxOpampSignal}
                                onChange={(event) => setMaxOpampSignal(event.target.value)}>
                            </input> Volts
                        </td>
                    </tr>
                    </tbody>
                </table>
                <table>
                    <thead>
                    <tr>
                        <th>Components</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>R_gnd</td>
                        <td><input type="text" value={Rg} onChange={(event) => setRg(event.target.value)}></input> Ohm
                        </td>
                    </tr>
                    <tr>
                        <td>R_f</td>
                        <td><input type="text" value={Rf} onChange={(event) => setRf(event.target.value)}></input> Ohm
                        </td>
                    </tr>
                    <tr>
                        <td> Clipper linear gain:</td>
                        <td>{clipperGain}</td>
                    </tr>
                    <tr>
                        <td>Set gain:</td>
                        <td><input type="range" min={0} value={gainSlider} onChange={(event) => updateGainSlider(event.target.value)}></input></td>
                    </tr>
                    <tr>
                        <td>Set resistor scale</td>
                        <td><input type="range" min={1} value={scaleSlider} onChange={(event) => updateScaleSlider(event.target.value)}></input></td>
                    </tr>
                    </tbody>
                </table>
                <table>
                    <thead>
                    <tr>
                        <th>Target params</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Max circuit output</td>
                        <td><input type="text" value={maxCircuitOut}
                                   onChange={(event) => setMaxCircuitOut(event.target.value)}></input> Volts
                        </td>
                    </tr>
                    <tr>
                        <td>Max clipper output</td>
                        <td><input type="text" value={maxClipperOut}
                                   onChange={(event) => setMaxClipperOut(event.target.value)}></input> Volts
                        </td>
                    </tr>
                    <tr>
                        <td>Set resistor scale</td>
                        <td><input type="range" min={1} value={maxClipperOutputSlider} onChange={(event) => updateMaxClipperOutputSlider(event.target.value)}></input></td>
                    </tr>
                    <tr>
                        <td>End to end gain</td>
                        <td><input type="text" value={endToEndLinearGain}
                                   onChange={(event) => setEndToEndLinearGain(event.target.value)}></input>
                        </td>
                    </tr>
                    <tr>
                        {/*
                            Set this to whatever error you will accept as the biggest deviation from the linear output at the point for non
                            clipped signals
                        */}
                        <td>Allowed clipping point error</td>
                        <td><input type="text" value={clippingPointStartPercent}
                                   onChange={(event) => setClippingPointStartPercent(event.target.value)}></input> %
                        </td>
                    </tr>

                    </tbody>
                </table>
                <table>
                    <thead>
                    <tr>
                        <th>Calculations</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Input attenuation (gain)</td>
                        <td>{totalGain.toPrecision(4)} ({inputAttenuation.toPrecision(3)})</td>
                    </tr>
                    <tr>
                        <td>Max clipper input</td>
                        <td>{maxClipperInputVolts.toPrecision(3)}V</td>
                    </tr>
                    <tr>
                        <td>Max input</td>
                        <td>{maxInputVolts.toPrecision(3)}V</td>
                    </tr>
                    <tr>
                        <td>Post clipper gain</td>
                        <td>{postClipperGain.toPrecision(4)}</td>
                    </tr>
                    <tr>
                        <td>Approximate input clipping start</td>
                        <td>{clippingPointInput.toPrecision(3)}V</td>
                    </tr>
                    </tbody>
                </table>
                <table>
                    <thead>
                    <tr>
                        <th>Component suggestions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Resistor series</td>
                        <td>
                            <select value={selectedResistorSeries}
                                    onChange={(event) => setSelectedResistorSeries(event.target.value as ResistorSeriesKey)}>
                                {Object.keys(resistorSeries).map((key) => <option value={key}>{key}
                                </option>)}
                            </select></td>
                    </tr>
                    <tr>
                        <td>Input resistor divider suggestion</td>
                        <td>R1: {printComponentValue(suggestedResistorDivider?.r1 || 0, 'Ω')},
                            R2: {printComponentValue(suggestedResistorDivider?.r2 || 0, 'Ω')}</td>
                    </tr>
                    <tr>
                        <td>Gain: {suggestedResistorDivider?.gain.toPrecision(4)}</td>
                    </tr>
                    <tr>
                        <td>Post clipper gain resistor suggestion</td>
                        <td>R_g: {printComponentValue(suggestedPostGainResistors?.r1 || 0, 'Ω')},
                            R_f: {printComponentValue(suggestedPostGainResistors?.r2 || 0, 'Ω')}</td>
                    </tr>
                    <tr>
                        <td>Gain: {suggestedPostGainResistors?.gain.toPrecision(4)}</td>
                    </tr>
                    <tr>
                        <td>End-to-end
                            gain: {((suggestedResistorDivider?.gain || 0) * clipperGain * (suggestedPostGainResistors?.gain || 0)).toPrecision(4)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <LineChart
                    xAxis={[{ data: points.map((point) => point.x * totalGain), min: 0, max: 10 }]}
                    yAxis={[{ min: 0, max: 10 }]}
                    grid={{ vertical: true, horizontal: true }}
                    series={[
                        {
                            data: linearYs.map((y) => y * postClipperGain),
                            area: false,
                            showMark: false,
                            label: 'Linear (V)'
                        }, {
                            data: points.map((point) => point.y * postClipperGain),
                            area: false,
                            showMark: false,
                            label: 'Clipped (V)'
                        },
                        {
                            data: clippingPointsLine.map((y) => y * postClipperGain),
                            area: false,
                            showMark: false,
                            label: 'Clip start (V)'
                        },

                    ]}
                    width={500}
                    height={500}
                    slotProps={{
                        legend: {
                            direction: 'row',
                            position: { vertical: 'bottom', horizontal: 'middle' },
                            padding: 0,
                        },
                    }}
                />
                <LineChart
                    title="End to end"
                    xAxis={[{ data: points.map((point) => point.x) }]}
                    grid={{ vertical: true, horizontal: true }}
                    series={[
                        {
                            data: points.map((point) => point.y),
                            area: false,
                            showMark: false,
                        },
                        {
                            data: clippingPointsLine,
                            area: false,
                            showMark: false,
                        },
                        {
                            data: linearYs,
                            area: false,
                            showMark: false,
                        },
                    ]}
                    width={500}
                    height={500}
                />
            </div>
        </div>
    );
}

export default App;
