import axios from "axios";
import { API_BASE_URL } from "../lib/config";

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Token will be set by the auth provider
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

// Request interceptor to attach auth token
api.interceptors.request.use(
    (config) => {
        const fullUrl = `${config.baseURL}${config.url}`;
        console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        } else {
            console.warn(`[API Request] No auth token available for ${fullUrl}`);
        }
        return config;
    },
    (error) => {
        console.error("[API Request] Setup Error:", error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        
        if (status === 401) {
            console.warn(`[API Warning] Unauthorized access for ${url} (Token syncing)`);
            return Promise.reject(error);
        }
        
        console.error(`[API Error] ${status || "Network Error"} ${url}`);
        return Promise.reject(error);
    }
);

// ====== TRANSACTION API ======


export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    notes?: string;
    category?: string;
    date: string;
    userId: string;
    createdAt: string;
}

export interface TransactionListResponse {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SummaryResponse {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
    recentTransactions: Transaction[];
    categoryBreakdown: {
        name: string;
        totalSpent: number;
        count: number;
    }[];
    chartData?: {
        date: string;
        income: number;
        expense: number;
    }[];
}

export interface CreateTransactionData {
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    notes?: string;
    category?: string;
    date: string;
}

export interface Milestone {
    id: number;
    days: number;
    label: string;
    emoji: string;
    color: string;
}

export interface CreateTransactionResponse extends Transaction {
    newMilestone?: Milestone | null;
}

// Transactions
export const transactionsAPI = {
    getAll: (params?: Record<string, string>) =>
        api.get<TransactionListResponse>("/transactions", { params }),
    getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
    create: (data: CreateTransactionData) =>
        api.post<CreateTransactionResponse>("/transactions", data),
    update: (id: string, data: Partial<CreateTransactionData>) =>
        api.put<Transaction>(`/transactions/${id}`, data),
    delete: (id: string) => api.delete(`/transactions/${id}`),
    getSummary: (params?: Record<string, string>) =>
        api.get<SummaryResponse>("/transactions/summary", { params }),
    bulkCreate: (data: any[]) =>
        api.post("/transactions/bulk", { transactions: data }),
};


// Payments
export const paymentsAPI = {
    createOrder: (amount: number) =>
        api.post<{ order_id: string; payment_session_id: string; environment: string }>("/payments/create-order", { amount }),
    checkStatus: () => api.get<{
        isPro: boolean;
        proExpiresAt?: string;
        trialStartDate?: string;
        trialEndDate?: string;
    }>("/payments/status"),
    verifyOrder: (orderId: string) => api.post("/payments/verify", { orderId }),
};

// AI
export interface AIResponse {
    question: string;
    answer: string;
    dataContext: {
        transactionCount: number;
        dateRange: { from: string; to: string };
    };
}

export const aiAPI = {
    ask: (question: string) =>
        api.post<AIResponse>("/ai/ask", { question }),
    getHistory: () => api.get<any[]>("/ai/history"),
    clearHistory: () => api.delete("/ai/history"),
};

// EMI Tracker
export interface EMI {
    id: string;
    title: string;
    monthlyAmount: number;
    totalMonths: number;
    paidMonths: number;
    startDate: string;
    isDone: boolean;
    createdAt: string;
}

export interface CreateEMIData {
    title: string;
    monthlyAmount: number;
    totalMonths: number;
    paidMonths?: number;
    startDate: string;
}

export const emisAPI = {
    getAll: () => api.get<EMI[]>("/emis"),
    create: (data: CreateEMIData) => api.post<EMI>("/emis", data),
    update: (id: string, data: Partial<CreateEMIData>) => api.put<EMI>(`/emis/${id}`, data),
    delete: (id: string) => api.delete(`/emis/${id}`),
};

// Budget Envelopes
export interface BudgetEnvelope {
    id: string;
    title: string;
    icon?: string;
    budget: number;
    spent: number;
    startDate: string;
    endDate: string;
    createdAt: string;
}

export interface CreateEnvelopeData {
    title: string;
    icon?: string;
    budget: number;
    spent?: number;
    startDate: string;
    endDate: string;
}

export const envelopesAPI = {
    getAll: () => api.get<BudgetEnvelope[]>("/envelopes"),
    create: (data: CreateEnvelopeData) => api.post<BudgetEnvelope>("/envelopes", data),
    update: (id: string, data: Partial<CreateEnvelopeData>) => api.put<BudgetEnvelope>(`/envelopes/${id}`, data),
    delete: (id: string) => api.delete(`/envelopes/${id}`),
};

// Streak & Gamification
export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    activeDaysThisMonth: number;
    activeDates: string[];
    daysInMonth: number;
    lastActiveDate: string | null;
    percentile: number;
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    avatarUrl: string | null;
    currentStreak?: number;
    longestStreak?: number;
}

export interface LeaderboardResponse {
    longest: LeaderboardEntry[];
}

export const streaksAPI = {
    getStats: () => api.get<StreakStats>("/streaks"),
    getLeaderboard: (timeframe: string = "all-time") => 
        api.get<LeaderboardResponse>("/streaks/leaderboard", { params: { timeframe } }),
};

// Budgets
export interface CategoryBudget {
    id: string;
    category: string;
    amount: number;
}

export const budgetsAPI = {
    getAll: () => api.get<CategoryBudget[]>("/budgets"),
    update: (data: { category: string; amount: number }[]) => api.put<CategoryBudget[]>("/budgets", { budgets: data }),
};

// User Settings
export const usersAPI = {
    updateCurrency: (currencyCode: string, currencySymbol: string) =>
        api.put("/users/currency", { currencyCode, currencySymbol }),
};

// SMS Parsing
export interface ParsedSMS {
    amount: number;
    title: string;
    type: "DEBIT" | "CREDIT";
    date?: string;
    currency?: string;
}

export const smsAPI = {
    parse: (text: string) => api.post<ParsedSMS>("/sms/parse", { text }),
};

// Receipt Scanning
export interface ScannedTransaction {
    amount: number;
    merchant: string;
    type: "EXPENSE" | "INCOME";
    date?: string;
    currency?: string;
    category?: string;
}

export interface ScannedReceiptResponse {
    documentType: "RECEIPT" | "STATEMENT";
    transactions: ScannedTransaction[];
}

export const scanAPI = {
    scanReceipt: (base64Image: string) => api.post<ScannedReceiptResponse>("/scan/receipt", { image: base64Image }),
};

export default api;
