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
import { PieChart } from "../../components/PieChart";
import { LineChart } from "../../components/LineChart";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useTheme } from "../providers/theme-provider";
import { transactionsAPI, type SummaryResponse, type Transaction } from "../../services/api";

function StatCard({
    title,
    amount,
    color,
    icon,
}: {
    title: string;
    amount: number;
    color: string;
    icon: string;
}) {
    const colorMap: Record<string, { bg: string; text: string }> = {
        green: { bg: "bg-success-500/10", text: "text-success-400" },
        red: { bg: "bg-danger-500/10", text: "text-danger-400" },
        blue: { bg: "bg-accent/10 dark:bg-accent-dark/10", text: "text-accent dark:text-accent-dark" },
    };
    const { bg, text } = colorMap[color] || colorMap.blue;

    return (
        <View className={`flex-1 ${bg} border border-border dark:border-border-dark rounded-xl p-4 mx-1`}>
            <Text className="text-xl mb-1">{icon}</Text>
            <Text className="text-muted-fg dark:text-muted-fg-dark text-xs font-medium mt-1">{title}</Text>
            <Text className={`${text} text-lg font-bold mt-1`}>
                ₹{amount.toFixed(2)}
            </Text>
        </View>
    );
}

function TransactionItem({ item }: { item: Transaction }) {
    const isIncome = item.type === "INCOME";
    return (
        <View className="bg-surface dark:bg-surface-dark rounded-xl p-4 mb-3 flex-row items-center border border-border dark:border-border-dark">
            <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isIncome ? "bg-success-500/20" : "bg-danger-500/20"}`}
            >
                <Text className="text-lg">{isIncome ? "📈" : "📉"}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-black dark:text-white font-semibold text-sm">{item.title}</Text>
                <Text className="text-muted-fg dark:text-muted-fg-dark text-xs mt-0.5">
                    {new Date(item.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                    })}
                    {item.tags.length > 0 && ` · ${item.tags.map((t) => t.name).join(", ")}`}
                </Text>
            </View>
            <Text className={`font-bold text-sm ${isIncome ? "text-success-400" : "text-danger-400"}`}>
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
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={isDark ? "#818cf8" : "#4f46e5"} />
            }
        >
            {/* Header */}
            <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
                <View>
                    <Text className="text-muted-fg dark:text-muted-fg-dark text-sm">Welcome back,</Text>
                    <Text className="text-black dark:text-white text-xl font-bold">
                        {user?.firstName || "User"} 👋
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => signOut()}
                        className="bg-muted dark:bg-muted-dark border border-border dark:border-border-dark rounded-xl px-4 py-2"
                    >
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-xs font-medium">Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View className="flex-row px-4 mt-4">
                <StatCard title="Income" amount={summary?.totalIncome || 0} color="green" icon="💰" />
                <StatCard title="Expenses" amount={summary?.totalExpense || 0} color="red" icon="💸" />
                <StatCard title="Balance" amount={summary?.balance || 0} color="blue" icon="🏦" />
            </View>

            {/* Download PDF */}
            <View className="px-5 mt-5">
                <TouchableOpacity
                    onPress={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="bg-muted dark:bg-muted-dark border-2 border-border dark:border-border-dark rounded-xl py-3.5 flex-row items-center justify-center"
                    activeOpacity={0.7}
                >
                    {pdfLoading ? (
                        <ActivityIndicator size="small" color={isDark ? "#818cf8" : "#4f46e5"} />
                    ) : (
                        <>
                            <Text className="text-base mr-2">📄</Text>
                            <Text className="text-black dark:text-white font-semibold text-sm">
                                Download All Transactions (PDF)
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Income vs Expenses Graph */}
            <View className="px-5 mt-6">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-black dark:text-white text-base font-bold">Financial Trend</Text>
                    {/* Time Range Selector */}
                    <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                        {(["1W", "1M", "3M", "1Y", "All"] as const).map((r) => (
                            <TouchableOpacity
                                key={r}
                                onPress={() => setRange(r)}
                                className={`px-2 py-1 rounded-md ${range === r ? "bg-white dark:bg-neutral-600 shadow-sm" : ""}`}
                            >
                                <Text className={`text-[10px] font-semibold ${range === r ? "text-black dark:text-white" : "text-neutral-500"}`}>
                                    {r}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View className="items-center bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl py-4 overflow-hidden">
                    {summary?.chartData && summary.chartData.length > 0 ? (
                        <LineChart
                            datasets={[
                                { data: incomeData, color: "#22c55e" },
                                { data: expenseData, color: "#ef4444" },
                            ]}
                            labels={chartDates}
                            width={Dimensions.get("window").width - 40}
                            height={220}
                            isDark={isDark}
                        />
                    ) : (
                        <View className="h-40 items-center justify-center">
                            <Text className="text-neutral-400 text-xs">No chart data for this period</Text>
                        </View>
                    )}
                </View>
                <View className="flex-row justify-center mt-2 space-x-4">
                    <View className="flex-row items-center mr-4">
                        <View className="w-2 h-2 rounded-full bg-success-500 mr-1" />
                        <Text className="text-xs text-neutral-500">Income</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-danger-500 mr-1" />
                        <Text className="text-xs text-neutral-500">Expenses</Text>
                    </View>
                </View>
            </View>

            {/* Tag Breakdown */}
            {summary?.tagBreakdown && summary.tagBreakdown.length > 0 && (
                <View className="px-5 mt-6">
                    <Text className="text-black dark:text-white text-base font-bold mb-3">Spending Breakdown</Text>
                    <View className="items-center mb-6 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl py-4">
                        <PieChart
                            data={summary.tagBreakdown.map((tag) => ({
                                name: tag.name,
                                value: tag.totalSpent,
                                color: tag.color,
                            }))}
                            radius={90}
                            containerWidth={Dimensions.get("window").width - 40}
                            isDark={isDark}
                        />
                    </View>
                    <Text className="text-black dark:text-white text-base font-bold mb-3">Spending by Tag Details</Text>
                    <View className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-4">
                        {summary.tagBreakdown.map((tag) => (
                            <View key={tag.id} className="flex-row items-center mb-3 last:mb-0">
                                <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: tag.color }} />
                                <Text className="text-black dark:text-white flex-1 text-sm">{tag.name}</Text>
                                <Text className="text-muted-fg dark:text-muted-fg-dark text-sm font-medium">₹{tag.totalSpent.toFixed(2)}</Text>
                                <Text className="text-muted-fg dark:text-muted-fg-dark text-xs ml-2">({tag.count})</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Recent Transactions */}
            <View className="px-5 mt-6">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-black dark:text-white text-base font-bold">Recent Transactions</Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                        <Text className="text-primary dark:text-primary-dark text-xs font-semibold">View All</Text>
                    </TouchableOpacity>
                </View>
                {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                    summary.recentTransactions.map((transaction) => (
                        <TransactionItem key={transaction.id} item={transaction} />
                    ))
                ) : (
                    <View className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-8 items-center">
                        <Text className="text-3xl mb-2">📝</Text>
                        <Text className="text-muted-fg dark:text-muted-fg-dark text-sm text-center">
                            No transactions yet.{"\n"}Tap "Add" to get started!
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
