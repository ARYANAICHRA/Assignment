import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Table, Button, Tag, Modal, Select, Input, Spin, Alert, Space, Typography, Form, Avatar, Tooltip, DatePicker, Collapse, Card as AntCard, List as AntList, Tooltip as AntdTooltip } from 'antd';
import { PlusOutlined, BugOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UserOutlined, ArrowRightOutlined, CaretRightOutlined, CaretDownOutlined, MinusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TaskDetailModal from './TaskDetailModal';
import { useNavigate } from 'react-router-dom';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';

const { Option } = Select;
const { Title } = Typography;

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'bug', label: 'Bugs' },
  { value: 'feature', label: 'Features' },
  { value: 'task', label: 'Tasks' },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'status', label: 'Status' },
];

function ProjectTasks() {
  const { selectedProject } = useContext(ProjectContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugForm] = Form.useForm();
  const [bugError, setBugError] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [alert, setAlert] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm] = Form.useForm();
  const [taskError, setTaskError] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [epics, setEpics] = useState([]);
  // Expand/collapse state for epics
  const [expandedEpics, setExpandedEpics] = useState([]);
  const toggleEpic = (epicId) => {
    setExpandedEpics(expandedEpics =>
      expandedEpics.includes(epicId)
        ? expandedEpics.filter(id => id !== epicId)
        : [...expandedEpics, epicId]
    );
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
      fetchUsers();
      fetchColumns();
      fetchEpics();
    }
    // eslint-disable-next-line
  }, [selectedProject, typeFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let url = `http://localhost:5000/items/projects/${selectedProject.id}/items`;
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

  const fetchColumns = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/columns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setColumns(data.columns);
    }
  };

  const fetchEpics = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/projects/${selectedProject.id}/items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setEpics((data.items || []).filter(i => i.type && i.type.toLowerCase() === 'epic'));
    }
  };

  const handleEdit = (task) => {
    setEditTaskId(task.id);
    editForm.setFieldsValue({
      title: task.title,
      priority: task.priority || undefined,
      status: task.status,
      assignee_id: task.assignee_id || undefined,
      due_date: task.due_date ? dayjs(task.due_date) : undefined,
    });
    fetchUsers();
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem('token');
    const values = await editForm.validateFields();
    if (values.due_date && typeof values.due_date === 'object' && values.due_date.format) {
      values.due_date = values.due_date.format('YYYY-MM-DD');
    }
    await fetch(`http://localhost:5000/items/${editTaskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(values)
    });
    setEditTaskId(null);
    fetchTasks();
    setAlert('Task updated!');
    setTimeout(() => setAlert(''), 2000);
  };

  const handleDelete = async (id) => {
    console.log('Delete clicked', id);
    Modal.confirm({
      title: 'Delete Task',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`http://localhost:5000/items/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json().catch(() => ({}));
          console.log('Delete response:', res, data);
          if (res.ok) {
            fetchTasks().catch(e => console.error('fetchTasks error after delete:', e));
            setAlert('Task deleted!');
            setTimeout(() => setAlert(''), 2000);
          } else {
            setAlert(data.error || 'Failed to delete task');
            setTimeout(() => setAlert(''), 3000);
          }
        } catch (err) {
          console.error('Delete error:', err);
          setAlert('Network error while deleting task');
          setTimeout(() => setAlert(''), 3000);
        }
      }
    });
  };

  // Fix due_date and deprecations in handleBugSubmit
  const handleBugSubmit = async (values) => {
    setBugError('');
    const token = localStorage.getItem('token');
    // Find the 'todo' column or fallback to the first column
    let columnId = undefined;
    if (columns && columns.length > 0) {
      const todoCol = columns.find(col => (col.status || col.name.toLowerCase().replace(/\s/g, '')) === 'todo');
      columnId = todoCol ? todoCol.id : columns[0].id;
    }
    if (!columnId) {
      setBugError('No columns found for this project.');
      return;
    }
    // Fix due_date: send only YYYY-MM-DD
    const payload = { ...values, type: 'bug', column_id: columnId };
    if (payload.due_date && typeof payload.due_date === 'object' && payload.due_date.format) {
      payload.due_date = payload.due_date.format('YYYY-MM-DD');
    }
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setShowBugModal(false);
      bugForm.resetFields();
      fetchTasks();
      setAlert('Bug reported!');
      setTimeout(() => setAlert(''), 2000);
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
      const order = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, '': 0, null: 0, undefined: 0 };
      return sortDir === 'asc' ? (order[aVal] - order[bVal]) : (order[bVal] - order[aVal]);
    }
    if (sortField === 'status') {
      const order = { 'todo': 1, 'inprogress': 2, 'inreview': 3, 'done': 4 };
      return sortDir === 'asc' ? (order[aVal] - order[bVal]) : (order[bVal] - order[aVal]);
    }
    return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const handleTaskSubmit = async (values) => {
    setTaskError('');
    const token = localStorage.getItem('token');
    let columnId = undefined;
    if (columns && columns.length > 0) {
      const todoCol = columns.find(col => (col.status || col.name.toLowerCase().replace(/\s/g, '')) === 'todo');
      columnId = todoCol ? todoCol.id : columns[0].id;
    }
    if (!columnId) {
      setTaskError('No columns found for this project.');
      return;
    }
    const payload = { ...values, type: taskType, column_id: columnId };
    if (payload.due_date && typeof payload.due_date === 'object' && payload.due_date.format) {
      payload.due_date = payload.due_date.format('YYYY-MM-DD');
    }
    if (taskType !== 'epic' && values.parent_id) {
      payload.parent_id = values.parent_id;
    }
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setShowTaskModal(false);
      taskForm.resetFields();
      setTaskType('task');
      fetchTasks();
      setAlert('Task created!');
      setTimeout(() => setAlert(''), 2000);
    } else {
      const data = await res.json();
      setTaskError(data.error || 'Failed to create task');
    }
  };

  // Group tasks by epic
  const epicsList = tasks.filter(t => t.type && t.type.toLowerCase() === 'epic');
  const tasksByEpic = {};
  epicsList.forEach(epic => {
    tasksByEpic[epic.id] = [];
  });
  const nonEpicTasks = [];
  tasks.forEach(t => {
    if (t.type && t.type.toLowerCase() === 'epic') return;
    if (t.parent_id && tasksByEpic[t.parent_id]) {
      tasksByEpic[t.parent_id].push(t);
    } else {
      nonEpicTasks.push(t);
    }
  });
  // Flatten for table: [epic, ...children (if expanded), ...non-epic tasks]
  const groupedTasks = [];
  epicsList.forEach(epic => {
    groupedTasks.push({ ...epic, isEpic: true });
    if (expandedEpics.includes(epic.id)) {
      tasksByEpic[epic.id].forEach(child => groupedTasks.push({ ...child, isChild: true, parentEpicId: epic.id }));
    }
  });
  nonEpicTasks.forEach(t => groupedTasks.push(t));

  const taskTableColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => {
        if (record.isEpic) {
          const expanded = expandedEpics.includes(record.id);
          return (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                size="small"
                icon={expanded ? <MinusOutlined /> : <PlusOutlined />}
                onClick={e => {
                  e.stopPropagation();
                  toggleEpic(record.id);
                }}
                style={{ marginRight: 4 }}
              />
              <Tag color={text === 'bug' ? 'red' : text === 'feature' ? 'blue' : text === 'epic' ? '#722ed1' : 'green'}>{text}</Tag>
            </span>
          );
        }
        return (
        <Tag color={text === 'bug' ? 'red' : text === 'feature' ? 'blue' : text === 'epic' ? '#722ed1' : 'green'}>{text}</Tag>
        );
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => {
        if (record.isEpic) return (
          <span
            style={{ fontWeight: 700, color: '#722ed1', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); navigate(`/items/${record.id}`); }}
          >
            {text}
          </span>
        );
        if (record.isChild) return <span style={{ marginLeft: 32, display: 'inline-block' }}>{text}</span>;
        return (
          <AntdTooltip title="Click to view details">
            <span
              style={{ color: '#1677ff', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); navigate(`/items/${record.id}`); }}
            >
              {text}
            </span>
          </AntdTooltip>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (text) => (
        <Tag color={text === 'High' ? 'red' : text === 'Medium' ? 'orange' : 'blue'}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={text === 'todo' ? 'blue' : text === 'inprogress' ? 'orange' : text === 'inreview' ? 'purple' : 'green'}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : 'N/A'),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee_id',
      key: 'assignee_id',
      render: (assigneeId) => {
        const assignee = users.find(u => u.user_id === assigneeId);
        return assignee ? (
          <Space>
            <Avatar icon={<UserOutlined />} src={assignee.avatar_url} />
            <span>{assignee.username || assignee.email}</span>
          </Space>
        ) : (
          <Tag icon={<UserOutlined />}>Unassigned</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<ExclamationCircleOutlined />} onClick={() => { setSelectedTaskId(record.id); setEditTaskId(null); }} />
          </Tooltip>
          {canEditOrDelete(record) && (
            <Tooltip title="Delete">
              <Button type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Render child tasks as cards inside a panel
  const renderChildTasks = (children) => (
    <AntList
      dataSource={children}
      renderItem={child => (
        <AntCard
          key={child.id}
          size="small"
          style={{ marginBottom: 12, borderLeft: '4px solid #d3adf7', background: '#fff' }}
          bodyStyle={{ padding: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowRightOutlined style={{ color: '#722ed1', marginRight: 8, fontSize: 16 }} />
            <span style={{ fontWeight: 500 }}>{child.title}</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#888' }}>{child.type && child.type.charAt(0).toUpperCase() + child.type.slice(1)}</span>
            {child.status && <Tag style={{ marginLeft: 12 }}>{child.status}</Tag>}
            {child.priority && <Tag color={child.priority === 'High' ? 'red' : child.priority === 'Medium' ? 'orange' : 'blue'} style={{ marginLeft: 12 }}>{child.priority}</Tag>}
          </div>
        </AntCard>
      )}
      locale={{ emptyText: <span style={{ color: '#bbb' }}>No child tasks</span> }}
    />
  );

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  // Helper: get user role in project
  const getUserRole = () => {
    if (!selectedProject || !currentUser.id) return null;
    if (selectedProject.admin_id === currentUser.id) return 'admin';
    const member = users.find(u => u.user_id === currentUser.id);
    return member ? (member.role || 'member') : null;
  };
  const userRole = getUserRole();

  // Helper: can edit/delete this item?
  const canEditOrDelete = (item) => {
    if (!item) return false;
    if (!currentUser.id) return false;
    if (selectedProject.admin_id === currentUser.id) return true;
    const member = users.find(u => u.user_id === currentUser.id);
    if (member && member.role === 'manager') return true;
    if (item.assignee_id === currentUser.id) return true;
    if (item.reporter_id === currentUser.id) return true;
    return false;
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Project Tasks</Title>
        <Space>
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}>
            {TYPE_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
          <Select value={sortField} onChange={setSortField} style={{ width: 120 }} placeholder="Sort by">
            <Option value="">None</Option>
            {SORT_OPTIONS.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
          </Select>
          {sortField && (
            <Button size="small" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? 'Asc' : 'Desc'}</Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowTaskModal(true)}>
            Create
          </Button>
        </Space>
      </div>
      {alert && <Alert message={alert} type="success" showIcon style={{ marginBottom: 12 }} />}
      <Table
        dataSource={groupedTasks}
        columns={taskTableColumns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        bordered
        rowClassName={record => record.isEpic ? 'epic-row' : record.isChild ? 'child-task-row' : ''}
        style={{ marginTop: 16 }}
      />
      <Modal
        open={showTaskModal}
        title="Create"
        onCancel={() => { setShowTaskModal(false); setTaskType('task'); }}
        onOk={() => taskForm.submit()}
        destroyOnClose
      >
        <Form form={taskForm} layout="vertical" onFinish={handleTaskSubmit}>
          <Form.Item label="Type" name="type" initialValue="task" rules={[{ required: true, message: 'Please select a type' }]}> 
            <Select value={taskType} onChange={val => { setTaskType(val); taskForm.setFieldsValue({ parent_id: undefined }); }}>
              <Option value="epic">Epic</Option>
              <Option value="task">Task</Option>
              <Option value="bug">Bug</Option>
              <Option value="feature">Feature</Option>
            </Select>
          </Form.Item>
          {taskType !== 'epic' && (
            <Form.Item label="Parent Epic" name="parent_id">
              <Select allowClear placeholder="Select an epic">
                {epics.map(e => (
                  <Option key={e.id} value={e.id}>{e.title}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title is required' }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="Priority" name="priority">
            <Select allowClear>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Assignee" name="assignee_id">
            <Select allowClear showSearch optionFilterProp="children" placeholder="Assign to...">
              {currentUser.id && (
                <Option value={currentUser.id} key="me">Assign to me ({currentUser.username || currentUser.email || 'Me'})</Option>
              )}
              {users.filter(m => m.user_id !== currentUser.id).map(m => (
                <Option key={m.user_id} value={m.user_id}>{m.username || m.email}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Due Date" name="due_date">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          {taskError && <Alert message={taskError} type="error" showIcon style={{ marginBottom: 12 }} />}
        </Form>
      </Modal>
      <TaskDetailModal isOpen={!!selectedTaskId} onRequestClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />
      <style>{`
        .child-task-row td {
          border-left: 4px solid #d3adf7 !important;
          background: #fcfcff;
        }
        .epic-row td {
          background: #faf7ff;
        }
      `}</style>
    </div>
  );
}

export default ProjectTasks;
