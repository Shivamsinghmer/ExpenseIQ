import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, KeyboardAvoidingView, Platform, 
    ScrollView, Dimensions, Image
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../providers/theme-provider";
import { aiAPI, transactionsAPI, type AIResponse } from "../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    ChevronLeft, ArrowUp, Send, Sparkles, 
    Bot, ArrowDownLeft, ArrowUpRight 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import SkeletonLoader from "../components/SkeletonLoader";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AI() {
    const router = useRouter();
    const { user } = useUser();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const flatListRef = useRef<FlatList>(null);

    // Fetch summary to check if user has data
    const { data: summary } = useQuery({
        queryKey: ["summary"],
        queryFn: async () => {
            const res = await transactionsAPI.getSummary();
            return res.data;
        },
    });

    const hasData = (summary?.expenseCount || 0) > 0;

    // Initial welcome message
    const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: hasData 
            ? `Buddy, You have ₹${summary?.totalExpense.toLocaleString("en-IN")} spent this month. Ask me anything — like "how much did I spend on food?" or "where can I save more?"`
            : "Add a transaction to continue! Once you start tracking, I can help you crunch the numbers and find ways to save. 💸",
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
            
            // Only show welcome message if no history exists
            const allMessages = history.length === 0 ? [welcomeMessage] : history;
            setMessages(allMessages);
            return history;
        },
        enabled: !!summary, // Wait for summary to know which welcome message to show
    });

    const askMutation = useMutation({
        mutationFn: async (question: string) => {
            const res = await aiAPI.ask(question);
            return res.data;
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + "-ai",
                role: "assistant",
                content: data.answer,
                timestamp: new Date(),
            }]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
        onError: (error: any) => {
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + "-error",
                role: "assistant",
                content: "Sorry, I couldn't reach my brain. Please try again later.",
                timestamp: new Date(),
            }]);
        },
    });

    const handleSend = () => {
        const question = input.trim();
        if (!question || askMutation.isPending) return;

        setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            role: "user",
            content: question,
            timestamp: new Date(),
        }]);
        setInput("");
        askMutation.mutate(question);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === "user";
        return (
            <View className={`mb-6 px-4 flex-row ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                    <Image 
                        source={require("../assets/logo.png")} 
                        className="w-8 h-8 rounded-full mr-2 self-start mt-1"
                        resizeMode="cover"
                    />
                )}
                <View
                    style={{ maxWidth: isUser ? "75%" : "85%" }}
                    className={`rounded-[24px] px-5 py-3.5 ${
                        isUser 
                        ? "bg-[#FF6A00] rounded-tr-none" 
                        : "bg-white dark:bg-slate-800 shadow-sm rounded-tl-none"
                    }`}
                >
                    <Text className={`text-base leading-6 font-geist-md ${
                        isUser ? "text-white" : "text-gray-800 dark:text-gray-100"
                    }`}>
                        {item.content}
                    </Text>
                    <Text className={`text-[10px] mt-1.5 ${
                        isUser ? "text-white/60 text-right" : "text-gray-400"
                    }`}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                {isUser && (
                    <Image 
                        source={{ uri: user?.imageUrl }} 
                        className="w-8 h-8 rounded-full ml-2 self-start mt-1 border border-gray-200 dark:border-slate-700" 
                    />
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-background-dark">
            {/* Custom Header */}
            <View 
                style={{ paddingTop: insets.top + 10 }}
                className="bg-white dark:bg-slate-900 px-6 pb-4 border-b border-gray-50 dark:border-slate-800 flex-row items-center"
            >
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center"
                >
                    <ChevronLeft size={24} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                <View className="flex-1 items-center mr-10">
                    <Text className="text-gray-900 dark:text-white font-geist-b text-lg">Ask Your Money</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {isLoadingHistory || !summary ? (
                    <SkeletonLoader type="list" />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            askMutation.isPending ? (
                                <View className="flex-row items-center ml-14 mb-4">
                                    <View className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 flex-row items-center shadow-sm">
                                        <ActivityIndicator size="small" color="#FF6A00" />
                                        <Text className="text-gray-400 text-xs font-geist-md ml-2">Crunching data...</Text>
                                    </View>
                                </View>
                            ) : null
                        }
                    />
                )}

                {/* Input Bar */}
                <View className="px-5 pb-8 pt-4 bg-[#F9FAFB] dark:bg-background-dark border-t border-gray-50 dark:border-slate-800">
                    <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-full p-2 pl-6 shadow-sm border border-gray-100 dark:border-slate-800">
                        <TextInput
                            className="flex-1 py-2 text-gray-800 dark:text-white font-geist-md text-base"
                            placeholder="Ask about your spending..."
                            placeholderTextColor="#94a3b8"
                            value={input}
                            onChangeText={setInput}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity 
                            onPress={handleSend}
                            disabled={!input.trim() || askMutation.isPending}
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                                input.trim() ? "bg-[#FF6A00]" : "bg-gray-100"
                            }`}
                        >
                            <ArrowUp size={20} color={input.trim() ? "white" : "#94a3b8"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
