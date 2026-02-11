/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Layout
                background: "#f7f9f3",
                "background-dark": "#000000",

                surface: "#ffffff",
                "surface-dark": "#1a212b",

                // Brand
                primary: "#4f46e5",
                "primary-dark": "#818cf8",

                secondary: "#14b8a6",
                "secondary-dark": "#2dd4bf",

                accent: "#f59e0b",
                "accent-dark": "#fcd34d",

                destructive: "#ef4444",
                "destructive-dark": "#f87171",

                // UI Elements
                border: "#000000",
                "border-dark": "#545454",

                muted: "#f0f0f0",
                "muted-dark": "#333333",

                "muted-fg": "#333333",
                "muted-fg-dark": "#cccccc",

                input: "#737373",
                "input-dark": "#ffffff",
            },
            fontFamily: {
                sans: ["DM Sans", "System"],
                mono: ["Space Mono", "monospace"],
            },
        },
    },
    plugins: [],
};
