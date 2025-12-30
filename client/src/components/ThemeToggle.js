import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
export default function ThemeToggle() {
    const queryClient = useQueryClient();
    // Initialize theme from localStorage or default to dark
    const getInitialTheme = () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        }
        return 'dark';
    };
    const [theme, setTheme] = useState(() => {
        // Initialize from localStorage immediately
        const initial = getInitialTheme();
        if (typeof window !== 'undefined') {
            // Apply theme immediately on component mount
            if (initial === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            }
            else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
            }
        }
        return initial;
    });
    // Update mutation - fire and forget, don't wait for response
    const updateMutation = useMutation(async (newTheme) => {
        try {
            await api.put('/preferences', { theme: newTheme });
        }
        catch (error) {
            // Silently fail - local storage is the source of truth
            console.warn('Failed to update theme preference on server:', error);
        }
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
        },
    });
    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        // Update state immediately
        setTheme(newTheme);
        // Apply to DOM immediately
        if (typeof window !== 'undefined') {
            const html = document.documentElement;
            // Remove both classes first, then add the new one
            html.classList.remove('dark', 'light');
            html.classList.add(newTheme);
            // Update localStorage
            localStorage.setItem('theme', newTheme);
            // Force a reflow to ensure styles apply immediately
            void html.offsetHeight;
        }
        // Update server in background (don't wait)
        updateMutation.mutate(newTheme);
    }, [theme, updateMutation]);
    return (_jsx("button", { onClick: toggleTheme, className: "p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors", "aria-label": "Toggle theme", children: theme === 'dark' ? (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" }) })) : (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" }) })) }));
}
