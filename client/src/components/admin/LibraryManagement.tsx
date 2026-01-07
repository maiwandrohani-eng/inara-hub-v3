import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllLibraryCategories, getLibrarySubcategories } from '../../config/categories';

export default function LibraryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    fileUrl: '',
    resourceType: 'book',
    category: '',
    subcategory: '',
    customCategory: '',
    customSubcategory: '',
    tags: [''],
  });
  
  const availableCategories = getAllLibraryCategories();
  const availableSubcategories = formData.category && formData.category !== 'OTHER' ? getLibrarySubcategories(formData.category) : [];
  const isCustomCategory = formData.category === 'OTHER';
  const isCustomSubcategory = formData.subcategory === 'OTHER';
  const queryClient = useQueryClient();

  const { data: resources } = useQuery('admin-library', async () => {
    const res = await api.get('/admin/library');
    return res.data;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/library', {
        ...data,
        tags: data.tags.filter((t: string) => t.trim()),
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-library');
        setShowForm(false);
        alert('Library resource added successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/library/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-library');
        alert('Library resource deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete resource');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      ...formData,
      category: isCustomCategory ? formData.customCategory : formData.category,
      subcategory: isCustomSubcategory ? formData.customSubcategory : formData.subcategory,
    };
    delete submitData.customCategory;
    delete submitData.customSubcategory;
    createMutation.mutate(submitData);
  };

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkFolders, setBulkFolders] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);

  const bulkImportMutation = useMutation(
    async (files: File[]) => {
      const formData = new FormData();
      formData.append('type', 'library');
      files.forEach((file) => {
        formData.append('files', file);
        // Include folder path if available (webkitRelativePath)
        if ((file as any).webkitRelativePath) {
          formData.append('paths', (file as any).webkitRelativePath);
        }
      });
      const res = await api.post('/admin/library/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setBulkResults(data);
        queryClient.invalidateQueries('admin-library');
        setBulkFiles([]);
        setBulkFolders([]);
        alert(`Bulk import completed! ${data.imported} imported, ${data.failed} failed.`);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Bulk import failed';
        const errorDetail = error.response?.data?.detail;
        const fullMessage = errorDetail ? `${errorMessage}\n\n${errorDetail}` : errorMessage;
        alert(fullMessage);
        console.error('Bulk import error:', error.response?.data);
      },
      onSettled: () => {
        setBulkImporting(false);
      },
    }
  );

  const handleBulkImport = () => {
    if (bulkFiles.length === 0) {
      alert('Please select folders to import');
      return;
    }
    setBulkImporting(true);
    bulkImportMutation.mutate(bulkFiles);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Extract unique folder names from webkitRelativePath
    const folders = new Set<string>();
    files.forEach((file: any) => {
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          // Get the folder structure (category/subcategory)
          folders.add(parts.slice(0, -1).join('/'));
        }
      }
    });

    setBulkFiles(files);
    setBulkFolders(Array.from(folders));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Library Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {showBulkImport ? 'Cancel Bulk Import' : '📦 Bulk Import'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {showForm ? 'Cancel' : '+ Upload Resource'}
          </button>
        </div>
      </div>

      {showBulkImport && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Bulk Import Library Resources</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select folders that are already sorted by categories. The folder structure will be used to automatically assign categories and subcategories.
            <br />
            <strong className="text-yellow-400">Example:</strong> Select a folder structure like "HR/Recruitment/" or "Finance/Budget/" and all files within will be categorized accordingly.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Folders (containing PDF, DOC, DOCX, etc.)
              </label>
              <input
                type="file"
                // @ts-ignore - webkitdirectory is a valid HTML attribute
                webkitdirectory=""
                multiple
                onChange={handleFolderSelect}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                accept=".pdf,.doc,.docx,.txt"
              />
              {bulkFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-green-400">
                    ✅ {bulkFiles.length} file(s) selected from {bulkFolders.length} folder(s)
                  </p>
                  {bulkFolders.length > 0 && (
                    <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-300 mb-2">Folder structure detected:</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {bulkFolders.slice(0, 10).map((folder, idx) => (
                          <li key={idx}>📁 {folder}</li>
                        ))}
                        {bulkFolders.length > 10 && (
                          <li className="text-gray-500">... and {bulkFolders.length - 10} more folders</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleBulkImport}
              disabled={bulkImporting || bulkFiles.length === 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {bulkImporting ? 'Importing...' : `Import ${bulkFiles.length} File(s) from ${bulkFolders.length} Folder(s)`}
            </button>
            {bulkResults && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Import Results:</h4>
                <p className="text-green-400">✅ {bulkResults.imported} imported successfully</p>
                {bulkResults.failed > 0 && (
                  <p className="text-red-400">❌ {bulkResults.failed} failed</p>
                )}
                {bulkResults.results && bulkResults.results.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {bulkResults.results.map((r: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-300">
                        {r.fileName} → {r.category || 'Uncategorized'}
                        {r.subcategory && ` / ${r.subcategory}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Upload Library Resource</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Resource Type *</label>
              <select
                value={formData.resourceType}
                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              >
                <option value="book">Book</option>
                <option value="sop">SOP</option>
                <option value="guidance">Guidance Note</option>
                <option value="research">Research Paper</option>
                <option value="case_study">Case Study</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '', customCategory: '', customSubcategory: '' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="OTHER">Other (Custom)</option>
                </select>
                {isCustomCategory && (
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="Enter custom category"
                    className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Subcategory</label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value, customSubcategory: '' })}
                  disabled={!formData.category}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Subcategory</option>
                  {availableSubcategories.map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                  {formData.category && <option value="OTHER">Other (Custom)</option>}
                </select>
                {isCustomSubcategory && (
                  <input
                    type="text"
                    value={formData.customSubcategory}
                    onChange={(e) => setFormData({ ...formData, customSubcategory: e.target.value })}
                    placeholder="Enter custom subcategory"
                    className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">File URL or Content</label>
              <input
                type="text"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="URL to file or content"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Uploading...' : 'Add Resource'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Library Resources</h3>
        <div className="space-y-2">
          {resources?.resources?.map((resource: any) => (
            <div key={resource.id} className="bg-gray-700 p-4 rounded flex justify-between items-center">
              <div>
                <h4 className="text-white font-semibold">{resource.title}</h4>
                <p className="text-gray-400 text-sm">{resource.resourceType} • {resource.category || 'Uncategorized'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${resource.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                  {resource.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${resource.title}"? This action cannot be undone.`)) {
                      deleteMutation.mutate(resource.id);
                    }
                  }}
                  disabled={deleteMutation.isLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

