import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CommentsSection from '../../components/CommentsSection';
export default function SuggestionsTab() {
    const [showForm, setShowForm] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: '',
    });
    const { data, isLoading } = useQuery('suggestions', async () => {
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
    const voteMutation = useMutation(async ({ id, voteType }) => {
        const res = await api.post(`/suggestions/${id}/vote`, { voteType });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        },
    });
    const updateStatusMutation = useMutation(async ({ id, status, priority, adminNotes }) => {
        const res = await api.put(`/suggestions/${id}`, { status, priority, adminNotes });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        },
    });
    const allSuggestions = data?.suggestions || [];
    // Extract unique statuses and categories
    const { statuses, categories } = useMemo(() => {
        const statusSet = new Set();
        const categorySet = new Set();
        allSuggestions.forEach((s) => {
            if (s.status)
                statusSet.add(s.status);
            if (s.category)
                categorySet.add(s.category);
        });
        return {
            statuses: Array.from(statusSet),
            categories: Array.from(categorySet),
        };
    }, [allSuggestions]);
    // Filter suggestions based on selected filters
    const filteredSuggestions = useMemo(() => {
        return allSuggestions.filter((s) => {
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
            return matchesStatus && matchesCategory;
        });
    }, [allSuggestions, statusFilter, categoryFilter]);
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };
    const handleVote = (suggestionId, voteType) => {
        voteMutation.mutate({ id: suggestionId, voteType });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-900/30 text-green-300';
            case 'rejected':
                return 'bg-red-900/30 text-red-300';
            case 'under_review':
                return 'bg-yellow-900/30 text-yellow-300';
            case 'implemented':
                return 'bg-blue-900/30 text-blue-300';
            default:
                return 'bg-gray-700 text-gray-300';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Employee Suggestions" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Share your ideas and suggestions for improvement" })] }), _jsx("button", { onClick: () => setShowForm(!showForm), className: "bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors", children: showForm ? 'Cancel' : '+ Submit Suggestion' })] }), allSuggestions.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Status:" }), _jsxs("button", { onClick: () => setStatusFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${statusFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allSuggestions.length, ")"] }), statuses.map((status) => {
                                const count = allSuggestions.filter((s) => s.status === status).length;
                                return (_jsxs("button", { onClick: () => setStatusFilter(status), className: `px-3 py-1 rounded-full text-sm transition-colors capitalize ${statusFilter === status
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [status.replace('_', ' '), " (", count, ")"] }, status));
                            })] }), categories.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Category:" }), _jsxs("button", { onClick: () => setCategoryFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allSuggestions.length, ")"] }), categories.slice(0, 8).map((cat) => {
                                const count = allSuggestions.filter((s) => s.category === cat).length;
                                return (_jsxs("button", { onClick: () => setCategoryFilter(cat), className: `px-3 py-1 rounded-full text-sm transition-colors capitalize ${categoryFilter === cat
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [cat, " (", count, ")"] }, cat));
                            }), categories.length > 8 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["+", categories.length - 8, " more"] }))] })), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: filteredSuggestions.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allSuggestions.length }), " suggestions"] })] })), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Submit New Suggestion" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description *" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), required: true, rows: 5, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Category" }), _jsx("option", { value: "improvement", children: "Process Improvement" }), _jsx("option", { value: "process", children: "Process Change" }), _jsx("option", { value: "system", children: "System Enhancement" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Priority" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createMutation.isLoading, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading ? 'Submitting...' : 'Submit Suggestion' })] })] })] })), _jsx("div", { className: "bg-gray-800 rounded-lg shadow p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "submitted", children: "Submitted" }), _jsx("option", { value: "under_review", children: "Under Review" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "rejected", children: "Rejected" }), _jsx("option", { value: "implemented", children: "Implemented" })] }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "improvement", children: "Process Improvement" }), _jsx("option", { value: "process", children: "Process Change" }), _jsx("option", { value: "system", children: "System Enhancement" }), _jsx("option", { value: "other", children: "Other" })] })] }) }), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading suggestions..." })) : allSuggestions.length === 0 ? (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No suggestions found." }) })) : (_jsx("div", { className: "space-y-4", children: filteredSuggestions.map((suggestion) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: suggestion.title }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded ${getStatusColor(suggestion.status)}`, children: suggestion.status.replace('_', ' ').toUpperCase() }), suggestion.category && (_jsx("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: suggestion.category }))] }), _jsx("p", { className: "text-gray-300 mb-3", children: suggestion.description }), _jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-400", children: [_jsxs("span", { children: ["By: ", suggestion.user.firstName, " ", suggestion.user.lastName] }), _jsx("span", { children: new Date(suggestion.createdAt).toLocaleDateString() }), _jsxs("span", { children: [suggestion.commentCount || 0, " comments"] })] })] }) }), _jsxs("div", { className: "flex items-center space-x-4 mb-4", children: [_jsxs("button", { onClick: () => handleVote(suggestion.id, 'upvote'), className: `flex items-center space-x-1 px-3 py-1 rounded transition-colors ${suggestion.userVote === 'upvote'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 15l7-7 7 7" }) }), _jsx("span", { children: suggestion.upvotes || 0 })] }), _jsxs("button", { onClick: () => handleVote(suggestion.id, 'downvote'), className: `flex items-center space-x-1 px-3 py-1 rounded transition-colors ${suggestion.userVote === 'downvote'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }), _jsx("span", { children: suggestion.downvotes || 0 })] }), _jsx("button", { onClick: () => setSelectedSuggestion(selectedSuggestion === suggestion.id ? null : suggestion.id), className: "px-3 py-1 text-gray-400 hover:text-white text-sm", children: selectedSuggestion === suggestion.id ? 'Hide Comments' : 'Comments' })] }), isAdmin && (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-700", children: [_jsx("h4", { className: "text-sm font-medium text-white mb-2", children: "Admin Actions" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("select", { value: suggestion.status, onChange: (e) => updateStatusMutation.mutate({
                                                id: suggestion.id,
                                                status: e.target.value,
                                            }), className: "px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm", children: [_jsx("option", { value: "submitted", children: "Submitted" }), _jsx("option", { value: "under_review", children: "Under Review" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "rejected", children: "Rejected" }), _jsx("option", { value: "implemented", children: "Implemented" })] }), _jsx("input", { type: "text", placeholder: "Admin notes...", onBlur: (e) => {
                                                if (e.target.value) {
                                                    updateStatusMutation.mutate({
                                                        id: suggestion.id,
                                                        adminNotes: e.target.value,
                                                    });
                                                }
                                            }, className: "flex-1 px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm" })] }), suggestion.adminNotes && (_jsxs("p", { className: "text-sm text-gray-400 mt-2", children: [_jsx("strong", { children: "Admin Notes:" }), " ", suggestion.adminNotes] }))] })), selectedSuggestion === suggestion.id && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-700", children: _jsx(CommentsSection, { resourceType: "suggestion", resourceId: suggestion.id }) }))] }, suggestion.id))) }))] }));
}
