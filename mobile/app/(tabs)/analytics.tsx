import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, 
    ActivityIndicator, Platform, Dimensions
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, type SummaryResponse } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    Sparkles, ChevronRight, TrendingUp, 
    TrendingDown, IndianRupee, PieChart as PieIcon,
    Flame, Zap
} from "lucide-react-native";
import { LineChart } from "../../components/LineChart";
import Svg, { G, Path, Circle, Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Simple Donut Chart Component ---
const DonutChart = ({ data, size = 180, strokeWidth = 25, total }: { data: any[], size?: number, strokeWidth?: number, total: number }) => {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {data.map((item, index) => {
                        const percentage = (item.totalSpent / total) * 100;
                        const strokeDasharray = circumference;
                        const strokeDashoffset = circumference - (circumference * percentage) / 100;
                        const rotate = (currentOffset / total) * 360;
                        currentOffset += item.totalSpent;

                        return (
                            <Circle
                                key={index}
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={item.color || "#CBD5E1"}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform={`rotate(${rotate}, ${center}, ${center})`}
                                fill="transparent"
                            />
                        );
                    })}
                </G>
            </Svg>
            <View className="absolute items-center justify-center">
                <View className="w-6 h-6 items-center justify-center mb-1">
                    <PieIcon size={14} color="#94a3b8" />
                </View>
                <Text className="text-gray-900 font-geist-b text-lg">₹{total.toLocaleString()}</Text>
                <Text className="text-gray-400 font-geist-md text-[10px] uppercase">Total Spent</Text>
            </View>
        </View>
    );
};

