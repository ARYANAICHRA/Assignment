import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    fetch('http://localhost:5000/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setIsAuthenticated(true);
        setUser(data);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link className="text-white text-2xl font-bold" to="/">Jira Clone</Link>
        <div className="flex gap-4 items-center">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-gray-200 hover:text-white">Login</Link>
              <Link to="/register" className="text-gray-200 hover:text-white">Register</Link>
            </>
          ) : (
            <>
              {user && <span className="text-gray-300 mr-2">Hello, {user.username}</span>}
              <Link to="/profile" className="text-gray-200 hover:text-white">Profile</Link>
              <button onClick={handleLogout} className="text-gray-200 hover:text-white ml-2">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
