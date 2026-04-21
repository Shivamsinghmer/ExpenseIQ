import React, { useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    Modal,
    Animated,
    StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { 
    ChevronLeft, Flame, Trophy, Calendar, Leaf, 
    Star, Diamond, Crown, TreeDeciduous, Sprout,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { streaksAPI } from "../services/api";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const MILESTONES = [
    { id: 1, days: 3, label: "Beginner", emoji: "🌱", color: "#94a3b8" },
    { id: 2, days: 7, label: "1 Week", emoji: "⚡", color: "#4ade80" },
    { id: 3, days: 14, label: "2 Weeks", emoji: "🍃", color: "#22c55e" },
    { id: 4, days: 30, label: "1 Month", emoji: "🏆", color: "#16a34a" },
    { id: 5, days: 60, label: "2 Months", emoji: "🎯", color: "#facc15" },
    { id: 6, days: 90, label: "3 Months", emoji: "🚀", color: "#fbbf24" },
    { id: 7, days: 180, label: "Half Year", emoji: "💎", color: "#3b82f6" },
    { id: 8, days: 250, label: "Master", emoji: "🏅", color: "#2563eb" },
    { id: 9, days: 365, label: "1 Year", emoji: "👑", color: "#f59e0b" },
];

const CONFETTI_PIECES = ["🎉", "🎊", "✨", "⭐", "💫", "🌟", "🔥", "💥"];

function ConfettiOverlay() {
    const pieces = useRef(
        Array.from({ length: 24 }, (_, i) => ({
            id: i,
            emoji: CONFETTI_PIECES[i % CONFETTI_PIECES.length],
            left: Math.random() * (width - 30),
            delay: Math.random() * 1200,
            duration: 2000 + Math.random() * 1500,
            anim: new Animated.Value(0),
        }))
    ).current;

    React.useEffect(() => {
        pieces.forEach(p => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(p.delay),
                    Animated.timing(p.anim, {
                        toValue: 1,
                        duration: p.duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(p.anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {pieces.map(p => (
                <Animated.Text
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: p.left,
                        fontSize: 20,
                        opacity: p.anim.interpolate({
                            inputRange: [0, 0.2, 0.8, 1],
                            outputRange: [0, 1, 1, 0],
                        }),
                        transform: [
                            {
                                translateY: p.anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-30, height * 0.9],
                                }),
                            },
                            {
                                rotate: p.anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0deg", `${Math.random() > 0.5 ? 360 : -360}deg`],
                                }),
                            },
                        ],
                    }}
                >
                    {p.emoji}
                </Animated.Text>
            ))}
        </View>
    );
}

