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
    Image,
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
    type SharedValue
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

const ProgressBarItem = ({ index, activeIndex, progress }: { index: number, activeIndex: number, progress: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => ({
        width: index === activeIndex 
            ? `${progress.value * 100}%` 
            : index < activeIndex ? '100%' : '0%'
    }));

    return (
        <View className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <Animated.View 
                style={[
                    { height: '100%', backgroundColor: 'white' },
                    animatedStyle
                ]} 
            />
        </View>
    );
};

const StorySkeleton = () => {
    const opacity = useSharedValue(0.3);
    
    useEffect(() => {
        opacity.value = withSequence(
            withTiming(0.7, { duration: 1000 }),
            withTiming(0.3, { duration: 1000 })
        );
        const interval = setInterval(() => {
            opacity.value = withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            );
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Skeleton Progress Bars */}
                <View className="flex-row gap-1.5 px-4 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} className="flex-1 h-1 bg-gray-200 rounded-full" />
                    ))}
                </View>

                {/* Skeleton Header (Dashboard Style) */}
                <View className="flex-row items-center justify-between px-6 py-6 border-b border-gray-100">
                    <View className="flex-row items-center">
                        <Animated.View style={pulseStyle} className="w-10 h-10 rounded-full bg-gray-200" />
                        <View className="ml-3">
                            <Animated.View style={pulseStyle} className="w-24 h-4 bg-gray-200 rounded-md mb-2" />
                            <Animated.View style={pulseStyle} className="w-16 h-3 bg-gray-200 rounded-md" />
                        </View>
                    </View>
                    <Animated.View style={pulseStyle} className="w-10 h-10 rounded-full bg-gray-200" />
                </View>

                {/* Skeleton Main Card */}
                <View className="px-6 pt-8">
                    <Animated.View style={pulseStyle} className="w-full h-80 rounded-[40px] bg-gray-200 mb-8" />
                    
                    <Animated.View style={pulseStyle} className="w-48 h-8 bg-gray-200 rounded-lg mb-4" />
                    
                    <View className="flex-row gap-4 mb-4">
                        <Animated.View style={pulseStyle} className="flex-1 h-20 bg-gray-200 rounded-3xl" />
                        <Animated.View style={pulseStyle} className="flex-1 h-20 bg-gray-200 rounded-3xl" />
                    </View>
                </View>

                {/* Bottom List items */}
                <View className="px-6 mt-4">
                    {[1, 2].map((i) => (
                        <View key={i} className="flex-row items-center mb-4">
                            <Animated.View style={pulseStyle} className="w-12 h-12 rounded-2xl bg-gray-200" />
                            <View className="ml-4 flex-1">
                                <Animated.View style={pulseStyle} className="w-40 h-4 bg-gray-200 rounded-md mb-2" />
                                <Animated.View style={pulseStyle} className="w-24 h-3 bg-gray-200 rounded-md" />
                            </View>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
};

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
            daysActive: 7,
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
            startStory(0);
        }
    };

    useEffect(() => {
        if (storyData) {
            startStory(currentIndex);
        }
    }, [currentIndex, storyData]);

    const handlePressIn = () => {
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

    const cards = useMemo(() => {
        if (!storyData) return [];
        return [
            <View key={0} className="flex-1 items-center justify-start px-6 pt-16">
                <View className="w-full">
                    <View 
                        className="bg-[#CCFF00] px-4 py-2 self-start mb-8 rotate-[-2deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        style={{ borderWidth: 2, borderColor: 'white' }}
                    >
                        <Text className="text-white font-geist-b text-sm uppercase tracking-widest">Big Picture</Text>
                    </View>

                    <Text className="text-white text-6xl font-geist-b uppercase leading-[54px] tracking-tighter mb-12">
                        YOUR MONTH{"\n"}
                        <Text className="text-[#CCFF00]">IN A NUTSHELL.</Text>
                    </Text>
                    
                    <View className="gap-6">
                        <View className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-sm">
                            <Text className="text-black text-[14px] font-geist-b uppercase mb-2 tracking-wider">💸 Total Gone</Text>
                            <Text className="text-black text-4xl font-geist-b">₹{storyData.totalExpense.toLocaleString()}</Text>
                        </View>
                        
                        <View className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-sm">
                            <Text className="text-black text-[14px] font-geist-b uppercase mb-2 tracking-wider">🤑 Total Earned</Text>
                            <Text className="text-black text-4xl font-geist-b">₹{storyData.totalIncome.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>,
            <View key={1} className="flex-1 px-6 pt-16">
                <View className="mb-12">
                    <View className="bg-[#00F0FF] border-[3px] border-black px-0 py-3 self-start shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[3deg]">
                        <Text className="text-black font-geist-b text-xl uppercase tracking-tighter">Soulmate Found</Text>
                    </View>
                </View>

                <View className="items-end mb-12">
                    <Text className="text-white text-right text-4xl font-geist-b uppercase leading-[42px] tracking-tight">
                        You're a true{"\n"}
                        <Text className="text-[#00F0FF] text-6xl">{storyData.topCategory === 'Food' ? 'Foodie' : storyData.topCategory}</Text>
                        {"\n"}lover!
                    </Text>
                </View>

                <View className="w-full flex-row mb-12">
                    <View className="flex-1 bg-white border-[4px] border-black p-8 pt-7 pb-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] -rotate-[2deg]">
                        <Text className="text-black text-sm font-geist-b uppercase mb-3 tracking-widest opacity-60">Your Obsession</Text>
                        <Text className="text-black text-5xl font-geist-b mb-2">₹{storyData.topCategoryAmount.toLocaleString()}</Text>
                        <View className="h-0 w-12 bg-[#00F0FF] mt-0" />
                    </View>
                </View>

                <View className="mt-12 self-center">
                    <View className="bg-white border border-white/20 px-5 py-4 backdrop-blur-md">
                        <Text className="text-black font-geist-sb text-center">
                            "Life is too short to skip this category, right?"
                        </Text>
                    </View>
                </View>
            </View>,
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
                    <Text className="text-white/80 text-center font-geist-md">They probably recognize your transaction ID by now! 😉</Text>
                </View>
            </View>,
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
                <Text className="text-white/80 text-center mt-12 font-geist-md leading-6 px-10">You tracked your money with precision this month. Your future self is thanking you! 🚀</Text>
            </View>,
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
                    <TouchableOpacity onPress={handleShare} className="w-full bg-[#FF6A00] py-4 rounded-[100px] mt-8 flex-row items-center justify-center shadow-lg shadow-orange-500/30">
                        <Share2 size={18} color="white" />
                        <Text className="text-white font-geist-b ml-2">Share My Story</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => router.back()} className="mt-8">
                    <Text className="text-white/60 font-geist-md">Done for now</Text>
                </TouchableOpacity>
            </View>,
        ];
    }, [storyData, handleShare, router]);

    if (isLoading || !storyData) {
        return <StorySkeleton />;
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

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <StatusBar barStyle="light-content" />
            {/* Background Gradients & Images */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: currentIndex === 0 || currentIndex === 1 ? '#111' : STORY_COLORS[currentIndex][0] }]}>
                {currentIndex === 0 || currentIndex === 1 ? (
                    <View style={StyleSheet.absoluteFill}>
                        <Image 
                            source={currentIndex === 0 ? require("../assets/money_story2.jpeg") : require("../assets/money_story3.jpeg")} 
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: currentIndex === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                    </View>
                ) : (
                    <View 
                        style={[
                            StyleSheet.absoluteFill, 
                            { 
                                backgroundColor: STORY_COLORS[currentIndex][1], 
                                opacity: 0.6 
                            }
                        ]} 
                    />
                )}
            </View>

            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row gap-1.5 px-4 mt-2">
                    {cards.map((_, i) => (
                        <ProgressBarItem key={i} index={i} activeIndex={activeIndex.value} progress={progress} />
                    ))}
                </View>

                <View className="flex-row items-center justify-between px-6 py-4">
                    <View className="flex-row items-center">
                        <Text className="text-white font-geist-sb">Money Story</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 rounded-full bg-black/20 items-center justify-center">
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} className="flex-1">
                    {cards[currentIndex]}
                </Pressable>
            </SafeAreaView>
        </View>
    );
}
