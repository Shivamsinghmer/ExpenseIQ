import React, { useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, RefreshControl,
    ActivityIndicator, Alert, TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, type Transaction, type TransactionListResponse } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditCard, Search, TrendingUp, TrendingDown, X } from "lucide-react-native";

function TransactionCard({ item, onDelete, isDark }: { item: Transaction; onDelete: (id: string) => void; isDark: boolean }) {
    const isIncome = item.type === "INCOME";
    return (
        <TouchableOpacity
            className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-4 mb-3 shadow-sm"
            activeOpacity={0.7}
            onLongPress={() => {
                Alert.alert("Delete Transaction", `Are you sure you want to delete "${item.title}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
                ]);
            }}
        >
            <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isIncome ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                    {isIncome ? (
                        <TrendingUp size={20} color="#10b981" />
                    ) : (
                        <TrendingDown size={20} color="#ef4444" />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-bold text-base">{item.title}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        })}
                    </Text>
                    {item.tags.length > 0 && (
                        <View className="flex-row flex-wrap mt-2">
                            {item.tags.map((tag) => (
                                <View key={tag.id} className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-1 mr-1.5 mt-1">
                                    <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                                    <Text className="text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                <View className="items-end">
                    <Text className={`font-black text-base ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {isIncome ? "+" : "-"}₹{item.amount.toFixed(2)}
                    </Text>
                </View>
            </View>
            {item.notes && (
                <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-slate-400 text-xs italic">"{item.notes}"</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function Transactions() {
    const queryClient = useQueryClient();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const queryParams: Record<string, string> = { page: page.toString(), limit: "20" };
    if (filter !== "ALL") queryParams.type = filter;
    if (search.trim()) queryParams.search = search.trim();

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
        onError: () => { Alert.alert("Error", "Failed to delete transaction"); },
    });

    return (
        <View className="flex-1 bg-background dark:bg-background-dark">
            {/* Header Section */}
            <View
                className="bg-transparent pb-6 px-6 rounded-b-[20px] mb-6"
                style={{ paddingTop: insets.top + 20 }}
            >
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-black dark:text-white text-3xl font-bold tracking-tight">Transactions</Text>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-1 mb-4 shadow-sm">
                    <Search size={18} color={isDark ? "#94a3b8" : "#64748b"} style={{ marginRight: 8 }} />
                    <TextInput
                        className="flex-1 text-base font-medium text-slate-800 dark:text-white"
                        placeholder="Search transactions..."
                        placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                        value={search}
                        onChangeText={(val) => { setSearch(val); setPage(1); }}
                        selectionColor="black"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <X size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Tabs */}
                <View className="flex-row bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => { setFilter(f); setPage(1); }}
                                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${isActive ? "bg-black dark:bg-slate-600" : ""}`}
                                activeOpacity={0.7}
                            >
                                <Text className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`}>
                                    {f === "ALL" ? "All" : f === "INCOME" ? "Income" : "Expense"}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#000000" />
                </View>
            ) : (
                <FlatList
                    data={data?.transactions || []}
                    renderItem={({ item }) => <TransactionCard item={item} onDelete={(id) => deleteMutation.mutate(id)} isDark={isDark} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000000" />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 opacity-50">
                            <CreditCard size={30} color="gray" />
                            <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium mt-2">No transactions found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
