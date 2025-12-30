import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function SurveyManagement() {
    const [showForm, setShowForm] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [uploadedDocument, setUploadedDocument] = useState(null);
    const [pastedText, setPastedText] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'survey', // survey, assessment, test
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
    const queryClient = useQueryClient();
    const { data: surveys } = useQuery('admin-surveys', async () => {
        const res = await api.get('/admin/surveys');
        return res.data;
    });
    const { data: departmentsData } = useQuery('config-departments', async () => {
        try {
            const res = await api.get('/config/department');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    });
    const { data: countriesData } = useQuery('config-countries', async () => {
        try {
            const res = await api.get('/config/country');
            return res.data;
        }
        catch {
            return { configs: [] };
        }
    });
    const { data: usersData } = useQuery('admin-users-for-survey', async () => {
        try {
            const res = await api.get('/admin/users');
            return res.data;
        }
        catch {
            return { users: [] };
        }
    });
    const departments = departmentsData?.configs || [];
    const countries = countriesData?.configs || [];
    const users = usersData?.users || [];
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/surveys', {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-surveys');
            setShowForm(false);
            resetForm();
            alert('Survey created successfully!');
        },
        onError: (error) => {
            console.error('❌ Error creating survey:', error);
            alert(error.response?.data?.message || error.message || 'Failed to create survey. Please check the console for details.');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/admin/surveys/${id}`, {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-surveys');
            setShowForm(false);
            setEditingSurvey(null);
            resetForm();
            alert('Survey updated successfully!');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/admin/surveys/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-surveys');
            alert('Survey deleted successfully!');
        },
    });
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
        const newQuestion = {
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
    const updateQuestion = (questionId, updates) => {
        setFormData({
            ...formData,
            questions: formData.questions.map((q) => q.id === questionId ? { ...q, ...updates } : q),
        });
    };
    const removeQuestion = (questionId) => {
        setFormData({
            ...formData,
            questions: formData.questions.filter((q) => q.id !== questionId),
        });
    };
    const handleSubmit = (e) => {
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
        }
        else {
            createMutation.mutate(submitData);
        }
    };
    const handleEdit = (survey) => {
        setEditingSurvey(survey);
        setFormData({
            title: survey.title,
            description: survey.description || '',
            type: survey.type,
            questions: survey.questions || [],
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
    const handleDocumentUpload = async (file) => {
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
            }
            else {
                console.error('❌ No questions in response:', uploadRes.data);
                alert('Document uploaded but no questions were generated. Please create questions manually.');
            }
        }
        catch (error) {
            console.error('❌ Document upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to process document';
            console.error('Error details:', error.response?.data);
            alert(`Error: ${errorMessage}\n\nTip: You can use the "Paste Document Content" option instead to paste the text directly.`);
        }
        finally {
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
            }
            else {
                alert('Failed to generate questions. Please try again or create questions manually.');
            }
        }
        catch (error) {
            console.error('❌ Text generation error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to generate questions';
            alert(`Error: ${errorMessage}`);
        }
        finally {
            setIsGeneratingQuestions(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Surveys, Assessments & Tests" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                    setShowDocumentUpload(true);
                                    setUploadedDocument(null);
                                    setGeneratedQuestions([]);
                                }, className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700", children: "\uD83D\uDCC4 Upload PDF Document" }), _jsx("button", { onClick: () => {
                                    setShowTextInput(true);
                                    setPastedText('');
                                    setGeneratedQuestions([]);
                                }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700", children: "\uD83D\uDCDD Paste Document Content" }), _jsx("button", { onClick: () => {
                                    setEditingSurvey(null);
                                    resetForm();
                                    setShowForm(true);
                                }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Create Survey/Assessment/Test" })] })] }), showDocumentUpload && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Upload Document & Generate Test" }), _jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Upload a policy, module, or training document. The system will extract content and generate multiple-choice questions. You can review and edit the generated questions before creating the test." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Upload Document (PDF, DOC, DOCX)" }), _jsx("input", { type: "file", accept: ".pdf,.doc,.docx", onChange: (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleDocumentUpload(file);
                                            }
                                        }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), isGeneratingQuestions && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "Processing document and generating questions..." })] })), _jsx("button", { onClick: () => {
                                    setShowDocumentUpload(false);
                                    setUploadedDocument(null);
                                    setGeneratedQuestions([]);
                                }, className: "w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })), showTextInput && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Paste Document Content & Generate Test" }), _jsxs("p", { className: "text-sm text-gray-400 mb-4", children: ["Paste the content from your document (policy, module, training material, etc.). The system will analyze the text and generate multiple-choice questions.", _jsx("strong", { className: "text-green-400 block mt-2", children: "\u2705 This method is more reliable than PDF extraction." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Paste Document Content (minimum 100 characters)" }), _jsx("textarea", { value: pastedText, onChange: (e) => setPastedText(e.target.value), placeholder: "Paste your document content here... (e.g., policy text, training material, guidelines, etc.)", rows: 12, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono text-sm" }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [pastedText.length, " characters (minimum 100 required)"] })] }), isGeneratingQuestions && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "Analyzing content and generating questions..." })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                            setShowTextInput(false);
                                            setPastedText('');
                                            setGeneratedQuestions([]);
                                        }, className: "flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" }), _jsx("button", { onClick: handleTextPaste, disabled: isGeneratingQuestions || pastedText.trim().length < 100, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed", children: isGeneratingQuestions ? 'Generating...' : 'Generate Questions' })] })] })] })), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6 max-h-[90vh] overflow-y-auto", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingSurvey ? 'Edit Survey/Assessment/Test' : 'Create New Survey/Assessment/Test' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Type *" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "survey", children: "Survey (No Scoring)" }), _jsx("option", { value: "assessment", children: "Assessment (Scored)" }), _jsx("option", { value: "test", children: "Test (Scored with Passing Grade)" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 3, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3", children: "Settings" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.isAnonymous, onChange: (e) => setFormData({ ...formData, isAnonymous: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Anonymous (for surveys)" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.isMandatory, onChange: (e) => setFormData({ ...formData, isMandatory: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Mandatory" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: formData.hasTimeLimit, onChange: (e) => setFormData({ ...formData, hasTimeLimit: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Has Time Limit" })] })] }), formData.hasTimeLimit && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Time Limit (minutes)" }), _jsx("input", { type: "number", value: formData.timeLimitMinutes || '', onChange: (e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) || null }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })), (formData.type === 'assessment' || formData.type === 'test') && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Passing Score (%)" }), _jsx("input", { type: "number", min: "0", max: "100", value: formData.passingScore || '', onChange: (e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || null }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Max Attempts (leave empty for unlimited)" }), _jsx("input", { type: "number", min: "1", value: formData.maxAttempts || '', onChange: (e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || null }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }))] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3", children: "Assignment" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Assign To *" }), _jsxs("select", { value: formData.assignedTo, onChange: (e) => {
                                                    const newValue = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        assignedTo: newValue,
                                                        // Reset specific assignments when changing type
                                                        assignedRoles: newValue !== 'ROLE' ? [] : formData.assignedRoles,
                                                        assignedDepartments: newValue !== 'DEPARTMENT' ? [] : formData.assignedDepartments,
                                                        assignedCountries: newValue !== 'COUNTRY' ? [] : formData.assignedCountries,
                                                        assignedUserIds: newValue !== 'USERS' ? [] : formData.assignedUserIds,
                                                    });
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "GLOBAL", children: "All Staff" }), _jsx("option", { value: "PUBLIC", children: "General Public (External)" }), _jsx("option", { value: "DEPARTMENT", children: "Specific Department(s)" }), _jsx("option", { value: "USERS", children: "Specific Staff Member(s)" }), _jsx("option", { value: "COUNTRY", children: "By Country" }), _jsx("option", { value: "ROLE", children: "By Role" })] }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [formData.assignedTo === 'PUBLIC' && 'Survey will be accessible to anyone (public link)', formData.assignedTo === 'GLOBAL' && 'All registered staff members', formData.assignedTo === 'DEPARTMENT' && 'Select one or more departments below', formData.assignedTo === 'USERS' && 'Select specific staff members below', formData.assignedTo === 'COUNTRY' && 'Select one or more countries below', formData.assignedTo === 'ROLE' && 'Select one or more roles below'] })] }), formData.assignedTo === 'DEPARTMENT' && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Departments" }), _jsx("select", { multiple: true, value: formData.assignedDepartments, onChange: (e) => {
                                                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                                                    setFormData({ ...formData, assignedDepartments: selected });
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: departments.map((dept) => (_jsx("option", { value: dept.key || dept.value, children: dept.value }, dept.key || dept.value))) }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Hold Ctrl/Cmd to select multiple" })] })), formData.assignedTo === 'COUNTRY' && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Countries" }), _jsx("select", { multiple: true, value: formData.assignedCountries, onChange: (e) => {
                                                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                                                    setFormData({ ...formData, assignedCountries: selected });
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: countries.map((country) => (_jsx("option", { value: country.key || country.value, children: country.value }, country.key || country.value))) }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Hold Ctrl/Cmd to select multiple" })] })), formData.assignedTo === 'ROLE' && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Roles" }), _jsxs("select", { multiple: true, value: formData.assignedRoles, onChange: (e) => {
                                                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                                                    setFormData({ ...formData, assignedRoles: selected });
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "ADMIN", children: "Admin" }), _jsx("option", { value: "COUNTRY_DIRECTOR", children: "Country Director" }), _jsx("option", { value: "DEPARTMENT_HEAD", children: "Department Head" }), _jsx("option", { value: "MANAGER", children: "Manager" }), _jsx("option", { value: "STAFF", children: "Staff" })] }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Hold Ctrl/Cmd to select multiple" })] })), formData.assignedTo === 'USERS' && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Select Staff Members" }), _jsx("select", { multiple: true, value: formData.assignedUserIds, onChange: (e) => {
                                                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                                                    setFormData({ ...formData, assignedUserIds: selected });
                                                }, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg max-h-40", children: users.map((user) => (_jsxs("option", { value: user.id, children: [user.firstName, " ", user.lastName, " (", user.email, ") - ", user.department || 'No Department'] }, user.id))) }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["Hold Ctrl/Cmd to select multiple. Selected: ", formData.assignedUserIds.length, " staff member(s)"] })] }))] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3", children: "Category & Organization" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category (Determines which sub-tab it appears in)" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "-- Select Category (Optional) --" }), _jsx("option", { value: "HR", children: "HR (Human Resources) \u2192 Shows in \"HR\" sub-tab" }), _jsx("option", { value: "M&E", children: "M&E (Monitoring & Evaluation) \u2192 Shows in \"M&E\" sub-tab" }), _jsx("option", { value: "General", children: "General \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Finance", children: "Finance \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Procurement", children: "Procurement \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Safeguarding", children: "Safeguarding \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Security", children: "Security \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Communications", children: "Communications \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "IT", children: "IT (Information Technology) \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Governance", children: "Governance \u2192 Shows in \"General\" sub-tab" }), _jsx("option", { value: "Operations", children: "Operations \u2192 Shows in \"General\" sub-tab" })] }), _jsxs("div", { className: "mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600", children: [_jsx("p", { className: "text-sm font-semibold text-white mb-2", children: "This survey will appear in:" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-primary-400", children: "\u2713" }), _jsxs("span", { className: "text-sm text-gray-200", children: [_jsx("strong", { children: "\"All\"" }), " sub-tab (always shown)"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-primary-400", children: "\u2713" }), _jsxs("span", { className: "text-sm text-gray-200", children: [_jsxs("strong", { children: ["\"", formData.type === 'survey' ? 'Surveys' : formData.type === 'assessment' ? 'Assessments' : 'Tests', "\""] }), " sub-tab (based on type)"] })] }), formData.category && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-primary-400", children: "\u2713" }), _jsxs("span", { className: "text-sm text-gray-200", children: [_jsxs("strong", { children: ["\"", formData.category === 'HR' ? 'HR' : formData.category === 'M&E' ? 'M&E' : 'General', "\""] }), " sub-tab (based on category)"] })] })), !formData.category && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-gray-500", children: "\u25CB" }), _jsx("span", { className: "text-sm text-gray-400", children: "No category selected - will only show in \"All\" and type-specific tabs" })] }))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Tags (Optional - for additional filtering)" }), _jsx("input", { type: "text", value: formData.tags.join(', '), onChange: (e) => {
                                                            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                                            setFormData({ ...formData, tags });
                                                        }, placeholder: "e.g., employee satisfaction, exit interview, beneficiary feedback", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Separate multiple tags with commas" })] })] })] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-3", children: "Scheduling (Optional)" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Start Date" }), _jsx("input", { type: "datetime-local", value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "End Date" }), _jsx("input", { type: "datetime-local", value: formData.endDate, onChange: (e) => setFormData({ ...formData, endDate: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Due Date" }), _jsx("input", { type: "datetime-local", value: formData.dueDate, onChange: (e) => setFormData({ ...formData, dueDate: e.target.value }), className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] })] }), _jsxs("div", { className: "border-t border-gray-700 pt-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h4", { className: "text-lg font-semibold text-white", children: "Questions" }), _jsx("button", { type: "button", onClick: addQuestion, className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm", children: "+ Add Question" })] }), formData.questions.map((question, index) => (_jsxs("div", { className: "bg-gray-700 p-4 rounded-lg mb-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("span", { className: "text-white font-semibold", children: ["Question ", index + 1] }), _jsx("button", { type: "button", onClick: () => removeQuestion(question.id), className: "text-red-400 hover:text-red-300 text-sm", children: "Remove" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Question Type" }), _jsxs("select", { value: question.type, onChange: (e) => {
                                                                    const newType = e.target.value;
                                                                    updateQuestion(question.id, {
                                                                        type: newType,
                                                                        options: newType === 'multiple_choice' || newType === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
                                                                    });
                                                                }, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", children: [_jsx("option", { value: "multiple_choice", children: "Multiple Choice" }), _jsx("option", { value: "checkbox", children: "Checkbox (Multiple Answers)" }), _jsx("option", { value: "text", children: "Text Answer" }), _jsx("option", { value: "rating", children: "Rating Scale (1-5)" }), _jsx("option", { value: "yes_no", children: "Yes/No" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Question Text *" }), _jsx("input", { type: "text", value: question.question, onChange: (e) => updateQuestion(question.id, { question: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] }), (question.type === 'multiple_choice' || question.type === 'checkbox') && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Options (one per line)" }), _jsx("textarea", { value: question.options?.join('\n') || '', onChange: (e) => {
                                                                    const options = e.target.value.split('\n').filter((o) => o.trim());
                                                                    updateQuestion(question.id, { options });
                                                                }, rows: 4, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" }), (formData.type === 'assessment' || formData.type === 'test') && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Correct Answer(s)" }), _jsx("input", { type: "text", value: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer || '', onChange: (e) => {
                                                                            const answer = e.target.value;
                                                                            updateQuestion(question.id, {
                                                                                correctAnswer: question.type === 'checkbox' ? answer.split(',').map((a) => a.trim()) : answer,
                                                                            });
                                                                        }, placeholder: question.type === 'checkbox' ? 'Comma-separated answers' : 'Correct answer', className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] }))] })), (formData.type === 'assessment' || formData.type === 'test') && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Points" }), _jsx("input", { type: "number", min: "1", value: question.points || 1, onChange: (e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 }), className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" })] })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: question.required, onChange: (e) => updateQuestion(question.id, { required: e.target.checked }), className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Required" })] })] })] }, question.id))), formData.questions.length === 0 && (_jsx("p", { className: "text-gray-400 text-center py-8", children: "No questions added yet. Click \"Add Question\" to get started." }))] }), _jsxs("div", { className: "flex space-x-2 border-t border-gray-700 pt-4", children: [_jsx("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading, className: "flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading || updateMutation.isLoading
                                            ? 'Saving...'
                                            : editingSurvey
                                                ? 'Update Survey'
                                                : 'Create Survey' }), _jsx("button", { type: "button", onClick: () => {
                                            setShowForm(false);
                                            setEditingSurvey(null);
                                            resetForm();
                                        }, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" })] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "All Surveys/Assessments/Tests" }), _jsx("div", { className: "space-y-2", children: surveys?.surveys?.map((survey) => (_jsxs("div", { className: "bg-gray-700 p-4 rounded flex justify-between items-center", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-1", children: [_jsx("span", { className: "text-white font-semibold", children: survey.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${survey.type === 'survey' ? 'bg-blue-900/30 text-blue-300' :
                                                        survey.type === 'assessment' ? 'bg-green-900/30 text-green-300' :
                                                            'bg-purple-900/30 text-purple-300'}`, children: survey.type.toUpperCase() }), survey.isMandatory && (_jsx("span", { className: "text-xs px-2 py-1 rounded bg-red-900/30 text-red-300", children: "Mandatory" }))] }), _jsxs("p", { className: "text-gray-400 text-sm", children: [survey._count?.submissions || 0, " submissions", survey.analytics && ` • Avg Score: ${survey.analytics.averageScore?.toFixed(1) || 'N/A'}%`] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleEdit(survey), className: "px-3 py-1 bg-primary-900/30 text-primary-300 rounded hover:bg-primary-900/50 text-sm", children: "Edit" }), _jsx("button", { onClick: () => {
                                                if (window.confirm('Are you sure you want to delete this survey?')) {
                                                    deleteMutation.mutate(survey.id);
                                                }
                                            }, className: "px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 text-sm", children: "Delete" })] })] }, survey.id))) })] })] }));
}
