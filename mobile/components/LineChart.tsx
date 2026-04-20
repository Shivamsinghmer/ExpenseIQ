import React, { useState } from "react";
import { View, Dimensions, TouchableWithoutFeedback } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, G, LinearGradient, Stop, Defs, Rect } from "react-native-svg";

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

export function LineChart({ datasets, labels, height = 220, width = 300, isDark, unit = "\u20B9" }: LineChartProps) {
    const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number; value: number } | null>(null);

    // Reduced top margin from 55 to 25 to minimize excessive whitespace
    const margin = { top: 25, right: 15, bottom: 30, left: 36 };
    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    // Calculate Max Value
    const allValues = datasets.flatMap((d) => d.data);
    const rawMaxValue = Math.max(...allValues, 0);
    
    // Increased dynamic scaling padding from 20% to 40% to prevent tooltip clipping with reduced margin
    const maxValue = rawMaxValue > 0 ? rawMaxValue * 1.4 : 100;

    const getY = (value: number) => {
        if (maxValue === 0) return chartHeight;
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const getX = (index: number) => {
        if (labels.length <= 1) return chartWidth / 2;
        return (index / (labels.length - 1)) * chartWidth;
    };

    const formatValue = (val: number) => {
        if (val >= 10000000) return `${(val / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
        if (val >= 100000) return `${(val / 100000).toFixed(1).replace(/\.0$/, "")}L`;
        if (val >= 1000) return `${(val / 1000).toFixed(1).replace(/\.0$/, "")}k`;
        return Math.round(val).toString();
    };

    const gridSteps = 4;
    const labelStep = Math.max(1, Math.ceil(labels.length / 5));

    return (
        <TouchableWithoutFeedback onPress={() => setSelectedPoint(null)}>
            <View style={{ width, height }}>
                <Svg width={width} height={height}>
                <Defs>
                    {datasets.map((dataset, idx) => (
                        <LinearGradient key={`grad-${idx}`} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={dataset.color} stopOpacity="0.15" />
                            <Stop offset="1" stopColor={dataset.color} stopOpacity="0.0" />
                        </LinearGradient>
                    ))}
                </Defs>
                <G x={margin.left} y={margin.top}>
                    {/* Grid Lines & Y-Axis Labels */}
                    {Array.from({ length: gridSteps + 1 }).map((_, i) => {
                        const val = (maxValue / gridSteps) * i;
                        const y = getY(val);

                        return (
                            <G key={`grid-${i}`}>
                                <Line
                                    x1="0"
                                    y1={y}
                                    x2={chartWidth}
                                    y2={y}
                                    stroke={isDark ? "#334155" : "#f1f5f9"}
                                    strokeDasharray={i === 0 ? "" : "3, 3"}
                                    strokeWidth="1"
                                />
                                <SvgText
                                    x="-8"
                                    y={y + 3}
                                    fontSize="10"
                                    fill={isDark ? "#94a3b8" : "#94a3b8"}
                                    textAnchor="end"
                                    fontWeight="400"
                                >
                                    {`${unit} ${formatValue(val)}`}
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
                            value: val,
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
                                {points.map((p, i) => (
                                    <G 
                                        key={`dot-group-${i}`} 
                                        onPress={() => setSelectedPoint({ x: p.x, y: p.y, value: p.value })}
                                    >
                                        {/* Colored Node */}
                                        <Circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="3.5"
                                            fill={selectedPoint?.x === p.x ? dataset.color : (isDark ? "#1e293b" : "#ffffff")}
                                            stroke={dataset.color}
                                            strokeWidth="2.5"
                                        />
                                        {/* Invisible Interactive Hit-Box (fat finger padding) */}
                                        <Circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="22"
                                            fill="transparent"
                                        />
                                    </G>
                                ))}
                            </G>
                        );
                    })}



                    {labels.map((label, index) => {
                        // Show first, last, and any non-empty labels
                        const isLast = index === labels.length - 1;
                        const isFirst = index === 0;
                        if (!isFirst && !isLast && label === "") return null;

                        return (
                            <SvgText
                                key={`label-${index}`}
                                x={getX(index)}
                                y={chartHeight + 25}
                                fontSize="10"
                                fill={isDark ? "#94a3b8" : "#64748b"}
                                textAnchor={isFirst ? "start" : (isLast ? "end" : "middle")}
                                fontWeight="500"
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                    {/* Tooltip Overlay - Rendered LAST in G to be on top */}
                    {selectedPoint && (
                        <G x={selectedPoint.x} y={selectedPoint.y - 32}>
                            {/* Card Body - Smaller dimensions */}
                            <Rect
                                x={-35}
                                y={-12}
                                width={70}
                                height={24}
                                rx={12}
                                fill={isDark ? "#334155" : "#1e293b"}
                                stroke={isDark ? "#475569" : "#334155"}
                                strokeWidth="1"
                            />
                            {/* Connective Arrow */}
                            <Path
                                d="M -5 12 L 0 17 L 5 12 Z"
                                fill={isDark ? "#334155" : "#1e293b"}
                            />
                            <SvgText
                                x={0}
                                y={4}
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {`${unit} ${selectedPoint.value.toLocaleString("en-IN")}`}
                            </SvgText>
                        </G>
                    )}
                </G>
            </Svg>
            </View>
        </TouchableWithoutFeedback>
    );
}
