import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../providers/theme-provider";
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
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background dark:bg-background-dark"
        >
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                <View className="px-5 pt-4">
                    {/* Type Toggle */}
                    <View className="flex-row bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-1 mb-6">
                        <TouchableOpacity
                            onPress={() => setType("EXPENSE")}
                            className={`flex-1 py-3 rounded-lg items-center ${type === "EXPENSE" ? "bg-red-500" : "bg-transparent"}`}
                            activeOpacity={0.8}
                        >
                            <Text className={`font-semibold ${type === "EXPENSE" ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                                💸 Expense
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setType("INCOME")}
                            className={`flex-1 py-3 rounded-lg items-center ${type === "INCOME" ? "bg-green-500" : "bg-transparent"}`}
                            activeOpacity={0.8}
                        >
                            <Text className={`font-semibold ${type === "INCOME" ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                                💰 Income
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount */}
                    <View className="items-center mb-6">
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-sm mb-2">Amount</Text>
                        <View className="flex-row items-center">
                            <Text className="text-black dark:text-white text-3xl font-bold mr-1">₹</Text>
                            <TextInput
                                className="text-black dark:text-white text-4xl font-bold text-center min-w-[100px]"
                                placeholder="0.00"
                                placeholderTextColor={placeholderColor}
                                value={amount}
                                onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ""))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <View className="mb-4">
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-sm font-medium mb-2 ml-1">Title</Text>
                        <TextInput
                            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-black dark:text-white text-base"
                            placeholder="e.g., Grocery shopping"
                            placeholderTextColor={placeholderColor}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* Date */}
                    <View className="mb-4">
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-sm font-medium mb-2 ml-1">Date</Text>
                        <TextInput
                            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-black dark:text-white text-base"
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={placeholderColor}
                            value={date}
                            onChangeText={setDate}
                        />
                    </View>

                    {/* Notes */}
                    <View className="mb-4">
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-sm font-medium mb-2 ml-1">Notes (optional)</Text>
                        <TextInput
                            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-black dark:text-white text-base"
                            placeholder="Add a note..."
                            placeholderTextColor={placeholderColor}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Tags */}
                    {tags && tags.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-2 ml-1">Tags</Text>
                            <View className="flex-row flex-wrap">
                                {tags.map((tag) => {
                                    const isSelected = selectedTags.includes(tag.id);
                                    return (
                                        <TouchableOpacity
                                            key={tag.id}
                                            onPress={() => toggleTag(tag.id)}
                                            className={`mr-2 mb-2 px-4 py-2 rounded-xl border ${isSelected
                                                ? "border-primary dark:border-primary-dark bg-primary/20"
                                                : "border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
                                                }`}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center">
                                                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                                                <Text className={`text-sm ${isSelected ? "text-primary dark:text-primary-dark" : "text-muted-fg dark:text-muted-fg-dark"}`}>
                                                    {tag.name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={createMutation.isPending}
                        className={`rounded-xl py-4 items-center mt-2 ${createMutation.isPending ? "bg-primary/50" : "bg-primary"}`}
                        activeOpacity={0.8}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                Add {type === "INCOME" ? "Income" : "Expense"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
