import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
import { getAllTrainingCategories, getTrainingSubcategories } from '../../config/categories';
import CourseResourceManager from './CourseResourceManager';
import BulkLessonImporter from './BulkLessonImporter';
import BulkQuestionImporter from './BulkQuestionImporter';
import BulkObjectiveImporter from './BulkObjectiveImporter';

export default function TrainingManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'auto' | 'manual' | 'text'>('auto'); // 'auto' for file upload, 'text' for paste, 'manual' for legacy
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showBulkLessonImporter, setShowBulkLessonImporter] = useState(false);
  const [showBulkQuestionImporter, setShowBulkQuestionImporter] = useState(false);
  const [showBulkObjectiveImporter, setShowBulkObjectiveImporter] = useState(false);
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
    resources: [],
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

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/trainings', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-trainings');
        setShowForm(false);
        alert('Training created successfully!');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/trainings/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-trainings');
        alert('Training deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete training');
      },
    }
  );

  const generateFromTextMutation = useMutation(
    async (data: any) => {
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
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
        throw error;
      }
    },
    {
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
      onError: (error: any) => {
        setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
        setTimeout(() => {
          setGenerationProgress({ stage: '', percentage: 0, message: '' });
          alert(error.response?.data?.message || 'Failed to generate course');
        }, 2000);
      },
    }
  );

  const uploadCourseMutation = useMutation(
    async (formData: FormData) => {
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
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
        throw error;
      }
    },
    {
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
      onError: (error: any) => {
        setGenerationProgress({ stage: 'Error', percentage: 0, message: 'Generation failed' });
        setTimeout(() => {
          setGenerationProgress({ stage: '', percentage: 0, message: '' });
          alert(error.response?.data?.message || 'Failed to upload course');
        }, 2000);
      },
    }
  );

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('courseType', (document.getElementById('courseType') as HTMLSelectElement).value);
    formData.append('courseDuration', (document.getElementById('courseDuration') as HTMLSelectElement).value);
    formData.append('isMandatory', (document.getElementById('isMandatory') as HTMLInputElement).checked.toString());
    formData.append('category', (document.getElementById('uploadCategory') as HTMLSelectElement).value || '');
    formData.append('validityPeriod', (document.getElementById('validityPeriod') as HTMLInputElement).value || '');

    setUploading(true);
    setGenerationProgress({ stage: 'Starting', percentage: 0, message: 'Preparing to generate course...' });
    uploadCourseMutation.mutate(formData, {
      onSettled: () => {
        setUploading(false);
      },
    });
  };

  const handleTextPaste = async (e: React.FormEvent) => {
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
      courseType: (document.getElementById('textCourseType') as HTMLSelectElement)?.value || 'PROFESSIONAL_COURSE',
      courseDuration: (document.getElementById('textCourseDuration') as HTMLSelectElement)?.value || 'SHORT_TERM',
      isMandatory: (document.getElementById('textIsMandatory') as HTMLInputElement)?.checked || false,
      category: (document.getElementById('textCategory') as HTMLSelectElement)?.value || '',
      validityPeriod: (document.getElementById('textValidityPeriod') as HTMLInputElement)?.value || null,
    };

    setUploading(true);
    setGenerationProgress({ stage: 'Starting', percentage: 0, message: 'Preparing to generate course...' });
    generateFromTextMutation.mutate(submitData, {
      onSettled: () => {
        setUploading(false);
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title) {
      alert('Please enter a course title');
      return;
    }

    // Clean up blank lessons and slides
    const cleanedLessons = formData.lessons
      .filter((lesson) => lesson.title && lesson.title.trim()) // Remove blank lessons
      .map((lesson) => ({
        ...lesson,
        slides: lesson.slides.filter((slide) => slide.title && slide.title.trim()), // Remove blank slides
      }))
      .filter((lesson) => lesson.slides.length > 0); // Remove lessons with no slides

    if (cleanedLessons.length === 0) {
      alert('Please add at least one lesson with a title and at least one slide');
      return;
    }

    // Clean up objectives and questions
    const cleanedObjectives = formData.objectives.filter((o) => o.trim());
    const cleanedQuestions = formData.finalExam.questions.filter((q) => q.question && q.question.trim());

    // Prepare data for manual course creation/update
    const submitData: any = {
      title: formData.title,
      description: formData.description || '',
      content: JSON.stringify(formData), // Store full structure
      objectives: cleanedObjectives,
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
      // Include lessons structure for backend processing (use cleaned lessons)
      lessons: cleanedLessons.map((lesson, lessonIdx) => ({
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
      finalExam: {
        ...formData.finalExam,
        questions: cleanedQuestions, // Use cleaned questions
      },
    };

    // Send to manual course creation or update endpoint
    try {
      setUploading(true);
      let res;
      
      if (editingCourseId) {
        // Update existing course
        res = await api.patch(`/admin/academy/courses/${editingCourseId}`, submitData);
        alert('✅ Course updated successfully!');
      } else {
        // Create new course
        res = await api.post('/admin/academy/create-manual', submitData);
        alert('✅ Course created successfully!');
      }
      
      queryClient.invalidateQueries('admin-trainings');
      queryClient.invalidateQueries('academy-courses');
      setShowForm(false);
      setEditingCourseId(null);
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create course');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">INARA Academy - Course Management</h2>
          <p className="text-gray-400 text-sm mt-1">Upload Word/PDF files to auto-generate interactive courses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            {showForm ? 'Cancel' : '+ Upload Course'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {uploadMode === 'auto' ? 'INARA Academy - Upload File' : uploadMode === 'text' ? 'INARA Academy - Paste Text' : 'Manual Course Creation'}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('auto')}
                className={`px-3 py-1 rounded text-sm ${
                  uploadMode === 'auto'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`px-3 py-1 rounded text-sm ${
                  uploadMode === 'text'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('manual')}
                className={`px-3 py-1 rounded text-sm ${
                  uploadMode === 'manual'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {uploadMode === 'auto' ? (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-blue-300 text-sm">
                  📚 <strong>INARA Academy Auto-Converter:</strong> Upload a Word or PDF file and the system will
                  automatically create an interactive course with slides, micro-quizzes, and a final exam.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Upload Document (Word/PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-400 mt-1">Selected: {uploadFile.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Course Type *</label>
                  <select
                    id="courseType"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="PROFESSIONAL_COURSE">Professional Course</option>
                    <option value="MICRO_COURSE">Micro Course</option>
                    <option value="MANDATORY_COURSE">Mandatory Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Duration</label>
                  <select
                    id="courseDuration"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="SHORT_TERM">Short-term</option>
                    <option value="LONG_TERM">Long-term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                <select
                  id="uploadCategory"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isMandatory"
                    className="text-primary-500"
                  />
                  <label htmlFor="isMandatory" className="text-sm text-gray-200">
                    Mandatory Course
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Validity Period (days)
                  </label>
                  <input
                    type="number"
                    id="validityPeriod"
                    placeholder="Leave empty for no expiry"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
              </div>

              {/* Progress Indicator */}
              {uploading && generationProgress.percentage > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium">{generationProgress.stage}</span>
                    <span className="text-primary-400 font-bold">{generationProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div
                      className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{generationProgress.message}</p>
                  <p className="text-xs text-gray-500 italic">
                    This may take 1-3 minutes depending on document size...
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {uploading ? '🔄 Generating Course...' : '🚀 Generate Course from Document'}
              </button>
            </form>
          ) : uploadMode === 'text' ? (
            <form onSubmit={handleTextPaste} className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-green-300 text-sm">
                  📝 <strong>Paste Training Content:</strong> Paste your training material directly (supports up to 100,000 words).
                  The system will automatically create an interactive course with slides, micro-quizzes, and a final exam.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Training Content * (Paste your text here)
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your training content here... (Supports up to 100,000 words)"
                  required
                  rows={20}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono text-sm"
                  style={{ minHeight: '400px', maxHeight: '600px' }}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">
                    Word count: {textContent.trim() ? textContent.trim().split(/\s+/).length : 0} / 100,000
                  </p>
                  {textContent.trim().split(/\s+/).length > 100000 && (
                    <p className="text-xs text-red-400">⚠️ Content exceeds 100,000 words</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Course Type *</label>
                  <select
                    id="textCourseType"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="PROFESSIONAL_COURSE">Professional Course</option>
                    <option value="MICRO_COURSE">Micro Course</option>
                    <option value="MANDATORY_COURSE">Mandatory Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Duration</label>
                  <select
                    id="textCourseDuration"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  >
                    <option value="SHORT_TERM">Short-term</option>
                    <option value="LONG_TERM">Long-term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                <select
                  id="textCategory"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Select Category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="textIsMandatory"
                    className="text-primary-500"
                  />
                  <label htmlFor="textIsMandatory" className="text-sm text-gray-200">
                    Mandatory Course
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Validity Period (days)
                  </label>
                  <input
                    type="number"
                    id="textValidityPeriod"
                    placeholder="Leave empty for no expiry"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                  />
                </div>
              </div>

              {/* Progress Indicator */}
              {uploading && generationProgress.percentage > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium">{generationProgress.stage}</span>
                    <span className="text-primary-400 font-bold">{generationProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div
                      className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{generationProgress.message}</p>
                  <p className="text-xs text-gray-500 italic">
                    This may take 1-3 minutes depending on content size...
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !textContent.trim() || textContent.trim().split(/\s+/).length > 100000}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {uploading ? '🔄 Generating Course...' : '🚀 Generate Course from Text'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-blue-300 text-sm">
                  📝 <strong>Manual Course Creation:</strong> Build your course step-by-step with lessons, slides, and assessments.
                </p>
              </div>

              {/* Basic Course Info */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Course Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Course Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                    placeholder="e.g., Introduction to Project Management"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                    placeholder="Brief description of the course..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Course Type *</label>
                    <select
                      value={formData.courseType}
                      onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                    >
                      <option value="PROFESSIONAL_COURSE">Professional Course</option>
                      <option value="MICRO_COURSE">Micro Course</option>
                      <option value="MANDATORY_COURSE">Mandatory Course</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Duration</label>
                    <select
                      value={formData.courseDuration}
                      onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                    >
                      <option value="SHORT_TERM">Short-term</option>
                      <option value="LONG_TERM">Long-term</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Learning Objectives</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setShowBulkObjectiveImporter(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      📦 Bulk Import
                    </button>
                  </div>

                  {showBulkObjectiveImporter && (
                    <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4 mb-4">
                      <BulkObjectiveImporter
                        onImport={(importedObjectives) => {
                          // Filter out empty strings from imported objectives
                          const cleanedObjectives = importedObjectives.filter((obj: string) => obj.trim());
                          setFormData({
                            ...formData,
                            objectives: cleanedObjectives.length > 0 ? cleanedObjectives : [''],
                          });
                          setShowBulkObjectiveImporter(false);
                        }}
                        onCancel={() => setShowBulkObjectiveImporter(false)}
                      />
                    </div>
                  )}

                  {formData.objectives.map((obj, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => {
                          const newObjectives = [...formData.objectives];
                          newObjectives[idx] = e.target.value;
                          setFormData({ ...formData, objectives: newObjectives });
                        }}
                        placeholder={`Objective ${idx + 1}`}
                        className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg"
                      />
                      {formData.objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newObjectives = formData.objectives.filter((_, i) => i !== idx);
                            setFormData({ ...formData, objectives: newObjectives });
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, objectives: [...formData.objectives, ''] })}
                    className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                  >
                    + Add Objective
                  </button>
                </div>
              </div>

              {/* Lessons & Slides */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Lessons & Slides</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkLessonImporter(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      📦 Bulk Import Lessons
                    </button>
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </div>

                {showBulkLessonImporter && (
                  <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4">
                    <BulkLessonImporter
                      onImport={(importedLessons) => {
                        // Replace default lessons with imported ones
                        // Add missing fields to match form structure
                        const newLessons = importedLessons.map((lesson, idx) => ({
                          title: lesson.title,
                          content: lesson.content,
                          order: idx,
                          slides: lesson.slides.map((slide: any, slideIdx: number) => ({
                            title: slide.title,
                            content: slide.content,
                            order: slideIdx,
                            slideType: 'content',
                            hasMicroQuiz: false,
                            microQuiz: {
                              question: '',
                              options: ['', '', '', ''],
                              correctAnswer: 0,
                              explanation: '',
                            },
                          })),
                        }));
                        setFormData({ ...formData, lessons: newLessons });
                        setShowBulkLessonImporter(false);
                      }}
                      onCancel={() => setShowBulkLessonImporter(false)}
                    />
                  </div>
                )}

                {formData.lessons.map((lesson, lessonIdx) => (
                  <div key={lessonIdx} className="bg-gray-600 rounded-lg p-4 space-y-3 border border-gray-500">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-semibold">Lesson {lessonIdx + 1}</h4>
                      {formData.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLessons = formData.lessons.filter((_, i) => i !== lessonIdx);
                            setFormData({ ...formData, lessons: newLessons });
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Remove Lesson
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Lesson Title *</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => {
                          const newLessons = [...formData.lessons];
                          newLessons[lessonIdx].title = e.target.value;
                          setFormData({ ...formData, lessons: newLessons });
                        }}
                        required
                        className="w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg"
                        placeholder="e.g., Introduction to Concepts"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Lesson Overview</label>
                      <textarea
                        value={lesson.content}
                        onChange={(e) => {
                          const newLessons = [...formData.lessons];
                          newLessons[lessonIdx].content = e.target.value;
                          setFormData({ ...formData, lessons: newLessons });
                        }}
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg"
                        placeholder="Brief overview of this lesson..."
                      />
                    </div>

                    {/* Slides */}
                    <div className="ml-4 space-y-3 border-l-2 border-gray-500 pl-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-200">Slides</label>
                        <button
                          type="button"
                          onClick={() => {
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
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          + Add Slide
                        </button>
                      </div>

                      {lesson.slides.map((slide, slideIdx) => (
                        <div key={slideIdx} className="bg-gray-500 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white text-sm font-medium">Slide {slideIdx + 1}</span>
                            {lesson.slides.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newLessons = [...formData.lessons];
                                  newLessons[lessonIdx].slides = newLessons[lessonIdx].slides.filter((_, i) => i !== slideIdx);
                                  setFormData({ ...formData, lessons: newLessons });
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const newLessons = [...formData.lessons];
                              newLessons[lessonIdx].slides[slideIdx].title = e.target.value;
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            placeholder="Slide title"
                            className="w-full px-3 py-2 bg-gray-400 border border-gray-300 text-white rounded text-sm"
                          />

                          <textarea
                            value={slide.content}
                            onChange={(e) => {
                              const newLessons = [...formData.lessons];
                              newLessons[lessonIdx].slides[slideIdx].content = e.target.value;
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            rows={4}
                            placeholder="Slide content (Markdown/HTML supported)"
                            className="w-full px-3 py-2 bg-gray-400 border border-gray-300 text-white rounded text-sm"
                          />

                          {/* Micro Quiz Toggle */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={slide.hasMicroQuiz}
                              onChange={(e) => {
                                const newLessons = [...formData.lessons];
                                newLessons[lessonIdx].slides[slideIdx].hasMicroQuiz = e.target.checked;
                                setFormData({ ...formData, lessons: newLessons });
                              }}
                              className="text-primary-500"
                            />
                            <label className="text-sm text-gray-200">Add Micro Quiz after this slide</label>
                          </div>

                          {/* Micro Quiz Form */}
                          {slide.hasMicroQuiz && (
                            <div className="bg-gray-400 rounded p-3 space-y-2 mt-2">
                              <input
                                type="text"
                                value={slide.microQuiz.question}
                                onChange={(e) => {
                                  const newLessons = [...formData.lessons];
                                  newLessons[lessonIdx].slides[slideIdx].microQuiz.question = e.target.value;
                                  setFormData({ ...formData, lessons: newLessons });
                                }}
                                placeholder="Quiz question"
                                className="w-full px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm"
                              />
                              {slide.microQuiz.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`microQuiz-${lessonIdx}-${slideIdx}`}
                                    checked={slide.microQuiz.correctAnswer === optIdx}
                                    onChange={() => {
                                      const newLessons = [...formData.lessons];
                                      newLessons[lessonIdx].slides[slideIdx].microQuiz.correctAnswer = optIdx;
                                      setFormData({ ...formData, lessons: newLessons });
                                    }}
                                    className="text-primary-500"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newLessons = [...formData.lessons];
                                      newLessons[lessonIdx].slides[slideIdx].microQuiz.options[optIdx] = e.target.value;
                                      setFormData({ ...formData, lessons: newLessons });
                                    }}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="flex-1 px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm"
                                  />
                                </div>
                              ))}
                              <input
                                type="text"
                                value={slide.microQuiz.explanation}
                                onChange={(e) => {
                                  const newLessons = [...formData.lessons];
                                  newLessons[lessonIdx].slides[slideIdx].microQuiz.explanation = e.target.value;
                                  setFormData({ ...formData, lessons: newLessons });
                                }}
                                placeholder="Explanation (optional)"
                                className="w-full px-3 py-2 bg-gray-300 border border-gray-200 text-gray-900 rounded text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Course Resources - Document Upload */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">📄 Course Resources</h3>
                  <p className="text-sm text-gray-300 mb-4">Upload reference documents (PDFs, guides, materials) for trainees to download during the course.</p>
                  
                  <div className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      id="resourceUpload"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newResources = [...formData.resources];
                          for (let i = 0; i < e.target.files.length; i++) {
                            const file = e.target.files[i];
                            // Check file size (max 4MB per file)
                            if (file.size > 4 * 1024 * 1024) {
                              alert(`File "${file.name}" exceeds 4MB limit. Please use a smaller file.`);
                              continue;
                            }
                            newResources.push({
                              name: file.name,
                              size: file.size,
                              file: file,
                            });
                          }
                          setFormData({ ...formData, resources: newResources });
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="resourceUpload" className="cursor-pointer block">
                      <p className="text-primary-400 font-semibold mb-2">📁 Click to upload resources</p>
                      <p className="text-xs text-gray-400">or drag and drop (PDF, DOC, XLSX, TXT)</p>
                      <p className="text-xs text-gray-500 mt-1">Max 4MB per file</p>
                    </label>
                  </div>

                  {formData.resources.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-white font-semibold text-sm">Uploaded Resources ({formData.resources.length})</h4>
                      {formData.resources.map((resource: any, idx: number) => (
                        <div key={idx} className="bg-gray-600 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{resource.name || resource.fileName}</p>
                            <p className="text-gray-400 text-xs">{((resource.size || 0) / 1024).toFixed(2)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newResources = formData.resources.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, resources: newResources });
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Final Exam */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Final Exam</h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm text-gray-200 mr-2">Passing Score:</label>
                      <input
                        type="number"
                        value={formData.finalExam.passingScore}
                        onChange={(e) => setFormData({
                          ...formData,
                          finalExam: { ...formData.finalExam, passingScore: parseInt(e.target.value) || 70 },
                        })}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 text-white rounded"
                      />
                      <span className="text-sm text-gray-400 ml-1">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBulkQuestionImporter(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      📦 Bulk Import
                    </button>
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>

                {showBulkQuestionImporter && (
                  <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4">
                    <BulkQuestionImporter
                      onImport={(importedQuestions) => {
                        // Replace default questions with imported ones
                        const cleanedQuestions = importedQuestions.filter((q: any) => q.question && q.question.trim());
                        setFormData({
                          ...formData,
                          finalExam: { ...formData.finalExam, questions: cleanedQuestions.length > 0 ? cleanedQuestions : [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }] },
                        });
                        setShowBulkQuestionImporter(false);
                      }}
                      onCancel={() => setShowBulkQuestionImporter(false)}
                    />
                  </div>
                )}

                {formData.finalExam.questions.map((question, qIdx) => (
                  <div key={qIdx} className="bg-gray-600 rounded-lg p-4 space-y-3 border border-gray-500">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-semibold">Question {qIdx + 1}</h4>
                      {formData.finalExam.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newQuestions = formData.finalExam.questions.filter((_, i) => i !== qIdx);
                            setFormData({
                              ...formData,
                              finalExam: { ...formData.finalExam, questions: newQuestions },
                            });
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <textarea
                      value={question.question}
                      onChange={(e) => {
                        const newQuestions = [...formData.finalExam.questions];
                        newQuestions[qIdx].question = e.target.value;
                        setFormData({
                          ...formData,
                          finalExam: { ...formData.finalExam, questions: newQuestions },
                        });
                      }}
                      placeholder="Enter the question"
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">Answer Options (select correct answer)</label>
                      {question.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`finalExam-${qIdx}`}
                            checked={question.correctAnswer === optIdx}
                            onChange={() => {
                              const newQuestions = [...formData.finalExam.questions];
                              newQuestions[qIdx].correctAnswer = optIdx;
                              setFormData({
                                ...formData,
                                finalExam: { ...formData.finalExam, questions: newQuestions },
                              });
                            }}
                            className="text-primary-500"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newQuestions = [...formData.finalExam.questions];
                              newQuestions[qIdx].options[optIdx] = e.target.value;
                              setFormData({
                                ...formData,
                                finalExam: { ...formData.finalExam, questions: newQuestions },
                              });
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={question.explanation}
                      onChange={(e) => {
                        const newQuestions = [...formData.finalExam.questions];
                        newQuestions[qIdx].explanation = e.target.value;
                        setFormData({
                          ...formData,
                          finalExam: { ...formData.finalExam, questions: newQuestions },
                        });
                      }}
                      placeholder="Explanation (optional)"
                      className="w-full px-4 py-2 bg-gray-500 border border-gray-400 text-white rounded-lg"
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t border-gray-600">
                <button
                  type="submit"
                  disabled={!formData.title.trim() || formData.lessons.length === 0}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                >
                  {editingCourseId ? '✏️ Update Course' : '✅ Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCourseId(null);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Trainings</h3>
        <div className="space-y-2">
          {trainings?.trainings?.map((training: any) => (
            <CourseResourceManager 
              key={training.id} 
              training={training}
              onEdit={(course) => {
                setFormData({
                  ...formData,
                  title: course.title || '',
                  description: course.description || '',
                  duration: course.duration || 30,
                  objectives: course.objectives || [''],
                  category: course.category || '',
                  subcategory: course.subcategory || '',
                  isMandatory: course.isMandatory || false,
                  lessons: course.lessons || [{ title: '', content: '', order: 0, slides: [{ title: '', content: '', order: 0, slideType: 'content', hasMicroQuiz: false, microQuiz: { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' } }] }],
                  finalExam: course.finalExam || { questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }], passingScore: 70 },
                  courseType: course.courseType || 'PROFESSIONAL_COURSE',
                  courseDuration: course.courseDuration || 'SHORT_TERM',
                });
                setEditingCourseId(course.id);
                setUploadMode('manual');
                setShowForm(true);
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

