import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Deliverable {
  deliverable_id: string;
  deliverable_type: 'SCRIPT' | 'SB' | 'DEV' | 'DESIGN' | 'OPEN_PREP';
  current_status: string;
  blocking_reason: string | null;
}

interface Lesson {
  lesson_id: string;
  lesson_no: number;
  title: string;
  subtitle: string | null;
  derived_status: string;
  deliverables: Deliverable[];
}

interface Stage {
  id: string;
  stage_type: string;
  stage_order: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress_rate: number;
}

interface CourseDetailData {
  course_id: string;
  course_name: string;
  vendor: string | null;
  dev_type: string | null;
  lesson_count: number;
  current_stage: string;
  progress_rate: number;
  stages: Stage[];
  lessons: Lesson[];
  planner: {
    name: string;
    email: string;
  };
}

interface FileVersion {
  version_id: string;
  round_no: number;
  storage_path: string;
  created_at: string;
  uploader: {
    name: string;
  };
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [activeTab, setActiveTab] = useState('heatmap');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDlv, setSelectedDlv] = useState<{ dlvId: string; type: string; lessonNo: number } | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const fetchCourseData = () => {
    fetch(`${apiBaseUrl}/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCourse(res.data);
        else throw new Error(res.error?.message || '과정 정보를 가져오지 못했습니다.');
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCourseData();
  }, [id, token]);

  useEffect(() => {
    if (selectedDlv) {
      fetch(`${apiBaseUrl}/deliverables/${selectedDlv.dlvId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setVersions(res.data);
        });
    }
  }, [selectedDlv, token]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !selectedDlv) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/deliverables/${selectedDlv.dlvId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_name: fileToUpload.name,
          file_type: fileToUpload.type || 'application/octet-stream',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || '업로드 URL 생성 실패');

      const { upload_url } = result.data;

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': fileToUpload.type || 'application/octet-stream',
        },
        body: fileToUpload,
      });

      if (!uploadResponse.ok) throw new Error('스토리지 전송에 실패했습니다.');

      setFileToUpload(null);

      const vRes = await fetch(`${apiBaseUrl}/deliverables/${selectedDlv.dlvId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vResult = await vRes.json();
      if (vResult.success) setVersions(vResult.data);
      
      fetchCourseData();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'REVISION_REQUESTED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'BLOCKED':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'IN_REVIEW':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'SUBMITTED':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-500';
    }
  };

  const dlvTypes: ('SCRIPT' | 'SB' | 'DEV' | 'DESIGN' | 'OPEN_PREP')[] = ['SCRIPT', 'SB', 'DEV', 'DESIGN', 'OPEN_PREP'];

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <p className="text-rose-400 mb-4">{error || '과정 정보를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-slate-800 rounded text-xs font-semibold">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
          <span className="cursor-pointer hover:text-slate-300" onClick={() => navigate('/courses')}>연수 과정 목록</span>
          <span>&gt;</span>
          <span className="text-slate-300">{course.course_name}</span>
        </div>

        <header className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl mb-8 flex justify-between items-start backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {course.course_name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-semibold">
                {course.current_stage} 단계
              </span>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <p>위탁 업체: <span className="text-slate-200">{course.vendor || '-'}</span></p>
              <p>개발 구분: <span className="text-slate-200">{course.dev_type || '-'}</span></p>
              <p>총 차시: <span className="text-slate-200">{course.lesson_count}차시</span></p>
              <p>담당 기획자: <span className="text-slate-200">{course.planner.name}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">전체 연수 진행률</p>
            <p className="text-2xl font-extrabold text-blue-400 mt-1">{(course.progress_rate * 100).toFixed(0)}%</p>
          </div>
        </header>

        <div className="flex border-b border-slate-900 mb-6">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'heatmap' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            원고 진행상황 (히트맵)
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'design' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            디자인 시안
          </button>
          <button
            onClick={() => setActiveTab('sb')}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'sb' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            SB 진행상황
          </button>
          <button
            onClick={() => setActiveTab('memos')}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'memos' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            이슈사항 메모
          </button>
        </div>

        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <div className="overflow-x-auto bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-xl">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-7 gap-4 mb-4 text-xs font-semibold text-slate-500 text-center pb-2 border-b border-slate-900">
                  <div className="text-left pl-2">차시 정보</div>
                  <div>종합 상태</div>
                  <div>1단계 SCRIPT</div>
                  <div>2단계 SB</div>
                  <div>3단계 DEV</div>
                  <div>4단계 DESIGN</div>
                  <div>5단계 OPEN_PREP</div>
                </div>

                <div className="space-y-3">
                  {course.lessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="grid grid-cols-7 gap-4 items-center bg-slate-950/60 border border-slate-900/60 p-3 rounded-xl hover:border-slate-800 transition-all">
                      <div className="text-left pl-2">
                        <p className="text-xs text-blue-400 font-bold">제 {lesson.lesson_no}차시</p>
                        <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">{lesson.title}</p>
                      </div>
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(lesson.derived_status)}`}>
                          {lesson.derived_status}
                        </span>
                      </div>

                      {dlvTypes.map((type) => {
                        const dlv = lesson.deliverables.find((d) => d.deliverable_type === type);
                        if (!dlv) {
                          return (
                            <div key={type} className="flex justify-center">
                              <span className="text-[10px] text-slate-700">-</span>
                            </div>
                          );
                        }

                        return (
                          <div key={type} className="flex justify-center">
                            <button
                              onClick={() => setSelectedDlv({ dlvId: dlv.deliverable_id, type, lessonNo: lesson.lesson_no })}
                              className={`w-full max-w-[100px] py-2 text-[10px] font-bold border rounded-lg active:scale-95 transition-all text-center ${getStatusColor(
                                dlv.blocking_reason ? 'BLOCKED' : dlv.current_status
                              )}`}
                            >
                              {dlv.blocking_reason ? 'BLOCKED' : dlv.current_status}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="p-8 bg-slate-900/10 border border-slate-900 rounded-2xl text-center text-slate-500 text-sm">
            디자인 시안 업로드 및 승인 플로우가 연동될 예정입니다.
          </div>
        )}

        {activeTab === 'sb' && (
          <div className="p-8 bg-slate-900/10 border border-slate-900 rounded-2xl text-center text-slate-500 text-sm">
            SB 슬라이드 장표별 세부 검수 및 가편영상 피드백 뷰가 연동될 예정입니다.
          </div>
        )}

        {activeTab === 'memos' && (
          <div className="p-8 bg-slate-900/10 border border-slate-900 rounded-2xl text-center text-slate-500 text-sm">
            업무 진행 중 주요 의사결정 요청 및 회의 메모 로그 관리 뷰가 연동될 예정입니다.
          </div>
        )}
      </div>

      {selectedDlv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedDlv(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold mb-1">
              제 {selectedDlv.lessonNo}차시 — {selectedDlv.type} 산출물 관리
            </h3>
            <p className="text-xs text-slate-500 mb-6">산출물의 신규 버전 업로드 및 업로드된 버전 이력입니다.</p>

            <form onSubmit={handleFileUpload} className="mb-6 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
              <h4 className="text-xs font-semibold text-slate-300">신규 파일 업로드</h4>
              {uploadError && <p className="text-[10px] text-rose-400">{uploadError}</p>}
              <div className="flex gap-3">
                <input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  required
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded text-white disabled:opacity-50"
                >
                  {isUploading ? '전송 중...' : '업로드'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400">버전 이력 (Round)</h4>
              {versions.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">제출된 파일 버전이 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {versions.map((ver) => (
                    <div key={ver.version_id} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/40 rounded-lg text-xs">
                      <div>
                        <p className="font-bold text-slate-200 font-sans">Round {ver.round_no}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          업로더: {ver.uploader.name} | {new Date(ver.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={ver.storage_path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-semibold transition-all"
                      >
                        다운로드
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
