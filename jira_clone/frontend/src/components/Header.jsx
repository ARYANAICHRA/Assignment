import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';

function getBreadcrumbs(location, selectedProject) {
  const path = location.pathname.split('/').filter(Boolean);
  const crumbs = [];
  if (path[0] === 'dashboard' || path.length === 0) {
    crumbs.push({ label: 'Dashboard', to: '/dashboard' });
  }
  if (path[0] === 'projects') {
    crumbs.push({ label: 'Projects', to: '/projects' });
    if (selectedProject) {
      crumbs.push({ label: selectedProject.name, to: '#' });
    }
  }
  if (path[0] === 'board') {
    crumbs.push({ label: 'Board', to: '/board' });
  }
  if (path[0] === 'profile') {
    crumbs.push({ label: 'Profile', to: '/profile' });
  }
  return crumbs;
}

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject } = useContext(ProjectContext);

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

  const crumbs = getBreadcrumbs(location, selectedProject);

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-gray-800">Jira Clone</span>
        {selectedProject && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">{selectedProject.name}</span>
        )}
        <div className="ml-6 flex items-center gap-2 text-sm text-gray-500">
          {crumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center">
              {idx > 0 && <span className="mx-1">/</span>}
              {crumb.to !== '#' ? <Link to={crumb.to} className="hover:underline">{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* Notifications dropdown */}
        {/* User menu */}
        {isAuthenticated && user && (
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 focus:outline-none"
              onClick={() => setShowMenu(m => !m)}
            >
              <span className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
                {user.username ? user.username[0].toUpperCase() : '?'}
              </span>
              <span className="text-gray-700 font-semibold">{user.username}</span>
              <span className="text-gray-400">▼</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Header;
