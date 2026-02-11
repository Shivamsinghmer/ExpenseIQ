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
            // Layout
            background: "#f8fafc", // Slate 50
            "background-dark": "#0f172a", // Slate 900

            surface: "#ffffff",
            "surface-dark": "#1e293b", // Slate 800

            // Brand
            primary: "#6366f1", // Indigo 500
            "primary-dark": "#818cf8", // Indigo 400

            secondary: "#10b981", // Emerald 500
            "secondary-dark": "#34d399", // Emerald 400

            accent: "#f59e0b", // Amber 500
            "accent-dark": "#fbbf24", // Amber 400

            destructive: "#ef4444", // Red 500
            "destructive-dark": "#f87171", // Red 400

            // UI Elements
            border: "#e2e8f0", // Slate 200
            "border-dark": "#334155", // Slate 700

            muted: "#f1f5f9", // Slate 100
            "muted-dark": "#334155", // Slate 700

            "muted-fg": "#64748b", // Slate 500
            "muted-fg-dark": "#94a3b8", // Slate 400

            input: "#cbd5e1", // Slate 300
            "input-dark": "#475569", // Slate 600
            fontFamily: {
                sans: ["DM Sans", "System"],
                mono: ["Space Mono", "monospace"],
            },
        },
    },
    plugins: [],
};
