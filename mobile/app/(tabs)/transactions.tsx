import React, { useState, useMemo } from "react";
import {
    View, Text, FlatList, TouchableOpacity, RefreshControl,
    ActivityIndicator, Alert, TextInput, ScrollView, SectionList
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, paymentsAPI, type Transaction, type TransactionListResponse } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    BadgeDollarSignIcon, Search, X, Filter, 
    ArrowUpRight, ArrowDownLeft, ChevronDown 
} from "lucide-react-native";
import { useRouter } from "expo-router";

// --- Helper: Grouping Logic ---
const groupTransactions = (transactions: Transaction[]) => {
    const months: { [key: string]: { total: number; days: { [key: string]: { total: number; data: Transaction[] } } } } = {};

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();
        
        let dayKey = "Other";
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            dayKey = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            dayKey = "Yesterday";
        } else {
            dayKey = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        }

        if (!months[monthKey]) months[monthKey] = { total: 0, days: {} };
        if (!months[monthKey].days[dayKey]) months[monthKey].days[dayKey] = { total: 0, data: [] };

        months[monthKey].days[dayKey].data.push(tx);
        // Calculate totals (treating INCOME as positive, EXPENSE as negative for month/day display)
        const amount = tx.type === "INCOME" ? tx.amount : -tx.amount;
        months[monthKey].total += amount;
        months[monthKey].days[dayKey].total += amount;
    });

    return months;
};

function TransactionItem({ item, onDelete, isExpired }: { item: Transaction; onDelete: (id: string) => void; isExpired: boolean }) {
    const isIncome = item.type === "INCOME";
    return (
        <TouchableOpacity
            className="flex-row items-center py-4 px-4 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800"
            activeOpacity={0.7}
            onLongPress={() => {
                if (isExpired) {
                    Alert.alert("Trial Expired", "Upgrade to Pro to delete transactions.");
                    return;
                }
                Alert.alert("Delete Transaction", `Are you sure you want to delete "${item.title}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
                ]);
            }}
        >
            <View className={`w-11 h-11 rounded-full items-center justify-center mr-4 ${isIncome ? "bg-emerald-50" : "bg-red-50"}`}>
                {isIncome ? (
                    <ArrowDownLeft size={20} color="#10b981" strokeWidth={2.5} />
                ) : (
                    <ArrowUpRight size={20} color="#ef4444" strokeWidth={2.5} />
                )}
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-geist-sb text-base" numberOfLines={1}>{item.title}</Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs font-geist-md mt-0.5" numberOfLines={1}>
                    {item.tags?.[0]?.name || "Other"}
                </Text>
            </View>
            <View className="items-end">
                <Text className={`font-geist-b text-[17px] ${isIncome ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{item.amount.toLocaleString("en-IN")}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function Transactions() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const queryParams: Record<string, string> = { page: page.toString(), limit: "100" }; // Increased limit for better grouping
    if (filter !== "ALL") queryParams.type = filter;
    if (search.trim()) queryParams.search = search.trim();

    const { data: subscription } = useQuery({
        queryKey: ["subscriptionStatus"],
        queryFn: async () => {
            const res = await paymentsAPI.checkStatus();
            return res.data;
        },
    });

    const { data, isLoading, refetch, isRefetching } = useQuery<TransactionListResponse>({
        queryKey: ["transactions", filter, search, page],
        queryFn: async () => { const res = await transactionsAPI.getAll(queryParams); return res.data; },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transactionsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
        },
    });

    const groupedData = useMemo(() => {
        if (!data?.transactions) return null;
        return groupTransactions(data.transactions);
    }, [data?.transactions]);

    const isExpired = !!(!subscription?.isPro && subscription?.trialEndDate && new Date() > new Date(subscription.trialEndDate));

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-background-dark">
            {/* Header */}
            <View 
                className="px-6 pb-4"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-gray-900 dark:text-white text-[32px] font-geist-b">Transactions</Text>
                    <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-full px-3 py-2 border border-gray-100 dark:border-slate-700 shadow-sm">
                        <TouchableOpacity className="mr-3">
                            <Search size={20} color={isDark ? "#94a3b8" : "#4B5563"} />
                        </TouchableOpacity>
                        <View className="w-[1px] h-4 bg-gray-200 dark:bg-slate-700 mr-3" />
                        <TouchableOpacity>
                            <Filter size={20} color={isDark ? "#94a3b8" : "#4B5563"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => { setFilter(f); setPage(1); }}
                                className={`px-5 py-2.5 rounded-full mr-2 border ${isActive ? "bg-[#FF6A00] border-[#FF6A00]" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm"}`}
                                activeOpacity={0.8}
                            >
                                <Text className={`text-sm font-geist-sb ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                    {f === "ALL" ? "All" : f === "INCOME" ? "Income" : "Expense"}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm mr-3"
                        activeOpacity={0.8}
                    >
                        <Text className="text-sm font-geist-sb text-gray-500 dark:text-gray-400">This Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm mr-3"
                        activeOpacity={0.8}
                    >
                        <Text className="text-sm font-geist-sb text-gray-500 dark:text-gray-400">Last Month</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List Content */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF6A00" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF6A00" />}
                >
                    {groupedData && Object.entries(groupedData).map(([month, monthInfo]) => (
                        <View key={month} className="mb-6">
                            {/* Month Header */}
                            <View className="flex-row items-center justify-between px-6 mb-3">
                                <Text className="text-gray-400 font-geist-b text-[13px] tracking-widest">{month}</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-400 font-geist-b text-[13px] mr-1">
                                        ₹{Math.abs(monthInfo.total).toLocaleString("en-IN")}
                                    </Text>
                                    <ChevronDown size={14} color="#9ca3af" />
                                </View>
                            </View>

                            {/* Days content */}
                            {Object.entries(monthInfo.days).map(([day, dayInfo]) => (
                                <View key={day} className="mb-4">
                                    {/* Day Header */}
                                    <View className="flex-row items-center justify-between px-6 mb-2">
                                        <Text className="text-gray-400 font-geist-md text-[13px]">{day}</Text>
                                        <Text className="text-gray-400 font-geist-md text-[13px]">
                                            ₹{Math.abs(dayInfo.total).toLocaleString("en-IN")}
                                        </Text>
                                    </View>

                                    {/* Transaction Cards Wrapper */}
                                    <View className="mx-5 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-50 dark:border-slate-800">
                                        {dayInfo.data.map((tx) => (
                                            <TransactionItem 
                                                key={tx.id} 
                                                item={tx} 
                                                onDelete={(id) => deleteMutation.mutate(id)}
                                                isExpired={isExpired}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {(!data?.transactions || data.transactions.length === 0) && (
                        <View className="items-center justify-center py-20 opacity-50">
                            <BadgeDollarSignIcon size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-base font-geist-md mt-4 text-center px-10">
                                No transactions found for the selected period
                            </Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
}
