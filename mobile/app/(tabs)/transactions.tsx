import React, { useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, RefreshControl,
    ActivityIndicator, Alert, TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../providers/theme-provider";
import { transactionsAPI, type Transaction, type TransactionListResponse } from "../../services/api";

function TransactionCard({ item, onDelete }: { item: Transaction; onDelete: (id: string) => void }) {
    const isIncome = item.type === "INCOME";
    return (
        <TouchableOpacity
            className="bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 mb-3 mx-5"
            activeOpacity={0.8}
            onLongPress={() => {
                Alert.alert("Delete Transaction", `Are you sure you want to delete "${item.title}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
                ]);
            }}
        >
            <View className="flex-row items-start">
                <View className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${isIncome ? "bg-success-500/15" : "bg-danger-500/15"}`}>
                    <Text className="text-xl">{isIncome ? "📈" : "📉"}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-black dark:text-white font-semibold text-sm">{item.title}</Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">
                        {new Date(item.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    {item.tags.length > 0 && (
                        <View className="flex-row flex-wrap mt-2">
                            {item.tags.map((tag) => (
                                <View key={tag.id} className="flex-row items-center bg-neutral-100 dark:bg-neutral-600 rounded-full px-2.5 py-0.5 mr-1 mb-1">
                                    <View className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
                                    <Text className="text-neutral-500 dark:text-neutral-300 text-[10px]">{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {item.notes ? <Text className="text-neutral-400 text-xs mt-1 italic">{item.notes}</Text> : null}
                </View>
                <Text className={`font-bold text-base ${isIncome ? "text-success-400" : "text-danger-400"}`}>
                    {isIncome ? "+" : "-"}₹{item.amount.toFixed(2)}
                </Text>
            </View>
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
        <View className="flex-1 bg-white dark:bg-black">
            {/* Search */}
            <View className="px-5 pt-3 pb-2">
                <TextInput
                    className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl px-4 py-3 text-black dark:text-white text-sm"
                    placeholder="Search transactions..."
                    placeholderTextColor={isDark ? "#666666" : "#999999"}
                    value={search}
                    onChangeText={(val) => { setSearch(val); setPage(1); }}
                />
            </View>

            {/* Filter Bar */}
            <View className="flex-row px-5 mb-3">
                {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => { setFilter(f); setPage(1); }}
                        className={`mr-2 px-4 py-2 rounded-xl ${filter === f ? "bg-primary" : "bg-neutral-100 dark:bg-neutral-700"}`}
                        activeOpacity={0.7}
                    >
                        <Text className={`text-xs font-semibold ${filter === f ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                            {f === "ALL" ? "All" : f === "INCOME" ? "💰 Income" : "💸 Expense"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={isDark ? "#ff6666" : "#ff3333"} />
                </View>
            ) : (
                <FlatList
                    data={data?.transactions || []}
                    renderItem={({ item }) => <TransactionCard item={item} onDelete={(id) => deleteMutation.mutate(id)} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={isDark ? "#ff6666" : "#ff3333"} />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-3xl mb-2">📭</Text>
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm">No transactions found</Text>
                        </View>
                    }
                    ListFooterComponent={
                        data && data.pagination.totalPages > 1 ? (
                            <View className="flex-row justify-center items-center py-4">
                                <TouchableOpacity
                                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={`px-4 py-2 rounded-xl ${page === 1 ? "bg-neutral-100 dark:bg-neutral-700" : "bg-primary"}`}
                                >
                                    <Text className={page === 1 ? "text-neutral-400 text-xs" : "text-white text-xs"}>Previous</Text>
                                </TouchableOpacity>
                                <Text className="text-neutral-500 dark:text-neutral-400 text-xs mx-4">{page} / {data.pagination.totalPages}</Text>
                                <TouchableOpacity
                                    onPress={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                                    disabled={page === data.pagination.totalPages}
                                    className={`px-4 py-2 rounded-xl ${page === data.pagination.totalPages ? "bg-neutral-100 dark:bg-neutral-700" : "bg-primary"}`}
                                >
                                    <Text className={page === data.pagination.totalPages ? "text-neutral-400 text-xs" : "text-white text-xs"}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
}
