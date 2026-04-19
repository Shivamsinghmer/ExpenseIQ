import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { 
    ChevronLeft, Flame, Trophy, Calendar, Leaf, 
    Star, Diamond, Crown, TreeDeciduous, Sprout,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { streaksAPI } from "../services/api";

const { width } = Dimensions.get("window");

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
                                <View 
                                    key={milestone.id}
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
                                </View>
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
        </SafeAreaView>
    );
}
