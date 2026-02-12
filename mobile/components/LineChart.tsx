    import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, G, LinearGradient, Stop, Defs } from "react-native-svg";

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
    const margin = { top: 30, right: 20, bottom: 40, left: 45 };
    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    // Find max frequency for global scaling
    const allValues = datasets.flatMap((d) => d.data);
    const rawMaxValue = Math.max(...allValues, 0);
    // Round max value up to a nice number
    const maxValue = rawMaxValue === 0 ? 1000 : Math.ceil(rawMaxValue / 500) * 500;

    const getY = (value: number) => {
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const getX = (index: number) => {
        if (labels.length <= 1) return chartWidth / 2;
        return (index / (labels.length - 1)) * chartWidth;
    };

    // Filter labels to avoid clutter
    const labelStep = Math.max(1, Math.ceil(labels.length / 6));

    const gridSteps = 4;

    return (
        <Svg width={width} height={height}>
            <Defs>
                {datasets.map((dataset, idx) => (
                    <LinearGradient key={`grad-${idx}`} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={dataset.color} stopOpacity="0.15" />
                        <Stop offset="1" stopColor={dataset.color} stopOpacity="0" />
                    </LinearGradient>
                ))}
            </Defs>
            <G x={margin.left} y={margin.top}>
                {/* Grid Lines */}
                {Array.from({ length: gridSteps + 1 }).map((_, i) => {
                    const ratio = i / gridSteps;
                    const value = Math.round(ratio * maxValue);
                    const y = getY(value);
                    return (
                        <G key={i}>
                            <Line
                                x1="0"
                                y1={y}
                                x2={chartWidth}
                                y2={y}
                                stroke={isDark ? "#334155" : "#f1f5f9"}
                                strokeWidth="1"
                            />
                            {i % 2 === 0 && (
                                <SvgText
                                    x="-5"
                                    y={y + 4}
                                    fontSize="10"
                                    fill={isDark ? "#64748b" : "#94a3b8"}
                                    textAnchor="end"
                                    fontWeight="bold"
                                >
                                    {unit}{value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                </SvgText>
                            )}
                        </G>
                    );
                })}

                {/* Data Paths */}
                {datasets.map((dataset, dIndex) => {
                    if (dataset.data.length === 0) return null;

                    const points = dataset.data.map((val, i) => ({
                        x: getX(i),
                        y: getY(val),
                    }));

                    // Simple straight lines
                    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                    // Area path
                    const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

                    return (
                        <G key={dIndex}>
                            <Path
                                d={areaD}
                                fill={`url(#fill-${dIndex})`}
                                stroke="transparent"
                                strokeWidth="0"
                            />
                            <Path
                                d={pathD}
                                stroke={dataset.color}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />

                            {/* Key points */}
                            {points.map((p, i) => {
                                const shouldShowDot = points.length < 15 || i === 0 || i === points.length - 1;
                                if (!shouldShowDot) return null;
                                return (
                                    <Circle
                                        key={i}
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill={isDark ? "#1e293b" : "#ffffff"}
                                        stroke={dataset.color}
                                        strokeWidth="2"
                                    />
                                );
                            })}
                        </G>
                    );
                })}

                {/* X Axis Labels */}
                {labels.map((label, index) => {
                    if (index % labelStep !== 0) return null;
                    return (
                        <SvgText
                            key={index}
                            x={getX(index)}
                            y={chartHeight + 25}
                            fontSize="10"
                            fill={isDark ? "#64748b" : "#94a3b8"}
                            textAnchor="middle"
                            fontWeight="bold"
                        >
                            {label}
                        </SvgText>
                    );
                })}
            </G>
        </Svg>
    );
}
