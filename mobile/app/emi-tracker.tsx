import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
    ChevronLeft, 
    Plus, 
    Calendar, 
    Smartphone, 
    Home, 
    Car, 
    Laptop,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emisAPI, transactionsAPI } from "../services/api";
import AddEMISheet, { AddEMISheetRef } from "../components/AddEMISheet";

export default function EMITracker() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const emiSheetRef = useRef<AddEMISheetRef>(null);

    const { data: emis, isLoading: emisLoading } = useQuery({
        queryKey: ["emis"],
        queryFn: () => emisAPI.getAll().then(res => res.data),
    });

    const { data: summary } = useQuery({
        queryKey: ["transactions-summary"],
        queryFn: () => transactionsAPI.getSummary().then(res => res.data),
    });

    const markDoneMutation = useMutation({
        mutationFn: (id: string) => emisAPI.update(id, { paidMonths: (emis?.find(e => e.id === id)?.paidMonths || 0) + 1 }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emis"] });
        },
    });

    const totalMonthlyEMI = emis?.reduce((acc, emi) => acc + (emi.isDone ? 0 : emi.monthlyAmount), 0) || 0;
    const activeCount = emis?.filter(e => !e.isDone).length || 0;
    const totalIncome = summary?.totalIncome || 1; // Avoid division by zero
    const emiToIncomeRatio = Math.round((totalMonthlyEMI / totalIncome) * 100);

    const getStatusColor = (ratio: number) => {
        if (ratio < 20) return "text-green-500";
        if (ratio < 40) return "text-orange-500";
        return "text-red-500";
    };

    const getStatusBg = (ratio: number) => {
        if (ratio < 20) return "bg-green-500";
        if (ratio < 40) return "bg-orange-500";
        return "bg-red-500";
    };

    if (emisLoading) {
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
                <Text className="text-xl font-geist-b text-gray-900">EMI Tracker</Text>
                <TouchableOpacity 
                    onPress={() => emiSheetRef.current?.present()}
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
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-1">Monthly EMI Obligation</Text>
                            <Text className="text-gray-900 text-3xl font-geist-b">₹{totalMonthlyEMI.toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-900 text-xl font-geist-b">{activeCount}</Text>
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase">Active</Text>
                        </View>
                    </View>

                    <View className="h-px bg-gray-100 w-full mb-6" />

                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-500 text-xs font-geist-md tracking-tight uppercase">EMI-to-Income Ratio</Text>
                        <Text className={`text-sm font-geist-b ${getStatusColor(emiToIncomeRatio)}`}>{emiToIncomeRatio}%</Text>
                    </View>

                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <View 
                            style={{ width: `${Math.min(emiToIncomeRatio, 100)}%` }} 
                            className={`h-full rounded-full ${getStatusBg(emiToIncomeRatio)}`}
                        />
                    </View>

                    <View className="flex-row items-center gap-2">
                        <CheckCircle2 size={16} color={emiToIncomeRatio < 40 ? "#22c55e" : "#ef4444"} />
                        <Text className={`text-[11px] font-geist-md ${emiToIncomeRatio < 40 ? 'text-green-600' : 'text-red-600'}`}>
                            {emiToIncomeRatio < 40 ? 'Healthy — EMIs are within safe limits' : 'Caution — EMI ratio is high'}
                        </Text>
                    </View>
                </View>

                {/* Active EMIs List */}
                <Text className="text-gray-900 text-lg font-geist-b mb-4">Active EMIs</Text>
                
                {emis?.filter(e => !e.isDone).map((emi) => {
                    const progress = (emi.paidMonths / emi.totalMonths) * 100;
                    const remaining = (emi.totalMonths - emi.paidMonths) * emi.monthlyAmount;
                    const paid = emi.paidMonths * emi.monthlyAmount;
                    
                    return (
                        <View key={emi.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm mb-4">
                            <View className="flex-row justify-between items-start mb-4">
                                <View>
                                    <Text className="text-gray-900 font-geist-b text-base">{emi.title}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-[#FF6A00] font-geist-b">₹{emi.monthlyAmount.toLocaleString()}</Text>
                                        <Text className="text-gray-400 text-xs font-geist-md">/mo</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => markDoneMutation.mutate(emi.id)}
                                    className="px-4 py-2 rounded-full border border-gray-100"
                                >
                                    <Text className="text-gray-900 text-xs font-geist-sb">Mark Done</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-400 text-[10px] font-geist-md uppercase">{emi.paidMonths} of {emi.totalMonths} months</Text>
                                <Text className="text-gray-900 text-xs font-geist-b">{Math.round(progress)}%</Text>
                            </View>

                            <View className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden mb-4">
                                <View 
                                    style={{ width: `${progress}%` }} 
                                    className="h-full bg-orange-400 rounded-full" 
                                />
                            </View>

                            <View className="flex-row justify-between mb-4">
                                <View>
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Paid</Text>
                                    <Text className="text-green-600 font-geist-b">₹{paid.toLocaleString()}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase mb-1">Remaining</Text>
                                    <Text className="text-red-500 font-geist-b">₹{remaining.toLocaleString()}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-center py-2 bg-gray-50 rounded-xl">
                                <Calendar size={12} color="#9ca3af" />
                                <Text className="text-gray-400 text-[10px] font-geist-md ml-1.5">Payoff: {new Date(emi.startDate).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    );
                })}

                {activeCount === 0 && (
                    <View className="items-center justify-center py-10">
                        <Text className="text-gray-400 font-geist-md">No active EMIs tracked.</Text>
                    </View>
                )}

                <View className="h-10" />
            </ScrollView>
            <AddEMISheet ref={emiSheetRef} />
        </SafeAreaView>
    );
}