function MonthlyCalendar({ activeDates }: { activeDates: string[] }) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    // Adjust first day to Monday-based (0: Mon, 6: Sun)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const calendarDays = [];
    // Empty slots before the first day
    for (let i = 0; i < adjustedFirstDay; i++) {
        calendarDays.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

    return (
        <View className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-900 font-geist-b text-lg">Activity Calendar</Text>
                <Text className="text-gray-400 font-geist-md text-sm">
                    {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
            </View>

            <View className="flex-row mb-4">
                {dayLabels.map((label, i) => (
                    <Text key={i} className="flex-1 text-center text-gray-400 text-xs font-geist-sb">{label}</Text>
                ))}
            </View>

            <View className="flex-row flex-wrap">
                {calendarDays.map((day, i) => {
                    if (day === null) return <View key={`empty-${i}`} className="w-[14.28%] aspect-square" />;
                    
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isActive = activeDates.includes(dateStr);
                    const isToday = day === today.getDate();

                    return (
                        <View key={day} className="w-[14.28%] aspect-square items-center justify-center p-1">
                            <View 
                                className={`w-full h-full rounded-xl items-center justify-center ${isActive ? 'bg-[#FF6A00]' : isToday ? 'bg-orange-50' : 'bg-gray-50'}`}
                            >
                                <Text className={`text-xs font-geist-sb ${isActive ? 'text-white' : isToday ? 'text-[#FF6A00]' : 'text-gray-400'}`}>
                                    {day}
                                </Text>
                                {isActive && (
                                    <View className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

export default function StreakScreen() {
    const router = useRouter();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["streak"],
        queryFn: () => streaksAPI.getStats().then(res => res.data),
    });

    const [showTrophyOverlay, setShowTrophyOverlay] = useState(false);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[0] | null>(null);
    const modalScale = useRef(new Animated.Value(0)).current;

    const handleMilestonePress = useCallback((milestone: typeof MILESTONES[0]) => {
        setSelectedMilestone(milestone);
        setShowTrophyOverlay(true);

        // After Lottie plays (~2s), transition to the modal
        setTimeout(() => {
            setShowTrophyOverlay(false);
            setShowAchievementModal(true);
            modalScale.setValue(0);
            Animated.spring(modalScale, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }).start();
        }, 2200);
    }, []);

    const closeModal = useCallback(() => {
        Animated.timing(modalScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowAchievementModal(false);
            setSelectedMilestone(null);
        });
    }, []);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#FF6A00" />
            </SafeAreaView>
        );
    }

    const currentStreak = stats?.currentStreak || 0;
    const longestStreak = stats?.longestStreak || 0;
    const activeDays = stats?.activeDaysThisMonth || 0;
    const totalDays = stats?.daysInMonth || 30;
    const activeDates = stats?.activeDates || [];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 py-6 flex-row items-center justify-between">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center border border-gray-100"
                >
                    <ChevronLeft size={28} color="#1f2937" />
                </TouchableOpacity>
                <Text className="text-2xl font-geist-b text-gray-900">Streak</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Main Streak Card */}
                <View className="px-6 py-4">
                    <View 
                        className="bg-white rounded-[40px] p-8 items-center border border-gray-50 shadow-xs"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.1,
                            shadowRadius: 20,
                            elevation: 5,
                        }}
                    >
                        <View className="w-24 h-24 items-center justify-center mb-6">
                            <Flame size={80} color="#FF6A00" fill="#FF6A00" />
                        </View>
                        <Text className="text-8xl font-geist-b text-[#FF6A00] tracking-tighter">{currentStreak}</Text>
                        <Text className="text-gray-400 font-geist-sb text-lg mt-2">Day Streak</Text>
                    </View>
                </View>

                {/* Summary Stats */}
                <View className="flex-row px-6 gap-4 mb-8">
                    {[
                        { icon: Flame, value: currentStreak, label: "Current", color: "#FF6A00" },
                        { icon: Trophy, value: longestStreak, label: "Longest", color: "#f59e0b" },
                        { icon: Calendar, value: `${activeDays}/${totalDays}`, label: "This Month", color: "#6b7280" },
                    ].map((stat, i) => (
                        <View key={i} className="flex-1 bg-gray-50 rounded-[28px] p-5 items-center border border-gray-100">
                            <stat.icon size={24} color={stat.color} />
                            <Text className="text-xl font-geist-b text-gray-900 mt-2">{stat.value}</Text>
                            <Text className="text-[10px] font-geist-sb text-gray-400 mt-1">{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Milestones Section */}
                <View className="px-6 mb-8">
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-[12px] font-geist-sb text-gray-400 uppercase tracking-[2px]">Milestones</Text>
                        <Text className="text-[12px] font-geist-b text-[#FF6A00]">{Math.round((MILESTONES.filter(m => currentStreak >= m.days).length / 9) * 100)}%</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {MILESTONES.map((milestone) => {
                            const isAchieved = currentStreak >= milestone.days;
                            const itemWidth = (width - 48 - 32) / 3; // SCREEN_WIDTH - padding - gaps
                            return (
                                <TouchableOpacity 
                                    key={milestone.id}
                                    activeOpacity={isAchieved ? 0.7 : 1}
                                    onPress={() => isAchieved && handleMilestonePress(milestone)}
                                    style={{ width: itemWidth }}
                                    className={`mb-4 p-4 rounded-3xl items-center border ${isAchieved ? "bg-orange-50/20 border-orange-100" : "bg-white border-gray-100"}`}
                                >
                                    <View 
                                        className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${isAchieved ? "" : "bg-gray-50"}`}
                                        style={{ backgroundColor: isAchieved ? milestone.color + "20" : "#f9fafb" }}
                                    >
                                        <Text className={`text-2xl ${isAchieved ? "" : "opacity-30"}`}>
                                            {milestone.emoji}
                                        </Text>
                                    </View>
                                    <Text className={`text-lg font-geist-b ${isAchieved ? "text-gray-900" : "text-gray-300"}`}>
                                        {milestone.days}
                                    </Text>
                                    <Text className={`text-[8px] font-geist-sb uppercase text-center ${isAchieved ? "text-gray-500" : "text-gray-300"}`}>
                                        {milestone.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Calendar Section */}
                <View className="px-6 mb-2">
                    <MonthlyCalendar activeDates={activeDates} />
                </View>

                <View className="h-10" />
            </ScrollView>

            {/* Trophy Lottie Overlay */}
            {showTrophyOverlay && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.0)", zIndex: 999, alignItems: "center", justifyContent: "center" }]}>
                    <LottieView
                        source={require("../assets/Trophy.json")}
                        autoPlay
                        loop={false}
                        style={{ width: 400, height: 400 }}
                    />
                </View>
            )}

            {/* Achievement Modal */}
            <Modal visible={showAchievementModal} transparent animationType="none" onRequestClose={closeModal}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}>
                    <ConfettiOverlay />
                    <Animated.View
                        style={{
                            transform: [{ scale: modalScale }],
                            opacity: modalScale,
                            width: width * 0.85,
                            backgroundColor: "#fff",
                            borderRadius: 36,
                            paddingVertical: 20,
                            paddingHorizontal: 20,
                            alignItems: "center",
                            elevation: 0,
                        }}
                    >
                        {/* Glow Ring */}
                        <View
                            style={{
                                borderRadius: 25,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                                marginTop:10
                            }}
                        >
                            <Text style={{ fontSize: 54 }}>{selectedMilestone?.emoji}</Text>
                        </View>

                        {/* Title */}
                        <Text className="text-gray-900 font-geist-sb text-2xl text-center mb-2">
                            Congrats, {selectedMilestone?.label}!
                        </Text>

                        {/* Subtitle */}
                        <Text className="text-gray-400 font-geist-md text-sm text-center mb-1">
                            {selectedMilestone?.days}-Day Streak Achieved
                        </Text>

                        {/* Badge Pill */}
                        <View
                            style={{
                                backgroundColor: (selectedMilestone?.color || "#FF6A00") + "20",
                                borderRadius: 100,
                                paddingHorizontal: 20,
                                paddingVertical: 6,
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        >
                            <Text style={{ color: "#FF6A00", fontWeight: "600", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>
                                🔥 {currentStreak} Day Streak
                            </Text>
                        </View>

                        {/* Motivational Text */}
                        <Text className="text-gray-500 font-geist-md text-center text-sm leading-5 mb-8 px-4">
                            You're on fire! Consistency is the key to mastering your finances. Keep tracking every day!
                        </Text>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={closeModal}
                            activeOpacity={0.9}
                            style={{
                                backgroundColor: "#FF6A00",
                                borderRadius: 100,
                                paddingVertical: 12,
                                paddingHorizontal: 114,
                                shadowColor: "#FF6A00",
                                
                            }}
                        >
                            <Text className="text-white font-geist-sb text-base">Let's Go!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
