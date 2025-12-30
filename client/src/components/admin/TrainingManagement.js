import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllTrainingCategories, getTrainingSubcategories } from '../../config/categories';
import CourseResourceManager from './CourseResourceManager';
export default function TrainingManagement() {
    const [showForm, setShowForm] = useState(false);
    const [uploadMode, setUploadMode] = useState('auto'); // 'auto' for file upload, 'text' for paste, 'manual' for legacy
    const [uploadFile, setUploadFile] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [uploading, setUploading] = useState(false);
    const [generationProgress, setGenerationProgress] = useState({
        stage: '',
        percentage: 0,
        message: '',
    });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        duration: 30,
        objectives: [''],
        sections: [{ type: 'section', title: '', content: '' }],
        quiz: { questions: [] },
        passingScore: 70,
        isMandatory: false,
        category: '',
        subcategory: '',
        customCategory: '',
        customSubcategory: '',
        tags: [''],
        validityPeriod: null,
        // INARA Academy manual structure
        lessons: [
            {
                title: '',
                content: '',
                order: 0,
                slides: [
                    {
                        title: '',
                        content: '',
                        order: 0,
                        slideType: 'content',
                        hasMicroQuiz: false,
                        microQuiz: {
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: 0,
                            explanation: '',
                        },
                    },
                ],
            },
        ],
        finalExam: {
            questions: [
                {
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: '',
                },
            ],
            passingScore: 70,
        },
        courseType: 'PROFESSIONAL_COURSE',
        courseDuration: 'SHORT_TERM',
    });
    const availableCategories = getAllTrainingCategories();
    const availableSubcategories = formData.category && formData.category !== 'OTHER' ? getTrainingSubcategories(formData.category) : [];
    const isCustomCategory = formData.category === 'OTHER';
    const isCustomSubcategory = formData.subcategory === 'OTHER';
    const queryClient = useQueryClient();
    const { data: trainings } = useQuery('admin-trainings', async () => {
        const res = await api.get('/admin/trainings');
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/trainings', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-trainings');
            setShowForm(false);
            alert('Training created successfully!');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/admin/trainings/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-trainings');
            alert('Training deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete training');
        },
    });
    const generateFromTextMutation = useMutation(async (data) => {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
            setGenerationProgress((prev) => {
                if (prev.percentage < 90) {
                    const stages = [
                        { stage: 'Analyzing text', percentage: 20, message: 'Processing text content...' },
                        { stage: 'Generating course', percentage: 40, message: 'Creating course structure with AI...' },
                        { stage: 'Creating lessons', percentage: 60, message: 'Building lessons and slides...' },
                        { stage: 'Generating quizzes', percentage: 75, message: 'Creating quizzes and assessments...' },
                        { stage: 'Finalizing', percentage: 85, message: 'Finalizing course structure...' },
                    ];
                    const currentStageIndex = Math.floor((prev.percentage / 20));
                    if (currentStageIndex < stages.length) {
                        return stages[currentStageIndex];
                    }
                    return { ...prev, percentage: Math.min(prev.percentage + 2, 90) };
                }
                return prev;
            });
        }, 2000); // Update every 2 seconds
        try {
            setGenerationProgress({ stage: 'Starting', percentage: 5, message: 'Initializing course generation...' });
            const res = await api.post('/admin/academy/generate-from-text', data);
            clearInterval(progressInterval);
            setGenerationProgress({ stage: 'Complete', percentage: 100, message: 'Course created successfully!' });
            return res.data;
        }
        catch (error) {
            clearInterval(progressInterval);
            setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
            throw error;
        }
    }, {
        onSuccess: (data) => {
            queryClient.invalidateQueries('admin-trainings');
            queryClient.invalidateQueries('academy-courses');
            setTimeout(() => {
                setShowForm(false);
                setTextContent('');
                setGenerationProgress({ stage: '', percentage: 0, message: '' });
                alert(`✅ Course "${data.training.title}" created successfully!\n\n${data.message}`);
            }, 1000);
        },
        onError: (error) => {
            setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
            setTimeout(() => {
                setGenerationProgress({ stage: '', percentage: 0, message: '' });
                alert(error.response?.data?.message || 'Failed to generate course');
            }, 2000);
        },
    });
    const uploadCourseMutation = useMutation(async (formData) => {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
            setGenerationProgress((prev) => {
                if (prev.percentage < 90) {
                    const stages = [
                        { stage: 'Extracting text', percentage: 20, message: 'Reading document content...' },
                        { stage: 'Analyzing content', percentage: 40, message: 'Processing document structure...' },
                        { stage: 'Generating course', percentage: 60, message: 'Creating course structure with AI...' },
                        { stage: 'Creating lessons', percentage: 75, message: 'Building lessons and slides...' },
                        { stage: 'Generating quizzes', percentage: 85, message: 'Creating quizzes and assessments...' },
                    ];
                    const currentStageIndex = Math.floor((prev.percentage / 20));
                    if (currentStageIndex < stages.length) {
                        return stages[currentStageIndex];
                    }
                    return { ...prev, percentage: Math.min(prev.percentage + 2, 90) };
                }
                return prev;
            });
        }, 2000); // Update every 2 seconds
        try {
            setGenerationProgress({ stage: 'Starting', percentage: 5, message: 'Initializing course generation...' });
            const res = await api.post('/admin/academy/upload-course', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            clearInterval(progressInterval);
            setGenerationProgress({ stage: 'Complete', percentage: 100, message: 'Course created successfully!' });
            return res.data;
        }
        catch (error) {
            clearInterval(progressInterval);
            setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
            throw error;
        }
    }, {
        onSuccess: (data) => {
            queryClient.invalidateQueries('admin-trainings');
            queryClient.invalidateQueries('academy-courses');
            setTimeout(() => {
                setShowForm(false);
                setUploadFile(null);
                setGenerationProgress({ stage: '', percentage: 0, message: '' });
                alert(`✅ Course "${data.training.title}" created successfully!\n\n${data.message}`);
            }, 1000);
        },
        onError: (error) => {
            setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
            setTimeout(() => {
                setGenerationProgress({ stage: '', percentage: 0, message: '' });
                alert(error.response?.data?.message || 'Failed to upload course');
            }, 2000);
        },
    });
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            alert('Please select a file');
            return;
        }
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('courseType', document.getElementById('courseType').value);
        formData.append('courseDuration', document.getElementById('courseDuration').value);
        formData.append('isMandatory', document.getElementById('isMandatory').checked.toString());
        formData.append('category', document.getElementById('uploadCategory').value || '');
        formData.append('validityPeriod', document.getElementById('validityPeriod').value || '');
        setUploading(true);
        setGenerationProgress({ stage: 'Starting', percentage: 0, message: 'Preparing to generate course...' });
        uploadCourseMutation.mutate(formData, {
            onSettled: () => {
                setUploading(false);
            },
        });
    };
    const handleTextPaste = async (e) => {
        e.preventDefault();
        if (!textContent.trim()) {
            alert('Please paste or type the training content');
            return;
        }
        const wordCount = textContent.trim().split(/\s+/).length;
        if (wordCount > 100000) {
            alert(`Content is too long (${wordCount} words). Maximum is 100,000 words.`);
            return;
        }
        const submitData = {
            textContent: textContent.trim(),
            courseType: document.getElementById('textCourseType')?.value || 'PROFESSIONAL_COURSE',
            courseDuration: document.getElementById('textCourseDuration')?.value || 'SHORT_TERM',
            isMandatory: document.getElementById('textIsMandatory')?.checked || false,
            category: document.getElementById('textCategory')?.value || '',
            validityPeriod: document.getElementById('textValidityPeriod')?.value || null,
        };
        setUploading(true);
        setGenerationProgress({ stage: 'Starting', percentage: 0, message: 'Preparing to generate course...' });
        generateFromTextMutation.mutate(submitData, {
            onSettled: () => {
                setUploading(false);
            },
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields
        if (!formData.title) {
            alert('Please enter a course title');
            return;
        }
        if (formData.lessons.length === 0) {
            alert('Please add at least one lesson');
            return;
        }
        if (formData.lessons.some(l => !l.title || l.slides.length === 0)) {
            alert('All lessons must have a title and at least one slide');
            return;
        }
        // Prepare data for manual course creation
        const submitData = {
            title: formData.title,
            description: formData.description || '',
            content: JSON.stringify(formData), // Store full structure
            objectives: formData.objectives.filter((o) => o.trim()),
            duration: formData.duration,
            passingScore: formData.finalExam.passingScore,
            quiz: formData.finalExam,
            isMandatory: formData.isMandatory,
            isOptional: !formData.isMandatory,
            category: isCustomCategory ? formData.customCategory : formData.category || undefined,
            subcategory: isCustomSubcategory ? formData.customSubcategory : formData.subcategory || undefined,
            tags: formData.tags.filter((t) => t.trim()),
            sections: {},
            validityPeriod: formData.validityPeriod,
            courseType: formData.courseType,
            courseDuration: formData.courseDuration,
            autoGenerated: false,
            // Include lessons structure for backend processing
            lessons: formData.lessons.map((lesson, lessonIdx) => ({
                title: lesson.title,
                content: lesson.content || '',
                order: lessonIdx,
                slides: lesson.slides.map((slide, slideIdx) => ({
                    title: slide.title,
                    content: slide.content,
                    order: slideIdx,
                    slideType: slide.slideType,
                    microQuiz: slide.hasMicroQuiz ? slide.microQuiz : null,
                })),
            })),
            finalExam: formData.finalExam,
        };
        // Send to manual course creation endpoint
        try {
            setUploading(true);
            const res = await api.post('/admin/academy/create-manual', submitData);
            queryClient.invalidateQueries('admin-trainings');
            queryClient.invalidateQueries('academy-courses');
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                content: '',
                duration: 30,
                objectives: [''],
                sections: [{ type: 'section', title: '', content: '' }],
                quiz: { questions: [] },
                passingScore: 70,
                isMandatory: false,
                category: '',
                subcategory: '',
                customCategory: '',
                customSubcategory: '',
                tags: [''],
                validityPeriod: null,
                lessons: [{
                        title: '',
                        content: '',
                        order: 0,
                        slides: [{
                                title: '',
                                content: '',
                                order: 0,
                                slideType: 'content',
                                hasMicroQuiz: false,
                                microQuiz: {
                                    question: '',
                                    options: ['', '', '', ''],
                                    correctAnswer: 0,
                                    explanation: '',
                                },
                            }],
                    }],
                finalExam: {
                    questions: [{
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: 0,
                            explanation: '',
                        }],
                    passingScore: 70,
                },
                courseType: 'PROFESSIONAL_COURSE',
                courseDuration: 'SHORT_TERM',
            });
            alert(`✅ Course "${res.data.training.title}" created successfully!`);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to create course');
        }
        finally {
            setUploading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "INARA Academy - Course Management" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Upload Word/PDF files to auto-generate interactive courses" })] }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { onClick: () => setShowForm(!showForm), className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: showForm ? 'Cancel' : '+ Upload Course' }) })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: uploadMode === 'auto' ? 'INARA Academy - Upload File' : uploadMode === 'text' ? 'INARA Academy - Paste Text' : 'Manual Course Creation' }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setUploadMode('auto'), className: `px-3 py-1 rounded text-sm ${uploadMode === 'auto'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Upload File" }), _jsx("button", { type: "button", onClick: () => setUploadMode('text'), className: `px-3 py-1 rounded text-sm ${uploadMode === 'text'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Paste Text" }), _jsx("button", { type: "button", onClick: () => setUploadMode('manual'), className: `px-3 py-1 rounded text-sm ${uploadMode === 'manual'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "Manual" })] })] }), uploadMode === 'auto' ? (_jsxs("form", { onSubmit: handleFileUpload, className: "space-y-4", children: [_jsx("div", { className: "bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4", children: _jsxs("p", { className: "text-blue-300 text-sm", children: ["\uD83D\uDCDA ", _jsx("strong", { children: "INARA Academy Auto-Converter:" }), " Upload a Word or PDF file and the system will automatically create an interactive course with slides, micro-quizzes, and a final exam."] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Upload Document (Word/PDF) *" }), _jsx("input", { type: "file", accept: ".pdf,.doc,.docx", onChange: (e) => setUploadFile(e.target.files?.[0] || null), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" }), uploadFile && (_jsxs("p", { className: "text-sm text-gray-400 mt-1", children: ["Selected: ", uploadFile.name] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Course Type *" }), _jsxs("select", { id: "courseType", required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "PROFESSIONAL_COURSE", children: "Professional Course" }), _jsx("option", { value: "MICRO_COURSE", children: "Micro Course" }), _jsx("option", { value: "MANDATORY_COURSE", children: "Mandatory Course" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Duration" }), _jsxs("select", { id: "courseDuration", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "SHORT_TERM", children: "Short-term" }), _jsx("option", { value: "LONG_TERM", children: "Long-term" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category" }), _jsxs("select", { id: "uploadCategory", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Category" }), availableCategories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "isMandatory", className: "text-primary-500" }), _jsx("label", { htmlFor: "isMandatory", className: "text-sm text-gray-200", children: "Mandatory Course" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Validity Period (days)" }), _jsx("input", { type: "number", id: "validityPeriod", placeholder: "Leave empty for no expiry", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }), uploading && generationProgress.percentage > 0 && (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-gray-300 font-medium", children: generationProgress.stage }), _jsxs("span", { className: "text-primary-400 font-bold", children: [generationProgress.percentage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-600 rounded-full h-2.5", children: _jsx("div", { className: "bg-primary-500 h-2.5 rounded-full transition-all duration-500", style: { width: `${generationProgress.percentage}%` } }) }), _jsx("p", { className: "text-xs text-gray-400", children: generationProgress.message }), _jsx("p", { className: "text-xs text-gray-500 italic", children: "This may take 1-3 minutes depending on document size..." })] })), _jsx("button", { type: "submit", disabled: uploading || !uploadFile, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: uploading ? '🔄 Generating Course...' : '🚀 Generate Course from Document' })] })) : uploadMode === 'text' ? (_jsxs("form", { onSubmit: handleTextPaste, className: "space-y-4", children: [_jsx("div", { className: "bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4", children: _jsxs("p", { className: "text-green-300 text-sm", children: ["\uD83D\uDCDD ", _jsx("strong", { children: "Paste Training Content:" }), " Paste your training material directly (supports up to 100,000 words). The system will automatically create an interactive course with slides, micro-quizzes, and a final exam."] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Training Content * (Paste your text here)" }), _jsx("textarea", { value: textContent, onChange: (e) => setTextContent(e.target.value), placeholder: "Paste your training content here... (Supports up to 100,000 words)", required: true, rows: 20, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono text-sm", style: { minHeight: '400px', maxHeight: '600px' } }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsxs("p", { className: "text-xs text-gray-400", children: ["Word count: ", textContent.trim() ? textContent.trim().split(/\s+/).length : 0, " / 100,000"] }), textContent.trim().split(/\s+/).length > 100000 && (_jsx("p", { className: "text-xs text-red-400", children: "\u26A0\uFE0F Content exceeds 100,000 words" }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Course Type *" }), _jsxs("select", { id: "textCourseType", required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "PROFESSIONAL_COURSE", children: "Professional Course" }), _jsx("option", { value: "MICRO_COURSE", children: "Micro Course" }), _jsx("option", { value: "MANDATORY_COURSE", children: "Mandatory Course" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Duration" }), _jsxs("select", { id: "textCourseDuration", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "SHORT_TERM", children: "Short-term" }), _jsx("option", { value: "LONG_TERM", children: "Long-term" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Category" }), _jsxs("select", { id: "textCategory", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "", children: "Select Category" }), availableCategories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "textIsMandatory", className: "text-primary-500" }), _jsx("label", { htmlFor: "textIsMandatory", className: "text-sm text-gray-200", children: "Mandatory Course" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Validity Period (days)" }), _jsx("input", { type: "number", id: "textValidityPeriod", placeholder: "Leave empty for no expiry", className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg" })] })] }), uploading && generationProgress.percentage > 0 && (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-gray-300 font-medium", children: generationProgress.stage }), _jsxs("span", { className: "text-primary-400 font-bold", children: [generationProgress.percentage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-600 rounded-full h-2.5", children: _jsx("div", { className: "bg-primary-500 h-2.5 rounded-full transition-all duration-500", style: { width: `${generationProgress.percentage}%` } }) }), _jsx("p", { className: "text-xs text-gray-400", children: generationProgress.message }), _jsx("p", { className: "text-xs text-gray-500 italic", children: "This may take 1-3 minutes depending on content size..." })] })), _jsx("button", { type: "submit", disabled: uploading || !textContent.trim() || textContent.trim().split(/\s+/).length > 100000, className: "w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50", children: uploading ? '🔄 Generating Course...' : '🚀 Generate Course from Text' })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx("div", { className: "bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4", children: _jsxs("p", { className: "text-blue-300 text-sm", children: ["\uD83D\uDCDD ", _jsx("strong", { children: "Manual Course Creation:" }), " Build your course step-by-step with lessons, slides, and assessments."] }) }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-4", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Course Information" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Course Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", placeholder: "e.g., Introduction to Project Management" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 3, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", placeholder: "Brief description of the course..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Course Type *" }), _jsxs("select", { value: formData.courseType, onChange: (e) => setFormData({ ...formData, courseType: e.target.value }), className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", children: [_jsx("option", { value: "PROFESSIONAL_COURSE", children: "Professional Course" }), _jsx("option", { value: "MICRO_COURSE", children: "Micro Course" }), _jsx("option", { value: "MANDATORY_COURSE", children: "Mandatory Course" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Duration" }), _jsxs("select", { value: formData.courseDuration, onChange: (e) => setFormData({ ...formData, courseDuration: e.target.value }), className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg", children: [_jsx("option", { value: "SHORT_TERM", children: "Short-term" }), _jsx("option", { value: "LONG_TERM", children: "Long-term" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Learning Objectives" }), formData.objectives.map((obj, idx) => (_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: obj, onChange: (e) => {
                                                            const newObjectives = [...formData.objectives];
                                                            newObjectives[idx] = e.target.value;
                                                            setFormData({ ...formData, objectives: newObjectives });
                                                        }, placeholder: `Objective ${idx + 1}`, className: "flex-1 px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg" }), formData.objectives.length > 1 && (_jsx("button", { type: "button", onClick: () => {
                                                            const newObjectives = formData.objectives.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, objectives: newObjectives });
                                                        }, className: "px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: "Remove" }))] }, idx))), _jsx("button", { type: "button", onClick: () => setFormData({ ...formData, objectives: [...formData.objectives, ''] }), className: "mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: "+ Add Objective" })] })] }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Lessons & Slides" }), _jsx("button", { type: "button", onClick: () => {
                                                    const newLessons = [...formData.lessons, {
                                                            title: '',
                                                            content: '',
                                                            order: formData.lessons.length,
                                                            slides: [{
                                                                    title: '',
                                                                    content: '',
                                                                    order: 0,
                                                                    slideType: 'content',
                                                                    hasMicroQuiz: false,
                                                                    microQuiz: {
                                                                        question: '',
                                                                        options: ['', '', '', ''],
                                                                        correctAnswer: 0,
                                                                        explanation: '',
                                                                    },
                                                                }],
                                                        }];
                                                    setFormData({ ...formData, lessons: newLessons });
                                                }, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: "+ Add Lesson" })] }), formData.lessons.map((lesson, lessonIdx) => (_jsxs("div", { className: "bg-gray-600 rounded-lg p-4 space-y-3 border border-gray-500", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h4", { className: "text-white font-semibold", children: ["Lesson ", lessonIdx + 1] }), formData.lessons.length > 1 && (_jsx("button", { type: "button", onClick: () => {
                                                            const newLessons = formData.lessons.filter((_, i) => i !== lessonIdx);
                                                            setFormData({ ...formData, lessons: newLessons });
                                                        }, className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm", children: "Remove Lesson" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Lesson Title *" }), _jsx("input", { type: "text", value: lesson.title, onChange: (e) => {
                                                            const newLessons = [...formData.lessons];
                                                            newLessons[lessonIdx].title = e.target.value;
                                                            setFormData({ ...formData, lessons: newLessons });
                                                        }, required: true, className: "w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg", placeholder: "e.g., Introduction to Concepts" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Lesson Overview" }), _jsx("textarea", { value: lesson.content, onChange: (e) => {
                                                            const newLessons = [...formData.lessons];
                                                            newLessons[lessonIdx].content = e.target.value;
                                                            setFormData({ ...formData, lessons: newLessons });
                                                        }, rows: 2, className: "w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg", placeholder: "Brief overview of this lesson..." })] }), _jsxs("div", { className: "ml-4 space-y-3 border-l-2 border-gray-500 pl-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("label", { className: "text-sm font-medium text-gray-200", children: "Slides" }), _jsx("button", { type: "button", onClick: () => {
                                                                    const newLessons = [...formData.lessons];
                                                                    newLessons[lessonIdx].slides.push({
                                                                        title: '',
                                                                        content: '',
                                                                        order: newLessons[lessonIdx].slides.length,
                                                                        slideType: 'content',
                                                                        hasMicroQuiz: false,
                                                                        microQuiz: {
                                                                            question: '',
                                                                            options: ['', '', '', ''],
                                                                            correctAnswer: 0,
                                                                            explanation: '',
                                                                        },
                                                                    });
                                                                    setFormData({ ...formData, lessons: newLessons });
                                                                }, className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs", children: "+ Add Slide" })] }), lesson.slides.map((slide, slideIdx) => (_jsxs("div", { className: "bg-gray-500 rounded-lg p-3 space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-white text-sm font-medium", children: ["Slide ", slideIdx + 1] }), lesson.slides.length > 1 && (_jsx("button", { type: "button", onClick: () => {
                                                                            const newLessons = [...formData.lessons];
                                                                            newLessons[lessonIdx].slides = newLessons[lessonIdx].slides.filter((_, i) => i !== slideIdx);
                                                                            setFormData({ ...formData, lessons: newLessons });
                                                                        }, className: "px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs", children: "Remove" }))] }), _jsx("input", { type: "text", value: slide.title, onChange: (e) => {
                                                                    const newLessons = [...formData.lessons];
                                                                    newLessons[lessonIdx].slides[slideIdx].title = e.target.value;
                                                                    setFormData({ ...formData, lessons: newLessons });
                                                                }, placeholder: "Slide title", className: "w-full px-3 py-2 bg-gray-400 border border-gray-300 text-white rounded text-sm" }), _jsx("textarea", { value: slide.content, onChange: (e) => {
                                                                    const newLessons = [...formData.lessons];
                                                                    newLessons[lessonIdx].slides[slideIdx].content = e.target.value;
                                                                    setFormData({ ...formData, lessons: newLessons });
                                                                }, rows: 4, placeholder: "Slide content (Markdown/HTML supported)", className: "w-full px-3 py-2 bg-gray-400 border border-gray-300 text-white rounded text-sm" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: slide.hasMicroQuiz, onChange: (e) => {
                                                                            const newLessons = [...formData.lessons];
                                                                            newLessons[lessonIdx].slides[slideIdx].hasMicroQuiz = e.target.checked;
                                                                            setFormData({ ...formData, lessons: newLessons });
                                                                        }, className: "text-primary-500" }), _jsx("label", { className: "text-sm text-gray-200", children: "Add Micro Quiz after this slide" })] }), slide.hasMicroQuiz && (_jsxs("div", { className: "bg-gray-400 rounded p-3 space-y-2 mt-2", children: [_jsx("input", { type: "text", value: slide.microQuiz.question, onChange: (e) => {
                                                                            const newLessons = [...formData.lessons];
                                                                            newLessons[lessonIdx].slides[slideIdx].microQuiz.question = e.target.value;
                                                                            setFormData({ ...formData, lessons: newLessons });
                                                                        }, placeholder: "Quiz question", className: "w-full px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm" }), slide.microQuiz.options.map((opt, optIdx) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: `microQuiz-${lessonIdx}-${slideIdx}`, checked: slide.microQuiz.correctAnswer === optIdx, onChange: () => {
                                                                                    const newLessons = [...formData.lessons];
                                                                                    newLessons[lessonIdx].slides[slideIdx].microQuiz.correctAnswer = optIdx;
                                                                                    setFormData({ ...formData, lessons: newLessons });
                                                                                }, className: "text-primary-500" }), _jsx("input", { type: "text", value: opt, onChange: (e) => {
                                                                                    const newLessons = [...formData.lessons];
                                                                                    newLessons[lessonIdx].slides[slideIdx].microQuiz.options[optIdx] = e.target.value;
                                                                                    setFormData({ ...formData, lessons: newLessons });
                                                                                }, placeholder: `Option ${optIdx + 1}`, className: "flex-1 px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm" })] }, optIdx))), _jsx("input", { type: "text", value: slide.microQuiz.explanation, onChange: (e) => {
                                                                            const newLessons = [...formData.lessons];
                                                                            newLessons[lessonIdx].slides[slideIdx].microQuiz.explanation = e.target.value;
                                                                            setFormData({ ...formData, lessons: newLessons });
                                                                        }, placeholder: "Explanation (optional)", className: "w-full px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm" })] }))] }, slideIdx)))] })] }, lessonIdx)))] }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Final Exam" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-200 mr-2", children: "Passing Score:" }), _jsx("input", { type: "number", value: formData.finalExam.passingScore, onChange: (e) => setFormData({
                                                                    ...formData,
                                                                    finalExam: { ...formData.finalExam, passingScore: parseInt(e.target.value) || 70 },
                                                                }), min: "0", max: "100", className: "w-20 px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded" }), _jsx("span", { className: "text-sm text-gray-400 ml-1", children: "%" })] }), _jsx("button", { type: "button", onClick: () => {
                                                            const newQuestions = [...formData.finalExam.questions, {
                                                                    question: '',
                                                                    options: ['', '', '', ''],
                                                                    correctAnswer: 0,
                                                                    explanation: '',
                                                                }];
                                                            setFormData({
                                                                ...formData,
                                                                finalExam: { ...formData.finalExam, questions: newQuestions },
                                                            });
                                                        }, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: "+ Add Question" })] })] }), formData.finalExam.questions.map((question, qIdx) => (_jsxs("div", { className: "bg-gray-600 rounded-lg p-4 space-y-3 border border-gray-500", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h4", { className: "text-white font-semibold", children: ["Question ", qIdx + 1] }), formData.finalExam.questions.length > 1 && (_jsx("button", { type: "button", onClick: () => {
                                                            const newQuestions = formData.finalExam.questions.filter((_, i) => i !== qIdx);
                                                            setFormData({
                                                                ...formData,
                                                                finalExam: { ...formData.finalExam, questions: newQuestions },
                                                            });
                                                        }, className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm", children: "Remove" }))] }), _jsx("textarea", { value: question.question, onChange: (e) => {
                                                    const newQuestions = [...formData.finalExam.questions];
                                                    newQuestions[qIdx].question = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        finalExam: { ...formData.finalExam, questions: newQuestions },
                                                    });
                                                }, placeholder: "Enter the question", rows: 2, className: "w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg" }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-200", children: "Answer Options (select correct answer)" }), question.options.map((opt, optIdx) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: `finalExam-${qIdx}`, checked: question.correctAnswer === optIdx, onChange: () => {
                                                                    const newQuestions = [...formData.finalExam.questions];
                                                                    newQuestions[qIdx].correctAnswer = optIdx;
                                                                    setFormData({
                                                                        ...formData,
                                                                        finalExam: { ...formData.finalExam, questions: newQuestions },
                                                                    });
                                                                }, className: "text-primary-500" }), _jsx("input", { type: "text", value: opt, onChange: (e) => {
                                                                    const newQuestions = [...formData.finalExam.questions];
                                                                    newQuestions[qIdx].options[optIdx] = e.target.value;
                                                                    setFormData({
                                                                        ...formData,
                                                                        finalExam: { ...formData.finalExam, questions: newQuestions },
                                                                    });
                                                                }, placeholder: `Option ${optIdx + 1}`, className: "flex-1 px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg" })] }, optIdx)))] }), _jsx("input", { type: "text", value: question.explanation, onChange: (e) => {
                                                    const newQuestions = [...formData.finalExam.questions];
                                                    newQuestions[qIdx].explanation = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        finalExam: { ...formData.finalExam, questions: newQuestions },
                                                    });
                                                }, placeholder: "Explanation (optional)", className: "w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg" })] }, qIdx)))] })] }))] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "All Trainings" }), _jsx("div", { className: "space-y-2", children: trainings?.trainings?.map((training) => (_jsx(CourseResourceManager, { training: training }, training.id))) })] })] }));
}
