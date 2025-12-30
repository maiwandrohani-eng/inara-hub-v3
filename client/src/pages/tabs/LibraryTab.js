import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { getAllLibraryCategories } from '../../config/categories';
import QuickViewModal from '../../components/QuickViewModal';
export default function LibraryTab() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedResource, setSelectedResource] = useState(null);
    const availableCategories = getAllLibraryCategories();
    const [showAnalytics, setShowAnalytics] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const { data, isLoading } = useQuery(['library', search, typeFilter, categoryFilter], async () => {
        const params = {};
        if (search)
            params.search = search;
        if (typeFilter !== 'all')
            params.type = typeFilter;
        if (categoryFilter !== 'all')
            params.category = categoryFilter;
        const res = await api.get('/library', { params });
        return res.data;
    });
    const { data: recommended } = useQuery('library-recommended', async () => {
        const res = await api.get('/library/recommended/all');
        return res.data;
    });
    const { data: analytics } = useQuery('library-analytics', async () => {
        const res = await api.get('/analytics/tab/library');
        return res.data;
    }, { enabled: isAdmin && showAnalytics });
    const allResources = data?.resources || [];
    const recommendedResources = recommended?.resources || [];
    // Extract unique categories from resources
    const { categories } = useMemo(() => {
        const cats = new Set();
        allResources.forEach((resource) => {
            if (resource.category)
                cats.add(resource.category);
        });
        return {
            categories: Array.from(cats).sort(),
        };
    }, [allResources]);
    // Filter resources based on search, type, and category
    const resources = useMemo(() => {
        let filtered = [...allResources];
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter((r) => r.title?.toLowerCase().includes(searchLower) ||
                r.description?.toLowerCase().includes(searchLower) ||
                r.tags?.some((tag) => tag.toLowerCase().includes(searchLower)));
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter((r) => r.resourceType === typeFilter);
        }
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((r) => r.category === categoryFilter);
        }
        return filtered;
    }, [allResources, search, typeFilter, categoryFilter]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Library" }), _jsx("p", { className: "text-gray-400 mt-2", children: "INARA's knowledge hub and institutional resources" })] }), isAdmin && (_jsxs("button", { onClick: () => setShowAnalytics(!showAnalytics), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm", children: [showAnalytics ? 'Hide' : 'Show', " Analytics"] }))] }), isAdmin && showAnalytics && analytics && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Library Analytics" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Top Readers" }), _jsxs("div", { className: "space-y-2", children: [analytics.topReaders?.map((reader, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-gray-700 p-3 rounded", children: [_jsxs("span", { className: "text-gray-200", children: [reader.firstName, " ", reader.lastName] }), _jsxs("span", { className: "text-primary-500 font-medium", children: [reader.readCount, " reads"] })] }, reader.id || idx))), (!analytics.topReaders || analytics.topReaders.length === 0) && (_jsx("p", { className: "text-gray-400 text-sm", children: "No data available" }))] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\uD83D\uDD0D Search library by title, description, or tags...", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" }), search && (_jsx("button", { onClick: () => setSearch(''), className: "absolute right-2 top-2 text-gray-400 hover:text-white", children: "\u2715" }))] }), _jsxs("select", { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), className: "px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "book", children: "Books" }), _jsx("option", { value: "sop", children: "SOPs" }), _jsx("option", { value: "guidance", children: "Guidance Notes" }), _jsx("option", { value: "research", children: "Research" }), _jsx("option", { value: "case_study", children: "Case Studies" })] })] }), categories.length > 0 && (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Quick Filters:" }), _jsxs("button", { onClick: () => setCategoryFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === 'all'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allResources.length, ")"] }), categories.slice(0, 8).map((cat) => {
                                    const count = allResources.filter((r) => r.category === cat).length;
                                    return (_jsxs("button", { onClick: () => setCategoryFilter(cat), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === cat
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [cat, " (", count, ")"] }, cat));
                                }), categories.length > 8 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["+", categories.length - 8, " more"] }))] }) })), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: resources.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allResources.length }), " resources"] })] }), recommendedResources.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Recommended for You" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: recommendedResources.slice(0, 3).map((resource) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow", children: [_jsx("h3", { className: "font-semibold text-white mb-2", children: resource.title }), resource.description && (_jsx("p", { className: "text-sm text-gray-400 mb-2 line-clamp-2", children: resource.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsx("span", { children: resource.resourceType }), resource.category && _jsx("span", { children: resource.category })] })] }, resource.id))) })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "All Resources" }), _jsxs("div", { className: "flex items-center space-x-2 bg-gray-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('grid'), className: `p-2 rounded transition-colors ${viewMode === 'grid'
                                            ? 'bg-primary-500 text-white'
                                            : 'text-gray-400 hover:text-white'}`, title: "Grid View", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" }) }) }), _jsx("button", { onClick: () => setViewMode('list'), className: `p-2 rounded transition-colors ${viewMode === 'list'
                                            ? 'bg-primary-500 text-white'
                                            : 'text-gray-400 hover:text-white'}`, title: "List View", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) })] })] }), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading resources..." })) : viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: resources.map((resource) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: () => window.open(resource.fileUrl || '#', '_blank'), children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: resource.title }), _jsx("span", { className: "text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded", children: resource.resourceType })] }), resource.description && (_jsx("p", { className: "text-sm text-gray-400 mb-3 line-clamp-3", children: resource.description })), _jsx("div", { className: "flex flex-wrap gap-2", children: resource.tags?.slice(0, 3).map((tag, idx) => (_jsx("span", { className: "text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded", children: tag }, idx))) }), resource.category && (_jsxs("div", { className: "mt-3 text-xs text-gray-500", children: ["Category: ", resource.category] }))] }, resource.id))) })) : (_jsx("div", { className: "space-y-4", children: resources.map((resource) => (_jsx("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer flex items-start space-x-4", onClick: () => setSelectedResource(resource), children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: resource.title }), _jsx("span", { className: "text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded ml-2", children: resource.resourceType })] }), resource.description && (_jsx("p", { className: "text-sm text-gray-400 mb-3", children: resource.description })), _jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: resource.tags?.slice(0, 5).map((tag, idx) => (_jsx("span", { className: "text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded", children: tag }, idx))) }), resource.category && (_jsxs("div", { className: "text-xs text-gray-500", children: ["Category: ", resource.category] }))] }) }, resource.id))) }))] }), resources.length === 0 && !isLoading && (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No resources found." }) })), selectedResource && (_jsx(QuickViewModal, { isOpen: !!selectedResource, onClose: () => setSelectedResource(null), fileUrl: selectedResource.fileUrl || '', title: selectedResource.title, fileType: selectedResource.fileUrl?.split('.').pop()?.toLowerCase() }))] }));
}
