import React, { useState, useMemo, useRef, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity, RefreshControl,
    ActivityIndicator, Alert, TextInput, ScrollView, SectionList,
    Modal, TouchableWithoutFeedback
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../providers/theme-provider";
import { 
    transactionsAPI, paymentsAPI, budgetsAPI,
    type Transaction, type TransactionListResponse 
} from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
    BadgeDollarSignIcon, Search, X, PieChart, 
    ArrowUpRight, ArrowDownLeft,
    Utensils, Coffee, ShoppingCart, Car, Home as HomeIcon,
    Zap, HeartPulse, Plane, Gamepad2, GraduationCap,
    Gift, TrendingUp, Wallet, MoreHorizontal, Trash2,
    ChevronRight, Filter, Calendar
} from "lucide-react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { BudgetSheet } from "../../components/BudgetSheet";
import SkeletonLoader from "../../components/SkeletonLoader";
import { TransactionItem } from "../../components/TransactionItem";
import { useCurrency } from "../../providers/CurrencyProvider";

// --- Helper: Grouping Logic ---
const groupTransactions = (transactions: Transaction[]) => {
    const months: { [key: string]: { total: number; days: { [key: string]: { total: number; data: Transaction[] } } } } = {};

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();
        
        let dayKey = "Other";
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            dayKey = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            dayKey = "Yesterday";
        } else {
            dayKey = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        }

        if (!months[monthKey]) months[monthKey] = { total: 0, days: {} };
        if (!months[monthKey].days[dayKey]) months[monthKey].days[dayKey] = { total: 0, data: [] };

        months[monthKey].days[dayKey].data.push(tx);
        // Calculate totals (treating INCOME as positive, EXPENSE as negative for month/day display)
        const amount = tx.type === "INCOME" ? tx.amount : -tx.amount;
        months[monthKey].total += amount;
        months[monthKey].days[dayKey].total += amount;
    });

    return months;
};

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

