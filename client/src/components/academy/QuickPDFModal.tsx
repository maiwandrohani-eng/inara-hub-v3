// Quick PDF Viewer Modal for Course Resources
import { useState } from 'react';
import PDFViewer from '../PDFViewer';

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
  const [isMinimized, setIsMinimized] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      {/* Backdrop */}
      {!isMinimized && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl transition-all ${
          isMinimized
            ? 'bottom-4 right-4 w-80 h-auto'
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-5/6 max-w-6xl'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white truncate">{resource.title}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {resource.fileType.toUpperCase()} • {formatFileSize(resource.fileSize)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? '⬆️' : '➖'}
            </button>
            <a
              href={resource.fileUrl}
              download={resource.fileName}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700"
              title="Download"
            >
              ⬇️
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="overflow-auto h-[calc(100%-60px)]">
            {resource.fileType.toLowerCase() === 'pdf' ? (
              <PDFViewer pdfUrl={resource.fileUrl} title={resource.title} />
            ) : (
              <div className="p-6 text-center text-gray-400">
                <p className="mb-4">File type preview not available</p>
                <a
                  href={resource.fileUrl}
                  download={resource.fileName}
                  className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Download {resource.fileType.toUpperCase()}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
