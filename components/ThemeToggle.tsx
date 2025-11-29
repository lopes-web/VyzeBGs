import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
        </button>
    );
};

export default ThemeToggle;
