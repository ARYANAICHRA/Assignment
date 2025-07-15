import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';
import Modal from 'react-modal';
import CreateProjectForm from './CreateProjectForm';

const navSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
      { name: 'Projects', path: '/projects', icon: '📁' },
      { name: 'Board', path: '/board', icon: '🗂️' },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', path: '/profile', icon: '👤' },
    ],
  },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setProjects(data.projects);
  };

  const handleProjectChange = (e) => {
    const project = projects.find(p => p.id === Number(e.target.value));
    setSelectedProject(project || null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleProjectCreated = (project) => {
    setShowCreateModal(false);
    fetchProjects();
    setSelectedProject(project);
  };

  return (
    <aside className="h-screen w-56 bg-gray-900 text-white flex flex-col py-8 px-4 fixed">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">Jira Clone</div>
        <button
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-lg font-bold"
          title="New Project"
          onClick={() => setShowCreateModal(true)}
        >
          +
        </button>
      </div>
      <div className="mb-6">
        <label className="block text-xs uppercase text-gray-400 mb-1 px-2 tracking-wider">Project</label>
        <select
          className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring"
          value={selectedProject ? selectedProject.id : ''}
          onChange={handleProjectChange}
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>
      <nav className="flex-1">
        {navSections.map(section => (
          <div key={section.title} className="mb-6">
            <div className="text-xs uppercase text-gray-400 mb-2 px-2 tracking-wider">{section.title}</div>
            <ul className="space-y-1">
              {section.items.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-700 transition font-medium ${location.pathname === item.path ? 'bg-blue-700 text-white' : ''}`}
                  >
                    <span>{item.icon}</span> {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full text-left px-4 py-2 rounded hover:bg-gray-700 transition text-red-300 font-semibold"
        >
          <span>🚪</span> Logout
        </button>
      </div>
      <Modal
        isOpen={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
        contentLabel="Create Project"
        className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Project</h2>
        <CreateProjectForm onProjectCreated={handleProjectCreated} />
        <button className="mt-4 text-gray-500 hover:underline" onClick={() => setShowCreateModal(false)}>Cancel</button>
      </Modal>
    </aside>
  );
}

export default Sidebar;
