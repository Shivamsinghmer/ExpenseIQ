import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
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
            <View className={`mb-4 mx-4 flex-row ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                    <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 items-center justify-center mr-2 self-end mb-1">
                        <Text className="text-sm">🤖</Text>
                    </View>
                )}
                <View
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${isUser
                        ? "bg-indigo-600 rounded-br-sm"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm"
                        }`}
                >
                    <Text className={`text-base leading-6 ${isUser ? "text-white font-medium" : "text-slate-800 dark:text-slate-100"}`}>
                        {item.content}
                    </Text>
                    {item.dataContext && (
                        <View className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <Text className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                📊 Analysis • {item.dataContext.transactionCount} transactions
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-slate-50 dark:bg-slate-900"
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View className="flex-row justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <View>
                    <Text className="text-lg font-black text-slate-800 dark:text-white">AI Assistant</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ask about your finances</Text>
                </View>
                <TouchableOpacity
                    onPress={confirmReset}
                    className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                    activeOpacity={0.7}
                >
                    <Text className="text-lg">🧹</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    askMutation.isPending ? (
                        <View className="flex-row items-center ml-14 mb-4">
                            <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex-row items-center shadow-sm">
                                <ActivityIndicator size="small" color="#6366f1" />
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium ml-2">Thinking...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {messages.length <= 1 && (
                <View className="px-6 pb-4">
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 ml-1">Suggestions</Text>
                    <View className="flex-row flex-wrap">
                        {SUGGESTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => handleSend(s)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 mr-2 mb-2 shadow-sm active:bg-slate-50"
                                activeOpacity={0.7}
                            >
                                <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Input */}
            <View className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-8">
                <View className="flex-row items-end bg-slate-100 dark:bg-slate-800 rounded-[24px] p-1.5 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 transition-colors">
                    <TextInput
                        className="flex-1 px-4 py-3 text-slate-800 dark:text-white text-base max-h-[120px]"
                        placeholder="Type a message..."
                        placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
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
                        className={`w-10 h-10 rounded-full items-center justify-center mb-1 mr-1 ${input.trim() && !askMutation.isPending ? "bg-indigo-600 shadow-md shadow-indigo-200" : "bg-slate-300 dark:bg-slate-700"}`}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-lg font-bold">↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
