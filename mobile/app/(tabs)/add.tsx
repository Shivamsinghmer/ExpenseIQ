import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import {
    transactionsAPI,
    tagsAPI,
    type Tag,
    type CreateTransactionData,
} from "../../services/api";

export default function AddTransaction() {
    const queryClient = useQueryClient();
    const { isDark } = useTheme();
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [notes, setNotes] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const { data: tags } = useQuery<Tag[]>({
        queryKey: ["tags"],
        queryFn: async () => {
            const res = await tagsAPI.getAll();
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateTransactionData) => transactionsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            resetForm();
            Alert.alert("Success", "Transaction added successfully!");
        },
        onError: (error: any) => {
            Alert.alert("Error", error.response?.data?.error || "Failed to add transaction");
        },
    });

    const resetForm = () => {
        setTitle("");
        setAmount("");
        setNotes("");
        setSelectedTags([]);
        setDate(new Date().toISOString().split("T")[0]);
    };

    const handleSubmit = () => {
        if (!title.trim()) { Alert.alert("Error", "Please enter a title"); return; }
        if (!amount || parseFloat(amount) <= 0) { Alert.alert("Error", "Please enter a valid amount"); return; }
        createMutation.mutate({
            title: title.trim(),
            amount: parseFloat(amount),
            type,
            notes: notes.trim() || undefined,
            date: new Date(date).toISOString(),
            tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        });
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    const placeholderColor = isDark ? "#666666" : "#999999";

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <KeyboardAwareScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
                style={{ flex: 1 }}
            >
                <View className="px-6 pt-6">
                    {/* Header Card */}
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-700 mb-6">
                        <Text className="text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">
                            Transaction Type
                        </Text>
                        <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
                            <TouchableOpacity
                                onPress={() => setType("EXPENSE")}
                                className="flex-1 py-3.5 rounded-xl items-center flex-row justify-center"
                                style={type === "EXPENSE" ? {
                                    backgroundColor: isDark ? "#334155" : "#ffffff",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 1,
                                } : {}}
                                activeOpacity={0.7}
                            >
                                <Text className="mr-2 text-lg">💸</Text>
                                <Text
                                    className="font-bold text-sm"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#ffffff" : "#1e293b") : (isDark ? "#64748b" : "#94a3b8") }}
                                >
                                    Expense
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setType("INCOME")}
                                className="flex-1 py-3.5 rounded-xl items-center flex-row justify-center"
                                style={type === "INCOME" ? {
                                    backgroundColor: isDark ? "#334155" : "#ffffff",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 1,
                                } : {}}
                                activeOpacity={0.7}
                            >
                                <Text className="mr-2 text-lg">💰</Text>
                                <Text
                                    className="font-bold text-sm"
                                    style={{ color: type === "INCOME" ? (isDark ? "#ffffff" : "#1e293b") : (isDark ? "#64748b" : "#94a3b8") }}
                                >
                                    Income
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="items-center mt-8 mb-4">
                            <Text className="text-slate-400 dark:text-slate-500 font-medium text-sm mb-2">Amount</Text>
                            <View className="flex-row items-center justify-center">
                                <Text
                                    className="text-4xl font-black mr-1"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#ffffff" : "#1e293b") : "#10b981" }}
                                >₹</Text>
                                <TextInput
                                    className="text-5xl font-black text-center min-w-[100px]"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#ffffff" : "#1e293b") : "#10b981" }}
                                    placeholder="0"
                                    placeholderTextColor={isDark ? "#475569" : "#cbd5e1"}
                                    value={amount}
                                    onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ""))}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Details Form */}
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-700">
                        {/* Title */}
                        <View className="mb-6">
                            <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Title</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white text-base font-medium focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                placeholder="What is this for?"
                                placeholderTextColor={placeholderColor}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Date */}
                        <View className="mb-6">
                            <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Date</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white text-base font-medium"
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={placeholderColor}
                                value={date}
                                onChangeText={setDate}
                            />
                        </View>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mb-3 ml-1">Tags</Text>
                                <View className="flex-row flex-wrap">
                                    {tags.map((tag) => {
                                        const isSelected = selectedTags.includes(tag.id);
                                        return (
                                            <TouchableOpacity
                                                key={tag.id}
                                                onPress={() => toggleTag(tag.id)}
                                                className="mr-2 mb-2 px-4 py-2.5 rounded-xl border-2"
                                                style={{
                                                    borderColor: isSelected ? "#6366f1" : (isDark ? "#334155" : "#e2e8f0"),
                                                    backgroundColor: isSelected ? (isDark ? "rgba(99,102,241,0.2)" : "#eef2ff") : "transparent",
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View className="flex-row items-center">
                                                    <View
                                                        className="w-2 h-2 rounded-full mr-2"
                                                        style={{ backgroundColor: isSelected ? "#6366f1" : tag.color }}
                                                    />
                                                    <Text
                                                        className="text-xs font-bold"
                                                        style={{ color: isSelected ? (isDark ? "#a5b4fc" : "#4338ca") : (isDark ? "#94a3b8" : "#475569") }}
                                                    >
                                                        {tag.name}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Notes */}
                        <View className="mb-6">
                            <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Notes</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white text-base font-medium h-32"
                                placeholder="Add any additional details..."
                                placeholderTextColor={placeholderColor}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={createMutation.isPending}
                            className="rounded-2xl py-5 items-center shadow-lg shadow-indigo-500/30"
                            style={{ backgroundColor: createMutation.isPending ? "#e2e8f0" : "#6366f1" }}
                            activeOpacity={0.9}
                        >
                            {createMutation.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-lg">
                                    Save Transaction
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}
