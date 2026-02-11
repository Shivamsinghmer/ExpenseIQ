import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded) {
        return (
            <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/sign-in" />;
}
