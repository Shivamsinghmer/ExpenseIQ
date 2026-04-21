import React, { useState, useMemo, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, 
    ActivityIndicator, Platform, Dimensions, Modal, TouchableWithoutFeedback
} from "react-native";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, budgetsAPI, type SummaryResponse } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    Sparkles, ChevronRight, TrendingUp, 
    TrendingDown, IndianRupee, PieChart as PieIcon,
    CalendarDays, 
    MessageSquare,
    Filter,
    AlertCircle,
    Flame
} from "lucide-react-native";
import SkeletonLoader from "../../components/SkeletonLoader";
import { LineChart } from "../../components/LineChart";
import Svg, { G, Path, Circle, Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORY_COLORS: Record<string, string> = {
    Food: "#FF6B6B",
    Coffee: "#964B00",
    Shopping: "#4DABF7",
    Transport: "#51CF66",
    Rent: "#FCC419",
    Bills: "#FFD43B",
    Health: "#FF8787",
    Travel: "#339AF0",
    Fun: "#9775FA",
    Education: "#748FFC",
    Gifts: "#F06595",
    Invest: "#63E6BE",
    Salary: "#37B24D",
    Other: "#ADB5BD",
};

const getCategoryColor = (name: string) => CATEGORY_COLORS[name] || CATEGORY_COLORS.Other;

// --- Simple Donut Chart Component ---
const DonutChart = ({ data, size = 220, strokeWidth = 25, total, selectedCategory, onSelect }: { data: any[], size?: number, strokeWidth?: number, total: number, selectedCategory: string | null, onSelect: (cat: string) => void }) => {
    // Subtract extra margin (10) so the outer strokes don't clip against the Svg bounding box when selected
    const radius = (size - strokeWidth - 10) / 2;
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
                        const isSelected = selectedCategory === item.name;

                        return (
                            <Circle
                                key={index}
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={getCategoryColor(item.name)}
                                strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                                strokeDasharray={strokeDasharray - (isSelected ? 0 : 2)} // small gap for unselected
                                strokeDashoffset={strokeDashoffset}
                                transform={`rotate(${rotate}, ${center}, ${center})`}
                                fill="transparent"
                                onPress={() => onSelect(item.name)}
                                opacity={selectedCategory ? (isSelected ? 1 : 0.4) : 1}
                            />
                        );
                    })}
                </G>
            </Svg>
            <View className="absolute items-center justify-center">
                <View className="w-6 h-6 items-center justify-center mb-1">
                    <PieIcon size={14} color="#94a3b8" />
                </View>
                <Text className="text-gray-900 dark:text-white font-geist-b text-lg">₹{total.toLocaleString()}</Text>
                <Text className="text-gray-400 font-geist-md text-[10px] uppercase">Total Spent</Text>
            </View>
        </View>
    );
};

