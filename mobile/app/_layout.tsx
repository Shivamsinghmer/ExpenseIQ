import React, { useEffect } from "react";
import { Stack } from "expo-router";
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
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <QueryProvider>
                    <ThemeProvider>
                        <SheetProvider>
                            <StatusBarWrapper />
                            <Stack screenOptions={{ headerShown: false }} />
                        </SheetProvider>
                    </ThemeProvider>
                </QueryProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
