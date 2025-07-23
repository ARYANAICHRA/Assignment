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

function AppLayout({ isAuthenticated, setIsAuthenticated }) {
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
      <Header setIsAuthenticated={setIsAuthenticated} isAuthenticated={isAuthenticated} selectedProject={selectedProject} />
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: 'calc(100vh - 44px)' }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <Sidebar setIsAuthenticated={setIsAuthenticated} />
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '32px 16px 0 16px', marginTop: 0 }}>
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
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) localStorage.setItem('user', JSON.stringify(data));
        });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    // Verify token with backend
    fetch('http://localhost:5000/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) setIsAuthenticated(true);
        else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
        setLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 24 }}><Spin size="large" /></div>;
  }

  return (
    <ProjectProvider>
      <Router>
        {isAuthenticated ? (
          <AppLayout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </Router>
    </ProjectProvider>
  );
}

export default App;
