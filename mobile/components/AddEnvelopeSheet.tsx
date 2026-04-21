import React, { useState, forwardRef, useImperativeHandle, useRef, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform,
    Modal,
    TouchableWithoutFeedback,
    Dimensions
} from "react-native";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Calendar, Wallet, Target, Clock, X, ChevronRight, Check } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { envelopesAPI } from "../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AddEnvelopeSheetProps {
    onClose: () => void;
}

const PRESET_EMOJIS = ["💰", "🛍️", "🍽️", "✈️", "🚗", "🏠", "📱", "🎁", "🏥", "🎓", "🍹", "🎮", "👗", "💄", "🐾", "🛠️"];

const AddEnvelopeSheet = forwardRef<BottomSheet, AddEnvelopeSheetProps>(({ onClose }, ref) => {
    const queryClient = useQueryClient();
    const snapPoints = React.useMemo(() => ["85%"], []);

    const [title, setTitle] = useState("");
    const [icon, setIcon] = useState("💰");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const emojiTriggerRef = useRef<View>(null);

    const createMutation = useMutation({
        mutationFn: (data: any) => envelopesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["envelopes"] });
            (ref as any)?.current?.close();
            resetForm();
            onClose();
        },
    });

    const resetForm = useCallback(() => {
        setTitle("");
        setIcon("💰");
        setBudget("");
        setStartDate(new Date());
        setEndDate(new Date(new Date().setDate(new Date().getDate() + 30)));
    }, []);

    const handleSave = useCallback(() => {
        if (!title || !budget) return;
        
        createMutation.mutate({
            title,
            icon,
            budget: parseFloat(budget),
            spent: 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    }, [title, budget, icon, startDate, endDate, createMutation]);

    const renderBackdrop = (props: any) => (
        <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
        />
    );

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            onClose={onClose}
            handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
            backgroundStyle={{ backgroundColor: "#F5F5F5", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
            <View className="flex-row justify-between items-center px-6 pb-8">
                <TouchableOpacity 
                    onPress={() => { (ref as any)?.current?.close(); onClose(); }}
                    className="w-8 h-8 items-center justify-center"
                >
                    <X size={22} color="#6b7280" />
                </TouchableOpacity>
                <Text className="text-xl font-geist-b text-gray-900">New Budget Envelope</Text>
                <TouchableOpacity 
                    onPress={handleSave}
                    disabled={createMutation.isPending}
                    className="w-9 h-9 rounded-full bg-[#FF6A00] items-center justify-center"
                    style={{ opacity: createMutation.isPending ? 0.4 : 1 }}
                >
                    {createMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Check size={18} color="#fff" strokeWidth={3} />
                    )}
                </TouchableOpacity>
            </View>

            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} className="px-6">
                <View className="space-y-6">
                    {/* Budget Amount */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2">Budget Amount</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 h-12">
                            <Text className="text-gray-400 font-geist-sb mr-2">₹</Text>
                            <TextInput
                                className="flex-1 text-gray-900 font-geist-sb text-lg h-12"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={budget}
                                onChangeText={setBudget}
                            />
                        </View>
                    </View>

                    {/* Icon Picker - Dropdown Style */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-2">Pick an Icon</Text>
                        <View ref={emojiTriggerRef}>
                            <TouchableOpacity 
                                onPress={() => {
                                    emojiTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownPosition({ top: y + height + 5, left: x });
                                        setShowEmojiDropdown(true);
                                    });
                                }}
                                className="bg-[#FF6A00] dark:bg-slate-900 px-5 py-2 rounded-full flex-row items-center justify-between self-start min-w-[80px]"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-2">{icon}</Text>
                                </View>
                                <ChevronRight size={16} color="white" style={{ transform: [{ rotate: showEmojiDropdown ? '90deg' : '0deg' }] }} className="ml-2" />
                            </TouchableOpacity>

                            {showEmojiDropdown && (
                                <Modal transparent visible={showEmojiDropdown} animationType="fade" onRequestClose={() => setShowEmojiDropdown(false)}>
                                    <TouchableWithoutFeedback onPress={() => setShowEmojiDropdown(false)}>
                                        <View className="flex-1">
                                            <View 
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: dropdownPosition.top, 
                                                    left: dropdownPosition.left,
                                                    width: 200,
                                                    maxHeight: 200 
                                                }}
                                                className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-1 z-[999]"
                                            >
                                                <BottomSheetScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                                    <View className="flex-row flex-wrap gap-2 justify-start">
                                                        {PRESET_EMOJIS.map((emoji) => (
                                                            <TouchableOpacity
                                                                key={emoji}
                                                                onPress={() => {
                                                                    setIcon(emoji);
                                                                    setShowEmojiDropdown(false);
                                                                }}
                                                                className={`w-12 h-12 rounded-full items-center justify-center ${icon === emoji ? 'bg-orange-100' : ''}`}
                                                            >
                                                                <Text className="text-2xl">{emoji}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </BottomSheetScrollView>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>
                            )}
                        </View>
                    </View>

                    {/* Title Input */}
                    <View>
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2 mt-4">Envelope Name</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
                            <TextInput
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

            </BottomSheetScrollView>
        </BottomSheet>
    );
});

export default AddEnvelopeSheet;
