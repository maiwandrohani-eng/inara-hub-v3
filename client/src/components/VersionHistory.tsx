import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api/client';

interface VersionHistoryProps {
  resourceType: 'library' | 'template' | 'training' | 'policy';
  resourceId: string;
}

export default function VersionHistory({ resourceType, resourceId }: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery(
    ['versions', resourceType, resourceId],
    async () => {
      try {
        // This would need to be implemented in the backend
        const res = await api.get(`/versions/${resourceType}/${resourceId}`);
        return res.data;
      } catch {
        return { versions: [] };
      }
    },
    { enabled: isOpen }
  );

  const versions = data?.versions || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-400 hover:text-white"
        title="View version history"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-bold">Version History</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No version history available</div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version: any, idx: number) => (
                    <div
                      key={version.id || idx}
                      className="bg-gray-700 rounded-lg p-4 border-l-4 border-primary-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-white">
                              Version {version.version}
                            </span>
                            {idx === 0 && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(version.createdAt || version.archivedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {version.changeLog && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-300 mb-1">Changes:</p>
                          <p className="text-sm text-gray-400">{version.changeLog}</p>
                        </div>
                      )}
                      {version.createdBy && (
                        <p className="text-xs text-gray-500 mt-2">
                          Created by: {version.createdBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

