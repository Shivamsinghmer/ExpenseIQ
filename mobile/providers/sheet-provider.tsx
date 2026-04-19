import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import BottomSheet from "@gorhom/bottom-sheet";

interface InitialData {
    image?: string;
    title?: string;
    amount?: string;
}

interface SheetContextType {
    isOpen: boolean;
    initialData: InitialData | null;
    openSheet: (data?: InitialData) => void;
    closeSheet: () => void;
    sheetRef: React.RefObject<BottomSheet | null>;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export function SheetProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialData, setInitialData] = useState<InitialData | null>(null);
    const sheetRef = useRef<BottomSheet>(null);

    const openSheet = useCallback((data?: InitialData) => {
        setInitialData(data || null);
        setIsOpen(true);
        sheetRef.current?.snapToIndex(0);
    }, []);

    const closeSheet = useCallback(() => {
        setIsOpen(false);
        setInitialData(null);
        sheetRef.current?.close();
    }, []);

    return (
        <SheetContext.Provider
            value={{
                isOpen,
                initialData,
                openSheet,
                closeSheet,
                sheetRef,
            }}
        >
            {children}
        </SheetContext.Provider>
    );
}

export function useSheet() {
    const context = useContext(SheetContext);
    if (context === undefined) {
        throw new Error("useSheet must be used within a SheetProvider");
    }
    return context;
}
