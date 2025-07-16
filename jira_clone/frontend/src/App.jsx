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

const { Sider, Content, Header: AntHeader, Footer: AntFooter } = Layout;

function AppLayout({ isAuthenticated, setIsAuthenticated }) {
  const { selectedProject } = useContext(ProjectContext);
  const location = useLocation();
  // Only show footer on dashboard, home, login, register, and profile
  const showFooter = [
    '/',
    '/dashboard',
    '/login',
    '/register',
    '/profile'
  ].some(path => location.pathname === path);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#001529', position: 'fixed', left: 0, top: 0, bottom: 0, height: '100vh', zIndex: 100 }}>
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <AntHeader style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px #f0f1f2', position: 'sticky', top: 0, zIndex: 101 }}>
          <Header setIsAuthenticated={setIsAuthenticated} isAuthenticated={isAuthenticated} selectedProject={selectedProject} />
        </AntHeader>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial', minHeight: 'calc(100vh - 64px - 70px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/item/:itemId" element={<ItemDetail />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
        {showFooter && (
          <AntFooter style={{ textAlign: 'center', background: '#fff', position: 'sticky', bottom: 0, zIndex: 99 }}>
            <Footer />
          </AntFooter>
        )}
      </Layout>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
