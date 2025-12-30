import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// INARA Academy - Course Player Component
// Handles the learning flow: Welcome → Slides → Micro Quizzes → Final Exam → Certification
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
export default function CoursePlayer({ courseId, onComplete, onExit }) {
    const [course, setCourse] = useState(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showMicroQuiz, setShowMicroQuiz] = useState(false);
    const [showFinalExam, setShowFinalExam] = useState(false);
    const [microQuizAnswers, setMicroQuizAnswers] = useState({});
    const [finalExamAnswers, setFinalExamAnswers] = useState({});
    const [microQuizScore, setMicroQuizScore] = useState(null);
    const [finalExamScore, setFinalExamScore] = useState(null);
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
        }
        catch (error) {
            console.error('Failed to load course:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getCurrentSlide = () => {
        if (!course || !course.lessons[currentLessonIndex])
            return null;
        const lesson = course.lessons[currentLessonIndex];
        return lesson.slides[currentSlideIndex] || null;
    };
    const handleNextSlide = () => {
        if (!course)
            return;
        const currentSlide = getCurrentSlide();
        if (currentSlide?.microQuiz && !microQuizAnswers[currentSlide.id]) {
            // Show micro quiz before proceeding
            setShowMicroQuiz(true);
            return;
        }
        const lesson = course.lessons[currentLessonIndex];
        if (currentSlideIndex < lesson.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
        else if (currentLessonIndex < course.lessons.length - 1) {
            setCurrentLessonIndex(currentLessonIndex + 1);
            setCurrentSlideIndex(0);
        }
        else {
            // All slides completed, show final exam
            setShowFinalExam(true);
        }
    };
    const handlePreviousSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
        else if (currentLessonIndex > 0) {
            setCurrentLessonIndex(currentLessonIndex - 1);
            const prevLesson = course?.lessons[currentLessonIndex - 1];
            setCurrentSlideIndex(prevLesson ? prevLesson.slides.length - 1 : 0);
        }
    };
    const handleMicroQuizSubmit = () => {
        const currentSlide = getCurrentSlide();
        if (!currentSlide?.microQuiz)
            return;
        const answers = microQuizAnswers[currentSlide.id];
        if (answers === undefined) {
            alert('Please select an answer');
            return;
        }
        // Calculate score
        const correct = currentSlide.microQuiz.questions.filter((q, idx) => answers === idx && idx === q.correctAnswer).length;
        const score = (correct / currentSlide.microQuiz.questions.length) * 100;
        setMicroQuizScore(score);
        // Check if passed
        if (score >= currentSlide.microQuiz.passingScore || !currentSlide.microQuiz.isRequired) {
            setShowMicroQuiz(false);
            setMicroQuizScore(null);
            handleNextSlide();
        }
        else {
            alert(`You scored ${score.toFixed(0)}%. You need ${currentSlide.microQuiz.passingScore}% to continue. Please review and try again.`);
        }
    };
    const handleFinalExamSubmit = async () => {
        if (!course?.finalExam)
            return;
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
            }
            else {
                alert(`You scored ${score.toFixed(0)}%. You need ${course.finalExam.passingScore}% to pass. Please review and try again.`);
            }
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to submit exam');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-gray-900", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading course..." })] }) }));
    }
    if (!course) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-gray-900", children: _jsxs("div", { className: "text-center text-red-400", children: [_jsx("p", { children: "Failed to load course" }), _jsx("button", { onClick: onExit, className: "mt-4 px-4 py-2 bg-primary-500 text-white rounded", children: "Go Back" })] }) }));
    }
    // Welcome Screen
    if (showWelcome) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-2xl p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: "INARA ACADEMY" }), _jsx("p", { className: "text-xl text-gray-400", children: "Welcome to Your Learning Journey" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: course.title }), _jsx("p", { className: "text-gray-300 mb-6", children: course.description }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-6 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: "Learning Objectives" }), _jsx("ul", { className: "space-y-2", children: course.objectives.map((obj, idx) => (_jsxs("li", { className: "flex items-start text-gray-300", children: [_jsx("span", { className: "text-primary-500 mr-2", children: "\u2713" }), obj] }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm text-gray-400", children: [_jsxs("div", { children: [_jsx("strong", { className: "text-white", children: "Lessons:" }), " ", course.lessons.length] }), _jsxs("div", { children: [_jsx("strong", { className: "text-white", children: "Total Slides:" }), ' ', course.lessons.reduce((sum, l) => sum + l.slides.length, 0)] })] })] }), _jsxs("div", { className: "flex justify-center space-x-4", children: [_jsx("button", { onClick: onExit, className: "px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Exit" }), _jsx("button", { onClick: () => setShowWelcome(false), className: "px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Start Course" })] })] }) }));
    }
    // Micro Quiz Screen
    if (showMicroQuiz) {
        const currentSlide = getCurrentSlide();
        const quiz = currentSlide?.microQuiz;
        if (!quiz)
            return null;
        return (_jsx("div", { className: "min-h-screen bg-gray-900 p-8", children: _jsxs("div", { className: "max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6", children: quiz.title }), quiz.questions.map((q, qIdx) => (_jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-lg text-white mb-4", children: q.question }), _jsx("div", { className: "space-y-2", children: q.options.map((option, optIdx) => (_jsxs("label", { className: `block p-4 rounded-lg cursor-pointer transition-colors ${microQuizAnswers[currentSlide.id] === optIdx
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [_jsx("input", { type: "radio", name: `microquiz-${currentSlide.id}`, value: optIdx, checked: microQuizAnswers[currentSlide.id] === optIdx, onChange: () => setMicroQuizAnswers({ ...microQuizAnswers, [currentSlide.id]: optIdx }), className: "mr-3" }), option] }, optIdx))) })] }, qIdx))), microQuizScore !== null && (_jsx("div", { className: "mb-4 p-4 bg-gray-700 rounded", children: _jsxs("p", { className: "text-white", children: ["Score: ", microQuizScore.toFixed(0), "%", ' ', microQuizScore >= quiz.passingScore ? '✓ Passed' : '✗ Failed'] }) })), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { onClick: () => {
                                    setShowMicroQuiz(false);
                                    setMicroQuizScore(null);
                                }, className: "px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Review Slide" }), _jsx("button", { onClick: handleMicroQuizSubmit, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Submit Answer" })] })] }) }));
    }
    // Final Exam Screen
    if (showFinalExam && course.finalExam) {
        return (_jsx("div", { className: "min-h-screen bg-gray-900 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Final Exam" }), _jsxs("p", { className: "text-gray-400 mb-6", children: ["Pass with ", course.finalExam.passingScore, "% to receive your certificate"] }), course.finalExam.questions.map((q, qIdx) => (_jsxs("div", { className: "mb-8 p-6 bg-gray-700 rounded-lg", children: [_jsxs("p", { className: "text-lg text-white mb-4", children: [qIdx + 1, ". ", q.question] }), _jsx("div", { className: "space-y-2", children: q.options.map((option, optIdx) => (_jsxs("label", { className: `block p-3 rounded-lg cursor-pointer transition-colors ${finalExamAnswers[qIdx] === optIdx
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`, children: [_jsx("input", { type: "radio", name: `exam-${qIdx}`, value: optIdx, checked: finalExamAnswers[qIdx] === optIdx, onChange: () => setFinalExamAnswers({ ...finalExamAnswers, [qIdx]: optIdx }), className: "mr-3" }), option] }, optIdx))) })] }, qIdx))), finalExamScore !== null && (_jsxs("div", { className: "mb-6 p-6 bg-gray-700 rounded-lg", children: [_jsxs("p", { className: "text-2xl font-bold text-white mb-2", children: ["Score: ", finalExamScore.toFixed(0), "%"] }), _jsx("p", { className: "text-gray-300", children: finalExamScore >= course.finalExam.passingScore
                                    ? '✓ Congratulations! You passed!'
                                    : `✗ You need ${course.finalExam.passingScore}% to pass. Please review and try again.` })] })), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx("button", { onClick: () => {
                                    setShowFinalExam(false);
                                    setFinalExamScore(null);
                                }, className: "px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Review Course" }), _jsx("button", { onClick: handleFinalExamSubmit, disabled: submitting || Object.keys(finalExamAnswers).length < course.finalExam.questions.length, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: submitting ? 'Submitting...' : 'Submit Exam' })] })] }) }));
    }
    // Main Course Content (Slides)
    const currentSlide = getCurrentSlide();
    if (!currentSlide)
        return null;
    const progress = ((currentLessonIndex * 100 + (currentSlideIndex + 1) * (100 / course.lessons.length)) /
        (course.lessons.length * 100)) *
        100;
    const resources = course.resources || [];
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-900 flex", children: [_jsxs("div", { className: `flex-1 transition-all ${showSidebar && resources.length > 0 ? 'mr-80' : ''}`, children: [_jsx("div", { className: "bg-gray-800 border-b border-gray-700 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm text-gray-400", children: ["Lesson ", currentLessonIndex + 1, " of ", course.lessons.length] }), _jsxs("div", { className: "flex items-center gap-4", children: [resources.length > 0 && (_jsx("button", { onClick: () => setShowSidebar(!showSidebar), className: "text-sm text-primary-400 hover:text-primary-300", children: showSidebar ? '← Hide Resources' : 'Show Resources →' })), _jsxs("span", { className: "text-sm text-gray-400", children: ["Slide ", currentSlideIndex + 1, " of ", course.lessons[currentLessonIndex].slides.length] })] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-primary-500 h-2 rounded-full transition-all", style: { width: `${progress}%` } }) })] }) }), _jsxs("div", { className: "max-w-5xl mx-auto p-8", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg shadow-xl p-8 mb-6", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-6", children: currentSlide.title }), _jsx("div", { className: "prose prose-invert max-w-none text-gray-200", dangerouslySetInnerHTML: { __html: currentSlide.content } }), currentSlide.mediaUrl && (_jsx("div", { className: "mt-6", children: _jsx("img", { src: currentSlide.mediaUrl, alt: currentSlide.title, className: "rounded-lg" }) }))] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: handlePreviousSlide, disabled: currentLessonIndex === 0 && currentSlideIndex === 0, className: "px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50", children: "\u2190 Previous" }), _jsx("button", { onClick: handleNextSlide, className: "px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600", children: "Next \u2192" })] })] })] }), showSidebar && resources.length > 0 && (_jsxs("div", { className: "fixed right-0 top-0 h-screen w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto z-40", children: [_jsxs("div", { className: "p-4 border-b border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Course Resources" }), _jsx("button", { onClick: () => setShowSidebar(false), className: "text-gray-400 hover:text-white", children: "\u2715" })] }), _jsx("p", { className: "text-xs text-gray-400", children: "Download PDFs, books, and modules related to this course" })] }), _jsx("div", { className: "p-4 space-y-3", children: resources.map((resource) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors", children: [_jsx("div", { className: "flex items-start justify-between mb-2", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-white font-semibold text-sm mb-1", children: resource.title }), resource.description && (_jsx("p", { className: "text-xs text-gray-400 mb-2", children: resource.description })), _jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [_jsx("span", { className: "uppercase", children: resource.fileType }), resource.fileSize && _jsxs("span", { children: ["\u2022 ", formatFileSize(resource.fileSize)] }), resource.isRequired && (_jsx("span", { className: "text-yellow-400", children: "\u2022 Required" }))] })] }) }), _jsx("a", { href: resource.fileUrl, download: resource.fileName, target: "_blank", rel: "noopener noreferrer", className: "block w-full mt-3 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 text-center transition-colors", children: "\uD83D\uDCE5 Download" })] }, resource.id))) })] }))] }));
}
