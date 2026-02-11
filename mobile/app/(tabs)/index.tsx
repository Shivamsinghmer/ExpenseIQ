import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions,
} from "react-native";
import { LineChart } from "../../components/LineChart";
import Svg, { Path } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../providers/theme-provider";
import { transactionsAPI, type SummaryResponse, type Transaction } from "../../services/api";



function TransactionItem({ item }: { item: Transaction }) {
    const isIncome = item.type === "INCOME";
    return (
        <View className="bg-white dark:bg-surface-dark rounded-2xl p-4 mb-3 flex-row items-center border border-border dark:border-border-dark shadow-sm">
            <View
                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isIncome ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}
            >
                <Text className="text-xl">{isIncome ? "💰" : "💳"}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-bold text-base">{item.title}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                    {new Date(item.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                    })}
                    {item.tags.length > 0 && ` • ${item.tags.map((t) => t.name).join(", ")}`}
                </Text>
            </View>
            <Text className={`font-bold text-base ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {isIncome ? "+" : "-"}₹{item.amount.toFixed(2)}
            </Text>
        </View>
    );
}

function generatePdfHtml(transactions: Transaction[], summary: SummaryResponse) {
    const rows = transactions
        .map(
            (t) => `
        <tr>
            <td>${new Date(t.date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</td>
            <td>${t.title}</td>
            <td style="color: ${t.type === "INCOME" ? "#22c55e" : "#ef4444"}; font-weight: bold;">
                ${t.type === "INCOME" ? "+" : "-"}₹${t.amount.toFixed(2)}
            </td>
            <td>${t.type}</td>
            <td>${t.tags.map((tag) => tag.name).join(", ") || "-"}</td>
            <td>${t.notes || "-"}</td>
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
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ff3333; padding-bottom: 20px; }
            .header h1 { font-size: 28px; color: #ff3333; margin-bottom: 4px; letter-spacing: 1px; }
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
            .section-title { font-size: 16px; font-weight: 900; margin-bottom: 12px; color: #000; border-left: 4px solid #ff3333; padding-left: 12px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000; color: #999; font-size: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ExpenseIQ</h1>
            <p>Transaction Report — Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div class="summary">
            <div class="summary-card income">
                <h3>Total Income</h3>
                <div class="amount">₹${summary.totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card expense">
                <h3>Total Expenses</h3>
                <div class="amount">₹${summary.totalExpense.toFixed(2)}</div>
            </div>
            <div class="summary-card balance">
                <h3>Balance</h3>
                <div class="amount">₹${summary.balance.toFixed(2)}</div>
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
                    <th>Tags</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="footer">
            <p>ExpenseIQ — Smart Financial Tracking</p>
        </div>
    </body>
    </html>`;
}

export default function Dashboard() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { isDark } = useTheme();
    const [pdfLoading, setPdfLoading] = useState(false);

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
        isLoading,
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
            const res = await transactionsAPI.getAll({ limit: "9999", page: "1" });
            const allTransactions = res.data.transactions;
            if (allTransactions.length === 0) {
                Alert.alert("No Data", "No transactions to export.");
                return;
            }
            const html = generatePdfHtml(allTransactions, summary!);
            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "ExpenseIQ Transactions Report",
                    UTI: "com.adobe.pdf",
                });
            } else {
                Alert.alert("Success", `PDF saved to: ${uri}`);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to generate PDF. Please try again.");
            console.error("PDF generation error:", error);
        } finally {
            setPdfLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
                <ActivityIndicator size="large" color={isDark ? "#818cf8" : "#4f46e5"} />
                <Text className="text-muted-fg dark:text-muted-fg-dark mt-4">Loading your finances...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background dark:bg-background-dark"
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={isDark ? "#818cf8" : "#6366f1"} />
            }
        >
            {/* Header Section */}
            <View className="bg-indigo-600 pt-16 pb-8 px-6 rounded-b-[40px] shadow-2xl shadow-indigo-500/30 mb-6">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-indigo-100 text-sm font-semibold uppercase tracking-wider">Total Balance</Text>
                        <Text className="text-white text-5xl font-black mt-1">₹{summary?.balance.toFixed(2) || "0.00"}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Sign Out", style: "destructive", onPress: () => signOut() },
                            ]);
                        }}
                        className="bg-white/20 p-3 rounded-full backdrop-blur-md items-center justify-center"
                        accessibilityLabel="Sign Out"
                    >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <Path d="M16 17l5-5-5-5" />
                            <Path d="M21 12H9" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Overlay (Income/Expense) */}
                <View className="flex-row space-x-4">
                    <View className="flex-1 bg-white/10 p-4 rounded-3xl flex-row items-center border border-white/5 backdrop-blur-lg">
                        <View className="w-10 h-10 rounded-full bg-emerald-400/20 items-center justify-center mr-3">
                            <Text className="text-emerald-300 text-sm">▼</Text>
                        </View>
                        <View>
                            <Text className="text-indigo-100 text-xs font-semibold">Income</Text>
                            <Text className="text-white text-xl font-bold">₹{summary?.totalIncome.toFixed(0)}</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-white/10 p-4 rounded-3xl flex-row items-center border border-white/5 backdrop-blur-lg">
                        <View className="w-10 h-10 rounded-full bg-red-400/20 items-center justify-center mr-3">
                            <Text className="text-red-300 text-sm">▲</Text>
                        </View>
                        <View>
                            <Text className="text-indigo-100 text-xs font-semibold">Expense</Text>
                            <Text className="text-white text-xl font-bold">₹{summary?.totalExpense.toFixed(0)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Main Content */}
            <View className="px-5">

                {/* PDF Download Button */}
                <TouchableOpacity
                    onPress={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="bg-white dark:bg-surface-dark shadow-sm border border-border dark:border-border-dark rounded-2xl py-4 flex-row items-center justify-center mb-6"
                    activeOpacity={0.7}
                >
                    {pdfLoading ? (
                        <ActivityIndicator size="small" color={isDark ? "#818cf8" : "#6366f1"} />
                    ) : (
                        <>
                            <Text className="text-xl mr-2">📄</Text>
                            <Text className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                                Download Report
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Financial Trend Chart */}
                <View className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-border-dark mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold">Analysis</Text>
                        {/* Simple Time Range */}
                        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            {(["1W", "1M", "1Y"] as const).map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-md ${range === r ? "bg-white dark:bg-slate-600 shadow-sm" : ""}`}
                                >
                                    <Text className={`text-xs font-bold ${range === r ? "text-primary dark:text-primary-dark" : "text-slate-400"}`}>
                                        {r}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="items-center overflow-hidden">
                        {summary?.chartData && summary.chartData.length > 0 ? (
                            <LineChart
                                datasets={[
                                    { data: incomeData, color: "#10b981" },
                                    { data: expenseData, color: "#ef4444" },
                                ]}
                                labels={chartDates}
                                width={Dimensions.get("window").width - 80}
                                height={200}
                                isDark={isDark}
                            />
                        ) : (
                            <View className="h-40 items-center justify-center w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <Text className="text-slate-400 text-sm">No data available</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Tag Breakdown */}
                {summary?.tagBreakdown && summary.tagBreakdown.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold mb-4 ml-1">Spending</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                            {summary.tagBreakdown.map((tag) => (
                                <View key={tag.id} className="bg-white dark:bg-surface-dark mr-3 p-4 rounded-2xl border border-border dark:border-border-dark shadow-sm min-w-[140px]">
                                    <View className="flex-row items-center mb-3">
                                        <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase" numberOfLines={1}>{tag.name}</Text>
                                    </View>
                                    <Text className="text-slate-800 dark:text-white text-xl font-bold">₹{tag.totalSpent.toFixed(0)}</Text>
                                    <Text className="text-slate-400 text-xs mt-1">{tag.count} txns</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Transactions */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold ml-1">Recent Activity</Text>
                        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                            <Text className="text-primary dark:text-primary-dark text-sm font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                        summary.recentTransactions.map((transaction) => (
                            <TransactionItem key={transaction.id} item={transaction} />
                        ))
                    ) : (
                        <View className="bg-white dark:bg-surface-dark border border-border border-dashed dark:border-border-dark rounded-2xl p-8 items-center justify-center">
                            <Text className="text-4xl mb-3 opacity-50">📝</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center">
                                No transactions yet.{"\n"}Start tracking your expenses!
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
