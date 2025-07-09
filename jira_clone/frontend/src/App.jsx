import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Board from './pages/Board';
import './index.css';

function App() {
  // For demonstration, use a state for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // You would set isAuthenticated to true after successful login

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/board" element={isAuthenticated ? <Board /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