export default function Analytics() {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [timeRange, setTimeRange] = useState("month");

    // Fetch Summary Data
    const { data: summary, isLoading } = useQuery<SummaryResponse>({
        queryKey: ["summary", timeRange],
        queryFn: async () => {
            const res = await transactionsAPI.getSummary({ range: timeRange });
            return res.data;
        },
    });

    const aiInsights = [
        { id: 1, text: "You're more careful with spending on weekends", icon: Sparkles },
        { id: 2, text: "Medical is the top expense category", icon: Flame },
    ];

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#FF6A00" />
            </View>
        );
    }

    const labels = summary?.chartData?.map(d => new Date(d.date).toLocaleDateString("en-IN", { month: "short" })) || ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const chartData = summary?.chartData?.map(d => d.expense) || [5000, 4500, 6000, 5200, 21000, 12000];

    const hasData = summary && summary.tagBreakdown && summary.tagBreakdown.length > 0;
    const topCategory = hasData ? summary.tagBreakdown[0] : null;
    const budget = 3000;
    const remaining = topCategory ? Math.max(0, budget - topCategory.totalSpent) : budget;
    const budgetPercentage = topCategory ? Math.min(100, Math.floor((topCategory.totalSpent / budget) * 100)) : 0;

    return (
        <ScrollView 
            className="flex-1 bg-[#F9FAFB] dark:bg-background-dark"
            showsVerticalScrollIndicator={false}
        >
            <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 120 }}>
                {/* Header */}
                <Text className="text-gray-900 dark:text-white text-[32px] font-geist-b mb-6">Analytics</Text>

                {/* AI Insights */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-4">
                        <Text className="text-[20px]">💡</Text>
                        <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b ml-2">AI Insights</Text>
                    </View>
                    
                    {aiInsights.map((insight) => (
                        <View key={insight.id} className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-2 shadow-sm border border-gray-50 dark:border-slate-800 flex-row items-center">
                            <View className="w-10 h-10 items-center justify-center mr-4">
                                <insight.icon size={20} color="#FF6A00" />
                            </View>
                            <Text className="flex-1 text-gray-800 dark:text-gray-200 font-geist-md text-sm leading-5">
                                {insight.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Filter Controls */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                    {["All", "This Month", "Last Month"].map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTimeRange(t.toLowerCase().replace(" ", ""))}
                            className={`px-6 py-2.5 rounded-full mr-2 border ${t === "This Month" ? "bg-[#FF6A00] border-[#FF6A00]" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm"}`}
                        >
                            <Text className={`text-sm font-geist-sb ${t === "This Month" ? "text-white" : "text-gray-500"}`}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {!hasData ? (
                    <View className="flex-1 items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-gray-50 dark:border-slate-800">
                        <PieIcon size={48} color="#94a3b8" />
                        <Text className="text-gray-900 dark:text-gray-100 font-geist-b text-lg mt-4">No data found</Text>
                        <Text className="text-gray-400 font-geist-md text-sm mt-2 text-center px-10">
                            We couldn't find any transaction data for analytics in this period.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Spending Trend Chart */}
                        <View className="mb-8">
                            <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b mb-6">6-Month Spending Trend</Text>
                            <View className="bg-white dark:bg-slate-900 rounded-[32px] p-4 shadow-sm border border-gray-50 dark:border-slate-800 items-center">
                                <LineChart
                                    width={SCREEN_WIDTH - 48 - 32} 
                                    height={220}
                                    labels={labels}
                                    datasets={[{ data: chartData, color: "#FF6A00" }]}
                                    isDark={isDark}
                                    unit="₹"
                                />
                            </View>
                        </View>

                        {/* Spending by Category */}
                        <View className="mb-8">
                            <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b mb-6">Spending by Category</Text>
                            
                            <View className="items-center mb-8">
                                <DonutChart 
                                    data={summary?.tagBreakdown || []} 
                                    total={summary?.totalExpense || 0} 
                                />
                            </View>

                            {/* Detailed Category Card */}
                            {topCategory && (
                                <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-gray-50 dark:border-slate-800">
                                    <View className="flex-row items-center justify-between mb-6">
                                        <View className="flex-row items-center">
                                            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                                                <PieIcon size={20} color={topCategory.color} />
                                            </View>
                                            <View>
                                                <Text className="text-gray-900 dark:text-white font-geist-b text-base">{topCategory.name}</Text>
                                                <Text className="text-gray-400 text-xs">{topCategory.count} transactions</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                                            <ChevronRight size={18} color="#9ca3af" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Stats Row */}
                                    <View className="flex-row justify-between mb-6">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Total</Text>
                                            <Text className="text-gray-900 dark:text-white font-geist-b text-base">₹{topCategory.totalSpent.toLocaleString()}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Average</Text>
                                            <Text className="text-gray-900 dark:text-white font-geist-b text-base">₹{Math.floor(topCategory.totalSpent / (topCategory.count || 1))}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Budget</Text>
                                            <Text className="text-emerald-500 font-geist-b text-base">₹{budget.toLocaleString()}</Text>
                                        </View>
                                    </View>

                                    {/* Budget Progress */}
                                    <View className="mb-6">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-emerald-500 font-geist-sb text-xs">₹{remaining.toLocaleString()} remaining</Text>
                                            <Text className="text-gray-400 font-geist-sb text-xs">{budgetPercentage}%</Text>
                                        </View>
                                        <View className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <View 
                                                className="h-full bg-emerald-500 rounded-full" 
                                                style={{ width: `${budgetPercentage}%` }} 
                                            />
                                        </View>
                                    </View>

                                    {/* Top Merchants */}
                                    <View className="mb-6">
                                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-4">Top Merchants</Text>
                                        <View className="gap-y-3">
                                            {[
                                                { name: "Licious", amount: 1483, count: 3 },
                                                { name: "Blinkit", amount: 943, count: 3 },
                                                { name: "Needs Market", amount: 100, count: 2 },
                                            ].map((m, i) => (
                                                <View key={i} className="flex-row justify-between items-center">
                                                    <Text className="text-gray-900 dark:text-white font-geist-sb text-sm">{m.name}</Text>
                                                    <View className="flex-row items-center">
                                                        <Text className="text-gray-900 dark:text-white font-geist-b text-sm">₹{m.amount.toLocaleString()}</Text>
                                                        <Text className="text-gray-400 text-[10px] ml-1">({m.count}x)</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Recent Transactions */}
                                    <View>
                                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-4">Recent Transactions</Text>
                                        <View className="gap-y-4">
                                            {[
                                                { name: "Licious", amount: 349, date: "17 Mar 2026", method: "UPI" },
                                                { name: "Blinkit", amount: 190, date: "16 Mar 2026", method: "UPI" },
                                            ].map((t, i) => (
                                                <View key={i} className="flex-row justify-between items-center">
                                                    <View>
                                                        <Text className="text-gray-900 dark:text-white font-geist-sb text-sm">{t.name}</Text>
                                                        <Text className="text-gray-400 text-[10px]">{t.date}  •  {t.method}</Text>
                                                    </View>
                                                    <Text className="text-gray-900 dark:text-white font-geist-b text-sm">₹{t.amount.toLocaleString()}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
}