export default function Transactions() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const budgetSheetRef = useRef<BottomSheet>(null);
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { currency } = useCurrency();
    const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
    const [search, setSearch] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [page, setPage] = useState(1);
    const [dateRangeFilter, setDateRangeFilter] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH">("ALL");
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const typeTriggerRef = useRef<View>(null);
    const dateTriggerRef = useRef<View>(null);

    // Callbacks for BottomSheet
    const handleSheetChange = useCallback((index: number) => {
        setIsBudgetSheetOpen(index > 0);
        if (index > 0) {
            setShowTypeDropdown(false);
            setShowDateDropdown(false);
        }
    }, []);

    const toggleTypeDropdown = () => {
        if (isBudgetSheetOpen) return;
        typeTriggerRef.current?.measureInWindow((x, y, width, height) => {
            setDropdownPosition({ top: y + height + 5, left: x });
            setShowTypeDropdown(true);
        });
    };

    const toggleDateDropdown = () => {
        if (isBudgetSheetOpen) return;
        dateTriggerRef.current?.measureInWindow((x, y, width, height) => {
            setDropdownPosition({ top: y + height + 5, left: x });
            setShowDateDropdown(true);
        });
    };

    // Build query params — search is handled locally, NOT sent to API
    const queryParams: Record<string, string> = { page: page.toString(), limit: "200" };
    if (filter !== "ALL") queryParams.type = filter;

    if (dateRangeFilter === "THIS_MONTH") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        queryParams.startDate = start.toISOString();
    } else if (dateRangeFilter === "LAST_MONTH") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        queryParams.startDate = start.toISOString();
        queryParams.endDate = end.toISOString();
    } else {
        // "ALL" = 6 months (5 previous + current)
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        queryParams.startDate = start.toISOString();
    }

    const { data: subscription } = useQuery({
        queryKey: ["subscriptionStatus"],
        queryFn: async () => {
            const res = await paymentsAPI.checkStatus();
            return res.data;
        },
    });

    const { data, isLoading, refetch, isRefetching } = useQuery<TransactionListResponse>({
        queryKey: ["transactions", filter, dateRangeFilter, page],
        queryFn: async () => { const res = await transactionsAPI.getAll(queryParams); return res.data; },
    });

    const { data: budgets } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const res = await budgetsAPI.getAll();
            return res.data;
        },
    });

    const { data: summary } = useQuery({
        queryKey: ["summary", dateRangeFilter],
        queryFn: async () => {
            const res = await transactionsAPI.getSummary(queryParams);
            return res.data;
        },
    });

    const categorySpending = useMemo(() => {
        const spending: Record<string, number> = {};
        summary?.categoryBreakdown?.forEach((cat: any) => {
            spending[cat.name] = cat.totalSpent;
        });
        return spending;
    }, [summary]);

    const getRemainingBudget = useCallback((category?: string) => {
        if (!category || !budgets) return undefined;
        const budget = budgets.find((b: any) => b.category === category);
        if (!budget) return undefined;
        return budget.amount - (categorySpending[category] || 0);
    }, [budgets, categorySpending]);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transactionsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
        },
    });

    // Local search filtering — no API calls, instant results
    const filteredTransactions = useMemo(() => {
        if (!data?.transactions) return [];
        if (!search.trim()) return data.transactions;
        const q = search.trim().toLowerCase();
        return data.transactions.filter(tx =>
            tx.title.toLowerCase().includes(q) ||
            (tx.category && tx.category.toLowerCase().includes(q)) ||
            (tx.notes && tx.notes.toLowerCase().includes(q))
        );
    }, [data?.transactions, search]);

    const groupedData = useMemo(() => {
        if (!filteredTransactions.length) return null;
        return groupTransactions(filteredTransactions);
    }, [filteredTransactions]);

    const isExpired = !!(!subscription?.isPro && subscription?.trialEndDate && new Date() > new Date(subscription.trialEndDate));

    if (isLoading) {
        return <SkeletonLoader type="list" />;
    }

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-background-dark">
            {/* Header */}
            <View 
                className="px-6 pb-4"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center justify-between mb-6">
                    {isSearchActive ? (
                        <View className="flex-1 flex-row items-center bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 mr-4 border border-gray-100 dark:border-slate-700 shadow-sm transition-all duration-300">
                            <Search size={18} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 dark:text-white font-geist-md text-base py-1"
                                placeholder="Search transactions..."
                                placeholderTextColor="#94a3b8"
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearch(""); }}>
                                <X size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text className="text-gray-900 dark:text-white text-[32px] font-geist-b">Transactions</Text>
                    )}
                    <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-full px-3 py-2 border border-gray-100 dark:border-slate-700 shadow-sm">
                        <TouchableOpacity className="mr-3" onPress={() => setIsSearchActive(!isSearchActive)}>
                            <Search size={20} color={isSearchActive ? "#FF6A00" : (isDark ? "#94a3b8" : "#4B5563")} />
                        </TouchableOpacity>
                        <View className="w-[1px] h-4 bg-gray-200 dark:bg-slate-700 mr-3" />
                        <TouchableOpacity 
                            onPress={() => {
                                setShowTypeDropdown(false);
                                setShowDateDropdown(false);
                                budgetSheetRef.current?.expand();
                            }}
                        >
                            <PieChart size={20} color={isDark ? "#94a3b8" : "#4B5563"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Dropdowns */}
                <View className="flex-row items-center mb-2">
                    {/* Type Filter */}
                    <View className="mr-3" ref={typeTriggerRef}>
                        <TouchableOpacity 
                            onPress={toggleTypeDropdown}
                            activeOpacity={0.9}
                            className="bg-[#FF6A00] dark:bg-slate-900 px-5 py-2.5 rounded-full flex-row items-center justify-between min-w-[80px]"
                        >
                            <Text className="text-white dark:text-white font-geist-sb text-base mr-2">
                                {filter === "ALL" ? "All" : filter === "INCOME" ? "Income" : "Expense"}
                            </Text>
                            <ChevronRight size={14} color="white" style={{ transform: [{ rotate: showTypeDropdown ? '90deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {showTypeDropdown && (
                            <Modal transparent visible={showTypeDropdown} animationType="fade" onRequestClose={() => setShowTypeDropdown(false)}>
                                <TouchableWithoutFeedback onPress={() => setShowTypeDropdown(false)}>
                                    <View className="flex-1 bg-transparent items-start">
                                        <View 
                                            style={{ top: dropdownPosition.top, left: dropdownPosition.left }} 
                                            className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-gray-100 dark:border-slate-800 p-1 z-[999] min-w-[120px]"
                                        >
                                            {[
                                                { label: "All", value: "ALL" },
                                                { label: "Income", value: "INCOME" },
                                                { label: "Expense", value: "EXPENSE" }
                                            ].map((t) => (
                                                <TouchableOpacity
                                                    key={t.value}
                                                    onPress={() => { setFilter(t.value as any); setPage(1); setShowTypeDropdown(false); }}
                                                    className={`px-5 py-2 rounded-full mb-1 flex-row items-center ${filter === t.value ? "bg-[#FF6A00]" : ""}`}
                                                >
                                                    <Text className={`font-geist-sb text-base ${filter === t.value ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
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

                    {/* Date Range Filter */}
                    <View ref={dateTriggerRef}>
                        <TouchableOpacity 
                            onPress={toggleDateDropdown}
                            activeOpacity={0.9}
                            className="bg-[#FF6A00] dark:bg-slate-900 px-5 py-2.5 rounded-full flex-row items-center justify-between min-w-[140px]"
                        >
                            <Text className="text-white dark:text-white font-geist-sb text-base mr-2">
                                {dateRangeFilter === "ALL" ? "Last 6 Months" : (dateRangeFilter === "THIS_MONTH" ? "This Month" : "Last Month")}
                            </Text>
                            <ChevronRight size={14} color="white" style={{ transform: [{ rotate: showDateDropdown ? '90deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {showDateDropdown && (
                            <Modal transparent visible={showDateDropdown} animationType="fade" onRequestClose={() => setShowDateDropdown(false)}>
                                <TouchableWithoutFeedback onPress={() => setShowDateDropdown(false)}>
                                    <View className="flex-1 bg-transparent items-start">
                                        <View 
                                            style={{ top: dropdownPosition.top, left: dropdownPosition.left }} 
                                            className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-gray-100 dark:border-slate-800 p-1 z-[999] min-w-[150px]"
                                        >
                                            {[
                                                { label: "Last 6 Months", value: "ALL" },
                                                { label: "This Month", value: "THIS_MONTH" },
                                                { label: "Last Month", value: "LAST_MONTH" }
                                            ].map((t) => (
                                                <TouchableOpacity
                                                    key={t.value}
                                                    onPress={() => { setDateRangeFilter(t.value as any); setPage(1); setShowDateDropdown(false); }}
                                                    className={`px-6 py-2 rounded-full mb-1 flex-row items-center ${dateRangeFilter === t.value ? "bg-[#FF6A00]" : ""}`}
                                                >
                                                    <Text className={`font-geist-sb text-base ${dateRangeFilter === t.value ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
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

            {/* List Content */}
            <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF6A00" />}
            >
                {groupedData && Object.entries(groupedData).map(([month, monthInfo]) => (
                    <View key={month} className="mb-6">
                            {/* Month Header */}
                            <View className="flex-row items-center justify-between px-6 mb-3">
                                <Text className="text-gray-400 font-geist-b text-[13px] tracking-widest">{month}</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-400 font-geist-b text-[13px] mr-1">
                                        {currency.symbol}{Math.abs(monthInfo.total).toLocaleString("en-IN")}
                                    </Text>
                                </View>
                            </View>

                            {/* Days content */}
                            {Object.entries(monthInfo.days).map(([day, dayInfo]) => (
                                <View key={day} className="mb-4">
                                    {/* Day Header */}
                                    <View className="flex-row items-center justify-between px-6 mb-2">
                                        <Text className="text-gray-400 font-geist-md text-[13px]">{day}</Text>
                                        <Text className="text-gray-400 font-geist-md text-[13px]">
                                            {currency.symbol}{Math.abs(dayInfo.total).toLocaleString("en-IN")}
                                        </Text>
                                    </View>

                                    {/* Transaction Cards Wrapper */}
                                    <View className="mx-5 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-50 dark:border-slate-800">
                                        {dayInfo.data.map((tx) => (
                                            <TransactionItem 
                                                key={tx.id} 
                                                item={tx} 
                                                remainingBudget={getRemainingBudget(tx.category)}
                                                onDelete={(id) => {
                                                    if (isExpired) {
                                                        Alert.alert("Trial Expired", "Upgrade to Pro to delete transactions.");
                                                        return;
                                                    }
                                                    Alert.alert("Delete Transaction", `Are you sure you want to delete "${tx.title}"?`, [
                                                        { text: "Cancel", style: "cancel" },
                                                        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
                                                    ]);
                                                }}
                                                isExpired={isExpired}
                                                showSwipe={true}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    {(!filteredTransactions || filteredTransactions.length === 0) && (
                        <View className="items-center justify-center py-20 opacity-50">
                            <BadgeDollarSignIcon size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-base font-geist-md mt-4 text-center px-10">
                                {search.trim() ? `No results for "${search.trim()}"` : "No transactions found for the selected period"}
                            </Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

            <BudgetSheet 
                ref={budgetSheetRef} 
                onClose={() => budgetSheetRef.current?.close()} 
                onChange={handleSheetChange}
            />
        </View>
    );
}