export default function Analytics() {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [timeRange, setTimeRange] = useState<"all" | "thismonth" | "lastmonth">("thismonth");
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
    const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const rangeTriggerRef = useRef<View>(null);

    const getDateParams = (): Record<string, string> => {
        const now = new Date();
        if (timeRange === "thismonth") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: start.toISOString() };
        } else if (timeRange === "lastmonth") {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: start.toISOString(), endDate: end.toISOString() };
        }
        // "all" = 6 months (5 previous + current)
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return { startDate: start.toISOString() };
    };

    const { data: summary, isLoading, isFetching } = useQuery<SummaryResponse>({
        queryKey: ["summary", timeRange],
        queryFn: async () => {
            const params = getDateParams();
            const res = await transactionsAPI.getSummary(params);
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const { data: allTransactionsData } = useQuery({
        queryKey: ["allTxnsForAnalytics", timeRange],
        queryFn: async () => {
            const params = getDateParams();
            const res = await transactionsAPI.getAll({ ...params, limit: "200" });
            return res.data;
        },
        placeholderData: keepPreviousData,
    });

    const { data: budgetsData } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const res = await budgetsAPI.getAll();
            return res.data;
        }
    });

    // Generate Dynamic AI Insights
    const aiInsights: { id: number, text: string, icon: any }[] = [];
    if (summary) {
        if (summary.totalExpense > summary.totalIncome && summary.totalIncome > 0) {
            aiInsights.push({ id: 1, text: "You are spending more than your income this period.", icon: AlertCircle });
        }
        if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
            aiInsights.push({ id: 2, text: `${summary.categoryBreakdown[0].name} is your highest expense category.`, icon: Flame });
        }
        if (summary.incomeCount === 0 && summary.expenseCount > 0) {
            aiInsights.push({ id: 3, text: "You haven't recorded any income this period.", icon: Sparkles });
        }
        if (aiInsights.length < 2) {
            aiInsights.push({ id: 4, text: "Your spending seems well balanced so far.", icon: TrendingUp });
        }
    }

    // --- Graph Data Processing ---
    const processedChartData = useMemo(() => {
        if (!summary?.chartData) return { labels: [], datasets: [] };

        if (timeRange === "thismonth" || timeRange === "lastmonth") {
            // Detailed daily view: ONLY show days with transactions
            const rawData = summary.chartData;
            const filteredData = rawData.filter(d => d.expense > 0);
            
            // Fallback to rawData if empty to prevent crash, but user said "only show days with txns"
            const data = filteredData.length > 0 ? filteredData : rawData;

            const labels = data.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            });
            const values = data.map(d => d.expense);
            return { labels, datasets: [{ data: values, color: "#FF6A00" }] };
        } else {
            // Group by month for "All" view (shows last 6 months)
            const monthlyData: Record<string, number> = {};
            summary.chartData.forEach(d => {
                const date = new Date(d.date);
                const monthKey = date.toLocaleDateString("en-IN", { month: "short" });
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + d.expense;
            });

            const labels = Object.keys(monthlyData);
            const values = Object.values(monthlyData);
            return { labels, datasets: [{ data: values, color: "#FF6A00" }] };
        }
    }, [summary?.chartData, timeRange]);



    const hasData = summary && summary.categoryBreakdown && summary.categoryBreakdown.length > 0;
    const topCategory = hasData 
        ? (selectedCategoryName 
            ? summary.categoryBreakdown.find(c => c.name === selectedCategoryName) || summary.categoryBreakdown[0]
            : summary.categoryBreakdown[0])
        : null;

    const budgetObj = budgetsData?.find(b => b.category === topCategory?.name);
    const budget = budgetObj ? budgetObj.amount : 0;
    const remaining = topCategory && budget > 0 ? Math.max(0, budget - topCategory.totalSpent) : 0;
    const budgetPercentage = topCategory && budget > 0 ? Math.min(100, Math.floor((topCategory.totalSpent / budget) * 100)) : 0;
    
    // Filter transactions for specific category
    const categoryTransactions = topCategory && allTransactionsData 
        ? allTransactionsData.transactions.filter(t => t.category === topCategory.name)
        : [];

    return (
        <ScrollView 
            className="flex-1 bg-[#F9FAFB] dark:bg-background-dark"
            showsVerticalScrollIndicator={false}
        >
            <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 120 }}>
                {/* Header & Loading State */}
                {isLoading && !summary ? (
                    <SkeletonLoader type="analytics" />
                ) : (
                    <>
                        {/* Header */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white text-[32px] font-geist-b">Analytics</Text>
                        </View>

                        {/* AI Insights */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-4">
                                <Text className="text-[20px]">💡</Text>
                                <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b ml-2">AI Insights</Text>
                            </View>
                            
                            {!hasData ? (
                                <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 border-dashed items-center justify-center">
                                    <Sparkles size={24} color="#d1d5db" style={{ marginBottom: 8 }} />
                                    <Text className="text-gray-400 font-geist-md text-sm text-center">
                                        Add a transaction to continue
                                    </Text>
                                </View>
                            ) : (
                                aiInsights.map((insight) => (
                                    <View key={insight.id} className="bg-white dark:bg-slate-900 rounded-3xl p-3 mb-2 shadow-sm border border-gray-50 dark:border-slate-800 flex-row items-center">
                                        <View className="w-10 h-10 items-center justify-center mr-4">
                                            <insight.icon size={20} color="#FF6A00" />
                                        </View>
                                        <Text className="flex-1 text-gray-800 dark:text-gray-200 font-geist-md text-sm leading-5">
                                            {insight.text}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Dropdown Filter */}
                        <View className="mb-8 z-[100]" ref={rangeTriggerRef}>
                            <TouchableOpacity 
                                onPress={() => {
                                    rangeTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownPosition({ top: y + height + 5, left: x });
                                        setShowRangeDropdown(true);
                                    });
                                }}
                                activeOpacity={0.9}
                                className="bg-[#FF6A00] dark:bg-slate-900 px-6 py-2.5 rounded-full flex-row items-center justify-between self-start min-w-[150px]"
                            >
                                <Text className="text-white dark:text-white font-geist-sb text-base mr-2">
                                    {timeRange === "all" ? "Last 6 Months" : (timeRange === "thismonth" ? "This Month" : "Last Month")}
                                </Text>
                                <ChevronRight size={18} color="white" style={{ transform: [{ rotate: showRangeDropdown ? '90deg' : '0deg' }] }} />
                            </TouchableOpacity>

                            {showRangeDropdown && (
                                <Modal
                                    transparent={true}
                                    visible={showRangeDropdown}
                                    animationType="fade"
                                    onRequestClose={() => setShowRangeDropdown(false)}
                                >
                                    <TouchableWithoutFeedback onPress={() => setShowRangeDropdown(false)}>
                                        <View className="flex-1 bg-transparent items-start">
                                            <View 
                                                style={{ top: dropdownPosition.top, left: dropdownPosition.left }} 
                                                className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-gray-100 dark:border-slate-800 p-1 z-[999] min-w-[150px]"
                                            >
                                                {[
                                                    { label: "Last 6 Months", value: "all" },
                                                    { label: "This Month", value: "thismonth" },
                                                    { label: "Last Month", value: "lastmonth" }
                                                ].map((t) => (
                                                    <TouchableOpacity
                                                        key={t.value}
                                                        onPress={() => { 
                                                            setTimeRange(t.value as any); 
                                                            setSelectedCategoryName(null);
                                                            setShowRangeDropdown(false);
                                                        }}
                                                        className={`px-6 py-2 rounded-full mb-1 flex-row items-center ${timeRange === t.value ? "bg-[#FF6A00]" : ""}`}
                                                    >
                                                        <Text className={`font-geist-sb text-base ${timeRange === t.value ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
                                                            {t.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            )}
                        </View>

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
                                    <View className="flex-row items-center justify-between mb-4">
                                        <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b">
                                            {timeRange === "all" ? "6-Month Spending Trend" : (timeRange === "thismonth" ? "This Month's Spending" : "Last Month's Spending")}
                                        </Text>
                                    </View>
                                    <View className="bg-white dark:bg-slate-900 rounded-[32px] px-4 pt-2 pb-4 shadow-sm border border-gray-50 dark:border-slate-800 items-center">
                                        <LineChart
                                            width={SCREEN_WIDTH - 48 - 32} 
                                            height={220}
                                            labels={processedChartData.labels}
                                            datasets={processedChartData.datasets}
                                            isDark={isDark}
                                            unit="₹"
                                        />
                                    </View>
                                </View>

                                {/* Spending by Category */}
                                <View className="mb-8">
                                    <Text className="text-gray-900 dark:text-white text-[20px] font-geist-b mb-6">Spending by Category</Text>
                                    
                                    <View className="items-center mb-8 mt-4">
                                        <DonutChart 
                                            data={summary?.categoryBreakdown || []} 
                                            total={summary?.totalExpense || 0}
                                            selectedCategory={selectedCategoryName}
                                            onSelect={(cat) => setSelectedCategoryName(cat === selectedCategoryName ? null : cat)}
                                        />
                                    </View>

                                    {/* Detailed Category Card */}
                                    {topCategory && (
                                        <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-gray-50 dark:border-slate-800">
                                            <View className="flex-row items-center justify-between mb-6">
                                                <View className="flex-row items-center">
                                                    <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                                                        <PieIcon size={20} color={getCategoryColor(topCategory.name)} />
                                                    </View>
                                                    <View>
                                                        <Text className="text-gray-900 dark:text-white font-geist-b text-base">{topCategory.name}</Text>
                                                        <Text className="text-gray-400 text-xs">{topCategory.count} transactions</Text>
                                                    </View>
                                                </View>
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
                                            {budget > 0 && (
                                                <View className="mb-6">
                                                    <View className="flex-row justify-between mb-2">
                                                        <Text className="text-emerald-500 font-geist-sb text-xs">₹{remaining.toLocaleString()} remaining</Text>
                                                        <Text className="text-gray-400 font-geist-sb text-xs">{budgetPercentage}%</Text>
                                                    </View>
                                                    <View className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <View 
                                                            className="h-full bg-emerald-500 rounded-full" 
                                                            style={{ width: `${budgetPercentage}%`, backgroundColor: budgetPercentage > 80 ? '#ef4444' : '#10b981' }} 
                                                        />
                                                    </View>
                                                </View>
                                            )}

                                            {/* Recent Transactions for this Category */}
                                            <View>
                                                <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-4">Recent {topCategory.name} Transactions</Text>
                                                {categoryTransactions.length > 0 ? (
                                                    <View className="gap-y-4">
                                                        {categoryTransactions.slice(0, 4).map((t, i) => {
                                                            const dateStr = new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                                            
                                                            const isEMI = t.title.toLowerCase().includes("emi");
                                                            
                                                            // Extract location from notes if it starts with "At "
                                                            let location = undefined;
                                                            if (!isEMI && t.notes && t.notes.includes("At ")) {
                                                                const parts = t.notes.split('|');
                                                                const locPart = parts.find(p => p.trim().startsWith('At '));
                                                                location = locPart ? locPart.trim().substring(3) : undefined;
                                                            }

                                                            let emiProgress = undefined;
                                                            if (isEMI && t.notes) {
                                                                const progressMatch = t.notes.match(/\d+\/\d+/);
                                                                emiProgress = progressMatch ? progressMatch[0] : undefined;
                                                            }

                                                            let splitInfo = undefined;
                                                            if (t.notes && t.notes.includes("Split:")) {
                                                                const splitPart = t.notes.split('|').find(p => p.trim().startsWith('Split:'));
                                                                if (splitPart) {
                                                                    splitInfo = splitPart.replace('Split:', '').trim();
                                                                }
                                                            }

                                                            let envInfo = undefined;
                                                            if (t.notes && t.notes.includes("EnvTitle:")) {
                                                                const envPart = t.notes.split('|').find(p => p.trim().startsWith('EnvTitle:'));
                                                                const envIconPart = t.notes.split('|').find(p => p.trim().startsWith('EnvIcon:'));
                                                                if (envPart) {
                                                                    envInfo = {
                                                                        title: envPart.replace('EnvTitle:', '').trim(),
                                                                        icon: envIconPart ? envIconPart.replace('EnvIcon:', '').trim() : '🎯'
                                                                    };
                                                                }
                                                            }

                                                            return (
                                                                <View key={t.id || i} className="flex-row justify-between items-start">
                                                                    <View className="flex-1 mr-4">
                                                                        <Text className="text-gray-900 dark:text-white font-geist-sb text-sm" numberOfLines={1}>{t.title}</Text>
                                                                        <View className="flex-row items-center mt-0.5">
                                                                            <Text className="text-gray-400 text-[10px]" numberOfLines={1}>
                                                                                {dateStr} {location ? ` •  ${location}` : ""} {emiProgress ? ` •  Installment ${emiProgress}` : ""}
                                                                            </Text>
                                                                            {envInfo && (
                                                                                <View className="ml-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800 flex-row items-center">
                                                                                    <Text style={{ fontSize: 9, marginRight: 2 }}>{envInfo.icon}</Text>
                                                                                    <Text className="text-purple-600 dark:text-purple-400 text-[9px] font-geist-sb uppercase">{envInfo.title}</Text>
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                        {splitInfo && (
                                                                            <Text className="text-gray-400 dark:text-gray-400 text-[10px] mt-1 font-geist" numberOfLines={2}>
                                                                                Split: {splitInfo}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                    <Text className="text-red-500 font-geist-b text-sm">
                                                                        -₹{t.amount.toLocaleString("en-IN")}
                                                                    </Text>
                                                                </View>
                                                            );

                                                        })}
                                                    </View>
                                                ) : (
                                                    <Text className="text-gray-400 text-xs italic">No recent transactions found.</Text>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
}
