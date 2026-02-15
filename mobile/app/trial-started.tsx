import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Crown, ArrowRight, Zap } from "lucide-react-native";
import { useTheme } from "../providers/theme-provider";
import { useAuth } from "@clerk/clerk-expo";
import { paymentsAPI, setAuthToken } from "../services/api";

export default function TrialStarted() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState("48 hours");

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = await getToken();
                if (token) setAuthToken(token);
                const res = await paymentsAPI.checkStatus();
                if (res.data.trialEndDate) {
                    const end = new Date(res.data.trialEndDate);
                    const now = new Date();
                    const diffMs = end.getTime() - now.getTime();
                    if (diffMs > 0) {
                        const hours = Math.ceil(diffMs / (1000 * 60 * 60));
                        if (hours > 48) {
                            const days = Math.ceil(hours / 24);
                            setTimeLeft(`${days} days`);
                        } else {
                            setTimeLeft(`${hours} hours`);
                        }
                    } else {
                        setTimeLeft("0 hours");
                    }
                }
            } catch (e) {
                console.error("Failed to fetch trial status:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleContinue = () => {
        router.replace("/(tabs)/dashboard");
    };

    const handleUpgrade = () => {
        router.push("/subscription");
    };

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <View
                className="flex-1 px-8 justify-center items-center"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
            >
                {/* Icon / Illustration */}
                <View className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-8 animate-bounce">
                    <Crown size={48} color={isDark ? "#818cf8" : "#4f46e5"} />
                </View>

                {/* Title */}
                <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">
                    Trial Activated!
                </Text>

                {/* Main Message */}
                <Text className="text-slate-500 dark:text-slate-400 text-center text-lg mb-8 leading-7 font-medium">
                    Your free trial is running. Ends in <Text className="text-indigo-600 dark:text-indigo-400 font-bold">{timeLeft}</Text>.
                </Text>

                {/* Details Card */}
                <View className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 mb-8 shadow-sm">
                    <View className="flex-row items-start mb-4">
                        <CheckCircle2 size={24} color="#10b981" className="mt-0.5 mr-3" />
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">Full Access Unlocked</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">
                                Add unlimited transactions, use AI insights, and meaningful reports.
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-start">
                        <CheckCircle2 size={24} color="#f59e0b" className="mt-0.5 mr-3" />
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">After Trial</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">
                                You will need to upgrade to <Text className="font-bold text-indigo-500">Pro</Text> to continue adding new data.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="w-full gap-3">
                    <TouchableOpacity
                        onPress={handleContinue}
                        className="w-full bg-black dark:bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-bold text-lg mr-2">Start Using App</Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleUpgrade}
                        className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl flex-row items-center justify-center border border-slate-200 dark:border-slate-700"
                        activeOpacity={0.7}
                    >
                        <Zap size={20} color={isDark ? "#94a3b8" : "#475569"} style={{ marginRight: 8 }} />
                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg">Upgrade to Pro Now</Text>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View className="absolute top-10 right-10">
                        <ActivityIndicator size="small" />
                    </View>
                )}
            </View>
        </View>
    );
}
