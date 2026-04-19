import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
    ChevronLeft, 
    Plus, 
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Target,
    Clock,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { envelopesAPI } from "../services/api";

export default function BudgetEnvelopes() {
    const router = useRouter();

    const { data: envelopes, isLoading } = useQuery({
        queryKey: ["envelopes"],
        queryFn: () => envelopesAPI.getAll().then(res => res.data),
    });

    const totalBudget = envelopes?.reduce((acc, env) => acc + env.budget, 0) || 0;
    const totalSpent = envelopes?.reduce((acc, env) => acc + env.spent, 0) || 0;
    const totalRemaining = totalBudget - totalSpent;
    const activeCount = envelopes?.length || 0;

    const calculateDaysLeft = (endDate: string) => {
        const diffTime = new Date(endDate).getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#FF6A00" size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center"
                >
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-xl font-geist-b text-gray-900">Budget Envelopes</Text>
                <TouchableOpacity 
                    className="w-10 h-10 rounded-full bg-[#FF6A00] items-center justify-center"
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-8">
                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-1">Total Envelope Budgets</Text>
                            <Text className="text-gray-900 text-3xl font-geist-b">₹{totalBudget.toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-900 text-xl font-geist-b">{activeCount}</Text>
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase">Active</Text>
                        </View>
                    </View>

                    <View className="h-px bg-gray-100 w-full mb-6" />

                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 border-r border-gray-100">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Spent</Text>
                            <Text className="text-red-500 font-geist-b text-lg">₹{totalSpent.toLocaleString()}</Text>
                        </View>
                        <View className="flex-1 pl-6">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Remaining</Text>
                            <Text className="text-green-500 font-geist-b text-lg">₹{totalRemaining.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Active Envelopes List */}
                <Text className="text-gray-900 text-lg font-geist-b mb-4">Active Envelopes</Text>
                
                {envelopes?.map((envelope) => {
                    const daysLeft = calculateDaysLeft(envelope.endDate);
                    const progress = (envelope.spent / envelope.budget) * 100;
                    const left = envelope.budget - envelope.spent;

                    return (
                        <View key={envelope.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm mb-4">
                            <View className="flex-row justify-between items-center mb-5">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 rounded-2xl bg-orange-50 items-center justify-center">
                                        <Text className="text-2xl">{envelope.icon || "💰"}</Text>
                                    </View>
                                    <View className="ml-4">
                                        <Text className="text-gray-900 font-geist-b text-base">{envelope.title}</Text>
                                        <Text className="text-gray-400 text-[10px] font-geist-md mt-0.5">
                                            {new Date(envelope.startDate).toLocaleDateString()} - {new Date(envelope.endDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <View className="bg-orange-50 px-3 py-1.5 rounded-full">
                                    <Text className="text-[#FF6A00] text-[10px] font-geist-b">{daysLeft}d left</Text>
                                </View>
                            </View>

                            <View className="w-full h-2 bg-gray-50 rounded-full overflow-hidden mb-6">
                                <View 
                                    style={{ width: `${Math.min(progress, 100)}%` }} 
                                    className="h-full bg-[#FF6A00] rounded-full" 
                                />
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="items-center">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Spent</Text>
                                    <Text className="text-gray-900 font-geist-b text-sm">₹{envelope.spent.toLocaleString()}</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Budget</Text>
                                    <Text className="text-gray-900 font-geist-b text-sm">₹{envelope.budget.toLocaleString()}</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Left</Text>
                                    <Text className="text-green-600 font-geist-b text-sm">₹{left.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {activeCount === 0 && (
                    <View className="items-center justify-center py-10 bg-white rounded-[24px] border border-gray-100 border-dashed">
                        <Wallet size={32} color="#d1d5db" />
                        <Text className="text-gray-400 font-geist-md mt-3">No active envelopes found.</Text>
                    </View>
                )}

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
