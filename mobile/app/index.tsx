import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            router.replace("/(tabs)/dashboard");
        } else {
            router.replace("/(auth)/welcome");
        }
    }, [isSignedIn, isLoaded]);

    return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
}
