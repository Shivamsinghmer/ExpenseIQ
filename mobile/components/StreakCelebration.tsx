import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Modal,
    Animated,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

interface StreakCelebrationProps {
    milestone: {
        days: number;
        label: string;
        emoji: string;
        color: string;
    } | null;
    isVisible: boolean;
    onClose: () => void;
    currentStreak: number;
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
    milestone,
    isVisible,
    onClose,
    currentStreak,
}) => {
    const [showTrophyOverlay, setShowTrophyOverlay] = useState(false);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const modalScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible && milestone) {
            setShowTrophyOverlay(true);
            setShowAchievementModal(false);

            // Play Trophy animation for ~2s
            const timer = setTimeout(() => {
                setShowTrophyOverlay(false);
                setShowAchievementModal(true);
                modalScale.setValue(0);
                Animated.spring(modalScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 80,
                    useNativeDriver: true,
                }).start();
            }, 2200);

            return () => clearTimeout(timer);
        } else if (!isVisible) {
            setShowTrophyOverlay(false);
            setShowAchievementModal(false);
        }
    }, [isVisible, milestone]);

    const handleClose = () => {
        Animated.timing(modalScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowAchievementModal(false);
            onClose();
        });
    };

    if (!isVisible || !milestone) return null;

    return (
        <>
            {/* Trophy Lottie Overlay */}
            {showTrophyOverlay && (
                <View 
                    style={[
                        StyleSheet.absoluteFill, 
                        { backgroundColor: "rgba(0,0,0,0.0)", zIndex: 1000, alignItems: "center", justifyContent: "center" }
                    ]}
                >
                    <LottieView
                        source={require("../assets/Trophy.json")}
                        autoPlay
                        loop={false}
                        style={{ width: 440, height: 440 }}
                    />
                </View>
            )}

            {/* Achievement Modal */}
            <Modal 
                visible={showAchievementModal} 
                transparent 
                animationType="fade" 
                onRequestClose={handleClose}
                statusBarTranslucent={true}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}>
                    <LottieView
                        source={require("../assets/confetti.json")}
                        autoPlay
                        loop
                        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                        resizeMode="cover"
                    />
                    <Animated.View
                        style={{
                            transform: [{ scale: modalScale }],
                            opacity: modalScale,
                            width: width * 0.85,
                            backgroundColor: "#fff",
                            borderRadius: 36,
                            paddingVertical: 20,
                            paddingHorizontal: 20,
                            alignItems: "center",
                            elevation: 0,
                        }}
                    >
                        {/* Emoji Ring */}
                        <View
                            style={{
                                borderRadius: 25,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                                marginTop: 10
                            }}
                        >
                            <Text style={{ fontSize: 54 }}>{milestone.emoji}</Text>
                        </View>

                        {/* Title */}
                        <Text className="text-gray-900 font-geist-sb text-2xl text-center mb-2">
                            Congrats for {milestone.label}!
                        </Text>

                        {/* Subtitle */}
                        <Text className="text-gray-400 font-geist-md text-sm text-center mb-1">
                            {milestone.days}-Day Streak Achieved
                        </Text>

                        {/* Badge Pill */}
                        <View
                            style={{
                                backgroundColor: (milestone.color || "#FF6A00") + "20",
                                borderRadius: 100,
                                paddingHorizontal: 20,
                                paddingVertical: 6,
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        >
                            <Text style={{ color: "#FF6A00", fontWeight: "600", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>
                                🔥 {currentStreak} Day Streak
                            </Text>
                        </View>

                        {/* Motivational Text */}
                        <Text className="text-gray-500 font-geist-md text-center text-sm leading-5 mb-8 px-4">
                            You're on fire! Consistency is the key to mastering your finances. Keep tracking every day!
                        </Text>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={handleClose}
                            activeOpacity={0.9}
                            style={{
                                backgroundColor: "#FF6A00",
                                borderRadius: 100,
                                paddingVertical: 12,
                                paddingHorizontal: 114,
                                shadowColor: "#FF6A00",
                            }}
                        >
                            <Text className="text-white font-geist-sb text-base">Let's Go!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};
