// INARA Academy - Track Management (Diploma/Leadership Tracks)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/client';

export default function TrackManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DIPLOMA_TRACK',
    courses: [] as string[],
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

  const createMutation = useMutation(
    async (data: any) => {
      const res = await api.post('/admin/academy/tracks', data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-tracks');
        setShowForm(false);
        resetForm();
        alert('Track created successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to create track');
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/academy/tracks/${id}`, data);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-tracks');
        setShowForm(false);
        setEditingTrack(null);
        resetForm();
        alert('Track updated successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to update track');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/admin/academy/tracks/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-tracks');
        alert('Track deleted successfully!');
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to delete track');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'DIPLOMA_TRACK',
      courses: [],
    });
  };

  const handleEdit = (track: any) => {
    setEditingTrack(track);
    setFormData({
      name: track.name,
      description: track.description || '',
      type: track.type,
      courses: track.courses?.map((t: any) => t.id) || [],
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrack) {
      updateMutation.mutate({ id: editingTrack.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const tracks = tracksData?.tracks || [];
  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Track Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage Diploma Tracks and Leadership Tracks (multi-course programs)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTrack(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
        >
          + Create Track
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingTrack ? 'Edit Track' : 'Create New Track'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Track Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="e.g., Advanced Leadership Program"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Track Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              >
                <option value="DIPLOMA_TRACK">Diploma Track</option>
                <option value="LEADERSHIP_TRACK">Leadership Track</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                placeholder="Describe the track, its objectives, and who it's for..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Courses * (Multi-select - courses will be part of this track)
              </label>
              <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-gray-400 text-sm">No courses available. Create courses first.</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course: any) => (
                      <label
                        key={course.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.courses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                courses: [...formData.courses, course.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                courses: formData.courses.filter((id) => id !== course.id),
                              });
                            }
                          }}
                          className="text-primary-500"
                        />
                        <div className="flex-1">
                          <span className="text-white text-sm">{course.title}</span>
                          <span className="text-gray-400 text-xs ml-2">
                            ({course.courseType?.replace('_', ' ')})
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.courses.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {formData.courses.length} course(s) selected
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTrack(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading || formData.courses.length === 0}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : editingTrack
                  ? 'Update Track'
                  : 'Create Track'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracks List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Tracks ({tracks.length})</h3>
        {tracks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tracks created yet. Create your first track above.</p>
        ) : (
          <div className="space-y-4">
            {tracks.map((track: any) => (
              <div
                key={track.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-semibold text-lg">{track.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          track.type === 'DIPLOMA_TRACK'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-purple-900/30 text-purple-300'
                        }`}
                      >
                        {track.type === 'DIPLOMA_TRACK' ? 'Diploma Track' : 'Leadership Track'}
                      </span>
                    </div>
                    {track.description && (
                      <p className="text-gray-400 text-sm mb-2">{track.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        {track.courses?.length || 0} course(s) in track
                      </span>
                      <span>•</span>
                      <span>
                        {track.courses?.filter((t: any) => t.isActive).length || 0} active
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(track)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${track.name}"? This will remove the track but not the courses.`
                          )
                        ) {
                          deleteMutation.mutate(track.id);
                        }
                      }}
                      disabled={deleteMutation.isLoading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Courses in Track */}
                {track.courses && track.courses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-500 mb-2">Courses in this track:</p>
                    <div className="flex flex-wrap gap-2">
                      {track.courses.map((course: any, idx: number) => (
                        <span
                          key={course.id}
                          className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded"
                        >
                          {idx + 1}. {course.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

