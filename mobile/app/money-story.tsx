import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
    Platform,
    Linking,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
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
import { transactionsAPI, streaksAPI } from "../services/api";
import { useCurrency } from "../providers/CurrencyProvider";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 seconds per card

const STORY_COLORS = [
    ["#FF6A00", "#FFC700"], // Orange-Yellow
    ["#00C6FF", "#0072FF"], // Blue
    ["#F093FB", "#F5576C"], // Pink-Red
    ["#43E97B", "#38F9D7"], // Green
    ["#111827", "#374151"], // Dark
];

const ProgressBarItem = ({ index, currentIndex, progress }: { index: number, currentIndex: number, progress: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => ({
        width: index === currentIndex 
            ? `${progress.value * 100}%` 
            : index < currentIndex ? '100%' : '0%'
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
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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

const StrokeText = ({ text, color, strokeColor, strokeWidth = 1, style, className }: any) => {
    return (
        <View style={[{ position: 'relative' }, style]}>
            <Text className={className} style={{ position: 'absolute', top: -strokeWidth, left: -strokeWidth, color: strokeColor }}>{text}</Text>
            <Text className={className} style={{ position: 'absolute', top: -strokeWidth, left: strokeWidth, color: strokeColor }}>{text}</Text>
            <Text className={className} style={{ position: 'absolute', top: strokeWidth, left: -strokeWidth, color: strokeColor }}>{text}</Text>
            <Text className={className} style={{ position: 'absolute', top: strokeWidth, left: strokeWidth, color: strokeColor }}>{text}</Text>
            <Text className={className} style={{ color: color }}>{text}</Text>
        </View>
    );
};

export default function MoneyStory() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const progress = useSharedValue(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const viewShotRef = useRef<any>(null);

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ["transactions-summary"],
        queryFn: () => transactionsAPI.getSummary().then(res => res.data),
    });

    const { data: streak, isLoading: isStreakLoading } = useQuery({
        queryKey: ["streaks"],
        queryFn: () => streaksAPI.getStats().then(res => res.data),
    });

    const { currency } = useCurrency();
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const storyData = useMemo(() => {
        if (!summary || !streak) return null;

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
            daysActive: streak.currentStreak || 0,
            percentile: streak.percentile || 100,
        };
    }, [summary, streak]);

    const handleShareToInstagram = useCallback(async () => {
        try {
            if (viewShotRef.current) {
                const uri = await viewShotRef.current.capture();
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    UTI: 'public.png',
                    dialogTitle: 'Share your Money Story',
                });
            }
        } catch (error) {
            console.log('Share error:', error);
            await Share.share({
                message: `Check out my Financial Wrapped on ExpensePal! I spent ${currency.symbol}${storyData?.totalExpense.toLocaleString()} this month. 📈`,
            });
        }
    }, [storyData, currency]);

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
        if (currentIndex < 5) {
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
                message: `Check out my Financial Wrapped on ExpensePal! I spent ${currency.symbol}${storyData?.totalExpense.toLocaleString()} this month. 📈`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const cards = useMemo(() => {
        if (!storyData) return [];
        return [
            <View key={0} className="flex-1 items-end justify-right px-6 pt-16">
                <View className="mb-8">
                    <Text className="text-black font-geist-b text-5xl uppercase tracking-widest self-end mb-8">Your</Text>
                    <View className="bg-[#FFC0CB] border-[2px] border-black px-1 py-3">
                        <Text className="text-black font-geist-b text-6xl uppercase tracking-widest text-right">{currentMonth} WRAPPED</Text>
                    </View>
                </View>
                <Text className="text-black text-8xl font-geist-b">{currentYear}</Text>
                <Text className="text-black text-6xl font-geist-b text-right">IS HERE.</Text>
            </View>,
            <View key={1} className="flex-1 items-center justify-start px-6 pt-16">
                <View className="w-full">
                    <View 
                        className="bg-[#CCFF00] px-4 py-2 self-start mb-8 rotate-[0deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        style={{ borderWidth: 2, borderColor: 'black' }}
                    >
                        <Text className="text-black font-geist-b text-sm uppercase tracking-widest">Big Picture</Text>
                    </View>

                    <View className="mb-12">
                        <StrokeText 
                            text="YOUR MONTH" 
                            color="white" 
                            strokeColor="red" 
                            className="text-7xl font-geist-b uppercase tracking-tighter" 
                        />
                        <StrokeText 
                            text="IN A NUTSHELL." 
                            color="#CCFF00" 
                            strokeColor="black" 
                            className="text-7xl font-geist-b uppercase tracking-tighter" 
                        />
                    </View>
                    
                    <View className="gap-6">
                        <View className="bg-white border-[2px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-sm">
                            <Text className="text-black text-[14px] font-geist-b uppercase mb-2 tracking-wider">💸 Total Gone</Text>
                            <Text className="text-black text-4xl font-geist-b">{currency.symbol}{storyData.totalExpense.toLocaleString()}</Text>
                        </View>
                        
                        <View className="bg-white border-[2px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-sm">
                            <Text className="text-black text-[14px] font-geist-b uppercase mb-2 tracking-wider">🤑 Total Earned</Text>
                            <Text className="text-black text-4xl font-geist-b">{currency.symbol}{storyData.totalIncome.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>,
            <View key={1} className="flex-1 px-6 pt-16">
                <View className="mb-12">
                    <View className="bg-[#00F0FF] border-[2px] border-black px-3 py-2.5 self-start rotate-[0deg]">
                        <Text className="text-black font-geist-b text-xl uppercase tracking-loose">Soulmate Found</Text>
                    </View>
                </View>

                <View className="items-end mb-12">
                    <StrokeText 
                        text="You're a true" 
                        color="white" 
                        strokeColor="orange" 
                        className="text-5xl font-geist-b uppercase tracking-tight text-right" 
                    />
                    <StrokeText 
                        text={storyData.topCategory === 'Food' ? 'Foodie' : storyData.topCategory} 
                        color="#00F0FF" 
                        strokeColor="black" 
                        className="text-7xl font-geist-b uppercase tracking-tight text-right" 
                    />
                    <StrokeText 
                        text="lover!" 
                        color="white" 
                        strokeColor="orange" 
                        className="text-5xl font-geist-b uppercase tracking-tight text-right" 
                    />
                </View>

                <View className="w-full flex-row mb-12">
                    <View className="flex-1 bg-white border-[2px] border-black p-8 pt-7 pb-6 -rotate-[0deg]">
                        <Text className="text-black text-sm font-geist-b uppercase mb-3 tracking-widest opacity-60">Your Obsession</Text>
                        <Text className="text-black text-5xl font-geist-b mb-2">{currency.symbol}{storyData.topCategoryAmount.toLocaleString()}</Text>
                        <View className="h-0 w-12 bg-[#00F0FF] mt-0" />
                    </View>
                </View>

                <View className="mt-12 self-center">
                    <View className="bg-[#00F0FF] border-[2px] border-black px-5 py-4 backdrop-blur-md">
                        <Text className="text-white font-geist-sb text-center">
                            Life is too short to skip this category, right?
                        </Text>
                    </View>
                </View>
            </View>,
            <View key={3} className="flex-1 px-8 pt-10">
                <View className="mb-12 self-end">
                    <View className="bg-[#A855F7] border-[2px] border-black px-6 py-2.5 rotate-[0deg]">
                        <Text className="text-white font-geist-b text-xl uppercase tracking-loose">Favorite Spot</Text>
                    </View>
                </View>

                <View className="mb-14">
                    <Text className="text-black text-5xl font-geist-b uppercase leading-[50px] tracking-tight">
                        You & {"\n"}
                        <Text className="text-[#A855F7] text-5xl">{storyData.topMerchant}</Text>
                        {"\n"}HAD A MOMENT.
                    </Text>
                </View>

                <View className="w-full">
                    <View className="bg-white border-[2px] border-black p-8 pb-7 pt-7 rotate-[0deg]">
                        <Text className="text-black text-sm font-geist-b uppercase mb-3 tracking-widest opacity-60">Total Contributed</Text>
                        <Text className="text-black text-5xl font-geist-b">{currency.symbol}{storyData.topMerchantAmount.toLocaleString()}</Text>
                    </View>
                </View>

                <View className="mt-12 bg-[#A855F7] border-[2px] border-black p-4 self-start rotate-[0deg]">
                    <Text className="text-white font-geist-sb">
                        They probably recognize your transaction ID by now! 😉
                    </Text>
                </View>
            </View>,
            <View key={4} className="flex-1 px-10 pt-16">
                <View className="mb-14">
                    <View className="bg-[#FF7A00] border-[2px] border-black px-6 py-2.5 self-start">
                        <Text className="text-white font-geist-b text-xl uppercase tracking-loose">Streak Unlocked</Text>
                    </View>
                </View>

                <View className="items-center mb-16">
                    <View className="w-48 h-48 bg-white border-[3px] border-black items-center justify-center">
                        <Text className="text-black text-8xl font-geist-b">{storyData.daysActive}</Text>
                        <Text className="text-black text-base font-geist-sb uppercase tracking-widest mt-[8px]">Day Streak</Text>
                    </View>
                </View>

                <View className="w-full">
                    <Text className="text-black text-4xl font-geist-b uppercase leading-[40px] tracking-tight text-center">
                        CONSISTENCY IS{"\n"}
                        <StrokeText 
                            text="YOUR SUPERPOWER."
                            color="#FF7A00" 
                            strokeColor="#22c55e" 
                            className="text-5xl text-[#FF7A00] font-geist-b uppercase text-center"
                        />
                    </Text>
                </View>

                <View className="mt-16 self-center">
                    <View className="bg-[#FF7A00] border-[2px] border-black p-4 py-2.5">
                        <Text className="text-white font-geist-sb text-center">
                            You're in the top {storyData.percentile}% of disciplined users!
                        </Text>
                    </View>
                </View>
            </View>,
            <View key={5} className="flex-1 px-8 pt-10">
                <View className="mb-6 items-center">
                    <View className="bg-white border-[2px] border-black px-8 py-2.5">
                        <Text className="text-black font-geist-b text-xl uppercase tracking-loose">THE FINALE</Text>
                    </View>
                </View>

                <View className="bg-white border-[3px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <Text className="text-black/40 text-[10px] font-geist-b uppercase tracking-widest mb-4">{currentMonth} {currentYear} Report</Text>
                    
                    <View className="gap-4">
                        <View className="flex-row justify-between items-center border-b-[2px] border-black/10 pb-3">
                            <Text className="text-black font-geist-b text-base uppercase">Income</Text>
                            <Text className="text-green-600 font-geist-b text-xl">{currency.symbol}{storyData.totalIncome.toLocaleString()}</Text>
                        </View>

                        <View className="flex-row justify-between items-center border-b-[2px] border-black/10 pb-3">
                            <Text className="text-black font-geist-b text-base uppercase">Expenses</Text>
                            <Text className="text-red-500 font-geist-b text-xl">{currency.symbol}{storyData.totalExpense.toLocaleString()}</Text>
                        </View>

                        <View className="flex-row justify-between items-center border-b-[2px] border-black/10 pb-3">
                            <Text className="text-black font-geist-b text-base uppercase">Net Balance</Text>
                            <Text className={`font-geist-b text-xl ${storyData.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {storyData.balance >= 0 ? '+' : '-'}{currency.symbol}{Math.abs(storyData.balance).toLocaleString()}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center border-b-[2px] border-black/10 pb-3">
                            <Text className="text-black font-geist-b text-base uppercase">Top Category</Text>
                            <Text className="text-black font-geist-b text-xl">{storyData.topCategory}</Text>
                        </View>

                        <View className="flex-row justify-between items-center border-b-[2px] border-black/10 pb-3">
                            <Text className="text-black font-geist-b text-base uppercase">Streak</Text>
                            <Text className="text-[#FF7A00] font-geist-b text-xl">{storyData.daysActive} Days</Text>
                        </View>

                        <View className="flex-row justify-between items-center">
                            <Text className="text-black font-geist-b text-base uppercase">Ranking</Text>
                            <Text className="text-black font-geist-b text-xl">Top {storyData.percentile}%</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3 mt-10">
                        <TouchableOpacity 
                            onPress={handleShareToInstagram} 
                            className="flex-1 bg-black py-4 flex-row items-center justify-center border-[2px] border-black"
                        >
                            <Text className="text-white font-geist-b text-sm uppercase ml-2 tracking-wider">Share Story</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="mt-10 self-center border-b border-black"
                >
                    <Text className="text-black font-geist-md tracking-widest uppercase">End Story</Text>
                </TouchableOpacity>
            </View>,
        ];
    }, [storyData, handleShare, router]);

    if (isSummaryLoading || isStreakLoading || !storyData) {
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

            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row gap-1.5 px-4 mt-2">
                    {cards.map((_, i) => (
                        <ProgressBarItem key={i} index={i} currentIndex={currentIndex} progress={progress} />
                    ))}
                </View>

                <View style={{ flex: 1 }}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ flex: 1 }}>
                        {/* Background Image inside ViewShot for capture */}
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: currentIndex === 0 ? '#111' : (currentIndex <= 5 ? '#111' : STORY_COLORS[currentIndex][0]) }]}>
                            {currentIndex <= 5 ? (
                                <View style={StyleSheet.absoluteFill}>
                                    <Image 
                                        source={
                                            currentIndex === 0 ? require("../assets/money_story1.jpeg") : 
                                            currentIndex === 1 ? require("../assets/money_story2.jpeg") : 
                                            currentIndex === 2 ? require("../assets/money_story3.jpeg") : 
                                            currentIndex === 3 ? require("../assets/money_story4.jpeg") :
                                            currentIndex === 4 ? require("../assets/money_story5.jpeg") :
                                            require("../assets/money_story6.jpeg")
                                        } 
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <View 
                                    style={[
                                        StyleSheet.absoluteFill, 
                                        { 
                                            backgroundColor: currentIndex === 0 ? '#000' : (STORY_COLORS[currentIndex]?.[1] || '#000'), 
                                            opacity: currentIndex === 0 ? 1 : 0.6 
                                        }
                                    ]} 
                                />
                            )}
                        </View>

                        {/* Logo header inside ViewShot */}
                        <View className="flex-row items-center px-6 py-4">
                            <Image source={require("../assets/logo.png")} className="w-6 h-6 rounded mr-2" />
                            <Text className="text-black font-geist-sb text-base mb-0.5 tracking-wide">ExpensePal</Text>
                        </View>

                        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} className="flex-1">
                            {cards[currentIndex]}
                        </Pressable>
                    </ViewShot>

                    {/* X button outside ViewShot so it won't appear in screenshot */}
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="w-8 h-8 rounded-full bg-black/20 items-center justify-center"
                        style={{ position: 'absolute', top: 16, right: 24 }}
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
