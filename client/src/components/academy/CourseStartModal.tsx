import { useState } from 'react';

interface CourseStartModalProps {
  course: any;
  onTakeCourse: () => void;
  onTakeAssessment: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function CourseStartModal({
  course,
  onTakeCourse,
  onTakeAssessment,
  onClose,
  isLoading = false,
}: CourseStartModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Start Learning</h2>
          <h3 className="text-lg text-primary-400">{course.title}</h3>
          {course.description && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{course.description}</p>
          )}
        </div>

        {/* Course Info */}
        <div className="bg-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Lessons:</span>
            <span className="text-white font-semibold">{course.lessons?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Duration:</span>
            <span className="text-white font-semibold">{course.duration || 0} minutes</span>
          </div>
          {course.finalExam?.questions?.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Assessment Questions:</span>
              <span className="text-white font-semibold">{course.finalExam.questions.length}</span>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={onTakeCourse}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>📚 Take the Course</span>
            {isLoading && <span className="text-xs">(Loading...)</span>}
          </button>

          {course.finalExam?.questions?.length > 0 && (
            <button
              onClick={onTakeAssessment}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>✍️ Take Assessment Only</span>
            </button>
          )}
        </div>

        {/* Info Text */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 <strong>Take the Course:</strong> Learn through lessons, slides, and micro-quizzes with resources.
          </p>
          {course.finalExam?.questions?.length > 0 && (
            <p className="text-xs text-blue-300 mt-2">
              💡 <strong>Assessment Only:</strong> Skip to the final exam and test your knowledge.
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
