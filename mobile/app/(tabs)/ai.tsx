import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "../providers/theme-provider";
import { aiAPI, type AIResponse } from "../../services/api";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    dataContext?: AIResponse["dataContext"];
}

const SUGGESTIONS = [
    "How much did I spend this month?",
    "Show my income vs expenses",
    "Which tag has the highest expenses?",
    "What's my balance this year?",
    "What was my biggest expense?",
    "Show spending breakdown by tags",
];

export default function AIChatbot() {
    const { isDark } = useTheme();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "👋 Hi! I'm your AI financial assistant. Ask me anything about your finances!\n\nI can help with:\n• Spending summaries\n• Income vs expense comparisons\n• Tag-based analysis\n• Monthly/yearly breakdowns",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const flatListRef = useRef<FlatList>(null);

    const askMutation = useMutation({
        mutationFn: async (question: string) => { const res = await aiAPI.ask(question); return res.data; },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + "-ai", role: "assistant",
                content: data.answer, timestamp: new Date(), dataContext: data.dataContext,
            }]);
        },
        onError: (error: any) => {
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + "-error", role: "assistant",
                content: error.response?.data?.error || "Sorry, I couldn't process your question. Please try again.",
                timestamp: new Date(),
            }]);
        },
    });

    const handleSend = (text?: string) => {
        const question = (text || input).trim();
        if (!question || askMutation.isPending) return;
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: question, timestamp: new Date() }]);
        setInput("");
        askMutation.mutate(question);
        setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    };

    const confirmReset = () => {
        Alert.alert(
            "Start New Chat",
            "Are you sure you want to clear the current conversation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "New Chat",
                    style: "destructive",
                    onPress: () => {
                        setMessages([
                            {
                                id: "welcome",
                                role: "assistant",
                                content: "👋 Hi! I'm your AI financial assistant. Ask me anything about your finances!\n\nI can help with:\n• Spending summaries\n• Income vs expense comparisons\n• Tag-based analysis\n• Monthly/yearly breakdowns",
                                timestamp: new Date(),
                            },
                        ]);
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === "user";
        return (
            <View className={`mb-3 px-5 ${isUser ? "items-end" : "items-start"}`}>
                <View
                    className={`max-w-[85%] rounded-2xl p-4 ${isUser
                        ? "bg-primary rounded-br-none"
                        : "bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-bl-none"
                        }`}
                >
                    {!isUser && (
                        <View className="flex-row items-center mb-2">
                            <Text className="text-sm mr-1.5">🤖</Text>
                            <Text className="text-primary dark:text-primary-lt text-xs font-bold">ExpenseIQ AI</Text>
                        </View>
                    )}
                    <Text className={`text-sm leading-5 ${isUser ? "text-white" : "text-black dark:text-white"}`}>
                        {item.content}
                    </Text>
                    {item.dataContext && (
                        <View className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                            <Text className="text-neutral-500 dark:text-neutral-400 text-[10px]">
                                📊 Based on {item.dataContext.transactionCount} transactions
                                {item.dataContext.dateRange.from !== "all time" &&
                                    ` • ${item.dataContext.dateRange.from.split("T")[0]} to ${item.dataContext.dateRange.to.split("T")[0]}`}
                            </Text>
                        </View>
                    )}
                    <Text className={`text-[10px] mt-1.5 ${isUser ? "text-white/60" : "text-neutral-400"}`}>
                        {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white dark:bg-black"
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View className="flex-row justify-end px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <TouchableOpacity
                    onPress={confirmReset}
                    className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-full flex-row items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-xs font-semibold text-black dark:text-white mr-1">✨ New Chat</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    askMutation.isPending ? (
                        <View className="items-start px-5 mb-3">
                            <View className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-2xl rounded-bl-none p-4">
                                <View className="flex-row items-center">
                                    <ActivityIndicator size="small" color={isDark ? "#ff6666" : "#ff3333"} />
                                    <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-2">Analyzing your data...</Text>
                                </View>
                            </View>
                        </View>
                    ) : null
                }
            />

            {messages.length <= 2 && (
                <View className="px-5 pb-2">
                    <FlatList
                        horizontal
                        data={SUGGESTIONS}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSend(item)}
                                className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl px-4 py-2 mr-2"
                                activeOpacity={0.7}
                            >
                                <Text className="text-neutral-500 dark:text-neutral-400 text-xs">{item}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            )}

            {/* Input */}
            <View className="border-t border-neutral-200 dark:border-neutral-600 px-5 py-3 bg-neutral-50 dark:bg-neutral-700">
                <View className="flex-row items-end">
                    <TextInput
                        className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl px-4 py-3 text-black dark:text-white text-sm mr-3 max-h-[100px]"
                        placeholder="Ask about your finances..."
                        placeholderTextColor={isDark ? "#666666" : "#999999"}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={() => handleSend()}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        onPress={() => handleSend()}
                        disabled={!input.trim() || askMutation.isPending}
                        className={`w-11 h-11 rounded-xl items-center justify-center ${input.trim() && !askMutation.isPending ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-600"}`}
                        activeOpacity={0.8}
                    >
                        <Text className={input.trim() && !askMutation.isPending ? "text-white text-base" : "text-neutral-400 text-base"}>↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
