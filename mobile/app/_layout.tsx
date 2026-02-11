import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./providers/auth-provider";
import { QueryProvider } from "./providers/query-provider";
import { ThemeProvider, useTheme } from "./providers/theme-provider";
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
                    <Slot />
                </ThemeProvider>
            </QueryProvider>
        </AuthProvider>
    );
}
