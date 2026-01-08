import { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  fileType?: string;
  downloadEndpoint?: string;
  resourceId?: string;
}

export default function QuickViewModal({
  isOpen,
  onClose,
  fileUrl,
  title,
  fileType,
  downloadEndpoint,
  resourceId,
}: QuickViewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownload = async () => {
    if (!fileUrl && !downloadEndpoint) return;

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
      } else {
        // Direct file download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  // Convert fileUrl to use API proxy for R2 URLs (same logic as PDFViewer)
  const getProxiedFileUrl = () => {
    if (!fileUrl) return '';
    
    // Always use API proxy for R2 URLs to avoid Vercel rewrite issues
    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        // If it's the same origin or R2 public URL, use API proxy
        if (url.hostname === window.location.hostname || url.hostname.includes('inara.ngo')) {
          // Extract path (e.g., /templates/1767878369908-79350700.pdf)
          // Remove leading slash to get the R2 key (e.g., templates/1767878369908-79350700.pdf)
          const r2Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
          // Use API uploads proxy endpoint - it expects the R2 key directly
          return `${window.location.origin}/api/uploads/${r2Key}`;
        }
        // External URL - use directly
        return fileUrl;
      } catch {
        // Invalid URL, use as-is
        return fileUrl;
      }
    }
    
    // If URL already starts with /uploads, proxy through API
    if (fileUrl.startsWith('/uploads')) {
      const apiBase = (import.meta as any).env?.DEV 
        ? 'http://localhost:5000' 
        : ((import.meta as any).env?.VITE_API_URL || window.location.origin);
      return `${apiBase}/api${fileUrl}`;
    }
    
    // Otherwise, prepend /uploads and proxy through API
    const apiBase = (import.meta as any).env?.DEV 
      ? 'http://localhost:5000' 
      : ((import.meta as any).env?.VITE_API_URL || window.location.origin);
    return `${apiBase}/api/uploads/${fileUrl}`;
  };

  const proxiedFileUrl = getProxiedFileUrl();
  const isPDF = fileType === 'pdf' || fileUrl?.toLowerCase().endsWith('.pdf') || 
                fileUrl?.toLowerCase().includes('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white truncate flex-1 mr-4">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isPDF ? (
            <div className="h-full w-full">
              <PDFViewer pdfUrl={proxiedFileUrl || fileUrl} title={title} />
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center p-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 mb-4">Preview not available for this file type.</p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {downloading ? 'Downloading...' : 'Download to View'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


