import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

function ProjectMembers() {
  const { selectedProject } = useContext(ProjectContext);
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedProject) {
      fetchMembers();
      fetchOwner();
    }
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchOwner = async () => {
    if (!selectedProject?.owner_id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/users/${selectedProject.owner_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwner(data.user);
      } else {
        setOwner(null);
      }
    } catch {
      setOwner(null);
    }
  };

  const fetchMembers = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMembers(data.members);
      else setError(data.error || 'Failed to fetch members');
    } catch {
      setError('Network error');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member added');
        setEmail('');
        setRole('member');
        fetchMembers();
      } else setError(data.error || 'Failed to add member');
    } catch { setError('Network error'); }
  };

  const handleRemove = async (uid) => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member removed');
        fetchMembers();
      } else setError(data.error || 'Failed to remove member');
    } catch { setError('Network error'); }
  };

  return selectedProject ? (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h3 className="text-xl font-bold mb-4">Project Members</h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input className="border rounded px-2 py-1" placeholder="User Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <select className="border rounded px-2 py-1" value={role} onChange={e => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add</button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <ul className="divide-y divide-gray-200">
        {owner && (
          <li className="py-2 flex justify-between items-center bg-yellow-50">
            <span>
              <span className="font-semibold">{owner.username}</span> (<span className="text-gray-600">{owner.email}</span>)
              {' | '}<span className="text-yellow-700 font-bold">Owner</span>
            </span>
          </li>
        )}
        {members.map(m => (
          <li key={m.user_id} className="py-2 flex justify-between items-center">
            <span>
              <span className="font-semibold">{m.username}</span> (<span className="text-gray-600">{m.email}</span>)
              {m.role ? ` | Role: ${m.role}` : ''}
            </span>
            <button className="text-red-500 hover:underline" onClick={() => handleRemove(m.user_id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}

export default ProjectMembers;
