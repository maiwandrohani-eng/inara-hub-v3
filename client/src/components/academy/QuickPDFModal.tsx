// Quick Document Viewer Modal for Course Resources
import { useRef } from 'react';

interface QuickPDFModalProps {
  resource: {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    fileType: string;
  };
  onClose: () => void;
}

export default function QuickPDFModal({ resource, onClose }: QuickPDFModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePrint = () => {
    if (resource.fileType.toLowerCase() === 'pdf') {
      // For PDFs, open in new window to print
      const printWindow = window.open(resource.fileUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        });
      }
    } else {
      // For other files, open in new tab
      window.open(resource.fileUrl, '_blank');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-11/12 h-5/6 max-w-6xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{resource.title}</h3>
            {resource.description && (
              <p className="text-xs text-gray-400 mt-1">{resource.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {resource.fileType.toUpperCase()} • {formatFileSize(resource.fileSize)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 text-sm font-medium"
              title="Print or open in new window"
            >
              🖨️ Print
            </button>
            <a
              href={resource.fileUrl}
              download={resource.fileName}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Download file"
            >
              ⬇️
            </a>
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Open in new tab"
            >
              ⧉
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-800">
          {resource.fileType.toLowerCase() === 'pdf' ? (
            <div className="w-full h-full">
              <iframe
                src={`${resource.fileUrl}#toolbar=1`}
                className="w-full h-full border-none"
                title={resource.title}
              />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <div className="mb-4">
                <p className="text-lg mb-2">📄 Document Preview</p>
                <p className="text-sm">{resource.fileType.toUpperCase()} file</p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                >
                  📂 Open in Browser
                </a>
                <a
                  href={resource.fileUrl}
                  download={resource.fileName}
                  className="inline-block px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-3 text-xs text-gray-400 flex-shrink-0">
          💡 Tip: Click "Print" to open the document in a new window where you can print or save as PDF.
        </div>
      </div>
    </>
  );
}
