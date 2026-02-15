import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { aiAPI, type AIResponse } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eraser, Bot, ArrowUp } from "lucide-react-native";

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

const FormattedText = ({ text, isUser, isDark }: { text: string; isUser: boolean; isDark: boolean }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <Text className={`text-base leading-6 ${isUser ? "text-white font-medium" : "text-slate-800 dark:text-slate-100"}`}>
            {parts.map((part, index) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <Text key={index} className="font-bold">
                            {part.slice(2, -2)}
                        </Text>
                    );
                }
                return part;
            })}
        </Text>
    );
};

import { useRouter } from "expo-router";

export default function AIChatbot() {
    const router = useRouter();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const flatListRef = useRef<FlatList>(null);

    // Initial welcome message
    const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: "👋 Hi! I'm your AI financial assistant. Ask me anything about your finances!\n\nI can help with:\n• Spending summaries\n• Income vs expense comparisons\n• Tag-based analysis\n• Monthly/yearly breakdowns",
        timestamp: new Date(),
    };

    // Load chat history
    const { isLoading: isLoadingHistory } = useQuery({
        queryKey: ["chatHistory"],
        queryFn: async () => {
            const res = await aiAPI.getHistory();
            const history = res.data.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
            }));
            setMessages([welcomeMessage, ...history]);
            return history;
        },
    });

    const askMutation = useMutation({
        mutationFn: async (question: string) => { const res = await aiAPI.ask(question); return res.data; },
        onSuccess: (data) => {
            console.log("AI Response received:", data);
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + "-ai", role: "assistant",
                content: data.answer, timestamp: new Date(), dataContext: data.dataContext,
            }]);
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
                // Also optionally add a message to chat
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + "-error", role: "assistant",
                    content: "Trial expired. Please upgrade to Pro to continue chatting.",
                    timestamp: new Date(),
                }]);
            } else {
                console.error("AI Mutation Error:", error);
                console.error("Error Response:", error.response?.data);
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + "-error", role: "assistant",
                    content: error.response?.data?.error || "Sorry, I couldn't process your question. Please try again.",
                    timestamp: new Date(),
                }]);
            }
        },
    });

    const handleSend = (text?: string) => {
        const question = (text || input).trim();
        if (!question || askMutation.isPending) return;
        console.log("Sending question to AI:", question);
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: question, timestamp: new Date() }]);
        setInput("");
        askMutation.mutate(question);
        setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    };

    const clearMutation = useMutation({
        mutationFn: () => aiAPI.clearHistory(),
        onSuccess: () => {
            setMessages([welcomeMessage]);
            queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
        },
    });

    const confirmReset = () => {
        Alert.alert(
            "Start New Chat",
            "Are you sure you want to clear the current conversation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "New Chat",
                    style: "destructive",
                    onPress: () => clearMutation.mutate(),
                },
            ]
        );
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === "user";
        return (
            <View className={`mb-4 mx-4 flex-row ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                    <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-2 self-end mb-1">
                        <Bot size={16} color={isDark ? "#94a3b8" : "#334155"} />
                    </View>
                )}
                <View
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${isUser
                        ? "bg-black rounded-br-sm"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm"
                        }`}
                >
                    <FormattedText text={item.content} isUser={isUser} isDark={isDark} />
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
            className="flex-1 bg-background dark:bg-background-dark"
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {/* Header Section */}
            <View
                className="bg-transparent pb-6 px-6 rounded-b-[20px] mb-6"
                style={{ paddingTop: insets.top + 20 }}
            >
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-black dark:text-white text-3xl font-bold tracking-tight">AI Assistant</Text>
                        <Text className="text-black/60 dark:text-white/60 text-md font-medium mt-1">Ask about your finances</Text>
                    </View>
                    <TouchableOpacity
                        onPress={confirmReset}
                        className="bg-black/10 dark:bg-white/20 p-2.5 rounded-full"
                        activeOpacity={0.7}
                    >
                        <Eraser size={20} color={isDark ? "#ffffff" : "#000000"} />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoadingHistory ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={isDark ? "#818cf8" : "#4f46e5"} />
                    <Text className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Loading conversation...</Text>
                </View>
            ) : (
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
                                    <ActivityIndicator size="small" color={isDark ? "white" : "black"} />
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium ml-2">Thinking...</Text>
                                </View>
                            </View>
                        ) : null
                    }
                />
            )}

            {messages.length <= 1 && (
                <View className="pb-4">
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 ml-6">Suggestions</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                        {SUGGESTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => handleSend(s)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 mr-2 shadow-sm active:bg-slate-50"
                                activeOpacity={0.7}
                            >
                                <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Input */}
            <View className="px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-28">
                <View className="flex-row items-end bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700">
                    <TextInput
                        className="flex-1 px-4 py-3 text-slate-800 dark:text-white text-base max-h-[120px]"
                        placeholder="Ask anything..."
                        placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        onPress={() => handleSend()}
                        disabled={!input.trim() || askMutation.isPending}
                        className={`w-10 h-10 rounded-full items-center justify-center mb-1 mr-1 ${input.trim() && !askMutation.isPending ? "bg-black" : "bg-slate-300 dark:bg-slate-700"}`}
                        activeOpacity={0.8}
                    >
                        <ArrowUp size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
