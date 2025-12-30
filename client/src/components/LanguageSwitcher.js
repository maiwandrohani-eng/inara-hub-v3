import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getLanguage, setLanguage } from '../i18n';
export default function LanguageSwitcher() {
    const [currentLang, setCurrentLang] = useState(getLanguage());
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        setCurrentLang(getLanguage());
    }, []);
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    ];
    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
        setCurrentLang(langCode);
        setIsOpen(false);
        // Set RTL/LTR direction immediately (this always works)
        document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = langCode;
        // Update cookies for persistence (needed for page refresh)
        if (langCode === 'en') {
            // Clear translate cookie for English
            document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        else {
            // Set translate cookie for Arabic
            document.cookie = `googtrans=/en/ar; path=/; max-age=31536000`;
        }
        // Try to trigger Google Translate WITHOUT any page reload
        const triggerGoogleTranslate = () => {
            // Method 1: Try to find the select element (preferred - no reload)
            const selectElement = document.querySelector('.goog-te-combo');
            if (selectElement) {
                const targetLang = langCode === 'ar' ? 'ar' : 'en';
                selectElement.value = targetLang;
                // Trigger change event multiple ways to ensure it works
                const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                selectElement.dispatchEvent(changeEvent);
                // Also trigger input event
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                selectElement.dispatchEvent(inputEvent);
                // Force update
                if (selectElement.onchange) {
                    selectElement.onchange(changeEvent);
                }
                console.log('Google Translate triggered via select element - no reload');
                return true;
            }
            // Method 2: Try to access the iframe directly (if select element not visible)
            try {
                const iframe = document.querySelector('iframe[src*="translate.googleapis.com"]');
                if (iframe && iframe.contentWindow) {
                    // Try to access the select element inside the iframe
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const iframeSelect = iframeDoc?.querySelector('.goog-te-combo');
                    if (iframeSelect) {
                        iframeSelect.value = langCode === 'ar' ? 'ar' : 'en';
                        const event = new Event('change', { bubbles: true });
                        iframeSelect.dispatchEvent(event);
                        console.log('Google Translate triggered via iframe select element');
                        return true;
                    }
                }
            }
            catch (e) {
                // Cross-origin restrictions might prevent iframe access
                console.log('Cannot access iframe (cross-origin restriction)');
            }
            return false;
        };
        // Try immediately
        if (!triggerGoogleTranslate()) {
            // Wait for Google Translate select element to appear (no reload fallback)
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max - give it time
            const checkInterval = setInterval(() => {
                attempts++;
                const success = triggerGoogleTranslate();
                if (success || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (!success) {
                        console.log('Google Translate select element not available after waiting. Direction changed to ' + langCode + '. Translation will work on next page load.');
                    }
                }
            }, 100);
        }
    };
    const currentLangData = languages.find((l) => l.code === currentLang) || languages[0];
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), onBlur: () => setTimeout(() => setIsOpen(false), 200), className: "p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center space-x-1", title: "Change language", children: [_jsx("span", { className: "text-base", children: currentLangData.flag }), _jsx("span", { className: "text-sm font-medium", children: currentLangData.code.toUpperCase() })] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsOpen(false), "aria-hidden": "true" }), _jsx("div", { className: "absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]", children: languages.map((lang) => (_jsxs("button", { onClick: () => handleLanguageChange(lang.code), className: `w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center ${currentLang === lang.code
                                ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300'
                                : 'text-gray-800 dark:text-gray-200'}`, children: [_jsx("span", { className: "mr-2 text-base", children: lang.flag }), _jsx("span", { children: lang.name })] }, lang.code))) })] }))] }));
}
