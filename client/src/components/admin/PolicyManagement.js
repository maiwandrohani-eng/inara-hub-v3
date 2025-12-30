import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllPolicyCategories, getPolicySubcategories } from '../../config/categories';
export default function PolicyManagement() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        brief: '',
        complete: '',
        assessment: { questions: [], passingScore: 70 },
        isMandatory: false,
        category: '',
        subcategory: '',
        customCategory: '',
        customSubcategory: '',
        tags: [''],
        effectiveDate: new Date().toISOString().split('T')[0],
    });
    const availableCategories = getAllPolicyCategories();
    const availableSubcategories = formData.category && formData.category !== 'OTHER' ? getPolicySubcategories(formData.category) : [];
    const isCustomCategory = formData.category === 'OTHER';
    const isCustomSubcategory = formData.subcategory === 'OTHER';
    const queryClient = useQueryClient();
    const { data: policies } = useQuery('admin-policies', async () => {
        const res = await api.get('/admin/policies');
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/policies', {
            ...data,
            effectiveDate: new Date(data.effectiveDate),
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-policies');
            setShowForm(false);
            alert('Policy created! It will automatically appear in Brief, Complete, and Assessment views.');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/admin/policies/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-policies');
            alert('Policy deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete policy');
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            category: isCustomCategory ? formData.customCategory : formData.category,
            subcategory: isCustomSubcategory ? formData.customSubcategory : formData.subcategory,
        };
        delete submitData.customCategory;
        delete submitData.customSubcategory;
        createMutation.mutate(submitData);
    };
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkFiles, setBulkFiles] = useState([]);
    const [bulkFolders, setBulkFolders] = useState([]);
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const bulkImportMutation = useMutation(async (files) => {
        const formData = new FormData();
        formData.append('type', 'policy');
        files.forEach((file) => {
            formData.append('files', file);
            // Include folder path if available (webkitRelativePath)
            if (file.webkitRelativePath) {
                formData.append('paths', file.webkitRelativePath);
            }
        });
        const res = await api.post('/admin/policies/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: (data) => {
            setBulkResults(data);
            queryClient.invalidateQueries('admin-policies');
            setBulkFiles([]);
            setBulkFolders([]);
            alert(`Bulk import completed! ${data.imported} imported, ${data.failed} failed.`);
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Bulk import failed');
        },
        onSettled: () => {
            setBulkImporting(false);
        },
    });
    const handleBulkImport = () => {
        if (bulkFiles.length === 0) {
            alert('Please select folders to import');
            return;
        }
        setBulkImporting(true);
        bulkImportMutation.mutate(bulkFiles);
    };
    const handleFolderSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0)
            return;
        // Extract unique folder names from webkitRelativePath
        const folders = new Set();
        files.forEach((file) => {
            if (file.webkitRelativePath) {
                const parts = file.webkitRelativePath.split('/');
                if (parts.length > 1) {
                    // Get the folder structure (category/subcategory)
                    folders.add(parts.slice(0, -1).join('/'));
                }
            }
        });
        setBulkFiles(files);
        setBulkFolders(Array.from(folders));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Policy Management" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setShowBulkImport(!showBulkImport), className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700", children: showBulkImport ? 'Cancel Bulk Import' : '📦 Bulk Import' }), _jsx("button", { onClick: () => setShowForm(!showForm), className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: showForm ? 'Cancel' : '+ Upload Policy' })] })] }), showBulkImport && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Bulk Import Policies" }), _jsxs("p", { className: "text-sm text-gray-400 mb-4", children: ["Select folders that are already sorted by categories. The folder structure will be used to automatically assign categories and subcategories.", _jsx("br", {}), _jsx("strong", { className: "text-yellow-400", children: "Example:" }), " Select a folder structure like \"HR/Recruitment/\" or \"Finance/Budget/\" and all files within will be categorized accordingly."] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Select Folders (containing PDF, DOC, DOCX, etc.)" }), _jsx("input", { type: "file", 
                                        // @ts-ignore - webkitdirectory is a valid HTML attribute
                                        webkitdirectory: "", multiple: true, onChange: handleFolderSelect, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", accept: ".pdf,.doc,.docx,.txt" }), bulkFiles.length > 0 && (_jsxs("div", { className: "mt-2 space-y-2", children: [_jsxs("p", { className: "text-sm text-green-400", children: ["\u2705 ", bulkFiles.length, " file(s) selected from ", bulkFolders.length, " folder(s)"] }), bulkFolders.length > 0 && (_jsxs("div", { className: "mt-2 p-3 bg-gray-700 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-300 mb-2", children: "Folder structure detected:" }), _jsxs("ul", { className: "text-xs text-gray-400 space-y-1", children: [bulkFolders.slice(0, 10).map((folder, idx) => (_jsxs("li", { children: ["\uD83D\uDCC1 ", folder] }, idx))), bulkFolders.length > 10 && (_jsxs("li", { className: "text-gray-500", children: ["... and ", bulkFolders.length - 10, " more folders"] }))] })] }))] }))] }), _jsx("button", { onClick: handleBulkImport, disabled: bulkImporting || bulkFiles.length === 0, className: "w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50", children: bulkImporting ? 'Importing...' : `Import ${bulkFiles.length} File(s) from ${bulkFolders.length} Folder(s)` }), bulkResults && (_jsxs("div", { className: "mt-4 p-4 bg-gray-700 rounded-lg", children: [_jsx("h4", { className: "text-white font-semibold mb-2", children: "Import Results:" }), _jsxs("p", { className: "text-green-400", children: ["\u2705 ", bulkResults.imported, " imported successfully"] }), bulkResults.failed > 0 && (_jsxs("p", { className: "text-red-400", children: ["\u274C ", bulkResults.failed, " failed"] })), bulkResults.results && bulkResults.results.length > 0 && (_jsx("div", { className: "mt-2 max-h-40 overflow-y-auto", children: bulkResults.results.map((r, idx) => (_jsxs("div", { className: "text-sm text-gray-300", children: [r.fileName, " \u2192 ", r.category || 'Uncategorized', r.subcategory && ` / ${r.subcategory}`] }, idx))) }))] }))] })] })), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Upload Policy" }), _jsx("p", { className: "text-sm text-gray-400 mb-4", children: "The policy will automatically be structured into Brief, Complete, and Assessment sections." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Brief Summary *" }), _jsx("textarea", { value: formData.brief, onChange: (e) => setFormData({ ...formData, brief: e.target.value }), required: true, rows: 3, placeholder: "Brief summary that appears in the Brief view", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Complete Policy Content *" }), _jsx("textarea", { value: formData.complete, onChange: (e) => setFormData({ ...formData, complete: e.target.value }), required: true, rows: 10, placeholder: "Full policy content (Markdown/HTML) that appears in the Complete view", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value, subcategory: '', customCategory: '', customSubcategory: '' }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Category" }), availableCategories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat))), _jsx("option", { value: "OTHER", children: "Other (Custom)" })] }), isCustomCategory && (_jsx("input", { type: "text", value: formData.customCategory, onChange: (e) => setFormData({ ...formData, customCategory: e.target.value }), placeholder: "Enter custom category", className: "w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Subcategory" }), _jsxs("select", { value: formData.subcategory, onChange: (e) => setFormData({ ...formData, subcategory: e.target.value, customSubcategory: '' }), disabled: !formData.category, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("option", { value: "", children: "Select Subcategory" }), availableSubcategories.map((subcat) => (_jsx("option", { value: subcat, children: subcat }, subcat))), formData.category && _jsx("option", { value: "OTHER", children: "Other (Custom)" })] }), isCustomSubcategory && (_jsx("input", { type: "text", value: formData.customSubcategory, onChange: (e) => setFormData({ ...formData, customSubcategory: e.target.value }), placeholder: "Enter custom subcategory", className: "w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Assessment Questions (JSON)" }), _jsx("textarea", { value: JSON.stringify(formData.assessment, null, 2), onChange: (e) => {
                                            try {
                                                setFormData({ ...formData, assessment: JSON.parse(e.target.value) });
                                            }
                                            catch { }
                                        }, rows: 5, placeholder: '{"questions": [{"question": "...", "options": [...], "correctAnswer": "..."}], "passingScore": 70}', className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono text-sm" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.isMandatory, onChange: (e) => setFormData({ ...formData, isMandatory: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Mandatory Policy" })] }), _jsx("button", { type: "submit", disabled: createMutation.isLoading, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading ? 'Creating...' : 'Create Policy' })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "All Policies" }), _jsx("div", { className: "space-y-2", children: policies?.policies?.map((policy) => (_jsxs("div", { className: "bg-gray-700 p-4 rounded flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold", children: policy.title }), _jsxs("p", { className: "text-gray-400 text-sm", children: ["v", policy.version, " \u2022 ", policy.category || 'Uncategorized'] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `text-xs px-2 py-1 rounded ${policy.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-400'}`, children: policy.isActive ? 'Active' : 'Inactive' }), _jsx("button", { onClick: () => {
                                                if (window.confirm(`Are you sure you want to delete "${policy.title}"? This action cannot be undone.`)) {
                                                    deleteMutation.mutate(policy.id);
                                                }
                                            }, disabled: deleteMutation.isLoading, className: "px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors", children: "Delete" })] })] }, policy.id))) })] })] }));
}
