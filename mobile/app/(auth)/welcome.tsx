import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function Welcome() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current; // Initial opacity for splash (1)
    const contentFadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity for content (0)

    useEffect(() => {

        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setShowSplash(false);
                Animated.timing(contentFadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return (
            <Animated.View style={{ flex: 1, backgroundColor: "black", opacity: fadeAnim }}>
                <StatusBar style="light" />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-white text-4xl font-bold tracking-widest">
                        ExpenseIQ
                    </Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ flex: 1, opacity: contentFadeAnim }} className="bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                <View className="flex-row justify-end px-6 py-4">
                    <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                        <Text className="text-slate-500 font-medium text-lg">Sign In</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-full aspect-square justify-center items-center mb-10">
                        <Image
                            source={require("../../assets/hero.webp")}
                            style={{ width: width, height: width }}
                            resizeMode="contain"
                        />
                    </View>

                    <View className="w-full items-center">
                        <Text className="text-4xl font-bold text-center mb-4 leading-tight">
                            Always take control{'\n'}of your finance
                        </Text>
                        <Text className="text-slate-700 text-center text-lg leading-6 px-4 mb-24">
                            Finances must be arranged to set a better lifestyle in the future.
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="w-full bg-[#1a1a1a] py-4 rounded-xl items-center shadow-lg shadow-gray-400/50"
                        activeOpacity={0.8}
                        onPress={() => router.push("/(auth)/sign-up")}
                    >
                        <Text className="text-white font-bold text-lg">Get Started</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}
