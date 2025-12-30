import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function PDFViewer({ pdfUrl, title }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // Convert relative URL to absolute if needed
    // Handle different URL formats:
    // - Full URLs (http://...): use as-is
    // - URLs starting with /uploads: use with API base URL (don't add /uploads again)
    // - Relative paths: prepend /uploads
    const getFullPdfUrl = () => {
        if (pdfUrl.startsWith('http')) {
            return pdfUrl;
        }
        // If URL already starts with /uploads, use it directly with API base
        if (pdfUrl.startsWith('/uploads')) {
            // For development, use localhost:5000, for production use window.location.origin
            const apiBase = import.meta.env?.DEV
                ? 'http://localhost:5000'
                : (import.meta.env?.VITE_API_URL || window.location.origin);
            return `${apiBase}${pdfUrl}`;
        }
        // Otherwise, prepend /uploads
        const apiBase = import.meta.env?.DEV
            ? 'http://localhost:5000'
            : (import.meta.env?.VITE_API_URL || window.location.origin);
        return `${apiBase}/uploads/${pdfUrl}`;
    };
    const fullPdfUrl = getFullPdfUrl();
    // Debug logging
    console.log('PDFViewer - Original URL:', pdfUrl);
    console.log('PDFViewer - Full URL:', fullPdfUrl);
    return (_jsxs("div", { className: "w-full", children: [title && (_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: title })), _jsxs("div", { className: "border border-gray-700 rounded-lg overflow-hidden bg-gray-900", children: [loading && (_jsx("div", { className: "flex items-center justify-center h-96 bg-gray-800", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading PDF..." })] }) })), error && (_jsx("div", { className: "flex items-center justify-center h-96 bg-gray-800", children: _jsxs("div", { className: "text-center text-red-400", children: [_jsx("p", { className: "mb-2", children: "Failed to load PDF" }), _jsx("a", { href: fullPdfUrl, target: "_blank", rel: "noopener noreferrer", className: "text-primary-400 hover:text-primary-300 underline", children: "Open in new tab" })] }) })), _jsx("iframe", { src: `${fullPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`, className: "w-full h-96 md:h-[600px]", onLoad: () => setLoading(false), onError: () => {
                            setLoading(false);
                            setError(true);
                        }, title: title || 'PDF Document' })] })] }));
}
