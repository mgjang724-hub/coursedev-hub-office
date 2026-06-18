import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import MyTasks from './pages/MyTasks';
import Courses from './pages/Courses';
import CourseNew from './pages/CourseNew';
import CourseDetail from './pages/CourseDetail';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - PLANNER only */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={['PLANNER']}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/new"
            element={
              <ProtectedRoute allowedRoles={['PLANNER']}>
                <CourseNew />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - ADMIN or MANAGER */}
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Portfolio />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - PM or SME */}
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute allowedRoles={['PM', 'SME']}>
                <MyTasks />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Universal Access for Authenticated Users */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
