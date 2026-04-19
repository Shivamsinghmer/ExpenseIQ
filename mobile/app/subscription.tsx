import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Platform, Dimensions } from "react-native";
import { useTheme } from "../providers/theme-provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    Check, Crown, ShieldCheck, Zap, ArrowLeft, CheckCircle2, 
    Sparkles, MessageSquare, Landmark, Wallet, FileText, Gem,
    ChevronRight, Star
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
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

const { width } = Dimensions.get("window");

export default function SubscriptionScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
    const { getToken } = useAuth();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/dashboard" as any);
        }
    };

    const checkSubscriptionStatus = async () => {
        try {
            const token = await getToken();
            if (token) setAuthToken(token);
            const response = await paymentsAPI.checkStatus();
            setIsPro(response.data.isPro);
            setExpiresAt(response.data.proExpiresAt || null);
            setTrialEndDate(response.data.trialEndDate || null);
        } catch (error) {
            console.error("Failed to check subscription:", error);
        }
    };

    const getTrialStatus = () => {
        if (isPro || !trialEndDate) return null;
        const end = new Date(trialEndDate);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();
        if (diffMs <= 0) return { active: false, message: "Free Trial Expired" };
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { active: true, message: `Free Trial: ${diffDays}d ${diffHours}h remaining` };
    };

    const trialStatus = getTrialStatus();

    useFocusEffect(
        useCallback(() => {
            checkSubscriptionStatus();
        }, [])
    );

    useEffect(() => {
        if (Platform.OS !== 'web') {
            try {
                CFPaymentGatewayService.setCallback({
                    onVerify: async (orderId: string) => {
                        try {
                            const token = await getToken();
                            if (token) setAuthToken(token);
                            await paymentsAPI.verifyOrder(orderId);
                            Alert.alert("Welcome to Pro!", "Experience the full power of ExpenseIQ.");
                            await checkSubscriptionStatus();
                            handleBack();
                        } catch (err) {
                            Alert.alert("Payment Pending", "Your subscription is being activated.");
                        }
                    },
                    onError: (error: any, orderId: string) => {
                        Alert.alert("Payment Failed", error.getMessage ? error.getMessage() : "Something went wrong.");
                    }
                });
            } catch (e) {}
        }
        return () => {
            if (Platform.OS !== 'web') {
                try { CFPaymentGatewayService.removeCallback(); } catch (e) {}
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
                .add(CFPaymentModes.CARD).add(CFPaymentModes.UPI).add(CFPaymentModes.NB).add(CFPaymentModes.WALLET).build();
            const theme = new CFThemeBuilder()
                .setNavigationBarBackgroundColor("#FFFFFF").setNavigationBarTextColor("#000000").setButtonBackgroundColor("#FF6A00").setButtonTextColor("#FFFFFF").build();
            const dropCheckoutPayment = new CFDropCheckoutPayment(session, paymentComponent, theme);
            CFPaymentGatewayService.doPayment(dropCheckoutPayment);
        } catch (error: any) {
            Alert.alert("Error", "Failed to initiate payment.");
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: <MessageSquare size={22} color="#FF6A00" />,
            title: "Ask Money AI Chat",
            desc: "Instant answers about your spending powered by AI."
        },
        {
            icon: <Sparkles size={22} color="#FF6A00" />,
            title: "Money Story",
            desc: "Visual, interactive reports of your financial journey and trends."
        },
        {
            icon: <Landmark size={22} color="#FF6A00" />,
            title: "EMI & Debt Tracker",
            desc: "Smart calculator and manager for all your loans and obligations."
        },
        {
            icon: <Wallet size={22} color="#FF6A00" />,
            title: "Budget Envelopes",
            desc: "Disciplined allocation of funds for your lifestyle goals."
        },
        {
            icon: <FileText size={22} color="#FF6A00" />,
            title: "Advanced PDF Reports",
            desc: "Professional-grade exports for tax filing and financial planning."
        },
        {
            icon: <ShieldCheck size={22} color="#FF6A00" />,
            title: "Priority Support",
            desc: "Direct access to our premium assistance team."
        }
    ];

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                
                {/* Header Section */}
                <View className="px-6 pt-12 pb-8 bg-[#F9FAFB]">
                    <Pressable onPress={handleBack} className="w-10 h-10 bg-white border border-gray-100 rounded-full items-center justify-center shadow-sm mb-8">
                        <ArrowLeft size={20} color="#1F2937" />
                    </Pressable>
                    
                    <View className="flex-row items-center mb-4">
                        <View className="px-3 py-1 bg-orange-100 rounded-full flex-row items-center">
                            <Star size={12} color="#FF6A00" fill="#FF6A00" />
                            <Text className="text-[#FF6A00] font-geist-b text-[10px] uppercase ml-1 tracking-tight">Premium Experience</Text>
                        </View>
                    </View>
                    
                    <Text className="text-[#111827] text-[40px] font-geist-b leading-[48px]">Upgrade to{"\n"}ExpensePal Pro</Text>
                    <Text className="text-gray-500 mt-4 text-base font-geist-md leading-6">Unlock powerful AI insights and advanced financial tools used by 10k+ power users.</Text>
                </View>

                <View className="px-6 mt-8">
                    {/* Trial Status */}
                    {trialStatus && (
                        <View className={`mb-8 p-4 rounded-2xl flex-row items-center ${trialStatus.active ? "bg-orange-50 border border-orange-100" : "bg-red-50 border border-red-100"}`}>
                            <Zap size={18} color={trialStatus.active ? "#FF6A00" : "#EF4444"} />
                            <Text className={`font-geist-sb text-sm ml-3 ${trialStatus.active ? "text-orange-700" : "text-red-700"}`}>
                                {trialStatus.message}
                            </Text>
                        </View>
                    )}

                    {/* Features List */}
                    <Text className="text-gray-400 font-geist-b text-xs uppercase tracking-widest mb-6 px-1">What's Included</Text>
                    <View className="space-y-6 gap-6 mb-12">
                        {features.map((feature, i) => (
                            <View key={i} className="flex-row items-start">
                                <View className="w-10 h-10 rounded-2xl bg-orange-50 items-center justify-center mr-4">
                                    {feature.icon}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#1F2937] font-geist-sb text-base">{feature.title}</Text>
                                    <Text className="text-gray-500 font-geist-md text-sm mt-0.5" leading-5>{feature.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Pricing Cards */}
                    <View className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200">
                        <View className="flex-row bg-[#F3F4F6] p-1.5 rounded-2xl mb-8">
                            <Pressable 
                                onPress={() => setSelectedPlan('monthly')}
                                className={`flex-1 py-3 rounded-xl items-center ${selectedPlan === 'monthly' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`font-geist-sb text-sm ${selectedPlan === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => setSelectedPlan('annual')}
                                className={`flex-1 py-3 rounded-xl items-center relative ${selectedPlan === 'annual' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <View className="absolute -top-1 -right-1 px-2 py-0.5 bg-green-500 rounded-full z-10">
                                    <Text className="text-white text-[8px] font-geist-b">SAVE 15%</Text>
                                </View>
                                <Text className={`font-geist-sb text-sm ${selectedPlan === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>Annual</Text>
                            </Pressable>
                        </View>

                        <View className="items-center mb-8">
                            <View className="flex-row items-baseline">
                                <Text className="text-gray-900 text-6xl font-geist-b">
                                    {selectedPlan === 'monthly' ? '₹50' : '₹500'}
                                </Text>
                                <Text className="text-gray-500 ml-2 text-lg font-geist-md">
                                    {selectedPlan === 'monthly' ? '/ month' : '/ year'}
                                </Text>
                            </View>
                            <Text className="text-gray-400 font-geist-md text-sm mt-2">Billed {selectedPlan === 'monthly' ? 'monthly' : 'annually'}</Text>
                        </View>

                        <Pressable 
                            disabled={loading || isPro}
                            onPress={handleUpgrade}
                            className={`w-full py-3.5 rounded-full flex-row items-center justify-center ${isPro ? 'bg-green-500' : 'bg-[#FF6A00] shadow-lg shadow-orange-200'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-geist-b text-lg">
                                        {isPro ? "Pro Active" : "Get Started Now"}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                        
                        {isPro && expiresAt && (
                            <Text className="text-center text-green-600 font-geist-sb text-xs mt-3">
                                Valid until {new Date(expiresAt).toLocaleDateString()}
                            </Text>
                        )}

                        <View className="mt-6 flex-row items-center justify-center">
                            <ShieldCheck size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 font-geist-md text-xs ml-2">Secure payment via Cashfree</Text>
                        </View>
                    </View>

                    <Text className="text-center text-gray-400 font-geist-md text-[11px] mt-10 leading-4">
                        By subscribing, you agree to our Terms of Service. Your subscription will renew automatically unless cancelled 24h before end of period.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
