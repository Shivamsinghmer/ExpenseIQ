import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Platform, Image
} from "react-native";
import { useModal } from "../../providers/ModalProvider";
import { useSignIn, useOAuth, useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useWarmUpBrowser } from "../../hooks/useWarmUpBrowser";
import { API_BASE_URL } from "../../lib/config";
import { paymentsAPI, setAuthToken } from "../../services/api";
import * as AuthSession from "expo-auth-session";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
    useWarmUpBrowser();

    const { signIn, setActive, isLoaded } = useSignIn();
    const { showModal, hideModal } = useModal();
    const { getToken } = useAuth();
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
                await setOAuthActive({ session: createdSessionId });

                // Smart redirect: Check if user is truly new (in case they used sign-in but are new)
                try {
                    let token = await getToken();
                    if (!token) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        token = await getToken();
                    }

                    if (token) {
                        setAuthToken(token);
                        const res = await paymentsAPI.checkStatus();
                        const trialStart = res.data.trialStartDate ? new Date(res.data.trialStartDate).getTime() : 0;
                        const now = new Date().getTime();

                        // Even in sign-in, if they just registered via Google OAuth, show trial screen
                        if (now - trialStart < 120000 && !res.data.isPro) {
                            router.replace("/trial-started");
                        } else {
                            router.replace("/(tabs)/dashboard");
                        }
                    } else {
                        router.replace("/(tabs)/dashboard");
                    }
                } catch (e) {
                    router.replace("/(tabs)/dashboard");
                }
            } else {
                showModal("Oh no!", "Google Sign-In failed or was cancelled.");
            }
        } catch (err: any) {
            console.error("OAuth error", err);
            showModal("Oh no!", "Google Sign-In encountered an error.");
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

                    // Smart redirect
                    try {
                        let token = await getToken();
                        if (!token) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            token = await getToken();
                        }
                        if (token) {
                            setAuthToken(token);
                            const res = await paymentsAPI.checkStatus();
                            const trialStart = res.data.trialStartDate ? new Date(res.data.trialStartDate).getTime() : 0;
                            const now = new Date().getTime();
                            if (now - trialStart < 120000 && !res.data.isPro) {
                                router.replace("/trial-started");
                            } else {
                                router.replace("/(tabs)/dashboard");
                            }
                        } else {
                            router.replace("/(tabs)/dashboard");
                        }
                    } catch (e) {
                        router.replace("/(tabs)/dashboard");
                    }
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

                    // Smart redirect
                    try {
                        let token = await getToken();
                        if (!token) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            token = await getToken();
                        }
                        if (token) {
                            setAuthToken(token);
                            const res = await paymentsAPI.checkStatus();
                            const trialStart = res.data.trialStartDate ? new Date(res.data.trialStartDate).getTime() : 0;
                            const now = new Date().getTime();
                            if (now - trialStart < 120000 && !res.data.isPro) {
                                router.replace("/trial-started");
                            } else {
                                router.replace("/(tabs)/dashboard");
                            }
                        } else {
                            router.replace("/(tabs)/dashboard");
                        }
                    } catch (e) {
                        router.replace("/(tabs)/dashboard");
                    }
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
                        showModal("Verification Required", `Please enter the code sent to your ${(firstFactor as any).safeIdentifier || "device"}.`);
                    } else {
                        setError("Unsupported 2FA method required.");
                    }
                } else {
                    showModal("Sign In Incomplete", `Status: ${result.status}`);
                }
            }
        } catch (err: any) {
            console.error("Sign In Error Details:", JSON.stringify(err, null, 2));
            const msg = err.errors?.[0]?.message || "Sign in failed.";
            setError(msg);
            showModal("Sorry", msg);
        } finally {
            setLoading(false);
        }
    };

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
                        <Link href="/(auth)/sign-up" asChild>
                            <TouchableOpacity>
                                <Text className="text-[#FF6A00] font-geist-sb text-base">Sign up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Logo Area */}
                    <Text className="text-[#FF6A00] font-black text-3xl mb-12 tracking-tighter">ExpensePal.</Text>

                    <Text className="text-4xl font-geist-b text-gray-900 mb-2">Welcome back</Text>
                    <Text className="text-gray-600 font-geist-md mb-8 text-base">Sign in to securely access your account</Text>

                    {show2FA ? (
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
                    ) : (
                        <View>
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
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9ca3af"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    )}

                    {error ? (
                        <Text className="text-red-500 font-geist-sb text-sm mb-4 text-center">{error}</Text>
                    ) : null}

                    <TouchableOpacity
                        onPress={handleSignIn}
                        disabled={loading || (show2FA ? code.length !== 6 : (!email || !password))}
                        className={`w-full h-14 rounded-full justify-center items-center mb-6 shadow-sm ${(show2FA ? code.length !== 6 : (!email || !password)) ? "bg-[#e5e7eb] shadow-none" : "bg-[#FF6A00] active:bg-[#E65C00]"}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className={`font-geist-sb tracking-wide text-lg ${(show2FA ? code.length !== 6 : (!email || !password)) ? "text-gray-400" : "text-white"}`}>
                                {show2FA ? "Verify Code" : "Log In"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {!show2FA && (
                        <TouchableOpacity onPress={handleGoogleSignIn} className="items-center justify-center mt-2">
                            <Text className="text-gray-600 font-geist-sb underline">Or continue with Google</Text>
                        </TouchableOpacity>
                    )}

                    <View className="flex-1" />
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
    );
}
