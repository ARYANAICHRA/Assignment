import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects);
        } else {
          setError(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleSelect = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">All Projects</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
          {projects.map(project => (
            <li key={project.id} className={`py-3 px-4 flex items-center justify-between transition-colors ${selectedProject && selectedProject.id === project.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
              <div>
                <span className="font-semibold">{project.name}</span>
                <span className="ml-2 text-gray-500">{project.description}</span>
              </div>
              <button
                className={`px-4 py-1 rounded font-semibold transition ${selectedProject && selectedProject.id === project.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                onClick={() => handleSelect(project)}
              >
                {selectedProject && selectedProject.id === project.id ? 'Selected' : 'Select'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Projects;
