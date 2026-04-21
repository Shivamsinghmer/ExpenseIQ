import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Image, Platform, ActivityIndicator } from "react-native";
import { 
    Utensils, Coffee, ShoppingCart, Car, Home as HomeIcon,
    Zap, HeartPulse, Plane, Gamepad2, GraduationCap,
    Gift, TrendingUp, Wallet, MoreHorizontal, Trash2,
    X, Users, ArrowRight, CheckCircle2, Calendar
} from "lucide-react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";

const AVATARS = [
    require('../assets/friend.png'),
    require('../assets/friend2.png'),
    require('../assets/friend3.png'),
    require('../assets/friend4.png'),
    require('../assets/friend5.png'),
    require('../assets/friend6.png'),
    require('../assets/friend7.png'),
    require('../assets/friend8.png'),
    require('../assets/friend9.png'),
    require('../assets/friend10.png'),
];

const CATEGORY_ICONS: Record<string, any> = {
    Food: Utensils,
    Coffee: Coffee,
    Shopping: ShoppingCart,
    Transport: Car,
    Rent: HomeIcon,
    Bills: Zap,
    Health: HeartPulse,
    Travel: Plane,
    Fun: Gamepad2,
    Education: GraduationCap,
    Gifts: Gift,
    Invest: TrendingUp,
    Salary: Wallet,
    Other: MoreHorizontal,
};

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category?: string;
    notes?: string;
    date: string;
}

interface TransactionItemProps {
    item: Transaction;
    onDelete?: (id: string) => void;
    isExpired?: boolean;
    showSwipe?: boolean;
    remainingBudget?: number;
}

const getAvatarForName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATARS[Math.abs(hash) % AVATARS.length];
};

