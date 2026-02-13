import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../providers/theme-provider";

const { width } = Dimensions.get("window");

export default function SubscriptionPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    return (
        <View className="flex-1 bg-white dark:bg-background-dark">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header with Image */}
                <View className="relative items-center">
                    <Image
                        source={require("../assets/subscription.png")}
                        className="w-full h-80 mt-10"
                        resizeMode="contain"
                    />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginTop: insets.top + 10 }}
                        className="absolute left-6 bg-black/20 dark:bg-white/10 p-2 rounded-full"
                    >
                        <ArrowLeft size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                <View className="px-6 py-2">
                    {/* Title Section */}
                    <View className="flex-row items-center mb-0">
                        <Text className="text-4xl font-bold text-slate-900 dark:text-white mr-2">
                            Expense
                        </Text>
                        <View style={{ height: 60, width: 100, justifyContent: 'center' }}>
                            <Svg height="60" width="100">
                                <Defs>
                                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                        <Stop offset="0" stopColor="#6366f1" stopOpacity="1" />
                                        <Stop offset="1" stopColor="#a855f7" stopOpacity="1" />
                                    </LinearGradient>
                                </Defs>
                                <SvgText
                                    fill="url(#grad)"
                                    fontSize="40"
                                    fontWeight="900"
                                    x="0"
                                    y="42"
                                >
                                    Pro
                                </SvgText>
                            </Svg>
                        </View>
                    </View>

                    <Text className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                        Unlock premium features and take full control of your finances.
                    </Text>

                    {/* Features List */}
                    <View className="space-y-3 mb-6">
                        {[
                            "Unlimited Custom Tags",
                            "Advanced PDF Reports",
                            "Unlimited AI Financial Assistant",
                        ].map((feature, index) => (
                            <View key={index} className="flex-row items-center mb-3">
                                <CheckCircle2 size={20} color={isDark ? "white" : "black"} />
                                <Text className="ml-3 text-slate-700 dark:text-slate-200 font-medium">
                                    {feature}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Pricing Plans */}
                    <View className="space-y-4 gap-4">
                        {/* Pro Plan */}
                        <View
                            className="p-6 rounded-3xl border-2 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 border-slate-900 dark:border-indigo-500"
                        >
                            <View>
                                <Text className="text-slate-900 dark:text-white text-xl font-bold">Pro Plan</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm">Billed every month</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-900 dark:text-white text-2xl font-black">₹50</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">per month</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        className="bg-slate-900 dark:bg-indigo-600 py-5 rounded-2xl items-center mt-10 shadow-lg"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-bold text-lg">
                            Continue with Pro
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6 px-10">
                        Recurring billing. Cancel anytime in your account settings.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}


