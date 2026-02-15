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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrendingDown, TrendingUp, CalendarDays, FileText, StickyNote, Check, ChevronRight } from "lucide-react-native";

import { useRouter } from "expo-router";

export default function AddTransaction() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
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
            if (error.response?.status === 403 && error.response?.data?.message?.includes("Trial expired")) {
                Alert.alert(
                    "Trial Expired",
                    "Your free trial has ended. Upgrade to Pro to continue using all features.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Upgrade", onPress: () => router.push("/subscription") }
                    ]
                );
            } else {
                Alert.alert("Error", error.response?.data?.error || "Failed to add transaction");
            }
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

    const placeholderColor = isDark ? "#64748b" : "#94a3b8";

    return (
        <View className="flex-1 bg-background dark:bg-background-dark">
            <KeyboardAwareScrollView
                contentContainerStyle={{ paddingBottom: 150 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === "ios" ? 40 : 120}
                style={{ flex: 1 }}
            >
                {/* Header Section */}
                <View
                    className="bg-transparent pb-4 px-6 rounded-b-[20px]"
                    style={{ paddingTop: insets.top + 20 }}
                >
                    <Text className="text-black dark:text-white text-3xl font-black tracking-tight mb-1">New Transaction</Text>
                    <Text className="text-black/50 dark:text-white/50 text-base font-semibold">Track your spending effortlessly</Text>
                </View>

                <View className="px-6 mt-4">
                    {/* Amount & Type Card */}
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                        <View className="items-center mb-8">
                            <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[2px] text-[10px] mb-4">Enter Amount</Text>
                            <View className="flex-row items-center justify-center">
                                <Text
                                    className="text-4xl font-black mr-2"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#fca5a5" : "#1e293b") : "#10b981" }}
                                >₹</Text>
                                <TextInput
                                    className="text-6xl font-black text-center min-w-[120px]"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#ffffff" : "#1e293b") : "#10b981" }}
                                    placeholder="0"
                                    placeholderTextColor={isDark ? "#334155" : "#cbd5e1"}
                                    value={amount}
                                    onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ""))}
                                    keyboardType="decimal-pad"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
                            <TouchableOpacity
                                onPress={() => setType("EXPENSE")}
                                className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
                                style={type === "EXPENSE" ? {
                                    backgroundColor: isDark ? "#334155" : "#ffffff",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                } : {}}
                                activeOpacity={0.7}
                            >
                                <TrendingDown size={18} color={type === "EXPENSE" ? "#ef4444" : (isDark ? "#475569" : "#94a3b8")} />
                                <Text
                                    className="font-bold text-sm ml-2"
                                    style={{ color: type === "EXPENSE" ? (isDark ? "#ffffff" : "#1e293b") : (isDark ? "#64748b" : "#94a3b8") }}
                                >
                                    Expense
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setType("INCOME")}
                                className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
                                style={type === "INCOME" ? {
                                    backgroundColor: isDark ? "#334155" : "#ffffff",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                } : {}}
                                activeOpacity={0.7}
                            >
                                <TrendingUp size={18} color={type === "INCOME" ? "#10b981" : (isDark ? "#475569" : "#94a3b8")} />
                                <Text
                                    className="font-bold text-sm ml-2"
                                    style={{ color: type === "INCOME" ? (isDark ? "#ffffff" : "#1e293b") : (isDark ? "#64748b" : "#94a3b8") }}
                                >
                                    Income
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Details Card */}
                    <View className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                        <Text className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[2px] text-[10px] mb-6">Transaction Details</Text>

                        {/* Title */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2.5">
                                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 items-center justify-center mr-3">
                                    <FileText size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                                </View>
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">What's it for?</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white text-base font-semibold"
                                placeholder="Coffee, Rent, Salary..."
                                placeholderTextColor={placeholderColor}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Date */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2.5">
                                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 items-center justify-center mr-3">
                                    <CalendarDays size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                                </View>
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">Transaction Date</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white text-base font-semibold"
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={placeholderColor}
                                value={date}
                                onChangeText={setDate}
                            />
                        </View>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <View className="mb-6">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 items-center justify-center mr-3">
                                        <StickyNote size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                                    </View>
                                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-base">Select Tags</Text>
                                </View>
                                <View className="flex-row flex-wrap">
                                    {tags.map((tag) => {
                                        const isSelected = selectedTags.includes(tag.id);
                                        return (
                                            <TouchableOpacity
                                                key={tag.id}
                                                onPress={() => toggleTag(tag.id)}
                                                className="mr-2 mb-2 px-4 py-2.5 rounded-xl border-2"
                                                style={{
                                                    borderColor: isSelected ? (isDark ? "#ffffff" : "#000000") : (isDark ? "#334155" : "#f1f5f9"),
                                                    backgroundColor: isSelected ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") : "transparent",
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View className="flex-row items-center">
                                                    {isSelected ? (
                                                        <Check size={14} color={isDark ? "#fff" : "#000"} className="mr-2" />
                                                    ) : (
                                                        <View
                                                            className="w-3 h-3 rounded-full mr-2 shadow-sm"
                                                            style={{ backgroundColor: tag.color }}
                                                        />
                                                    )}
                                                    <Text
                                                        className="text-xs font-bold"
                                                        style={{ color: isSelected ? (isDark ? "#ffffff" : "#000000") : (isDark ? "#64748b" : "#94a3b8") }}
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

                        {/* Summary View (Pre-Submit) */}
                        <View className="mt-0 pt-6 border-t border-slate-100 dark:border-slate-700">
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={createMutation.isPending}
                                className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg ${createMutation.isPending ? "bg-slate-200" : "bg-black shadow-black/20"}`}
                                activeOpacity={0.9}
                            >
                                {createMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text className="text-white font-semibold text-md tracking-widest">Save Transaction</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}
