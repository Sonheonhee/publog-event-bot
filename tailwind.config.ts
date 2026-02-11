import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                navy: {
                    50: '#e6e8f0',
                    100: '#b3b9d6',
                    200: '#8089bc',
                    300: '#4d59a2',
                    400: '#26348e',
                    500: '#000f7a',
                    600: '#000d72',
                    700: '#000b67',
                    800: '#00095d',
                    900: '#00054a',
                },
                indigo: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
