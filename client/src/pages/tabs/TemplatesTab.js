import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import QuickViewModal from '../../components/QuickViewModal';
export default function TemplatesTab() {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [subcategoryFilter, setSubcategoryFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const { data, isLoading } = useQuery(['templates', search, categoryFilter, subcategoryFilter], async () => {
        const params = {};
        if (search)
            params.search = search;
        if (categoryFilter !== 'all')
            params.category = categoryFilter;
        if (subcategoryFilter !== 'all')
            params.subcategory = subcategoryFilter;
        const res = await api.get('/templates', { params });
        return res.data;
    });
    const { data: mostUsed } = useQuery('templates-most-used', async () => {
        const res = await api.get('/templates/analytics/most-used');
        return res.data;
    });
    const { data: analytics } = useQuery('templates-analytics', async () => {
        const res = await api.get('/analytics/tab/templates');
        return res.data;
    }, { enabled: isAdmin && showAnalytics });
    const allTemplates = data?.templates || [];
    const mostUsedTemplates = mostUsed?.templates || [];
    // Extract unique categories and subcategories from templates
    const { categories, subcategories, allTags } = useMemo(() => {
        const cats = new Set();
        const subcats = new Set();
        const tags = new Set();
        allTemplates.forEach((template) => {
            if (template.category)
                cats.add(template.category);
            if (template.subcategory)
                subcats.add(template.subcategory);
            if (template.tags && Array.isArray(template.tags)) {
                template.tags.forEach((tag) => tags.add(tag));
            }
        });
        return {
            categories: Array.from(cats).sort(),
            subcategories: Array.from(subcats).sort(),
            allTags: Array.from(tags).sort(),
        };
    }, [allTemplates]);
    // Filter and sort templates
    const templates = useMemo(() => {
        let filtered = [...allTemplates];
        // Tag filter
        if (tagFilter) {
            filtered = filtered.filter((template) => template.tags?.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase())));
        }
        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'date':
                    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
                case 'popularity':
                    return (b._count?.downloads || 0) - (a._count?.downloads || 0);
                default:
                    return 0;
            }
        });
        return filtered;
    }, [allTemplates, tagFilter, sortBy]);
    const handleDownload = async (templateId, templateTitle) => {
        try {
            // Use the download endpoint which will trigger proper file download
            const res = await api.get(`/templates/${templateId}/download`, {
                responseType: 'blob', // Important: tell axios to expect binary data
            });
            // Create a blob from the response
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = url;
            // Get filename from Content-Disposition header or use template title
            const contentDisposition = res.headers['content-disposition'];
            let filename = templateTitle || 'template';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Download error:', error);
            alert(error.response?.data?.message || 'Failed to download template. Please try again.');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Templates" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Standardized INARA templates for donor compliance" })] }), isAdmin && (_jsxs("button", { onClick: () => setShowAnalytics(!showAnalytics), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm", children: [showAnalytics ? 'Hide' : 'Show', " Analytics"] }))] }), isAdmin && showAnalytics && analytics && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Templates Analytics" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Top Users" }), _jsxs("div", { className: "space-y-2", children: [analytics.topUsers?.map((user, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-gray-700 p-3 rounded", children: [_jsxs("span", { className: "text-gray-200", children: [user.firstName, " ", user.lastName] }), _jsxs("span", { className: "text-primary-500 font-medium", children: [user.downloadCount, " downloads"] })] }, user.id || idx))), (!analytics.topUsers || analytics.topUsers.length === 0) && (_jsx("p", { className: "text-gray-400 text-sm", children: "No data available" }))] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\uD83D\uDD0D Search templates by title, description, or tags...", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" }), search && (_jsx("button", { onClick: () => setSearch(''), className: "absolute right-2 top-2 text-gray-400 hover:text-white", children: "\u2715" }))] }), _jsxs("button", { onClick: () => setShowAdvancedFilters(!showAdvancedFilters), className: `px-4 py-2 rounded-lg transition-colors ${showAdvancedFilters
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [showAdvancedFilters ? 'Hide' : 'Show', " Filters"] })] }), categories.length > 0 && (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Quick Filters:" }), _jsxs("button", { onClick: () => {
                                        setCategoryFilter('all');
                                        setSubcategoryFilter('all');
                                    }, className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === 'all'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allTemplates.length, ")"] }), categories.slice(0, 8).map((cat) => {
                                    const count = allTemplates.filter((t) => t.category === cat).length;
                                    return (_jsxs("button", { onClick: () => {
                                            setCategoryFilter(cat);
                                            setSubcategoryFilter('all');
                                        }, className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === cat
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [cat, " (", count, ")"] }, cat));
                                }), categories.length > 8 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["+", categories.length - 8, " more"] }))] }) })), showAdvancedFilters && (_jsxs("div", { className: "border-t border-gray-700 pt-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Category" }), _jsxs("select", { value: categoryFilter, onChange: (e) => {
                                                    setCategoryFilter(e.target.value);
                                                    setSubcategoryFilter('all');
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Subcategory" }), _jsxs("select", { value: subcategoryFilter, onChange: (e) => setSubcategoryFilter(e.target.value), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", disabled: categoryFilter === 'all', children: [_jsx("option", { value: "all", children: "All Subcategories" }), subcategories
                                                        .filter((sub) => {
                                                        if (categoryFilter === 'all')
                                                            return true;
                                                        return allTemplates.some((t) => t.category === categoryFilter && t.subcategory === sub);
                                                    })
                                                        .map((sub) => (_jsx("option", { value: sub, children: sub }, sub)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Sort By" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500", children: [_jsx("option", { value: "date", children: "Most Recent" }), _jsx("option", { value: "popularity", children: "Most Popular" }), _jsx("option", { value: "name", children: "Name (A-Z)" })] })] })] }), allTags.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Filter by Tag" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [allTags.slice(0, 10).map((tag) => (_jsxs("button", { onClick: () => setTagFilter(tagFilter === tag ? '' : tag), className: `px-3 py-1 rounded-full text-sm transition-colors ${tagFilter === tag
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["#", tag] }, tag))), allTags.length > 10 && (_jsxs("span", { className: "text-xs text-gray-500 self-center", children: ["+", allTags.length - 10, " more tags"] }))] })] })), (categoryFilter !== 'all' || subcategoryFilter !== 'all' || tagFilter) && (_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Active filters:" }), categoryFilter !== 'all' && (_jsxs("span", { className: "px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm", children: ["Category: ", categoryFilter, _jsx("button", { onClick: () => setCategoryFilter('all'), className: "ml-2 hover:text-white", children: "\u2715" })] })), subcategoryFilter !== 'all' && (_jsxs("span", { className: "px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm", children: ["Subcategory: ", subcategoryFilter, _jsx("button", { onClick: () => setSubcategoryFilter('all'), className: "ml-2 hover:text-white", children: "\u2715" })] })), tagFilter && (_jsxs("span", { className: "px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm", children: ["Tag: ", tagFilter, _jsx("button", { onClick: () => setTagFilter(''), className: "ml-2 hover:text-white", children: "\u2715" })] })), _jsx("button", { onClick: () => {
                                            setCategoryFilter('all');
                                            setSubcategoryFilter('all');
                                            setTagFilter('');
                                            setSearch('');
                                        }, className: "text-sm text-primary-400 hover:text-primary-300", children: "Clear All" })] }))] })), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: templates.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allTemplates.length }), " templates"] })] }), mostUsedTemplates.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Most Used Templates" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: mostUsedTemplates.slice(0, 3).map((template) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow", children: [_jsx("h3", { className: "font-semibold text-white mb-2", children: template.title }), template.description && (_jsx("p", { className: "text-sm text-gray-400 mb-2 line-clamp-2", children: template.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsxs("span", { children: [template._count?.downloads || 0, " downloads"] }), _jsx("button", { onClick: () => setSelectedTemplate(template), className: "text-primary-500 hover:text-primary-700 font-medium", children: "Quick View \u2192" })] })] }, template.id))) })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "All Templates" }), _jsxs("div", { className: "flex items-center space-x-2 bg-gray-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setViewMode('grid'), className: `p-2 rounded transition-colors ${viewMode === 'grid'
                                            ? 'bg-primary-500 text-white'
                                            : 'text-gray-400 hover:text-white'}`, title: "Grid View", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" }) }) }), _jsx("button", { onClick: () => setViewMode('list'), className: `p-2 rounded transition-colors ${viewMode === 'list'
                                            ? 'bg-primary-500 text-white'
                                            : 'text-gray-400 hover:text-white'}`, title: "List View", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) })] })] }), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading templates..." })) : viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: templates.map((template) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: template.title }), _jsxs("span", { className: "text-xs text-gray-500", children: ["v", template.version] })] }), template.description && (_jsx("p", { className: "text-sm text-gray-400 mb-4 line-clamp-3", children: template.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500 mb-4 flex-wrap gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [template.category && (_jsx("span", { className: "bg-primary-500/20 text-primary-300 px-2 py-1 rounded", children: template.category })), template.subcategory && (_jsx("span", { className: "bg-gray-700 text-gray-300 px-2 py-1 rounded", children: template.subcategory })), template.tags && template.tags.length > 0 && (_jsxs("span", { className: "text-gray-400", children: [template.tags.slice(0, 2).map((tag) => (_jsxs("span", { className: "mr-1", children: ["#", tag] }, tag))), template.tags.length > 2 && (_jsxs("span", { className: "text-gray-500", children: ["+", template.tags.length - 2] }))] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [template._count?.downloads > 0 && (_jsxs("span", { className: "text-gray-400", children: ["\uD83D\uDCE5 ", template._count.downloads, " downloads"] })), _jsxs("span", { children: ["Updated: ", new Date(template.lastUpdated).toLocaleDateString()] })] })] }), _jsx("button", { onClick: () => setSelectedTemplate(template), className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors", children: "Quick View" })] }, template.id))) })) : (_jsx("div", { className: "space-y-4", children: templates.map((template) => (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-start space-x-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: template.title }), _jsxs("span", { className: "text-xs text-gray-500", children: ["v", template.version] })] }), template.description && (_jsx("p", { className: "text-sm text-gray-400 mb-4", children: template.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500 mb-4 flex-wrap gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [template.category && (_jsx("span", { className: "bg-primary-500/20 text-primary-300 px-2 py-1 rounded", children: template.category })), template.subcategory && (_jsx("span", { className: "bg-gray-700 text-gray-300 px-2 py-1 rounded", children: template.subcategory })), template.tags && template.tags.length > 0 && (_jsxs("span", { className: "text-gray-400", children: [template.tags.slice(0, 2).map((tag) => (_jsxs("span", { className: "mr-1", children: ["#", tag] }, tag))), template.tags.length > 2 && (_jsxs("span", { className: "text-gray-500", children: ["+", template.tags.length - 2] }))] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [template._count?.downloads > 0 && (_jsxs("span", { className: "text-gray-400", children: ["\uD83D\uDCE5 ", template._count.downloads, " downloads"] })), _jsxs("span", { children: ["Updated: ", new Date(template.lastUpdated).toLocaleDateString()] })] })] })] }), _jsx("button", { onClick: () => setSelectedTemplate(template), className: "bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap", children: "Quick View" })] }, template.id))) }))] }), templates.length === 0 && !isLoading && (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No templates found." }) })), selectedTemplate && (_jsx(QuickViewModal, { isOpen: !!selectedTemplate, onClose: () => setSelectedTemplate(null), fileUrl: selectedTemplate.fileUrl || '', title: selectedTemplate.title, fileType: selectedTemplate.fileUrl?.split('.').pop()?.toLowerCase(), downloadEndpoint: `/templates/${selectedTemplate.id}/download`, resourceId: selectedTemplate.id }))] }));
}
