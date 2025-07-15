import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Table, Button, Tag, Modal, Select, Input, Spin, Alert, Space, Typography, Form, Avatar, Tooltip, DatePicker } from 'antd';
import { PlusOutlined, BugOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

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
    editForm.setFieldsValue({
      title: task.title,
      status: task.status,
      assignee_id: task.assignee_id || ''
    });
    fetchUsers();
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem('token');
    const values = await editForm.validateFields();
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
    Modal.confirm({
      title: 'Delete Task',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/items/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchTasks();
        setAlert('Task deleted!');
        setTimeout(() => setAlert(''), 2000);
      }
    });
  };

  const handleBugSubmit = async (values) => {
    setBugError('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...values, type: 'bug' })
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

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        if (type === 'bug') return <Tag color="red" icon={<BugOutlined />}>Bug</Tag>;
        if (type === 'feature') return <Tag color="blue">Feature</Tag>;
        return <Tag color="green">Task</Tag>;
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => editTaskId === record.id ? (
        <Form form={editForm} layout="inline" style={{ margin: 0 }}>
          <Form.Item name="title" style={{ margin: 0, width: 120 }} rules={[{ required: true, message: 'Title required' }]}> 
            <Input />
          </Form.Item>
        </Form>
      ) : text,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => editTaskId === record.id ? (
        <Form form={editForm} layout="inline" style={{ margin: 0 }}>
          <Form.Item name="status" style={{ margin: 0, width: 120 }} rules={[{ required: true }]}> 
            <Select>
              <Option value="todo">To Do</Option>
              <Option value="inprogress">In Progress</Option>
              <Option value="inreview">In Review</Option>
              <Option value="done">Done</Option>
            </Select>
          </Form.Item>
        </Form>
      ) : <Tag color={status === 'done' ? 'green' : status === 'inprogress' ? 'gold' : status === 'inreview' ? 'blue' : 'default'}>{status}</Tag>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity, record) => record.type === 'bug' && severity ? <Tag color={severity === 'Critical' ? 'red' : severity === 'Major' ? 'orange' : 'yellow'}>{severity}</Tag> : null,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee_id',
      key: 'assignee_id',
      render: (assignee_id) => {
        const user = users.find(u => u.user_id === assignee_id);
        return user ? (
          <Space>
            <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} size="small" />
            {user.username}
          </Space>
        ) : 'Unassigned';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => editTaskId === record.id ? (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={handleEditSave}>Save</Button>
          <Button size="small" onClick={() => setEditTaskId(null)}>Cancel</Button>
        </Space>
      ) : (
        <Space>
          <Tooltip title="Edit Task"><Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} /></Tooltip>
          <Tooltip title="Delete Task"><Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} /></Tooltip>
        </Space>
      ),
    },
  ];

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
          <Button type="primary" icon={<BugOutlined />} onClick={() => setShowBugModal(true)}>
            Report Bug
          </Button>
        </Space>
      </div>
      {alert && <Alert message={alert} type="success" showIcon style={{ marginBottom: 12 }} />}
      <Table
        dataSource={sortedTasks}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        bordered
      />
      <Modal
        open={showBugModal}
        title="Report Bug"
        onCancel={() => setShowBugModal(false)}
        onOk={() => bugForm.submit()}
        okText="Report"
        destroyOnClose
      >
        <Form form={bugForm} layout="vertical" onFinish={handleBugSubmit}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title is required' }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="Severity" name="severity">
            <Select>
              <Option value="Critical">Critical</Option>
              <Option value="Major">Major</Option>
              <Option value="Minor">Minor</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Steps to Reproduce" name="steps_to_reproduce">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="Priority" name="priority">
            <Select allowClear>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Due Date" name="due_date">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          {bugError && <Alert message={bugError} type="error" showIcon style={{ marginBottom: 12 }} />}
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectTasks;
