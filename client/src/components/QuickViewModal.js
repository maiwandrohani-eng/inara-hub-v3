import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
export default function QuickViewModal({ isOpen, onClose, fileUrl, title, fileType, downloadEndpoint, resourceId, }) {
    const [downloading, setDownloading] = useState(false);
    const { token } = useAuthStore();
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    const handleDownload = async () => {
        if (!fileUrl && !downloadEndpoint)
            return;
        setDownloading(true);
        try {
            let downloadUrl = downloadEndpoint || fileUrl;
            // If we have a resourceId and downloadEndpoint, use the API endpoint
            if (resourceId && downloadEndpoint) {
                const response = await api.get(downloadEndpoint, {
                    responseType: 'blob',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // Create blob and download
                const blob = new Blob([response.data], {
                    type: response.headers['content-type'] || 'application/octet-stream'
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                // Extract filename from Content-Disposition header or use title
                const contentDisposition = response.headers['content-disposition'];
                let filename = title;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }
                // Clean filename and add extension if needed
                const ext = fileType || (fileUrl.match(/\.[0-9a-z]+$/i)?.[0] || '');
                if (!filename.endsWith(ext) && ext) {
                    filename = filename.replace(/\.[^/.]+$/, '') + ext;
                }
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
            else {
                // Direct file download
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = title;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        catch (error) {
            console.error('Download error:', error);
            alert('Failed to download file. Please try again.');
        }
        finally {
            setDownloading(false);
        }
    };
    if (!isOpen)
        return null;
    const isPDF = fileType === 'pdf' || fileUrl?.toLowerCase().endsWith('.pdf') ||
        fileUrl?.toLowerCase().includes('.pdf');
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75", children: _jsxs("div", { className: "bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-700", children: [_jsx("h2", { className: "text-xl font-bold text-white truncate flex-1 mr-4", children: title }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: handleDownload, disabled: downloading, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2", children: downloading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Downloading..." })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }), _jsx("span", { children: "Download" })] })) }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: isPDF ? (_jsx("div", { className: "h-full w-full", children: _jsx(PDFViewer, { pdfUrl: fileUrl, title: title }) })) : (_jsx("div", { className: "h-full w-full flex items-center justify-center p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("svg", { className: "w-16 h-16 text-gray-500 mx-auto mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" }) }), _jsx("p", { className: "text-gray-400 mb-4", children: "Preview not available for this file type." }), _jsx("button", { onClick: handleDownload, disabled: downloading, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors", children: downloading ? 'Downloading...' : 'Download to View' })] }) })) })] }) }));
}
