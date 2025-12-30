// INARA Academy - Compliance Analytics Dashboard
import { useQuery } from 'react-query';
import { useState } from 'react';
import api from '../../api/client';

export default function AcademyAnalytics() {
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  const { data, isLoading } = useQuery(
    ['academy-analytics', filterCountry, filterDepartment],
    async () => {
      const params = new URLSearchParams();
      if (filterCountry) params.append('country', filterCountry);
      if (filterDepartment) params.append('department', filterDepartment);
      const res = await api.get(`/academy/analytics/compliance?${params.toString()}`);
      return res.data;
    }
  );

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading analytics...</div>
    );
  }

  const analytics = data || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">INARA Academy - Compliance Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track training completion, expiry risks, and compliance by country/department
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="">All Countries</option>
            {analytics.countryStats?.map((cs: any) => (
              <option key={cs.country} value={cs.country}>
                {cs.country}
              </option>
            ))}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="">All Departments</option>
            {analytics.departmentStats?.map((ds: any) => (
              <option key={ds.department} value={ds.department}>
                {ds.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">
            {analytics.summary?.totalUsers || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Completion Rate</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {analytics.summary?.overallCompletionRate?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Expired Certificates</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {analytics.summary?.totalExpired || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Expiring Soon (30 days)</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {analytics.summary?.totalExpiringSoon || 0}
          </p>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Course Completion Statistics</h3>
        <div className="space-y-4">
          {analytics.courseStats?.map((course: any) => (
            <div key={course.courseId} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-semibold">{course.courseTitle}</h4>
                  <p className="text-sm text-gray-400">{course.courseType}</p>
                </div>
                <span className="text-lg font-bold text-primary-400">
                  {course.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-400">Completed</p>
                  <p className="text-green-400 font-semibold">{course.completed}</p>
                </div>
                <div>
                  <p className="text-gray-400">In Progress</p>
                  <p className="text-yellow-400 font-semibold">{course.inProgress}</p>
                </div>
                <div>
                  <p className="text-gray-400">Not Started</p>
                  <p className="text-red-400 font-semibold">{course.notStarted}</p>
                </div>
                <div>
                  <p className="text-gray-400">Expired</p>
                  <p className="text-red-500 font-semibold">{course.expired}</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${course.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Country Statistics */}
      {analytics.countryStats && analytics.countryStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Compliance by Country</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.countryStats.map((country: any) => (
              <div key={country.country} className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{country.country || 'Unknown'}</h4>
                <p className="text-sm text-gray-400 mb-1">Users: {country.totalUsers}</p>
                <p className="text-sm text-gray-400 mb-2">Completions: {country.totalCompletions}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Completion Rate</span>
                  <span className="text-lg font-bold text-primary-400">
                    {country.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${country.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Statistics */}
      {analytics.departmentStats && analytics.departmentStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Compliance by Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.departmentStats.map((dept: any) => (
              <div key={dept.department} className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">{dept.department}</h4>
                <p className="text-sm text-gray-400 mb-1">Users: {dept.totalUsers}</p>
                <p className="text-sm text-gray-400 mb-2">Completions: {dept.totalCompletions}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Completion Rate</span>
                  <span className="text-lg font-bold text-primary-400">
                    {dept.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${dept.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Gaps */}
      {analytics.trainingGaps && analytics.trainingGaps.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Training Gaps ({analytics.trainingGaps.length} users with missing mandatory trainings)
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.trainingGaps.slice(0, 50).map((gap: any, idx: number) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-semibold">{gap.userName}</p>
                    <p className="text-sm text-gray-400">
                      {gap.department} • {gap.country}
                    </p>
                    <p className="text-sm text-red-400 mt-1">
                      Missing {gap.missingCount} mandatory course(s)
                    </p>
                  </div>
                </div>
                {gap.missingCourses.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Missing courses:</p>
                    <ul className="text-xs text-gray-400 list-disc list-inside mt-1">
                      {gap.missingCourses.slice(0, 3).map((course: string, cIdx: number) => (
                        <li key={cIdx}>{course}</li>
                      ))}
                      {gap.missingCourses.length > 3 && (
                        <li>... and {gap.missingCourses.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

