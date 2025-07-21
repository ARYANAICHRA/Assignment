import React, { useState, useEffect, useContext } from 'react';
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
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';
import { Row, Col, Card, Button, Input, Spin, Modal, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TaskDetailModal from '../components/TaskDetailModal';

const columnsDefault = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'inreview', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

// ✅ New Component: DroppableColumn
// This isolates the useDroppable hook, fixing the error.
function DroppableColumn({ col, colTasks, onAddTaskClick, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <Col xs={24} sm={12} md={6}>
      <div ref={setNodeRef} style={{ height: '100%' }}>
        <Card
          title={col.label}
          bordered={false}
          style={{ minHeight: 420, background: isOver ? '#e6f4ff' : '#f9f9f9', marginBottom: 16, transition: 'background 0.2s' }}
        >
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 12 }}
            onClick={onAddTaskClick}
          >
            Add Task
          </Button>
          <SortableContext id={col.key} items={colTasks.length ? colTasks.map(t => t.id) : [col.key + '-placeholder']} strategy={verticalListSortingStrategy}>
            {colTasks.length === 0 ? (
              <SortableItem id={col.key + '-placeholder'}>
                <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontStyle: 'italic', border: '1px dashed #eee', borderRadius: 6, marginBottom: 8, opacity: 0.5 }}>
                  Drop tasks here
                </div>
              </SortableItem>
            ) : (
              colTasks.map(task => (
                <SortableItem key={task.id} id={task.id}>
                  <div style={{ position: 'relative', marginBottom: 8, maxWidth: 320, width: '100%', cursor: 'pointer' }} onClick={() => onTaskClick(task.id)}>
                    <Card
                      size="small"
                      style={{
                        borderLeft: task.status === 'done' ? '4px solid #52c41a' : '4px solid #1677ff',
                        padding: '12px 16px',
                        minHeight: 64,
                        boxShadow: '0 1px 4px #f0f1f2',
                        width: '100%',
                        maxWidth: 320,
                        margin: 0
                      }}
                      styles={{ body: { padding: 0, paddingRight: 32, position: 'relative' } }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 15, padding: '8px 0 2px 0', wordBreak: 'break-word' }}>{task.title}</div>
                      {task.priority && (
                        <Tag
                          color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : task.priority === 'Low' ? 'blue' : 'default'}
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          {task.priority}
                        </Tag>
                      )}
                    </Card>
                  </div>
                </SortableItem>
              ))
            )}
          </SortableContext>
        </Card>
      </div>
    </Col>
  );
}


