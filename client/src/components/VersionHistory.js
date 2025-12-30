import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';
export default function VersionHistory({ resourceType, resourceId }) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading } = useQuery(['versions', resourceType, resourceId], async () => {
        try {
            // This would need to be implemented in the backend
            const res = await api.get(`/versions/${resourceType}/${resourceId}`);
            return res.data;
        }
        catch {
            return { versions: [] };
        }
    }, { enabled: isOpen });
    const versions = data?.versions || [];
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(true), className: "text-sm text-gray-400 hover:text-white", title: "View version history", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), isOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col", children: [_jsxs("div", { className: "bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center", children: [_jsx("h3", { className: "text-xl font-bold", children: "Version History" }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-white hover:text-gray-200", children: "\u2715" })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: isLoading ? (_jsx("div", { className: "text-center py-8 text-gray-400", children: "Loading versions..." })) : versions.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-400", children: "No version history available" })) : (_jsx("div", { className: "space-y-4", children: versions.map((version, idx) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 border-l-4 border-primary-500", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm font-semibold text-white", children: ["Version ", version.version] }), idx === 0 && (_jsx("span", { className: "text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded", children: "Current" }))] }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: new Date(version.createdAt || version.archivedAt).toLocaleString() })] }) }), version.changeLog && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-xs font-medium text-gray-300 mb-1", children: "Changes:" }), _jsx("p", { className: "text-sm text-gray-400", children: version.changeLog })] })), version.createdBy && (_jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Created by: ", version.createdBy] }))] }, version.id || idx))) })) })] }) }))] }));
}
