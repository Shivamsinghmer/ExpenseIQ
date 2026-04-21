import React, { forwardRef, useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Check, Utensils, Coffee, ShoppingCart, Car, Home as HomeIcon, Zap, HeartPulse, Plane, Gamepad2, GraduationCap, Gift, TrendingUp, Wallet, MoreHorizontal } from "lucide-react-native";
import { budgetsAPI } from "../services/api";
import { useCurrency } from "../providers/CurrencyProvider";

const CATEGORIES = [
    { name: "Food", icon: Utensils, color: "#FF6B6B" },
    { name: "Coffee", icon: Coffee, color: "#964B00" },
    { name: "Shopping", icon: ShoppingCart, color: "#4DABF7" },
    { name: "Transport", icon: Car, color: "#51CF66" },
    { name: "Rent", icon: HomeIcon, color: "#FCC419" },
    { name: "Bills", icon: Zap, color: "#FFD43B" },
    { name: "Health", icon: HeartPulse, color: "#FF8787" },
    { name: "Travel", icon: Plane, color: "#339AF0" },
    { name: "Fun", icon: Gamepad2, color: "#9775FA" },
    { name: "Education", icon: GraduationCap, color: "#748FFC" },
    { name: "Gifts", icon: Gift, color: "#F06595" },
    { name: "Invest", icon: TrendingUp, color: "#63E6BE" },
    { name: "Salary", icon: Wallet, color: "#37B24D" },
    { name: "Other", icon: MoreHorizontal, color: "#ADB5BD" },
];

export const BudgetSheet = forwardRef<BottomSheet, { onClose: () => void, onChange?: (index: number) => void }>(({ onClose, onChange }, ref) => {
    const queryClient = useQueryClient();
    const { currency } = useCurrency();
    const snapPoints = useMemo(() => ["85%"], []);

    const { data: budgetsData, isLoading } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const res = await budgetsAPI.getAll();
            return res.data;
        }
    });

    const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (budgetsData) {
            const initial: Record<string, string> = {};
            budgetsData.forEach(b => {
                initial[b.category] = b.amount.toString();
            });
            setBudgetInputs(initial);
        }
    }, [budgetsData]);

    const handleChange = (cat: string, text: string) => {
        setBudgetInputs(prev => ({ ...prev, [cat]: text.replace(/[^0-9]/g, "") }));
    };

    const updateMutation = useMutation({
        mutationFn: async () => {
            const newBudgets: { category: string, amount: number }[] = [];
            for (const cat of Object.keys(budgetInputs)) {
                const amt = parseFloat(budgetInputs[cat] || "0");
                if (amt > 0) {
                    newBudgets.push({ category: cat, amount: amt });
                }
            }
            const res = await budgetsAPI.update(newBudgets);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] }); // To refresh analytics
            Alert.alert("Success", "Budgets updated.");
            onClose();
        },
        onError: () => {
            Alert.alert("Error", "Failed to update budgets.");
        }
    });

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />}
            onClose={onClose}
            onChange={onChange}
            handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
            backgroundStyle={{ backgroundColor: "#F5F5F5", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <View className="flex-row items-center justify-between px-5 pb-4">
                <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose(); }}>
                    <X size={22} color="#6B7280" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-geist-b">Set Budgets</Text>
                <TouchableOpacity 
                    onPress={() => updateMutation.mutate()} 
                    disabled={updateMutation.isPending}
                    className="w-9 h-9 rounded-full bg-[#FF6A00] items-center justify-center opacity-90"
                >
                    {updateMutation.isPending ? <ActivityIndicator size="small" color="#FFF" /> : <Check size={18} color="#FFF" strokeWidth={3} />}
                </TouchableOpacity>
            </View>

            <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <Text className="text-gray-500 font-geist-md text-sm mb-4">Set an optional monthly budget for your categories to track limits.</Text>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#FF6A00" style={{ marginTop: 40 }} />
                ) : (
                    CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <View key={cat.name} className="bg-white rounded-2xl flex-row items-center justify-between p-4 mb-3 border border-gray-100">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: cat.color + '1A' }}>
                                        <Icon size={18} color={cat.color} />
                                    </View>
                                    <Text className="text-gray-900 font-geist-sb text-base">{cat.name}</Text>
                                </View>
                                <View className="flex-row items-center justify-end flex-1 max-w-[120px]">
                                    <Text className="text-gray-400 font-geist-md mr-1">{currency.symbol}</Text>
                                    <BottomSheetTextInput
                                        className="font-geist-b text-gray-900 text-right w-full"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={budgetInputs[cat.name] || ""}
                                        onChangeText={(val) => handleChange(cat.name, val)}
                                        selectionColor="#FF6A00"
                                    />
                                </View>
                            </View>
                        );
                    })
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
});
