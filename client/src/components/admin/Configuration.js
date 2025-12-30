import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import DropdownConfig from './DropdownConfig';
export default function Configuration() {
    const [activeTab, setActiveTab] = useState('system');
    const [config, setConfig] = useState({
        platformName: 'INARA Global Staff Platform',
        defaultCountry: '',
        defaultLanguage: 'en',
        sessionTimeout: 30,
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
        },
        emailNotifications: {
            trainingReminders: true,
            policyUpdates: true,
            systemAccess: true,
        },
    });
    const saveMutation = {
        isLoading: false,
        mutate: () => {
            // In a real app, this would save to a config table or file
            // For now, we'll just show a success message
            alert('Configuration saved successfully!');
        },
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "System Configuration" }), _jsx("div", { className: "border-b border-gray-700", children: _jsxs("nav", { className: "flex space-x-8", children: [_jsx("button", { onClick: () => setActiveTab('system'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'system'
                                ? 'border-primary-500 text-primary-500'
                                : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'}`, children: "System Settings" }), _jsx("button", { onClick: () => setActiveTab('dropdowns'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dropdowns'
                                ? 'border-primary-500 text-primary-500'
                                : 'border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-600'}`, children: "Dropdown Options" })] }) }), activeTab === 'dropdowns' ? (_jsx(DropdownConfig, {})) : (_jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Platform Name" }), _jsx("input", { type: "text", value: config.platformName, onChange: (e) => setConfig({ ...config, platformName: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Default Country" }), _jsx("input", { type: "text", value: config.defaultCountry, onChange: (e) => setConfig({ ...config, defaultCountry: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Default Language" }), _jsxs("select", { value: config.defaultLanguage, onChange: (e) => setConfig({ ...config, defaultLanguage: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "ar", children: "Arabic" }), _jsx("option", { value: "fr", children: "French" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Session Timeout (minutes)" }), _jsx("input", { type: "number", value: config.sessionTimeout, onChange: (e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Password Policy" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.passwordPolicy.requireUppercase, onChange: (e) => setConfig({
                                                        ...config,
                                                        passwordPolicy: { ...config.passwordPolicy, requireUppercase: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Require uppercase letters" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.passwordPolicy.requireLowercase, onChange: (e) => setConfig({
                                                        ...config,
                                                        passwordPolicy: { ...config.passwordPolicy, requireLowercase: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Require lowercase letters" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.passwordPolicy.requireNumbers, onChange: (e) => setConfig({
                                                        ...config,
                                                        passwordPolicy: { ...config.passwordPolicy, requireNumbers: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Require numbers" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.passwordPolicy.requireSpecialChars, onChange: (e) => setConfig({
                                                        ...config,
                                                        passwordPolicy: { ...config.passwordPolicy, requireSpecialChars: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Require special characters" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Email Notifications" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.emailNotifications.trainingReminders, onChange: (e) => setConfig({
                                                        ...config,
                                                        emailNotifications: { ...config.emailNotifications, trainingReminders: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Training reminders" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.emailNotifications.policyUpdates, onChange: (e) => setConfig({
                                                        ...config,
                                                        emailNotifications: { ...config.emailNotifications, policyUpdates: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Policy updates" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.emailNotifications.systemAccess, onChange: (e) => setConfig({
                                                        ...config,
                                                        emailNotifications: { ...config.emailNotifications, systemAccess: e.target.checked },
                                                    }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "System access notifications" })] })] })] }), _jsx("button", { type: "submit", disabled: saveMutation.isLoading, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: saveMutation.isLoading ? 'Saving...' : 'Save Configuration' })] }) }))] }));
}
