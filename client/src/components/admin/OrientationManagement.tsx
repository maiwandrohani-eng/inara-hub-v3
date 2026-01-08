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

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionMode, setQuestionMode] = useState<'auto' | 'manual' | 'bulk' | 'markdown'>('manual');
  const [bulkQuestionsText, setBulkQuestionsText] = useState('');

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
      if (pdfFile) {
        formData.append('pdf', pdfFile);
        formData.append('questionMode', questionMode);
      }
      // Also send questionMode for markdown generation
      if (questionMode === 'markdown' || questionMode === 'bulk') {
        formData.append('questionMode', questionMode);
      }

      console.log('📤 Creating step:', {
        orientationId,
        title: stepData.title,
        stepNumber: stepData.stepNumber,
        hasPdf: !!pdfFile,
        hasQuestions: !!stepData.questions,
        pdfFileName: pdfFile?.name,
      });

      try {
        const res = await api.post(`/admin/orientations/${orientationId}/steps`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('✅ Step creation response:', res.data);
        return res.data;
      } catch (error: any) {
        console.error('❌ Step creation API error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
        });
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        console.log('✅ Step created successfully, data:', data);
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
      onError: (error: any) => {
        console.error('❌ Error creating step:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          config: error.config,
          stack: error.stack,
        });
        
        // Log the full error response
        if (error.response?.data) {
          console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
        }
        
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create step';
        const errorDetails = error.response?.data?.error || error.response?.data?.stack || '';
        
        // Check if it's an R2 upload error - if so, provide helpful message
        if (errorMessage.includes('R2') || errorMessage.includes('upload') || errorMessage.includes('Access Denied')) {
          alert(`PDF upload failed, but step should be created without PDF.\n\nTo fix PDF uploads:\n1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens\n2. Create a new token with "Object Read & Write" permissions\n3. Update R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in Vercel\n\nError: ${errorMessage}`);
        } else {
          alert(`Error creating step: ${errorMessage}\n\n${errorDetails ? `Details: ${errorDetails.substring(0, 200)}` : ''}\n\nCheck the browser console (F12) for full error details.`);
        }
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
      if (pdfFile) {
        formData.append('pdf', pdfFile);
        // Add question mode for auto-generation
        formData.append('questionMode', questionMode);
      }
      if (removePdf) formData.append('removePdf', 'true');
      // Add question mode for auto-generation
      if (pdfFile) {
        formData.append('questionMode', questionMode);
      }

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
    
    if (!selectedOrientation) {
      alert('Please select an orientation first');
      return;
    }

    // Validate required fields
    if (!stepFormData.title || !stepFormData.title.trim()) {
      alert('Step title is required');
      return;
    }

    console.log('📝 Submitting step form:', {
      editing: !!editingStep?.id,
      orientationId: selectedOrientation,
      stepData: stepFormData,
      hasPdf: !!stepPdfFile,
      pdfFileName: stepPdfFile?.name,
    });

    if (editingStep?.id) {
      console.log('🔄 Updating existing step:', editingStep.id);
      updateStepMutation.mutate({
        orientationId: selectedOrientation,
        stepId: editingStep.id,
        stepData: stepFormData,
        pdfFile: stepPdfFile,
      });
    } else {
      console.log('➕ Creating new step for orientation:', selectedOrientation);
      createStepMutation.mutate({
        orientationId: selectedOrientation,
        stepData: stepFormData,
        pdfFile: stepPdfFile,
      }, {
        onSettled: (data, error) => {
          console.log('Step mutation settled:', { data, error, hasData: !!data, hasError: !!error });
        },
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

  // Parse bulk questions from text format - expects multiple choice format
  const parseBulkQuestions = (text: string): any[] => {
    const questions: any[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentQuestion: any = null;
    let questionCounter = 1;
    let baseId = Date.now();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if it's a question (Q1:, Q2:, etc. or just starts with Q:)
      if (line.match(/^Q\d*:?\s*(.+)$/i)) {
        const match = line.match(/^Q\d*:?\s*(.+)$/i);
        if (match && match[1]) {
          // Save previous question if exists
          if (currentQuestion && currentQuestion.question) {
            // Ensure it's multiple choice and has at least 2 options
            if (currentQuestion.options && currentQuestion.options.length >= 2) {
              // If no correct answer set, use first option
              if (!currentQuestion.correctAnswer && currentQuestion.options.length > 0) {
                currentQuestion.correctAnswer = currentQuestion.options[0];
              }
              questions.push(currentQuestion);
            }
          }
          // Start new question - always multiple choice
          currentQuestion = {
            id: `q-${baseId}-${questionCounter++}`,
            question: match[1].trim(),
            type: 'multiple_choice',
            options: [],
            correctAnswer: '',
            required: true,
          };
        }
      }
      // Check if it's an answer (A1:, A2:, etc. or just starts with A:) - this sets the correct answer
      else if (line.match(/^A\d*:?\s*(.+)$/i)) {
        const match = line.match(/^A\d*:?\s*(.+)$/i);
        if (match && match[1] && currentQuestion) {
          const answer = match[1].trim();
          // Set as correct answer (must match one of the options)
          currentQuestion.correctAnswer = answer;
          // If this answer is not in options yet, add it
          if (currentQuestion.options.indexOf(answer) === -1 && currentQuestion.options.length < 4) {
            currentQuestion.options.push(answer);
          }
        }
      }
      // Check if it's an option (starts with -, *, •, or number like 1. 2. etc.)
      else if (line.match(/^[-*•]\s*(.+)$/) || line.match(/^\d+[.)]\s*(.+)$/)) {
        const match = line.match(/^[-*•]\s*(.+)$/) || line.match(/^\d+[.)]\s*(.+)$/);
        if (match && match[1] && currentQuestion) {
          const option = match[1].trim();
          if (!currentQuestion.options) {
            currentQuestion.options = [];
          }
          // Only add if not already present
          if (currentQuestion.options.indexOf(option) === -1) {
            currentQuestion.options.push(option);
          }
          // Ensure it stays multiple_choice
          currentQuestion.type = 'multiple_choice';
        }
      }
      // If no prefix and we have a current question, treat as continuation
      else if (currentQuestion && line.length > 0) {
        // If we have options, add to last option
        if (currentQuestion.options && currentQuestion.options.length > 0) {
          currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
        }
        // Otherwise, continue the question text
        else if (currentQuestion.question) {
          currentQuestion.question += ' ' + line;
        }
      }
    }
    
    // Add last question if exists and valid
    if (currentQuestion && currentQuestion.question) {
      // Ensure it's multiple choice and has at least 2 options
      if (currentQuestion.options && currentQuestion.options.length >= 2) {
        // If no correct answer set, use first option
        if (!currentQuestion.correctAnswer && currentQuestion.options.length > 0) {
          currentQuestion.correctAnswer = currentQuestion.options[0];
        }
        questions.push(currentQuestion);
      }
    }
    
    // Validate all questions have at least 2 options
    return questions.filter(q => q.options && q.options.length >= 2 && q.correctAnswer);
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
                      console.log('➕ Add Step clicked for orientation:', orientation.id);
                      setSelectedOrientation(orientation.id); // Ensure orientation is selected
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
                      setQuestionMode('manual'); // Reset to manual mode
                      setBulkQuestionsText(''); // Reset bulk questions
                      setShowStepForm(true);
                      console.log('✅ Step form should now be visible');
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
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-200">Assessment Questions</label>
                          <div className="flex gap-2">
                            {stepPdfFile && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!stepPdfFile) return;
                                  setIsGeneratingQuestions(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', stepPdfFile);
                                    const res = await api.post('/admin/surveys/generate-questions-from-pdf', formData, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                    if (res.data.questions && res.data.questions.length > 0) {
                                      setStepFormData({
                                        ...stepFormData,
                                        questions: res.data.questions,
                                      });
                                      alert(`✅ Generated ${res.data.questions.length} questions from PDF!`);
                                    } else {
                                      alert('No questions were generated. Please add questions manually.');
                                    }
                                  } catch (error: any) {
                                    alert(error.response?.data?.message || 'Failed to generate questions from PDF');
                                  } finally {
                                    setIsGeneratingQuestions(false);
                                  }
                                }}
                                disabled={isGeneratingQuestions}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isGeneratingQuestions ? 'Generating...' : '🤖 Generate from PDF'}
                              </button>
                            )}
                            {questionMode === 'manual' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQuestions = Array.isArray(stepFormData.questions) ? stepFormData.questions : [];
                                  const newQuestion = {
                                    id: `q-${Date.now()}`,
                                    question: '',
                                    type: 'multiple_choice',
                                    options: ['Option 1', 'Option 2'],
                                    correctAnswer: 'Option 1',
                                    required: true,
                                  };
                                  setStepFormData({
                                    ...stepFormData,
                                    questions: [...currentQuestions, newQuestion],
                                  });
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                + Add Question
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Question Generation Mode Selection */}
                        <div className="mb-4 p-3 bg-gray-600 rounded-lg">
                          <label className="block text-sm font-medium text-gray-200 mb-2">Question Generation Mode</label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-500">
                              <input
                                type="radio"
                                name="questionMode"
                                value="manual"
                                checked={questionMode === 'manual'}
                                onChange={(e) => setQuestionMode(e.target.value as 'auto' | 'manual' | 'bulk' | 'markdown')}
                                className="w-4 h-4 text-primary-500"
                              />
                              <span className="text-gray-300 text-sm">
                                ✏️ Manual (One by one)
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-500">
                              <input
                                type="radio"
                                name="questionMode"
                                value="bulk"
                                checked={questionMode === 'bulk'}
                                onChange={(e) => setQuestionMode(e.target.value as 'auto' | 'manual' | 'bulk' | 'markdown')}
                                className="w-4 h-4 text-primary-500"
                              />
                              <span className="text-gray-300 text-sm">
                                📝 Bulk (10 Q&A at once)
                              </span>
                            </label>
                            {stepPdfFile && (
                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-500">
                                <input
                                  type="radio"
                                  name="questionMode"
                                  value="auto"
                                  checked={questionMode === 'auto'}
                                  onChange={(e) => setQuestionMode(e.target.value as 'auto' | 'manual' | 'bulk' | 'markdown')}
                                  className="w-4 h-4 text-primary-500"
                                />
                                <span className="text-gray-300 text-sm">
                                  🤖 Auto from PDF
                                </span>
                              </label>
                            )}
                            {stepFormData.content && (
                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-500">
                                <input
                                  type="radio"
                                  name="questionMode"
                                  value="markdown"
                                  checked={questionMode === 'markdown'}
                                  onChange={(e) => setQuestionMode(e.target.value as 'auto' | 'manual' | 'bulk' | 'markdown')}
                                  className="w-4 h-4 text-primary-500"
                                />
                                <span className="text-gray-300 text-sm">
                                  📄 Generate from Markdown
                                </span>
                              </label>
                            )}
                          </div>
                          {questionMode === 'auto' && stepPdfFile && (
                            <p className="text-xs text-gray-400 mt-2">
                              Questions will be automatically generated from the PDF when you create the step.
                            </p>
                          )}
                          {questionMode === 'markdown' && stepFormData.content && (
                            <p className="text-xs text-gray-400 mt-2">
                              Questions will be generated from the markdown content above using AI.
                            </p>
                          )}
                        </div>

                        {/* Bulk Questions Input */}
                        {questionMode === 'bulk' && (
                          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                              Paste 10 Questions and Answers (One per line)
                            </label>
                            <p className="text-xs text-gray-400 mb-2">
                              Format (Multiple Choice): <br />
                              Q1: Your question here?<br />
                              - Option 1<br />
                              - Option 2<br />
                              - Option 3<br />
                              - Option 4<br />
                              A1: Correct answer (must match one of the options)<br />
                              <br />
                              Q2: Another question?<br />
                              - Option A<br />
                              - Option B<br />
                              - Option C<br />
                              A2: Option B<br />
                              ... (repeat for 10 questions)
                            </p>
                            <textarea
                              value={bulkQuestionsText}
                              onChange={(e) => setBulkQuestionsText(e.target.value)}
                              rows={20}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded text-sm font-mono"
                              placeholder={`Q1: What is the primary goal of beneficiary communication?
- To inform beneficiaries about programs
- To ensure transparency and accountability
- To collect feedback and complaints
- All of the above
A1: All of the above

Q2: Which communication channels should be used?
- Face-to-face meetings only
- Community notice boards only
- SMS and phone calls only
- Multiple channels (face-to-face, notice boards, SMS, radio)
A2: Multiple channels (face-to-face, notice boards, SMS, radio)

Q3: How should complaints be handled?
- Ignore them
- Handle them promptly and confidentially
- Share them publicly
- Delay response
A3: Handle them promptly and confidentially

... (continue for 10 questions)`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = parseBulkQuestions(bulkQuestionsText);
                                  if (parsed.length > 0) {
                                    // Validate all questions have proper structure
                                    const validQuestions = parsed.filter(q => 
                                      q.question && 
                                      q.options && 
                                      q.options.length >= 2 && 
                                      q.correctAnswer &&
                                      q.type === 'multiple_choice'
                                    );
                                    
                                    if (validQuestions.length > 0) {
                                      setStepFormData({
                                        ...stepFormData,
                                        questions: validQuestions,
                                      });
                                      alert(`✅ Parsed ${validQuestions.length} multiple choice questions successfully!`);
                                    } else {
                                      alert('❌ Could not parse valid multiple choice questions. Each question needs at least 2 options and a correct answer.');
                                    }
                                  } else {
                                    alert('❌ Could not parse questions. Please check the format:\n\nQ1: Question?\n- Option 1\n- Option 2\n- Option 3\nA1: Correct answer');
                                  }
                                } catch (error: any) {
                                  alert(`Error parsing questions: ${error.message}`);
                                }
                              }}
                              className="mt-2 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Parse Questions
                            </button>
                            {stepFormData.questions && Array.isArray(stepFormData.questions) && stepFormData.questions.length > 0 && (
                              <p className="text-xs text-green-400 mt-2">
                                ✅ {stepFormData.questions.length} question(s) ready to save
                              </p>
                            )}
                          </div>
                        )}

                        {/* Generate from Markdown */}
                        {questionMode === 'markdown' && stepFormData.content && (
                          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!stepFormData.content || stepFormData.content.trim().length < 50) {
                                  alert('Please add markdown content first (at least 50 characters)');
                                  return;
                                }
                                setIsGeneratingQuestions(true);
                                try {
                                  const res = await api.post('/admin/surveys/generate-from-text', {
                                    text: stepFormData.content,
                                    numQuestions: 10,
                                  });
                                  if (res.data.questions && res.data.questions.length > 0) {
                                    setStepFormData({
                                      ...stepFormData,
                                      questions: res.data.questions,
                                    });
                                    alert(`✅ Generated ${res.data.questions.length} questions from markdown!`);
                                  } else {
                                    alert('No questions were generated. Please try again or use manual mode.');
                                  }
                                } catch (error: any) {
                                  alert(error.response?.data?.message || 'Failed to generate questions from markdown');
                                } finally {
                                  setIsGeneratingQuestions(false);
                                }
                              }}
                              disabled={isGeneratingQuestions}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isGeneratingQuestions ? 'Generating...' : '🤖 Generate 10 Questions from Markdown Content'}
                            </button>
                            <p className="text-xs text-gray-400 mt-2">
                              This will generate 10 questions based on the markdown content you entered above.
                            </p>
                          </div>
                        )}

                        {/* Show parsed bulk questions preview */}
                        {questionMode === 'bulk' && stepFormData.questions && Array.isArray(stepFormData.questions) && stepFormData.questions.length > 0 && (
                          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <p className="text-sm text-green-400 font-semibold mb-2">
                              ✅ {stepFormData.questions.length} Multiple Choice Question(s) Ready
                            </p>
                            <div className="text-xs text-gray-300 space-y-1 max-h-32 overflow-y-auto">
                              {stepFormData.questions.slice(0, 3).map((q: any, idx: number) => (
                                <div key={idx}>
                                  <span className="text-green-400">Q{idx + 1}:</span> {q.question?.substring(0, 50)}... ({q.options?.length || 0} options, Answer: {q.correctAnswer?.substring(0, 30)})
                                </div>
                              ))}
                              {stepFormData.questions.length > 3 && (
                                <div className="text-gray-500">... and {stepFormData.questions.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {Array.isArray(stepFormData.questions) && stepFormData.questions.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-700 rounded-lg">
                            {stepFormData.questions.map((q: any, idx: number) => (
                              <div key={q.id || idx} className="bg-gray-600 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-white font-semibold">Question {idx + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = stepFormData.questions.filter((_: any, i: number) => i !== idx);
                                      setStepFormData({ ...stepFormData, questions: updated.length > 0 ? updated : null });
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
                                      const updated = [...(stepFormData.questions as any[])];
                                      updated[idx] = { ...updated[idx], question: e.target.value };
                                      setStepFormData({ ...stepFormData, questions: updated });
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
                                      const updated = [...(stepFormData.questions as any[])];
                                      updated[idx] = {
                                        ...updated[idx],
                                        type: e.target.value,
                                        options: e.target.value === 'multiple_choice' || e.target.value === 'checkbox' 
                                          ? (updated[idx].options || ['Option 1', 'Option 2'])
                                          : undefined,
                                      };
                                      setStepFormData({ ...stepFormData, questions: updated });
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
                                            const updated = [...(stepFormData.questions as any[])];
                                            const newOptions = [...(updated[idx].options || [])];
                                            newOptions[optIdx] = e.target.value;
                                            updated[idx] = { ...updated[idx], options: newOptions };
                                            setStepFormData({ ...stepFormData, questions: updated });
                                          }}
                                          className="flex-1 px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                                          placeholder={`Option ${optIdx + 1}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...(stepFormData.questions as any[])];
                                            const newOptions = (updated[idx].options || []).filter((_: any, i: number) => i !== optIdx);
                                            updated[idx] = { ...updated[idx], options: newOptions };
                                            setStepFormData({ ...stepFormData, questions: updated });
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
                                        const updated = [...(stepFormData.questions as any[])];
                                        const newOptions = [...(updated[idx].options || []), `Option ${(updated[idx].options || []).length + 1}`];
                                        updated[idx] = { ...updated[idx], options: newOptions };
                                        setStepFormData({ ...stepFormData, questions: updated });
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
                                        const updated = [...(stepFormData.questions as any[])];
                                        updated[idx] = { ...updated[idx], correctAnswer: e.target.value };
                                        setStepFormData({ ...stepFormData, questions: updated });
                                      }}
                                      className="w-full px-3 py-2 bg-gray-500 border border-gray-400 text-white rounded text-sm"
                                      placeholder="Expected answer or key concepts..."
                                    />
                                  ) : (
                                    <select
                                      value={q.correctAnswer || ''}
                                      onChange={(e) => {
                                        const updated = [...(stepFormData.questions as any[])];
                                        updated[idx] = { ...updated[idx], correctAnswer: e.target.value };
                                        setStepFormData({ ...stepFormData, questions: updated });
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
                                      const updated = [...(stepFormData.questions as any[])];
                                      updated[idx] = { ...updated[idx], required: e.target.checked };
                                      setStepFormData({ ...stepFormData, questions: updated });
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
                            No questions added yet. Click "Add Question" to create one, or upload a PDF and click "Generate from PDF" to auto-generate questions.
                          </div>
                        )}
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