export function TransactionItem({ item, onDelete, isExpired, showSwipe = false, remainingBudget }: TransactionItemProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const queryClient = useQueryClient();
    const isIncome = item.type === "INCOME";
    const CategoryIcon = CATEGORY_ICONS[item.category || "Other"] || MoreHorizontal;

    const isResolved = useMemo(() => {
        return item.notes?.includes("Resolved: true");
    }, [item.notes]);

    const emiInfo = useMemo(() => {
        if (!item.notes) return null;
        const emiPart = item.notes.split('|').find(p => p.trim().startsWith('EMI:'));
        if (!emiPart) return null;
        const parts = emiPart.split(' ');
        const progress = parts.find(p => p.includes('/'));
        return progress || "EMI";
    }, [item.notes]);

    const isEMI = !!emiInfo;

    const envInfo = useMemo(() => {
        if (!item.notes) return null;
        const envPart = item.notes.split('|').find(p => p.trim().startsWith('EnvTitle:'));
        if (!envPart) return null;
        
        const envIconPart = item.notes.split('|').find(p => p.trim().startsWith('EnvIcon:'));
        const title = envPart.replace('EnvTitle:', '').trim();
        const icon = envIconPart ? envIconPart.replace('EnvIcon:', '').trim() : '🎯';
        return { title, icon };
    }, [item.notes]);

    const splitFriends = useMemo(() => {
        if (!item.notes) return null;
        const splitPart = item.notes.split('|').find(p => p.trim().startsWith('Split:'));
        if (!splitPart) return null;
        
        const detailsStr = splitPart.replace('Split:', '').trim();
        return detailsStr.split(',').map(s => {
            const parts = s.split(':');
            const name = parts[0].trim();
            const amountStr = parts[1]?.trim() || "0";
            return { 
                name, 
                amount: parseFloat(amountStr.replace('₹', '').replace(/,/g, '')) || 0,
                avatar: getAvatarForName(name)
            };
        });
    }, [item.notes]);

    const totalOwed = useMemo(() => {
        return splitFriends?.reduce((acc, f) => acc + f.amount, 0) || 0;
    }, [splitFriends]);

    const yourShare = useMemo(() => {
        if (!splitFriends) return item.amount;
        // The total amount includes your share and friends' shares
        return item.amount - totalOwed;
    }, [item.amount, totalOwed, splitFriends]);

    const resolveMutation = useMutation({
        mutationFn: async () => {
            if (isResolved) return;
            const newNotes = (item.notes ? `${item.notes} | ` : "") + "Resolved: true";
            return transactionsAPI.update(item.id, { notes: newNotes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            setShowBreakdown(false);
        }
    });

    const renderRightActions = () => (
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => onDelete?.(item.id)}
            className="bg-red-500 justify-center items-center w-[80px]"
        >
            <Trash2 size={24} color="#FFF" />
        </TouchableOpacity>
    );

    const ItemContent = (
        <TouchableOpacity 
            activeOpacity={item.notes ? 0.7 : 1}
            onPress={() => splitFriends && setShowBreakdown(true)}
            className={`flex-row items-center py-4 px-4 bg-white dark:bg-slate-900 ${showSwipe ? "border-b border-gray-50 dark:border-slate-800" : ""}`}
        >
            <View className={`w-11 h-11 rounded-full items-center justify-center mr-4 ${isIncome ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                <CategoryIcon size={20} color={isIncome ? "#10b981" : "#ef4444"} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-geist-sb text-base" numberOfLines={1}>{item.title}</Text>
                
                <View className="flex-row items-center mt-0.5">
                    <Text className="text-gray-400 dark:text-gray-500 text-[11px] font-geist-md" numberOfLines={1}>
                        {item.category || "Other"}
                    </Text>
                    {isEMI && (
                        <View className="ml-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800 flex-row items-center">
                            <Calendar size={10} color="#3b82f6" />
                            <Text className="text-blue-500 dark:text-blue-400 text-[9px] font-geist-sb ml-1 uppercase">EMI</Text>
                        </View>
                    )}
                    {envInfo && (
                        <View className="ml-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800 flex-row items-center">
                            <Text style={{ fontSize: 9, marginRight: 2 }}>{envInfo.icon}</Text>
                            <Text className="text-purple-600 dark:text-purple-400 text-[9px] font-geist-sb uppercase">{envInfo.title}</Text>
                        </View>
                    )}
                </View>

                {/* Budget Progress Label */}
                {!isIncome && remainingBudget !== undefined && (
                    <Text className={`text-[10px] font-geist-md mt-0.5 ${remainingBudget < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {remainingBudget < 0 
                            ? `Exceeded ${item.category} budget by ₹${Math.abs(remainingBudget).toLocaleString("en-IN")}`
                            : `₹${remainingBudget.toLocaleString("en-IN")} left in ${item.category} budget`}
                    </Text>
                )}

                {/* Split info on next line */}
                {splitFriends && (
                    <View className="flex-row items-center mt-1">
                        <View className="bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex-row items-center">
                            <Users size={10} color="#FF6A00" />
                            <Text className="text-[#FF6A00] text-[9px] font-geist-sb ml-1 uppercase">Split</Text>
                        </View>
                        {isResolved && (
                            <View className="ml-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-row items-center">
                                <CheckCircle2 size={10} color="#10b981" />
                                <Text className="text-[#10b981] text-[9px] font-geist-sb ml-1 uppercase">Resolved</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
            <View className="items-end">
                <Text className={`font-geist-b text-[17px] ${isIncome ? "text-emerald-500" : "text-red-500"}`}>
                    {isIncome ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <>
            {showSwipe && onDelete ? (
                <Swipeable renderRightActions={renderRightActions} friction={2}>
                    {ItemContent}
                </Swipeable>
            ) : (
                ItemContent
            )}

            {/* Split Breakdown Modal */}
            <Modal
                visible={showBreakdown}
                transparent
                statusBarTranslucent
                animationType="fade"
                onRequestClose={() => setShowBreakdown(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowBreakdown(false)}>
                    <View className="flex-1 bg-black/40 justify-center items-center px-6">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-[32px] w-full overflow-hidden shadow-2xl">
                                {/* Header */}
                                <View className="flex-row items-center justify-between px-6 py-5">
                                    <Text className="text-gray-900 text-lg font-geist-b">Split Breakdown</Text>
                                    <TouchableOpacity onPress={() => setShowBreakdown(false)}>
                                        <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                                            <X size={18} color="#64748b" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Summary View */}
                                <View className="p-6 pt-3">
                                    <View className="flex-row justify-between mb-4">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-1">Total Paid</Text>
                                            <Text className="text-gray-900 text-xl font-geist-b">₹{item.amount.toLocaleString("en-IN")}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-1">Your Share</Text>
                                            <Text className="text-emerald-600 text-xl font-geist-b">₹{yourShare.toLocaleString("en-IN")}</Text>
                                        </View>
                                    </View>
                                    <View className="bg-white rounded-full p-4 border border-orange-100 flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                                                <TrendingUp size={20} color="#FF6A00" />
                                            </View>
                                            <Text className="text-gray-700 font-geist-sb text-sm">Owed to You</Text>
                                        </View>
                                        <Text className="text-[#FF6A00] text-lg font-geist-b">₹{totalOwed.toLocaleString("en-IN")}</Text>
                                    </View>
                                </View>

                                {/* Friends Breakdown */}
                                <View className="p-6 pt-0">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-4">Friend Details</Text>
                                    <View className="gap-y-3">
                                        {splitFriends?.map((f, idx) => (
                                            <View key={idx} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <View className="flex-row items-center">
                                                    <Image source={f.avatar} className="w-10 h-10 rounded-full bg-white" />
                                                    <Text className="text-gray-700 font-geist-sb text-sm ml-3">{f.name}</Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Text className="text-gray-400 text-xs mr-2">pays you</Text>
                                                    <Text className="text-gray-900 font-geist-b text-base">₹{f.amount.toLocaleString("en-IN")}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={() => resolveMutation.mutate()}
                                    disabled={isResolved || resolveMutation.isPending}
                                    className={`mx-5 mb-5 py-3 rounded-full items-center justify-center shadow-lg ${
                                        isResolved ? "bg-gray-100 shadow-gray-100" : "bg-[#FF6A00] shadow-orange-100"
                                    }`}
                                >
                                    {resolveMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className={`font-geist-sb text-base ${isResolved ? "text-gray-400" : "text-white"}`}>
                                            {isResolved ? "Already resolved" : "Mark as resolved"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
