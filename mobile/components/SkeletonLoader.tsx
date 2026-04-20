import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../providers/theme-provider';

interface SkeletonLoaderProps {
    type?: 'dashboard' | 'list' | 'analytics' | 'default';
}

function ShimmerBlock({ width, height, borderRadius, style, flex }: any) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);

    const { isDark } = useTheme();
    // Darkened light mode base by exactly 5% (from e2e8f0 down to d1d5db) to increase placeholder contrast per user request
    const bgColor = isDark ? "#334155" : "#d1d5db";

    return (
        <Animated.View style={[{ width, height, borderRadius, backgroundColor: bgColor, opacity, flex }, style]} />
    );
}

export default function SkeletonLoader({ type = 'default' }: SkeletonLoaderProps) {
    const { isDark } = useTheme();
    const bgContainer = isDark ? "bg-slate-900" : "bg-[#F5F5F5]";

    const renderDashboard = () => (
        <View className="px-5 pt-16">
            {/* Header Profile */}
            <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center">
                    <ShimmerBlock width={48} height={48} borderRadius={24} />
                    <View className="ml-3">
                        <ShimmerBlock width={100} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                        <ShimmerBlock width={140} height={20} borderRadius={4} />
                    </View>
                </View>
                <ShimmerBlock width={40} height={40} borderRadius={20} />
            </View>

            {/* Main Card */}
            <ShimmerBlock width="100%" height={240} borderRadius={32} style={{ marginBottom: 24 }} />

            {/* Quick Actions */}
            <View className="flex-row justify-between mb-10">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="items-center">
                        <ShimmerBlock width={56} height={56} borderRadius={28} />
                        <ShimmerBlock width={50} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                    </View>
                ))}
            </View>

            {/* Recent */}
            <ShimmerBlock width={160} height={24} borderRadius={4} style={{ marginBottom: 20 }} />
            {[1, 2, 3].map((i) => (
                <View key={`tx-${i}`} className="flex-row items-center mb-4">
                    <ShimmerBlock width={50} height={50} borderRadius={16} />
                    <View className="ml-3 flex-1">
                        <ShimmerBlock width="80%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                        <ShimmerBlock width="50%" height={12} borderRadius={4} />
                    </View>
                    <ShimmerBlock width={60} height={20} borderRadius={4} />
                </View>
            ))}
        </View>
    );

    const renderList = () => (
        <View className="px-5 pt-16">
            <ShimmerBlock width="100%" height={50} borderRadius={16} style={{ marginBottom: 30 }} />
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={`list-${i}`} className="flex-row items-center mb-5 border-b border-gray-100/50 pb-4">
                    <ShimmerBlock width={50} height={50} borderRadius={16} />
                    <View className="ml-3 flex-1">
                        <ShimmerBlock width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                        <ShimmerBlock width="40%" height={12} borderRadius={4} />
                    </View>
                    <ShimmerBlock width={70} height={20} borderRadius={4} />
                </View>
            ))}
        </View>
    );

    const renderAnalytics = () => (
        <View className="px-5 pt-4">
            {/* Title Shimmer */}
            <View className="mb-6">
                <ShimmerBlock width={160} height={36} borderRadius={8} />
            </View>
            <ShimmerBlock width="100%" height={40} borderRadius={20} style={{ marginBottom: 20 }} />
            <ShimmerBlock width="100%" height={120} borderRadius={24} style={{ marginBottom: 24 }} />
            <View className="items-center mb-8">
                <ShimmerBlock width={220} height={220} borderRadius={110} />
            </View>
            {[1, 2].map((i) => (
                <ShimmerBlock key={i} width="100%" height={100} borderRadius={24} style={{ marginBottom: 16 }} />
            ))}
        </View>
    );

    return (
        <View className="flex-1">
            {type === 'dashboard' && renderDashboard()}
            {type === 'list' && renderList()}
            {type === 'analytics' && renderAnalytics()}
            {(type === 'default' || !type) && renderList()}
        </View>
    );
}
