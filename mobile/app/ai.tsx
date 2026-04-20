import React, { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, KeyboardAvoidingView, Platform, 
    ScrollView, Dimensions, Image, Animated
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

    const TypingIndicator = () => {
        const dot1 = useRef(new Animated.Value(0)).current;
        const dot2 = useRef(new Animated.Value(0)).current;
        const dot3 = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            const animate = (val: Animated.Value, delay: number) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(val, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(val, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            };

            animate(dot1, 0);
            animate(dot2, 200);
            animate(dot3, 400);
        }, []);

        const dotStyle = (val: Animated.Value) => ({
            transform: [
                {
                    translateY: val.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                    }),
                },
            ],
        });

        return (
            <View className="flex-row items-center space-x-1.5 px-1 py-1">
                <Animated.View style={[dotStyle(dot1)]} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <Animated.View style={[dotStyle(dot2)]} className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1" />
                <Animated.View style={[dotStyle(dot3)]} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            </View>
        );
    };

    // Parses inline **bold** markers within a single line of text
    const renderInlineFormatting = (text: string, isUser: boolean, keyPrefix: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const boldText = part.slice(2, -2);
                return (
                    <Text
                        key={`${keyPrefix}-b-${i}`}
                        className={`font-geist-sb ${isUser ? "text-white" : "text-gray-900 dark:text-white"}`}
                    >
                        {boldText}
                    </Text>
                );
            }
            return <Text key={`${keyPrefix}-t-${i}`}>{part}</Text>;
        });
    };

    // Parses full message content: handles bullet lines (- ), headers (###), and inline **bold**
    const renderFormattedContent = (content: string, isUser: boolean) => {
        // Filter out horizontal rules (---) and remove empty paragraph spacing by filtering whitespace-only lines
        const lines = content.split("\n").filter(l => l.trim() !== "" && l.trim() !== "---");
        
        return lines.map((line, lineIdx) => {
            const trimmed = line.trim();

            // Header line (###)
            if (trimmed.startsWith("###")) {
                const headerText = trimmed.replace(/^###\s*/, "");
                return (
                    <Text
                        key={`line-${lineIdx}`}
                        className={`text-base font-geist-sb mt-5 mb-1 ${
                            isUser ? "text-white" : "text-gray-900 dark:text-white"
                        }`}
                    >
                        {renderInlineFormatting(headerText, isUser, `line-${lineIdx}`)}
                    </Text>
                );
            }

            // Bullet point line
            if (trimmed.startsWith("- ")) {
                const bulletText = trimmed.slice(2);
                return (
                    <View key={`line-${lineIdx}`} className="flex-row mb-2">
                        <Text className={`text-base mr-2 ${isUser ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>
                            •
                        </Text>
                        <Text
                            style={{ lineHeight: 22 }}
                            className={`text-base font-geist-md leading-5 flex-1 ${
                                isUser ? "text-white" : "text-gray-800 dark:text-gray-100"
                            }`}
                        >
                            {renderInlineFormatting(bulletText, isUser, `line-${lineIdx}`)}
                        </Text>
                    </View>
                );
            }

            // Normal line with possible inline bold
            const startsWithBold = trimmed.startsWith("**");
            return (
                <Text
                    key={`line-${lineIdx}`}
                    style={{ lineHeight: 22 }}
                    className={`text-base font-geist-md mb-2 ${startsWithBold ? "mt-3" : ""} ${
                        isUser ? "text-white" : "text-gray-800 dark:text-gray-100"
                    }`}
                >
                    {renderInlineFormatting(line, isUser, `line-${lineIdx}`)}
                    {lineIdx < lines.length - 1 ? "\n" : ""}
                </Text>
            );
        });
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
                    <View>
                        {renderFormattedContent(item.content, isUser)}
                    </View>
                    <Text className={`text-[10px] ${
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
                                    <View className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-3 shadow-sm">
                                        <TypingIndicator />
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
