import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UserOption {
  user_id: string;
  name: string;
  email: string;
  global_role: string;
}

const CourseNew: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Step 1 State
  const [courseName, setCourseName] = useState('');
  const [vendor, setVendor] = useState('');
  const [devType, setDevType] = useState('');
  const [lessonCount, setLessonCount] = useState(5);

  // Step 2 State (Milestones)
  const [stages, setStages] = useState([
    { stage_type: '기획', stage_order: 1, start_date: '', end_date: '', status: 'APPROVED' },
    { stage_type: '원고', stage_order: 2, start_date: '', end_date: '', status: 'IN_REVIEW' },
    { stage_type: '제작', stage_order: 3, start_date: '', end_date: '', status: 'NOT_STARTED' },
    { stage_type: '심사', stage_order: 4, start_date: '', end_date: '', status: 'NOT_STARTED' },
  ]);

  // Step 3 State (Lessons)
  const [lessons, setLessons] = useState<{ lesson_no: number; title: string; subtitle: string }[]>([]);

  // Step 4 State (Members)
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedPm, setSelectedPm] = useState('');
  const [selectedSme, setSelectedSme] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    if (step === 4 && users.length === 0) {
      fetch(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setUsers(res.data);
        })
        .catch(() => setError('사용자 목록을 불러오는 데 실패했습니다.'));
    }
  }, [step, token, users.length]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = courseId ? `${apiBaseUrl}/courses/${courseId}` : `${apiBaseUrl}/courses`;
      const method = courseId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_name: courseName,
          vendor,
          dev_type: devType,
          lesson_count: Number(lessonCount),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || '저장에 실패했습니다.');

      const savedCourse = result.data;
      setCourseId(savedCourse.course_id);

      const initialLessons = Array.from({ length: Number(lessonCount) }, (_, i) => ({
        lesson_no: i + 1,
        title: `제 ${i + 1}차시 원고`,
        subtitle: '',
      }));
      setLessons(initialLessons);

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stages }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || '일정 저장에 실패했습니다.');

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessons }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || '차시 저장에 실패했습니다.');

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const selectedMembers = [];
    if (selectedPm) selectedMembers.push({ user_id: selectedPm, role_in_course: 'PM' });
    if (selectedSme) selectedMembers.push({ user_id: selectedSme, role_in_course: 'SME' });

    try {
      const response = await fetch(`${apiBaseUrl}/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          members: selectedMembers,
          status: 'ACTIVE',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || '개설 완료 처리에 실패했습니다.');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageChange = (index: number, field: string, value: string) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const handleLessonChange = (index: number, field: string, value: string) => {
    const updatedLessons = [...lessons];
    updatedLessons[index] = { ...updatedLessons[index], [field]: value };
    setLessons(updatedLessons);
  };

  const pmList = users.filter((u) => u.global_role === 'PM');
  const smeList = users.filter((u) => u.global_role === 'SME');

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-8">
        <div className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center shadow-2xl">
          <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mb-6">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">과정 개설 완료</h2>
          <p className="text-sm text-slate-400 mb-8">연수 과정이 생성되어 활성화되었습니다.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-sm transition-all"
            >
              과정 상세 보기
            </button>
            <button
              onClick={() => navigate('/home')}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-sm transition-all"
            >
              홈 대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              새 과정 생성 위저드
            </h1>
            <p className="text-xs text-slate-400 mt-1">단계별로 정보를 입력해 과정을 개설하세요.</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-805 rounded transition-all"
          >
            취소 및 돌아가기
          </button>
        </div>

        <div className="flex justify-between items-center mb-10 bg-slate-900/40 p-4 border border-slate-900 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                  step === i
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : step > i
                    ? 'bg-blue-950 text-blue-400 border border-blue-900'
                    : 'bg-slate-950 text-slate-600 border border-slate-800'
                }`}
              >
                {i}
              </span>
              <span className={`text-xs ${step === i ? 'text-blue-400 font-semibold' : 'text-slate-500'}`}>
                {i === 1 ? '기본 정보' : i === 2 ? '일정 수립' : i === 3 ? '차시 구성' : '담당자 배정'}
              </span>
              {i < 4 && <div className="h-[1px] w-8 bg-slate-800 font-bold"></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-slate-900/20 backdrop-blur-xl border border-slate-900 p-8 rounded-2xl shadow-xl">
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">연수 과정명</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="예: 2026 교원 AI 역량 강화 기초 과정"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none focus:border-blue-500/80 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">위탁 교육 업체 (벤더)</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="예: AX 테크놀로지"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none focus:border-blue-500/80 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">개발 유형</label>
                  <input
                    type="text"
                    value={devType}
                    onChange={(e) => setDevType(e.target.value)}
                    placeholder="예: 혼합형, 원격 전용"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none focus:border-blue-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">과정 총 차시 수</label>
                <input
                  type="number"
                  value={lessonCount}
                  onChange={(e) => setLessonCount(Number(e.target.value))}
                  min={1}
                  max={30}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none focus:border-blue-500/80 transition-all"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-semibold rounded text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '임시 저장 후 다음 단계'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">단계별 개발 기간 및 마일스톤 설정</h3>
              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <div key={stage.stage_type} className="grid grid-cols-3 gap-4 items-center p-4 bg-slate-950/60 rounded-xl border border-slate-900">
                    <span className="text-sm font-semibold text-blue-400">{stage.stage_type} 단계</span>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">시작일</label>
                      <input
                        type="date"
                        value={stage.start_date}
                        onChange={(e) => handleStageChange(idx, 'start_date', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs outline-none focus:border-blue-500 text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">종료일</label>
                      <input
                        type="date"
                        value={stage.end_date}
                        onChange={(e) => handleStageChange(idx, 'end_date', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs outline-none focus:border-blue-500 text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded"
                >
                  이전으로
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-semibold rounded text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '임시 저장 후 다음 단계'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">차시 구성 및 세부 내용 입력</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {lessons.map((lesson, idx) => (
                  <div key={lesson.lesson_no} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                    <span className="text-xs font-semibold text-blue-400">제 {lesson.lesson_no}차시</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => handleLessonChange(idx, 'title', e.target.value)}
                          placeholder="차시 제목"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={lesson.subtitle}
                          onChange={(e) => handleLessonChange(idx, 'subtitle', e.target.value)}
                          placeholder="부제목 (옵션)"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded"
                >
                  이전으로
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-semibold rounded text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '임시 저장 후 다음 단계'}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">담당자 배정</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">제작 PM 배정</label>
                  <select
                    value={selectedPm}
                    onChange={(e) => setSelectedPm(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">PM을 선택하세요</option>
                    {pmList.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">담당 강사 (SME) 배정</label>
                  <select
                    value={selectedSme}
                    onChange={(e) => setSelectedSme(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">강사(SME)를 선택하세요</option>
                    {smeList.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded"
                >
                  이전으로
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold rounded text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? '연수 개설 중...' : '과정 개설 완료'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseNew;
