import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Platform, Image, Alert
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";
import { API_BASE_URL } from "../../lib/config";
import * as AuthSession from "expo-auth-session";

export default function SignIn() {
    useWarmUpBrowser();

    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [show2FA, setShow2FA] = useState(false);
    const [secondFactorStrategy, setSecondFactorStrategy] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const handleGoogleSignIn = useCallback(async () => {
        try {
            const redirectUrl = AuthSession.makeRedirectUri({
                path: "oauth-native-callback",
            });
            console.log("OAuth redirectUrl:", redirectUrl);

            const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({ redirectUrl });
            if (createdSessionId && setOAuthActive) {
                setOAuthActive({ session: createdSessionId });
            } else {
                // Use generic error if session creation fails without specific error
                Alert.alert("Error", "Google Sign-In failed or was cancelled.");
            }
        } catch (err: any) {
            console.error("OAuth error", err);
            Alert.alert("Error", "Google Sign-In encountered an error.");
        }
    }, [startOAuthFlow]);

    React.useEffect(() => {
        console.log("Current API_BASE_URL:", API_BASE_URL);
    }, []);

    const handleSignIn = async () => {
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            if (show2FA) {
                // Verify 2FA
                console.log("Verifying 2FA with strategy:", secondFactorStrategy);
                const result = await signIn.attemptSecondFactor({
                    strategy: secondFactorStrategy,
                    code,
                });
                console.log("2FA Result:", result.status);

                if (result.status === "complete") {
                    if (setActive) await setActive({ session: result.createdSessionId });
                    router.replace("/(tabs)");
                } else {
                    console.log("2FA Incomplete:", result);
                    setError("Verification failed. Please check the code.");
                }
            } else {
                // Initial Sign In
                console.log("Sign In attempted with:", email);
                const result = await signIn.create({ identifier: email, password });
                console.log("Sign In Result:", result.status);

                if (result.status === "complete") {
                    if (setActive) await setActive({ session: result.createdSessionId });
                    router.replace("/(tabs)");
                } else if (result.status === "needs_second_factor") {
                    console.log("2FA required. Available factors:", result.supportedSecondFactors);

                    // Simple logic: pick the first available strategy
                    const firstFactor = result.supportedSecondFactors?.find(f => f.strategy === "phone_code") || result.supportedSecondFactors?.[0];
                    if (firstFactor) {
                        setSecondFactorStrategy(firstFactor.strategy);
                        setShow2FA(true);
                        // If it's a phone code, it's usually auto-sent or we might need to trigger it? 
                        // Clerk usually sends it upon `signIn.create` if it's the default, or we might need to prepare it.
                        // Let's assume user just needs to enter code for now.
                        Alert.alert("Verification Required", `Please enter the code sent to your ${(firstFactor as any).safeIdentifier || "device"}.`);
                    } else {
                        setError("Unsupported 2FA method required.");
                    }
                } else {
                    Alert.alert("Sign In Incomplete", `Status: ${result.status}`);
                }
            }
        } catch (err: any) {
            console.error("Sign In Error Details:", JSON.stringify(err, null, 2));
            const msg = err.errors?.[0]?.message || "Sign in failed.";
            setError(msg);
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

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
                        <Text className="text-4xl font-black text-slate-800 tracking-tight">ExpenseIQ</Text>
                        <Text className="text-slate-500 text-base font-medium mt-2">Smart financial tracking</Text>
                    </View>

                    {/* Card Container */}
                    <View className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-xl shadow-indigo-100">
                        <Text className="text-2xl font-bold text-slate-800 mb-2">
                            Welcome Back
                        </Text>
                        <Text className="text-slate-500 text-sm mb-8 leading-5">
                            Please sign in to continue to your dashboard.
                        </Text>

                        <View className="space-y-5">
                            {show2FA ? (
                                <View>
                                    <Text className="text-slate-700 font-bold text-sm mb-2 ml-1">Verification Code</Text>
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
                            ) : (
                                <>
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
                                            placeholder="Enter your password"
                                            placeholderTextColor="#94a3b8"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </>
                            )}

                            {error ? (
                                <View className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center justify-center">
                                    <Text className="text-red-500 font-bold text-sm text-center">{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleSignIn}
                                disabled={loading || (show2FA ? code.length !== 6 : (!email || !password))}
                                className={`mt-2 py-4 items-center rounded-2xl shadow-lg shadow-indigo-500/30 ${(show2FA ? code.length !== 6 : (!email || !password)) ? "bg-slate-200 shadow-none" : "bg-indigo-600"}`}
                                activeOpacity={0.9}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className={`${(show2FA ? code.length !== 6 : (!email || !password)) ? "text-slate-400" : "text-white"} font-bold text-lg`}>
                                        {show2FA ? "Verify Code" : "Sign In"}
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
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-slate-500 text-sm font-medium">New to ExpenseIQ? </Text>
                        <Link href="/(auth)/sign-up" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary text-sm font-black underline decoration-2 underline-offset-4">Create Account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}
