import React, { useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, RefreshControl,
    ActivityIndicator, Alert, TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, type Transaction, type TransactionListResponse } from "../../services/api";

function TransactionCard({ item, onDelete }: { item: Transaction; onDelete: (id: string) => void }) {
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
                    <Text className="text-xl">{isIncome ? "💰" : "💳"}</Text>
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
            {/* Search & Filter Container */}
            <View className="px-5 pt-4 pb-4 bg-background dark:bg-background-dark z-10">
                <View className="flex-row items-center bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl px-4 py-3 mb-4 shadow-sm">
                    <Text className="text-lg mr-2">🔍</Text>
                    <TextInput
                        className="flex-1 text-base text-slate-900 dark:text-white font-medium"
                        placeholder="Search transactions..."
                        placeholderTextColor={isDark ? "#94a3b8" : "#cbd5e1"}
                        value={search}
                        onChangeText={(val) => { setSearch(val); setPage(1); }}
                        selectionColor="#6366f1"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Text className="text-slate-400">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Tabs */}
                <View className="flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => { setFilter(f); setPage(1); }}
                                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${isActive ? "bg-white dark:bg-surface-dark shadow-sm" : ""}`}
                                activeOpacity={0.7}
                            >
                                <Text className={`text-xs font-bold ${isActive ? "text-primary dark:text-primary-dark" : "text-slate-500 dark:text-slate-400"}`}>
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
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <FlatList
                    data={data?.transactions || []}
                    renderItem={({ item }) => <TransactionCard item={item} onDelete={(id) => deleteMutation.mutate(id)} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 opacity-50">
                            <Text className="text-6xl mb-4">📭</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-base font-medium">No transactions found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
