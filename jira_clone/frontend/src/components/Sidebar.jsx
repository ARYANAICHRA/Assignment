import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Projects', path: '/projects' },
      { name: 'Board', path: '/board' },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', path: '/profile' },
      { name: 'Logout', path: '/login' },
    ],
  },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="h-screen w-56 bg-gray-800 text-white flex flex-col py-8 px-4 fixed">
      <div className="mb-8 text-2xl font-bold text-center">Jira Clone</div>
      <nav className="flex-1">
        {navSections.map(section => (
          <div key={section.title} className="mb-6">
            <div className="text-xs uppercase text-gray-400 mb-2 px-2 tracking-wider">{section.title}</div>
            <ul className="space-y-1">
              {section.items.map(item => (
                <li key={item.path}>
                  {item.name === 'Logout' ? (
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-4 py-2 rounded hover:bg-gray-700 transition`}
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`block px-4 py-2 rounded hover:bg-gray-700 transition ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
