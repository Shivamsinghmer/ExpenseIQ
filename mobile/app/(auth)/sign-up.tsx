import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Platform, Image
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";
import * as AuthSession from "expo-auth-session";

export default function SignUp() {
    useWarmUpBrowser();

    const { signUp, setActive, isLoaded } = useSignUp();
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
                router.replace("/(tabs)/index");
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
                router.replace("/(tabs)/dashboard");
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, [startOAuthFlow]);

    return (
        <View className="flex-1 bg-white">
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === "ios" ? 20 : 50}
            >
                <View className="flex-1 justify-center px-6 py-12">
                    {/* Header */}
                    <View className="items-center mb-10">

                        <Text className="text-4xl font-black text-gray-900 tracking-tight">Join ExpenseIQ</Text>
                        <Text className="text-gray-500 text-base font-medium mt-2">Start your financial journey</Text>
                    </View>

                    {/* Card Container */}
                    <View className="bg-white border border-gray-200 p-8 rounded-[32px] shadow-sm">
                        {!pendingVerification ? (
                            <>
                                <Text className="text-2xl font-bold text-gray-900 mb-2">Create Account</Text>
                                <Text className="text-gray-500 text-sm mb-8 leading-5">
                                    Sign up to track expenses, manage budgets, and get AI insights.
                                </Text>

                                <View className="space-y-5">
                                    <View>
                                        <Text className="text-gray-700 font-bold text-sm mb-2 ml-1">First Name</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-base font-medium focus:border-black focus:bg-white"
                                            placeholder="John"
                                            placeholderTextColor="#9ca3af"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-gray-700 font-bold text-sm mb-2 ml-1">Last Name</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-base font-medium focus:border-black focus:bg-white"
                                            placeholder="Doe"
                                            placeholderTextColor="#9ca3af"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-gray-700 font-bold text-sm mb-2 ml-1">Email Address</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-base font-medium focus:border-black focus:bg-white"
                                            placeholder="name@example.com"
                                            placeholderTextColor="#9ca3af"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-gray-700 font-bold text-sm mb-2 ml-1">Password</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-base font-medium focus:border-black focus:bg-white"
                                            placeholder="Create a strong password"
                                            placeholderTextColor="#9ca3af"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>

                                    {error ? (
                                        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center justify-center">
                                            <Text className="text-red-500 font-bold text-sm text-center">{error}</Text>
                                        </View>
                                    ) : null}

                                    <TouchableOpacity
                                        onPress={onSignUpPress}
                                        disabled={loading || !email || !password || !firstName || !lastName}
                                        className={`mt-2 py-4 items-center rounded-2xl shadow-sm ${!email || !password || !firstName || !lastName ? "bg-gray-200 shadow-none" : "bg-gray-900"}`}
                                        activeOpacity={0.9}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className={`${!email || !password || !firstName || !lastName ? "text-gray-400" : "text-white"} font-bold text-lg`}>
                                                Sign Up
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Divider & Google Sign In */}
                                    <View className="flex-row items-center mt-4 mb-4">
                                        <View className="flex-1 h-[1px] bg-gray-200" />
                                        <Text className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or</Text>
                                        <View className="flex-1 h-[1px] bg-gray-200" />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleGoogleSignIn}
                                        className="py-4 items-center bg-white border border-gray-200 rounded-2xl"
                                        activeOpacity={0.8}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <Image
                                                source={require("../../assets/google-icon.png")}
                                                style={{ width: 24, height: 24 }}
                                                resizeMode="contain"
                                            />
                                            <Text className="text-gray-700 font-bold text-base">Continue with Google</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View className="items-center mb-6">
                                    <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                                        <Text className="text-3xl">✉️</Text>
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-900 text-center">Verify Email</Text>
                                    <Text className="text-gray-500 text-center mt-2 px-4">
                                        We sent a code to <Text className="font-bold text-gray-700">{email}</Text>. Enter it below to verify your account.
                                    </Text>
                                </View>

                                <View className="space-y-5">
                                    <View>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 text-center text-2xl font-bold tracking-[8px] focus:border-black focus:bg-white"
                                            placeholder="000000"
                                            placeholderTextColor="#9ca3af"
                                            value={code}
                                            onChangeText={setCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                    </View>

                                    {error ? (
                                        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center justify-center">
                                            <Text className="text-red-500 font-bold text-sm text-center">{error}</Text>
                                        </View>
                                    ) : null}

                                    <TouchableOpacity
                                        onPress={onPressVerify}
                                        disabled={loading || code.length !== 6}
                                        className={`py-4 items-center rounded-2xl shadow-sm ${code.length !== 6 ? "bg-gray-200 shadow-none" : "bg-gray-900"}`}
                                        activeOpacity={0.9}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className={`${code.length !== 6 ? "text-gray-400" : "text-white"} font-bold text-lg`}>
                                                Verify Account
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-gray-500 text-sm font-medium">Already have an account? </Text>
                        <Link href="/(auth)/sign-in" asChild>
                            <TouchableOpacity>
                                <Text className="text-gray-900 text-sm font-black underline decoration-2 underline-offset-4">Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}
