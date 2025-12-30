import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Component for managing course resources (PDFs, books, modules)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function CourseResourceManager({ training }) {
    const [showResources, setShowResources] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [resourceTitles, setResourceTitles] = useState([]);
    const [resourceDescriptions, setResourceDescriptions] = useState([]);
    const queryClient = useQueryClient();
    const { data: resourcesData } = useQuery(['course-resources', training.id], async () => {
        const res = await api.get(`/academy/courses/${training.id}/resources`);
        return res.data;
    }, { enabled: showResources });
    const uploadResourcesMutation = useMutation(async (formData) => {
        const res = await api.post(`/admin/academy/courses/${training.id}/resources`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries(['course-resources', training.id]);
            setSelectedFiles([]);
            setResourceTitles([]);
            setResourceDescriptions([]);
            setShowUploadForm(false);
            alert('Resources uploaded successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to upload resources');
        },
    });
    const deleteResourceMutation = useMutation(async (resourceId) => {
        const res = await api.delete(`/admin/academy/courses/${training.id}/resources/${resourceId}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries(['course-resources', training.id]);
            alert('Resource deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete resource');
        },
    });
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
        setResourceTitles(files.map(f => f.name.replace(/\.[^/.]+$/, '')));
        setResourceDescriptions(files.map(() => ''));
    };
    const handleUpload = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            alert('Please select at least one file');
            return;
        }
        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });
        formData.append('titles', JSON.stringify(resourceTitles));
        formData.append('descriptions', JSON.stringify(resourceDescriptions));
        uploadResourcesMutation.mutate(formData);
    };
    const resources = resourcesData?.resources || [];
    return (_jsxs("div", { className: "bg-gray-700 p-4 rounded", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-white font-semibold", children: training.title }), _jsxs("p", { className: "text-gray-400 text-sm", children: [training.category || 'Uncategorized', " \u2022 ", resources.length, " resource(s)"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setShowResources(!showResources), className: "px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700", children: [showResources ? 'Hide' : 'Manage', " Resources"] }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${training.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-400'}`, children: training.isActive ? 'Active' : 'Inactive' })] })] }), showResources && (_jsxs("div", { className: "mt-4 space-y-4 border-t border-gray-600 pt-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h5", { className: "text-white font-medium", children: "Course Resources" }), _jsx("button", { onClick: () => setShowUploadForm(!showUploadForm), className: "px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600", children: showUploadForm ? 'Cancel' : '+ Upload Resources' })] }), showUploadForm && (_jsxs("form", { onSubmit: handleUpload, className: "bg-gray-800 p-4 rounded space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Select PDFs/Books/Modules (Multiple files allowed)" }), _jsx("input", { type: "file", multiple: true, accept: ".pdf,.doc,.docx", onChange: handleFileSelect, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }), selectedFiles.length > 0 && (_jsx("div", { className: "mt-2 space-y-2", children: selectedFiles.map((file, idx) => (_jsxs("div", { className: "bg-gray-700 p-2 rounded", children: [_jsx("input", { type: "text", value: resourceTitles[idx] || '', onChange: (e) => {
                                                        const newTitles = [...resourceTitles];
                                                        newTitles[idx] = e.target.value;
                                                        setResourceTitles(newTitles);
                                                    }, placeholder: "Resource title", className: "w-full mb-2 px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded text-sm" }), _jsx("textarea", { value: resourceDescriptions[idx] || '', onChange: (e) => {
                                                        const newDescs = [...resourceDescriptions];
                                                        newDescs[idx] = e.target.value;
                                                        setResourceDescriptions(newDescs);
                                                    }, placeholder: "Optional description", rows: 2, className: "w-full px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded text-sm" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: file.name })] }, idx))) }))] }), _jsx("button", { type: "submit", disabled: uploadResourcesMutation.isLoading || selectedFiles.length === 0, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: uploadResourcesMutation.isLoading ? 'Uploading...' : `Upload ${selectedFiles.length} Resource(s)` })] })), _jsx("div", { className: "space-y-2", children: resources.length === 0 ? (_jsx("p", { className: "text-gray-400 text-sm text-center py-4", children: "No resources uploaded yet" })) : (resources.map((resource) => (_jsxs("div", { className: "bg-gray-800 p-3 rounded flex justify-between items-center", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h6", { className: "text-white font-medium text-sm", children: resource.title }), resource.description && (_jsx("p", { className: "text-gray-400 text-xs mt-1", children: resource.description })), _jsxs("p", { className: "text-gray-500 text-xs mt-1", children: [resource.fileType.toUpperCase(), " \u2022 ", resource.fileSize ? `${(resource.fileSize / 1024).toFixed(1)} KB` : ''] })] }), _jsx("button", { onClick: () => {
                                        if (window.confirm(`Delete "${resource.title}"?`)) {
                                            deleteResourceMutation.mutate(resource.id);
                                        }
                                    }, disabled: deleteResourceMutation.isLoading, className: "ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50", children: "Delete" })] }, resource.id)))) })] }))] }));
}
