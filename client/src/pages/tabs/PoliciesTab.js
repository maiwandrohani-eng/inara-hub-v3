import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
export default function PoliciesTab() {
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState('brief');
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';
    const { data, isLoading } = useQuery('policies', async () => {
        const res = await api.get('/policies');
        return res.data;
    });
    const { data: analytics } = useQuery('policies-analytics', async () => {
        const res = await api.get('/analytics/tab/policies');
        return res.data;
    }, { enabled: isAdmin && showAnalytics });
    const allPolicies = data?.policies || [];
    // Extract unique categories from policies
    const { categories } = useMemo(() => {
        const cats = new Set();
        allPolicies.forEach((policy) => {
            if (policy.category)
                cats.add(policy.category);
        });
        return {
            categories: Array.from(cats).sort(),
        };
    }, [allPolicies]);
    const filteredPolicies = useMemo(() => {
        return allPolicies.filter((p) => {
            const cert = p.certifications?.[0];
            // Status filter
            if (filter === 'mandatory' && !p.isMandatory)
                return false;
            if (filter === 'acknowledged' && cert?.status !== 'ACKNOWLEDGED')
                return false;
            if (filter === 'not-acknowledged' && cert?.status === 'ACKNOWLEDGED')
                return false;
            // Category filter
            if (categoryFilter !== 'all' && p.category !== categoryFilter)
                return false;
            return true;
        });
    }, [allPolicies, filter, categoryFilter]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Policies" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Read, understand, and certify INARA policies" })] }), isAdmin && (_jsxs("button", { onClick: () => setShowAnalytics(!showAnalytics), className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm", children: [showAnalytics ? 'Hide' : 'Show', " Analytics"] }))] }), isAdmin && showAnalytics && analytics && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Policies Analytics" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Top Certifiers" }), _jsxs("div", { className: "space-y-2", children: [analytics.topCertifiers?.map((certifier, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-gray-700 p-3 rounded", children: [_jsxs("span", { className: "text-gray-200", children: [certifier.firstName, " ", certifier.lastName] }), _jsxs("span", { className: "text-primary-500 font-medium", children: [certifier.certificationCount, " certifications"] })] }, certifier.id || idx))), (!analytics.topCertifiers || analytics.topCertifiers.length === 0) && (_jsx("p", { className: "text-gray-400 text-sm", children: "No data available" }))] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Status:" }), ['all', 'mandatory', 'not-acknowledged', 'acknowledged'].map((f) => {
                                const count = allPolicies.filter((p) => {
                                    const cert = p.certifications?.[0];
                                    if (f === 'all')
                                        return true;
                                    if (f === 'mandatory')
                                        return p.isMandatory;
                                    if (f === 'acknowledged')
                                        return cert?.status === 'ACKNOWLEDGED';
                                    if (f === 'not-acknowledged')
                                        return !cert || cert.status === 'NOT_ACKNOWLEDGED';
                                    return true;
                                }).length;
                                return (_jsxs("button", { onClick: () => setFilter(f), className: `px-3 py-1 rounded-full text-sm transition-colors ${filter === f
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' '), " (", count, ")"] }, f));
                            })] }), categories.length > 0 && (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Categories:" }), _jsxs("button", { onClick: () => setCategoryFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === 'all'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: ["All (", allPolicies.length, ")"] }), categories.slice(0, 8).map((cat) => {
                                    const count = allPolicies.filter((p) => p.category === cat).length;
                                    return (_jsxs("button", { onClick: () => setCategoryFilter(cat), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === cat
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [cat, " (", count, ")"] }, cat));
                                }), categories.length > 8 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["+", categories.length - 8, " more"] }))] }) })), _jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: filteredPolicies.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allPolicies.length }), " policies"] })] }), isLoading ? (_jsx("div", { className: "text-center py-12", children: "Loading policies..." })) : (_jsx("div", { className: "space-y-4", children: filteredPolicies.map((policy) => {
                    const cert = policy.certifications?.[0];
                    const status = cert?.status || 'NOT_ACKNOWLEDGED';
                    return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: policy.title }), policy.isMandatory && (_jsx("span", { className: "bg-red-900/30 text-red-300 text-xs font-medium px-2 py-1 rounded", children: "Mandatory" })), _jsxs("span", { className: "text-xs text-gray-500", children: ["v", policy.version] })] }), policy.category && (_jsx("span", { className: "text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded", children: policy.category }))] }), _jsx("span", { className: `text-xs font-medium px-2 py-1 rounded ${status === 'ACKNOWLEDGED'
                                            ? 'bg-green-900/30 text-green-300'
                                            : 'bg-yellow-100 text-yellow-300'}`, children: status.replace('_', ' ') })] }), _jsx("div", { className: "flex space-x-2 mb-4 border-b border-gray-700", children: ['brief', 'complete', 'assessment'].map((mode) => (_jsx("button", { onClick: () => setViewMode(mode), className: `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${viewMode === mode
                                        ? 'border-primary-500 text-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-200'}`, children: mode.charAt(0).toUpperCase() + mode.slice(1) }, mode))) }), _jsxs("div", { className: "mb-4", children: [viewMode === 'brief' && (_jsx("p", { className: "text-gray-200", children: policy.brief })), viewMode === 'complete' && (_jsx("div", { className: "prose max-w-none text-gray-200", dangerouslySetInnerHTML: { __html: policy.complete } })), viewMode === 'assessment' && policy.assessment && (_jsx("div", { className: "text-gray-200", children: _jsx("p", { children: "Assessment available. Click below to take it." }) }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-xs text-gray-500", children: ["Effective: ", new Date(policy.effectiveDate).toLocaleDateString()] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    setSelectedPolicy(policy);
                                                }, className: "text-primary-500 hover:text-primary-700 text-sm font-medium", children: "Quick View" }), _jsxs(Link, { to: `/policies/${policy.id}`, className: "text-primary-500 hover:text-primary-700 text-sm font-medium", onClick: (e) => e.stopPropagation(), children: [status === 'NOT_ACKNOWLEDGED' ? 'Read & Certify' : 'View', " \u2192"] })] })] })] }, policy.id));
                }) })), filteredPolicies.length === 0 && (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No policies found." }) })), selectedPolicy && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75", onClick: () => setSelectedPolicy(null), children: _jsxs("div", { className: "bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-700", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: selectedPolicy.title }), _jsx("button", { onClick: () => setSelectedPolicy(null), className: "p-2 text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsxs("div", { className: "prose prose-invert max-w-none text-gray-200", children: [viewMode === 'brief' && _jsx("p", { children: selectedPolicy.brief }), viewMode === 'complete' && (_jsx("div", { dangerouslySetInnerHTML: { __html: selectedPolicy.complete } })), viewMode === 'assessment' && selectedPolicy.assessment && (_jsx("div", { children: _jsx("p", { className: "text-gray-400 mb-4", children: "Assessment available. Click below to take it." }) }))] }) }), _jsxs("div", { className: "flex items-center justify-between p-4 border-t border-gray-700", children: [_jsxs("div", { className: "text-xs text-gray-500", children: ["Effective: ", new Date(selectedPolicy.effectiveDate).toLocaleDateString()] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { onClick: () => {
                                                // Export policy as PDF or text
                                                const content = viewMode === 'brief' ? selectedPolicy.brief : selectedPolicy.complete;
                                                const blob = new Blob([content], { type: 'text/plain' });
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${selectedPolicy.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                            }, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors", children: "Download as Text" }), _jsx(Link, { to: `/policies/${selectedPolicy.id}`, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors", children: "View Full Policy" })] })] })] }) }))] }));
}
