/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                app: {
                    dark: '#171717',
                    'dark-lighter': '#1F1F1F',
                },
                accent: {
                    DEFAULT: '#00C087',
                    light: '#00D99A',
                    dark: '#00A070',
                }
            }
        },
    },
    plugins: [],
}
