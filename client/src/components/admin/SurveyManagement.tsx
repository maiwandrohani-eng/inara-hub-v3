import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllPolicyCategories } from '../../config/categories';

interface Question {
  id: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'checkbox' | 'yes_no';
  question: string;
  required: boolean;
  options?: string[];
  correctAnswer?: string | string[];
  points?: number;
  order: number;
}

export default function SurveyManagement() {
  const [showForm, setShowForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'survey', // survey, assessment, test
    questions: [] as Question[],
    isAnonymous: false,
    hasTimeLimit: false,
    timeLimitMinutes: null as number | null,
    passingScore: null as number | null,
    maxAttempts: null as number | null,
    isMandatory: false,
    assignedTo: 'GLOBAL' as 'GLOBAL' | 'COUNTRY' | 'DEPARTMENT' | 'ROLE' | 'USERS' | 'PUBLIC',
    assignedRoles: [] as string[],
    assignedDepartments: [] as string[],
    assignedCountries: [] as string[],
    assignedUserIds: [] as string[],
    startDate: '',
    endDate: '',
    dueDate: '',
    category: '',
    tags: [] as string[],
  });

  const queryClient = useQueryClient();

  const { data: surveys } = useQuery('admin-surveys', async () => {
    const res = await api.get('/admin/surveys');
    return res.data;
  });

  const { data: departmentsData } = useQuery('config-departments', async () => {
    try {
      const res = await api.get('/config/department');
      return res.data;
    } catch {
      return { configs: [] };
    }
  });

  const { data: countriesData } = useQuery('config-countries', async () => {
    try {
      const res = await api.get('/config/country');
      return res.data;
    } catch {
      return { configs: [] };
    }
  });

  const { data: usersData } = useQuery('admin-users-for-survey', async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data;
    } catch {
      return { users: [] };
    }
  });

  const departments = departmentsData?.configs || [];
  const countries = countriesData?.configs || [];
  const users = usersData?.users || [];

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/surveys', {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-surveys');
        setShowForm(false);
        resetForm();
        alert('Survey created successfully!');
      },
      onError: (error: any) => {
        console.error('❌ Error creating survey:', error);
        alert(error.response?.data?.message || error.message || 'Failed to create survey. Please check the console for details.');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/surveys/${id}`, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-surveys');
        setShowForm(false);
        setEditingSurvey(null);
        resetForm();
        alert('Survey updated successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/surveys/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-surveys');
        alert('Survey deleted successfully!');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'survey',
      questions: [],
      isAnonymous: false,
      hasTimeLimit: false,
      timeLimitMinutes: null,
      passingScore: null,
      maxAttempts: null,
      isMandatory: false,
      assignedTo: 'GLOBAL',
      assignedRoles: [],
      assignedDepartments: [],
      assignedCountries: [],
      assignedUserIds: [],
      startDate: '',
      endDate: '',
      dueDate: '',
      category: '',
      tags: [],
    });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'multiple_choice',
      question: '',
      required: true,
      options: ['Option 1', 'Option 2'],
      points: 1,
      order: formData.questions.length + 1,
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setFormData({
      ...formData,
      questions: formData.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const removeQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== questionId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Ensure category and tags are properly formatted
    const submitData = {
      ...formData,
      category: formData.category ? String(formData.category).trim() : null,
      tags: Array.isArray(formData.tags) ? formData.tags.filter(t => t && String(t).trim()) : [],
    };

    console.log('📤 Submitting survey:', {
      title: submitData.title,
      type: submitData.type,
      category: submitData.category,
      tags: submitData.tags,
      questionsCount: submitData.questions.length,
    });

    if (editingSurvey) {
      updateMutation.mutate({ id: editingSurvey.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (survey: any) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description || '',
      type: survey.type,
      questions: (survey.questions as Question[]) || [],
      isAnonymous: survey.isAnonymous || false,
      hasTimeLimit: survey.hasTimeLimit || false,
      timeLimitMinutes: survey.timeLimitMinutes,
      passingScore: survey.passingScore,
      maxAttempts: survey.maxAttempts,
      isMandatory: survey.isMandatory || false,
      assignedTo: survey.assignedTo || 'GLOBAL',
      assignedRoles: survey.assignedRoles || [],
      assignedDepartments: survey.assignedDepartments || [],
      assignedCountries: survey.assignedCountries || [],
      assignedUserIds: survey.assignedUserIds || [],
      startDate: survey.startDate ? new Date(survey.startDate).toISOString().split('T')[0] : '',
      endDate: survey.endDate ? new Date(survey.endDate).toISOString().split('T')[0] : '',
      dueDate: survey.dueDate ? new Date(survey.dueDate).toISOString().split('T')[0] : '',
      category: survey.category || '',
      tags: survey.tags || [],
    });
    setShowForm(true);
  };

  const handleDocumentUpload = async (file: File) => {
    setUploadedDocument(file);
    setIsGeneratingQuestions(true);

    // Upload document and generate questions
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'test');

      const uploadRes = await api.post('/admin/surveys/upload-document', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📥 Document upload response:', uploadRes.data);
      
      if (uploadRes.data.questions && Array.isArray(uploadRes.data.questions) && uploadRes.data.questions.length > 0) {
        setGeneratedQuestions(uploadRes.data.questions);
        // Pre-fill form with document info
        setFormData({
          ...formData,
          title: uploadRes.data.title || file.name.replace(/\.[^/.]+$/, ''),
          description: `Test generated from document: ${file.name}`,
          type: 'test',
          questions: uploadRes.data.questions,
          category: uploadRes.data.category || 'General',
        });
        setShowDocumentUpload(false);
        setShowForm(true);
        alert(`✅ Document uploaded! ${uploadRes.data.questions.length} questions generated. Please review and edit them before saving.`);
      } else {
        console.error('❌ No questions in response:', uploadRes.data);
        alert('Document uploaded but no questions were generated. Please create questions manually.');
      }
    } catch (error: any) {
      console.error('❌ Document upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process document';
      console.error('Error details:', error.response?.data);
      alert(`Error: ${errorMessage}\n\nTip: You can use the "Paste Document Content" option instead to paste the text directly.`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleTextPaste = async () => {
    if (!pastedText || pastedText.trim().length < 100) {
      alert('Please paste at least 100 characters of document content.');
      return;
    }

    setIsGeneratingQuestions(true);

    try {
      const res = await api.post('/admin/surveys/generate-from-text', {
        text: pastedText,
        // numQuestions will be auto-calculated based on text length (10-30)
      });

      console.log('📥 Text generation response:', res.data);
      
      if (res.data.questions && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setGeneratedQuestions(res.data.questions);
        // Pre-fill form
        setFormData({
          ...formData,
          title: res.data.title || 'Test from Document Content',
          description: 'Test generated from pasted document content',
          type: 'test',
          questions: res.data.questions,
          category: res.data.category || 'General',
        });
        setShowTextInput(false);
        setPastedText('');
        setShowForm(true);
        alert(`✅ ${res.data.questions.length} questions generated from your content! Please review and edit them before saving.`);
      } else {
        alert('Failed to generate questions. Please try again or create questions manually.');
      }
    } catch (error: any) {
      console.error('❌ Text generation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate questions';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Surveys, Assessments & Tests</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowDocumentUpload(true);
              setUploadedDocument(null);
              setGeneratedQuestions([]);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            📄 Upload PDF Document
          </button>
          <button
            onClick={() => {
              setShowTextInput(true);
              setPastedText('');
              setGeneratedQuestions([]);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            📝 Paste Document Content
          </button>
          <button
            onClick={() => {
              setEditingSurvey(null);
              resetForm();
              setShowForm(true);
            }}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            + Create Survey/Assessment/Test
          </button>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Upload Document & Generate Test</h3>
          <p className="text-sm text-gray-400 mb-4">
            Upload a policy, module, or training document. The system will extract content and generate multiple-choice questions.
            You can review and edit the generated questions before creating the test.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Upload Document (PDF, DOC, DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleDocumentUpload(file);
                  }
                }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            {isGeneratingQuestions && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Processing document and generating questions...</p>
              </div>
            )}
            <button
              onClick={() => {
                setShowDocumentUpload(false);
                setUploadedDocument(null);
                setGeneratedQuestions([]);
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Text Paste Modal */}
      {showTextInput && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Paste Document Content & Generate Test</h3>
          <p className="text-sm text-gray-400 mb-4">
            Paste the content from your document (policy, module, training material, etc.). The system will analyze the text and generate multiple-choice questions.
            <strong className="text-green-400 block mt-2">✅ This method is more reliable than PDF extraction.</strong>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Paste Document Content (minimum 100 characters)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your document content here... (e.g., policy text, training material, guidelines, etc.)"
                rows={12}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                {pastedText.length} characters (minimum 100 required)
              </p>
            </div>
            {isGeneratingQuestions && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Analyzing content and generating questions...</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTextInput(false);
                  setPastedText('');
                  setGeneratedQuestions([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleTextPaste}
                disabled={isGeneratingQuestions || pastedText.trim().length < 100}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isGeneratingQuestions ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingSurvey ? 'Edit Survey/Assessment/Test' : 'Create New Survey/Assessment/Test'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-200 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="survey">Survey (No Scoring)</option>
                  <option value="assessment">Assessment (Scored)</option>
                  <option value="test">Test (Scored with Passing Grade)</option>
                </select>
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

            {/* Settings */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="text-primary-500"
                  />
                  <label className="text-sm text-gray-200">Anonymous (for surveys)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="text-primary-500"
                  />
                  <label className="text-sm text-gray-200">Mandatory</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasTimeLimit}
                    onChange={(e) => setFormData({ ...formData, hasTimeLimit: e.target.checked })}
                    className="text-primary-500"
                  />
                  <label className="text-sm text-gray-200">Has Time Limit</label>
                </div>
              </div>

              {formData.hasTimeLimit && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={formData.timeLimitMinutes || ''}
                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) || null })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
              )}

              {(formData.type === 'assessment' || formData.type === 'test') && (
                <>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Passing Score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore || ''}
                      onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Max Attempts (leave empty for unlimited)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxAttempts || ''}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Assignment */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Assignment</h4>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Assign To *</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const newValue = e.target.value as any;
                    setFormData({ 
                      ...formData, 
                      assignedTo: newValue,
                      // Reset specific assignments when changing type
                      assignedRoles: newValue !== 'ROLE' ? [] : formData.assignedRoles,
                      assignedDepartments: newValue !== 'DEPARTMENT' ? [] : formData.assignedDepartments,
                      assignedCountries: newValue !== 'COUNTRY' ? [] : formData.assignedCountries,
                      assignedUserIds: newValue !== 'USERS' ? [] : formData.assignedUserIds,
                    });
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="GLOBAL">All Staff</option>
                  <option value="PUBLIC">General Public (External)</option>
                  <option value="DEPARTMENT">Specific Department(s)</option>
                  <option value="USERS">Specific Staff Member(s)</option>
                  <option value="COUNTRY">By Country</option>
                  <option value="ROLE">By Role</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.assignedTo === 'PUBLIC' && 'Survey will be accessible to anyone (public link)'}
                  {formData.assignedTo === 'GLOBAL' && 'All registered staff members'}
                  {formData.assignedTo === 'DEPARTMENT' && 'Select one or more departments below'}
                  {formData.assignedTo === 'USERS' && 'Select specific staff members below'}
                  {formData.assignedTo === 'COUNTRY' && 'Select one or more countries below'}
                  {formData.assignedTo === 'ROLE' && 'Select one or more roles below'}
                </p>
              </div>

              {formData.assignedTo === 'DEPARTMENT' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Departments</label>
                  <select
                    multiple
                    value={formData.assignedDepartments}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setFormData({ ...formData, assignedDepartments: selected });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    {departments.map((dept: any) => (
                      <option key={dept.key || dept.value} value={dept.key || dept.value}>
                        {dept.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              )}

              {formData.assignedTo === 'COUNTRY' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Countries</label>
                  <select
                    multiple
                    value={formData.assignedCountries}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setFormData({ ...formData, assignedCountries: selected });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    {countries.map((country: any) => (
                      <option key={country.key || country.value} value={country.key || country.value}>
                        {country.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              )}

              {formData.assignedTo === 'ROLE' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Roles</label>
                  <select
                    multiple
                    value={formData.assignedRoles}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setFormData({ ...formData, assignedRoles: selected });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="COUNTRY_DIRECTOR">Country Director</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              )}

              {formData.assignedTo === 'USERS' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Select Staff Members</label>
                  <select
                    multiple
                    value={formData.assignedUserIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setFormData({ ...formData, assignedUserIds: selected });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg max-h-40"
                  >
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.department || 'No Department'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Hold Ctrl/Cmd to select multiple. Selected: {formData.assignedUserIds.length} staff member(s)
                  </p>
                </div>
              )}
            </div>

            {/* Category & Tags */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Category & Organization</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Category (Determines which sub-tab it appears in)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="">-- Select Category (Optional) --</option>
                    <option value="HR">HR (Human Resources) → Shows in "HR" sub-tab</option>
                    <option value="M&E">M&E (Monitoring & Evaluation) → Shows in "M&E" sub-tab</option>
                    <option value="General">General → Shows in "General" sub-tab</option>
                    <option value="Finance">Finance → Shows in "General" sub-tab</option>
                    <option value="Procurement">Procurement → Shows in "General" sub-tab</option>
                    <option value="Safeguarding">Safeguarding → Shows in "General" sub-tab</option>
                    <option value="Security">Security → Shows in "General" sub-tab</option>
                    <option value="Communications">Communications → Shows in "General" sub-tab</option>
                    <option value="IT">IT (Information Technology) → Shows in "General" sub-tab</option>
                    <option value="Governance">Governance → Shows in "General" sub-tab</option>
                    <option value="Operations">Operations → Shows in "General" sub-tab</option>
                  </select>
                  <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <p className="text-sm font-semibold text-white mb-2">This survey will appear in:</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-primary-400">✓</span>
                        <span className="text-sm text-gray-200">
                          <strong>"All"</strong> sub-tab (always shown)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-primary-400">✓</span>
                        <span className="text-sm text-gray-200">
                          <strong>"{formData.type === 'survey' ? 'Surveys' : formData.type === 'assessment' ? 'Assessments' : 'Tests'}"</strong> sub-tab (based on type)
                        </span>
                      </div>
                      {formData.category && (
                        <div className="flex items-center space-x-2">
                          <span className="text-primary-400">✓</span>
                          <span className="text-sm text-gray-200">
                            <strong>"{formData.category === 'HR' ? 'HR' : formData.category === 'M&E' ? 'M&E' : 'General'}"</strong> sub-tab (based on category)
                          </span>
                        </div>
                      )}
                      {!formData.category && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">○</span>
                          <span className="text-sm text-gray-400">
                            No category selected - will only show in "All" and type-specific tabs
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Tags (Optional - for additional filtering)</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                      setFormData({ ...formData, tags });
                    }}
                    placeholder="e.g., employee satisfaction, exit interview, beneficiary feedback"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate multiple tags with commas</p>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Scheduling (Optional)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-white">Questions</h4>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  + Add Question
                </button>
              </div>

              {formData.questions.map((question, index) => (
                <div key={question.id} className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-white font-semibold">Question {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Question Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => {
                          const newType = e.target.value as Question['type'];
                          updateQuestion(question.id, {
                            type: newType,
                            options: newType === 'multiple_choice' || newType === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="checkbox">Checkbox (Multiple Answers)</option>
                        <option value="text">Text Answer</option>
                        <option value="rating">Rating Scale (1-5)</option>
                        <option value="yes_no">Yes/No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Question Text *</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        required
                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                      />
                    </div>

                    {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Options (one per line)</label>
                        <textarea
                          value={question.options?.join('\n') || ''}
                          onChange={(e) => {
                            const options = e.target.value.split('\n').filter((o) => o.trim());
                            updateQuestion(question.id, { options });
                          }}
                          rows={4}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                        />
                        {(formData.type === 'assessment' || formData.type === 'test') && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-200 mb-1">Correct Answer(s)</label>
                            <input
                              type="text"
                              value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer || ''}
                              onChange={(e) => {
                                const answer = e.target.value;
                                updateQuestion(question.id, {
                                  correctAnswer: question.type === 'checkbox' ? answer.split(',').map((a) => a.trim()) : answer,
                                });
                              }}
                              placeholder={question.type === 'checkbox' ? 'Comma-separated answers' : 'Correct answer'}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {(formData.type === 'assessment' || formData.type === 'test') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Points</label>
                        <input
                          type="number"
                          min="1"
                          value={question.points || 1}
                          onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                        className="text-primary-500"
                      />
                      <label className="text-sm text-gray-200">Required</label>
                    </div>
                  </div>
                </div>
              ))}

              {formData.questions.length === 0 && (
                <p className="text-gray-400 text-center py-8">No questions added yet. Click "Add Question" to get started.</p>
              )}
            </div>

            <div className="flex space-x-2 border-t border-gray-700 pt-4">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : editingSurvey
                  ? 'Update Survey'
                  : 'Create Survey'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSurvey(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Surveys List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Surveys/Assessments/Tests</h3>
        <div className="space-y-2">
          {surveys?.surveys?.map((survey: any) => (
            <div key={survey.id} className="bg-gray-700 p-4 rounded flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-white font-semibold">{survey.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    survey.type === 'survey' ? 'bg-blue-900/30 text-blue-300' :
                    survey.type === 'assessment' ? 'bg-green-900/30 text-green-300' :
                    'bg-purple-900/30 text-purple-300'
                  }`}>
                    {survey.type.toUpperCase()}
                  </span>
                  {survey.isMandatory && (
                    <span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-300">Mandatory</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {survey._count?.submissions || 0} submissions
                  {survey.analytics && ` • Avg Score: ${survey.analytics.averageScore?.toFixed(1) || 'N/A'}%`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(survey)}
                  className="px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this survey?')) {
                      deleteMutation.mutate(survey.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm"
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

