import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import CalendarWidget from '../components/CalendarWidget';
import SuggestionBox from '../components/SuggestionBox';

export default function Dashboard() {
  console.log('Dashboard component: Rendering...');
  const { user } = useAuthStore();

  // Queries that drive "Action Required" - refetch when window gains focus so banner updates after user takes action in another tab
  const { data: trainingData } = useQuery('my-trainings', async () => {
    const res = await api.get('/training?mandatory=true&status=NOT_STARTED');
    return res.data;
  }, { refetchOnWindowFocus: true });

  const { data: allTrainingData } = useQuery('all-trainings', async () => {
    try {
      const res = await api.get('/training');
      return res.data;
    } catch {
      return { trainings: [] };
    }
  });

  const { data: policyData } = useQuery('my-policies', async () => {
    const res = await api.get('/policies?mandatory=true&status=NOT_ACKNOWLEDGED');
    return res.data;
  }, { refetchOnWindowFocus: true });

  const { data: allPolicyData } = useQuery('all-policies', async () => {
    try {
      const res = await api.get('/policies');
      return res.data;
    } catch {
      return { policies: [] };
    }
  });

  const { data: orientationData } = useQuery('orientation', async () => {
    const res = await api.get('/orientation');
    return res.data;
  }, { refetchOnWindowFocus: true });

  const { data: achievementsData } = useQuery('achievements', async () => {
    try {
      const res = await api.get('/achievements');
      return res.data;
    } catch {
      return { achievements: [] };
    }
  });

  const { data: activityData } = useQuery('activity', async () => {
    try {
      const res = await api.get('/activity?limit=10');
      return res.data;
    } catch {
      return { activities: [] };
    }
  });

  const { data: surveysData } = useQuery('surveys', async () => {
    try {
      const res = await api.get('/surveys');
      return res.data;
    } catch {
      return { surveys: [] };
    }
  });

  const { data: newsData } = useQuery('news', async () => {
    try {
      const res = await api.get('/news?limit=5');
      return res.data;
    } catch {
      return { news: [] };
    }
  });

  const { data: suggestionsData } = useQuery('my-suggestions', async () => {
    try {
      const res = await api.get(`/suggestions?userId=${user?.id}`);
      return res.data;
    } catch {
      return { suggestions: [] };
    }
  });

  // Calculate progress stats
  const allTrainings = allTrainingData?.trainings || [];
  const completedTrainings = allTrainings.filter((t: any) => 
    t.completions?.[0]?.status === 'COMPLETED'
  ).length;
  const trainingProgress = allTrainings.length > 0 
    ? Math.round((completedTrainings / allTrainings.length) * 100) 
    : 0;

  const allPolicies = allPolicyData?.policies || [];
  const acknowledgedPolicies = allPolicies.filter((p: any) => 
    p.certifications?.[0]?.status === 'ACKNOWLEDGED'
  ).length;
  const policyProgress = allPolicies.length > 0 
    ? Math.round((acknowledgedPolicies / allPolicies.length) * 100) 
    : 0;

  const availableSurveys = surveysData?.surveys || [];
  const mySuggestions = suggestionsData?.suggestions || [];
  const recentNews = newsData?.news || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.firstName}!</h1>
        <p className="text-gray-400 mt-2">Your INARA Global Staff Platform Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div>
            <p className="text-sm text-gray-400">Training Progress</p>
            <p className="text-2xl font-bold text-white mt-1">{trainingProgress}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {completedTrainings} of {allTrainings.length} completed
            </p>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div>
            <p className="text-sm text-gray-400">Policy Certifications</p>
            <p className="text-2xl font-bold text-white mt-1">{policyProgress}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {acknowledgedPolicies} of {allPolicies.length} acknowledged
            </p>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${policyProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div>
            <p className="text-sm text-gray-400">Pending Actions</p>
            <p className="text-2xl font-bold text-white mt-1">
              {(trainingData?.trainings?.length || 0) + (policyData?.policies?.length || 0) + (availableSurveys.length || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Trainings, Policies & Surveys
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div>
            <p className="text-sm text-gray-400">Orientation</p>
            <p className="text-2xl font-bold text-white mt-1">
              {orientationData == null ? '…' : orientationData.completed ? '✓' : '✗'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {orientationData == null ? 'Loading…' : orientationData.completed ? 'Completed' : 'Not completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            to="/work"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Work Systems</div>
          </Link>
          <Link
            to="/training"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Training</div>
          </Link>
          <Link
            to="/policies"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Policies</div>
          </Link>
          <Link
            to="/library"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Library</div>
          </Link>
          <Link
            to="/surveys"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Surveys</div>
            {availableSurveys.length > 0 && (
              <span className="ml-1 text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                {availableSurveys.length}
              </span>
            )}
          </Link>
          <Link
            to="/templates"
            className="p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-sm font-medium text-gray-200">Templates</div>
          </Link>
        </div>
      </div>

      {/* Suggestion Box - Horizontal */}
      <SuggestionBox />

      {/* Alerts - only show orientation required when we have loaded data and completed is false (not while loading) */}
      {(trainingData?.trainings?.length > 0 || policyData?.policies?.length > 0 || (orientationData != null && !orientationData.completed)) && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <h3 className="font-bold text-yellow-300 mb-2">⚠️ Action Required</h3>
          <ul className="list-disc list-inside text-sm text-yellow-200 space-y-1">
            {orientationData != null && !orientationData.completed && (
              <li>
                <Link to="/orientation" className="underline">
                  Complete your orientation
                </Link>
              </li>
            )}
            {trainingData?.trainings?.length > 0 && (
              <li>
                <Link to="/training" className="underline">
                  Complete {trainingData.trainings.length} mandatory training(s)
                </Link>
              </li>
            )}
            {policyData?.policies?.length > 0 && (
              <li>
                <Link to="/policies" className="underline">
                  Acknowledge {policyData.policies.length} mandatory policy(ies)
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Achievements */}
          {achievementsData?.achievements && achievementsData.achievements.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievementsData.achievements.slice(0, 6).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="bg-gray-700 rounded-lg p-4 text-center"
                  >
                    <div className="text-3xl mb-2">{achievement.icon || '🏆'}</div>
                    <p className="text-sm font-medium text-white">{achievement.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {activityData?.activities && activityData.activities.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {activityData.activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {activity.user.firstName[0]}{activity.user.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">
                        <span className="font-medium">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>{' '}
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

        {/* Sidebar */}
        <div className="space-y-6">
          <CalendarWidget />

          {/* Available Surveys */}
          {availableSurveys.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Available Surveys</h2>
              <div className="space-y-3">
                {availableSurveys.slice(0, 3).map((survey: any) => (
                  <Link
                    key={survey.id}
                    to="/surveys"
                    className="block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{survey.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {survey.questions?.length || 0} questions
                    </p>
                  </Link>
                ))}
                {availableSurveys.length > 3 && (
                  <Link
                    to="/surveys"
                    className="block text-center text-sm text-primary-500 hover:text-primary-400"
                  >
                    View all {availableSurveys.length} surveys →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Latest News */}
          {recentNews.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Latest News</h2>
              <div className="space-y-3">
                {recentNews.map((news: any) => (
                  <Link
                    key={news.id}
                    to="/news"
                    className="block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-white line-clamp-2">{news.title}</p>
                      {news.priority === 'urgent' && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(news.publishedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
                <Link
                  to="/news"
                  className="block text-center text-sm text-primary-500 hover:text-primary-400"
                >
                  View all news →
                </Link>
              </div>
            </div>
          )}

          {/* My Suggestions */}
          {mySuggestions.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">My Suggestions</h2>
              <div className="space-y-3">
                {mySuggestions.slice(0, 3).map((suggestion: any) => (
                  <Link
                    key={suggestion.id}
                    to="/suggestions"
                    className="block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-white line-clamp-1">{suggestion.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        suggestion.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        suggestion.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        suggestion.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {suggestion.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {suggestion.upvotes || 0} ↑
                      </span>
                    </div>
                  </Link>
                ))}
                {mySuggestions.length > 3 && (
                  <Link
                    to="/suggestions"
                    className="block text-center text-sm text-primary-500 hover:text-primary-400"
                  >
                    View all {mySuggestions.length} suggestions →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

