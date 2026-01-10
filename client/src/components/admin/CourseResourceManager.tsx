// Component for managing course resources (PDFs, books, modules)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

interface CourseResourceManagerProps {
  training: any;
  onDelete?: (id: string) => void;
}

export default function CourseResourceManager({ training, onDelete }: CourseResourceManagerProps) {
  const [showResources, setShowResources] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resourceTitles, setResourceTitles] = useState<string[]>([]);
  const [resourceDescriptions, setResourceDescriptions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: resourcesData } = useQuery(
    ['course-resources', training.id],
    async () => {
      const res = await api.get(`/academy/courses/${training.id}/resources`);
      return res.data;
    },
    { enabled: showResources }
  );

  const uploadResourcesMutation = useMutation(
    async (formData: FormData) => {
      const res = await api.post(`/admin/academy/courses/${training.id}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-resources', training.id]);
        setSelectedFiles([]);
        setResourceTitles([]);
        setResourceDescriptions([]);
        setShowUploadForm(false);
        alert('Resources uploaded successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to upload resources');
      },
    }
  );

  const deleteResourceMutation = useMutation(
    async (resourceId: string) => {
      const res = await api.delete(`/admin/academy/courses/${training.id}/resources/${resourceId}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course-resources', training.id]);
        alert('Resource deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete resource');
      },
    }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResourceTitles(files.map(f => f.name.replace(/\.[^/.]+$/, '')));
    setResourceDescriptions(files.map(() => ''));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('titles', JSON.stringify(resourceTitles));
    formData.append('descriptions', JSON.stringify(resourceDescriptions));

    uploadResourcesMutation.mutate(formData);
  };

  const resources = resourcesData?.resources || [];

  return (
    <div className="bg-gray-700 p-4 rounded">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1">
          <h4 className="text-white font-semibold">{training.title}</h4>
          <p className="text-gray-400 text-sm">
            {training.category || 'Uncategorized'} • {resources.length} resource(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResources(!showResources)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {showResources ? 'Hide' : 'Manage'} Resources
          </button>
          <span className={`text-xs px-2 py-1 rounded ${training.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
            {training.isActive ? 'Active' : 'Inactive'}
          </span>
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the course "${training.title}"? This action cannot be undone.`)) {
                  onDelete(training.id);
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {showResources && (
        <div className="mt-4 space-y-4 border-t border-gray-600 pt-4">
          <div className="flex justify-between items-center">
            <h5 className="text-white font-medium">Course Resources</h5>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600"
            >
              {showUploadForm ? 'Cancel' : '+ Upload Resources'}
            </button>
          </div>

          {showUploadForm && (
            <form onSubmit={handleUpload} className="bg-gray-800 p-4 rounded space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Select PDFs/Books/Modules (Multiple files allowed)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="bg-gray-700 p-2 rounded">
                        <input
                          type="text"
                          value={resourceTitles[idx] || ''}
                          onChange={(e) => {
                            const newTitles = [...resourceTitles];
                            newTitles[idx] = e.target.value;
                            setResourceTitles(newTitles);
                          }}
                          placeholder="Resource title"
                          className="w-full mb-2 px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded text-sm"
                        />
                        <textarea
                          value={resourceDescriptions[idx] || ''}
                          onChange={(e) => {
                            const newDescs = [...resourceDescriptions];
                            newDescs[idx] = e.target.value;
                            setResourceDescriptions(newDescs);
                          }}
                          placeholder="Optional description"
                          rows={2}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={uploadResourcesMutation.isLoading || selectedFiles.length === 0}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {uploadResourcesMutation.isLoading ? 'Uploading...' : `Upload ${selectedFiles.length} Resource(s)`}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {resources.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No resources uploaded yet</p>
            ) : (
              resources.map((resource: any) => (
                <div key={resource.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                  <div className="flex-1">
                    <h6 className="text-white font-medium text-sm">{resource.title}</h6>
                    {resource.description && (
                      <p className="text-gray-400 text-xs mt-1">{resource.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {resource.fileType.toUpperCase()} • {resource.fileSize ? `${(resource.fileSize / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${resource.title}"?`)) {
                        deleteResourceMutation.mutate(resource.id);
                      }
                    }}
                    disabled={deleteResourceMutation.isLoading}
                    className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

