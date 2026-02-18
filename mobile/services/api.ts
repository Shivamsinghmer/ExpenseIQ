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
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized - token may be expired");
        }
        return Promise.reject(error);
    }
);

// ====== TRANSACTION API ======

export interface Tag {
    id: string;
    name: string;
    color: string;
    userId: string;
    _count?: { transactions: number };
}

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    notes?: string;
    date: string;
    userId: string;
    tags: Tag[];
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
    tagBreakdown: {
        id: string;
        name: string;
        color: string;
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
    date: string;
    tagIds?: string[];
}

// Transactions
export const transactionsAPI = {
    getAll: (params?: Record<string, string>) =>
        api.get<TransactionListResponse>("/transactions", { params }),
    getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
    create: (data: CreateTransactionData) =>
        api.post<Transaction>("/transactions", data),
    update: (id: string, data: Partial<CreateTransactionData>) =>
        api.put<Transaction>(`/transactions/${id}`, data),
    delete: (id: string) => api.delete(`/transactions/${id}`),
    getSummary: (params?: Record<string, string>) =>
        api.get<SummaryResponse>("/transactions/summary", { params }),
};

// Tags
export interface CreateTagData {
    name: string;
    color: string;
}

export const tagsAPI = {
    getAll: () => api.get<Tag[]>("/tags"),
    getById: (id: string) => api.get<Tag>(`/tags/${id}`),
    create: (data: CreateTagData) => api.post<Tag>("/tags", data),
    update: (id: string, data: Partial<CreateTagData>) =>
        api.put<Tag>(`/tags/${id}`, data),
    delete: (id: string) => api.delete(`/tags/${id}`),
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

export default api;
