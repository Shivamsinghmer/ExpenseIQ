import { Tabs, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { useTheme } from "../../providers/theme-provider";
import { useEffect } from "react";
import { LayoutDashboard, ArrowRightLeft, Plus, Tags, Sparkles } from "lucide-react-native";

function TabIcon({
    icon: Icon,
    color,
    name,
    focused
}: {
    icon: any;
    color: string;
    name: string;
    focused: boolean;
}) {
    return (
        <View className={`items-center justify-center gap-0 ${focused ? 'bg-black px-4 py-5 rounded-full min-w-[80px]' : 'px-2 py-2 min-w-[60px]'}`}>
            <Icon size={24} color={focused ? "white" : "#94a3b8"} />
            <Text
                className={`text-[10px] font-bold ${focused ? "text-white" : "text-slate-400"} text-center`}
                numberOfLines={1}
            >
                {name}
            </Text>
        </View>
    );
}

export default function TabsLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace("/(auth)/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || !isSignedIn) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#000000" />
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    backgroundColor: "white",
                    borderTopColor: "#f1f5f9",
                    borderTopWidth: 1,
                    height: Platform.OS === "ios" ? 100 : 80,
                    paddingTop: 10,
                    paddingHorizontal: 20,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            icon={LayoutDashboard}
                            color={focused ? "black" : "gray"}
                            name="Home"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Transactions",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            icon={ArrowRightLeft}
                            color={focused ? "black" : "gray"}
                            name="Txns"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Add",
                    tabBarIcon: ({ focused }) => (
                        <View className="bg-black h-16 w-16 rounded-full items-center justify-center shadow-lg shadow-gray-400 -mt-12">
                            <Plus size={32} color="white" />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="tags"
                options={{
                    title: "Tags",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            icon={Tags}
                            color={focused ? "black" : "gray"}
                            name="Tags"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai"
                options={{
                    title: "AI",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            icon={Sparkles}
                            color={focused ? "black" : "gray"}
                            name="AI"
                            focused={focused}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
