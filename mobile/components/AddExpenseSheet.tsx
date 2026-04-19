import React, { forwardRef, useCallback, useMemo, useState, useEffect } from "react";
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
} from "react-native";
import BottomSheet, { 
    BottomSheetBackdrop, 
    BottomSheetScrollView, 
} from "@gorhom/bottom-sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
    transactionsAPI,
    paymentsAPI,
    budgetsAPI,
    type CreateTransactionData,
} from "../services/api";
import {
    X, Check, Camera, Image as ImageIcon, MessageSquare,
    ChevronRight, CalendarDays, MapPin, Users,
    Utensils, ShoppingBag, Car, HeartPulse, Home as HomeIcon,
    Gamepad2, Zap, Wallet, MoreHorizontal, Plane,
    GraduationCap, Gift, TrendingUp, ShoppingCart, Coffee
} from "lucide-react-native";

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
        const [location, setLocation] = useState<string | null>(null);
        const [isSplit, setIsSplit] = useState(false);
        const [date] = useState(new Date());
        const [scannedImage, setScannedImage] = useState<string | null>(null);

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

        const totalBudget = useMemo(() => {
            return budgetsData?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
        }, [budgetsData]);

        const isExpired = !subscription?.isPro && subscription?.trialEndDate && new Date() > new Date(subscription.trialEndDate);

        const createMutation = useMutation({
            mutationFn: (data: CreateTransactionData) => transactionsAPI.create(data),
            onSuccess: () => {
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
            setLocation(null);
            setIsSplit(false);
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

            createMutation.mutate({
                title,
                amount: parsedAmount,
                type,
                category: selectedCategory || "Other",
                notes: notes.trim() || (location ? `At ${location}` : undefined),
                date: date.toISOString(),
            });
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

                // Get current position with balanced accuracy to avoid long waits
                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                // Wrap geocoding in its own try-catch as it often fails due to network/service issues
                try {
                    let reverse = await Location.reverseGeocodeAsync({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    });

                    if (reverse && reverse.length > 0) {
                        const addr = reverse[0];
                        const parts = [
                            addr.name,
                            addr.street,
                            addr.district,
                            addr.city
                        ].filter(Boolean);
                        const displayAddr = parts.slice(0, 2).join(", ") || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
                        setLocation(displayAddr);
                    } else {
                        // Fallback to coordinates if no address parts found
                        setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
                    }
                } catch (geoError) {
                    console.warn("Reverse geocode failed, falling back to coordinates:", geoError);
                    setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
                }
            } catch (error) {
                console.error("Location error:", error);
                Alert.alert('Location Error', 'Failed to get your location. Please try again.');
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

                        {/* Type Toggle */}
                        <View className="flex-row bg-gray-100 p-1 rounded-xl mt-4">
                            <TouchableOpacity
                                onPress={() => setType("EXPENSE")}
                                className={`flex-1 py-2.5 rounded-lg items-center ${type === "EXPENSE" ? "bg-white shadow-sm" : ""}`}
                            >
                                <Text className={`text-sm font-geist-sb ${type === "EXPENSE" ? "text-red-500" : "text-gray-400"}`}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setType("INCOME")}
                                className={`flex-1 py-2.5 rounded-lg items-center ${type === "INCOME" ? "bg-white shadow-sm" : ""}`}
                            >
                                <Text className={`text-sm font-geist-sb ${type === "INCOME" ? "text-emerald-500" : "text-gray-400"}`}>Income</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
                            {/* Spacers to properly align items to the left on the last row */}
                            {[...Array(Math.max(0, 4 - (QUICK_CATEGORIES.length % 4)))].map((_, i) => (
                                <View key={`spacer-${i}`} style={{ width: '22%' }} />
                            ))}
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
        );
    }
);

export default AddExpenseSheet;
