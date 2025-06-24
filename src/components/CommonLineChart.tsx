import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { getMinMaxY } from "../logic/calculator";

type CommonLineChartProps<T extends { time: number }> = {
    data: T[][];
    yProp: keyof T;
    seriesLabels: string[];
    colors?: string[];
    width?: number;
    height?: number;
};

const defaultColors = ['#34756D', '#342cfb', '#fd0303', '#ff7300', '#ff0000', '#0088FE', '#00C49F'];

function CommonLineChart<T extends { time: number }>({
                                                         data,
                                                         yProp,
                                                         seriesLabels,
                                                         colors = defaultColors,
                                                         width = 800,
                                                         height = 200,
                                                     }: CommonLineChartProps<T>) {


    const series = data.map((dataset, idx) => {

        const yData =  dataset.map(d => d[yProp] as number)
        const yAxis = getMinMaxY(yData);

        let label = seriesLabels[idx] ?? `Series ${idx + 1}`
        if (yData.length > 0) {
            label += ` (min: ${yAxis.min.toFixed(2)}, max: ${yAxis.max.toFixed(2)})`;
        }

        return ({
            data: yData,
            label: label,
            color: colors[idx % colors.length],
            showMark: false,
            id: `series-${idx}`,
        })
    });

    return (
        <LineChart
            width={width}
            height={height}
            series={series}
            xAxis={[{ data: data[0]?.map(d => d.time) ?? [], label: 'Time' }]}
            yAxis={[{ label: String(yProp), tickLabelStyle: { fontSize: 10 } }]}
            legend={{ hidden: false }}
        />
    );
}

export default CommonLineChart;