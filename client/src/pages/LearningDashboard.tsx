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
    } catch {
      return { achievements: [] };
    }
  });

  const trainings = trainingData?.trainings || [];
  const policies = policyData?.policies || [];
  const achievements = achievementsData?.achievements || [];

  const completedTrainings = trainings.filter((t: any) => 
    t.completions?.[0]?.status === 'COMPLETED'
  ).length;
  const totalTrainings = trainings.length;
  const trainingProgress = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;

  const acknowledgedPolicies = policies.filter((p: any) => 
    p.certifications?.[0]?.status === 'ACKNOWLEDGED'
  ).length;
  const totalPolicies = policies.length;
  const policyProgress = totalPolicies > 0 ? (acknowledgedPolicies / totalPolicies) * 100 : 0;

  const inProgressTrainings = trainings.filter((t: any) => 
    t.completions?.[0]?.status === 'IN_PROGRESS'
  );

  const overdueTrainings = trainings.filter((t: any) => {
    const completion = t.completions?.[0];
    if (completion?.expiresAt) {
      return new Date(completion.expiresAt) < new Date() && completion.status !== 'COMPLETED';
    }
    return false;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Learning Dashboard</h1>
        <p className="text-gray-400 mt-2">Track your learning progress and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Training Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Completed</span>
                <span className="text-white font-medium">
                  {completedTrainings} / {totalTrainings}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(trainingProgress)}% Complete</p>
            </div>
            {inProgressTrainings.length > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">In Progress: {inProgressTrainings.length}</p>
                <div className="space-y-2">
                  {inProgressTrainings.slice(0, 3).map((training: any) => (
                    <Link
                      key={training.id}
                      to={`/training/${training.id}`}
                      className="block text-sm text-primary-400 hover:text-primary-300"
                    >
                      {training.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {overdueTrainings.length > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-red-400 mb-2">Overdue: {overdueTrainings.length}</p>
                <div className="space-y-2">
                  {overdueTrainings.slice(0, 3).map((training: any) => (
                    <Link
                      key={training.id}
                      to={`/training/${training.id}`}
                      className="block text-sm text-red-400 hover:text-red-300"
                    >
                      {training.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Policy Certifications</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Acknowledged</span>
                <span className="text-white font-medium">
                  {acknowledgedPolicies} / {totalPolicies}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${policyProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(policyProgress)}% Complete</p>
            </div>
            {policies.filter((p: any) => p.isMandatory && p.certifications?.[0]?.status !== 'ACKNOWLEDGED').length > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-yellow-400 mb-2">
                  Pending Mandatory: {policies.filter((p: any) => p.isMandatory && p.certifications?.[0]?.status !== 'ACKNOWLEDGED').length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Your Achievements</h3>
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

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div className="text-3xl font-bold text-primary-500 mb-2">{completedTrainings}</div>
          <div className="text-sm text-gray-400">Trainings Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div className="text-3xl font-bold text-green-500 mb-2">{acknowledgedPolicies}</div>
          <div className="text-sm text-gray-400">Policies Certified</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <div className="text-3xl font-bold text-yellow-500 mb-2">{achievements.length}</div>
          <div className="text-sm text-gray-400">Achievements Earned</div>
        </div>
      </div>
    </div>
  );
}

