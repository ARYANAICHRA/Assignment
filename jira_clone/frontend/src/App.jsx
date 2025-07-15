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
import './index.css';

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
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  return (
    <ProjectProvider>
      <Router>
        {isAuthenticated ? (
          <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex flex-col flex-1 min-h-screen ml-56">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/projects" element={<Projects />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
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
