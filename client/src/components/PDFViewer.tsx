import { useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Convert relative URL to absolute if needed
  const getFullPdfUrl = () => {
    if (!pdfUrl) return '';
    
    if (pdfUrl.startsWith('http')) {
      return pdfUrl;
    }
    
    if (pdfUrl.startsWith('/uploads') || pdfUrl.startsWith('/academy/resources')) {
      return pdfUrl;
    }
    
    return `/uploads/${pdfUrl}`;
  };

  const fullPdfUrl = getFullPdfUrl();
  
  console.log('PDFViewer - Original URL:', pdfUrl);
  console.log('PDFViewer - Full URL:', fullPdfUrl);

  const handleOpenPDF = () => {
    if (fullPdfUrl) {
      window.open(fullPdfUrl, '_blank');
    }
  };

  if (!fullPdfUrl) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        )}
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
          <div className="flex items-center justify-center h-96 bg-gray-800">
            <div className="text-center text-gray-400">
              <p>No PDF URL provided</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      )}
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        <div className="flex flex-col h-96 md:h-[600px]">
          {/* Header with Actions */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
            <p className="text-sm text-gray-400">📄 PDF Document</p>
            <div className="flex gap-2">
              <button
                onClick={handleOpenPDF}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium flex items-center gap-2"
              >
                🔍 Open PDF
              </button>
              <a
                href={fullPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium flex items-center gap-2"
              >
                ⧉ New Tab
              </a>
              <a
                href={fullPdfUrl}
                download
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium flex items-center gap-2"
              >
                ⬇️ Download
              </a>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-300">
              <svg className="w-16 h-16 mx-auto mb-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mb-3 text-lg font-medium">PDF Document Preview</p>
              <p className="text-sm text-gray-400 mb-6">
                To view the PDF, click "Open PDF" to open in a new window or "Download" to save the file.
              </p>
              <button
                onClick={handleOpenPDF}
                className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
              >
                🔍 Open PDF Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Note */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Some PDF viewers don't work in embedded iframes. We recommend opening the PDF in a new window for the best experience.
      </p>
    </div>
  );
}

