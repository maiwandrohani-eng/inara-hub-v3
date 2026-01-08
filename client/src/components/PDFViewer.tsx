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
  // - Full URLs (http://...): Check if it's R2 public URL or needs proxy
  // - URLs starting with /uploads: proxy through API
  // - Relative paths: prepend /uploads and proxy through API
  const getFullPdfUrl = () => {
    // Always use API proxy for R2 URLs to avoid Vercel rewrite issues
    // R2 public URLs might be caught by Vercel rewrites and return HTML instead of PDF
    
    if (pdfUrl.startsWith('http')) {
      // If it's an R2 public URL (hub.inara.ngo), extract the path and use API proxy
      // This prevents Vercel from catching it and returning HTML
      try {
        const url = new URL(pdfUrl);
        // If it's the same origin or R2 public URL, use API proxy
        if (url.hostname === window.location.hostname || url.hostname.includes('inara.ngo')) {
          // Extract path (e.g., /library/1767878369908-79350700.pdf)
          const path = url.pathname;
          // Use API proxy to ensure we get the actual file, not HTML
          return `${window.location.origin}/api${path}`;
        }
        // External URL - use directly
        return pdfUrl;
      } catch {
        // Invalid URL, use as-is
        return pdfUrl;
      }
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
          onLoad={(e) => {
            // Check if iframe loaded HTML instead of PDF
            try {
              const iframe = e.target as HTMLIFrameElement;
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc) {
                // If we can access the document and it has a body with React content, it's HTML
                const bodyText = iframeDoc.body?.innerText || '';
                if (bodyText.includes('Loading INARA Platform') || bodyText.includes('React')) {
                  console.error('PDFViewer: Iframe loaded HTML instead of PDF');
                  setLoading(false);
                  setError(true);
                  return;
                }
              }
            } catch (err) {
              // Cross-origin or other error - assume it's fine (PDFs often block access)
            }
            setLoading(false);
          }}
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

