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
  // - Full URLs (http://...): Use directly or proxy depending on origin
  // - URLs starting with /uploads or /academy/resources: Use directly
  // - Relative paths: prepend /api/uploads and use directly
  const getFullPdfUrl = () => {
    if (pdfUrl.startsWith('http')) {
      // Full URL - use directly
      // The browser will handle CORS and the server should allow PDF access
      return pdfUrl;
    }
    
    // If URL starts with /uploads or /academy/resources, it's already a valid path
    if (pdfUrl.startsWith('/uploads') || pdfUrl.startsWith('/academy/resources')) {
      return pdfUrl;
    }
    
    // Otherwise, prepend /uploads
    return `/uploads/${pdfUrl}`;
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

