import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from 'react-query';
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
import EnhancedAnalytics from '../components/admin/EnhancedAnalytics';
import AcademyAnalytics from '../components/academy/AcademyAnalytics';
import TrackManagement from '../components/admin/TrackManagement';
import OrientationManagement from '../components/admin/OrientationManagement';
export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('overview');
    const { data: analytics } = useQuery('admin-analytics', async () => {
        const [people, compliance, systemUsage] = await Promise.all([
            api.get('/analytics/people'),
            api.get('/analytics/compliance'),
            api.get('/analytics/system-usage'),
        ]);
        return {
            people: people.data,
            compliance: compliance.data,
            systemUsage: systemUsage.data,
        };
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
        { id: 'templates', label: 'Templates' },
        { id: 'market', label: 'Market' },
        { id: 'tracks', label: 'Tracks' },
        { id: 'academy-analytics', label: 'Academy Analytics' },
        { id: 'configuration', label: 'Configuration' },
    ];
    return (_jsxs("div", { className: "flex h-[calc(100vh-5rem)] bg-gray-900", children: [_jsxs("div", { className: "w-64 bg-gray-800 border-r border-gray-700 flex flex-col", children: [_jsxs("div", { className: "p-6 border-b border-gray-700", children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Admin Panel" }), _jsx("p", { className: "text-gray-400 text-xs mt-1", children: "Platform management" })] }), _jsx("nav", { className: "flex-1 overflow-y-auto p-4 space-y-1", children: menuItems.map((item) => (_jsx("button", { onClick: () => setActiveTab(item.id), className: `w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`, children: _jsx("span", { children: item.label }) }, item.id))) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Overview" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-primary-50 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Total Users" }), _jsx("p", { className: "text-2xl font-bold text-primary-700", children: analytics?.people?.topVisitors?.length || 0 })] }), _jsxs("div", { className: "bg-green-50 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Training Completion Rate" }), _jsxs("p", { className: "text-2xl font-bold text-green-700", children: [analytics?.compliance?.trainingStats?.[0]?.completionRate?.toFixed(1) || 0, "%"] })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Policy Certification Rate" }), _jsxs("p", { className: "text-2xl font-bold text-blue-700", children: [analytics?.compliance?.policyStats?.[0]?.certificationRate?.toFixed(1) || 0, "%"] })] })] })] })), activeTab === 'analytics' && _jsx(EnhancedAnalytics, {}), activeTab === 'users' && _jsx(UserManagement, {}), activeTab === 'trainings' && _jsx(TrainingManagement, {}), activeTab === 'policies' && _jsx(PolicyManagement, {}), activeTab === 'orientation' && _jsx(OrientationManagement, {}), activeTab === 'library' && _jsx(LibraryManagement, {}), activeTab === 'news' && _jsx(NewsManagement, {}), activeTab === 'surveys' && _jsx(SurveyManagement, {}), activeTab === 'templates' && _jsx(TemplateManagement, {}), activeTab === 'market' && _jsx(MarketManagement, {}), activeTab === 'tracks' && _jsx(TrackManagement, {}), activeTab === 'academy-analytics' && _jsx(AcademyAnalytics, {}), activeTab === 'work-systems' && _jsx(WorkSystemsManagement, {}), activeTab === 'configuration' && _jsx(Configuration, {})] }) })] }));
}
