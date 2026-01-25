import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f1419',
                card: '#1a1f2e',
                border: '#2d3748',
                primary: '#10b981',
                'text-primary': '#ffffff',
                'text-secondary': '#9ca3af',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            borderRadius: {
                lg: '0.5rem',
                xl: '1rem',
                '2xl': '1.5rem',
            },
            spacing: {
                '18': '4.5rem',
                '112': '28rem',
                '128': '32rem',
            },
        },
    },
    plugins: [],
};
export default config;
