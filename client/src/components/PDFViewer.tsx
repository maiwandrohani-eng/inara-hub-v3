import { useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Convert relative URL to absolute if needed
  // Handle different URL formats:
  // - Full URLs (http://...): use as-is (R2 public URLs)
  // - URLs starting with /uploads: use with API base URL (proxy through API)
  // - Relative paths: prepend /uploads
  const getFullPdfUrl = () => {
    if (pdfUrl.startsWith('http')) {
      // R2 public URL - use directly
      return pdfUrl;
    }
    
    // If URL already starts with /uploads, proxy through API
    if (pdfUrl.startsWith('/uploads')) {
      // Use API proxy endpoint to handle CORS and authentication
      const apiBase = (import.meta as any).env?.DEV 
        ? 'http://localhost:5000' 
        : ((import.meta as any).env?.VITE_API_URL || window.location.origin);
      return `${apiBase}/api${pdfUrl}`;
    }
    
    // Otherwise, prepend /uploads and proxy through API
    const apiBase = (import.meta as any).env?.DEV 
      ? 'http://localhost:5000' 
      : ((import.meta as any).env?.VITE_API_URL || window.location.origin);
    return `${apiBase}/api/uploads/${pdfUrl}`;
  };

  const fullPdfUrl = getFullPdfUrl();
  
  // Debug logging
  console.log('PDFViewer - Original URL:', pdfUrl);
  console.log('PDFViewer - Full URL:', fullPdfUrl);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      )}
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        {loading && (
          <div className="flex items-center justify-center h-96 bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-96 bg-gray-800">
            <div className="text-center text-red-400">
              <p className="mb-2">Failed to load PDF</p>
              <a 
                href={fullPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
        <iframe
          src={`${fullPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-96 md:h-[600px]"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          title={title || 'PDF Document'}
        />
      </div>
    </div>
  );
}

