import React, { forwardRef, useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Image,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import BottomSheet, { 
    BottomSheetBackdrop, 
    BottomSheetScrollView,
    BottomSheetModal,
    BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
    transactionsAPI,
    paymentsAPI,
    budgetsAPI,
    envelopesAPI,
    type CreateTransactionData,
} from "../services/api";
import {
    X, Check, Camera, Image as ImageIcon, MessageSquare,
    ChevronRight, CalendarDays, MapPin, Users,
    Utensils, ShoppingBag, Car, HeartPulse, Home as HomeIcon,
    Gamepad2, Zap, Wallet, MoreHorizontal, Plane,
    GraduationCap, Gift, TrendingUp, TrendingDown, ShoppingCart, Coffee,
    Plus,
    Goal
} from "lucide-react-native";

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

interface AddExpenseSheetProps {
    onClose: () => void;
    onSMSPress: () => void;
    onUpgrade: () => void;
    smsData?: string;
    initialData?: {
        image?: string;
        title?: string;
        amount?: string;
    } | null;
}

const QUICK_CATEGORIES = [
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

const AddExpenseSheet = forwardRef<BottomSheet, AddExpenseSheetProps>(
    ({ onClose, onSMSPress, onUpgrade, smsData, initialData }, ref) => {
        const queryClient = useQueryClient();
        const snapPoints = useMemo(() => ["92%"], []);

        // Form state
        const [quickAddText, setQuickAddText] = useState("");
        const [amount, setAmount] = useState("");
        const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
        const [notes, setNotes] = useState("");
        const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
        const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null);
        const [showTypeDropdown, setShowTypeDropdown] = useState(false);
        const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
        const typeTriggerRef = useRef<View>(null);
        const [location, setLocation] = useState<string | null>(null);
        const [isSplit, setIsSplit] = useState(false);
        const [date] = useState(new Date());
        const [scannedImage, setScannedImage] = useState<string | null>(null);

        // Split state
        const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
        const [friends, setFriends] = useState<{ id: string; name: string; avatar: any }[]>([]);
        const [splitType, setSplitType] = useState<"EQUALLY" | "MANUAL">("EQUALLY");
        const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
        const [showSplitDropdown, setShowSplitDropdown] = useState(false);
        const [newFriendName, setNewFriendName] = useState("");
        const splitTriggerRef = useRef<View>(null);
        const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);

        // Effect to handle initialData when opening
        useEffect(() => {
            if (initialData) {
                if (initialData.image) setScannedImage(initialData.image);
                if (initialData.title) {
                    setQuickAddText(initialData.title);
                    // Attempt to auto-categorize from initial title
                    const matched = QUICK_CATEGORIES.find(c => 
                        initialData.title?.toLowerCase().includes(c.name.toLowerCase())
                    );
                    if (matched) setSelectedCategory(matched.name);
                }
                if (initialData.amount) setAmount(initialData.amount);
            } else {
                setScannedImage(null);
            }
        }, [initialData]);

        // Auto-categorization as user types
        const handleQuickAddChange = (text: string) => {
            setQuickAddText(text);
            if (!text) return;

            const matched = QUICK_CATEGORIES.find(c => 
                text.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matched && !selectedCategory) {
                setSelectedCategory(matched.name);
            }
        };


        const { data: subscription } = useQuery({
            queryKey: ["subscriptionStatus"],
            queryFn: async () => {
                const res = await paymentsAPI.checkStatus();
                return res.data;
            },
        });

        const { data: budgetsData } = useQuery({
            queryKey: ["budgets"],
            queryFn: async () => {
                const res = await budgetsAPI.getAll();
                return res.data;
            }
        });

        const { data: envelopesData } = useQuery({
            queryKey: ["envelopes"],
            queryFn: async () => {
                const res = await envelopesAPI.getAll();
                return res.data;
            }
        });

        const activeEnvelopes = useMemo(() => {
            if (!envelopesData) return [];
            const now = new Date();
            now.setHours(0,0,0,0);
            return envelopesData.filter(e => new Date(e.endDate) >= now);
        }, [envelopesData]);

        const totalBudget = useMemo(() => {
            return budgetsData?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
        }, [budgetsData]);

        const isExpired = !subscription?.isPro && subscription?.trialEndDate && new Date() > new Date(subscription.trialEndDate);

        const createMutation = useMutation({
            mutationFn: (data: CreateTransactionData) => transactionsAPI.create(data),
            onSuccess: (_, variables) => {
                // If linked to envelope, manually update its spent amount
                if (selectedEnvelopeId && variables.amount && variables.type === "EXPENSE") {
                    const env = activeEnvelopes.find(e => e.id === selectedEnvelopeId);
                    if (env) {
                        envelopesAPI.update(env.id, { spent: env.spent + variables.amount })
                            .then(() => queryClient.invalidateQueries({ queryKey: ["envelopes"] }))
                            .catch(e => console.error("Failed to sync envelope", e));
                    }
                }

                queryClient.invalidateQueries({ queryKey: ["transactions"] });
                queryClient.invalidateQueries({ queryKey: ["summary"] });
                resetForm();
                Alert.alert("Success", "Transaction added!");
                onClose();
            },
            onError: (error: any) => {
                if (error.response?.status === 403) {
                    Alert.alert("Trial Expired", "Upgrade to Pro to continue.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Upgrade", onPress: onUpgrade },
                    ]);
                } else {
                    Alert.alert("Error", error.response?.data?.error || "Failed to add transaction");
                }
            },
        });

        const resetForm = () => {
            setQuickAddText("");
            setAmount("");
            setNotes("");
            setSelectedCategory(null);
            setSelectedEnvelopeId(null);
            setLocation(null);
            setIsSplit(false);
            setSelectedFriends([]);
            setFriends([]);
            setSplitType("EQUALLY");
            setManualAmounts({});
        };

        const handleSubmit = () => {
            if (totalBudget === 0) {
                Alert.alert(
                    "Budget Required",
                    "Please set your monthly budget directly from the Home Dashboard or Transactions panel before adding expenses.",
                    [{ text: "OK", style: "default" }]
                );
                return;
            }

            const title = quickAddText.trim() || notes.trim() || selectedCategory || "Untitled Transaction";
            
            // Sanitize amount: remove currency symbols, commas, etc.
            const cleanAmount = (amount || "").replace(/[^0-9.]/g, "");
            const parsedAmount = parseFloat(cleanAmount);

            if (!parsedAmount || parsedAmount <= 0) { 
                Alert.alert("Error", "Please enter a valid amount"); 
                return; 
            }

            const mutationData: any = {
                title,
                amount: parsedAmount,
                type,
                category: selectedCategory || "Other",
                notes: notes.trim() || (location ? `At ${location}` : undefined),
                date: date.toISOString(),
            };

            // If split is active, append split info to notes
            if (isSplit && selectedFriends.length > 0) {
                const total = parsedAmount;
                const splitInfo = selectedFriends.map(id => {
                    const friend = friends.find(f => f.id === id);
                    const amountStr = splitType === "EQUALLY" 
                        ? (total / (selectedFriends.length + 1)).toFixed(2)
                        : manualAmounts[id] || "0";
                    return `${friend?.name}: ₹${amountStr}`;
                }).join(", ");
                
                mutationData.notes = (mutationData.notes ? `${mutationData.notes} | ` : "") + `Split: ${splitInfo}`;
            }

            // Append envelope info if linked
            if (selectedEnvelopeId) {
                const env = activeEnvelopes.find(e => e.id === selectedEnvelopeId);
                if (env) {
                    mutationData.notes = (mutationData.notes ? `${mutationData.notes} | ` : "") + `Env:${env.id}|EnvTitle:${env.title}|EnvIcon:${env.icon || '🎯'}`;
                }
            }

            createMutation.mutate(mutationData);
        };

        const handleCamera = async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Camera access is needed to scan receipts.");
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled) {
                Alert.alert("Scan Started", "Processing receipt image...");
            }
        };

        const handlePhotos = async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Photo library access is needed.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled) {
                Alert.alert("Image Selected", "Processing receipt...");
            }
        };

        const handleImport = () => {
            Alert.alert("Import Statement", "Select a PDF or CSV bank statement to process.", [
                { text: "Cancel", style: "cancel" },
                { text: "Select File", onPress: () => Alert.alert("Select", "File picker coming soon!") }
            ]);
        };

        const [isLocating, setIsLocating] = useState(false);

        const handleLocation = async () => {
            try {
                setIsLocating(true);
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Permission to access location was denied');
                    return;
                }

                // Get current position
                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                try {
                    let reverse = await Location.reverseGeocodeAsync({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    });

                    if (reverse && reverse.length > 0) {
                        const addr = reverse[0];
                        const allParts = [
                            addr.name,
                            addr.street,
                            addr.district,
                            addr.city,
                            addr.subregion,
                            addr.region
                        ].filter(Boolean);
                        
                        const uniqueParts = Array.from(new Set(allParts));
                        
                        if (uniqueParts.length > 0) {
                            setLocation(uniqueParts.slice(0, 2).join(", "));
                        } else {
                            setLocation("Unknown Address");
                        }
                    } else {
                        setLocation("Unknown Address");
                    }
                } catch (geoError) {
                    setLocation("Unknown Address");
                }
            } catch (error) {
                Alert.alert('Location Error', 'Failed to get your location.');
            } finally {
                setIsLocating(false);
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

        const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

        return (
            <>
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                onClose={onClose}
                handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
                backgroundStyle={{ backgroundColor: "#F5F5F5", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pb-4">
                    <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose(); }}>
                        <X size={22} color="#6B7280" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-geist-b">Add Expense</Text>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={createMutation.isPending || !!isExpired}
                        className="w-9 h-9 rounded-full bg-[#FF6A00] items-center justify-center"
                        style={{ opacity: createMutation.isPending || !!isExpired ? 0.4 : 1 }}
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Check size={18} color="#fff" strokeWidth={3} />
                        )}
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Quick Add Section */}
                    <View className="mx-5 bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Text className="text-gray-500 text-base font-geist-md ml-1">Quick Add</Text>
                        </View>
                        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
                            <TextInput
                                className="flex-1 text-gray-800 text-base font-geist-md"
                                placeholder="e.g. Starbucks coffee"
                                placeholderTextColor="#9ca3af"
                                value={quickAddText}
                                onChangeText={handleQuickAddChange}
                            />
                        </View>
                        
                        {/* Scanned Image Preview */}
                        {scannedImage && (
                            <View className="mt-4 rounded-xl overflow-hidden border border-gray-100 h-32 bg-gray-50 flex-row">
                                <Image 
                                    source={{ uri: scannedImage }} 
                                    style={{ width: 80, height: '100%' }}
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-3 justify-center">
                                    <View className="flex-row items-center mb-1">
                                        <Check size={14} color="#22c55e" />
                                        <Text className="text-gray-700 text-[10px] font-geist-sb ml-1 uppercase">Receipt Scanned</Text>
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-geist-md italic">
                                        Processing details...
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => setScannedImage(null)}
                                        className="mt-2"
                                    >
                                        <Text className="text-red-500 text-[10px] font-geist-sb">Remove Photo</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text className="text-gray-400 text-xs font-geist-md text-center mt-4">or scan / import</Text>
                        <View className="flex-row gap-2 mt-4">
                            <TouchableOpacity onPress={handleCamera} className="flex-1 flex-row items-center justify-center bg-gray-50 rounded-xl py-3 border border-gray-100">
                                <Camera size={16} color="#374151" />
                                <Text className="text-gray-700 text-xs font-geist-sb ml-1.5">Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handlePhotos} className="flex-1 flex-row items-center justify-center bg-gray-50 rounded-xl py-3 border border-gray-100">
                                <ImageIcon size={16} color="#374151" />
                                <Text className="text-gray-700 text-xs font-geist-sb ml-1.5">Photos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onSMSPress} 
                                className="flex-1 flex-row items-center justify-center bg-gray-50 rounded-xl py-3 border border-gray-100"
                            >
                                <MessageSquare size={16} color="#374151" />
                                <Text className="text-gray-700 text-xs font-geist-sb ml-1.5">SMS</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Import Statement */}
                        <TouchableOpacity onPress={handleImport} className="flex-row items-center mt-3 bg-orange-50 rounded-xl py-3 px-4">
                            <Text className="text-[#FF6A00] text-sm font-geist-sb flex-1">📄 Import Statement</Text>
                            <ChevronRight size={16} color="#FF6A00" />
                        </TouchableOpacity>
                    </View>

                    {/* Date & Time / Location */}
                    <View className="mx-5 flex-row gap-3 mb-4">
                        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2">Date & Time</Text>
                            <Text className="text-gray-900 text-base font-geist-b">{dateStr}</Text>
                            <Text className="text-gray-500 text-sm font-geist-md">{timeStr}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={handleLocation}
                            disabled={isLocating}
                            className={`flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}
                        >
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-2">Location</Text>
                            <View className="flex-row items-start">
                                <MapPin size={14} color="#FF6A00" style={{ marginTop: 2 }} />
                                <Text className={`text-sm font-geist-md ml-1 flex-1`} numberOfLines={2}>
                                    {location || "Add location"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Section */}
                    <View className="mx-5 bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-3">Amount</Text>
                        <View className="flex-row items-center">
                            <Text className="text-[#FF6A00] text-3xl font-geist-b mr-1">₹</Text>
                            <TextInput
                                className="flex-1 text-gray-900 text-3xl font-geist-b"
                                placeholder="0"
                                placeholderTextColor="#d1d5db"
                                value={amount}
                                onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ""))}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Type Selector - New Dropdown Style */}
                        <View className="flex-row items-center justify-between pt-4 mt-2 border-t border-gray-100">
                            <Text className="text-gray-500 text-base font-geist-md">Amount type</Text>
                            <View ref={typeTriggerRef}>
                                <TouchableOpacity 
                                    onPress={() => {
                                        typeTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                            setDropdownPosition({ top: y + height + 5, right: Dimensions.get('window').width - (x + width) });
                                            setShowTypeDropdown(true);
                                        });
                                    }}
                                    activeOpacity={0.8}
                                    className="bg-gray-50 px-6 py-2 rounded-full border border-gray-100 flex-row items-center min-w-[110px] justify-between"
                                >
                                    <View className="flex-row items-center">
                                        {type === "EXPENSE" ? (
                                            <TrendingDown size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        ) : (
                                            <TrendingUp size={14} color="#10b981" style={{ marginRight: 6 }} />
                                        )}
                                        <Text className={`font-geist-sb text-base ${type === "EXPENSE" ? "text-red-500" : "text-emerald-500"}`}>
                                            {type === "EXPENSE" ? "Expense" : "Income"}
                                        </Text>
                                    </View>
                                    <ChevronRight size={14} color="#9ca3af" style={{ transform: [{ rotate: showTypeDropdown ? '90deg' : '0deg' }], marginLeft: 8 }} />
                                </TouchableOpacity>

                                {showTypeDropdown && (
                                    <Modal transparent visible={showTypeDropdown} animationType="fade" onRequestClose={() => setShowTypeDropdown(false)}>
                                        <TouchableWithoutFeedback onPress={() => setShowTypeDropdown(false)}>
                                            <View className="flex-1 bg-transparent">
                                                <View 
                                                    style={{ 
                                                        position: 'absolute', 
                                                        top: dropdownPosition.top, 
                                                        right: dropdownPosition.right,
                                                        minWidth: 145 
                                                    }}
                                                    className="bg-white rounded-[20px] shadow-2xl border border-gray-100 p-1 z-[999]"
                                                >
                                                    {[
                                                        { label: "Expense", value: "EXPENSE", color: "text-red-500", icon: <TrendingDown size={16} color="#ef4444" /> },
                                                        { label: "Income", value: "INCOME", color: "text-emerald-500", icon: <TrendingUp size={16} color="#10b981" /> }
                                                    ].map((t) => (
                                                        <TouchableOpacity
                                                            key={t.value}
                                                            onPress={() => { setType(t.value as any); setShowTypeDropdown(false); }}
                                                            className={`px-5 py-2 rounded-full flex-row items-center ${type === t.value ? "bg-gray-100" : ""}`}
                                                        >
                                                            <View className="mr-3">{t.icon}</View>
                                                            <Text className={`font-geist-sb text-base ${t.color}`}>
                                                                {t.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </Modal>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Envelope Linking */}
                    {activeEnvelopes.length > 0 && (
                        <>
                            <View className="mx-5 bg-white rounded-2xl px-5 py-4 mb-4 flex-row items-center justify-between border border-gray-100 shadow-sm">
                                <View className="flex-row items-center">
                                    <Goal size={18} color="#FF6A00" />
                                    <Text className="text-gray-900 text-sm font-geist-sb ml-3">Link to Goal</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: "#e5e7eb", true: "#FF6A00" }}
                                    thumbColor="#fff"
                                    onValueChange={(val) => {
                                        if (val && activeEnvelopes.length > 0) {
                                            setSelectedEnvelopeId(activeEnvelopes[0].id);
                                        } else {
                                            setSelectedEnvelopeId(null);
                                        }
                                    }}
                                    value={selectedEnvelopeId !== null}
                                />
                            </View>

                            {selectedEnvelopeId !== null && (
                                <View className="mx-5 bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
                                    <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-4">Select Target Goal</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                        {activeEnvelopes.map(env => {
                                            const isSelected = selectedEnvelopeId === env.id;
                                            return (
                                                <TouchableOpacity
                                                    key={env.id}
                                                    onPress={() => setSelectedEnvelopeId(env.id)}
                                                    className="items-center mr-4"
                                                >
                                                    <View 
                                                        className={`w-14 h-14 rounded-full items-center justify-center mb-1 border-2 ${isSelected ? 'border-[#FF6A00] bg-orange-50' : 'border-transparent bg-gray-50'}`}
                                                    >
                                                        <Text className="text-xl">{env.icon || '🎯'}</Text>
                                                    </View>
                                                    <Text className={`text-[10px] font-geist-md w-14 text-center ${isSelected ? 'text-[#FF6A00]' : 'text-gray-500'}`} numberOfLines={1}>{env.title}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}

                    {/* Split with Friends */}
                    <View className="mx-5 bg-white rounded-2xl px-5 py-4 mb-4 flex-row items-center justify-between border border-gray-100 shadow-sm">
                        <View className="flex-row items-center">
                            <Users size={18} color="#FF6A00" />
                            <Text className="text-gray-900 text-sm font-geist-sb ml-3">Split with Friends</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#e5e7eb", true: "#FF6A00" }}
                            thumbColor="#fff"
                            onValueChange={(val) => setIsSplit(val)}
                            value={isSplit}
                        />
                    </View>

                    {/* Extended Split UI */}
                    {isSplit && (
                        <View className="mx-5 bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
                            <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-4">Select Friends</Text>
                            
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                <TouchableOpacity 
                                    className="items-center mr-4"
                                    onPress={() => setAddFriendModalVisible(true)}
                                >
                                    <View className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 border-dashed items-center justify-center mb-1">
                                        <Plus size={20} color="#9ca3af" />
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-geist-md">Add</Text>
                                </TouchableOpacity>

                                {friends.map((friend) => {
                                    const isSelected = selectedFriends.includes(friend.id);
                                    return (
                                        <TouchableOpacity 
                                            key={friend.id}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                                                } else {
                                                    setSelectedFriends([...selectedFriends, friend.id]);
                                                }
                                            }}
                                            className="items-center mr-4"
                                        >
                                            <View className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isSelected ? 'border-[#FF6A00]' : 'border-transparent'}`}>
                                                <Image source={friend.avatar} className="w-full h-full" />
                                            </View>
                                            <Text className={`text-[10px] mt-1 font-geist-md ${isSelected ? 'text-[#FF6A00] font-geist-sb' : 'text-gray-500'}`}>
                                                {friend.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                                {selectedFriends.length > 0 && (
                                    <View className="border-t border-gray-50 pt-5">
                                        <View className="flex-row items-center justify-between mb-4">
                                            <Text className="text-gray-500 text-sm font-geist-md">Split Type</Text>
                                            <View ref={splitTriggerRef}>
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        splitTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                                            setDropdownPosition({ top: y + height + 5, right: Dimensions.get('window').width - (x + width) });
                                                            setShowSplitDropdown(true);
                                                        });
                                                    }}
                                                    className="bg-gray-50 px-4 py-2 rounded-full border border-gray-100 flex-row items-center"
                                                >
                                                    <Text className="text-gray-700 font-geist-sb text-sm mr-2">
                                                        {splitType === "EQUALLY" ? "Equally" : "Manual"}
                                                    </Text>
                                                    <ChevronRight size={12} color="#9ca3af" style={{ transform: [{ rotate: showSplitDropdown ? '90deg' : '0deg' }] }} />
                                                </TouchableOpacity>

                                                <Modal transparent visible={showSplitDropdown} animationType="fade" onRequestClose={() => setShowSplitDropdown(false)}>
                                                    <TouchableWithoutFeedback onPress={() => setShowSplitDropdown(false)}>
                                                        <View className="flex-1 ">
                                                            <View 
                                                                style={{ position: 'absolute', top: dropdownPosition.top, right: dropdownPosition.right, minWidth: 120 }}
                                                                className="bg-white rounded-[20px] shadow-2xl border border-gray-100 p-1"
                                                            >
                                                                {["EQUALLY", "MANUAL"].map((mode) => (
                                                                    <TouchableOpacity
                                                                        key={mode}
                                                                        onPress={() => { setSplitType(mode as any); setShowSplitDropdown(false); }}
                                                                        className={`px-4 py-2 rounded-full ${splitType === mode ? "bg-gray-100" : ""}`}
                                                                    >
                                                                        <Text className={`font-geist-sb text-sm ${splitType === mode ? "text-[#FF6A00]" : "text-gray-600"}`}>
                                                                            {mode === "EQUALLY" ? "Equally" : "Manual"}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </Modal>
                                            </View>
                                        </View>

                                        {splitType === "EQUALLY" ? (
                                            <View className="rounded-xl p-0">
                                                <Text className="text-[#FF6A00] text-base font-geist-md text-center">
                                                    Each person pays ₹{(parseFloat(amount || "0") / (selectedFriends.length + 1)).toFixed(2)}
                                                </Text>
                                            </View>
                                        ) : (
                                            <View className="gap-y-3">
                                                {selectedFriends.map(id => {
                                                    const friend = friends.find(f => f.id === id);
                                                    return (
                                                        <View key={id} className="flex-row items-center justify-between bg-gray-50 p-1 rounded-2xl border border-gray-100 mb-1.5">
                                                            <Text className="text-gray-700 text-sm font-geist-md ml-2">{friend?.name}</Text>
                                                            <View className="flex-row items-center">
                                                                <Text className="text-gray-400 text-base mr-1">₹</Text>
                                                                <TextInput
                                                                    placeholder="0"
                                                                    className="text-gray-900 font-geist-sb text-base min-w-[0px] text-right mr-1"
                                                                    keyboardType="decimal-pad"
                                                                    value={manualAmounts[id] || ""}
                                                                    onChangeText={(val) => setManualAmounts({ ...manualAmounts, [id]: val })}
                                                                />
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                    {/* Quick Category Chips */}
                    <View className="mx-5 bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-4">Quick Category</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-5 px-1">
                            {QUICK_CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.name;
                                const Icon = cat.icon;
                                return (
                                    <TouchableOpacity
                                        key={cat.name}
                                        onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
                                        className="items-center"
                                        style={{ width: '22%' }}
                                    >
                                        <View 
                                            className={`w-14 h-14 rounded-full items-center justify-center mb-1.5 border-2 ${isSelected ? 'border-[#FF6A00]' : 'border-transparent'}`}
                                            style={{ backgroundColor: isSelected ? '#FFF4ED' : '#F8F9FA' }}
                                        >
                                            <Icon size={24} color={isSelected ? "#FF6A00" : "#495057"} strokeWidth={1.5} />
                                        </View>
                                        <Text className={`text-[10px] font-geist-sb ${isSelected ? 'text-[#FF6A00]' : 'text-gray-500'}`} numberOfLines={1}>{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>


                    {/* Notes */}
                    <View className="mx-5 bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-[10px] font-geist-sb uppercase tracking-wider mb-3">Notes</Text>
                        <TextInput
                            className="text-gray-800 text-sm font-geist-md min-h-[60px]"
                            placeholder="Add a note..."
                            placeholderTextColor="#9ca3af"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save Button */}
                    <View className="mx-5">
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={createMutation.isPending || !!isExpired}
                            className="w-full py-4 rounded-[100px] items-center justify-center"
                            style={{ backgroundColor: createMutation.isPending || !!isExpired ? "#e5e7eb" : "#FF6A00" }}
                            activeOpacity={0.9}
                        >
                            {createMutation.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-geist-b text-base">
                                    {isExpired ? "Upgrade to Save" : "Save Transaction"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Add Friend - Native Modal (Mimicking Paste SMS Sheet) */}
            <Modal
                visible={addFriendModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddFriendModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.0)", justifyContent: "flex-end" }}>
                        <TouchableWithoutFeedback onPress={() => setAddFriendModalVisible(false)}>
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>
                        
                        <View 
                            className="bg-[#F9FAFB] rounded-t-[36px] overflow-hidden"
                            style={{ maxHeight: "65%" }}
                        >
                            {/* Handle Indicator */}
                            <View className="items-center pt-3 pb-6">
                                <View className="w-12 h-1 bg-gray-300 rounded-full" />
                            </View>

                            {/* Header */}
                            <View className="flex-row items-center justify-between px-6 pt-2 pb-0">
                                
                                <Text className="text-gray-900 text-lg font-geist-sb">Add Friend</Text>
                                <View className="w-6" />
                                <TouchableOpacity onPress={() => setAddFriendModalVisible(false)}>
                                    <X size={22} color="#6B7280" />
                                </TouchableOpacity>
                                
                            </View>

                            <View className="px-6 pb-6 pt-1">
                                <Text className="text-gray-400 text-sm font-geist-md mb-8">Create a name to start splitting expenses</Text>
                                
                                <View className="bg-white p-1 rounded-full border border-gray-100 mb-8">
                                    <TextInput
                                        className="px-5 py-3 text-gray-900 font-geist-md text-base"
                                        placeholder="e.g. John Doe"
                                        placeholderTextColor="#9ca3af"
                                        value={newFriendName}
                                        onChangeText={setNewFriendName}
                                        autoFocus
                                    />
                                </View>

                                <View className="flex-row gap-4 mb-6">
                                    <TouchableOpacity 
                                        onPress={() => setAddFriendModalVisible(false)}
                                        className="flex-1 py-3 rounded-full bg-gray-100 items-center justify-center"
                                    >
                                        <Text className="text-gray-500 font-geist-sb text-base">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            if (!newFriendName.trim()) return;
                                            const newFriend = {
                                                id: Date.now().toString(),
                                                name: newFriendName.trim(),
                                                avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
                                            };
                                            setFriends([...friends, newFriend]);
                                            setSelectedFriends([...selectedFriends, newFriend.id]);
                                            setNewFriendName("");
                                            setAddFriendModalVisible(false);
                                        }}
                                        className="flex-1 py-3 rounded-full bg-[#FF6A00] items-center justify-center shadow-lg shadow-orange-200"
                                    >
                                        <Text className="text-white font-geist-sb text-base">Create & Select</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            </>
        );
    }
);

export default AddExpenseSheet;
