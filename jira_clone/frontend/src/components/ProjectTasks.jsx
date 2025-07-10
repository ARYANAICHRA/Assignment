import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

function ProjectTasks() {
  const { selectedProject } = useContext(ProjectContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: '', assignee_id: '' });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (selectedProject) fetchTasks();
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchTasks = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setTasks(data.items);
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Optionally fetch project members for assignee dropdown
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

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4">Project Tasks</h3>
      {loading ? <div>Loading...</div> : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 text-left">Title</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Assignee</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b">
                <td className="py-2 px-3">
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
                  ) : task.status}
                </td>
                <td className="py-2 px-3">
                  {editTaskId === task.id ? (
                    <select name="assignee_id" value={editForm.assignee_id} onChange={handleEditChange} className="border rounded px-2 py-1">
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.user_id} value={u.user_id}>{u.username}</option>
                      ))}
                    </select>
                  ) : task.assignee_id ? users.find(u => u.user_id === task.assignee_id)?.username || task.assignee_id : 'Unassigned'}
                </td>
                <td className="py-2 px-3">
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
    </div>
  );
}

export default ProjectTasks;
