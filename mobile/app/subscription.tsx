import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
    View, Text, Pressable, ScrollView, ActivityIndicator, Platform, Dimensions,
    Modal, TouchableWithoutFeedback, TouchableOpacity
} from "react-native";
import { useModal } from "../providers/ModalProvider";
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
import { useCurrency } from "../providers/CurrencyProvider";

const PLAN_PRICES: any = {
    monthly: {
        INR: 100,
        USD: 1.49,
        EUR: 1.39,
        GBP: 1.19,
        JPY: 200,
        AED: 5.99
    },
    annual: {
        INR: 1020,
        USD: 14.99,
        EUR: 13.99,
        GBP: 11.99,
        JPY: 2000,
        AED: 54.99
    }
};

const { width } = Dimensions.get("window");

export default function SubscriptionScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [showPlanDropdown, setShowPlanDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const planTriggerRef = useRef<View>(null);
    const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
    const { getToken } = useAuth();
    const { currency } = useCurrency();

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
                            showModal("Welcome to Pro!", "Experience the full power of ExpensePal.");
                            await checkSubscriptionStatus();
                            handleBack();
                        } catch (err) {
                            showModal("Payment Pending", "Your subscription is being activated.");
                        }
                    },
                    onError: (error: any, orderId: string) => {
                        showModal("Payment Failed", error.getMessage ? error.getMessage() : "Something went wrong.");
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
            const currencyCode = currency.code as keyof typeof PLAN_PRICES.monthly;
            const amount = PLAN_PRICES[selectedPlan][currencyCode] || (selectedPlan === 'monthly' ? 100 : 1020);
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
            showModal("Oh no!", "Failed to initiate payment.");
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
                        {/* Plan Dropdown - Relative Position */}
                        <View className="mb-8 items-center" ref={planTriggerRef}>
                            <TouchableOpacity 
                                onPress={() => {
                                    planTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownPosition({ top: y + height + 5, right: Dimensions.get('window').width - (x + width) + 40 });
                                        setShowPlanDropdown(true);
                                    });
                                }}
                                activeOpacity={0.9}
                                className="bg-[#FF6A00] dark:bg-slate-900 px-6 py-2.5 rounded-full flex-row items-center justify-between min-w-[200px]"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-white dark:text-white font-geist-sb text-base mr-2">
                                        {selectedPlan === 'monthly' ? "Monthly Billing" : "Annual Billing"}
                                    </Text>
                                    {selectedPlan === 'annual' && (
                                        <View className="px-2 py-0.5 bg-green-500 rounded-full">
                                            <Text className="text-white text-[8px] font-geist-b">SAVE 15%</Text>
                                        </View>
                                    )}
                                </View>
                                <ChevronRight size={18} color="white" style={{ transform: [{ rotate: showPlanDropdown ? '90deg' : '0deg' }] }} />
                            </TouchableOpacity>

                            {showPlanDropdown && (
                                <Modal transparent visible={showPlanDropdown} animationType="fade" onRequestClose={() => setShowPlanDropdown(false)}>
                                    <TouchableWithoutFeedback onPress={() => setShowPlanDropdown(false)}>
                                        <View className="flex-1 bg-transparent">
                                            <View 
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: dropdownPosition.top, 
                                                    right: dropdownPosition.right,
                                                    minWidth: 215 
                                                }}
                                                className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-slate-800 p-1 z-[999]"
                                            >
                                                {[
                                                    { label: "Monthly Billing", value: "monthly", sub: `${currency.symbol}${PLAN_PRICES.monthly[currency.code] || 100} / month` },
                                                    { label: "Annual Billing", value: "annual", sub: `${currency.symbol}${PLAN_PRICES.annual[currency.code] || 1020} / year • Save 15%`, highlight: true }
                                                ].map((p) => (
                                                    <TouchableOpacity
                                                        key={p.value}
                                                        onPress={() => { setSelectedPlan(p.value as any); setShowPlanDropdown(false); }}
                                                        className={`px-8 py-2 rounded-full ${selectedPlan === p.value ? "bg-[#FF6A00]" : ""}`}
                                                    >
                                                        <View className="flex-row items-center justify-between">
                                                            <View>
                                                                <Text className={`font-geist-sb text-base ${selectedPlan === p.value ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
                                                                    {p.label}
                                                                </Text>
                                                                <Text className={`font-geist-md text-xs ${selectedPlan === p.value ? "text-white/80" : "text-gray-500"}`}>
                                                                    {p.sub}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            )}
                        </View>

                        <View className="items-center mb-8">
                            <View className="flex-row items-baseline">
                                <Text className="text-gray-900 text-6xl font-geist-b">
                                    {currency.symbol}{PLAN_PRICES[selectedPlan][currency.code] || (selectedPlan === 'monthly' ? '100' : '1020')}
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
                            <Text className="text-gray-400 font-geist-md text-xs ml-2">Secure payment via PhonePe</Text>
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
