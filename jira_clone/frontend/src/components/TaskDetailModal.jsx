import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, List, Button, Input, Tag, Typography, Space, Form, Alert, Spin, Select, Avatar, Tooltip, DatePicker, Popconfirm } from 'antd';
import { BugOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

const { Title, Text } = Typography;

function TaskDetailModal({ isOpen, onRequestClose, taskId, userRole, canEditOrDelete, currentUser }) {
  const { selectedProject } = useContext(ProjectContext);
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
      fetchSubtasks();
      fetchActivityLogs();
      if (selectedProject) fetchMembers();
    }
    // eslint-disable-next-line
  }, [isOpen, taskId, selectedProject]);

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

  const fetchMembers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setMembers(data.members);
  };

  const handleFieldChange = async (field, value) => {
    if (!task) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ [field]: value })
    });
    if (res.ok) fetchTaskDetails();
  };

  if (!isOpen) return null;

  const isBug = task && task.type === 'bug';
  // Determine if the user can edit this task
  const canEdit = task && canEditOrDelete && currentUser && canEditOrDelete(task);

  return (
    <Modal
      open={isOpen}
      onCancel={onRequestClose}
      title={<span>{isBug && <BugOutlined style={{ color: 'red', marginRight: 8 }} />}Task Details</span>}
      footer={null}
      width={700}
      destroyOnClose
    >
      {loading || !task ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin size="large" /></div>
      ) : (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>{task.title}</Title>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Status">
              <Tag color={task.status === 'done' ? 'green' : task.status === 'inprogress' ? 'gold' : task.status === 'inreview' ? 'blue' : 'default'}>{task.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Select
                value={task.priority || undefined}
                style={{ minWidth: 120 }}
                onChange={val => canEdit && handleFieldChange('priority', val)}
                placeholder="Select priority"
                allowClear
                disabled={!canEdit}
              >
                <Select.Option value="High">High</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="Low">Low</Select.Option>
              </Select>
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">{task.due_date ? <Tag color="purple">{task.due_date}</Tag> : '\u2014'}</Descriptions.Item>
            <Descriptions.Item label="Assignee">
              <Select
                value={task.assignee_id || undefined}
                style={{ minWidth: 120 }}
                onChange={val => canEdit && handleFieldChange('assignee_id', val)}
                placeholder="Assign to..."
                allowClear
                showSearch
                optionFilterProp="children"
                disabled={!canEdit}
              >
                {members.map(m => (
                  <Select.Option key={m.user_id} value={m.user_id}>{m.username || m.email}</Select.Option>
                ))}
              </Select>
            </Descriptions.Item>
            {isBug && <Descriptions.Item label="Severity" span={2}>
              <Select
                value={task.severity || undefined}
                style={{ minWidth: 120 }}
                onChange={val => canEdit && handleFieldChange('severity', val)}
                placeholder="Select severity"
                disabled={!canEdit}
              >
                <Select.Option value="Critical">Critical</Select.Option>
                <Select.Option value="Major">Major</Select.Option>
                <Select.Option value="Minor">Minor</Select.Option>
                <Select.Option value="Trivial">Trivial</Select.Option>
              </Select>
            </Descriptions.Item>}
            {isBug && <Descriptions.Item label="Steps to Reproduce" span={2}>{task.steps_to_reproduce || '\u2014'}</Descriptions.Item>}
            <Descriptions.Item label="Description" span={2}>
              <Input.TextArea value={task.description || ''} autoSize={{ minRows: 2, maxRows: 4 }}
                onChange={e => canEdit && handleFieldChange('description', e.target.value)}
                disabled={!canEdit}
              />
            </Descriptions.Item>
          </Descriptions>
          <SubtasksSection subtasks={subtasks} parentId={taskId} refresh={fetchSubtasks} userRole={userRole} />
          <ActivityLogSection logs={activityLogs} />
        </div>
      )}
    </Modal>
  );
}

