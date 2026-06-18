import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface KPI {
  my_courses_count: number;
  pending_reviews_count: number;
  this_month_audit_count: number;
}

interface ActionTask {
  id: string;
  course_id: string;
  course_name: string;
  lesson_no: number;
  type: string;
  title: string;
  status: string;
}

interface CourseItem {
  course_id: string;
  course_name: string;
  vendor: string | null;
  dev_type: string | null;
  current_stage: string;
  progress_rate: number;
}

interface DashboardData {
  kpis: KPI;
  action_needed_tasks: ActionTask[];
  courses: CourseItem[];
}

const Home: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${apiBaseUrl}/courses/planner/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else throw new Error(res.error?.message || '대시보드 데이터를 가져오지 못했습니다.');
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              기획자 대시보드
            </h1>
            <p className="text-xs text-slate-400 mt-1">안녕하세요, {user?.name} 기획자님. 진행 현황 요약입니다.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/courses/new')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded shadow-md transition-all active:scale-95"
            >
              + 새 연수 과정 개설
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded transition-all"
            >
              전체 과정 목록
            </button>
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

        {data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl shadow-lg hover:border-slate-800 transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">내 담당 과정 수</p>
                <div className="flex justify-between items-baseline mt-4">
                  <span className="text-3xl font-extrabold text-blue-400">{data.kpis.my_courses_count}개</span>
                  <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">진행 활성</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl shadow-lg hover:border-slate-800 transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">검수 대기 건수</p>
                <div className="flex justify-between items-baseline mt-4">
                  <span className="text-3xl font-extrabold text-amber-400">{data.kpis.pending_reviews_count}건</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">검수 필요</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl shadow-lg hover:border-slate-800 transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">이번 달 심사 마감</p>
                <div className="flex justify-between items-baseline mt-4">
                  <span className="text-3xl font-extrabold text-violet-400">{data.kpis.this_month_audit_count}건</span>
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">마감 임박</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-850 pb-2">처리 필요 작업</h2>
                {data.action_needed_tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">현재 대기 중인 작업이 없습니다.</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {data.action_needed_tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/courses/${task.course_id}`)}
                        className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              task.type === '검수 대기'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {task.type}
                          </span>
                          <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{task.course_name}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-850 pb-2">담당 과정 현황</h2>
                {data.courses.length === 0 ? (
                  <p className="text-xs text-slate-500 py-10 text-center">담당 중인 활성화된 연수 과정이 없습니다.</p>
                ) : (
                  <div className="overflow-hidden border border-slate-900 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-900 text-slate-400 font-semibold">
                          <th className="p-3">과정명</th>
                          <th className="p-3">위탁 업체</th>
                          <th className="p-3">현재 단계</th>
                          <th className="p-3">진도율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {data.courses.map((course) => (
                          <tr
                            key={course.course_id}
                            onClick={() => navigate(`/courses/${course.course_id}`)}
                            className="hover:bg-slate-900/30 cursor-pointer transition-all"
                          >
                            <td className="p-3 font-semibold text-slate-200">{course.course_name}</td>
                            <td className="p-3 text-slate-400">{course.vendor || '-'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold">
                                {course.current_stage}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-blue-400">
                              {(course.progress_rate * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
