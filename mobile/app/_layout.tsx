import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../providers/auth-provider";
import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider, useTheme } from "../providers/theme-provider";
import "../global.css";

function StatusBarWrapper() {
    const { isDark } = useTheme();
    return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <QueryProvider>
                <ThemeProvider>
                    <StatusBarWrapper />
                    <Stack screenOptions={{ headerShown: false }} />
                </ThemeProvider>
            </QueryProvider>
        </AuthProvider>
    );
}
