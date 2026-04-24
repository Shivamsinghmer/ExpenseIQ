import React, { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback, Animated } from "react-native";

interface ModalButton {
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
}

interface AppModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttons: ModalButton[];
}

const { width } = Dimensions.get("window");

export const AppModal: React.FC<AppModalProps> = ({ visible, onClose, title, message, buttons }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 0, // Faster than native default
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent={true}
            hardwareAccelerated={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
                        <TouchableWithoutFeedback>
                            <View style={styles.container}>
                                <View className="mb-4">
                                    <Text className="text-gray-900 font-geist-sb text-xl mb-1 text-left">{title}</Text>
                                    <Text className="text-gray-500 font-geist-md text-sm text-left leading-5">{message}</Text>
                                </View>
                                
                                <View style={styles.buttonRow}>
                                    {buttons.map((button, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                button.onPress();
                                            }}
                                            activeOpacity={0.7}
                                            className="flex-1 py-3 px-4 rounded-full items-center justify-center"
                                            style={[
                                                index > 0 && { marginLeft: 12 },
                                                button.style === "destructive" 
                                                    ? { backgroundColor: "#fee2e2" } 
                                                    : button.style === "cancel"
                                                        ? { backgroundColor: "#f3f4f6" }
                                                        : { backgroundColor: "#FF6A00" }
                                            ]}
                                        >
                                            <Text 
                                                className={`font-geist-b text-sm ${
                                                    button.style === "destructive" 
                                                        ? "text-red-600" 
                                                        : button.style === "cancel"
                                                            ? "text-gray-600"
                                                            : "text-white"
                                                }`}
                                            >
                                                {button.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    animatedContainer: {
        width: "100%",
        alignItems: "center",
    },
    container: {
        width: width * 0.85,
        backgroundColor: "#fff",
        borderRadius: 28,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonRow: {
        flexDirection: "row",
        width: "100%",
        marginTop: 8,
    }
});
