import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
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
import { Calendar, Wallet, Target, Clock, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { envelopesAPI } from "../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";

export type AddEnvelopeSheetRef = {
    present: () => void;
    dismiss: () => void;
};

const PRESET_EMOJIS = ["💰", "🛍️", "🍽️", "✈️", "🚗", "🏠", "📱", "🎁", "🏥", "🎓", "🍹", "🎮", "👗", "💄", "🐾", "🛠️"];

const AddEnvelopeSheet = forwardRef<AddEnvelopeSheetRef>((props, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [icon, setIcon] = useState("💰");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useImperativeHandle(ref, () => ({
        present: () => bottomSheetModalRef.current?.present(),
        dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    const createMutation = useMutation({
        mutationFn: (data: any) => envelopesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["envelopes"] });
            bottomSheetModalRef.current?.dismiss();
            resetForm();
        },
    });

    const resetForm = () => {
        setTitle("");
        setIcon("💰");
        setBudget("");
        setStartDate(new Date());
        setEndDate(new Date(new Date().setDate(new Date().getDate() + 30)));
    };

    const handleSave = () => {
        if (!title || !budget) return;
        
        createMutation.mutate({
            title,
            icon,
            budget: parseFloat(budget),
            spent: 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
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
            snapPoints={["80%"]}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <BottomSheetView className="flex-1 px-6 pb-8">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-geist-b text-gray-900">New Budget Envelope</Text>
                    <TouchableOpacity 
                        onPress={() => bottomSheetModalRef.current?.dismiss()}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    >
                        <X size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <View className="space-y-6">
                    {/* Budget Amount */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2">Budget Amount</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 h-12">
                            <Text className="text-gray-400 font-geist-sb mr-2">₹</Text>
                            <BottomSheetTextInput
                                className="flex-1 text-gray-900 font-geist-sb text-lg h-12"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={budget}
                                onChangeText={setBudget}
                            />
                        </View>
                    </View>

                    {/* Icon Picker */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-3 mt-2">Pick an Icon</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {PRESET_EMOJIS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => setIcon(emoji)}
                                    className={`w-12 h-12 rounded-xl items-center justify-center ${icon === emoji ? 'bg-[#FF6A00] shadow-sm' : 'bg-gray-50 border border-gray-100'}`}
                                >
                                    <Text className="text-xl">{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Title Input */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Envelope Name</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
                            <BottomSheetTextInput
                                className="flex-1 text-gray-900 font-geist-md text-base h-12"
                                placeholder="e.g. Shopping, Diwali, Vacation"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                    </View>

                    {/* Date Range */}
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Start Date</Text>
                            <TouchableOpacity 
                                onPress={() => setShowStartPicker(true)}
                                className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2 h-12"
                            >
                                <Calendar size={16} color="#9ca3af" />
                                <Text className="text-gray-900 font-geist-md text-sm ml-2">
                                    {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">End Date</Text>
                            <TouchableOpacity 
                                onPress={() => setShowEndPicker(true)}
                                className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2 h-12"
                            >
                                <Calendar size={16} color="#9ca3af" />
                                <Text className="text-gray-900 font-geist-md text-sm ml-2">
                                    {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowStartPicker(false);
                            if (date) setStartDate(date);
                        }}
                    />
                )}

                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowEndPicker(false);
                            if (date) setEndDate(date);
                        }}
                    />
                )}

                <View className="flex-1 justify-end mt-8">
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={createMutation.isPending || !title || !budget}
                        className={`w-full py-4 rounded-full items-center justify-center ${(!title || !budget) ? 'bg-gray-200' : 'bg-[#FF6A00]'}`}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-geist-b text-base">Create Envelope</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

export default AddEnvelopeSheet;
