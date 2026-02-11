import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Platform, Image
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";

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
        <View className="flex-1 bg-slate-50">
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === "ios" ? 20 : 50}
            >
                <View className="flex-1 justify-center px-6 py-12">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="mb-6 shadow-xl shadow-indigo-500/20 bg-white p-4 rounded-3xl">
                            <Image
                                source={require("../../assets/logo.png")}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-4xl font-black text-slate-800 tracking-tight">Join ExpenseIQ</Text>
                        <Text className="text-slate-500 text-base font-medium mt-2">Start your financial journey</Text>
                    </View>

                    {/* Card Container */}
                    <View className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-xl shadow-indigo-100">
                        {!pendingVerification ? (
                            <>
                                <Text className="text-2xl font-bold text-slate-800 mb-2">Create Account</Text>
                                <Text className="text-slate-500 text-sm mb-8 leading-5">
                                    Sign up to track expenses, manage budgets, and get AI insights.
                                </Text>

                                <View className="space-y-5">
                                    <View>
                                        <Text className="text-slate-700 font-bold text-sm mb-2 ml-1">First Name</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-base font-medium focus:border-primary focus:bg-white"
                                            placeholder="John"
                                            placeholderTextColor="#94a3b8"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-700 font-bold text-sm mb-2 ml-1">Last Name</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-base font-medium focus:border-primary focus:bg-white"
                                            placeholder="Doe"
                                            placeholderTextColor="#94a3b8"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-700 font-bold text-sm mb-2 ml-1">Email Address</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-base font-medium focus:border-primary focus:bg-white"
                                            placeholder="name@example.com"
                                            placeholderTextColor="#94a3b8"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-700 font-bold text-sm mb-2 ml-1">Password</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-base font-medium focus:border-primary focus:bg-white"
                                            placeholder="Create a strong password"
                                            placeholderTextColor="#94a3b8"
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
                                        className={`mt-2 py-4 items-center rounded-2xl shadow-lg shadow-indigo-500/30 ${!email || !password || !firstName || !lastName ? "bg-slate-200 shadow-none" : "bg-indigo-600"}`}
                                        activeOpacity={0.9}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className={`${!email || !password || !firstName || !lastName ? "text-slate-400" : "text-white"} font-bold text-lg`}>
                                                Sign Up
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Divider & Google Sign In */}
                                    <View className="flex-row items-center mt-4 mb-4">
                                        <View className="flex-1 h-[1px] bg-slate-200" />
                                        <Text className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or</Text>
                                        <View className="flex-1 h-[1px] bg-slate-200" />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleGoogleSignIn}
                                        className="py-4 items-center bg-white border border-slate-200 rounded-2xl"
                                        activeOpacity={0.8}
                                    >
                                        <View className="flex-row items-center">
                                            <Text className="text-slate-700 font-bold text-base">Continue with Google</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View className="items-center mb-6">
                                    <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                                        <Text className="text-3xl">✉️</Text>
                                    </View>
                                    <Text className="text-2xl font-bold text-slate-800 text-center">Verify Email</Text>
                                    <Text className="text-slate-500 text-center mt-2 px-4">
                                        We sent a code to <Text className="font-bold text-slate-700">{email}</Text>. Enter it below to verify your account.
                                    </Text>
                                </View>

                                <View className="space-y-5">
                                    <View>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-center text-2xl font-bold tracking-[8px] focus:border-primary focus:bg-white"
                                            placeholder="000000"
                                            placeholderTextColor="#94a3b8"
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
                                        className={`py-4 items-center rounded-2xl shadow-lg shadow-indigo-500/30 ${code.length !== 6 ? "bg-slate-200 shadow-none" : "bg-indigo-600"}`}
                                        activeOpacity={0.9}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className={`${code.length !== 6 ? "text-slate-400" : "text-white"} font-bold text-lg`}>
                                                Verify Account
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-slate-500 text-sm font-medium">Already have an account? </Text>
                        <Link href="/(auth)/sign-in" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary text-sm font-black underline decoration-2 underline-offset-4">Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}
