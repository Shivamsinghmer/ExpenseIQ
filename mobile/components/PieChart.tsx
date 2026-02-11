import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, G } from "react-native-svg";

interface PieChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
    radius: number;
    containerWidth: number;
    isDark?: boolean;
}

export function PieChart({ data, radius, containerWidth, isDark }: PieChartProps) {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    let startAngle = 0;

    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: cx + (r * Math.cos(angleInRadians)),
            y: cy + (r * Math.sin(angleInRadians))
        };
    };

    const describePieSlice = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, r, endAngle);
        const end = polarToCartesian(x, y, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return [
            "M", x, y,
            "L", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
            "Z"
        ].join(" ");
    };

    if (total === 0) {
        return (
            <View className="items-center justify-center h-40">
                <Text className="text-neutral-400">No data available</Text>
            </View>
        );
    }

    return (
        <View className="flex-row items-center justify-between px-4">
            {/* Chart */}
            <View>
                <Svg width={radius * 2} height={radius * 2}>
                    <G x={radius} y={radius}>
                        {data.map((item, index) => {
                            const angle = (item.value / total) * 360;
                            const endAngle = startAngle + angle;
                            const path = describePieSlice(0, 0, radius, startAngle, endAngle > 359.9 ? 359.9 : endAngle);
                            startAngle += angle;
                            return <Path key={index} d={path} fill={item.color} />;
                        })}
                    </G>
                </Svg>
            </View>

            {/* Legend */}
            <View className="flex-1 ml-6">
                {data.map((item, index) => (
                    <View key={index} className="flex-row items-center mb-2 last:mb-0">
                        <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                        <Text className={`text-xs ${isDark ? "text-white" : "text-neutral-600"} flex-1`} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text className={`text-xs font-bold ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                            {Math.round((item.value / total) * 100)}%
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
