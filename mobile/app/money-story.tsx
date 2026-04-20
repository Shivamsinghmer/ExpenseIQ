import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
    Pressable,
    StatusBar,
    Share,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Flame, 
    TrendingUp, 
    TrendingDown, 
    ArrowUpRight, 
    ArrowDownLeft,
    Trophy,
    ShoppingBag,
    Utensils,
    Zap,
    Heart,
    Star,
    Sparkles,
    Share2,
} from "lucide-react-native";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    Easing, 
    runOnJS,
    withSequence,
    withDelay,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 seconds per card

const STORY_COLORS = [
    ["#FF6A00", "#FFC700"], // Orange-Yellow
    ["#00C6FF", "#0072FF"], // Blue
    ["#F093FB", "#F5576C"], // Pink-Red
    ["#43E97B", "#38F9D7"], // Green
    ["#111827", "#374151"], // Dark
];

export default function MoneyStory() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const progress = useSharedValue(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { data: summary, isLoading } = useQuery({
        queryKey: ["transactions-summary"],
        queryFn: () => transactionsAPI.getSummary().then(res => res.data),
    });

    const storyData = useMemo(() => {
        if (!summary) return null;

        const topTag = summary.categoryBreakdown?.[0];
        
        // Calculate top merchant
        const merchantCounts: Record<string, { count: number, amount: number }> = {};
        summary.recentTransactions.forEach(t => {
            if (t.type === "EXPENSE") {
                merchantCounts[t.title] = {
                    count: (merchantCounts[t.title]?.count || 0) + 1,
                    amount: (merchantCounts[t.title]?.amount || 0) + t.amount,
                };
            }
        });

        const topMerchant = Object.entries(merchantCounts)
            .sort((a, b) => b[1].amount - a[1].amount)[0];

        return {
            totalExpense: summary.totalExpense,
            totalIncome: summary.totalIncome,
            balance: summary.balance,
            topCategory: topTag?.name || "None",
            topCategoryAmount: topTag?.totalSpent || 0,
            topMerchant: topMerchant ? topMerchant[0] : "Various Places",
            topMerchantAmount: topMerchant ? topMerchant[1].amount : 0,
            daysActive: 7, // Mocked for now, could be dynamic
        };
    }, [summary]);

    const activeIndex = useSharedValue(0);

    const startStory = (index: number) => {
        progress.value = 0;
        activeIndex.value = index;
        if (timerRef.current) clearInterval(timerRef.current);
        
        progress.value = withTiming(1, {
            duration: STORY_DURATION,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                runOnJS(nextStory)();
            }
        });
    };

    const nextStory = () => {
        if (currentIndex < 4) {
            setCurrentIndex(prev => prev + 1);
        } else {
            router.back();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            // Optional: restart current story
            startStory(0);
        }
    };

    useEffect(() => {
        if (storyData) {
            startStory(currentIndex);
        }
    }, [currentIndex, storyData]);

    const handlePressIn = () => {
        // Pause by cancelling animation at current value
        progress.value = progress.value;
    };

    const handlePressOut = (e: any) => {
        const { locationX } = e.nativeEvent;
        if (locationX < width / 3) {
            prevStory();
        } else {
            nextStory();
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my Financial Wrapped on ExpensePal! I spent ₹${storyData?.totalExpense.toLocaleString()} this month. 📈`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    if (isLoading || !storyData) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#FF6A00" size="large" />
                <Text className="text-white mt-4 font-geist-md">Generating your story...</Text>
            </View>
        );
    }

    if (storyData.totalExpense === 0 && storyData.totalIncome === 0) {
        return (
            <View className="flex-1 bg-black items-center justify-center px-10">
                <StatusBar barStyle="light-content" />
                <View className="w-20 h-20 rounded-3xl bg-white/10 items-center justify-center mb-8 border border-white/20">
                    <Sparkles size={40} color="white" />
                </View>
                <Text className="text-white text-2xl font-geist-b text-center mb-4">No Story Yet!</Text>
                <Text className="text-white/60 text-center font-geist-md leading-6 mb-10">
                    Track some expenses and income this month to see your Financial Wrapped here!
                </Text>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="bg-[#FF6A00] px-8 py-3.5 rounded-full"
                >
                    <Text className="text-white font-geist-sb">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const cards = [
        // Card 1: The Big Picture
        <View key={0} className="flex-1 items-center justify-center px-10">
            <Animated.View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-10 border border-white/30 backdrop-blur-md">
                <Sparkles size={48} color="white" />
            </Animated.View>
            <Text className="text-white/80 text-lg font-geist-md mb-2">The Big Picture</Text>
            <Text className="text-white text-4xl font-geist-b text-center mb-10">Your month in a nutshell.</Text>
            
            <View className="w-full gap-4">
                <View className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
                    <Text className="text-white/60 text-xs font-geist-sb uppercase mb-1">Total Gone</Text>
                    <Text className="text-white text-3xl font-geist-b">₹{storyData.totalExpense.toLocaleString()}</Text>
                    <View className="flex-row items-center mt-2">
                        <ArrowUpRight size={14} color="#FFD1B3" />
                        <Text className="text-[#FFD1B3] text-xs font-geist-md ml-1">Spending was active!</Text>
                    </View>
                </View>
                
                <View className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
                    <Text className="text-white/60 text-xs font-geist-sb uppercase mb-1">Total Earned</Text>
                    <Text className="text-white text-3xl font-geist-b">₹{storyData.totalIncome.toLocaleString()}</Text>
                    <View className="flex-row items-center mt-2">
                        <ArrowDownLeft size={14} color="#BAFFD1" />
                        <Text className="text-[#BAFFD1] text-xs font-geist-md ml-1">Keep growing!</Text>
                    </View>
                </View>
            </View>
        </View>,

        // Card 2: Category Soulmate
        <View key={1} className="flex-1 items-center justify-center px-10">
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-10 border border-white/30">
                <Heart size={48} color="white" />
            </View>
            <Text className="text-white/80 text-lg font-geist-md mb-2">Your Category Soulmate</Text>
            <Text className="text-white text-4xl font-geist-b text-center mb-6">You're a true {storyData.topCategory === 'Food' ? 'Foodie' : storyData.topCategory}!</Text>
            
            <View className="bg-white/10 backdrop-blur-lg p-10 rounded-full border border-white/20 items-center">
                <Text className="text-white/60 text-xs font-geist-sb uppercase mb-2">Top Spend</Text>
                <Text className="text-white text-5xl font-geist-b">₹{storyData.topCategoryAmount.toLocaleString()}</Text>
                <Text className="text-white/80 text-sm font-geist-md mt-4">{storyData.topCategory}</Text>
            </View>
            
            <Text className="text-white/50 text-center mt-12 font-geist-md italic">
                "Life is too short to skip this category, right?"
            </Text>
        </View>,

        // Card 3: Top Merchant
        <View key={2} className="flex-1 items-center justify-center px-10">
            <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-10 border border-white/30 rotate-12">
                <ShoppingBag size={48} color="white" />
            </View>
            <Text className="text-white/80 text-lg font-geist-md mb-2">Your Favorite Destination</Text>
            <Text className="text-white text-4xl font-geist-b text-center mb-4">You and {storyData.topMerchant} had a moment.</Text>
            
            <View className="w-full bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 items-center">
                <Text className="text-white/60 text-xs font-geist-sb uppercase mb-2">Total Contributed</Text>
                <Text className="text-white text-4xl font-geist-b">₹{storyData.topMerchantAmount.toLocaleString()}</Text>
                <View className="h-px w-full bg-white/10 my-6" />
                <Text className="text-white/80 text-center font-geist-md">
                    They probably recognize your transaction ID by now! 😉
                </Text>
            </View>
        </View>,

        // Card 4: Streaks/Consistency
        <View key={3} className="flex-1 items-center justify-center px-10">
            <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-10 border border-white/30 -rotate-12">
                <Flame size={48} color="white" />
            </View>
            <Text className="text-white/80 text-lg font-geist-md mb-2">The Discipline Trophy</Text>
            <Text className="text-white text-4xl font-geist-b text-center mb-10">Consistency is your superpower.</Text>
            
            <View className="flex-row gap-4">
                <View className="flex-1 aspect-square bg-white/10 p-6 rounded-3xl border border-white/20 items-center justify-center">
                    <Text className="text-white text-4xl font-geist-b">{storyData.daysActive}</Text>
                    <Text className="text-white/60 text-[10px] font-geist-sb uppercase text-center mt-1">Day Streak</Text>
                </View>
                <View className="flex-1 aspect-square bg-white/10 p-6 rounded-3xl border border-white/20 items-center justify-center">
                    <Trophy size={32} color="white" />
                    <Text className="text-white/60 text-[10px] font-geist-sb uppercase text-center mt-2">Active Tracker</Text>
                </View>
            </View>
            <Text className="text-white/80 text-center mt-12 font-geist-md leading-6 px-10">
                You tracked your money with precision this month. Your future self is thanking you! 🚀
            </Text>
        </View>,

        // Card 5: Summary
        <View key={4} className="flex-1 items-center justify-center px-10">
            <Text className="text-white/80 text-lg font-geist-md mb-2">Your Finale</Text>
            <Text className="text-white text-4xl font-geist-b text-center mb-12">Ready for next month?</Text>
            
            <View className="w-full bg-white p-8 rounded-[40px] items-center">
                <View className="w-16 h-16 rounded-2xl bg-orange-50 items-center justify-center mb-6">
                    <Star size={32} color="#FF6A00" />
                </View>
                <Text className="text-gray-400 text-xs font-geist-sb uppercase mb-1">Financial Health</Text>
                <Text className="text-gray-900 text-3xl font-geist-b mb-6">Looking Solid!</Text>
                
                <View className="w-full gap-3">
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                        <Text className="text-gray-500 font-geist-md">Total Flow</Text>
                        <Text className="text-gray-900 font-geist-b">₹{(storyData.totalIncome + storyData.totalExpense).toLocaleString()}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-3">
                        <Text className="text-gray-500 font-geist-md">Net Surprise</Text>
                        <Text className={`font-geist-b ${storyData.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ₹{Math.abs(storyData.balance).toLocaleString()}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleShare}
                    className="w-full bg-[#FF6A00] py-4 rounded-[100px] mt-8 flex-row items-center justify-center shadow-lg shadow-orange-500/30"
                >
                    <Share2 size={18} color="white" />
                    <Text className="text-white font-geist-b ml-2">Share My Story</Text>
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
                onPress={() => router.back()}
                className="mt-8"
            >
                <Text className="text-white/60 font-geist-md">Done for now</Text>
            </TouchableOpacity>
        </View>,
    ];

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <StatusBar barStyle="light-content" />
            
            {/* Background Gradients */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: STORY_COLORS[currentIndex][0] }]}>
                <View 
                    style={[
                        StyleSheet.absoluteFill, 
                        { 
                            backgroundColor: STORY_COLORS[currentIndex][1], 
                            opacity: 0.6 
                        }
                    ]} 
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Progress Bars */}
                <View className="flex-row gap-1.5 px-4 mt-2">
                    {cards.map((_, i) => (
                        <View key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <Animated.View 
                                style={[
                                    { height: '100%', backgroundColor: 'white' },
                                    useAnimatedStyle(() => ({
                                        width: i === activeIndex.value 
                                            ? `${progress.value * 100}%` 
                                            : i < activeIndex.value ? '100%' : '0%'
                                    }))
                                ]} 
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                            <Zap size={16} color="white" />
                        </View>
                        <Text className="text-white font-geist-sb ml-3">Money Story</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-8 h-8 rounded-full bg-black/20 items-center justify-center"
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Content Overlay */}
                <Pressable 
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    className="flex-1"
                >
                    {cards[currentIndex]}
                </Pressable>
            </SafeAreaView>
        </View>
    );
}
