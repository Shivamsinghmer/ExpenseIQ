import React, { useState, useEffect, forwardRef, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { 
    BottomSheetModal, 
    BottomSheetScrollView, 
    BottomSheetBackdrop,
    BottomSheetTextInput 
} from "@gorhom/bottom-sheet";
import { X, Check, Trash2, Calendar, ShoppingBag } from "lucide-react-native";
import { ScannedTransaction, transactionsAPI, paymentsAPI } from "../services/api";
import { useCurrency } from "../providers/CurrencyProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
    transactions: ScannedTransaction[];
    onClose: () => void;
    onSuccess: (count: number) => void;
    onUpgrade: () => void;
}

export const MultiScanPreviewModal = forwardRef<BottomSheetModal, Props>(({ transactions: initialTransactions, onClose, onSuccess, onUpgrade }, ref) => {
    const { currency } = useCurrency();
    const queryClient = useQueryClient();
    const [transactions, setTransactions] = useState<ScannedTransaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const { data: subscription } = useQuery({
        queryKey: ["subscriptionStatus"],
        queryFn: async () => {
            const res = await paymentsAPI.checkStatus();
            return res.data;
        },
    });

    const isExpired = !subscription?.isPro && subscription?.trialEndDate && new Date() > new Date(subscription.trialEndDate);

    const snapPoints = useMemo(() => ["90%"], []);

    useEffect(() => {
        setTransactions(initialTransactions);
        setSelectedIds(initialTransactions.map((_, i) => i));
    }, [initialTransactions]);

    const toggleSelection = (index: number) => {
        if (selectedIds.includes(index)) {
            setSelectedIds(selectedIds.filter(i => i !== index));
        } else {
            setSelectedIds([...selectedIds, index]);
        }
    };

    const updateTransaction = (index: number, field: keyof ScannedTransaction, value: string | number) => {
        const updated = [...transactions];
        (updated[index] as any)[field] = value;
        setTransactions(updated);
    };

    const removeTransaction = (index: number) => {
        const newTransactions = transactions.filter((_, i) => i !== index);
        setTransactions(newTransactions);
        setSelectedIds(selectedIds.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const handleImport = async () => {
        if (selectedIds.length === 0) return;

        setIsImporting(true);
        try {
            const toImport = transactions
                .filter((_, i) => selectedIds.includes(i))
                .map(t => ({
                    title: t.merchant || "Untitled",
                    amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
                    type: t.type || "EXPENSE",
                    category: t.category || "Other",
                    date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
                    notes: "Imported via Multi-Scan",
                }));

            await transactionsAPI.bulkCreate(toImport);
            
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["summary"] }),
                queryClient.invalidateQueries({ queryKey: ["streak"] }),
                queryClient.invalidateQueries({ queryKey: ["allTxnsForAnalytics"] })
            ]);
            
            onSuccess(toImport.length);
        } catch (error) {
            console.error("Bulk Import Error:", error);
        } finally {
            setIsImporting(false);
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onDismiss={onClose}
            enablePanDownToClose
            handleIndicatorStyle={{ backgroundColor: "#E5E7EB" }}
            backgroundStyle={{ borderRadius: 32 }}
        >
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity onPress={() => (ref as any).current?.dismiss()}>
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-geist-b">Confirm Transactions</Text>
                    <View style={{ width: 24 }} />
                </View>

                <BottomSheetScrollView className="flex-1 px-6 pt-2">
                    <Text className="text-gray-500 text-sm font-geist-md mb-6">
                        We found {transactions.length} transactions. Select the ones you want to save.
                    </Text>

                    {transactions.map((item, index) => {
                        const isSelected = selectedIds.includes(index);
                        return (
                            <View 
                                key={index} 
                                className={`mb-4 p-4 rounded-3xl border ${isSelected ? 'border-[#FF6A00] bg-orange-50/50' : 'border-gray-100 bg-white'}`}
                                style={{
                                    borderColor: isSelected ? '#FF6A00' : '#F3F4F6',
                                    backgroundColor: isSelected ? 'rgba(255, 106, 0, 0.05)' : '#FFFFFF'
                                }}
                            >
                                <View className="flex-row items-center justify-between mb-4">
                                    <TouchableOpacity 
                                        onPress={() => toggleSelection(index)}
                                        className={`w-6 h-6 rounded-full items-center justify-center border ${isSelected ? 'bg-[#FF6A00] border-[#FF6A00]' : 'border-gray-300'}`}
                                    >
                                        {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity onPress={() => removeTransaction(index)}>
                                        <Trash2 size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>

                                <View className="gap-y-3">
                                    {/* Merchant Name */}
                                    <View className="flex-row items-center">
                                        <ShoppingBag size={14} color="#9ca3af" />
                                        <BottomSheetTextInput
                                            className="ml-2 flex-1 text-gray-900 font-geist-sb text-base p-0"
                                            value={item.merchant}
                                            onChangeText={(val) => updateTransaction(index, "merchant", val)}
                                            placeholder="Merchant"
                                        />
                                    </View>

                                    {/* Amount & Date */}
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-100">
                                            <Text className="text-[#FF6A00] font-geist-b text-sm mr-1">{currency.symbol}</Text>
                                            <BottomSheetTextInput
                                                className="text-gray-900 font-geist-b text-sm p-0 min-w-[50px]"
                                                value={item.amount?.toString()}
                                                onChangeText={(val) => updateTransaction(index, "amount", val.replace(/[^0-9.]/g, ""))}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>

                                        <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-100">
                                            <Calendar size={12} color="#9ca3af" />
                                            <Text className="text-gray-500 font-geist-md text-[11px] ml-1.5">
                                                {item.date ? new Date(item.date).toLocaleDateString() : "Today"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {transactions.length === 0 && (
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-400 font-geist-md italic">No transactions detected</Text>
                        </View>
                    )}
                    <View style={{ height: 40 }} />
                </BottomSheetScrollView>

                {/* Footer */}
                <View className="p-6 border-t border-gray-100 bg-white">
                    <TouchableOpacity
                        onPress={isExpired ? onUpgrade : handleImport}
                        disabled={isImporting || isExpired || selectedIds.length === 0}
                        className={`w-full py-4 rounded-[100px] items-center justify-center ${isImporting || isExpired || selectedIds.length === 0 ? 'bg-gray-200' : 'bg-[#FF6A00]'}`}
                        style={{ opacity: isImporting ? 0.7 : 1, backgroundColor: isImporting || isExpired || selectedIds.length === 0 ? '#e5e7eb' : '#FF6A00' }}
                    >
                        {isImporting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-geist-b text-base">
                                {isExpired ? "Upgrade to Save" : (selectedIds.length > 0 ? `Import ${selectedIds.length} Transactions` : 'Select Transactions')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheetModal>
    );
});
