import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function TemplateManagement() {
  const [showForm, setShowForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    category: '',
    subcategory: '',
    tags: [''],
  });
  const queryClient = useQueryClient();

  const { data: templates } = useQuery('admin-templates', async () => {
    const res = await api.get('/admin/templates');
    return res.data;
  });

  const createMutation = useMutation(
    async (data: { formData: any; file?: File | null }) => {
      if (data.file) {
        // Upload file first, then create template
        const formDataObj = new FormData();
        formDataObj.append('file', data.file);
        formDataObj.append('title', data.formData.title || data.file.name.replace(/\.[^/.]+$/, ''));
        formDataObj.append('description', data.formData.description || '');
        formDataObj.append('category', data.formData.category || '');
        formDataObj.append('subcategory', data.formData.subcategory || '');
        formDataObj.append('tags', JSON.stringify(data.formData.tags.filter((t: string) => t.trim())));
        
        const res = await api.post('/admin/templates', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      } else {
        // Create template without file (using URL)
        const res = await api.post('/admin/templates', {
          ...data.formData,
          tags: data.formData.tags.filter((t: string) => t.trim()),
        });
        return res.data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-templates');
        setShowForm(false);
        setSelectedFile(null);
        setFormData({
          title: '',
          description: '',
          fileUrl: '',
          category: '',
          subcategory: '',
          tags: [''],
        });
        alert('Template added successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to upload template');
      },
    }
  );

  const multipleUploadMutation = useMutation(
    async (files: File[]) => {
      const formDataObj = new FormData();
      files.forEach((file) => {
        formDataObj.append('files', file);
      });
      const res = await api.post('/admin/templates/upload-multiple', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('admin-templates');
        setSelectedFiles([]);
        alert(`Successfully uploaded ${data.uploaded || data.templates?.length || 0} template(s)!`);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to upload templates');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/templates/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-templates');
        alert('Template deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete template');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMode === 'multiple' && selectedFiles.length > 0) {
      // Handle multiple file upload
      multipleUploadMutation.mutate(selectedFiles);
      return;
    }
    
    // Handle single file upload or URL
    createMutation.mutate({ formData, file: selectedFile });
  };

  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0 && !formData.title) {
      setFormData({ ...formData, title: files[0].name.replace(/\.[^/.]+$/, '') });
    }
  };

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkFolders, setBulkFolders] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);

  const bulkImportMutation = useMutation(
    async (files: File[]) => {
      const formData = new FormData();
      formData.append('type', 'template');
      files.forEach((file) => {
        formData.append('files', file);
        // Include folder path if available (webkitRelativePath)
        if ((file as any).webkitRelativePath) {
          formData.append('paths', (file as any).webkitRelativePath);
        }
      });
      const res = await api.post('/admin/templates/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setBulkResults(data);
        queryClient.invalidateQueries('admin-templates');
        setBulkFiles([]);
        setBulkFolders([]);
        alert(`Bulk import completed! ${data.imported} imported, ${data.failed} failed.`);
      },
      onError: (error: any) => {
        console.error('❌ Bulk import error:', error);
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response?.data);
        
        // Check if Vercel blocked the request (plain "Forbidden" text, not JSON)
        const responseText = error.response?.data;
        const isVercelBlock = typeof responseText === 'string' && responseText.includes('Forbidden') && !error.response?.data?.message;
        
        if (isVercelBlock) {
          console.error('🚫 Vercel blocked the request before it reached our app!');
          console.error('This usually means:');
          console.error('1. Request body exceeds 4.5MB (Vercel Hobby plan limit)');
          console.error('2. Or there is a routing/configuration issue');
          
          alert(`❌ Request blocked by Vercel platform.\n\nPossible causes:\n1. Total file size exceeds 4.5MB limit\n2. Too many files in one request\n\n💡 Solution: Try uploading fewer files at once, or use single/multiple file upload instead of bulk import.`);
          return;
        }
        
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || 'Bulk import failed';
        const errorDetail = errorData.detail;
        const userRole = errorData.userRole;
        const userRoleType = errorData.userRoleType;
        const requiredRoles = errorData.requiredRoles;
        const userId = errorData.userId;
        const userEmail = errorData.userEmail;
        
        // Log detailed information
        console.error('=== 403 Error Details ===');
        console.error('Server sees role:', userRole);
        console.error('Role type:', userRoleType);
        console.error('Required roles:', requiredRoles);
        console.error('User ID:', userId);
        console.error('User email:', userEmail);
        
        // Get client-side role for comparison
        const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
        const clientRole = authData?.state?.user?.role;
        console.error('Client-side role:', clientRole);
        console.error('Role mismatch:', clientRole !== userRole);
        
        let fullMessage = errorMessage;
        if (errorDetail) {
          fullMessage += `\n\n${errorDetail}`;
        }
        if (userRole && requiredRoles) {
          fullMessage += `\n\nServer sees your role as: ${userRole} (${userRoleType})\nRequired: ${requiredRoles.join(' or ')}`;
          if (clientRole && clientRole !== userRole) {
            fullMessage += `\n\n⚠️ Mismatch: Client shows "${clientRole}" but server sees "${userRole}"`;
            fullMessage += `\n\n💡 Solution: Log out and log back in to refresh your token.`;
          } else if (error.response?.status === 403) {
            fullMessage += `\n\n💡 Your JWT token may be stale. Please log out and log back in to refresh your token with your current role.`;
          }
        } else if (error.response?.status === 403) {
          fullMessage += `\n\n💡 This action requires ADMIN role. If you recently had your role updated, please log out and log back in to refresh your token.`;
        }
        
        alert(fullMessage);
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
    
    // Check total file size (Vercel Hobby plan limit is 4.5MB)
    const totalSize = bulkFiles.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB in bytes
    
    if (totalSize > maxSize) {
      alert(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds Vercel's 4.5MB limit. Please select fewer files or smaller files.`);
      return;
    }
    
    console.log(`📦 Uploading ${bulkFiles.length} files, total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
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
        <h2 className="text-2xl font-bold text-white">Template Management</h2>
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
            {showForm ? 'Cancel' : '+ Upload Template'}
          </button>
        </div>
      </div>

      {showBulkImport && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Bulk Import Templates</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select folders that are already sorted by categories. The folder structure will be used to automatically assign categories and subcategories.
            <br />
            <strong className="text-yellow-400">Example:</strong> Select a folder structure like "HR/Recruitment/" or "Finance/Budget/" and all files within will be categorized accordingly.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Folders (containing PDF, DOC, DOCX, XLSX, etc.)
              </label>
              <input
                type="file"
                // @ts-ignore - webkitdirectory is a valid HTML attribute
                webkitdirectory=""
                multiple
                onChange={handleFolderSelect}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
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
          {/* Version marker: d6ed84a-v2 - Upload mode selector added */}
          <h3 className="text-xl font-bold text-white mb-4">Upload Template</h3>
          
          {/* Upload Mode Selection */}
          <div className="mb-6 p-5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg border-4 border-yellow-400 shadow-lg">
            <label className="block text-base font-bold text-white mb-4">
              📤 UPLOAD MODE <span className="text-xs font-normal text-yellow-200">(Choose how to upload)</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all border-2 border-transparent hover:border-yellow-300">
                <input
                  type="radio"
                  name="uploadMode"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={(e) => setUploadMode(e.target.value as 'single')}
                  className="w-5 h-5 text-primary-500"
                />
                <span className="text-white text-base font-semibold">📄 Single File</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all border-2 border-transparent hover:border-yellow-300">
                <input
                  type="radio"
                  name="uploadMode"
                  value="multiple"
                  checked={uploadMode === 'multiple'}
                  onChange={(e) => setUploadMode(e.target.value as 'multiple')}
                  className="w-5 h-5 text-primary-500"
                />
                <span className="text-white text-base font-semibold">📚 Multiple Files</span>
              </label>
            </div>
          </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Subcategory</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
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
            {/* File Upload Section */}
            {uploadMode === 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Upload File</label>
                <input
                  key="single-file-input"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !formData.title) {
                      setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, '') });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-400 mt-1">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Or enter a file URL below</p>
              </div>
            )}

            {uploadMode === 'multiple' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Upload Multiple Files</label>
                <input
                  key="multiple-file-input"
                  type="file"
                  multiple
                  onChange={handleMultipleFileSelect}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-gray-500 mt-1">💡 You can select multiple individual files (not folders)</p>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-green-400 mb-2">✅ {selectedFiles.length} file(s) selected</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, idx) => (
                        <p key={idx} className="text-xs text-gray-300">
                          • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">File URL {uploadMode === 'single' ? '(Optional - if not uploading file)' : '(Not used for multiple upload)'}</label>
              <input
                type="text"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                required={uploadMode === 'single' && !selectedFile}
                disabled={uploadMode === 'multiple'}
                placeholder="URL to template file"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading || multipleUploadMutation.isLoading || (uploadMode === 'single' && !selectedFile && !formData.fileUrl) || (uploadMode === 'multiple' && selectedFiles.length === 0)}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createMutation.isLoading || multipleUploadMutation.isLoading 
                ? 'Uploading...' 
                : uploadMode === 'multiple' 
                  ? `Upload ${selectedFiles.length} Template(s)`
                  : 'Add Template'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Templates</h3>
        <div className="space-y-2">
          {templates?.templates?.map((template: any) => (
            <div key={template.id} className="bg-gray-700 p-4 rounded flex justify-between items-center">
              <div>
                <h4 className="text-white font-semibold">{template.title}</h4>
                <p className="text-gray-400 text-sm">v{template.version} • {template.category || 'Uncategorized'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${template.approvalStatus === 'approved' ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                  {template.approvalStatus}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${template.title}"? This action cannot be undone.`)) {
                      deleteMutation.mutate(template.id);
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

