import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function UserProfile() {
  const { user } = useAuthStore();

  const { data: achievementsData } = useQuery('achievements', async () => {
    try {
      const res = await api.get('/achievements');
      return res.data;
    } catch {
      return { achievements: [] };
    }
  });

  const { data: activityData } = useQuery('user-activity', async () => {
    try {
      const res = await api.get('/activity?limit=20');
      return res.data;
    } catch {
      return { activities: [] };
    }
  });

  const achievements = achievementsData?.achievements || [];
  const activities = activityData?.activities || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-2">View your profile and achievements</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.firstName[0]}{user?.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-400">{user?.email}</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="text-white font-medium">{user?.role}</p>
              </div>
              {user?.department && (
                <div>
                  <p className="text-sm text-gray-400">Department</p>
                  <p className="text-white font-medium">{user.department}</p>
                </div>
              )}
              {user?.country && (
                <div>
                  <p className="text-sm text-gray-400">Country</p>
                  <p className="text-white font-medium">{user.country}</p>
                </div>
              )}
              {user?.city && (
                <div>
                  <p className="text-sm text-gray-400">City</p>
                  <p className="text-white font-medium">{user.city}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {achievements.map((achievement: any) => (
              <div
                key={achievement.id}
                className="bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-600 transition-colors"
              >
                <div className="text-4xl mb-2">{achievement.icon || '🏆'}</div>
                <p className="text-sm font-medium text-white">{achievement.title}</p>
                {achievement.description && (
                  <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(achievement.earnedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-700 last:border-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {activity.user.firstName[0]}{activity.user.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    {activity.action.replace('_', ' ')}
                    {activity.resourceType && (
                      <span className="text-gray-400"> {activity.resourceType}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

