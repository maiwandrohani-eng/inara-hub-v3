import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// INARA ACADEMY - Official Learning & Certification Platform
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState, useMemo } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import CoursePlayer from '../../components/academy/CoursePlayer';
export default function TrainingTab() {
    const [filter, setFilter] = useState('all');
    const [courseTypeFilter, setCourseTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCertificates, setShowCertificates] = useState(false);
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
    const startMutation = useMutation(async (courseId) => {
        const res = await api.post(`/academy/courses/${courseId}/start`);
        return res.data;
    }, {
        onSuccess: (data, courseId) => {
            setSelectedCourse(courseId);
            queryClient.invalidateQueries('academy-courses');
        },
    });
    const allCourses = data?.courses || [];
    const certificates = certificatesData?.certificates || [];
    // Extract course types and categories
    const { courseTypes, categories } = useMemo(() => {
        const types = new Set();
        const cats = new Set();
        allCourses.forEach((course) => {
            if (course.courseType)
                types.add(course.courseType);
            if (course.category)
                cats.add(course.category);
        });
        return {
            courseTypes: Array.from(types).sort(),
            categories: Array.from(cats).sort(),
        };
    }, [allCourses]);
    const filteredCourses = useMemo(() => {
        return allCourses.filter((course) => {
            const completion = course.completions?.[0];
            // Status filter
            if (filter === 'mandatory' && !course.isMandatory)
                return false;
            if (filter === 'completed' && completion?.status !== 'COMPLETED')
                return false;
            if (filter === 'in-progress' && completion?.status !== 'IN_PROGRESS')
                return false;
            if (filter === 'tracks' && !course.track)
                return false;
            // Course type filter
            if (courseTypeFilter !== 'all' && course.courseType !== courseTypeFilter)
                return false;
            // Category filter
            if (categoryFilter !== 'all' && course.category !== categoryFilter)
                return false;
            return true;
        });
    }, [allCourses, filter, courseTypeFilter, categoryFilter]);
    const getCourseTypeLabel = (type) => {
        const labels = {
            MICRO_COURSE: 'Micro Course',
            MANDATORY_COURSE: 'Mandatory Course',
            PROFESSIONAL_COURSE: 'Professional Course',
            DIPLOMA_TRACK: 'Diploma Track',
            LEADERSHIP_TRACK: 'Leadership Track',
        };
        return labels[type] || type;
    };
    const getCourseTypeColor = (type) => {
        const colors = {
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
        return (_jsx(CoursePlayer, { courseId: selectedCourse, onComplete: () => {
                setSelectedCourse(null);
                queryClient.invalidateQueries('academy-courses');
                queryClient.invalidateQueries('my-certificates');
                alert('🎉 Course completed! Your certificate has been generated.');
            }, onExit: () => setSelectedCourse(null) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-8 text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: "INARA ACADEMY" }), _jsx("p", { className: "text-xl text-gray-200 mb-4", children: "Welcome to INARA Academy \u2013 Your Official Learning & Certification Platform" }), _jsx("p", { className: "text-gray-300", children: "Transform your skills, earn certifications, and advance your career with INARA's comprehensive learning platform" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Available Courses" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: allCourses.length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "In Progress" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: allCourses.filter((c) => c.completions?.[0]?.status === 'IN_PROGRESS').length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Completed" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: allCourses.filter((c) => c.completions?.[0]?.status === 'COMPLETED').length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Certificates" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: certificates.length })] })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Status:" }), ['all', 'mandatory', 'in-progress', 'completed', 'tracks'].map((f) => {
                                const count = allCourses.filter((c) => {
                                    const completion = c.completions?.[0];
                                    if (f === 'all')
                                        return true;
                                    if (f === 'mandatory')
                                        return c.isMandatory;
                                    if (f === 'completed')
                                        return completion?.status === 'COMPLETED';
                                    if (f === 'in-progress')
                                        return completion?.status === 'IN_PROGRESS';
                                    if (f === 'tracks')
                                        return c.track;
                                    return true;
                                }).length;
                                return (_jsxs("button", { onClick: () => setFilter(f), className: `px-3 py-1 rounded-full text-sm transition-colors capitalize ${filter === f
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [f.replace('-', ' '), " (", count, ")"] }, f));
                            })] }), courseTypes.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Course Type:" }), _jsx("button", { onClick: () => setCourseTypeFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${courseTypeFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "All" }), courseTypes.map((type) => {
                                const count = allCourses.filter((c) => c.courseType === type).length;
                                return (_jsxs("button", { onClick: () => setCourseTypeFilter(type), className: `px-3 py-1 rounded-full text-sm transition-colors ${courseTypeFilter === type
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [getCourseTypeLabel(type), " (", count, ")"] }, type));
                            })] })), categories.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm text-gray-400", children: "Category:" }), _jsx("button", { onClick: () => setCategoryFilter('all'), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: "All" }), categories.slice(0, 8).map((cat) => {
                                const count = allCourses.filter((c) => c.category === cat).length;
                                return (_jsxs("button", { onClick: () => setCategoryFilter(cat), className: `px-3 py-1 rounded-full text-sm transition-colors ${categoryFilter === cat
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: [cat, " (", count, ")"] }, cat));
                            })] })), _jsxs("div", { className: "flex justify-between items-center pt-2 border-t border-gray-700", children: [_jsxs("div", { className: "text-sm text-gray-400", children: ["Showing ", _jsx("strong", { className: "text-white", children: filteredCourses.length }), " of", ' ', _jsx("strong", { className: "text-white", children: allCourses.length }), " courses"] }), _jsxs("button", { onClick: () => setShowCertificates(!showCertificates), className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: [showCertificates ? 'Hide' : 'View', " My Certificates (", certificates.length, ")"] })] })] }), showCertificates && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "My Certificates" }), certificates.length === 0 ? (_jsx("p", { className: "text-gray-400 text-center py-8", children: "No certificates yet. Complete a course to earn your first certificate!" })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: certificates.map((cert) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4", children: [_jsx("h3", { className: "text-white font-semibold mb-2", children: cert.courseTitle }), _jsxs("p", { className: "text-sm text-gray-400 mb-2", children: ["Completed: ", new Date(cert.completionDate).toLocaleDateString()] }), cert.expiryDate && (_jsxs("p", { className: "text-sm text-yellow-400 mb-2", children: ["Expires: ", new Date(cert.expiryDate).toLocaleDateString()] })), cert.score !== null && (_jsxs("p", { className: "text-sm text-gray-300 mb-3", children: ["Score: ", cert.score, "%"] })), _jsx("a", { href: cert.certificateUrl, target: "_blank", rel: "noopener noreferrer", className: "block w-full text-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm", children: "Download Certificate" })] }, cert.id))) }))] })), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "Available Courses" }), isLoading ? (_jsx("div", { className: "text-center py-12 text-gray-400", children: "Loading courses..." })) : filteredCourses.length === 0 ? (_jsx("div", { className: "bg-gray-900 border border-gray-700 rounded-lg p-8 text-center", children: _jsx("p", { className: "text-gray-400", children: "No courses found matching your filters." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredCourses.map((course) => {
                            const completion = course.completions?.[0];
                            const progress = completion?.progress || 0;
                            const status = completion?.status || 'NOT_STARTED';
                            return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700", children: [_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "text-xl font-bold text-white flex-1", children: course.title }), course.track && (_jsx("span", { className: "ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded", children: course.track.name }))] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-2", children: [_jsx("span", { className: `text-xs px-2 py-1 rounded ${getCourseTypeColor(course.courseType)}`, children: getCourseTypeLabel(course.courseType) }), course.isMandatory && (_jsx("span", { className: "text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded", children: "Mandatory" })), course.category && (_jsx("span", { className: "text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded", children: course.category }))] }), course.description && (_jsx("p", { className: "text-sm text-gray-400 line-clamp-2", children: course.description }))] }), status !== 'NOT_STARTED' && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-xs text-gray-400 mb-1", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-primary-500 h-2 rounded-full transition-all", style: { width: `${progress}%` } }) })] })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500 mb-4", children: [_jsxs("span", { children: [course.lessons?.length || 0, " lessons \u2022 ", course.duration || 0, " min"] }), completion?.score !== null && completion?.score !== undefined && (_jsxs("span", { className: "text-primary-400", children: ["Score: ", completion.score, "%"] }))] }), _jsx("button", { onClick: () => {
                                            if (status === 'NOT_STARTED') {
                                                startMutation.mutate(course.id);
                                            }
                                            else {
                                                setSelectedCourse(course.id);
                                            }
                                        }, disabled: startMutation.isLoading, className: `w-full py-2 px-4 rounded-lg font-medium transition-colors ${status === 'COMPLETED'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : status === 'IN_PROGRESS'
                                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                                : 'bg-primary-500 text-white hover:bg-primary-600'}`, children: startMutation.isLoading
                                            ? 'Starting...'
                                            : status === 'COMPLETED'
                                                ? '✓ Completed - View Certificate'
                                                : status === 'IN_PROGRESS'
                                                    ? 'Continue Learning'
                                                    : 'Start Course' }), completion?.certificateUrl && (_jsx("a", { href: completion.certificateUrl, target: "_blank", rel: "noopener noreferrer", className: "block mt-2 text-center text-sm text-primary-400 hover:text-primary-300", children: "\uD83D\uDCDC View Certificate" }))] }, course.id));
                        }) }))] })] }));
}
