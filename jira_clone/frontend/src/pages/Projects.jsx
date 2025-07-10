import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56">
        <Header />
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-6">All Projects</h1>
          {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="divide-y divide-gray-200">
              {projects.map(project => (
                <li key={project.id} className={`py-3 flex items-center justify-between ${selectedProject && selectedProject.id === project.id ? 'bg-blue-100' : ''}`}>
                  <div>
                    <span className="font-semibold">{project.name}</span>
                    <span className="ml-2 text-gray-500">{project.description}</span>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    onClick={() => handleSelect(project)}
                  >
                    {selectedProject && selectedProject.id === project.id ? 'Selected' : 'Select'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Projects;
