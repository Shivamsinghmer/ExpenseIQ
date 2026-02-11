import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Image
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";

export default function SignIn() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const handleGoogleSignIn = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();
            if (createdSessionId && setActive) {
                setActive({ session: createdSessionId });
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, [startOAuthFlow]);

    const handleSignIn = async () => {
        if (!isLoaded) { setError("Authentication service not ready. Please wait and try again."); return; }
        setLoading(true);
        setError("");
        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === "complete") {
                if (setActive) await setActive({ session: result.createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Sign in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 justify-center px-6 py-12">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="mb-6 shadow-sm">
                            <Image
                                source={require("../../assets/logo.png")}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-4xl font-black text-border tracking-tight">ExpenseIQ</Text>
                        <Text className="text-muted-fg text-base font-medium mt-2">Smart financial tracking</Text>
                    </View>

                    {/* Card Container */}
                    <View className="bg-surface border-2 border-border p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <Text className="text-2xl font-bold text-border mb-2">
                            Welcome Back
                        </Text>
                        <Text className="text-muted-fg text-sm mb-8 leading-5">
                            Please sign in to continue to your dashboard.
                        </Text>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-border font-bold text-sm mb-2 ml-1">Email Address</Text>
                                <TextInput
                                    className="bg-surface border-2 border-border rounded-xl px-4 py-3.5 text-border text-base font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    placeholder="name@example.com"
                                    placeholderTextColor="#a3a3a3"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            <View>
                                <Text className="text-border font-bold text-sm mb-2 ml-1">Password</Text>
                                <TextInput
                                    className="bg-surface border-2 border-border rounded-xl px-4 py-3.5 text-border text-base font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    placeholder="Enter your password"
                                    placeholderTextColor="#a3a3a3"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {error ? (
                                <View className="bg-red-50 border-2 border-destructive rounded-xl p-3 flex-row items-center justify-center">
                                    <Text className="text-destructive font-bold text-sm">{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleSignIn}
                                disabled={loading || !email || !password}
                                className={`mt-2 py-4 items-center rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${loading || !email || !password ? "bg-neutral-200 border-neutral-400 shadow-none" : "bg-primary"}`}
                                activeOpacity={0.9}
                            >
                                {loading ? (
                                    <ActivityIndicator color={!email || !password ? "#000" : "#fff"} />
                                ) : (
                                    <Text className={`${loading || !email || !password ? "text-neutral-400" : "text-white"} font-black text-lg uppercase tracking-wider`}>
                                        Sign In
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Divider & Google Sign In */}
                            <View className="flex-row items-center mt-2 mb-2">
                                <View className="flex-1 h-[2px] bg-neutral-200" />
                                <Text className="mx-4 text-xs font-bold text-muted-fg uppercase tracking-widest">Or</Text>
                                <View className="flex-1 h-[2px] bg-neutral-200" />
                            </View>

                            <TouchableOpacity
                                onPress={handleGoogleSignIn}
                                className="py-4 items-center bg-white border-2 border-border rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-border font-bold text-base">Continue with Google</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-muted-fg text-sm font-medium">New to ExpenseIQ? </Text>
                        <Link href="/(auth)/sign-up" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary text-sm font-black underline decoration-2 underline-offset-4">Create Account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
