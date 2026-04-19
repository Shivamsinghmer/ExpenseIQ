import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
    Dimensions,
    Image,
    ActivityIndicator,
} from "react-native";
import SkeletonLoader from "../../components/SkeletonLoader";
import { LineChart } from "../../components/LineChart";
import Svg, { Path } from "react-native-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { transactionsAPI, paymentsAPI, streaksAPI, type SummaryResponse, type Transaction } from "../../services/api";
import {
    Landmark, Wallet, ChevronRight, List, Flame, RefreshCw, Map,
    ArrowDown, ArrowUp, File, Crown, AlertCircle, Clock, MessageSquare, Sparkles,
    Utensils, Coffee, ShoppingCart, Car, Home as HomeIcon,
    Zap, HeartPulse, Plane, Gamepad2, GraduationCap,
    Gift, TrendingUp, Wallet as WalletIcon, MoreHorizontal, Edit2
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


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
    Salary: WalletIcon,
    Other: MoreHorizontal,
};

function TransactionItem({ item }: { item: Transaction }) {
    const isIncome = item.type === "INCOME";
    const CategoryIcon = CATEGORY_ICONS[item.category || "Other"] || MoreHorizontal;

    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 dark:border-slate-800 shadow-sm">
            <View
                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isIncome ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
            >
                <CategoryIcon size={20} color={isIncome ? "#10b981" : "#ef4444"} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-geist-sb text-base">{item.title}</Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs font-geist-md mt-0.5">
                    {item.category || "Other"}
                </Text>
            </View>
            <Text className={`font-geist-b text-base ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                {isIncome ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
            </Text>
        </View>
    );
}

const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

function generatePdfHtml(transactions: Transaction[], summary: SummaryResponse) {
    const rows = transactions
        .map(
            (t) => `
        <tr>
            <td>${new Date(t.date).toDateString()}</td>
            <td>${escapeHtml(t.title)}</td>
            <td style="color: ${t.type === "INCOME" ? "#22c55e" : "#ef4444"}; font-weight: bold;">
                ${t.type === "INCOME" ? "+" : "-"} &#8377; ${t.amount.toFixed(2)}
            </td>
            <td>${t.type}</td>
            <td>${escapeHtml(t.category || "-")}</td>
            <td>${escapeHtml(t.notes || "-")}</td>
        </tr>`
        )
        .join("");

    return `
    <html>
    <head>
        <meta charset="UTF-8" />
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1a1a1a; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FF6A00; padding-bottom: 20px; }
            .header h1 { font-size: 28px; color: #FF6A00; margin-bottom: 4px; letter-spacing: 1px; }
            .header p { color: #666; font-size: 12px; }
            .summary { display: flex; gap: 16px; margin-bottom: 30px; }
            .summary-card { flex: 1; padding: 16px; border: 2px solid #000; background: #fff; }
            .summary-card h3 { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
            .summary-card .amount { font-size: 22px; font-weight: 900; }
            .income .amount { color: #22c55e; }
            .expense .amount { color: #ef4444; }
            .balance .amount { color: #0066ff; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #000; color: #fff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
            tr:nth-child(even) { background: #f9f9f9; }
            .section-title { font-size: 16px; font-weight: 900; margin-bottom: 12px; color: #000; border-left: 4px solid #FF6A00; padding-left: 12px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000; color: #999; font-size: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ExpensePal</h1>
            <p>Transaction Report — Generated on ${new Date().toDateString()}</p>
        </div>
        <div class="summary">
            <div class="summary-card income">
                <h3>Total Income</h3>
                <div class="amount">&#8377; ${summary.totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card expense">
                <h3>Total Expenses</h3>
                <div class="amount">&#8377; ${summary.totalExpense.toFixed(2)}</div>
            </div>
            <div class="summary-card balance">
                <h3>Balance</h3>
                <div class="amount">&#8377; ${summary.balance.toFixed(2)}</div>
            </div>
        </div>
        <div class="section-title">All Transactions (${transactions.length})</div>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="footer">
            <p>ExpensePal — Smart Financial Tracking</p>
        </div>
    </body>
    </html>`;
}

import { useSheet } from "../../providers/sheet-provider";
import * as ImagePicker from 'expo-image-picker';
import BottomSheet from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { BudgetSheet } from "../../components/BudgetSheet";
import { budgetsAPI } from "../../services/api";

export default function Dashboard() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [pdfLoading, setPdfLoading] = useState(false);
    const [catTab, setCatTab] = useState<"current" | "prev">("current");
    const queryClient = useQueryClient();
    const { openSheet } = useSheet();
    const budgetSheetRef = useRef<BottomSheet>(null);

    const { data: budgetsData } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const res = await budgetsAPI.getAll();
            return res.data;
        }
    });

    const handleScanAndRecord = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Camera access is needed to scan receipts.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            openSheet({ image: result.assets[0].uri });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            queryClient.clear();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const [range, setRange] = useState<"1W" | "1M" | "3M" | "1Y" | "All">("1M");

    const getDateRange = (): Record<string, string> | undefined => {
        const end = new Date();
        const start = new Date();
        switch (range) {
            case "1W": start.setDate(end.getDate() - 7); break;
            case "1M": start.setMonth(end.getMonth() - 1); break;
            case "3M": start.setMonth(end.getMonth() - 3); break;
            case "1Y": start.setFullYear(end.getFullYear() - 1); break;
            case "All": return undefined;
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    const {
        data: summary,
        isLoading: isLoadingSummary,
        refetch,
        isRefetching,
    } = useQuery<SummaryResponse>({
        queryKey: ["summary", range],
        queryFn: async () => {
            const params = getDateRange();
            const res = await transactionsAPI.getSummary(params);
            return res.data;
        },
    });

    const {
        data: subscription,
        refetch: refetchSubscription,
    } = useQuery({
        queryKey: ["subscriptionStatus"],
        queryFn: async () => {
            const res = await paymentsAPI.checkStatus();
            return res.data;
        },
    });

    const {
        data: streakStats,
        isLoading: isLoadingStreak,
        refetch: refetchStreak,
    } = useQuery({
        queryKey: ["streak"],
        queryFn: async () => {
            const res = await streaksAPI.getStats();
            return res.data;
        },
    });

    const showTrialBanner = !subscription?.isPro && subscription?.trialEndDate;

    // Prepare Chart Data
    const chartDates = summary?.chartData?.map((d) => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || [];
    const incomeData = summary?.chartData?.map((d) => d.income) || [];
    const expenseData = summary?.chartData?.map((d) => d.expense) || [];

    const handleDownloadPdf = async () => {
        try {
            setPdfLoading(true);
            if (!summary) {
                Alert.alert("Error", "Dashboard data not ready. Please wait.");
                return;
            }

            const res = await transactionsAPI.getAll({ limit: "9999", page: "1" });
            const allTransactions = res.data.transactions;

            if (!allTransactions || allTransactions.length === 0) {
                Alert.alert("No Data", "No transactions to export.");
                return;
            }

            const html = generatePdfHtml(allTransactions, summary);
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            if (await Sharing.isAvailableAsync()) {
                const options: Sharing.SharingOptions = {
                    mimeType: "application/pdf",
                    dialogTitle: "ExpensePal Transactions Report",
                };
                if (Platform.OS === "ios") {
                    options.UTI = "com.adobe.pdf";
                }
                await Sharing.shareAsync(uri, options);
            } else {
                Alert.alert("Success", `PDF saved to: ${uri}`);
            }
        } catch (error: any) {
            console.error("PDF generation error:", error);
            Alert.alert("Error", `Failed to generate PDF: ${error.message || "Unknown error"}`);
        } finally {
            setPdfLoading(false);
        }
    };

    if (isLoadingSummary || isLoadingStreak) {
        return <SkeletonLoader type="dashboard" />;
    }

    const handleProPress = () => {
        if (subscription?.isPro) {
            const daysLeft = subscription.proExpiresAt
                ? Math.ceil((new Date(subscription.proExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            Alert.alert(
                "Pro Subscription",
                `You are a Pro member!\n\n${daysLeft > 0 ? `Your subscription expires in ${daysLeft} days.` : "Your subscription is active."}`,
                [{ text: "OK" }]
            );
        } else {
            router.push("/subscription");
        }
    };

    const handleRefresh = async () => {
        await Promise.all([refetch(), refetchSubscription(), refetchStreak()]);
    };

    const firstName = user?.firstName || "User";
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const totalExpense = summary?.totalExpense || 0;
    const budget = budgetsData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const remaining = Math.max(budget - totalExpense, 0);
    const spendPercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;
    const expenseCount = summary?.expenseCount || 0;
    const avgPerDay = expenseCount > 0 ? Math.round(totalExpense / 30) : 0;

    // Get current and previous month for category tabs
    const currentMonthName = today.toLocaleDateString("en-IN", { month: "long" });
    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthName = prevMonth.toLocaleDateString("en-IN", { month: "short" });

    return (
        <View className="flex-1">
            <ScrollView
                className="flex-1 bg-[#F5F5F5]"
                contentContainerStyle={{ paddingBottom: 140 }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#FF6A00" />
                }
            >
            {/* Trial/Pro Status Banner */}
            {showTrialBanner && (
                <View
                    className={`px-4 pb-3 flex-row items-center justify-between ${new Date() > new Date(subscription!.trialEndDate!) ? "bg-red-500" : "bg-[#FF6A00]"
                        }`}
                    style={{ paddingTop: insets.top + 12 }}
                >
                    <View className="flex-row items-center flex-1">
                        {new Date() > new Date(subscription!.trialEndDate!) ? (
                            <AlertCircle size={18} color="white" />
                        ) : (
                            <Clock size={18} color="white" />
                        )}
                        <Text className="text-white font-geist-b text-xs ml-2 flex-1">
                            {new Date() > new Date(subscription!.trialEndDate!)
                                ? "Free trial ended. Upgrade to Pro."
                                : (() => {
                                    const diff = new Date(subscription!.trialEndDate!).getTime() - new Date().getTime();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    if (days > 0) return `Trial: ${days}d ${hours}h left`;
                                    return `Trial: ${hours}h left`;
                                })()}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/subscription")}
                        className="bg-white/20 px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-white font-geist-b text-[10px] uppercase">Upgrade</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ─── Header: Greeting + Avatar ─── */}
            <View
                className="px-6 pb-4"
                style={{ paddingTop: showTrialBanner ? 20 : insets.top + 20 }}
            >
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-gray-900 text-2xl font-geist-b">Hello, {firstName} 👋</Text>
                        <Text className="text-gray-400 text-sm font-geist-md mt-1">{dateStr}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Account", "Manage your account", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Sign Out", style: "destructive", onPress: handleSignOut },
                            ]);
                        }}
                    >
                        {user?.imageUrl ? (
                            <Image
                                source={{ uri: user.imageUrl }}
                                className="w-10 h-10 rounded-full border-2 border-[#FF6A00]"
                            />
                        ) : (
                            <View className="w-10 h-10 rounded-full bg-[#FF6A00] items-center justify-center">
                                <Text className="text-white font-geist-b text-lg">{firstName.charAt(0)}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Total Monthly Spend Card ─── */}
            <View className="px-5 mb-4">
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
                    <Text className="text-gray-500 text-center text-sm font-geist-md mb-2 mt-1">Total Monthly Spend</Text>
                    <TouchableOpacity 
                        onPress={() => budgetSheetRef.current?.expand()} 
                        className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
                    >
                        <Edit2 size={14} color="#FF6A00" />
                    </TouchableOpacity>
                    
                    <Text className="text-[#FF6A00] text-center text-4xl font-geist-b mb-4">
                        ₹{totalExpense.toLocaleString("en-IN")}
                    </Text>

                    {budget === 0 && (
                        <TouchableOpacity 
                            onPress={() => budgetSheetRef.current?.expand()} 
                            className="bg-orange-50 py-3 rounded-[14px] border border-orange-100 flex-row items-center justify-center mb-3"
                        >
                            <Edit2 size={16} color="#FF6A00" className="mr-4" />
                            <Text className="text-[#FF6A00] font-geist-sb text-sm">Add a Budget first</Text>
                        </TouchableOpacity>
                    )}

                    {/* Progress Bar & Details */}
                    {expenseCount > 0 ? (
                        <>
                            <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${spendPercent}%`,
                                        backgroundColor: spendPercent > 80 ? '#ef4444' : '#22c55e',
                                    }}
                                />
                            </View>

                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-gray-400 text-xs font-geist-md">Remaining</Text>
                                    <Text className="text-emerald-600 text-lg font-geist-b">₹{remaining.toLocaleString("en-IN")}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-xs font-geist-md">Budget</Text>
                                    <Text className="text-gray-800 text-lg font-geist-b">₹{budget.toLocaleString("en-IN")}</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View className="py-4 items-center justify-center border-t border-gray-50 mt-2">
                            <Text className="text-gray-400 font-geist-md text-sm">Add a transaction to continue</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ─── Stat Cards: Expenses, Avg/Day, Streak ─── */}
            <View className="px-5 flex-row gap-3 mb-6">
                <View className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 items-start">
                    <View className="w-9 h-9 rounded-xl bg-orange-50 items-center justify-center mb-3">
                        <List size={18} color="#FF6A00" />
                    </View>
                    <Text className="text-gray-400 text-xs font-geist-md">Expenses</Text>
                    <Text className="text-gray-900 text-xl font-geist-b">{expenseCount}</Text>
                </View>
                <View className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 items-start">
                    <View className="w-9 h-9 rounded-xl bg-orange-50 items-center justify-center mb-3">
                        <TrendingUp size={18} color="#FF6A00" />
                    </View>
                    <Text className="text-gray-400 text-xs font-geist-md">Avg/Day</Text>
                    <Text className="text-gray-900 text-xl font-geist-b">₹{avgPerDay.toLocaleString("en-IN")}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => router.push("/streak")}
                    className="flex-1 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 items-start"
                >
                    <View className="w-9 h-9 rounded-xl bg-orange-50 items-center justify-center mb-3">
                        <Flame size={18} color="#FF6A00" />
                    </View>
                    <Text className="text-gray-400 text-xs font-geist-md">Streak</Text>
                    <Text className="text-gray-900 text-xl font-geist-b">
                        {streakStats?.currentStreak || 0} {streakStats?.currentStreak === 1 ? 'day' : 'days'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ─── Tools Grid ─── */}
            <View className="px-5 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-900 text-xl font-geist-b">Tools</Text>
                </View>
                <View className="flex-row gap-3 mb-3">
                    <TouchableOpacity 
                        onPress={handleScanAndRecord}
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <File size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">Scan & Record</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                        onPress={() => router.push("/ai")}
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <MessageSquare size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">Ask Money</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push("/money-story")}
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <Sparkles size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">Money Story</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-row gap-3">
                    <TouchableOpacity 
                        onPress={() => router.push("/emi-tracker")}
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <Landmark size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">EMI Tracker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push("/envelopes")}
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <Wallet size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">Envelopes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                        onPress={handleDownloadPdf}
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? (
                            <ActivityIndicator size="small" color="#FF6A00" />
                        ) : (
                            <>
                                <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                                    <File size={20} color="#FF6A00" />
                                </View>
                                <Text className="text-gray-900 text-xs font-geist-sb">Report</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Smart Insights ─── */}
            <View className="px-5 mb-6">
                <View className="flex-row items-center mb-4">
                    <Text className="text-gray-900 text-xl font-geist-b">Smart Insights</Text>
                </View>
                {(() => {
                    const insights: { emoji: string; text: string }[] = [];

                    if (totalExpense > 0 && budget > 0) {
                        const pct = Math.round((totalExpense / budget) * 100);
                        if (pct >= 80) {
                            insights.push({ emoji: "⚠️", text: `You've used ${pct}% of your monthly budget. Time to slow down!` });
                        } else if (pct <= 40) {
                            insights.push({ emoji: "🎉", text: `Great job! Only ${pct}% of your budget used so far.` });
                        } else {
                            insights.push({ emoji: "📊", text: `You've spent ${pct}% of your ₹${budget.toLocaleString("en-IN")} budget.` });
                        }
                    }

                    if (avgPerDay > 0) {
                        insights.push({ emoji: "💡", text: `Your daily average is ₹${avgPerDay.toLocaleString("en-IN")}. That's ₹${(avgPerDay * 30).toLocaleString("en-IN")}/month.` });
                    }

                    if (expenseCount > 0) {
                        const avgTxn = Math.round(totalExpense / expenseCount);
                        insights.push({ emoji: "🧾", text: `Average transaction: ₹${avgTxn.toLocaleString("en-IN")} across ${expenseCount} expenses.` });
                    }

                    if (summary?.categoryBreakdown && summary.categoryBreakdown.length > 0) {
                        const topCat = summary.categoryBreakdown[0];
                        insights.push({ emoji: "🏷️", text: `Top category: ${topCat.name} with ₹${topCat.totalSpent.toLocaleString("en-IN")} spent.` });
                    }

                    if (expenseCount > 0 && remaining > 0 && budget > 0) {
                        const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
                        if (daysLeft > 0) {
                            const dailyBudget = Math.round(remaining / daysLeft);
                            insights.push({ emoji: "🎯", text: `You can spend ₹${dailyBudget.toLocaleString("en-IN")}/day for the next ${daysLeft} days.` });
                        }
                    }

                    if (insights.length === 0) {
                        insights.push({ emoji: "✨", text: "Add a transaction to continue and see smart AI insights!" });
                    }

                    return insights.slice(0, 3).map((insight, i) => (
                        <View key={i} className="bg-white rounded-2xl px-4 py-3.5 mb-2.5 flex-row items-center border border-gray-100 shadow-sm">
                            <Text className="text-lg mr-3">{insight.emoji}</Text>
                            <Text className="text-gray-600 text-sm font-geist-md flex-1 leading-5">{insight.text}</Text>
                        </View>
                    ));
                })()}
            </View>


            {/* ─── Recent Transactions ─── */}
            <View className="px-5">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-900 text-xl font-geist-b">Recent Activity</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                        <Text className="text-[#FF6A00] text-sm font-geist-sb">See All</Text>
                    </TouchableOpacity>
                </View>

                {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                    summary.recentTransactions.map((transaction) => (
                        <TransactionItem key={transaction.id} item={transaction} />
                    ))
                ) : (
                    <View className="bg-white border border-gray-200 border-dashed rounded-2xl p-6 items-center justify-center">
                        <File size={20} color="#d1d5db" style={{ marginBottom: 6 }} />
                        <Text className="text-gray-400 text-sm font-geist-md text-center">
                            No transactions yet.{"\n"}Start tracking your expenses!
                        </Text>
                    </View>
                )}
            </View>
            </ScrollView>
            <BudgetSheet ref={budgetSheetRef} onClose={() => budgetSheetRef.current?.close()} />
        </View>
    );
}
