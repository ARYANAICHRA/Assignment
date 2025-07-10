import React, { useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

function CreateProjectForm({ onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const { setSelectedProject } = useContext(ProjectContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Replace with your backend endpoint
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProject(data.project);
        onProjectCreated && onProjectCreated(data.project);
        setName('');
        setDescription('');
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
      <h3 className="text-xl font-bold mb-4">Create New Project</h3>
      <div className="mb-4">
        <label className="block mb-1">Project Name</label>
        <input className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Description</label>
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      {error && <div className="mb-2 text-red-500">{error}</div>}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Project</button>
    </form>
  );
}

export default CreateProjectForm;
