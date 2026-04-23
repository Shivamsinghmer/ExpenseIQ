import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";

import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from "../providers/auth-provider";
import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider, useTheme } from "../providers/theme-provider";
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from "@expo-google-fonts/geist";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function StatusBarWrapper() {
    const { isDark } = useTheme();
    return <StatusBar style={isDark ? "light" : "dark"} />;
}

import { SheetProvider } from "../providers/sheet-provider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { CurrencyProvider } from "../providers/CurrencyProvider";
import { ModalProvider } from "../providers/ModalProvider";

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "Geist-Regular": Geist_400Regular,
        "Geist-Medium": Geist_500Medium,
        "Geist-SemiBold": Geist_600SemiBold,
        "Geist-Bold": Geist_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return <View style={{ flex: 1, backgroundColor: "#FF6A00" }} />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <AuthProvider>
                    <CurrencyProvider>
                        <ModalProvider>
                            <QueryProvider>
                                <ThemeProvider>
                                    <SheetProvider>
                                        <StatusBarWrapper />
                                        <Stack screenOptions={{ headerShown: false }} />
                                    </SheetProvider>
                                </ThemeProvider>
                            </QueryProvider>
                        </ModalProvider>
                    </CurrencyProvider>
                </AuthProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}
