import React, { useRef, useState } from "react";
import { View, Text, FlatList, useWindowDimensions, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SLIDES = [
    {
        id: "1",
        title: "Automate Your Ledger",
        description: "Connect your bank for real-time syncing, auto-import from SMS, or snap a photo of receipts.",
        bg: "bg-[#CBEBFF]",
        image: require("../assets/onboarding1.png"),
        imageStyle: {},
    },
    {
        id: "2",
        title: "Master Your Money",
        description: "Allocate funds with Envelope Budgeting, track your EMIs seamlessly, and import bank statements.",
        bg: "bg-[#DAC2FF]",
        image: require("../assets/onboarding2.png"),
        imageStyle: { transform: [{ scale: 1.15 }] },
    },
    {
        id: "3",
        title: "Connect or Control",
        description: "Securely link your bank for zero-effort syncing, or manage everything your way with manual entry.",
        bg: "bg-[#B4FAAD]",
        image: require("../assets/onboarding3.png"),
        imageStyle: { transform: [{ rotate: "-8deg" }] },
    },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<any>>(null);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    const handleScroll = (event: any) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        setCurrentIndex(index);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onMomentumScrollEnd={handleScroll}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ width }} className="flex-1 px-4 pt-2 pb-4">
                        <View className={`flex-1 rounded-[30px] px-6 pt-8 pb-18 justify-between items-center ${item.bg}`}>
                            <View className="w-full">
                                <Text className="text-3xl font-geist-b text-gray-900 tracking-tight leading-tight mb-4">
                                    {item.title}
                                </Text>
                                <Text className="text-[16px] text-gray-600 leading-tight font-geist-md">
                                    {item.description}
                                </Text>
                            </View>

                            <View className="flex-1 justify-center items-center">
                                <Image source={item.image} style={[{ width: 350, height: 350 }, item.imageStyle as any]} resizeMode="cover" />
                            </View>
                        </View>
                    </View>
                )}
            />

            <View className="px-6 pb-4 pt-6 items-center">
                <View className="flex-row items-center space-x-2 space-x-reverse-0 mb-6">
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            className={`h-[6px] rounded-full mx-1 ${
                                index === currentIndex ? "w-[6px] bg-[#FF6A00]" : "w-[6px] bg-gray-300"
                            }`}
                        />
                    ))}
                </View>

                <Pressable
                    onPress={handleNext}
                    className="w-full h-14 bg-[#FF6A00] rounded-full items-center justify-center active:bg-[#E65C00]"
                >
                    <Text className="text-white text-lg font-geist-sb tracking-wide">
                        {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
