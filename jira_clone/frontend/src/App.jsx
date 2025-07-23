import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProjectProvider, ProjectContext } from './context/ProjectContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProjectBoard from './pages/ProjectBoard';
import ProjectPage from './pages/ProjectPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import { Layout, Spin } from 'antd';
import 'antd/dist/reset.css';
import './index.css';
import ItemDetail from './pages/ItemDetail';
import ProjectManagement from './pages/ProjectManagement';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import { useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';

const { Sider, Content, Header: AntHeader, Footer: AntFooter } = Layout;

function AppLayout() {
  const { selectedProject } = useContext(ProjectContext);
  const location = useLocation();
  const { isAdmin } = useAuth();
  // Only show footer on dashboard, home, login, register, and profile
  const showFooter = [
    '/',
    '/dashboard',
    '/login',
    '/register',
    '/profile'
  ].some(path => location.pathname === path);
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb' }}>
      <Header selectedProject={selectedProject} />
      <div style={{ minHeight: 'calc(100vh - 44px)', display: 'flex', flexDirection: 'row' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0, padding: '32px 24px 0 24px', marginTop: 0, marginLeft: 240, transition: 'margin-left 0.2s', paddingTop: 44 }}>
          <Routes>
            {/* Redirect admin away from dashboard and home */}
            {isAdmin && <Route path="/dashboard" element={<Navigate to="/admin" replace />} />}
            {isAdmin && <Route path="/" element={<Navigate to="/admin" replace />} />}
            {!isAdmin && <Route path="/" element={<Navigate to="/dashboard" replace />} />}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/items/:itemId" element={<ItemDetail />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/reports/project/:projectId" element={<Reports />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} />} />
          </Routes>
          {showFooter && (
            <div style={{ textAlign: 'center', background: '#fff', position: 'sticky', bottom: 0, zIndex: 99 }}>
              <Footer />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 24 }}><Spin size="large" /></div>;
  }

  return (
    <ProjectProvider>
      <Router>
        {currentUser ? (
          <AppLayout />
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </Router>
    </ProjectProvider>
  );
}

export default App;
