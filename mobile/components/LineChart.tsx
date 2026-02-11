import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";

interface Dataset {
    data: number[];
    color: string;
}

interface LineChartProps {
    datasets: Dataset[];
    labels: string[];
    height?: number;
    width?: number;
    isDark?: boolean;
    unit?: string;
}

export function LineChart({ datasets, labels, height = 220, width = 300, isDark, unit = "₹" }: LineChartProps) {
    const margin = { top: 20, right: 15, bottom: 30, left: 15 };
    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    // Find max frequency for global scaling
    const allValues = datasets.flatMap((d) => d.data);
    const maxValue = Math.max(...allValues, 1);

    const getY = (value: number) => {
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const getX = (index: number) => {
        if (labels.length <= 1) return chartWidth / 2;
        return (index / (labels.length - 1)) * chartWidth;
    };

    // Filter labels to avoid clutter
    const labelStep = Math.ceil(labels.length / 5); // Show ~5 labels max

    return (
        <Svg width={width} height={height}>
            <G x={margin.left} y={margin.top}>
                {/* Grid Lines */}
                {[0, 0.5, 1].map((ratio) => {
                    const value = Math.round(ratio * maxValue);
                    const y = getY(value);
                    return (
                        <G key={ratio}>
                            <Line
                                x1="0"
                                y1={y}
                                x2={chartWidth}
                                y2={y}
                                stroke={isDark ? "#333" : "#e0e0e0"}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                            <SvgText
                                x="0"
                                y={y - 6}
                                fontSize="10"
                                fill={isDark ? "#666" : "#999"}
                                textAnchor="start"
                            >
                                {unit}{value}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Lines */}
                {datasets.map((dataset, dIndex) => {
                    const points = dataset.data.map((val, i) => ({
                        x: getX(i),
                        y: getY(val),
                        val,
                    }));

                    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                    return (
                        <G key={dIndex}>
                            <Path d={pathD} stroke={dataset.color} strokeWidth="2.5" fill="none" />
                            {/* Dots */}
                            {points.map((p, i) => (
                                <Circle key={i} cx={p.x} cy={p.y} r="3" fill={isDark ? "#000" : "#fff"} stroke={dataset.color} strokeWidth="2" />
                            ))}
                        </G>
                    );
                })}

                {/* X Axis Labels */}
                {labels.map((label, index) => {
                    if (index % labelStep !== 0 && index !== labels.length - 1) return null;
                    return (
                        <SvgText
                            key={index}
                            x={getX(index)}
                            y={chartHeight + 20}
                            fontSize="10"
                            fill={isDark ? "#888" : "#999"}
                            textAnchor="middle"
                        >
                            {label}
                        </SvgText>
                    );
                })}
            </G>
        </Svg>
    );
}
