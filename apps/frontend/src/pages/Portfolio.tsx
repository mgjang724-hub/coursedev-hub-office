import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CourseItem {
  course_id: string;
  course_name: string;
  vendor: string | null;
  dev_type: string | null;
  lesson_count: number;
  current_stage: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  planner?: {
    name: string;
    email: string;
  };
}

const Portfolio: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${apiBaseUrl}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setCourses(res.data);
        } else {
          throw new Error(res.error?.message || '목록을 불러오는 데 실패했습니다.');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const isManager = user?.global_role === 'MANAGER';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              전체 연수 과정 포트폴리오
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              전체 연수 과정 진행 현황판입니다.
            </p>
          </div>
          <div className="flex gap-3">
            {!isManager && (
              <button
                onClick={() => navigate('/courses/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded shadow-md transition-all active:scale-95"
              >
                + 새 연수 과정 개설
              </button>
            )}
            {isManager && (
              <span className="text-xs px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md font-semibold flex items-center">
                🔒 조회 전용 (MANAGER)
              </span>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 rounded transition-all"
            >
              로그아웃
            </button>
          </div>
        </header>

        {error && (
          <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
            <p className="text-sm text-slate-500">조회할 과정이 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-slate-900/20 border border-slate-900 rounded-2xl shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="p-4">과정명</th>
                  <th className="p-4">위탁 업체</th>
                  <th className="p-4">개발 구분</th>
                  <th className="p-4">총 차시</th>
                  <th className="p-4">현재 단계</th>
                  <th className="p-4">담당 기획자</th>
                  <th className="p-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {courses.map((course) => (
                  <tr
                    key={course.course_id}
                    onClick={() => navigate(`/courses/${course.course_id}`)}
                    className="hover:bg-slate-900/40 cursor-pointer transition-all duration-150"
                  >
                    <td className="p-4 font-semibold text-slate-200">{course.course_name}</td>
                    <td className="p-4 text-slate-400">{course.vendor || '-'}</td>
                    <td className="p-4 text-slate-400">{course.dev_type || '-'}</td>
                    <td className="p-4 text-slate-300">{course.lesson_count}차시</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
                        {course.current_stage}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{course.planner?.name || '-'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          course.status === 'ACTIVE'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : course.status === 'DRAFT'
                            ? 'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {course.status === 'ACTIVE' ? '진행 중' : course.status === 'DRAFT' ? '초안' : '보관됨'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
