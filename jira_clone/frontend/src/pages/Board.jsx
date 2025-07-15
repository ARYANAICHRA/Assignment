import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ProjectContext } from '../context/ProjectContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';

const columnsDefault = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'inreview', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

function Board() {
  const { selectedProject } = useContext(ProjectContext);
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], inreview: [], done: [] });
  const [columns, setColumns] = useState(columnsDefault); // Store columns from backend
  const [activeId, setActiveId] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null); // Store current user id
  const [draggedTask, setDraggedTask] = useState(null); // For DragOverlay
  const [optimisticTasks, setOptimisticTasks] = useState(null); // For instant UI update
  const [prevTasks, setPrevTasks] = useState(null); // Store previous state for rollback
  const [syncing, setSyncing] = useState(false); // Track if a backend sync is in progress after optimistic update
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    // Fetch user id on mount
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchColumns();
      fetchTasks();
    }
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchColumns = async () => {
    if (!selectedProject) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/columns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let backendCols = data.columns.map(col => ({
          key: col.status || col.name.toLowerCase().replace(/\s/g, ''),
          label: col.name,
          id: col.id
        }));
        // Remove duplicates by key (keep first occurrence)
        const seen = new Set();
        backendCols = backendCols.filter(col => {
          if (seen.has(col.key)) return false;
          seen.add(col.key);
          return true;
        });
        if (backendCols.length === 0) {
          await createDefaultColumns(token);
          return fetchColumns();
        }
        setColumns(backendCols);
      }
    } catch (e) {
      setColumns(columnsDefault);
    }
  };

  // Helper to create default columns if none exist
  const createDefaultColumns = async (token) => {
    // Fetch columns again to avoid race conditions
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/columns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let existing = [];
    if (res.ok) {
      const data = await res.json();
      existing = data.columns.map(col => col.status || col.name.toLowerCase().replace(/\s/g, ''));
    }
    const defaultCols = [
      { name: 'To Do', order: 1, status: 'todo' },
      { name: 'In Progress', order: 2, status: 'inprogress' },
      { name: 'In Review', order: 3, status: 'inreview' },
      { name: 'Done', order: 4, status: 'done' },
    ];
    for (const col of defaultCols) {
      if (!existing.includes(col.status)) {
        await fetch(`http://localhost:5000/projects/${selectedProject.id}/columns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(col)
        });
      }
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Group items by status
        const grouped = { todo: [], inprogress: [], inreview: [], done: [] };
        data.items.forEach(item => {
          if (grouped[item.status]) grouped[item.status].push(item);
        });
        setTasks(grouped);
        // If we are syncing after a drag, clear optimisticTasks now
        if (syncing) {
          setOptimisticTasks(null);
          setSyncing(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const token = localStorage.getItem('token');
    // Find the column with status 'todo' for this project
    const todoCol = columns.find(col => col.key === 'todo');
    if (!todoCol) return alert('No To Do column found for this project.');
    if (!userId) return alert('User not loaded.');
    const status = 'todo';
    const column_id = todoCol.id;
    const type = 'task';
    const project_id = selectedProject.id;
    const reporter_id = userId;
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: newTask, status, column_id, type, project_id, reporter_id })
    });
    if (res.ok) {
      setNewTask('');
      fetchTasks();
    }
  };

  const handleDelete = async (itemId) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
  };

  // Droppable column wrapper
  function DroppableColumn({ col, children }) {
    const { setNodeRef } = useDroppable({ id: col.key });
    return (
      <div ref={setNodeRef} className="bg-white rounded-lg shadow p-4 min-h-[300px]">
        <h2 className="text-lg font-semibold mb-4 text-center">{col.label}</h2>
        {children}
      </div>
    );
  }

  const handleDragStart = (event) => {
    const { active } = event;
    const task = Object.values(tasks).flat().find(t => t.id === active.id);
    setDraggedTask(task);
    setActiveId(active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setDraggedTask(null);
    setActiveId(null);
    if (!over) {
      return;
    }
    const fromCol = Object.keys(tasks).find((key) => tasks[key].some((item) => item.id === active.id));
    const toCol = over.id;
    if (!fromCol || !toCol || fromCol === toCol) {
      return;
    }
    const targetCol = columns.find(col => col.key === toCol);
    if (!targetCol) {
      return;
    }
    // Save previous state for rollback
    setPrevTasks(tasks);
    // Optimistically update UI
    const newTasks = { ...tasks };
    const movedTask = newTasks[fromCol].find(t => t.id === active.id);
    newTasks[fromCol] = newTasks[fromCol].filter(t => t.id !== active.id);
    newTasks[toCol] = [ { ...movedTask, status: toCol, column_id: targetCol.id }, ...newTasks[toCol] ];
    setOptimisticTasks(newTasks);
    // Update backend
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/items/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: toCol, column_id: targetCol.id })
      });
      if (!res.ok) {
        setOptimisticTasks(prevTasks);
        setTimeout(() => setOptimisticTasks(null), 1000);
      } else {
        setSyncing(true); // Wait for fetchTasks to clear optimisticTasks
        fetchTasks();
      }
    } catch {
      setOptimisticTasks(prevTasks);
      setTimeout(() => setOptimisticTasks(null), 1000);
    }
  };

  // Use optimisticTasks if present
  const displayTasks = optimisticTasks || tasks;

  // Only show loading on initial board load, not after drag/drop
  const showLoading = loading && !optimisticTasks && !prevTasks && Object.values(tasks).every(arr => arr.length === 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Kanban Board</h1>
      {selectedProject && (
        <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="Add new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Add</button>
        </form>
      )}
      {showLoading ? <div>Loading...</div> : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {columns.map((col) => (
            <DroppableColumn key={col.key} col={col}>
              <SortableContext items={displayTasks[col.key]?.map(i => i.id) || []} strategy={verticalListSortingStrategy}>
                {displayTasks[col.key]?.map((task) => (
                  <div key={task.id} className={`relative group ${activeId === task.id ? 'opacity-50' : ''}`}>
                    <SortableItem id={task.id} title={task.title} />
                    <button
                      className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDelete(task.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>
        <DragOverlay>
          {draggedTask ? (
            <div className="mb-4 p-3 rounded bg-blue-100 text-gray-800 shadow cursor-pointer">
              {draggedTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default Board;
