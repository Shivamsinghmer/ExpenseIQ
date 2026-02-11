import React from "react";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../providers/theme-provider";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    const icons: Record<string, string> = {
        index: "📊",
        add: "➕",
        transactions: "📋",
        tags: "🏷️",
        ai: "🤖",
    };

    return (
        <View className="items-center justify-center">
            <Text className="text-lg">{icons[name] || "📱"}</Text>
        </View>
    );
}

export default function TabsLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const { isDark } = useTheme();

    if (!isLoaded) {
        return (
            <View className="flex-1 items-center justify-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color="#ff3333" />
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: isDark ? "#1a212b" : "#ffffff", // surface-dark / surface
                    shadowColor: "transparent",
                    elevation: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#545454" : "#e0e0e0", // border-dark / border-light (approx)
                },
                headerTintColor: isDark ? "#ffffff" : "#000000",
                headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 18,
                },
                tabBarStyle: {
                    backgroundColor: isDark ? "#1a212b" : "#ffffff", // surface-dark / surface
                    borderTopColor: isDark ? "#545454" : "#e0e0e0", // border-dark / border-light
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: isDark ? "#818cf8" : "#4f46e5", // primary-dark / primary
                tabBarInactiveTintColor: isDark ? "#999999" : "#737373", // muted / input
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="index" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Add",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="add" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: "History",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="transactions" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tags"
                options={{
                    title: "Tags",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="tags" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai"
                options={{
                    title: "AI Chat",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="ai" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}
