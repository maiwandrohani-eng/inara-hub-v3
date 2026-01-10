// INARA ACADEMY - Official Learning & Certification Platform
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CoursePlayer from '../../components/academy/CoursePlayer';
import CourseStartModal from '../../components/academy/CourseStartModal';
import CertificateGenerator from '../../components/academy/CertificateGenerator';

export default function TrainingTab() {
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'completed' | 'in-progress' | 'tracks'>('all');
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courseStartMode, setCourseStartMode] = useState<'course' | 'assessment' | null>(null);
  const [showCourseStartModal, setShowCourseStartModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<any>(null);
  const [showCertificates, setShowCertificates] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'DEPARTMENT_HEAD';

  // Fetch courses from Academy API
  const { data, isLoading } = useQuery('academy-courses', async () => {
    const res = await api.get('/academy/courses');
    return res.data;
  });

  const { data: certificatesData } = useQuery('my-certificates', async () => {
    const res = await api.get('/academy/certificates');
    return res.data;
  });

  const startMutation = useMutation(
    async (courseId: string) => {
      const res = await api.post(`/academy/courses/${courseId}/start`);
      return res.data;
    },
    {
      onSuccess: (data, courseId) => {
        setSelectedCourse(courseId);
        setShowCourseStartModal(false);
        queryClient.invalidateQueries('academy-courses');
      },
    }
  );

  const allCourses = data?.courses || [];
  const certificates = certificatesData?.certificates || [];

  // Extract course types and categories
  const { courseTypes, categories } = useMemo(() => {
    const types = new Set<string>();
    const cats = new Set<string>();
    allCourses.forEach((course: any) => {
      if (course.courseType) types.add(course.courseType);
      if (course.category) cats.add(course.category);
    });
    return {
      courseTypes: Array.from(types).sort(),
      categories: Array.from(cats).sort(),
    };
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course: any) => {
      const completion = course.completions?.[0];

      // Status filter
      if (filter === 'mandatory' && !course.isMandatory) return false;
      if (filter === 'completed' && completion?.status !== 'COMPLETED') return false;
      if (filter === 'in-progress' && completion?.status !== 'IN_PROGRESS') return false;
      if (filter === 'tracks' && !course.track) return false;

      // Course type filter
      if (courseTypeFilter !== 'all' && course.courseType !== courseTypeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && course.category !== categoryFilter) return false;

      return true;
    });
  }, [allCourses, filter, courseTypeFilter, categoryFilter]);

  const getCourseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      MICRO_COURSE: 'Micro Course',
      MANDATORY_COURSE: 'Mandatory Course',
      PROFESSIONAL_COURSE: 'Professional Course',
      DIPLOMA_TRACK: 'Diploma Track',
      LEADERSHIP_TRACK: 'Leadership Track',
    };
    return labels[type] || type;
  };

  const getCourseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      MICRO_COURSE: 'bg-blue-500/20 text-blue-300',
      MANDATORY_COURSE: 'bg-red-500/20 text-red-300',
      PROFESSIONAL_COURSE: 'bg-green-500/20 text-green-300',
      DIPLOMA_TRACK: 'bg-purple-500/20 text-purple-300',
      LEADERSHIP_TRACK: 'bg-yellow-500/20 text-yellow-300',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300';
  };

  // If course is selected, show player
  if (selectedCourse) {
    return (
      <CoursePlayer
        courseId={selectedCourse}
        courseStartMode={courseStartMode}
        onComplete={() => {
          setSelectedCourse(null);
          setCourseStartMode(null);
          queryClient.invalidateQueries('academy-courses');
          queryClient.invalidateQueries('my-certificates');
          alert('🎉 Course completed! Your certificate has been generated.');
        }}
        onExit={() => {
          setSelectedCourse(null);
          setCourseStartMode(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* INARA Academy Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">INARA ACADEMY</h1>
        <p className="text-xl text-gray-200 mb-4">
          Welcome to INARA Academy – Your Official Learning & Certification Platform
        </p>
        <p className="text-gray-300">
          Transform your skills, earn certifications, and advance your career with INARA's comprehensive learning platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Available Courses</p>
          <p className="text-2xl font-bold text-white mt-1">{allCourses.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-white mt-1">
            {allCourses.filter((c: any) => c.completions?.[0]?.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-white mt-1">
            {allCourses.filter((c: any) => c.completions?.[0]?.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Certificates</p>
          <p className="text-2xl font-bold text-white mt-1">{certificates.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Status:</span>
          {(['all', 'mandatory', 'in-progress', 'completed', 'tracks'] as const).map((f) => {
            const count = allCourses.filter((c: any) => {
              const completion = c.completions?.[0];
              if (f === 'all') return true;
              if (f === 'mandatory') return c.isMandatory;
              if (f === 'completed') return completion?.status === 'COMPLETED';
              if (f === 'in-progress') return completion?.status === 'IN_PROGRESS';
              if (f === 'tracks') return c.track;
              return true;
            }).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                  filter === f
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f.replace('-', ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Course Type Filters */}
        {courseTypes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Course Type:</span>
            <button
              onClick={() => setCourseTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                courseTypeFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {courseTypes.map((type) => {
              const count = allCourses.filter((c: any) => c.courseType === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setCourseTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    courseTypeFilter === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {getCourseTypeLabel(type)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Category:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.slice(0, 8).map((cat) => {
              const count = allCourses.filter((c: any) => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing <strong className="text-white">{filteredCourses.length}</strong> of{' '}
            <strong className="text-white">{allCourses.length}</strong> courses
          </div>
          <button
            onClick={() => setShowCertificates(!showCertificates)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
          >
            {showCertificates ? 'Hide' : 'View'} My Certificates ({certificates.length})
          </button>
        </div>
      </div>

      {/* Certificates View */}
      {showCertificates && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">My Certificates</h2>
          {certificates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No certificates yet. Complete a course to earn your first certificate!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert: any) => (
                <div key={cert.id} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">{cert.courseTitle}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Completed: {new Date(cert.completionDate).toLocaleDateString()}
                  </p>
                  {cert.expiryDate && (
                    <p className="text-sm text-yellow-400 mb-2">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                  {cert.score !== null && (
                    <p className="text-sm text-gray-300 mb-3">Score: {cert.score}%</p>
                  )}
                  <button
                    onClick={() => setSelectedCertificate(cert)}
                    className="block w-full text-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                  >
                    View Certificate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Available Courses</h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No courses found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => {
              const completion = course.completions?.[0];
              const progress = completion?.progress || 0;
              const status = completion?.status || 'NOT_STARTED';

              return (
                <div
                  key={course.id}
                  className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700"
                >
                  {/* Course Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-white flex-1">{course.title}</h3>
                      {course.track && (
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                          {course.track.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded ${getCourseTypeColor(course.courseType)}`}>
                        {getCourseTypeLabel(course.courseType)}
                      </span>
                      {course.isMandatory && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          Mandatory
                        </span>
                      )}
                      {course.category && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {status !== 'NOT_STARTED' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>
                      {course.lessons?.length || 0} lessons • {course.duration || 0} min
                    </span>
                    {completion?.score !== null && completion?.score !== undefined && (
                      <span className="text-primary-400">Score: {completion.score}%</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSelectedCourseForModal(course);
                      setShowCourseStartModal(true);
                    }}
                    disabled={startMutation.isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      status === 'COMPLETED'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : status === 'IN_PROGRESS'
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {startMutation.isLoading
                      ? 'Starting...'
                      : status === 'COMPLETED'
                      ? '✓ Completed - View Certificate'
                      : status === 'IN_PROGRESS'
                      ? 'Continue Learning'
                      : 'Start Course'}
                  </button>

                  {/* Certificate Badge */}
                  {completion?.certificateUrl && (
                    <a
                      href={completion.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-center text-sm text-primary-400 hover:text-primary-300"
                    >
                      📜 View Certificate
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Start Modal */}
      {showCourseStartModal && selectedCourseForModal && (
        <CourseStartModal
          course={selectedCourseForModal}
          onTakeCourse={() => {
            startMutation.mutate(selectedCourseForModal.id);
            setCourseStartMode('course');
          }}
          onTakeAssessment={() => {
            setSelectedCourse(selectedCourseForModal.id);
            setCourseStartMode('assessment');
            setShowCourseStartModal(false);
          }}
          onClose={() => {
            setShowCourseStartModal(false);
            setSelectedCourseForModal(null);
          }}
          isLoading={startMutation.isLoading}
        />
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Certificate of Completion</h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-150px)]">
              <CertificateGenerator
                participantName={selectedCertificate.fullName}
                courseTitle={selectedCertificate.courseTitle}
                completionDate={new Date(selectedCertificate.completionDate)}
                certificateId={selectedCertificate.certificateNumber}
                score={selectedCertificate.score}
                passingScore={selectedCertificate.passingScore}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