function SubtasksSection({ subtasks, parentId, refresh, userRole }) {
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState(null);
  const [editForm] = Form.useForm();
  const [error, setError] = useState('');
  const canManage = ["admin", "project_manager", "developer", "reporter"].includes(userRole);

  const handleSubmit = async (values) => {
    setError('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${parentId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(values)
    });
    if (res.ok) {
      form.resetFields();
      setShowForm(false);
      refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add subtask');
    }
  };

  const handleEdit = (subtask) => {
    setEditId(subtask.id);
    editForm.setFieldsValue({
      title: subtask.title,
      status: subtask.status,
      priority: subtask.priority || '',
      due_date: subtask.due_date ? dayjs(subtask.due_date) : null
    });
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem('token');
    const values = await editForm.validateFields();
    if (values.due_date) values.due_date = values.due_date.format('YYYY-MM-DD');
    const res = await fetch(`http://localhost:5000/subtasks/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(values)
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
    <div style={{ marginTop: 32 }}>
      <Title level={5}>Subtasks</Title>
      <List
        dataSource={subtasks}
        renderItem={st => (
          <List.Item
            actions={editId === st.id ? [
              <Button type="primary" size="small" icon={<EditOutlined />} onClick={handleEditSave}>Save</Button>,
              <Button size="small" onClick={() => setEditId(null)}>Cancel</Button>
            ] : canManage ? [
              <Tooltip title="Edit Subtask"><Button type="link" size="small" onClick={() => handleEdit(st)} icon={<EditOutlined />} /></Tooltip>,
              <Popconfirm title="Delete this subtask?" onConfirm={() => handleDelete(st.id)} okText="Yes" cancelText="No">
                <Tooltip title="Delete Subtask"><Button type="link" danger size="small" icon={<DeleteOutlined />} /></Tooltip>
              </Popconfirm>
            ] : []}
          >
            {editId === st.id ? (
              <Form form={editForm} layout="inline" style={{ margin: 0 }}>
                <Form.Item name="title" style={{ margin: 0, width: 120 }} rules={[{ required: true, message: 'Title required' }]}> 
                  <Input />
                </Form.Item>
                <Form.Item name="status" style={{ margin: 0, width: 120 }} rules={[{ required: true }]}> 
                  <Select>
                    <Select.Option value="todo">To Do</Select.Option>
                    <Select.Option value="inprogress">In Progress</Select.Option>
                    <Select.Option value="inreview">In Review</Select.Option>
                    <Select.Option value="done">Done</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="priority" style={{ margin: 0, width: 100 }}>
                  <Select allowClear placeholder="Priority">
                    <Select.Option value="High">High</Select.Option>
                    <Select.Option value="Medium">Medium</Select.Option>
                    <Select.Option value="Low">Low</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="due_date" style={{ margin: 0, width: 140 }}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Form>
            ) : (
              <Space>
                <Text strong>{st.title}</Text>
                <Tag color={st.status === 'done' ? 'green' : st.status === 'inprogress' ? 'gold' : st.status === 'inreview' ? 'blue' : 'default'}>{st.status}</Tag>
                {st.priority && <Tag color={st.priority === 'High' ? 'red' : st.priority === 'Medium' ? 'orange' : 'blue'}>{st.priority}</Tag>}
                {st.due_date && <Tag color="purple">{st.due_date}</Tag>}
              </Space>
            )}
          </List.Item>
        )}
        locale={{ emptyText: 'No subtasks.' }}
      />
      {canManage && (
        <div style={{ marginTop: 12 }}>
          {!showForm ? (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>Add Subtask</Button>
          ) : (
            <Form form={form} layout="inline" onFinish={async (values) => {
              if (values.due_date) values.due_date = values.due_date.format('YYYY-MM-DD');
              await handleSubmit(values);
            }} style={{ marginTop: 8 }}>
              <Form.Item name="title" rules={[{ required: true, message: 'Title required' }]}> 
                <Input placeholder="Subtask title" />
              </Form.Item>
              <Form.Item name="status" initialValue="todo">
                <Select style={{ width: 120 }}>
                  <Select.Option value="todo">To Do</Select.Option>
                  <Select.Option value="inprogress">In Progress</Select.Option>
                  <Select.Option value="inreview">In Review</Select.Option>
                  <Select.Option value="done">Done</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="priority">
                <Select allowClear placeholder="Priority">
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="Low">Low</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="due_date">
                <DatePicker style={{ width: 140 }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Add</Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
              </Form.Item>
              {error && <Alert message={error} type="error" showIcon style={{ marginLeft: 8 }} />}
            </Form>
          )}
        </div>
      )}
      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 8 }} />}
    </div>
  );
}

function ActivityLogSection({ logs }) {
  return (
    <div style={{ marginTop: 32 }}>
      <Title level={5}>Activity Log</Title>
      <List
        dataSource={logs}
        renderItem={log => (
          <List.Item>
            <Text type="secondary" style={{ fontFamily: 'monospace' }}>[{log.created_at}]</Text> <Text strong>User {log.user_id}</Text> {log.action} {log.details && <span>- {log.details}</span>}
          </List.Item>
        )}
        locale={{ emptyText: 'No activity yet.' }}
      />
    </div>
  );
}

export default TaskDetailModal;