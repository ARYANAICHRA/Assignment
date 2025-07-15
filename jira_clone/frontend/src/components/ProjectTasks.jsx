import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import TaskDetailModal from './TaskDetailModal';
import Modal from 'react-modal';

function TypeIcon({ type }) {
  if (type === 'bug') return <span className="inline-block mr-1 text-red-600" title="Bug">🐞</span>;
  if (type === 'feature') return <span className="inline-block mr-1 text-blue-600" title="Feature">🌟</span>;
  return <span className="inline-block mr-1 text-green-600" title="Task">✅</span>;
}

function StatusBadge({ status }) {
  const color = status === 'done' ? 'bg-green-200 text-green-800' :
    status === 'inprogress' ? 'bg-yellow-200 text-yellow-800' :
    status === 'inreview' ? 'bg-blue-200 text-blue-800' :
    'bg-gray-200 text-gray-800';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{status}</span>;
}

function SeverityBadge({ severity }) {
  if (!severity) return null;
  const color = severity === 'Critical' ? 'bg-red-600 text-white' :
    severity === 'Major' ? 'bg-orange-500 text-white' :
    'bg-yellow-400 text-black';
  return <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{severity}</span>;
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All', color: 'bg-gray-200' },
  { value: 'bug', label: 'Bugs', color: 'bg-red-200' },
  { value: 'feature', label: 'Features', color: 'bg-blue-200' },
  { value: 'task', label: 'Tasks', color: 'bg-green-200' },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'status', label: 'Status' },
];

