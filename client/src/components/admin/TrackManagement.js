import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// INARA Academy - Track Management (Diploma/Leadership Tracks)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';
export default function TrackManagement() {
    const [showForm, setShowForm] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'DIPLOMA_TRACK',
        courses: [],
    });
    const queryClient = useQueryClient();
    const { data: tracksData } = useQuery('admin-tracks', async () => {
        const res = await api.get('/admin/academy/tracks');
        return res.data;
    });
    const { data: coursesData } = useQuery('admin-courses-for-tracks', async () => {
        const res = await api.get('/academy/courses');
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/admin/academy/tracks', data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-tracks');
            setShowForm(false);
            resetForm();
            alert('Track created successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to create track');
        },
    });
    const updateMutation = useMutation(async ({ id, data }) => {
        const res = await api.put(`/admin/academy/tracks/${id}`, data);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-tracks');
            setShowForm(false);
            setEditingTrack(null);
            resetForm();
            alert('Track updated successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to update track');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/admin/academy/tracks/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('admin-tracks');
            alert('Track deleted successfully!');
        },
        onError: (error) => {
            alert(error.response?.data?.message || 'Failed to delete track');
        },
    });
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'DIPLOMA_TRACK',
            courses: [],
        });
    };
    const handleEdit = (track) => {
        setEditingTrack(track);
        setFormData({
            name: track.name,
            description: track.description || '',
            type: track.type,
            courses: track.courses?.map((t) => t.id) || [],
        });
        setShowForm(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingTrack) {
            updateMutation.mutate({ id: editingTrack.id, data: formData });
        }
        else {
            createMutation.mutate(formData);
        }
    };
    const tracks = tracksData?.tracks || [];
    const courses = coursesData?.courses || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Track Management" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Create and manage Diploma Tracks and Leadership Tracks (multi-course programs)" })] }), _jsx("button", { onClick: () => {
                            setEditingTrack(null);
                            resetForm();
                            setShowForm(true);
                        }, className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600", children: "+ Create Track" })] }), showForm && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: editingTrack ? 'Edit Track' : 'Create New Track' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Track Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "e.g., Advanced Leadership Program" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Track Type *" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), required: true, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", children: [_jsx("option", { value: "DIPLOMA_TRACK", children: "Diploma Track" }), _jsx("option", { value: "LEADERSHIP_TRACK", children: "Leadership Track" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 4, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg", placeholder: "Describe the track, its objectives, and who it's for..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-200 mb-2", children: "Select Courses * (Multi-select - courses will be part of this track)" }), _jsx("div", { className: "bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto", children: courses.length === 0 ? (_jsx("p", { className: "text-gray-400 text-sm", children: "No courses available. Create courses first." })) : (_jsx("div", { className: "space-y-2", children: courses.map((course) => (_jsxs("label", { className: "flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: formData.courses.includes(course.id), onChange: (e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    courses: [...formData.courses, course.id],
                                                                });
                                                            }
                                                            else {
                                                                setFormData({
                                                                    ...formData,
                                                                    courses: formData.courses.filter((id) => id !== course.id),
                                                                });
                                                            }
                                                        }, className: "text-primary-500" }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-white text-sm", children: course.title }), _jsxs("span", { className: "text-gray-400 text-xs ml-2", children: ["(", course.courseType?.replace('_', ' '), ")"] })] })] }, course.id))) })) }), formData.courses.length > 0 && (_jsxs("p", { className: "text-xs text-gray-400 mt-2", children: [formData.courses.length, " course(s) selected"] }))] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => {
                                            setShowForm(false);
                                            setEditingTrack(null);
                                            resetForm();
                                        }, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createMutation.isLoading || updateMutation.isLoading || formData.courses.length === 0, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: createMutation.isLoading || updateMutation.isLoading
                                            ? 'Saving...'
                                            : editingTrack
                                                ? 'Update Track'
                                                : 'Create Track' })] })] })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4", children: ["All Tracks (", tracks.length, ")"] }), tracks.length === 0 ? (_jsx("p", { className: "text-gray-400 text-center py-8", children: "No tracks created yet. Create your first track above." })) : (_jsx("div", { className: "space-y-4", children: tracks.map((track) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsx("h4", { className: "text-white font-semibold text-lg", children: track.name }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${track.type === 'DIPLOMA_TRACK'
                                                                ? 'bg-blue-900/30 text-blue-300'
                                                                : 'bg-purple-900/30 text-purple-300'}`, children: track.type === 'DIPLOMA_TRACK' ? 'Diploma Track' : 'Leadership Track' })] }), track.description && (_jsx("p", { className: "text-gray-400 text-sm mb-2", children: track.description })), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-400", children: [_jsxs("span", { children: [track.courses?.length || 0, " course(s) in track"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [track.courses?.filter((t) => t.isActive).length || 0, " active"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleEdit(track), className: "px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700", children: "Edit" }), _jsx("button", { onClick: () => {
                                                        if (window.confirm(`Are you sure you want to delete "${track.name}"? This will remove the track but not the courses.`)) {
                                                            deleteMutation.mutate(track.id);
                                                        }
                                                    }, disabled: deleteMutation.isLoading, className: "px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50", children: "Delete" })] })] }), track.courses && track.courses.length > 0 && (_jsxs("div", { className: "mt-3 pt-3 border-t border-gray-600", children: [_jsx("p", { className: "text-xs text-gray-500 mb-2", children: "Courses in this track:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: track.courses.map((course, idx) => (_jsxs("span", { className: "text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded", children: [idx + 1, ". ", course.title] }, course.id))) })] }))] }, track.id))) }))] })] }));
}
