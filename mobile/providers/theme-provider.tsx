import React, { createContext, useContext } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

type ThemeContextType = {
    colorScheme: "light" | "dark";
    toggleTheme: () => void;
    isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
    colorScheme: "dark",
    toggleTheme: () => { },
    isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useNativeWindColorScheme();

    React.useEffect(() => {
        setColorScheme("light");
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                colorScheme: "light",
                toggleTheme: () => { },
                isDark: false,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
