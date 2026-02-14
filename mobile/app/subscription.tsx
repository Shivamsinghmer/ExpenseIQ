import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform, Dimensions } from "react-native";
import { useTheme } from "../providers/theme-provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Crown, ShieldCheck, Zap, ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { paymentsAPI } from "../services/api";
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
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

    useEffect(() => {
        checkSubscriptionStatus();

        try {
            CFPaymentGatewayService.setCallback({
                onVerify: (orderId: string) => {
                    console.log("Payment Verified:", orderId);
                    Alert.alert("Success", "Your payment was successful! You are now a Pro user.");
                    checkSubscriptionStatus();
                },
                onError: (error: any, orderId: string) => {
                    console.log("Payment Error:", error, orderId);
                    Alert.alert("Payment Failed", error.getMessage ? error.getMessage() : "Something went wrong.");
                }
            });
        } catch (e) {
            console.error("Cashfree Callback Error:", e);
        }

        return () => {
            try {
                CFPaymentGatewayService.removeCallback();
            } catch (e) { }
        };
    }, []);

    const checkSubscriptionStatus = async () => {
        try {
            const response = await paymentsAPI.checkStatus();
            setIsPro(response.data.isPro);
        } catch (error) {
            console.error("Failed to check subscription:", error);
        }
    };

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const amount = selectedPlan === 'monthly' ? 50 : 600;
            const response = await paymentsAPI.createOrder(amount);
            const { payment_session_id, order_id } = response.data;

            const session = new CFSession(payment_session_id, order_id, CFEnvironment.SANDBOX);

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

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-6 z-10 p-2 bg-white/10 rounded-full"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>

                    <Crown size={64} color="#fcd34d" className="mb-4" />
                    <Text className="text-white text-3xl font-bold tracking-tight">Upgrade to Pro</Text>
                    <Text className="text-slate-400 mt-2 text-base">Unlock the full power of ExpenseIQ</Text>
                </View>

                {/* Pricing Card */}
                <View className="px-6 -mt-10">
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700">
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
                            <TouchableOpacity
                                onPress={() => setSelectedPlan('monthly')}
                                className={`flex-1 py-2 px-4 rounded-lg items-center ${selectedPlan === 'monthly' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${selectedPlan === 'monthly' ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    Monthly
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSelectedPlan('annual')}
                                className={`flex-1 py-2 px-4 rounded-lg items-center ${selectedPlan === 'annual' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${selectedPlan === 'annual' ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    Annual
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-baseline mb-8">
                            <Text className="text-slate-900 dark:text-white text-5xl font-extrabold">
                                {selectedPlan === 'monthly' ? '₹50' : '₹600'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 ml-2 text-lg">
                                {selectedPlan === 'monthly' ? '/ month' : '/ year'}
                            </Text>
                        </View>

                        <View className="space-y-4 gap-5">
                            {features.map((item, index) => (
                                <View key={index} className="flex-row items-start">
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
                        <TouchableOpacity
                            className={`mt-10 py-4 rounded-2xl gap-3 flex-row items-center justify-center ${isPro ? "bg-green-600" : "bg-black shadow-lg shadow-indigo-300"}`}
                            disabled={loading || isPro}
                            onPress={handleUpgrade}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Crown size={20} color="white" className="gap-10" />
                                    <Text className="text-white font-bold text-lg">
                                        {isPro ? "You are Pro!" : `Upgrade for ${selectedPlan === 'monthly' ? '₹50' : '₹600'}`}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6 px-4">
                            One-time or recurring billing options available at checkout. Secure payment via Cashfree.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
