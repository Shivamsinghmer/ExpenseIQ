import { Tabs, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, LayoutChangeEvent, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState, useCallback } from "react";
import { Home, List, Plus, Tags, BarChart3 } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import AddExpenseSheet from "../../components/AddExpenseSheet";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";

const VISIBLE_TABS = ["dashboard", "transactions", "ai"];

const TAB_META: Record<string, { icon: any; label: string }> = {
    dashboard: { icon: Home, label: "Home" },
    transactions: { icon: List, label: "Transactions" },
    ai: { icon: BarChart3, label: "Analytics" },
};

function CustomTabBar({ state, descriptors, navigation, onAddPress }: any) {
    const { bottom } = useSafeAreaInsets();
    const tabWidths = useRef<number[]>([]).current;
    const tabXPositions = useRef<number[]>([]).current;
    const [measured, setMeasured] = useState(false);

    // Filter to only visible tabs and find which visible index is active
    const visibleRoutes = state.routes.filter((r: any) => VISIBLE_TABS.includes(r.name));
    const activeVisibleIndex = visibleRoutes.findIndex(
        (r: any) => state.routes[state.index]?.name === r.name
    );

    const indicatorX = useSharedValue(0);
    const indicatorW = useSharedValue(0);

    useEffect(() => {
        if (measured && activeVisibleIndex >= 0 && tabXPositions[activeVisibleIndex] !== undefined) {
            const config = { duration: 250, easing: Easing.out(Easing.quad) };
            indicatorX.value = withTiming(tabXPositions[activeVisibleIndex], config);
            indicatorW.value = withTiming(tabWidths[activeVisibleIndex], config);
        }
    }, [activeVisibleIndex, measured]);

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        width: indicatorW.value,
    }));

    const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabXPositions[index] = x;
        tabWidths[index] = width;
        if (index === visibleRoutes.length - 1) {
            setMeasured(true);
            // Set initial position without animation
            if (activeVisibleIndex >= 0) {
                indicatorX.value = tabXPositions[activeVisibleIndex] || 0;
                indicatorW.value = tabWidths[activeVisibleIndex] || 0;
            }
        }
    };

    return (
        <View className="absolute flex-row items-center gap-3" style={{ bottom: Platform.OS === 'ios' ? bottom + 6 : 16, left: 20, right: 20 }}>
            {/* The main pill for navigation */}
            <View
                className="flex-1 rounded-[100px] overflow-hidden border border-gray-100/60 bg-white"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.12,
                    shadowRadius: 24,
                    elevation: 16,
                }}
            >
                <View className="flex-row w-full px-1 items-center h-[60px]">
                    {/* Animated sliding indicator */}
                    {measured && (
                        <Animated.View
                            className="absolute h-[52px] rounded-full bg-[#FF8533]"
                            style={[animatedIndicatorStyle, { top: 4 }]}
                        />
                    )}

                    {visibleRoutes.map((route: any, index: number) => {
                        const isFocused = state.routes[state.index]?.name === route.name;
                        const meta = TAB_META[route.name];
                        if (!meta) return null;
                        const Icon = meta.icon;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                onLayout={(e) => handleTabLayout(index, e)}
                                activeOpacity={0.7}
                                className="flex-1 items-center justify-center h-[52px] rounded-full"
                            >
                                <Icon size={22} color={isFocused ? "#FFFFFF" : "#475569"} strokeWidth={isFocused ? 2.5 : 2} />
                                <Text className={`text-[10px] mt-0.5 ${isFocused ? 'text-white font-geist-b' : 'text-slate-500 font-geist-md'}`}>
                                    {meta.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* The Floating Add Button next to the pill */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onAddPress}
                className="w-[60px] h-[60px] bg-[#111827] rounded-full items-center justify-center"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 16,
                }}
            >
                <Plus size={32} color="#FFFFFF" strokeWidth={1.5} />
            </TouchableOpacity>
        </View>
    );
}

export default function TabsLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    const sheetRef = useRef<BottomSheet>(null);
    const smsSheetRef = useRef<BottomSheet>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [pastedSMS, setPastedSMS] = useState("");

    const openSheet = () => {
        setIsSheetOpen(true);
        sheetRef.current?.snapToIndex(0);
    };

    const handleParseSMS = () => {
        if (!pastedSMS.trim()) {
            Alert.alert("Error", "Please paste an SMS first.");
            return;
        }

        // Simple banking SMS parsing logic
        const amountMatch = pastedSMS.match(/(?:INR|Rs\.?|₹)\s?(\d+(?:\.\d+)?)/i);
        const merchantMatch = pastedSMS.match(/(?:at|to|vpa|merch:)\s*([A-Za-z0-9\s._-]+?)(?:\s*(?:on|using|via|for|ref|\d)|$)/i);

        if (amountMatch || merchantMatch) {
            // Signal AddExpenseSheet to update its state
            // We'll pass these as props or use a shared state if needed
            // For now, let's just close the SMS sheet and notify
            Alert.alert("SMS Parsed", `Detected Amount: ${amountMatch?.[1] || "N/A"}`);
        }
        
        smsSheetRef.current?.close();
    };

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
        <View style={{ flex: 1 }}>
            <Tabs
                tabBar={(props) => <CustomTabBar {...props} onAddPress={openSheet} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen name="dashboard" />
                <Tabs.Screen name="transactions" />
                <Tabs.Screen name="add" options={{ href: null }} />
                <Tabs.Screen name="tags" options={{ href: null }} />
                <Tabs.Screen name="ai" />
            </Tabs>
            
            <AddExpenseSheet 
                ref={sheetRef} 
                onClose={() => setIsSheetOpen(false)} 
                onUpgrade={() => router.push("/subscription")}
                onSMSPress={() => smsSheetRef.current?.expand()}
                smsData={pastedSMS}
            />

            {/* Separate SMS Sheet at Layout Level for Total Stability */}
            <BottomSheet
                ref={smsSheetRef}
                index={-1}
                snapPoints={["60%"]}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: "#F9FAFB", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <View className="flex-row items-center justify-between px-6 pt-2 pb-6">
                    <TouchableOpacity onPress={() => smsSheetRef.current?.close()}>
                        <Text className="text-gray-500 text-base font-geist-md">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-geist-sb">Paste SMS</Text>
                    <View className="w-10" />
                </View>

                <View className="px-5">
                    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-3">Paste Bank SMS</Text>
                        <TextInput
                            className="text-gray-800 text-sm font-geist-md min-h-[140px]"
                            placeholder="Paste your bank SMS here..."
                            placeholderTextColor="#9ca3af"
                            value={pastedSMS}
                            onChangeText={setPastedSMS}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={handleParseSMS}
                        className="w-full mt-6 py-4 rounded-[100px] bg-[#FF6A00] items-center justify-center flex-row"
                    >
                        <Text className="text-white font-geist-b text-base">Parse SMS</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </View>
    );
}
