import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
export default function SuggestionBox() {
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: '',
    });
    // Fetch recent suggestions
    const { data } = useQuery('suggestions', async () => {
        const res = await api.get('/suggestions');
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/suggestions', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
            setShowForm(false);
            setFormData({ title: '', description: '', category: '', priority: '' });
            alert('Suggestion submitted successfully!');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };
    const recentSuggestions = (data?.suggestions || []).slice(0, 3);
    return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "\uD83D\uDCA1 Share Your Ideas" }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Help improve INARA by sharing your suggestions" })] }), _jsx(Link, { to: "/suggestions", className: "text-sm text-primary-400 hover:text-primary-300 underline", children: "View All \u2192" })] }), !showForm ? (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsx("button", { onClick: () => setShowForm(true), className: "w-full bg-primary-500 text-white px-4 py-4 rounded-lg hover:bg-primary-600 transition-colors font-medium text-center", children: "+ Submit a Suggestion" }) }), recentSuggestions.length > 0 && (_jsxs("div", { className: "lg:col-span-2 space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-300 mb-3", children: "Recent Suggestions" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: recentSuggestions.map((suggestion) => (_jsxs("div", { className: "bg-gray-700/50 rounded-lg p-3 border border-gray-600", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h4", { className: "text-sm font-medium text-white line-clamp-1 flex-1", children: suggestion.title }), _jsx("span", { className: `ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${suggestion.status === 'approved'
                                                        ? 'bg-green-900/30 text-green-300'
                                                        : suggestion.status === 'under_review'
                                                            ? 'bg-yellow-900/30 text-yellow-300'
                                                            : suggestion.status === 'rejected'
                                                                ? 'bg-red-900/30 text-red-300'
                                                                : 'bg-gray-700 text-gray-300'}`, children: suggestion.status || 'submitted' })] }), _jsx("p", { className: "text-xs text-gray-400 line-clamp-2 mb-2", children: suggestion.description }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-500", children: [_jsxs("span", { children: ["\uD83D\uDC4D ", suggestion.upvotes || 0] }), _jsxs("span", { children: ["\uD83D\uDC4E ", suggestion.downvotes || 0] })] })] }, suggestion.id))) })] }))] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, placeholder: "Brief title for your suggestion", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Category" }), _jsx("option", { value: "improvement", children: "Process Improvement" }), _jsx("option", { value: "process", children: "Process Change" }), _jsx("option", { value: "system", children: "System Enhancement" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Priority" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description *" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), required: true, rows: 3, placeholder: "Describe your suggestion in detail...", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-200 text-sm", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createMutation.isLoading, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm", children: createMutation.isLoading ? 'Submitting...' : 'Submit' })] })] }))] }));
}
