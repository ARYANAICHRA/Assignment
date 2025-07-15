import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

// You must call Modal.setAppElement in your app root (see below)

function BugIcon() {
  return <span className="inline-block mr-1 text-red-600" title="Bug">🐞</span>;
}

function TaskDetailModal({ isOpen, onRequestClose, taskId, userRole }) {
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
      fetchSubtasks();
      fetchActivityLogs();
    }
    // eslint-disable-next-line
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setTask(data.item);
    setLoading(false);
  };

  const fetchSubtasks = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${taskId}/subtasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setSubtasks(data.subtasks);
  };

  const fetchActivityLogs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${taskId}/activity`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setActivityLogs(data.activity_logs);
  };

  if (!isOpen) return null;

  const isBug = task && task.type === 'bug';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Task Details"
      className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      {loading || !task ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold flex items-center ${isBug ? 'text-red-700' : ''}`}>
              {isBug && <BugIcon />} {task.title}
            </h2>
            <button onClick={onRequestClose} className="text-gray-500 hover:text-black">&times;</button>
          </div>
          <div className="mb-4">
            <div><b>Status:</b> {task.status}</div>
            <div><b>Priority:</b> {task.priority || '—'}</div>
            <div><b>Due Date:</b> {task.due_date || '—'}</div>
            <div><b>Assignee:</b> {task.assignee_id || '—'}</div>
            {isBug && (
              <>
                <div><b>Severity:</b> <span className="text-red-600 font-semibold">{task.severity || '—'}</span></div>
                <div><b>Steps to Reproduce:</b> <div className="whitespace-pre-line">{task.steps_to_reproduce || '—'}</div></div>
              </>
            )}
            <div><b>Description:</b> <div className="whitespace-pre-line">{task.description || '—'}</div></div>
          </div>
          <hr className="my-4" />
          <SubtasksSection subtasks={subtasks} parentId={taskId} refresh={fetchSubtasks} userRole={userRole} />
          <hr className="my-4" />
          <ActivityLogSection logs={activityLogs} />
        </div>
      )}
    </Modal>
  );
}

function SubtasksSection({ subtasks, parentId, refresh, userRole }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', status: 'todo', priority: '', due_date: '' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: 'todo', priority: '', due_date: '' });
  const [error, setError] = useState('');
  const canManage = ["admin", "project_manager", "developer", "reporter"].includes(userRole);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.title) { setError('Title required'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${parentId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ title: '', status: 'todo', priority: '', due_date: '' });
      setShowForm(false);
      refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add subtask');
    }
  };

  const handleEdit = (subtask) => {
    setEditId(subtask.id);
    setEditForm({
      title: subtask.title,
      status: subtask.status,
      priority: subtask.priority || '',
      due_date: subtask.due_date || ''
    });
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/subtasks/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      setEditId(null);
      refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to update subtask');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/subtasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to delete subtask');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Subtasks</h3>
      {subtasks.length === 0 ? <div className="text-gray-500">No subtasks.</div> : (
        <ul className="list-disc ml-6">
          {subtasks.map(st => (
            <li key={st.id} className="mb-1 flex items-center gap-2">
              {editId === st.id ? (
                <>
                  <input name="title" value={editForm.title} onChange={handleEditChange} className="border rounded px-2 py-1 text-sm" />
                  <select name="status" value={editForm.status} onChange={handleEditChange} className="border rounded px-2 py-1 text-sm">
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="inreview">In Review</option>
                    <option value="done">Done</option>
                  </select>
                  <input name="priority" value={editForm.priority} onChange={handleEditChange} placeholder="Priority" className="border rounded px-2 py-1 text-sm" />
                  <input name="due_date" value={editForm.due_date} onChange={handleEditChange} placeholder="Due date (YYYY-MM-DD)" className="border rounded px-2 py-1 text-sm" />
                  <button className="text-green-600 text-xs" onClick={handleEditSave}>Save</button>
                  <button className="text-gray-500 text-xs" onClick={() => setEditId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="font-medium">{st.title}</span> <span className="text-xs text-gray-500">({st.status})</span>
                  {canManage && (
                    <>
                      <button className="text-blue-600 text-xs ml-2" onClick={() => handleEdit(st)}>Edit</button>
                      <button className="text-red-600 text-xs ml-1" onClick={() => handleDelete(st.id)}>Delete</button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <div className="mt-3">
          {!showForm ? (
            <button className="text-blue-600 text-sm" onClick={() => setShowForm(true)}>+ Add Subtask</button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
              <input name="title" value={form.title} onChange={handleChange} placeholder="Subtask title" className="border rounded px-2 py-1" required />
              <select name="status" value={form.status} onChange={handleChange} className="border rounded px-2 py-1">
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="inreview">In Review</option>
                <option value="done">Done</option>
              </select>
              <input name="priority" value={form.priority} onChange={handleChange} placeholder="Priority (optional)" className="border rounded px-2 py-1" />
              <input name="due_date" value={form.due_date} onChange={handleChange} placeholder="Due date (YYYY-MM-DD)" className="border rounded px-2 py-1" />
              {error && <div className="text-red-500 text-xs">{error}</div>}
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
                <button type="button" className="text-gray-500 text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </div>
  );
}

function ActivityLogSection({ logs }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
      {logs.length === 0 ? <div className="text-gray-500">No activity yet.</div> : (
        <ul className="divide-y divide-gray-200">
          {logs.map(log => (
            <li key={log.id} className="py-1 text-sm">
              <span className="font-mono text-xs text-gray-500">[{log.created_at}]</span> <b>User {log.user_id}</b> {log.action} {log.details && <span>- {log.details}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaskDetailModal;