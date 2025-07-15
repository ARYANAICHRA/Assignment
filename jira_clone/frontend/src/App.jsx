import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/profile';
import Board from './pages/Board';
import Projects from './pages/Projects';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import { Layout, Spin } from 'antd';
import 'antd/dist/reset.css';
import './index.css';

const { Sider, Content, Header: AntHeader, Footer: AntFooter } = Layout;

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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 24 }}><Spin size="large" /> Loading...</div>;
  }

  return (
    <ProjectProvider>
      <Router>
        {isAuthenticated ? (
          <Layout style={{ minHeight: '100vh' }}>
            <Sider width={220} style={{ background: '#001529' }}>
              <Sidebar />
            </Sider>
            <Layout>
              <AntHeader style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px #f0f1f2' }}>
                <Header />
              </AntHeader>
              <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/projects" element={<Projects />} />
                </Routes>
              </Content>
              <AntFooter style={{ textAlign: 'center' }}>
                <Footer />
              </AntFooter>
            </Layout>
          </Layout>
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
