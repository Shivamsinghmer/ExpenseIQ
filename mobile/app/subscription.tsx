import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert, Platform, Dimensions } from "react-native";
import { useTheme } from "../providers/theme-provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Crown, ShieldCheck, Zap, ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { paymentsAPI, setAuthToken } from "../services/api";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";
import {
    CFSession,
    CFPaymentComponentBuilder,
    CFPaymentModes,
    CFDropCheckoutPayment,
    CFThemeBuilder,
    CFEnvironment
} from "cashfree-pg-api-contract";
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function SubscriptionScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

    const [trialEndDate, setTrialEndDate] = useState<string | null>(null);

    const { getToken } = useAuth(); // NEW: Hook to access token

    const handleBack = () => {
        if (navigation.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/dashboard");
        }
    };

    const checkSubscriptionStatus = async () => {
        try {
            // Ensure token is set before calling API
            const token = await getToken();
            if (token) {
                setAuthToken(token); // Update API client with fresh token
            }
            const response = await paymentsAPI.checkStatus();
            setIsPro(response.data.isPro);
            setExpiresAt(response.data.proExpiresAt || null);
            setTrialEndDate(response.data.trialEndDate || null);
        } catch (error) {
            console.error("Failed to check subscription:", error);
        }
    };

    const getTrialStatus = () => {
        if (isPro) return null;

        // DEBUG: If trialEndDate is missing, show a warning or handle it.
        if (!trialEndDate) {
            // For debugging purposes, if we think they SHOULD have a trial but don't:
            // return { active: false, message: "No Trial Data" }; 
            return null;
        }

        const end = new Date(trialEndDate);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();

        if (diffMs <= 0) return { active: false, message: "Free Trial Expired" };

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let timeString = "";
        if (diffDays > 0) {
            timeString = `${diffDays}d ${diffHours}h`;
        } else {
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            timeString = `${diffHours}h ${diffMinutes}m`;
        }

        return { active: true, message: `Free Trial Active • Ends in ${timeString}` };
    };

    const trialStatus = getTrialStatus();

    useFocusEffect(
        useCallback(() => {
            checkSubscriptionStatus();
        }, [])
    );

    useEffect(() => {
        // MOVED TO useFocusEffect: checkSubscriptionStatus();

        if (Platform.OS !== 'web') {
            try {
                CFPaymentGatewayService.setCallback({
                    onVerify: async (orderId: string) => {
                        console.log("Payment Verified (Client):", orderId);
                        try {
                            // Ensure token is available for verification as well
                            const token = await getToken();
                            if (token) setAuthToken(token);

                            // Call verification API
                            await paymentsAPI.verifyOrder(orderId);
                            Alert.alert("Success", "Your payment was successful! You are now a Pro user.");
                            await checkSubscriptionStatus();
                            handleBack(); // Go back to dashboard on success
                        } catch (err) {
                            console.error("Verification failed:", err);
                            Alert.alert("Payment Received", "Processing your membership. Please check back in a moment.");
                        }
                    },
                    onError: (error: any, orderId: string) => {
                        console.log("Payment Error:", error, orderId);
                        Alert.alert("Payment Failed", error.getMessage ? error.getMessage() : "Something went wrong.");
                    }
                });
            } catch (e) {
                console.error("Cashfree Callback Error:", e);
            }
        }

        return () => {
            if (Platform.OS !== 'web') {
                try {
                    CFPaymentGatewayService.removeCallback();
                } catch (e) { }
            }
        };
    }, []);

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const amount = selectedPlan === 'monthly' ? 50 : 500;
            const response = await paymentsAPI.createOrder(amount);
            const { payment_session_id, order_id, environment } = response.data;

            const cfEnv = environment === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

            const session = new CFSession(payment_session_id, order_id, cfEnv);

            const paymentComponent = new CFPaymentComponentBuilder()
                .add(CFPaymentModes.CARD)
                .add(CFPaymentModes.UPI)
                .add(CFPaymentModes.NB)
                .add(CFPaymentModes.WALLET)
                .build();

            const theme = new CFThemeBuilder()
                .setNavigationBarBackgroundColor(isDark ? "#0F0F23" : "#FFFFFF")
                .setNavigationBarTextColor(isDark ? "#FFFFFF" : "#000000")
                .setButtonBackgroundColor(isDark ? "#818cf8" : "#4f46e5")
                .setButtonTextColor("#FFFFFF")
                .build();

            const dropCheckoutPayment = new CFDropCheckoutPayment(session, paymentComponent, theme);

            CFPaymentGatewayService.doPayment(dropCheckoutPayment);
        } catch (error: any) {
            console.error("Upgrade Error:", error);
            Alert.alert("Error", "Failed to initiate payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: <Zap size={24} color="#818cf8" />,
            title: "Real-time AI Analysis",
            desc: "Get instant insights into your spending habits with our advanced AI assistant."
        },
        {
            icon: <ShieldCheck size={24} color="#818cf8" />,
            title: "Advanced Reports",
            desc: "Deep-dive into your finances with custom date ranges and exportable PDF reports."
        },
        {
            icon: <Check size={24} color="#818cf8" />,
            title: "Unlimited Transactions",
            desc: "No limits on how many expenses or income entries you can track."
        }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* Header/Hero Section */}
                <View className="relative h-72 bg-slate-900 rounded-b-[40px] overflow-hidden justify-center items-center">
                    <View className="absolute inset-0 opacity-40">
                        <Svg height="100%" width="100%">
                            <Defs>
                                <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor="#4f46e5" stopOpacity="1" />
                                    <Stop offset="1" stopColor="#818cf8" stopOpacity="0.5" />
                                </LinearGradient>
                            </Defs>
                            <SvgText
                                fill="url(#grad)"
                                fontSize="120"
                                fontWeight="bold"
                                x="50%"
                                y="60%"
                                textAnchor="middle"
                                opacity="0.1"
                            >
                                PRO
                            </SvgText>
                        </Svg>
                    </View>

                    <Pressable
                        onPress={handleBack}
                        className="absolute top-12 left-6 z-10 p-2 bg-white/10 rounded-full"
                    >
                        <ArrowLeft size={24} color="white" />
                    </Pressable>

                    <View className="mb-4">
                        <Crown size={64} color="#fcd34d" />
                    </View>
                    <Text className="text-white text-3xl font-bold tracking-tight">Upgrade to Pro</Text>
                    <Text className="text-slate-400 mt-2 text-base">Unlock the full power of ExpenseIQ</Text>


                </View>

                {/* Pricing Card */}
                <View className="px-6 -mt-10">
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700">

                        {/* Trial Status Banner */}
                        {trialStatus && (
                            <View className={`mb-6 p-3 rounded-xl flex-row items-center justify-center ${trialStatus.active ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                                {trialStatus.active ? (
                                    <CheckCircle2 size={18} color={isDark ? "#818cf8" : "#4f46e5"} className="mr-2" />
                                ) : (
                                    <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                )}
                                <Text className={`font-bold text-sm ${trialStatus.active ? "text-indigo-700 dark:text-indigo-300" : "text-red-700 dark:text-red-300"}`}>
                                    {trialStatus.message}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-slate-900 dark:text-white text-2xl font-bold">Pro Plan</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm">Best for personal power users</Text>
                            </View>
                            <View className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs">POPULAR</Text>
                            </View>
                        </View>

                        {/* Plan Toggle */}
                        <View className="flex-row bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl mb-6">
                            <Pressable
                                onPress={() => setSelectedPlan('monthly')}
                                className="flex-1 py-2 px-4 rounded-lg items-center"
                                style={selectedPlan === 'monthly' ? { backgroundColor: isDark ? '#475569' : '#FFFFFF', shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                            >
                                <Text className={`font-semibold ${selectedPlan === 'monthly' ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    Monthly
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setSelectedPlan('annual')}
                                className="flex-1 py-2 px-4 rounded-lg items-center"
                                style={selectedPlan === 'annual' ? { backgroundColor: isDark ? '#475569' : '#FFFFFF', shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                            >
                                <Text className={`font-semibold ${selectedPlan === 'annual' ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    Annual
                                </Text>
                            </Pressable>
                        </View>

                        <View className="flex-row items-baseline mb-8">
                            <Text className="text-slate-900 dark:text-white text-5xl font-extrabold">
                                {selectedPlan === 'monthly' ? '₹50' : '₹500'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 ml-2 text-lg">
                                {selectedPlan === 'monthly' ? '/ month' : '/ year'}
                            </Text>
                        </View>

                        <View className="space-y-4 gap-5">
                            {features.map((item, index) => (
                                <View key={index} className="flex-row items-start features-item">
                                    <View className="mr-4 mt-1">
                                        {item.icon}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 dark:text-white font-bold text-base">{item.title}</Text>
                                        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Button */}
                        <Pressable
                            className={`mt-10 py-4 rounded-2xl gap-3 flex-row items-center justify-center ${isPro ? "bg-green-600" : "bg-black shadow-lg shadow-indigo-300"}`}
                            disabled={loading || isPro}
                            onPress={handleUpgrade}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <View className="gap-10">
                                        <Crown size={20} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-lg text-center">
                                            {isPro ? "You are Pro!" : `Upgrade for ${selectedPlan === 'monthly' ? '₹50' : '₹500'}`}
                                        </Text>
                                        {isPro && expiresAt && (
                                            <Text className="text-white/80 text-sm font-medium mt-1 text-center">
                                                {(() => {
                                                    const expiryDate = new Date(expiresAt);
                                                    const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                    return daysRemaining > 0
                                                        ? `${daysRemaining} days remaining`
                                                        : `Expires on ${expiryDate.toLocaleDateString()}`;
                                                })()}
                                            </Text>
                                        )}
                                    </View>
                                </>
                            )}
                        </Pressable>

                        <Text className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6 px-4">
                            One-time or recurring billing options available at checkout. Secure payment via Cashfree.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
