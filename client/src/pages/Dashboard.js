import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import CalendarWidget from '../components/CalendarWidget';
import SuggestionBox from '../components/SuggestionBox';
export default function Dashboard() {
    console.log('Dashboard component: Rendering...');
    const { user } = useAuthStore();
    const { data: trainingData } = useQuery('my-trainings', async () => {
        const res = await api.get('/training?mandatory=true&status=NOT_STARTED');
        return res.data;
    });
    const { data: allTrainingData } = useQuery('all-trainings', async () => {
        try {
            const res = await api.get('/training');
            return res.data;
        }
        catch {
            return { trainings: [] };
        }
    });
    const { data: policyData } = useQuery('my-policies', async () => {
        const res = await api.get('/policies?mandatory=true&status=NOT_ACKNOWLEDGED');
        return res.data;
    });
    const { data: allPolicyData } = useQuery('all-policies', async () => {
        try {
            const res = await api.get('/policies');
            return res.data;
        }
        catch {
            return { policies: [] };
        }
    });
    const { data: orientationData } = useQuery('orientation', async () => {
        const res = await api.get('/orientation');
        return res.data;
    });
    const { data: achievementsData } = useQuery('achievements', async () => {
        try {
            const res = await api.get('/achievements');
            return res.data;
        }
        catch {
            return { achievements: [] };
        }
    });
    const { data: activityData } = useQuery('activity', async () => {
        try {
            const res = await api.get('/activity?limit=10');
            return res.data;
        }
        catch {
            return { activities: [] };
        }
    });
    const { data: surveysData } = useQuery('surveys', async () => {
        try {
            const res = await api.get('/surveys');
            return res.data;
        }
        catch {
            return { surveys: [] };
        }
    });
    const { data: newsData } = useQuery('news', async () => {
        try {
            const res = await api.get('/news?limit=5');
            return res.data;
        }
        catch {
            return { news: [] };
        }
    });
    const { data: suggestionsData } = useQuery('my-suggestions', async () => {
        try {
            const res = await api.get(`/suggestions?userId=${user?.id}`);
            return res.data;
        }
        catch {
            return { suggestions: [] };
        }
    });
    // Calculate progress stats
    const allTrainings = allTrainingData?.trainings || [];
    const completedTrainings = allTrainings.filter((t) => t.completions?.[0]?.status === 'COMPLETED').length;
    const trainingProgress = allTrainings.length > 0
        ? Math.round((completedTrainings / allTrainings.length) * 100)
        : 0;
    const allPolicies = allPolicyData?.policies || [];
    const acknowledgedPolicies = allPolicies.filter((p) => p.certifications?.[0]?.status === 'ACKNOWLEDGED').length;
    const policyProgress = allPolicies.length > 0
        ? Math.round((acknowledgedPolicies / allPolicies.length) * 100)
        : 0;
    const availableSurveys = surveysData?.surveys || [];
    const mySuggestions = suggestionsData?.suggestions || [];
    const recentNews = newsData?.news || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-white", children: ["Welcome, ", user?.firstName, "!"] }), _jsx("p", { className: "text-gray-400 mt-2", children: "Your INARA Global Staff Platform Dashboard" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Training Progress" }), _jsxs("p", { className: "text-2xl font-bold text-white mt-1", children: [trainingProgress, "%"] }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [completedTrainings, " of ", allTrainings.length, " completed"] }), _jsx("div", { className: "mt-2 w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-primary-500 h-2 rounded-full transition-all", style: { width: `${trainingProgress}%` } }) })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Policy Certifications" }), _jsxs("p", { className: "text-2xl font-bold text-white mt-1", children: [policyProgress, "%"] }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [acknowledgedPolicies, " of ", allPolicies.length, " acknowledged"] }), _jsx("div", { className: "mt-2 w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full transition-all", style: { width: `${policyProgress}%` } }) })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Pending Actions" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: (trainingData?.trainings?.length || 0) + (policyData?.policies?.length || 0) + (availableSurveys.length || 0) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Trainings, Policies & Surveys" })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Orientation" }), _jsx("p", { className: "text-2xl font-bold text-white mt-1", children: orientationData?.completed ? '✓' : '✗' }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: orientationData?.completed ? 'Completed' : 'Not completed' })] }) })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", children: [_jsx(Link, { to: "/work", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: _jsx("div", { className: "text-sm font-medium text-gray-200", children: "Work Systems" }) }), _jsx(Link, { to: "/training", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: _jsx("div", { className: "text-sm font-medium text-gray-200", children: "Training" }) }), _jsx(Link, { to: "/policies", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: _jsx("div", { className: "text-sm font-medium text-gray-200", children: "Policies" }) }), _jsx(Link, { to: "/library", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: _jsx("div", { className: "text-sm font-medium text-gray-200", children: "Library" }) }), _jsxs(Link, { to: "/surveys", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: [_jsx("div", { className: "text-sm font-medium text-gray-200", children: "Surveys" }), availableSurveys.length > 0 && (_jsx("span", { className: "ml-1 text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full", children: availableSurveys.length }))] }), _jsx(Link, { to: "/templates", className: "p-4 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-700 transition-colors text-center", children: _jsx("div", { className: "text-sm font-medium text-gray-200", children: "Templates" }) })] })] }), _jsx(SuggestionBox, {}), (trainingData?.trainings?.length > 0 || policyData?.policies?.length > 0 || !orientationData?.completed) && (_jsxs("div", { className: "bg-yellow-900/30 border border-yellow-700 rounded-lg p-4", children: [_jsx("h3", { className: "font-bold text-yellow-300 mb-2", children: "\u26A0\uFE0F Action Required" }), _jsxs("ul", { className: "list-disc list-inside text-sm text-yellow-200 space-y-1", children: [!orientationData?.completed && (_jsx("li", { children: _jsx(Link, { to: "/orientation", className: "underline", children: "Complete your orientation" }) })), trainingData?.trainings?.length > 0 && (_jsx("li", { children: _jsxs(Link, { to: "/training", className: "underline", children: ["Complete ", trainingData.trainings.length, " mandatory training(s)"] }) })), policyData?.policies?.length > 0 && (_jsx("li", { children: _jsxs(Link, { to: "/policies", className: "underline", children: ["Acknowledge ", policyData.policies.length, " mandatory policy(ies)"] }) }))] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [achievementsData?.achievements && achievementsData.achievements.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Recent Achievements" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: achievementsData.achievements.slice(0, 6).map((achievement) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: achievement.icon || '🏆' }), _jsx("p", { className: "text-sm font-medium text-white", children: achievement.title }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: new Date(achievement.earnedAt).toLocaleDateString() })] }, achievement.id))) })] })), activityData?.activities && activityData.activities.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: activityData.activities.map((activity) => (_jsxs("div", { className: "flex items-start space-x-3", children: [_jsxs("div", { className: "w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold", children: [activity.user.firstName[0], activity.user.lastName[0]] }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-sm text-gray-200", children: [_jsxs("span", { className: "font-medium", children: [activity.user.firstName, " ", activity.user.lastName] }), ' ', activity.action.replace('_', ' '), activity.resourceType && (_jsxs("span", { className: "text-gray-400", children: [" ", activity.resourceType] }))] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: new Date(activity.createdAt).toLocaleString() })] })] }, activity.id))) })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsx(CalendarWidget, {}), availableSurveys.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Available Surveys" }), _jsxs("div", { className: "space-y-3", children: [availableSurveys.slice(0, 3).map((survey) => (_jsxs(Link, { to: "/surveys", className: "block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors", children: [_jsx("p", { className: "text-sm font-medium text-white", children: survey.title }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [survey.questions?.length || 0, " questions"] })] }, survey.id))), availableSurveys.length > 3 && (_jsxs(Link, { to: "/surveys", className: "block text-center text-sm text-primary-500 hover:text-primary-400", children: ["View all ", availableSurveys.length, " surveys \u2192"] }))] })] })), recentNews.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Latest News" }), _jsxs("div", { className: "space-y-3", children: [recentNews.map((news) => (_jsxs(Link, { to: "/news", className: "block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-1", children: [_jsx("p", { className: "text-sm font-medium text-white line-clamp-2", children: news.title }), news.priority === 'urgent' && (_jsx("span", { className: "ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded", children: "Urgent" }))] }), _jsx("p", { className: "text-xs text-gray-400", children: new Date(news.publishedAt).toLocaleDateString() })] }, news.id))), _jsx(Link, { to: "/news", className: "block text-center text-sm text-primary-500 hover:text-primary-400", children: "View all news \u2192" })] })] })), mySuggestions.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "My Suggestions" }), _jsxs("div", { className: "space-y-3", children: [mySuggestions.slice(0, 3).map((suggestion) => (_jsxs(Link, { to: "/suggestions", className: "block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors", children: [_jsx("p", { className: "text-sm font-medium text-white line-clamp-1", children: suggestion.title }), _jsxs("div", { className: "flex items-center justify-between mt-1", children: [_jsx("span", { className: `text-xs px-2 py-0.5 rounded capitalize ${suggestion.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                                                    suggestion.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                                                        suggestion.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                            'bg-gray-600 text-gray-300'}`, children: suggestion.status.replace('_', ' ') }), _jsxs("span", { className: "text-xs text-gray-400", children: [suggestion.upvotes || 0, " \u2191"] })] })] }, suggestion.id))), mySuggestions.length > 3 && (_jsxs(Link, { to: "/suggestions", className: "block text-center text-sm text-primary-500 hover:text-primary-400", children: ["View all ", mySuggestions.length, " suggestions \u2192"] }))] })] }))] })] })] }));
}
