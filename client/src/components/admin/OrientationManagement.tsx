import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

interface OrientationStep {
  id?: string;
  stepNumber: number;
  title: string;
  description?: string;
  content?: string;
  pdfUrl?: string;
  policyId?: string;
  questions?: any;
  isRequired: boolean;
  order: number;
}

export default function OrientationManagement() {
  const [showForm, setShowForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<OrientationStep | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sections: {},
    isActive: true,
  });

  const [stepFormData, setStepFormData] = useState<OrientationStep>({
    stepNumber: 1,
    title: '',
    description: '',
    content: '',
    pdfUrl: '',
    policyId: '',
    questions: null,
    isRequired: true,
    order: 0,
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [stepPdfFile, setStepPdfFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery('admin-orientations', async () => {
    const res = await api.get('/admin/orientations');
    return res.data;
  });

  const { data: policies } = useQuery('policies', async () => {
    const res = await api.get('/policies');
    return res.data;
  });

  const orientations = data?.orientations || [];
  const availablePolicies = policies?.policies || [];

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/orientations', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        setShowForm(false);
        setFormData({ title: '', content: '', sections: {}, isActive: true });
        alert('Orientation created successfully!');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/orientations/${id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        setShowForm(false);
        setSelectedOrientation(null);
        setFormData({ title: '', content: '', sections: {}, isActive: true });
        alert('Orientation updated successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async ({ id, force }: { id: string; force?: boolean }) => {
      const url = force ? `/admin/orientations/${id}?force=true` : `/admin/orientations/${id}`;
      const res = await api.delete(url);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        alert('Orientation deleted successfully!');
      },
      onError: (error: any) => {
        const errorData = error.response?.data;
        if (errorData?.completions > 0 && errorData?.canDeactivate) {
          const shouldForce = confirm(
            `This orientation has ${errorData.completions} completion(s). Deleting it will remove all completion records. Do you want to continue?`
          );
          if (shouldForce) {
            deleteMutation.mutate({ id: error.response?.config?.url?.split('/').pop() || '', force: true });
          }
        } else {
          alert(errorData?.message || 'Failed to delete orientation');
        }
      },
    }
  );

  const createStepMutation = useMutation(
    async ({ orientationId, stepData, pdfFile }: { orientationId: string; stepData: OrientationStep; pdfFile?: File | null }) => {
      const formData = new FormData();
      formData.append('stepNumber', stepData.stepNumber.toString());
      formData.append('title', stepData.title);
      if (stepData.description) formData.append('description', stepData.description);
      if (stepData.content) formData.append('content', stepData.content);
      if (stepData.policyId) formData.append('policyId', stepData.policyId);
      if (stepData.questions) formData.append('questions', JSON.stringify(stepData.questions));
      formData.append('isRequired', stepData.isRequired.toString());
      formData.append('order', stepData.order.toString());
      if (pdfFile) formData.append('pdf', pdfFile);

      const res = await api.post(`/admin/orientations/${orientationId}/steps`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        setShowStepForm(false);
        setEditingStep(null);
        setStepFormData({
          stepNumber: 1,
          title: '',
          description: '',
          content: '',
          pdfUrl: '',
          policyId: '',
          questions: null,
          isRequired: true,
          order: 0,
        });
        setStepPdfFile(null);
        alert('Step created successfully!');
      },
    }
  );

  const updateStepMutation = useMutation(
    async ({ orientationId, stepId, stepData, pdfFile, removePdf }: { orientationId: string; stepId: string; stepData: OrientationStep; pdfFile?: File | null; removePdf?: boolean }) => {
      const formData = new FormData();
      formData.append('stepNumber', stepData.stepNumber.toString());
      formData.append('title', stepData.title);
      if (stepData.description !== undefined) formData.append('description', stepData.description);
      if (stepData.content !== undefined) formData.append('content', stepData.content);
      if (stepData.policyId !== undefined) formData.append('policyId', stepData.policyId || '');
      if (stepData.questions !== undefined) formData.append('questions', JSON.stringify(stepData.questions));
      formData.append('isRequired', stepData.isRequired.toString());
      formData.append('order', stepData.order.toString());
      if (pdfFile) formData.append('pdf', pdfFile);
      if (removePdf) formData.append('removePdf', 'true');

      const res = await api.put(`/admin/orientations/${orientationId}/steps/${stepId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        setShowStepForm(false);
        setEditingStep(null);
        setStepFormData({
          stepNumber: 1,
          title: '',
          description: '',
          content: '',
          pdfUrl: '',
          policyId: '',
          questions: null,
          isRequired: true,
          order: 0,
        });
        setStepPdfFile(null);
        alert('Step updated successfully!');
      },
    }
  );

  const deleteStepMutation = useMutation(
    async ({ orientationId, stepId }: { orientationId: string; stepId: string }) => {
      const res = await api.delete(`/admin/orientations/${orientationId}/steps/${stepId}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        alert('Step deleted successfully!');
      },
    }
  );

  const uploadResourcesMutation = useMutation(
    async ({ orientationId, files }: { orientationId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const res = await api.post(`/admin/orientations/${orientationId}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        setUploadedFiles([]);
        alert('Resources uploaded successfully!');
      },
    }
  );

  const deleteResourceMutation = useMutation(
    async ({ orientationId, filename, key }: { orientationId: string; filename: string; key?: string }) => {
      const res = await api.delete(`/admin/orientations/${orientationId}/resources`, {
        data: { filename, key },
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orientations');
        alert('Resource deleted successfully!');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrientation) return;

    if (editingStep?.id) {
      updateStepMutation.mutate({
        orientationId: selectedOrientation,
        stepId: editingStep.id,
        stepData: stepFormData,
        pdfFile: stepPdfFile,
      });
    } else {
      createStepMutation.mutate({
        orientationId: selectedOrientation,
        stepData: stepFormData,
        pdfFile: stepPdfFile,
      });
    }
  };

  const handleEditStep = (step: OrientationStep, orientationId: string) => {
    setEditingStep(step);
    setSelectedOrientation(orientationId);
    setStepFormData({
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description || '',
      content: step.content || '',
      pdfUrl: step.pdfUrl || '',
      policyId: step.policyId || '',
      questions: step.questions || null,
      isRequired: step.isRequired,
      order: step.order,
    });
    setShowStepForm(true);
  };

  const selectedOrientationData = orientations.find((o: any) => o.id === selectedOrientation);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Orientation Management</h2>
          <p className="text-gray-400 mt-1">Create and manage staff orientation content</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setSelectedOrientation(null);
              setFormData({ title: '', content: '', sections: {}, isActive: true });
            }
          }}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Orientation'}
        </button>
      </div>

      {/* Create/Edit Orientation Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {selectedOrientation && orientations.find((o: any) => o.id === selectedOrientation) ? 'Edit Orientation' : 'Create New Orientation'}
          </h3>
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
              <label className="block text-sm font-medium text-gray-200 mb-1">Content (Markdown)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Enter orientation content in Markdown format..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-200">Active</label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading ? 'Creating...' : 'Create Orientation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orientations List */}
      <div className="space-y-4">
        {orientations.map((orientation: any) => (
          <div key={orientation.id} className="bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{orientation.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${orientation.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                    {orientation.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-400">v{orientation.version}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {orientation.steps?.length || 0} steps • {orientation._count?.completions || 0} completions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedOrientation(orientation.id);
                    setShowStepForm(false);
                    setEditingStep(null);
                  }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  {selectedOrientation === orientation.id ? 'Hide Steps' : 'Manage Steps'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this orientation?')) {
                      deleteMutation.mutate({ id: orientation.id });
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectedOrientation(orientation.id);
                    setFormData({
                      title: orientation.title,
                      content: orientation.content || '',
                      sections: orientation.sections || {},
                      isActive: orientation.isActive,
                    });
                    setShowStepForm(false);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Steps Management */}
            {selectedOrientation === orientation.id && (
              <div className="mt-6 space-y-4 border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-white">Steps</h4>
                  <button
                    onClick={() => {
                      setEditingStep(null);
                      setStepFormData({
                        stepNumber: (orientation.steps?.length || 0) + 1,
                        title: '',
                        description: '',
                        content: '',
                        pdfUrl: '',
                        policyId: '',
                        questions: null,
                        isRequired: true,
                        order: orientation.steps?.length || 0,
                      });
                      setStepPdfFile(null);
                      setShowStepForm(true);
                    }}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                  >
                    + Add Step
                  </button>
                </div>

                {/* Step Form */}
                {showStepForm && (
                  <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                    <h5 className="text-md font-semibold text-white">
                      {editingStep ? 'Edit Step' : 'Create New Step'}
                    </h5>
                    <form onSubmit={handleStepSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Step Number *</label>
                          <input
                            type="number"
                            value={stepFormData.stepNumber}
                            onChange={(e) => setStepFormData({ ...stepFormData, stepNumber: parseInt(e.target.value) })}
                            required
                            min="1"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Order *</label>
                          <input
                            type="number"
                            value={stepFormData.order}
                            onChange={(e) => setStepFormData({ ...stepFormData, order: parseInt(e.target.value) })}
                            required
                            min="0"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
                        <input
                          type="text"
                          value={stepFormData.title}
                          onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
                          required
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
                        <textarea
                          value={stepFormData.description}
                          onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Content (Markdown)</label>
                        <textarea
                          value={stepFormData.content}
                          onChange={(e) => setStepFormData({ ...stepFormData, content: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                          placeholder="Step content in Markdown format..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Link to Policy</label>
                          <select
                            value={stepFormData.policyId}
                            onChange={(e) => setStepFormData({ ...stepFormData, policyId: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                          >
                            <option value="">None</option>
                            {availablePolicies.map((policy: any) => (
                              <option key={policy.id} value={policy.id}>
                                {policy.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">PDF Document</label>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setStepPdfFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                          />
                          {stepFormData.pdfUrl && !stepPdfFile && (
                            <p className="text-xs text-gray-400 mt-1">Current: {stepFormData.pdfUrl}</p>
                          )}
                          {stepFormData.pdfUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStepFormData({ ...stepFormData, pdfUrl: '' });
                                if (editingStep) {
                                  updateStepMutation.mutate({
                                    orientationId: selectedOrientation!,
                                    stepId: editingStep.id!,
                                    stepData: { ...stepFormData, pdfUrl: '' },
                                    removePdf: true,
                                  });
                                }
                              }}
                              className="mt-2 text-xs text-red-400 hover:text-red-300"
                            >
                              Remove PDF
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Questions/Assessment (JSON)</label>
                        <textarea
                          value={stepFormData.questions ? JSON.stringify(stepFormData.questions, null, 2) : ''}
                          onChange={(e) => {
                            try {
                              const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                              setStepFormData({ ...stepFormData, questions: parsed });
                            } catch {
                              // Invalid JSON, keep as string for now
                            }
                          }}
                          rows={6}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg font-mono text-xs"
                          placeholder='[{"id": "q1", "question": "What is...?", "type": "multiple_choice", "options": ["Option 1", "Option 2"], "correctAnswer": "Option 1", "required": true}]'
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Format: Array of question objects with id, question, type (multiple_choice/text/checkbox), options (for multiple_choice), correctAnswer, required
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isRequired"
                          checked={stepFormData.isRequired}
                          onChange={(e) => setStepFormData({ ...stepFormData, isRequired: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="isRequired" className="text-sm text-gray-200">Required Step</label>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStepForm(false);
                            setEditingStep(null);
                          }}
                          className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-600 text-gray-200 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createStepMutation.isLoading || updateStepMutation.isLoading}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
                        >
                          {editingStep ? (updateStepMutation.isLoading ? 'Updating...' : 'Update Step') : (createStepMutation.isLoading ? 'Creating...' : 'Create Step')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Steps List */}
                {orientation.steps && orientation.steps.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {orientation.steps.map((step: any) => (
                      <div key={step.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary-400">Step {step.stepNumber}</span>
                            <h5 className="text-md font-medium text-white">{step.title}</h5>
                            {step.isRequired && (
                              <span className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded">Required</span>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                          )}
                          {step.pdfUrl && (
                            <p className="text-xs text-gray-500 mt-1">📄 PDF: {step.pdfUrl.split('/').pop()}</p>
                          )}
                          {step.policyId && (
                            <p className="text-xs text-gray-500 mt-1">📋 Linked to Policy</p>
                          )}
                          {step.questions && Array.isArray(step.questions) && step.questions.length > 0 && (
                            <p className="text-xs text-green-400 mt-1">✅ {step.questions.length} question(s) configured</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditStep(step, orientation.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this step?')) {
                                deleteStepMutation.mutate({ orientationId: orientation.id, stepId: step.id });
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resources Management */}
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Orientation Resources</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Upload Documents (PDFs, etc.)</label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                      />
                      {uploadedFiles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-400">Selected: {uploadedFiles.length} file(s)</p>
                          <button
                            onClick={() => {
                              if (uploadedFiles.length > 0) {
                                uploadResourcesMutation.mutate({ orientationId: orientation.id, files: uploadedFiles });
                              }
                            }}
                            disabled={uploadResourcesMutation.isLoading}
                            className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
                          >
                            {uploadResourcesMutation.isLoading ? 'Uploading...' : 'Upload Files'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Existing Resources */}
                    {orientation.pdfFiles && Array.isArray(orientation.pdfFiles) && orientation.pdfFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-300">Uploaded Resources:</p>
                        {orientation.pdfFiles.map((file: any, index: number) => (
                          <div key={index} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-sm text-white">{file.filename}</p>
                              <p className="text-xs text-gray-400">
                                {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''} • {file.type || 'PDF'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this resource?')) {
                                  deleteResourceMutation.mutate({ 
                                    orientationId: orientation.id, 
                                    filename: file.filename,
                                    key: file.key 
                                  });
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center text-gray-400 py-8">Loading orientations...</div>
      )}

      {!isLoading && orientations.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No orientations found. Create your first orientation to get started.
        </div>
      )}
    </div>
  );
}

