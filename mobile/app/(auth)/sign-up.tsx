import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Platform, Image
} from "react-native";
import { useSignUp, useOAuth, useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";
import * as AuthSession from "expo-auth-session";
import { paymentsAPI, setAuthToken } from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
    useWarmUpBrowser();

    const { signUp, setActive, isLoaded } = useSignUp();
    const { getToken } = useAuth();
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");
        try {
            await signUp.create({ firstName, lastName, emailAddress: email, password });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            console.error("Sign Up Error Details:", JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");
        try {
            const result = await signUp.attemptEmailAddressVerification({ code });
            if (result.status === "complete") {
                if (setActive) await setActive({ session: result.createdSessionId });

                // Smart redirect: Check if user is truly new
                try {
                    // Clerk's setActive can take a moment to propagate to useAuth hooks
                    // Let's try to get the token directly or wait slightly
                    let token = await getToken();
                    if (!token) {
                        // Small retry for token availability
                        await new Promise(resolve => setTimeout(resolve, 500));
                        token = await getToken();
                    }

                    if (token) {
                        setAuthToken(token);
                        const res = await paymentsAPI.checkStatus();
                        const trialStart = res.data.trialStartDate ? new Date(res.data.trialStartDate).getTime() : 0;
                        const now = new Date().getTime();

                        // If user was created within the last 2 minutes, show trial screen
                        if (now - trialStart < 120000 && !res.data.isPro) {
                            router.replace("/trial-started");
                        } else {
                            router.replace("/(tabs)/dashboard");
                        }
                    } else {
                        console.warn("Could not get auth token for redirection check");
                        router.replace("/(tabs)/dashboard");
                    }
                } catch (e) {
                    console.error("Redirection check failed, defaulting to dashboard", e);
                    router.replace("/(tabs)/dashboard");
                }
            } else {
                console.error("Sign up incomplete:", result);
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const handleGoogleSignIn = useCallback(async () => {
        try {
            const redirectUrl = AuthSession.makeRedirectUri({
                path: "oauth-native-callback",
            });
            console.log("OAuth redirectUrl:", redirectUrl);

            const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });

                // Smart redirect: Check if user is truly new
                try {
                    const res = await paymentsAPI.checkStatus();
                    const trialStart = res.data.trialStartDate ? new Date(res.data.trialStartDate).getTime() : 0;
                    const now = new Date().getTime();

                    // If user was created within the last 2 minutes, show trial screen
                    if (now - trialStart < 120000 && !res.data.isPro) {
                        router.replace("/trial-started");
                    } else {
                        router.replace("/(tabs)/dashboard");
                    }
                } catch (e) {
                    console.error("Redirection check failed, defaulting to dashboard", e);
                    router.replace("/(tabs)/dashboard");
                }
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, [startOAuthFlow]);

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1">
                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 }}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid={true}
                    extraScrollHeight={Platform.OS === "ios" ? 20 : 50}
                >
                    {/* Header */}
                    <View className="flex-row justify-end items-center mb-10">
                        <Link href="/(auth)/sign-in" asChild>
                            <TouchableOpacity>
                                <Text className="text-[#FF6A00] font-geist-sb text-base">Log in</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Logo Area */}
                    <Text className="text-[#FF6A00] font-black text-3xl mb-8 tracking-tighter">ExpensePal.</Text>

                    {!pendingVerification ? (
                        <View>
                            <Text className="text-4xl font-geist-b text-gray-900 mb-2">Let's get started</Text>
                            <Text className="text-gray-600 font-geist-md mb-8 text-base">Let's start with some basic information</Text>

                            <View className="flex-row justify-between mb-4">
                                <View className="w-[48%] border border-gray-300 rounded-xl px-4 py-2 bg-white">
                                    <Text className="text-[12px] font-geist-md text-gray-500 mb-1">First name</Text>
                                    <TextInput
                                        className="text-gray-900 text-lg font-geist-md p-0 h-7"
                                        placeholder="Alex"
                                        placeholderTextColor="#9ca3af"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        autoCorrect={false}
                                    />
                                </View>
                                <View className="w-[48%] border border-gray-300 rounded-xl px-4 py-2 bg-white">
                                    <Text className="text-[12px] font-geist-md text-gray-500 mb-1">Last name</Text>
                                    <TextInput
                                        className="text-gray-900 text-lg font-geist-md p-0 h-7"
                                        placeholder="Smith"
                                        placeholderTextColor="#9ca3af"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                            
                            <Text className="text-xs text-gray-500 font-geist-md mb-6 leading-5">Use your legal name. You can add a preferred name later.</Text>

                            <View className="border border-gray-300 rounded-xl px-4 py-2 bg-white mb-4">
                                <Text className="text-[12px] font-geist-md text-gray-500 mb-1">Email</Text>
                                <TextInput
                                    className="text-gray-900 text-lg font-geist-md p-0 h-7"
                                    placeholder="alex.smith@example.com"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View className="border border-gray-300 rounded-xl px-4 py-2 bg-white mb-6">
                                <Text className="text-[12px] font-geist-md text-gray-500 mb-1">Password</Text>
                                <TextInput
                                    className="text-gray-900 text-lg font-geist-md p-0 h-7"
                                    placeholder="Create a strong password"
                                    placeholderTextColor="#9ca3af"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {error ? (
                                <Text className="text-red-500 font-geist-sb text-sm mb-4 text-center">{error}</Text>
                            ) : null}

                            <TouchableOpacity
                                onPress={onSignUpPress}
                                disabled={loading || !email || !password || !firstName || !lastName}
                                className={`w-full h-14 rounded-full justify-center items-center mb-6 shadow-sm ${!email || !password || !firstName || !lastName ? "bg-[#e5e7eb] shadow-none" : "bg-[#FF6A00] active:bg-[#E65C00]"}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className={`font-geist-sb tracking-wide text-lg ${!email || !password || !firstName || !lastName ? "text-gray-400" : "text-white"}`}>
                                        Next
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleGoogleSignIn} className="items-center justify-center">
                                <Text className="text-gray-600 font-geist-sb underline">Or continue with Google</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text className="text-4xl font-geist-b text-gray-900 mb-2 mt-4">Check your email</Text>
                            <Text className="text-gray-600 font-geist-md mb-8 text-base">
                                We sent a verification code to <Text className="font-geist-b text-gray-900">{email}</Text>.
                            </Text>

                            <View className="border border-gray-300 rounded-xl px-4 py-2 bg-white mb-6">
                                <Text className="text-[12px] font-geist-md text-gray-500 mb-1">Verification Code</Text>
                                <TextInput
                                    className="text-gray-900 text-2xl font-geist-b tracking-[8px] p-0 h-10 mt-1"
                                    placeholder="000000"
                                    placeholderTextColor="#9ca3af"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                />
                            </View>

                            {error ? (
                                <Text className="text-red-500 font-geist-sb text-sm mb-4 text-center">{error}</Text>
                            ) : null}

                            <TouchableOpacity
                                onPress={onPressVerify}
                                disabled={loading || code.length !== 6}
                                className={`w-full h-14 rounded-full justify-center items-center mb-6 shadow-sm ${code.length !== 6 ? "bg-[#e5e7eb] shadow-none" : "bg-[#FF6A00] active:bg-[#E65C00]"}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className={`font-geist-sb tracking-wide text-lg ${code.length !== 6 ? "text-gray-400" : "text-white"}`}>
                                        Verify & Continue
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="flex-1" />
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
    );
}
