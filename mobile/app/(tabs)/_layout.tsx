import { Tabs, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../../providers/theme-provider";
import { useEffect } from "react";

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
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace("/(auth)/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) {
        return (
            <View className="flex-1 items-center justify-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color="#ff3333" />
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc", // background-dark / background
                    shadowColor: "transparent",
                    elevation: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#e2e8f0", // border-dark / border
                    height: 100,
                },
                headerTitleStyle: {
                    fontWeight: "800",
                    fontSize: 24,
                    color: isDark ? "#fff" : "#1e293b",
                },
                headerTitleAlign: "left",
                tabBarStyle: {
                    backgroundColor: isDark ? "#1e293b" : "#ffffff", // surface-dark / surface
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                    borderRadius: 25,
                },
                tabBarActiveTintColor: "#6366f1", // primary
                tabBarInactiveTintColor: isDark ? "#64748b" : "#94a3b8", // muted-fg
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    headerShown: false,
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
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="ai" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}
