import React from 'react';
import { useAuth } from '../context/AuthContext';

const MyTasks: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">내 작업 목록</h1>
            <p className="text-sm text-slate-400">안녕하세요, {user?.name}님</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded">
            로그아웃
          </button>
        </header>
        <p>내 작업 목록 파생 뷰 예정 (RULE-08)</p>
      </div>
    </div>
  );
};

export default MyTasks;
