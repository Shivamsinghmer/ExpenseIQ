import React, { createContext, useContext, useState, useEffect } from "react";
import { usersAPI } from "../services/api";
import { useUser } from "@clerk/clerk-expo";

export interface Currency {
    code: string;
    symbol: string;
    flag: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
    { code: "INR", symbol: "₹", flag: "🇮🇳" },
    { code: "USD", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", symbol: "£", flag: "🇬🇧" },
    { code: "JPY", symbol: "¥", flag: "🇯🇵" },
    { code: "AED", symbol: "د.إ", flag: "🇦🇪" },
];

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => Promise<void>;
    formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [currentCurrency, setCurrentCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);

    useEffect(() => {
        const metadata = (user?.unsafeMetadata || user?.publicMetadata) as any;
        if (metadata?.currencyCode) {
            const found = SUPPORTED_CURRENCIES.find(c => c.code === metadata.currencyCode);
            if (found) setCurrentCurrency(found);
        }
    }, [user]);

    const setCurrency = async (currency: Currency) => {
        try {
            setCurrentCurrency(currency);
            await usersAPI.updateCurrency(currency.code, currency.symbol);
            // Update Clerk metadata to keep it in sync on the client
            await user?.update({
                unsafeMetadata: {
                    ...(user.unsafeMetadata || {}),
                    currencyCode: currency.code,
                    currencySymbol: currency.symbol
                }
            });
        } catch (error) {
            console.error("Failed to update currency:", error);
        }
    };

    const formatAmount = (amount: number) => {
        return `${currentCurrency.symbol}${amount.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency: currentCurrency, setCurrency, formatAmount }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
