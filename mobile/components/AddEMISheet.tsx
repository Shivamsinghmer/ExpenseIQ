import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
} from "react-native";
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Calendar, Tag, CreditCard, ChevronRight, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emisAPI } from "../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCurrency } from "../providers/CurrencyProvider";

export type AddEMISheetRef = {
    present: () => void;
    dismiss: () => void;
};

const AddEMISheet = forwardRef<AddEMISheetRef>((props, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const queryClient = useQueryClient();
    const { currency } = useCurrency();

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [months, setMonths] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useImperativeHandle(ref, () => ({
        present: () => bottomSheetModalRef.current?.present(),
        dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    const createMutation = useMutation({
        mutationFn: (data: any) => emisAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emis"] });
            bottomSheetModalRef.current?.dismiss();
            resetForm();
        },
    });

    const resetForm = () => {
        setTitle("");
        setAmount("");
        setMonths("");
        setStartDate(new Date());
    };

    const handleSave = () => {
        if (!title || !amount || !months) return;
        
        createMutation.mutate({
            title,
            monthlyAmount: parseFloat(amount),
            totalMonths: parseInt(months),
            startDate: startDate.toISOString(),
            paidMonths: 0,
        });
    };

    const renderBackdrop = (props: any) => (
        <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
        />
    );

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={["65%"]}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <BottomSheetView className="flex-1 px-6 pb-8">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-geist-b text-gray-900">Add New EMI</Text>
                    <TouchableOpacity 
                        onPress={() => bottomSheetModalRef.current?.dismiss()}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    >
                        <X size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <View className="space-y-6">
                    {/* Amount Input */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2">Monthly Amount</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
                            <Text className="text-gray-400 font-geist-sb mr-2">{currency.symbol}</Text>
                            <BottomSheetTextInput
                                className="flex-1 text-gray-900 font-geist-sb text-lg h-12"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    {/* Title Input */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Item Name</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
                            <BottomSheetTextInput
                                className="flex-1 text-gray-900 font-geist-md text-base h-12"
                                placeholder="e.g. Home Loan, iPhone EMI"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        {/* Duration Input */}
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Total Months</Text>
                            <View className="bg-gray-50 rounded-2xl px-4 py-2 h-12 justify-center">
                                <BottomSheetTextInput
                                    className="text-gray-900 font-geist-md text-base h-12"
                                    placeholder="Months"
                                    keyboardType="numeric"
                                    value={months}
                                    onChangeText={setMonths}
                                />
                            </View>
                        </View>

                        {/* Start Date */}
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Start Date</Text>
                            <TouchableOpacity 
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2 h-12"
                            >
                                <Calendar size={16} color="#9ca3af" />
                                <Text className="text-gray-900 font-geist-md text-sm ml-2">
                                    {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setStartDate(date);
                        }}
                    />
                )}

                <View className="flex-1 justify-end mt-8">
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={createMutation.isPending || !title || !amount || !months}
                        className={`w-full py-4 rounded-full items-center justify-center ${(!title || !amount || !months) ? 'bg-gray-200' : 'bg-[#FF6A00]'}`}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-geist-b text-base">Save EMI</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default AddEMISheet;
