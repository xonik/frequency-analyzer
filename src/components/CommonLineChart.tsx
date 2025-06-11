import React from 'react';
import { LineChart } from "@mui/x-charts";
import { getMinMaxY } from "../logic/calculator";

type CommonLineChartProps<T> = {
    data: T[];
    yProp: keyof T;
    seriesLabel: string;
    width: number;
    height?: number;
    showMinMax?: boolean;
};

const CommonLineChart = <T extends { time: number }>(
    { data, yProp, seriesLabel, width, height = 300, showMinMax = true }: CommonLineChartProps<T>
) => {
    const xData = data.map(entry => entry.time);
    const yData = data.map(entry => entry[yProp] as number);
    const yAxis = getMinMaxY(yData);

    let label = seriesLabel;
    if (showMinMax && yData.length > 0) {
        label += ` (min: ${yAxis.min.toFixed(2)}, max: ${yAxis.max.toFixed(2)})`;
    }

    return (
        <LineChart
            xAxis={[{ data: xData, label: "Time" }]}
            yAxis={[yAxis]}
            series={[
                {
                    data: yData,
                    label,
                    area: false,
                    showMark: false,
                    curve: 'linear'
                }
            ]}
            width={width}
            height={height}
        />
    );
};

export default CommonLineChart;