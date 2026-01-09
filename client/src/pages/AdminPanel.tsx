import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import api from '../api/client';
import TrainingManagement from '../components/admin/TrainingManagement';
import PolicyManagement from '../components/admin/PolicyManagement';
import LibraryManagement from '../components/admin/LibraryManagement';
import TemplateManagement from '../components/admin/TemplateManagement';
import MarketManagement from '../components/admin/MarketManagement';
import Configuration from '../components/admin/Configuration';
import UserManagement from '../components/admin/UserManagement';
import WorkSystemsManagement from '../components/admin/WorkSystemsManagement';
import NewsManagement from '../components/admin/NewsManagement';
import SurveyManagement from '../components/admin/SurveyManagement';
import SuggestionManagement from '../components/admin/SuggestionManagement';
import EnhancedAnalytics from '../components/admin/EnhancedAnalytics';
import AcademyAnalytics from '../components/academy/AcademyAnalytics';
import TrackManagement from '../components/admin/TrackManagement';
import OrientationManagement from '../components/admin/OrientationManagement';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: analytics, refetch: refetchAnalytics } = useQuery('admin-analytics', async () => {
    const [people, compliance, systemUsage, overview] = await Promise.all([
      api.get('/analytics/people'),
      api.get('/analytics/compliance'),
      api.get('/analytics/system-usage'),
      api.get('/analytics/overview?range=all'),
    ]);
    return {
      people: people.data,
      compliance: compliance.data,
      systemUsage: systemUsage.data,
      overview: overview.data,
    };
  }, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const menuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'users', label: 'Users' },
    { id: 'work-systems', label: 'Work Systems' },
    { id: 'trainings', label: 'Trainings' },
    { id: 'policies', label: 'Policies' },
    { id: 'orientation', label: 'Orientation' },
    { id: 'library', label: 'Library' },
    { id: 'news', label: 'News' },
    { id: 'surveys', label: 'Surveys' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'templates', label: 'Templates' },
    { id: 'market', label: 'Market' },
    { id: 'tracks', label: 'Tracks' },
    { id: 'academy-analytics', label: 'Academy Analytics' },
    { id: 'configuration', label: 'Configuration' },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-xs mt-1">Platform management</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Overview</h2>
              <button
                onClick={() => {
                  queryClient.invalidateQueries('admin-analytics');
                  refetchAnalytics();
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics?.overview?.metrics?.totalUsers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.overview?.metrics?.activeUsers || 0} active
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-sm text-gray-400">Training Completions</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics?.overview?.metrics?.trainingCompletions || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.overview?.metrics?.trainingCompletionRate?.toFixed(1) || 0}% rate
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-sm text-gray-400">Policy Certifications</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics?.overview?.metrics?.policyCertifications || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.overview?.metrics?.policyCertificationRate?.toFixed(1) || 0}% rate
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <p className="text-sm text-gray-400">Platform Engagement</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analytics?.overview?.metrics?.engagementScore?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Average score</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <EnhancedAnalytics />}
        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'trainings' && <TrainingManagement />}
        {activeTab === 'policies' && <PolicyManagement />}
        {activeTab === 'orientation' && <OrientationManagement />}
        {activeTab === 'library' && <LibraryManagement />}
        {activeTab === 'news' && <NewsManagement />}
        {activeTab === 'surveys' && <SurveyManagement />}
        {activeTab === 'suggestions' && <SuggestionManagement />}
        {activeTab === 'templates' && <TemplateManagement />}
        {activeTab === 'market' && <MarketManagement />}
        {activeTab === 'tracks' && <TrackManagement />}
        {activeTab === 'academy-analytics' && <AcademyAnalytics />}

        {activeTab === 'work-systems' && <WorkSystemsManagement />}

        {activeTab === 'configuration' && <Configuration />}
        </div>
      </div>
    </div>
  );
}

