// INARA Academy - Course Player Component
// Handles the learning flow: Welcome → Slides → Micro Quizzes → Final Exam → Certification

import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Slide {
  id: string;
  title: string;
  content: string;
  order: number;
  slideType: string;
  mediaUrl?: string;
  microQuiz?: {
    id: string;
    title: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    passingScore: number;
    isRequired: boolean;
  };
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  content?: string;
  slides: Slide[];
}

interface CourseResource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  resourceType: string;
  isRequired: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  lessons: Lesson[];
  resources?: CourseResource[];
  finalExam?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    passingScore: number;
  };
}

interface CoursePlayerProps {
  courseId: string;
  onComplete: () => void;
  onExit: () => void;
}

export default function CoursePlayer({ courseId, onComplete, onExit }: CoursePlayerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showMicroQuiz, setShowMicroQuiz] = useState(false);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [microQuizAnswers, setMicroQuizAnswers] = useState<{ [key: string]: number }>({});
  const [finalExamAnswers, setFinalExamAnswers] = useState<{ [key: number]: number }>({});
  const [microQuizScore, setMicroQuizScore] = useState<number | null>(null);
  const [finalExamScore, setFinalExamScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await api.get(`/academy/courses/${courseId}`);
      setCourse(res.data.course);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSlide = (): Slide | null => {
    if (!course || !course.lessons[currentLessonIndex]) return null;
    const lesson = course.lessons[currentLessonIndex];
    return lesson.slides[currentSlideIndex] || null;
  };

  const handleNextSlide = () => {
    if (!course) return;

    const currentSlide = getCurrentSlide();
    if (currentSlide?.microQuiz && !microQuizAnswers[currentSlide.id]) {
      // Show micro quiz before proceeding
      setShowMicroQuiz(true);
      return;
    }

    const lesson = course.lessons[currentLessonIndex];
    if (currentSlideIndex < lesson.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (currentLessonIndex < course.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentSlideIndex(0);
    } else {
      // All slides completed, show final exam
      setShowFinalExam(true);
    }
  };

  const handlePreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      const prevLesson = course?.lessons[currentLessonIndex - 1];
      setCurrentSlideIndex(prevLesson ? prevLesson.slides.length - 1 : 0);
    }
  };

  const handleMicroQuizSubmit = () => {
    const currentSlide = getCurrentSlide();
    if (!currentSlide?.microQuiz) return;

    const answers = microQuizAnswers[currentSlide.id];
    if (answers === undefined) {
      alert('Please select an answer');
      return;
    }

    // Calculate score
    const correct = currentSlide.microQuiz.questions.filter(
      (q, idx) => answers === idx && idx === q.correctAnswer
    ).length;
    const score = (correct / currentSlide.microQuiz.questions.length) * 100;
    setMicroQuizScore(score);

    // Check if passed
    if (score >= currentSlide.microQuiz.passingScore || !currentSlide.microQuiz.isRequired) {
      setShowMicroQuiz(false);
      setMicroQuizScore(null);
      handleNextSlide();
    } else {
      alert(`You scored ${score.toFixed(0)}%. You need ${currentSlide.microQuiz.passingScore}% to continue. Please review and try again.`);
    }
  };

  const handleFinalExamSubmit = async () => {
    if (!course?.finalExam) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      course.finalExam.questions.forEach((q, idx) => {
        if (finalExamAnswers[idx] === q.correctAnswer) {
          correct++;
        }
      });
      const score = (correct / course.finalExam.questions.length) * 100;
      setFinalExamScore(score);

      // Submit completion
      const res = await api.post(`/academy/courses/${courseId}/complete`, {
        finalExamAnswers,
        score,
        passed: score >= course.finalExam.passingScore,
      });

      if (res.data.passed) {
        // Show certificate generation form
        // This will be handled by parent component
        onComplete();
      } else {
        alert(`You scored ${score.toFixed(0)}%. You need ${course.finalExam.passingScore}% to pass. Please review and try again.`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-red-400">
          <p>Failed to load course</p>
          <button onClick={onExit} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">INARA ACADEMY</h1>
            <p className="text-xl text-gray-400">Welcome to Your Learning Journey</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{course.title}</h2>
            <p className="text-gray-300 mb-6">{course.description}</p>

            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Learning Objectives</h3>
              <ul className="space-y-2">
                {course.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start text-gray-300">
                    <span className="text-primary-500 mr-2">✓</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-white">Lessons:</strong> {course.lessons.length}
              </div>
              <div>
                <strong className="text-white">Total Slides:</strong>{' '}
                {course.lessons.reduce((sum, l) => sum + l.slides.length, 0)}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onExit}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Exit
            </button>
            <button
              onClick={() => setShowWelcome(false)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Start Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Micro Quiz Screen
  if (showMicroQuiz) {
    const currentSlide = getCurrentSlide();
    const quiz = currentSlide?.microQuiz;
    if (!quiz) return null;

    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">{quiz.title}</h2>

          {quiz.questions.map((q, qIdx) => (
            <div key={qIdx} className="mb-6">
              <p className="text-lg text-white mb-4">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`block p-4 rounded-lg cursor-pointer transition-colors ${
                      microQuizAnswers[currentSlide!.id] === optIdx
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`microquiz-${currentSlide!.id}`}
                      value={optIdx}
                      checked={microQuizAnswers[currentSlide!.id] === optIdx}
                      onChange={() =>
                        setMicroQuizAnswers({ ...microQuizAnswers, [currentSlide!.id]: optIdx })
                      }
                      className="mr-3"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {microQuizScore !== null && (
            <div className="mb-4 p-4 bg-gray-700 rounded">
              <p className="text-white">
                Score: {microQuizScore.toFixed(0)}%{' '}
                {microQuizScore >= quiz.passingScore ? '✓ Passed' : '✗ Failed'}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowMicroQuiz(false);
                setMicroQuizScore(null);
              }}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Review Slide
            </button>
            <button
              onClick={handleMicroQuizSubmit}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Final Exam Screen
  if (showFinalExam && course.finalExam) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Final Exam</h2>
          <p className="text-gray-400 mb-6">
            Pass with {course.finalExam.passingScore}% to receive your certificate
          </p>

          {course.finalExam.questions.map((q, qIdx) => (
            <div key={qIdx} className="mb-8 p-6 bg-gray-700 rounded-lg">
              <p className="text-lg text-white mb-4">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`block p-3 rounded-lg cursor-pointer transition-colors ${
                      finalExamAnswers[qIdx] === optIdx
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`exam-${qIdx}`}
                      value={optIdx}
                      checked={finalExamAnswers[qIdx] === optIdx}
                      onChange={() => setFinalExamAnswers({ ...finalExamAnswers, [qIdx]: optIdx })}
                      className="mr-3"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {finalExamScore !== null && (
            <div className="mb-6 p-6 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-white mb-2">
                Score: {finalExamScore.toFixed(0)}%
              </p>
              <p className="text-gray-300">
                {finalExamScore >= course.finalExam.passingScore
                  ? '✓ Congratulations! You passed!'
                  : `✗ You need ${course.finalExam.passingScore}% to pass. Please review and try again.`}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowFinalExam(false);
                setFinalExamScore(null);
              }}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Review Course
            </button>
            <button
              onClick={handleFinalExamSubmit}
              disabled={submitting || Object.keys(finalExamAnswers).length < course.finalExam.questions.length}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Course Content (Slides)
  const currentSlide = getCurrentSlide();
  if (!currentSlide) return null;

  const progress =
    ((currentLessonIndex * 100 + (currentSlideIndex + 1) * (100 / course.lessons.length)) /
      (course.lessons.length * 100)) *
    100;

  const resources = course.resources || [];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all ${showSidebar && resources.length > 0 ? 'mr-80' : ''}`}>
        {/* Progress Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Lesson {currentLessonIndex + 1} of {course.lessons.length}
              </span>
              <div className="flex items-center gap-4">
                {resources.length > 0 && (
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    {showSidebar ? '← Hide Resources' : 'Show Resources →'}
                  </button>
                )}
                <span className="text-sm text-gray-400">
                  Slide {currentSlideIndex + 1} of {course.lessons[currentLessonIndex].slides.length}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <div className="max-w-5xl mx-auto p-8">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-white mb-6">{currentSlide.title}</h2>
            <div
              className="prose prose-invert max-w-none text-gray-200"
              dangerouslySetInnerHTML={{ __html: currentSlide.content }}
            />
            {currentSlide.mediaUrl && (
              <div className="mt-6">
                <img src={currentSlide.mediaUrl} alt={currentSlide.title} className="rounded-lg" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePreviousSlide}
              disabled={currentLessonIndex === 0 && currentSlideIndex === 0}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextSlide}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Resources Sidebar */}
      {showSidebar && resources.length > 0 && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto z-40">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Course Resources</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Download PDFs, books, and modules related to this course
            </p>
          </div>

          <div className="p-4 space-y-3">
            {resources.map((resource: any) => (
              <div
                key={resource.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm mb-1">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-xs text-gray-400 mb-2">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="uppercase">{resource.fileType}</span>
                      {resource.fileSize && <span>• {formatFileSize(resource.fileSize)}</span>}
                      {resource.isRequired && (
                        <span className="text-yellow-400">• Required</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={resource.fileUrl}
                  download={resource.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mt-3 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 text-center transition-colors"
                >
                  📥 Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

