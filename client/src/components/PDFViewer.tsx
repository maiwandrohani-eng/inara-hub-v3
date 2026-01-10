interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  // Ensure we have a valid URL
  if (!pdfUrl || typeof pdfUrl !== 'string') {
    return (
      <div className="w-full">
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 p-6 text-center text-gray-400">
          No PDF URL provided
        </div>
      </div>
    );
  }

  // Build the full URL
  let fullUrl = pdfUrl;
  
  if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
    fullUrl = `/uploads/${pdfUrl}`;
  }

  const handleOpenPDF = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full space-y-3">
      {title && (
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      )}
      
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-xl">📄</span>
              <span className="text-sm font-medium">PDF Document</span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenPDF}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Open PDF
              </button>
              
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Open in Tab
              </a>
              
              <a
                href={fullUrl}
                download
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
        
        <div className="p-8 text-center text-gray-400">
          <p className="text-sm">
            Click "Open PDF" to view the document in a new window, or use "Download" to save it to your device.
          </p>
        </div>
      </div>
    </div>
  );
}

