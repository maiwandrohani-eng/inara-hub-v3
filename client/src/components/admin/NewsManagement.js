import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function NewsManagement() {
    const [showForm, setShowForm] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery('admin-news', async () => {
        const res = await api.get('/news');
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/news', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setShowForm(false);
            resetForm();
            alert('News published! All staff will be notified.');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/news/${id}`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setEditingNews(null);
            resetForm();
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/news/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        priority: 'normal',
        expiresAt: '',
        publishedAt: '',
        isActive: true,
    });
    const resetForm = () => {
        setFormData({
            title: '',
            summary: '',
            content: '',
            priority: 'normal',
            expiresAt: '',
            publishedAt: '',
            isActive: true,
        });
    };
    const handleEdit = (news) => {
        setEditingNews(news);
        setFormData({
            title: news.title,
            summary: news.summary || '',
            content: news.content,
            priority: news.priority,
            expiresAt: news.expiresAt ? new Date(news.expiresAt).toISOString().split('T')[0] : '',
            publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
            isActive: news.isActive,
        });
        setShowForm(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingNews) {
            updateMutation.mutate({ id: editingNews.id, data: formData });
        }
        else {
            createMutation.mutate(formData);
        }
    };
    const news = data?.news || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "News & Announcements Management" }), _jsx("button", { onClick: () => {
                            setShowForm(!showForm);
                            if (!showForm) {
                                setEditingNews(null);
                                resetForm();
                            }
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: showForm ? 'Cancel' : '+ Add News' })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingNews ? 'Edit News' : 'Create New News' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Summary" }), _jsx("input", { type: "text", value: formData.summary, onChange: (e) => setFormData({ ...formData, summary: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Brief summary (optional)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Content *" }), _jsx("textarea", { value: formData.content, onChange: (e) => setFormData({ ...formData, content: e.target.value }), required: true, rows: 10, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Full announcement content (supports HTML/Markdown)" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "normal", children: "Normal" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "urgent", children: "Urgent" }), _jsx("option", { value: "low", children: "Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Published Date" }), _jsx("input", { type: "date", value: formData.publishedAt, onChange: (e) => setFormData({ ...formData, publishedAt: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Expires At (Optional)" }), _jsx("input", { type: "date", value: formData.expiresAt, onChange: (e) => setFormData({ ...formData, expiresAt: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "isActive", checked: formData.isActive, onChange: (e) => setFormData({ ...formData, isActive: e.target.checked }), className: "rounded" }), _jsx("label", { htmlFor: "isActive", className: "text-sm text-gray-200", children: "Active (visible to staff)" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { type: "button", onClick: () => {
                                            setShowForm(false);
                                            setEditingNews(null);
                                            resetForm();
                                        }, className: "px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-900 text-gray-200", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: [editingNews ? 'Update' : 'Publish', " News"] })] })] })] })), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading news..." })) : (_jsx("div", { className: "space-y-4", children: news.map((item) => (_jsx("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: item.title }), _jsx("span", { className: "text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded", children: item.priority }), !item.isActive && (_jsx("span", { className: "text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded", children: "Inactive" }))] }), item.summary && _jsx("p", { className: "text-gray-300 mb-2", children: item.summary }), _jsxs("div", { className: "text-xs text-gray-400", children: ["Published: ", new Date(item.publishedAt).toLocaleDateString(), " |", ' ', item.confirmationCount || 0, " confirmations"] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleEdit(item), className: "px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm", children: "Edit" }), _jsx("button", { onClick: () => {
                                            if (confirm('Delete this news item?')) {
                                                deleteMutation.mutate(item.id);
                                            }
                                        }, className: "px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm", children: "Delete" })] })] }) }, item.id))) }))] }));
}
