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
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';
import { Row, Col, Card, Button, Input, Spin, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiFetch } from '../utils/api';

const columnsDefault = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'inreview', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

function Board() {
  const { selectedProject, projectMembers, myProjectRole, membersLoading, membersError } = useContext(ProjectContext);
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
  const sensors = useSensors(useSensor(PointerSensor));
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchUser = async () => {
      const res = await apiFetch('http://localhost:5000/me');
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
    const res = await apiFetch(`http://localhost:5000/projects/${selectedProject.id}/columns`);
    if (res.ok) {
      const data = await res.json();
      let backendCols = data.columns.map(col => ({
        key: col.status || col.name.toLowerCase().replace(/\s/g, ''),
        label: col.name,
        id: col.id
      }));
      const seen = new Set();
      backendCols = backendCols.filter(col => {
        if (seen.has(col.key)) return false;
        seen.add(col.key);
        return true;
      });
      if (backendCols.length === 0) {
        await createDefaultColumns();
        return fetchColumns();
      }
      setColumns(backendCols);
    }
  };

  const createDefaultColumns = async () => {
    const res = await apiFetch(`http://localhost:5000/projects/${selectedProject.id}/columns`);
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
        await apiFetch(`http://localhost:5000/projects/${selectedProject.id}/columns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(col)
        });
      }
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/items/projects/${selectedProject.id}/items`);
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
    const col = columns.find(col => col.key === colKey);
    if (!col) return message.error('No column found for this project.');
    if (!userId) return message.error('User not loaded.');
    const status = colKey;
    const column_id = col.id;
    const type = 'task';
    const project_id = selectedProject.id;
    const reporter_id = userId;
    const res = await apiFetch(`http://localhost:5000/items/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await apiFetch(`http://localhost:5000/items/${itemId}`, { method: 'DELETE' });
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
    setPrevTasks(tasks);
    const newTasks = { ...tasks };
    const movedTask = newTasks[fromCol].find(t => t.id === active.id);
    newTasks[fromCol] = newTasks[fromCol].filter(t => t.id !== active.id);
    newTasks[toCol] = [ { ...movedTask, status: toCol, column_id: targetCol.id }, ...newTasks[toCol] ];
    setOptimisticTasks(newTasks);
    const res = await apiFetch(`http://localhost:5000/items/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
  };

  // Helper: can edit/move/delete this task?
  const canEditOrMove = (task) => {
    if (!userId) return false;
    if (selectedProject && selectedProject.manager_id === userId) return true;
    if (task.assignee_id === userId) return true;
    if (task.reporter_id === userId) return true;
    // Use centralized project role
    if (myProjectRole === 'admin' || myProjectRole === 'manager' || myProjectRole === 'member') return true;
    return false;
  };

  // Use centralized project role for permission
  const canEdit = myProjectRole === 'admin' || myProjectRole === 'manager' || myProjectRole === 'member';

  // Show loading or error for members fetch
  if (membersLoading) {
    return <Spin style={{ display: 'block', margin: '80px auto' }} tip="Loading project members..." />;
  }
  if (membersError) {
    return <div style={{ padding: 32, color: '#ff4d4f' }}>{membersError}</div>;
  }
  if (!myProjectRole) {
    return <div style={{ padding: 32, color: '#faad14', fontWeight: 500 }}>You are not a member of this project.</div>;
  }

  const displayTasks = optimisticTasks || tasks;

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => {
          const { active } = e;
          const task = Object.values(tasks).flat().find(t => t.id === active.id);
          if (!canEditOrMove(task)) return;
          handleDragStart(e);
        }}
        onDragEnd={e => {
          const { active } = e;
          const task = Object.values(tasks).flat().find(t => t.id === active.id);
          if (!canEditOrMove(task)) return;
          handleDragEnd(e);
        }}
      >
        <Row gutter={24}>
          {columns.map(col => {
            const { setNodeRef, isOver } = useDroppable({ id: col.key });
            return (
              <Col key={col.key} xs={24} sm={12} md={6}>
                <Card
                  ref={setNodeRef}
                  title={col.label}
                  bordered={false}
                  style={{ minHeight: 350, background: isOver ? '#e6f4ff' : '#fff', marginBottom: 16, transition: 'background 0.2s' }}
                >
                  {canEdit && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      block
                      style={{ marginBottom: 12 }}
                      onClick={() => { setShowTaskModal(true); setTaskModalCol(col.key); }}
                    >
                      Add Task
                    </Button>
                  )}
                  <SortableContext items={displayTasks[col.key].map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {displayTasks[col.key].length === 0 && (
                      <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontStyle: 'italic', border: '1px dashed #eee', borderRadius: 6, marginBottom: 8 }}>
                        Drop tasks here
                      </div>
                    )}
                    {displayTasks[col.key].map(task => (
                      <SortableItem key={task.id} id={task.id} disabled={!canEditOrMove(task)}>
                        <div style={{ position: 'relative', marginBottom: 8, maxWidth: 320, width: '100%' }}>
                          <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 2 }}>
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                              size="small"
                              onClick={() => canEditOrMove(task) && handleDelete(task.id)}
                              aria-label="Delete task"
                              disabled={!canEditOrMove(task)}
                            />
                          </div>
                          <Card
                            size="small"
                            style={{
                              borderLeft: task.status === 'done' ? '4px solid #52c41a' : '4px solid #1677ff',
                              padding: '12px 16px 12px 16px',
                              minHeight: 64,
                              boxShadow: '0 1px 4px #f0f1f2',
                              width: '100%',
                              maxWidth: 320,
                              margin: 0
                            }}
                            bodyStyle={{ padding: 0, paddingRight: 32, position: 'relative' }}
                          >
                            <div style={{ fontWeight: 500, fontSize: 15, padding: '8px 0 2px 0', wordBreak: 'break-word' }}>{task.title}</div>
                            <div style={{ color: '#888', fontSize: 12, paddingBottom: 4 }}>{task.status}</div>
                          </Card>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </Card>
              </Col>
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
      {loading && <Spin size="large" style={{ position: 'fixed', top: '50%', left: '50%' }} />}
    </div>
  );
}

export default Board;
