import React, { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { CLERK_PUBLISHABLE_KEY } from "../../lib/config";
import { setAuthToken } from "../../services/api";

// Secure token cache using Expo SecureStore
const tokenCache = {
    async getToken(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (err) {
            console.error("SecureStore get error:", err);
            return null;
        }
    },
    async saveToken(key: string, value: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (err) {
            console.error("SecureStore save error:", err);
        }
    },
};

// Component to sync Clerk token with API client
function TokenSync({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        const syncToken = async () => {
            const token = await getToken();
            setAuthToken(token);
        };
        syncToken();

        // Re-sync token periodically
        const interval = setInterval(syncToken, 50000);
        return () => clearInterval(interval);
    }, [getToken]);

    return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const publishableKey = CLERK_PUBLISHABLE_KEY;

    console.log("[AuthProvider] Clerk key:", publishableKey ? `${publishableKey.substring(0, 10)}...` : "EMPTY!");

    if (!publishableKey) {
        console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    }

    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
                <TokenSync>{children}</TokenSync>
            </ClerkLoaded>
        </ClerkProvider>
    );
}
