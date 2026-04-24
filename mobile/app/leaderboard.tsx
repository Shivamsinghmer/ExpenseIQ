import React, { useState, useRef, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Crown, Flame, Medal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TIMEFRAMES = [
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "All-Time", value: "all-time" }
];

// Mock Data for Design Polish
const MOCK_LEADERBOARD = {
    weekly: [
        { id: "1", name: "Pragya", avatarUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200", longestStreak: 1560 },
        { id: "2", name: "Nitin", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", longestStreak: 1000 },
        { id: "3", name: "Annat", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 800 },
        { id: "4", name: "Stephen", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", longestStreak: 4570 },
        { id: "5", name: "Tony", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 4570 },
        { id: "6", name: "Steve", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", longestStreak: 4570 },
        { id: "7", name: "Bruce", avatarUrl: null, longestStreak: 4200 },
        { id: "8", name: "Clark", avatarUrl: null, longestStreak: 3800 },
    ],
    monthly: [
        { id: "1", name: "Pragya", avatarUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200", longestStreak: 2500 },
        { id: "2", name: "Nitin", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", longestStreak: 1800 },
        { id: "3", name: "Annat", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 1200 },
        { id: "4", name: "Stephen", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", longestStreak: 1100 },
        { id: "5", name: "Tony", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 950 },
        { id: "6", name: "Steve", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", longestStreak: 900 },
    ],
    "all-time": [
        { id: "1", name: "Pragya", avatarUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200", longestStreak: 5500 },
        { id: "2", name: "Nitin", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", longestStreak: 4800 },
        { id: "3", name: "Annat", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 4200 },
        { id: "4", name: "Stephen", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", longestStreak: 3800 },
        { id: "5", name: "Tony", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200", longestStreak: 3500 },
        { id: "6", name: "Bruce", avatarUrl: null, longestStreak: 3200 },
        { id: "7", name: "Clark", avatarUrl: null, longestStreak: 3100 },
    ]
};

export default function LeaderboardScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [timeframe, setTimeframe] = useState("all-time");
    const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const rangeTriggerRef = useRef<View>(null);

    const getFirstName = (name: string) => {
        return name.split(" ")[0];
    };

    const list = MOCK_LEADERBOARD[timeframe as keyof typeof MOCK_LEADERBOARD] || [];
    const top3 = list.slice(0, 3);
    const rest = list.slice(3);

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            {/* Header */}
            <View 
                style={{ paddingTop: insets.top + 0, paddingHorizontal: 24 }} 
                className="bg-white flex-row items-center justify-between pb-6"
            >
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center border border-gray-100"
                >
                    <ChevronLeft size={28} color="#1f2937" />
                </TouchableOpacity>
                <Text className="text-2xl font-geist-b text-gray-900">Leaderboard</Text>
                <View className="w-12" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                {/* Period Selector - Analytics Style */}
                <View className="bg-white px-6 pb-6">
                    <View ref={rangeTriggerRef}>
                        <TouchableOpacity 
                            onPress={() => {
                                rangeTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownPosition({ top: y + height + 5, left: x });
                                    setShowRangeDropdown(true);
                                });
                            }}
                            activeOpacity={0.9}
                            className="bg-[#FF6A00] px-5 py-2 rounded-full flex-row items-center justify-between self-start w-[140px]"
                        >
                            <Text className="text-white font-geist-sb text-base mr-2">
                                {TIMEFRAMES.find(t => t.value === timeframe)?.label}
                            </Text>
                            <ChevronRight size={18} color="white" style={{ transform: [{ rotate: showRangeDropdown ? '90deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        <Modal transparent visible={showRangeDropdown} animationType="fade" onRequestClose={() => setShowRangeDropdown(false)}>
                            <TouchableWithoutFeedback onPress={() => setShowRangeDropdown(false)}>
                                <View className="flex-1">
                                    <View 
                                        style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: 140 }} 
                                        className="bg-white rounded-[24px] shadow-xl border border-gray-100 p-1"
                                    >
                                        {TIMEFRAMES.map((t) => (
                                            <TouchableOpacity
                                                key={t.value}
                                                onPress={() => { setTimeframe(t.value); setShowRangeDropdown(false); }}
                                                className={`px-6 py-2 rounded-full mb-1 flex-row items-center ${timeframe === t.value ? "bg-[#FF6A00]" : ""}`}
                                            >
                                                <Text className={`font-geist-sb text-base ${timeframe === t.value ? "text-white" : "text-gray-600"}`}>
                                                    {t.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                    </View>
                </View>

                {/* Podium Section */}
                <View className="bg-white pt-2 pb-6 items-center">
                    <View className="flex-row items-end justify-between w-full px-8" style={{ height: 180 }}>
                        {/* 2nd Place */}
                        {top3[1] && (
                            <View className="items-center">
                                <Text style={{ fontFamily: 'Geist-SemiBold', color: '#6b7280', fontSize: 12, marginBottom: 6 }}>2nd</Text>
                                    <View style={{ width: 88, height: 88, borderRadius: 100, borderWidth: 3, borderColor: '#CBD5E1', overflow: 'hidden' }}>
                                        {top3[1].avatarUrl ? <Image source={{ uri: top3[1].avatarUrl }} style={{ width: '100%', height: '100%' }} /> : <View className="w-full h-full items-center justify-center bg-slate-50"><Text className="font-geist-b text-slate-300 text-lg">{top3[1].name.charAt(0)}</Text></View>}
                                    </View>
                                <Text className="mt-2 text-base font-geist-sb text-gray-900">{getFirstName(top3[1].name)}</Text>
                                <Text className="text-[#FF6A00] font-geist-sb text-sm">{top3[1].longestStreak}</Text>
                            </View>
                        )}

                        {/* 1st Place */}
                        {top3[0] && (
                            <View className="items-center">
                                <Text style={{ fontFamily: 'Geist-SemiBold', color: '#6b7280', fontSize: 14, marginBottom: 3 }}>1st</Text>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ position: 'absolute', top: -11, right: -3, zIndex: 999, transform: [{rotate: '40deg'}]}}>
                                        <Crown size={34} color="#F59E0B" fill="#F59E0B" />
                                    </View>
                                    <View style={{ width: 120, height: 120, borderRadius: 100, borderColor: '#FBBF24', borderWidth: 3, overflow: 'hidden' }}>
                                        {top3[0].avatarUrl ? <Image source={{ uri: top3[0].avatarUrl }} style={{ width: '100%', height: '100%' }} /> : <View className="w-full h-full items-center justify-center bg-amber-50"><Text className="font-geist-b text-amber-300 text-2xl">{top3[0].name.charAt(0)}</Text></View>}
                                    </View>
                                </View>
                                <Text className="mt-2 text-lg font-geist-sb text-gray-900">{getFirstName(top3[0].name)}</Text>
                                <Text className="text-[#FF6A00] font-geist-sb text-sm">{top3[0].longestStreak}</Text>
                            </View>
                        )}

                        {/* 3rd Place */}
                        {top3[2] && (
                            <View className="items-center">
                                <Text style={{ fontFamily: 'Geist-SemiBold', color: '#6b7280', fontSize: 13, marginBottom: 6 }}>3rd</Text>
                                <View style={{ width: 88, height: 88, borderRadius: 100, borderWidth: 3, borderColor: '#CD7F32', overflow: 'hidden' }}>
                                    {top3[2].avatarUrl ? <Image source={{ uri: top3[2].avatarUrl }} style={{ width: '100%', height: '100%' }} /> : <View className="w-full h-full items-center justify-center bg-orange-50"><Text className="font-geist-b text-orange-300 text-lg">{top3[2].name.charAt(0)}</Text></View>}
                                </View>
                                <Text className="mt-2 text-base font-geist-sb text-gray-900">{getFirstName(top3[2].name)}</Text>
                                <Text className="text-[#FF6A00] font-geist-sb text-sm">{top3[2].longestStreak}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* List Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white mt-2">
                    <Text className="w-12 text-gray-400 font-geist-sb text-xs uppercase tracking-wider">Rank</Text>
                    <Text className="flex-1 text-gray-400 font-geist-sb text-xs uppercase tracking-wider ml-4">User</Text>
                    <Text className="text-gray-400 font-geist-sb text-xs uppercase tracking-wider">Streak</Text>
                </View>

                {/* List Data */}
                <View className="px-0 pt-0">
                    {rest.map((user, index) => (
                        <View 
                            key={user.id} 
                            className="bg-white p-6 pt-4 pb-4 flex-row items-center"
                        >
                            <View className="w-16 items-center justify-center">
                                <Text className="text-gray-600 font-geist-b text-base">{index + 4}</Text>
                            </View>
                            <View className="w-10 h-10 rounded-full overflow-hidden mr-4 border border-gray-100">
                                {user.avatarUrl ? (
                                    <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
                                ) : (
                                    <View className="w-full h-full items-center justify-center">
                                        <Text className="text-gray-300 text-sm font-geist-sb">{user.name.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-geist-sb text-base" numberOfLines={1}>
                                    {getFirstName(user.name)}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-600 font-geist-sb text-base">
                                    {user.longestStreak}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {list.length === 0 && (
                        <View className="items-center justify-center py-20">
                            <Medal size={48} color="#e5e7eb" strokeWidth={1.5} />
                            <Text className="text-gray-400 font-geist-md mt-4">No rankings yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* My Rank Sticky Bottom Bar */}
            <View 
                style={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20,
                    paddingTop: 18,
                    paddingHorizontal: 24,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    backgroundColor: '#FF6A00',
                    zIndex: 1000,
                }} 
                className="flex-row items-center"
            >
                <View className="w-16 items-center justify-center">
                    <Text className="text-white font-geist-b text-base">93</Text>
                </View>
                <View style={{ width: 35, height: 35, borderRadius: 100, borderWidth: 0, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginRight: 16 }}>
                    <Image 
                        source={{ uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200" }} 
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                </View>
                <View className="flex-1 flex-row items-center justify-between">
                    <Text className="text-white font-geist-sb text-base">Stephen</Text>
                    <Text className="text-white font-geist-sb text-base">98773</Text>
                </View>
            </View>
        </View>
    );
}
