import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from 'react-query';
import api from '../api/client';
import { Link } from 'react-router-dom';
export default function LearningDashboard() {
    const { data: trainingData } = useQuery('my-trainings-progress', async () => {
        const res = await api.get('/training');
        return res.data;
    });
    const { data: policyData } = useQuery('my-policies-progress', async () => {
        const res = await api.get('/policies');
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
    const trainings = trainingData?.trainings || [];
    const policies = policyData?.policies || [];
    const achievements = achievementsData?.achievements || [];
    const completedTrainings = trainings.filter((t) => t.completions?.[0]?.status === 'COMPLETED').length;
    const totalTrainings = trainings.length;
    const trainingProgress = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
    const acknowledgedPolicies = policies.filter((p) => p.certifications?.[0]?.status === 'ACKNOWLEDGED').length;
    const totalPolicies = policies.length;
    const policyProgress = totalPolicies > 0 ? (acknowledgedPolicies / totalPolicies) * 100 : 0;
    const inProgressTrainings = trainings.filter((t) => t.completions?.[0]?.status === 'IN_PROGRESS');
    const overdueTrainings = trainings.filter((t) => {
        const completion = t.completions?.[0];
        if (completion?.expiresAt) {
            return new Date(completion.expiresAt) < new Date() && completion.status !== 'COMPLETED';
        }
        return false;
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Learning Dashboard" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Track your learning progress and achievements" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Training Progress" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-gray-400", children: "Completed" }), _jsxs("span", { className: "text-white font-medium", children: [completedTrainings, " / ", totalTrainings] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-3", children: _jsx("div", { className: "bg-primary-500 h-3 rounded-full transition-all", style: { width: `${trainingProgress}%` } }) }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [Math.round(trainingProgress), "% Complete"] })] }), inProgressTrainings.length > 0 && (_jsxs("div", { className: "pt-4 border-t border-gray-700", children: [_jsxs("p", { className: "text-sm text-gray-400 mb-2", children: ["In Progress: ", inProgressTrainings.length] }), _jsx("div", { className: "space-y-2", children: inProgressTrainings.slice(0, 3).map((training) => (_jsx(Link, { to: `/training/${training.id}`, className: "block text-sm text-primary-400 hover:text-primary-300", children: training.title }, training.id))) })] })), overdueTrainings.length > 0 && (_jsxs("div", { className: "pt-4 border-t border-gray-700", children: [_jsxs("p", { className: "text-sm text-red-400 mb-2", children: ["Overdue: ", overdueTrainings.length] }), _jsx("div", { className: "space-y-2", children: overdueTrainings.slice(0, 3).map((training) => (_jsx(Link, { to: `/training/${training.id}`, className: "block text-sm text-red-400 hover:text-red-300", children: training.title }, training.id))) })] }))] })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Policy Certifications" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "text-gray-400", children: "Acknowledged" }), _jsxs("span", { className: "text-white font-medium", children: [acknowledgedPolicies, " / ", totalPolicies] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-3", children: _jsx("div", { className: "bg-green-500 h-3 rounded-full transition-all", style: { width: `${policyProgress}%` } }) }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [Math.round(policyProgress), "% Complete"] })] }), policies.filter((p) => p.isMandatory && p.certifications?.[0]?.status !== 'ACKNOWLEDGED').length > 0 && (_jsx("div", { className: "pt-4 border-t border-gray-700", children: _jsxs("p", { className: "text-sm text-yellow-400 mb-2", children: ["Pending Mandatory: ", policies.filter((p) => p.isMandatory && p.certifications?.[0]?.status !== 'ACKNOWLEDGED').length] }) }))] })] })] }), achievements.length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Your Achievements" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", children: achievements.map((achievement) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-600 transition-colors", children: [_jsx("div", { className: "text-4xl mb-2", children: achievement.icon || '🏆' }), _jsx("p", { className: "text-sm font-medium text-white", children: achievement.title }), achievement.description && (_jsx("p", { className: "text-xs text-gray-400 mt-1", children: achievement.description })), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: new Date(achievement.earnedAt).toLocaleDateString() })] }, achievement.id))) })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("div", { className: "text-3xl font-bold text-primary-500 mb-2", children: completedTrainings }), _jsx("div", { className: "text-sm text-gray-400", children: "Trainings Completed" })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("div", { className: "text-3xl font-bold text-green-500 mb-2", children: acknowledgedPolicies }), _jsx("div", { className: "text-sm text-gray-400", children: "Policies Certified" })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg shadow border border-gray-700 p-6", children: [_jsx("div", { className: "text-3xl font-bold text-yellow-500 mb-2", children: achievements.length }), _jsx("div", { className: "text-sm text-gray-400", children: "Achievements Earned" })] })] })] }));
}
