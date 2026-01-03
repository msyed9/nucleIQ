/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable dark mode via class strategy
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#2196f3',
                    600: '#1e88e5',
                    700: '#1976d2',
                    800: '#1565c0',
                    900: '#0d47a1',
                },
                secondary: {
                    50: '#f1f8e9',
                    100: '#dcedc8',
                    200: '#c5e1a5',
                    300: '#aed581',
                    400: '#9ccc65',
                    500: '#8bc34a',
                    600: '#7cb342',
                    700: '#689f38',
                    800: '#558b2f',
                    900: '#33691e',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
