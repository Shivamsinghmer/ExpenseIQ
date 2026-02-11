import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Image
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";

export default function SignUp() {
    const { signUp, setActive, isLoaded } = useSignUp();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignUp = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");
        try {
            await signUp.create({ firstName: name, emailAddress: email, password });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");
        try {
            const result = await signUp.attemptEmailAddressVerification({ code });
            if (result.status === "complete") {
                if (setActive) await setActive({ session: result.createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 justify-center px-6 py-12">
                    <View className="items-center mb-8">
                        <View className="mb-4 shadow-sm">
                            <Image
                                source={require("../../assets/logo.png")}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-black text-border uppercase tracking-tight text-center">
                            {pendingVerification ? "Verify Email" : "Create Account"}
                        </Text>
                        <Text className="text-muted-fg text-sm mt-2 text-center font-medium max-w-[280px] leading-5">
                            {pendingVerification ? "Enter the verification code sent to your email" : "Join ExpenseIQ to master your personal finances"}
                        </Text>
                    </View>

                    <View className="bg-surface border-2 border-border p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        {!pendingVerification ? (
                            <View className="space-y-5">
                                <View>
                                    <Text className="text-border font-bold text-sm mb-2 ml-1">Full Name</Text>
                                    <TextInput
                                        className="bg-surface border-2 border-border rounded-xl px-4 py-3.5 text-border text-base font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        placeholder="John Doe"
                                        placeholderTextColor="#a3a3a3"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>
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
                                        placeholder="Min 8 characters"
                                        placeholderTextColor="#a3a3a3"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>

                                {error ? (
                                    <View className="bg-red-50 border-2 border-destructive rounded-xl p-3 flex-row items-center justify-center">
                                        <Text className="text-destructive font-bold text-sm text-center">{error}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    onPress={handleSignUp}
                                    disabled={loading || !name || !email || !password}
                                    className={`mt-2 py-4 items-center rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${loading || !name || !email || !password ? "bg-neutral-200 border-neutral-400 shadow-none" : "bg-primary"}`}
                                    activeOpacity={0.9}
                                >
                                    {loading ? <ActivityIndicator color={!name || !email || !password ? "#000" : "#fff"} /> : <Text className={`${loading || !name || !email || !password ? "text-neutral-400" : "text-white"} font-black text-lg uppercase tracking-wider`}>Create Account</Text>}
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
                                        {/* Create a simple G text if icon unavailable, or just 'Continue with Google' */}
                                        <Text className="text-border font-bold text-base">Continue with Google</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-border font-bold text-sm mb-2 ml-1">Verification Code</Text>
                                    <TextInput
                                        className="bg-surface border-2 border-border rounded-xl px-4 py-4 text-border text-2xl font-bold text-center tracking-[12px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        placeholder="000000"
                                        placeholderTextColor="#e5e5e5"
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                                {error ? (
                                    <View className="bg-red-50 border-2 border-destructive rounded-xl p-3">
                                        <Text className="text-destructive font-bold text-sm text-center">{error}</Text>
                                    </View>
                                ) : null}
                                <TouchableOpacity
                                    onPress={handleVerification}
                                    disabled={loading || !code}
                                    className={`mt-4 py-4 items-center rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${loading || !code ? "bg-neutral-200 border-neutral-400 shadow-none" : "bg-primary"}`}
                                    activeOpacity={0.9}
                                >
                                    {loading ? <ActivityIndicator color={!code ? "#000" : "#fff"} /> : <Text className={`${!code ? "text-neutral-400" : "text-white"} font-black text-lg uppercase tracking-wider`}>Verify Email</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {!pendingVerification && (
                        <View className="flex-row justify-center mt-10">
                            <Text className="text-muted-fg text-sm font-medium">Already have an account? </Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text className="text-primary text-sm font-black underline decoration-2 underline-offset-4">Sign In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
