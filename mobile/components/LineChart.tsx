import React from "react";
import { View, Dimensions } from "react-native";
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
    // Increased left margin for better label visibility
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    // Calculate Max Value
    const allValues = datasets.flatMap((d) => d.data);
    const rawMaxValue = Math.max(...allValues, 0);
    // Dynamic max value scaling: e.g., if max is 120, scale to 150 or 200.
    // If all 0, default to 100
    let maxValue = 100;
    if (rawMaxValue > 0) {
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawMaxValue)));
        // Find a nice upper bound
        maxValue = Math.ceil(rawMaxValue / magnitude) * magnitude;
        if (maxValue < rawMaxValue * 1.1) {
            // Add some headroom if it's too close
            maxValue += magnitude / 2;
        }
    }

    const getY = (value: number) => {
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const getX = (index: number) => {
        if (labels.length <= 1) return chartWidth / 2;
        return (index / (labels.length - 1)) * chartWidth;
    };

    const formatValue = (val: number) => {
        if (val >= 1000) {
            return `${(val / 1000).toFixed(1).replace(/\.0$/, "")}k`;
        }
        return val.toString();
    };

    // Grid lines count
    const gridSteps = 4;

    // Label skipping logic
    const labelStep = Math.max(1, Math.ceil(labels.length / 5));

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height}>
                <Defs>
                    {datasets.map((dataset, idx) => (
                        <LinearGradient key={`grad-${idx}`} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={dataset.color} stopOpacity="0.2" />
                            <Stop offset="1" stopColor={dataset.color} stopOpacity="0.0" />
                        </LinearGradient>
                    ))}
                </Defs>
                <G x={margin.left} y={margin.top}>
                    {/* Grid Lines & Y-Axis Labels */}
                    {Array.from({ length: gridSteps + 1 }).map((_, i) => {
                        const val = (maxValue / gridSteps) * i;
                        const y = getY(val);

                        // We strictly want values 0, 1/4, 2/4, 3/4, 1
                        // But let's invert the loop so we draw from bottom (0) to top (max) or vice versa?
                        // Actually standard loop 0..4 is fine. val 0 -> y=height.

                        return (
                            <G key={`grid-${i}`}>
                                <Line
                                    x1="0"
                                    y1={y}
                                    x2={chartWidth}
                                    y2={y}
                                    stroke={isDark ? "#334155" : "#e2e8f0"}
                                    strokeDasharray={i === 0 ? "" : "5, 5"} // Solid line for base (0), dashed for others
                                    strokeWidth="1"
                                />
                                <SvgText
                                    x="-10"
                                    y={y + 4}
                                    fontSize="11"
                                    fill={isDark ? "#94a3b8" : "#64748b"}
                                    textAnchor="end"
                                    fontWeight="500"
                                >
                                    {unit}{formatValue(val)}
                                </SvgText>
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

                        // Bezier curve or straight line? Let's stick to straight for accuracy, or simple curve.
                        // Straight is safer for financial data usually, but let's smooth it slightly if desired.
                        // For now, straight lines.

                        const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                        const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

                        return (
                            <G key={`dataset-${dIndex}`}>
                                <Path
                                    d={areaD}
                                    fill={`url(#fill-${dIndex})`}
                                    stroke="transparent"
                                />
                                <Path
                                    d={pathD}
                                    stroke={dataset.color}
                                    strokeWidth="2.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Dots only on data points if not too many */}
                                {points.length < 20 && points.map((p, i) => (
                                    <Circle
                                        key={`dot-${i}`}
                                        cx={p.x}
                                        cy={p.y}
                                        r="3.5"
                                        fill={isDark ? "#1e293b" : "#ffffff"}
                                        stroke={dataset.color}
                                        strokeWidth="2"
                                    />
                                ))}
                            </G>
                        );
                    })}

                    {/* X Axis Labels */}
                    {labels.map((label, index) => {
                        // Show first, last, and filtered steps
                        const isLast = index === labels.length - 1;
                        const isFirst = index === 0;
                        if (!isFirst && !isLast && index % labelStep !== 0) return null;

                        return (
                            <SvgText
                                key={`label-${index}`}
                                x={getX(index)}
                                y={chartHeight + 25}
                                fontSize="10"
                                fill={isDark ? "#94a3b8" : "#64748b"}
                                textAnchor="middle"
                                fontWeight="500"
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}