function ProjectBoard() {
  const { selectedProject } = useContext(ProjectContext);
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], inreview: [], done: [] });
  const [columns, setColumns] = useState(columnsDefault);
  const [activeId, setActiveId] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [optimisticTasks, setOptimisticTasks] = useState(null);
  const [prevTasks, setPrevTasks] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalCol, setTaskModalCol] = useState('todo');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
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
        let backendCols = data.columns.map(col => {
          let key = col.name.toLowerCase().replace(/\s/g, '');
          if (key === 'todo') key = 'todo';
          else if (key === 'inprogress') key = 'inprogress';
          else if (key === 'inreview') key = 'inreview';
          else if (key === 'done') key = 'done';
          return {
            key,
            id: col.id
          };
        });
        // Merge with columnsDefault to ensure all four columns are present and in order
        const mergedCols = columnsDefault.map(def => {
          const found = backendCols.find(col => col.key === def.key);
          return found ? { ...def, id: found.id } : def;
        });
        setColumns(mergedCols);
      }
    } catch (e) {
      setColumns(columnsDefault);
    }
  };

  const createDefaultColumns = async (token) => {
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
      const res = await fetch(`http://localhost:5000/items/projects/${selectedProject.id}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const grouped = { todo: [], inprogress: [], inreview: [], done: [] };
        data.items.forEach(item => {
          if (grouped[item.status]) grouped[item.status].push(item);
        });
        setTasks(grouped);
        if (syncing) {
          setOptimisticTasks(null);
          setSyncing(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (colKey) => {
    if (!newTask.trim()) return;
    const token = localStorage.getItem('token');
    const col = columns.find(c => c.key === colKey);
    if (!col) return message.error('No column found for this project.');
    if (!userId) return message.error('User not loaded.');
    const status = colKey;
    const column_id = col.id;
    const type = 'task';
    const project_id = selectedProject.id;
    const reporter_id = userId;
    const res = await fetch(`http://localhost:5000/items/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: newTask, status, column_id, type, project_id, reporter_id })
    });
    if (res.ok) {
      setNewTask('');
      setShowTaskModal(false);
      fetchTasks();
      message.success('Task created!');
    }
  };

  const handleDelete = async (itemId) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTasks();
    message.success('Task deleted');
  };

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
    if (!over) return;

    const fromCol = Object.keys(tasks).find((key) => tasks[key].some((item) => item.id === active.id));
    let toCol = null;
    
    if (over.id.endsWith && over.id.endsWith('-placeholder')) {
      toCol = over.id.replace('-placeholder', '');
    } else if (columns.some(col => col.key === over.id)) {
      toCol = over.id;
    } else {
      toCol = Object.keys(tasks).find((key) => tasks[key].some((item) => item.id === over.id));
    }

    if (!fromCol || !toCol || fromCol === toCol) return;

    const targetCol = columns.find(col => col.key === toCol);
    if (!targetCol) return;

    setPrevTasks(tasks);
    const newTasks = { ...tasks };
    const movedTask = newTasks[fromCol].find(t => t.id === active.id);
    newTasks[fromCol] = newTasks[fromCol].filter(t => t.id !== active.id);
    newTasks[toCol] = [{ ...movedTask, status: toCol, column_id: targetCol.id }, ...newTasks[toCol]];
    setOptimisticTasks(newTasks);

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
        message.error('Failed to move task');
      } else {
        setSyncing(true);
        fetchTasks();
        message.success('Task moved!');
      }
    } catch {
      setOptimisticTasks(prevTasks);
      setTimeout(() => setOptimisticTasks(null), 1000);
      message.error('Failed to move task');
    }
  };

  const displayTasks = optimisticTasks || tasks;

  if (!selectedProject) {
    return <div style={{ padding: 32, textAlign: 'center' }}>No project selected.</div>;
  }
  if (!columns || !Array.isArray(columns)) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading board...</div>;
  }
  if (!displayTasks || typeof displayTasks !== 'object') {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading tasks...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Row gutter={24}>
          {/* ✅ Updated map to use the new component */}
          {columns.map(col => {
            const colTasks = (displayTasks && displayTasks[col.key]) || [];
            return (
              <DroppableColumn
                key={col.key}
                col={col}
                colTasks={colTasks}
                onAddTaskClick={() => {
                  setShowTaskModal(true);
                  setTaskModalCol(col.key);
                }}
                onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              />
            );
          })}
        </Row>
        <DragOverlay>
          {draggedTask ? (
            <Card size="small" style={{ borderLeft: '4px solid #1677ff', background: '#f0f5ff' }}>
              <div style={{ fontWeight: 500 }}>{draggedTask.title}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{draggedTask.status}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
      <Modal
        open={showTaskModal}
        title="Add New Task"
        onCancel={() => setShowTaskModal(false)}
        onOk={() => handleAddTask(taskModalCol)}
        okText="Add Task"
        destroyOnClose
      >
        <Input
          placeholder="Task title"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onPressEnter={() => handleAddTask(taskModalCol)}
        />
      </Modal>
      <TaskDetailModal isOpen={!!selectedTaskId} onRequestClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} userRole={null} />
      {loading && <Spin size="large" style={{ position: 'fixed', top: '50%', left: '50%' }} />}
    </div>
  );
}

export default ProjectBoard;