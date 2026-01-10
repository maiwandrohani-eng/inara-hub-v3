/**
 * PDFViewer Component - Unified PDF viewing solution
 * 
 * DESIGN PRINCIPLE: Never attempt inline PDF rendering
 * - No iframes, object, or embed tags
 * - Always use window.open() for viewing
 * - Always use direct download links
 * - Works with R2 URLs and local URLs
 */

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  // Validate URL
  if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
    return (
      <div className="w-full border border-gray-700 rounded-lg bg-gray-900 p-6 text-center text-gray-400">
        <p className="text-sm">No PDF available</p>
      </div>
    );
  }

  // Ensure we have a usable URL
  let finalUrl = pdfUrl.trim();
  
  // If it's a relative path, make it absolute
  if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
    finalUrl = `/uploads/${finalUrl}`;
  }

  const handleOpenPDF = () => {
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
      
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        {/* Header with action buttons */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-2xl">📄</span>
              <span className="text-sm font-medium">PDF Document</span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenPDF}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                title="Open PDF in new window"
              >
                Open PDF
              </button>
              
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                title="Open in new browser tab"
              >
                New Tab
              </a>
              
              <a
                href={finalUrl}
                download
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                title="Download PDF file"
              >
                Download
              </a>
            </div>
          </div>
        </div>
        
        {/* Info section */}
        <div className="p-6 text-center text-gray-400 text-sm">
          <p>📖 Click "Open PDF" to view the document in your default PDF viewer, or "Download" to save it.</p>
        </div>
      </div>
    </div>
  );
}

