import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import Onboarding from "../components/Onboarding";

export default function Index() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                // Forcing true during development review:
                // If you want it to hide later, uncomment the SecureStore logic and adjust.
                // const hasSeen = await SecureStore.getItemAsync("hasSeenOnboarding");
                setShowOnboarding(true); 
            } catch (error) {
                setShowOnboarding(true);
            }
        };
        checkOnboarding();
    }, []);

    useEffect(() => {
        if (!isLoaded || showOnboarding === null) return;

        if (isSignedIn) {
            router.replace("/(tabs)/dashboard");
        } else if (!showOnboarding) {
            router.replace("/(auth)/sign-up");
        }
    }, [isSignedIn, isLoaded, showOnboarding]);

    if (!isLoaded || showOnboarding === null) {
        return (
            <View className="flex-1 items-center justify-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color="#FF6A00" />
            </View>
        );
    }

    if (showOnboarding && !isSignedIn) {
        return (
            <Onboarding
                onComplete={async () => {
                    await SecureStore.setItemAsync("hasSeenOnboarding", "true");
                    router.replace("/(auth)/sign-up");
                }}
            />
        );
    }

    return null;
}
