import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllPolicyCategories, getPolicySubcategories } from '../../config/categories';

export default function PolicyManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    complete: '',
    assessment: { questions: [], passingScore: 70 },
    isMandatory: false,
    category: '',
    subcategory: '',
    customCategory: '',
    customSubcategory: '',
    tags: [''],
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  
  const availableCategories = getAllPolicyCategories();
  const availableSubcategories = formData.category && formData.category !== 'OTHER' ? getPolicySubcategories(formData.category) : [];
  const isCustomCategory = formData.category === 'OTHER';
  const isCustomSubcategory = formData.subcategory === 'OTHER';
  const queryClient = useQueryClient();

  const { data: policies } = useQuery('admin-policies', async () => {
    const res = await api.get('/admin/policies');
    return res.data;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/policies', {
        ...data,
        effectiveDate: new Date(data.effectiveDate),
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-policies');
        setShowForm(false);
        alert('Policy created! It will automatically appear in Brief, Complete, and Assessment views.');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/policies/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-policies');
        alert('Policy deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete policy');
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
      formData.append('type', 'policy');
      files.forEach((file) => {
        formData.append('files', file);
        // Include folder path if available (webkitRelativePath)
        if ((file as any).webkitRelativePath) {
          formData.append('paths', (file as any).webkitRelativePath);
        }
      });
      const res = await api.post('/admin/policies/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setBulkResults(data);
        queryClient.invalidateQueries('admin-policies');
        setBulkFiles([]);
        setBulkFolders([]);
        alert(`Bulk import completed! ${data.imported} imported, ${data.failed} failed.`);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Bulk import failed');
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
        <h2 className="text-2xl font-bold text-white">Policy Management</h2>
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
            {showForm ? 'Cancel' : '+ Upload Policy'}
          </button>
        </div>
      </div>

      {showBulkImport && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Bulk Import Policies</h3>
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
          <h3 className="text-xl font-bold text-white mb-4">Upload Policy</h3>
          <p className="text-sm text-gray-400 mb-4">
            The policy will automatically be structured into Brief, Complete, and Assessment sections.
          </p>
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
              <label className="block text-sm font-medium text-gray-200 mb-1">Brief Summary *</label>
              <textarea
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                required
                rows={3}
                placeholder="Brief summary that appears in the Brief view"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Complete Policy Content *</label>
              <textarea
                value={formData.complete}
                onChange={(e) => setFormData({ ...formData, complete: e.target.value })}
                required
                rows={10}
                placeholder="Full policy content (Markdown/HTML) that appears in the Complete view"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-200">Assessment Questions</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentQuestions = Array.isArray(formData.assessment.questions) ? formData.assessment.questions : [];
                    const newQuestion = {
                      id: `q-${Date.now()}`,
                      question: '',
                      type: 'multiple_choice',
                      options: ['Option 1', 'Option 2'],
                      correctAnswer: 'Option 1',
                      required: true,
                    };
                    setFormData({
                      ...formData,
                      assessment: {
                        ...formData.assessment,
                        questions: [...currentQuestions, newQuestion],
                      },
                    });
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  + Add Question
                </button>
              </div>

              {Array.isArray(formData.assessment.questions) && formData.assessment.questions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-700 rounded-lg">
                  {formData.assessment.questions.map((q: any, idx: number) => (
                    <div key={q.id || idx} className="bg-gray-600 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="text-white font-semibold">Question {idx + 1}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.assessment.questions.filter((_: any, i: number) => i !== idx);
                            setFormData({
                              ...formData,
                              assessment: {
                                ...formData.assessment,
                                questions: updated,
                              },
                            });
                          }}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Question Text *</label>
                        <input
                          type="text"
                          value={q.question || ''}
                          onChange={(e) => {
                            const updated = [...formData.assessment.questions];
                            updated[idx] = { ...updated[idx], question: e.target.value };
                            setFormData({
                              ...formData,
                              assessment: {
                                ...formData.assessment,
                                questions: updated,
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                          placeholder="Enter your question..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Question Type *</label>
                        <select
                          value={q.type || 'multiple_choice'}
                          onChange={(e) => {
                            const updated = [...formData.assessment.questions];
                            updated[idx] = {
                              ...updated[idx],
                              type: e.target.value,
                              options: e.target.value === 'multiple_choice' || e.target.value === 'checkbox' 
                                ? (updated[idx].options || ['Option 1', 'Option 2'])
                                : undefined,
                            };
                            setFormData({
                              ...formData,
                              assessment: {
                                ...formData.assessment,
                                questions: updated,
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="text">Text Answer</option>
                          <option value="checkbox">Checkbox (Multiple Answers)</option>
                        </select>
                      </div>

                      {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Options *</label>
                          {(q.options || []).map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...formData.assessment.questions];
                                  const newOptions = [...(updated[idx].options || [])];
                                  newOptions[optIdx] = e.target.value;
                                  updated[idx] = { ...updated[idx], options: newOptions };
                                  setFormData({
                                    ...formData,
                                    assessment: {
                                      ...formData.assessment,
                                      questions: updated,
                                    },
                                  });
                                }}
                                className="flex-1 px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.assessment.questions];
                                  const newOptions = (updated[idx].options || []).filter((_: any, i: number) => i !== optIdx);
                                  updated[idx] = { ...updated[idx], options: newOptions };
                                  setFormData({
                                    ...formData,
                                    assessment: {
                                      ...formData.assessment,
                                      questions: updated,
                                    },
                                  });
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.assessment.questions];
                              const newOptions = [...(updated[idx].options || []), `Option ${(updated[idx].options || []).length + 1}`];
                              updated[idx] = { ...updated[idx], options: newOptions };
                              setFormData({
                                ...formData,
                                assessment: {
                                  ...formData.assessment,
                                  questions: updated,
                                },
                              });
                            }}
                            className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          {q.type === 'text' ? 'Expected Answer' : 'Correct Answer *'}
                        </label>
                        {q.type === 'text' ? (
                          <input
                            type="text"
                            value={q.correctAnswer || ''}
                            onChange={(e) => {
                              const updated = [...formData.assessment.questions];
                              updated[idx] = { ...updated[idx], correctAnswer: e.target.value };
                              setFormData({
                                ...formData,
                                assessment: {
                                  ...formData.assessment,
                                  questions: updated,
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                            placeholder="Expected answer or key concepts..."
                          />
                        ) : (
                          <select
                            value={q.correctAnswer || ''}
                            onChange={(e) => {
                              const updated = [...formData.assessment.questions];
                              updated[idx] = { ...updated[idx], correctAnswer: e.target.value };
                              setFormData({
                                ...formData,
                                assessment: {
                                  ...formData.assessment,
                                  questions: updated,
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                          >
                            <option value="">Select correct answer</option>
                            {(q.options || []).map((opt: string, optIdx: number) => (
                              <option key={optIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={q.required !== false}
                          onChange={(e) => {
                            const updated = [...formData.assessment.questions];
                            updated[idx] = { ...updated[idx], required: e.target.checked };
                            setFormData({
                              ...formData,
                              assessment: {
                                ...formData.assessment,
                                questions: updated,
                              },
                            });
                          }}
                          className="mr-2"
                        />
                        <label className="text-xs text-gray-300">Required Question</label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center text-gray-400 text-sm">
                  No questions added yet. Click "Add Question" to create one.
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs text-gray-300 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.assessment.passingScore || 70}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      assessment: {
                        ...formData.assessment,
                        passingScore: parseInt(e.target.value) || 70,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isMandatory}
                onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                className="text-primary-500"
              />
              <label className="text-sm text-gray-200">Mandatory Policy</label>
            </div>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Policy'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Policies</h3>
        <div className="space-y-2">
          {policies?.policies?.map((policy: any) => (
            <div key={policy.id} className="bg-gray-700 p-4 rounded flex justify-between items-center">
              <div>
                <h4 className="text-white font-semibold">{policy.title}</h4>
                <p className="text-gray-400 text-sm">v{policy.version} • {policy.category || 'Uncategorized'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${policy.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-600 text-gray-400'}`}>
                  {policy.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${policy.title}"? This action cannot be undone.`)) {
                      deleteMutation.mutate(policy.id);
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

