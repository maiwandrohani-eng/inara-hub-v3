import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import BookmarkButton from '../components/BookmarkButton';
export default function Bookmarks() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [folderFilter, setFolderFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const { data, isLoading } = useQuery('bookmarks', async () => {
        const res = await api.get('/bookmarks');
        return res.data;
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/bookmarks/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
    const bookmarks = data?.bookmarks || [];
    const folders = Array.from(new Set(bookmarks.map((b) => b.folder).filter((f) => typeof f === 'string' && f.length > 0)));
    const filteredBookmarks = bookmarks.filter((b) => {
        if (folderFilter !== 'all' && b.folder !== folderFilter)
            return false;
        if (typeFilter !== 'all' && b.resourceType !== typeFilter)
            return false;
        return true;
    });
    const handleResourceClick = (bookmark) => {
        const routes = {
            training: '/training',
            policy: '/policies',
            library: '/library',
            template: '/templates',
        };
        navigate(routes[bookmark.resourceType] || '/');
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "My Bookmarks" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Your saved resources and favorites" })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsxs("select", { value: folderFilter, onChange: (e) => setFolderFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "all", children: "All Folders" }), folders.map((folder) => (_jsx("option", { value: folder, children: folder }, folder)))] }), _jsxs("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "training", children: "Training" }), _jsx("option", { value: "policy", children: "Policy" }), _jsx("option", { value: "library", children: "Library" }), _jsx("option", { value: "template", children: "Template" })] })] }) }), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading bookmarks..." })) : filteredBookmarks.length === 0 ? (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No bookmarks found." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredBookmarks.map((bookmark) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded capitalize", children: bookmark.resourceType }), bookmark.folder && (_jsx("span", { className: "ml-2 text-xs text-gray-500", children: bookmark.folder }))] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(BookmarkButton, { resourceType: bookmark.resourceType, resourceId: bookmark.resourceId }), _jsx("button", { onClick: () => deleteMutation.mutate(bookmark.id), className: "text-gray-400 hover:text-red-400", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) })] })] }), _jsxs("button", { onClick: () => handleResourceClick(bookmark), className: "text-left w-full", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-2", children: ["Resource ID: ", bookmark.resourceId] }), bookmark.notes && (_jsx("p", { className: "text-sm text-gray-400 mb-2", children: bookmark.notes })), _jsxs("p", { className: "text-xs text-gray-500", children: ["Bookmarked ", new Date(bookmark.createdAt).toLocaleDateString()] })] })] }, bookmark.id))) }))] }));
}
