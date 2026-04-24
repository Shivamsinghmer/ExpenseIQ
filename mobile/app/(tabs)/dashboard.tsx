import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Dimensions,
    Image,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
} from "react-native";
import SkeletonLoader from "../../components/SkeletonLoader";
import { LineChart } from "../../components/LineChart";
import Svg, { Path } from "react-native-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from 'expo-file-system/legacy';
const StorageAccessFramework = (FileSystem as any).StorageAccessFramework;
import { transactionsAPI, paymentsAPI, streaksAPI, type SummaryResponse, type Transaction } from "../../services/api";
import {
    Landmark, Wallet, Timer, ChevronRight, List, Flame, RefreshCw, Map,
    ArrowDown, ArrowUp, File, Crown, AlertCircle, Clock, MessageSquare, Sparkles,
    Utensils, Coffee, ShoppingCart, Car, Home as HomeIcon,
    Zap, HeartPulse, Plane, Gamepad2, GraduationCap,
    Gift, TrendingUp, Wallet as WalletIcon, MoreHorizontal, Edit2
} from "lucide-react-native";
import { TransactionItem } from "../../components/TransactionItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useModal } from "../../providers/ModalProvider";


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
            <td>${escapeHtml(t.notes ? t.notes.replace(/EMI:[^|]+\|\s*/, "") : "-")}</td>
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
                <div class="amount">${(summary as any).currencySymbol || '₹'} ${summary.totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card expense">
                <h3>Total Expenses</h3>
                <div class="amount">${(summary as any).currencySymbol || '₹'} ${summary.totalExpense.toFixed(2)}</div>
            </div>
            <div class="summary-card balance">
                <h3>Balance</h3>
                <div class="amount">${(summary as any).currencySymbol || '₹'} ${summary.balance.toFixed(2)}</div>
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
import { useRef, useEffect } from "react";
import { BudgetSheet } from "../../components/BudgetSheet";
import { budgetsAPI, usersAPI } from "../../services/api";
import { useCurrency, SUPPORTED_CURRENCIES } from "../../providers/CurrencyProvider";

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
    const { currency, setCurrency, formatAmount } = useCurrency();
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [currencyDropdownPosition, setCurrencyDropdownPosition] = useState({ top: 0, right: 0 });
    const currencyTriggerRef = useRef<View>(null);

    const { data: budgetsData } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const res = await budgetsAPI.getAll();
            return res.data;
        }
    });

    const handleScanAndRecord = () => {
        showAppModal("Choose Source", "How would you like to scan your receipt?", [
            { text: "Cancel", onPress: hideAppModal, style: "cancel" },
            { 
                text: "Camera", 
                onPress: async () => {
                    hideAppModal();
                    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                    if (permissionResult.granted === false) {
                        showAppModal("Permission Required", "Camera access is needed.", [{ text: "OK", onPress: hideAppModal }]);
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        allowsEditing: true,
                        quality: 0.7,
                        base64: true,
                    });
                    if (!result.canceled && result.assets[0].base64) {
                        openSheet({ image: result.assets[0].uri, base64: result.assets[0].base64 });
                    }
                }
            },
            { 
                text: "Photos", 
                onPress: async () => {
                    hideAppModal();
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (permissionResult.granted === false) {
                        showAppModal("Permission Required", "Photos access is needed.", [{ text: "OK", onPress: hideAppModal }]);
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        allowsEditing: true,
                        quality: 0.7,
                        base64: true,
                    });
                    if (!result.canceled && result.assets[0].base64) {
                        openSheet({ image: result.assets[0].uri, base64: result.assets[0].base64 });
                    }
                }
            }
        ]);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            queryClient.clear();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    // --- Query Prefetching ---
    useEffect(() => {
        const prefetchData = async () => {
            // Prefetch Transactions (default: Last 6 Months)
            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const txnParams = { 
                page: "1", 
                limit: "20", 
                startDate: sixMonthsAgo.toISOString() 
            };
            
            queryClient.prefetchQuery({
                queryKey: ["transactions", "ALL", "ALL", 1],
                queryFn: () => transactionsAPI.getAll(txnParams).then(res => res.data),
            });

            // Prefetch Analytics (default: This Month)
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            queryClient.prefetchQuery({
                queryKey: ["summary", "thismonth"],
                queryFn: () => transactionsAPI.getSummary({ startDate: thisMonthStart.toISOString() }).then(res => res.data),
            });
            
            // Prefetch All Transactions for Analytics
            queryClient.prefetchQuery({
                queryKey: ["allTxnsForAnalytics", "thismonth"],
                queryFn: () => transactionsAPI.getAll({ startDate: thisMonthStart.toISOString(), limit: "200" }).then(res => res.data),
            });
        };

        const timer = setTimeout(prefetchData, 2000); // Wait 2s after mount to not block initial load
        return () => clearTimeout(timer);
    }, [queryClient]);

    const [range, setRange] = useState<"1W" | "1M" | "3M" | "1Y" | "All">("1M");

    const { showModal: showAppModal, hideModal: hideAppModal } = useModal();

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
                showAppModal("Please wait", "Dashboard data not ready.", [
                    { text: "Okay", onPress: hideAppModal }
                ]);
                return;
            }

            const res = await transactionsAPI.getAll({ limit: "9999", page: "1" });
            const allTransactions = res.data.transactions;

            if (!allTransactions || allTransactions.length === 0) {
                showAppModal("It's empty", "No transactions to export.", [
                    { text: "Okay", onPress: hideAppModal }
                ]);
                return;
            }

            const html = generatePdfHtml(allTransactions, summary);
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            const fileName = "Your_Transactions.pdf";
            const finalUri = (FileSystem as any).cacheDirectory + fileName;
            
            // Rename file to have the correct filename for sharing/saving
            await FileSystem.copyAsync({
                from: uri,
                to: finalUri
            });

            if (Platform.OS === 'android') {
                const SAF = StorageAccessFramework;
                if (SAF) {
                    const permissions = await SAF.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: (FileSystem as any).EncodingType.Base64 });
                        await SAF.createFileAsync(permissions.directoryUri, fileName, 'application/pdf')
                            .then(async (safUri: string) => {
                                await FileSystem.writeAsStringAsync(safUri, base64, { encoding: (FileSystem as any).EncodingType.Base64 });
                                showAppModal("Success", "Report downloaded successfully!", [
                                    { text: "Okay", onPress: hideAppModal }
                                ]);
                            })
                            .catch((e: any) => {
                                console.error(e);
                                Sharing.shareAsync(finalUri);
                            });
                    } else {
                        await Sharing.shareAsync(finalUri);
                    }
                } else {
                    // Fallback to sharing if SAF is not supported in this version/environment
                    await Sharing.shareAsync(finalUri);
                }
            } else {
                await Sharing.shareAsync(finalUri, {
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf',
                    dialogTitle: 'Download Report'
                });
            }
        } catch (error: any) {
            console.error("PDF generation error:", error);
            showAppModal("Sorry!", `Failed to generate PDF: ${error.message || "Unknown error"}`, [
                { text: "Okay", onPress: hideAppModal }
            ]);
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

            showAppModal(
                "Pro Subscription",
                `You are a Pro member!\n\n${daysLeft > 0 ? `Your subscription expires in ${daysLeft} days.` : "Your subscription is active."}`,
                [{ text: "OK", onPress: hideAppModal }]
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

                    <View className="flex-row items-center">
                        {/* Currency Selector */}
                        <View ref={currencyTriggerRef}>
                            <TouchableOpacity
                                onPress={() => {
                                    currencyTriggerRef.current?.measureInWindow((x, y, width, height) => {
                                        setCurrencyDropdownPosition({ top: y + height + 8, right: Dimensions.get('window').width - (x + width) });
                                        setShowCurrencyDropdown(true);
                                    });
                                }}
                                activeOpacity={0.8}
                                className="flex-row items-center bg-white px-3 py-2 rounded-full shadow-sm border border-gray-50 mr-3"
                            >
                                <Text className="text-lg mr-2">{currency.flag}</Text>
                                <Text className="text-sm font-geist-sb text-[#FF6A00]">{currency.symbol}</Text>
                                <ChevronRight size={12} color="#9ca3af" style={{ transform: [{ rotate: showCurrencyDropdown ? '90deg' : '0deg' }], marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                showAppModal("Are you signing out?", "You can always sign back in at any time.", [
                                    { text: "Cancel", onPress: hideAppModal, style: "cancel" },
                                    { text: "Sign Out", style: "destructive", onPress: () => {
                                        hideAppModal();
                                        handleSignOut();
                                    }},
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
                        {formatAmount(totalExpense)}
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
                                    <Text className="text-emerald-600 text-lg font-geist-b">{formatAmount(remaining)}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-xs font-geist-md">Budget</Text>
                                    <Text className="text-gray-800 text-lg font-geist-b">{formatAmount(budget)}</Text>
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
                    <Text className="text-gray-900 text-xl font-geist-b">{formatAmount(avgPerDay)}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => router.push("/streak")}
                    activeOpacity={0.85}
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
                        activeOpacity={0.85}
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
                        activeOpacity={0.85}
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <MessageSquare size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">Ask Money</Text>
                    </TouchableOpacity>
                    <View className="flex-1 relative">
                        <TouchableOpacity 
                            onPress={() => {
                                const today = new Date();
                                const isLastDay = today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                                
                                if (isLastDay) {
                                    router.push("/money-story");
                                } else {
                                    showAppModal("Patience buddy", "Please wait for the end of the month to view your story.", [
                                        { text: "Got it", onPress: hideAppModal }
                                    ]);
                                }
                            }}
                            activeOpacity={0.85}
                            className="bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100 w-full"
                        >
                            <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                                <Sparkles size={20} color="#FF6A00" />
                            </View>
                            <Text className="text-gray-900 text-xs font-geist-sb">Money Story</Text>
                        </TouchableOpacity>
                        
                        {(() => {
                            const today = new Date();
                            const isLastDay = today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                            if (isLastDay) return null;
                            
                            return (
                                <View 
                                    style={{ 
                                        position: 'absolute', 
                                        top: -4, 
                                        right: -4, 
                                        backgroundColor: 'white',
                                        borderRadius: 12,
                                        padding: 4,
                                        borderWidth: 1,
                                        borderColor: '#F3F4F6',
                                    }}
                                >
                                    <Timer size={16} color="#FF6A00" />
                                </View>
                            );
                        })()}
                    </View>
                </View>
                <View className="flex-row gap-3">
                    <TouchableOpacity 
                        onPress={() => router.push("/emi-tracker")}
                        activeOpacity={0.85}
                        className="flex-1 bg-white rounded-[20px] py-5 items-center shadow-sm border border-gray-100"
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <Landmark size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">EMI Tracker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push("/envelopes")}
                        activeOpacity={0.85}
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
                        activeOpacity={0.85}
                    >
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mb-2">
                            <File size={20} color="#FF6A00" />
                        </View>
                        <Text className="text-gray-900 text-xs font-geist-sb">
                            {pdfLoading ? "Downloading" : "Report"}
                        </Text>
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
                        <View key={transaction.id} className="mb-3 bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                            <TransactionItem item={transaction} />
                        </View>
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

            {/* Currency Dropdown Modal */}
            {showCurrencyDropdown && (
                <Modal transparent visible={showCurrencyDropdown} animationType="fade" onRequestClose={() => setShowCurrencyDropdown(false)}>
                    <TouchableWithoutFeedback onPress={() => setShowCurrencyDropdown(false)}>
                        <View className="flex-1 bg-transparent">
                            <View 
                                style={{ 
                                    position: 'absolute', 
                                    top: currencyDropdownPosition.top, 
                                    right: currencyDropdownPosition.right,
                                    width: 120 
                                }}
                                className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-1 z-[999]"
                            >
                                {SUPPORTED_CURRENCIES.map((curr) => (
                                    <TouchableOpacity
                                        key={curr.code}
                                        onPress={() => { setCurrency(curr); setShowCurrencyDropdown(false); }}
                                        className={`px-4 py-2 rounded-full flex-row items-center justify-between ${currency.code === curr.code ? "bg-orange-50" : ""}`}
                                    >
                                        <View className="flex-row items-center">
                                            <Text className="text-lg mr-3">{curr.flag}</Text>
                                            <Text className={`font-geist-sb text-sm ${currency.code === curr.code ? "text-[#FF6A00]" : "text-gray-700"}`}>
                                                {curr.code}
                                            </Text>
                                        </View>
                                        <Text className={`font-geist-sb text-sm ${currency.code === curr.code ? "text-[#FF6A00]" : "text-gray-400"}`}>
                                            {curr.symbol}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
}