function ProjectTasks() {
  const { selectedProject, userRole } = useContext(ProjectContext); // userRole assumed in context
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: '', assignee_id: '' });
  const [users, setUsers] = useState([]);
  const [detailTaskId, setDetailTaskId] = useState(null); // For modal
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: '',
    steps_to_reproduce: '',
    status: 'todo',
    priority: '',
    due_date: ''
  });
  const [bugError, setBugError] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [selectedProject, typeFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let url = `http://localhost:5000/projects/${selectedProject.id}/items`;
    if (typeFilter !== 'all') url += `?type=${typeFilter}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setTasks(data.items);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setUsers(data.members);
  };

  const handleEdit = (task) => {
    setEditTaskId(task.id);
    setEditForm({ title: task.title, status: task.status, assignee_id: task.assignee_id || '' });
    fetchUsers();
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/items/${editTaskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(editForm)
    });
    setEditTaskId(null);
    fetchTasks();
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
  };

  const handleBugChange = e => setBugForm({ ...bugForm, [e.target.name]: e.target.value });

  const handleBugSubmit = async e => {
    e.preventDefault();
    setBugError('');
    if (!bugForm.title) { setBugError('Title is required'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...bugForm, type: 'bug' })
    });
    if (res.ok) {
      setShowBugModal(false);
      setBugForm({ title: '', description: '', severity: '', steps_to_reproduce: '', status: 'todo', priority: '', due_date: '' });
      fetchTasks();
    } else {
      const data = await res.json();
      setBugError(data.error || 'Failed to create bug');
    }
  };

  // Sorting logic
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField], bVal = b[sortField];
    if (sortField === 'due_date') {
      aVal = aVal || '';
      bVal = bVal || '';
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortField === 'priority') {
      // Custom order: Critical > High > Medium > Low > ''
      const order = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, '': 0, null: 0, undefined: 0 };
      return sortDir === 'asc' ? (order[aVal] - order[bVal]) : (order[bVal] - order[aVal]);
    }
    if (sortField === 'status') {
      const order = { 'todo': 1, 'inprogress': 2, 'inreview': 3, 'done': 4 };
      return sortDir === 'asc' ? (order[aVal] - order[bVal]) : (order[bVal] - order[aVal]);
    }
    // Fallback: string compare
    return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Project Tasks</h3>
        <div className="flex gap-2 items-center">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1 rounded text-sm font-semibold border ${typeFilter === opt.value ? opt.color + ' border-black' : 'border-transparent bg-white'}`}
              onClick={() => setTypeFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs">Sort by:</span>
            <select value={sortField} onChange={e => setSortField(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">None</option>
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {sortField && (
              <button
                className="text-xs px-2 py-1 border rounded ml-1"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>
          <button className="bg-red-600 text-white px-3 py-1 rounded text-sm" onClick={() => setShowBugModal(true)}>Report Bug</button>
        </div>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 text-left">Type</th>
              <th className="py-2 px-3 text-left">Title</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Severity</th>
              <th className="py-2 px-3 text-left">Assignee</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map(task => (
              <tr
                key={task.id}
                className={`border-b hover:bg-gray-50 cursor-pointer ${task.type === 'bug' ? 'bg-red-50' : task.type === 'feature' ? 'bg-blue-50' : task.type === 'task' ? 'bg-green-50' : ''}`}
                onClick={() => setDetailTaskId(task.id)}
              >
                <td className="py-2 px-3"><TypeIcon type={task.type} /></td>
                <td className="py-2 px-3 flex items-center">
                  {editTaskId === task.id ? (
                    <input name="title" value={editForm.title} onChange={handleEditChange} className="border rounded px-2 py-1" />
                  ) : task.title}
                </td>
                <td className="py-2 px-3">
                  {editTaskId === task.id ? (
                    <select name="status" value={editForm.status} onChange={handleEditChange} className="border rounded px-2 py-1">
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="inreview">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  ) : <StatusBadge status={task.status} />}
                </td>
                <td className="py-2 px-3">
                  {task.type === 'bug' ? <SeverityBadge severity={task.severity} /> : null}
                </td>
                <td className="py-2 px-3">
                  {editTaskId === task.id ? (
                    <select name="assignee_id" value={editForm.assignee_id} onChange={handleEditChange} className="border rounded px-2 py-1">
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.user_id} value={u.user_id}>{u.username}</option>
                      ))}
                    </select>
                  ) : (
                    task.assignee_id ? (users.find(u => u.user_id === task.assignee_id)?.username || task.assignee_id) : 'Unassigned'
                  )}
                </td>
                <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                  {editTaskId === task.id ? (
                    <>
                      <button className="text-green-600 mr-2" onClick={handleEditSave}>Save</button>
                      <button className="text-gray-500" onClick={() => setEditTaskId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-blue-600 mr-2" onClick={() => handleEdit(task)}>Edit</button>
                      <button className="text-red-600" onClick={() => handleDelete(task.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <TaskDetailModal isOpen={!!detailTaskId} onRequestClose={() => setDetailTaskId(null)} taskId={detailTaskId} userRole={userRole} />
      <Modal
        isOpen={showBugModal}
        onRequestClose={() => setShowBugModal(false)}
        contentLabel="Report Bug"
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      >
        <h2 className="text-xl font-bold mb-4">Report a Bug</h2>
        <form onSubmit={handleBugSubmit} className="flex flex-col gap-2">
          <input name="title" value={bugForm.title} onChange={handleBugChange} placeholder="Bug title" className="border rounded px-2 py-1" required />
          <textarea name="description" value={bugForm.description} onChange={handleBugChange} placeholder="Description" className="border rounded px-2 py-1" />
          <select name="severity" value={bugForm.severity} onChange={handleBugChange} className="border rounded px-2 py-1" required>
            <option value="">Select severity</option>
            <option value="Minor">Minor</option>
            <option value="Major">Major</option>
            <option value="Critical">Critical</option>
          </select>
          <textarea name="steps_to_reproduce" value={bugForm.steps_to_reproduce} onChange={handleBugChange} placeholder="Steps to reproduce" className="border rounded px-2 py-1" />
          <select name="status" value={bugForm.status} onChange={handleBugChange} className="border rounded px-2 py-1">
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="inreview">In Review</option>
            <option value="done">Done</option>
          </select>
          <input name="priority" value={bugForm.priority} onChange={handleBugChange} placeholder="Priority (optional)" className="border rounded px-2 py-1" />
          <input name="due_date" value={bugForm.due_date} onChange={handleBugChange} placeholder="Due date (YYYY-MM-DD)" className="border rounded px-2 py-1" />
          {bugError && <div className="text-red-500 text-xs">{bugError}</div>}
          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded">Create Bug</button>
            <button type="button" className="text-gray-500" onClick={() => setShowBugModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProjectTasks;
