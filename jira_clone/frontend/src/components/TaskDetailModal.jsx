import React, { useEffect, useState, useContext } from 'react';
import { Modal, Descriptions, Button, Form, Input, Select, DatePicker, Tag, Spin, Alert, List, Avatar, Typography } from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { ProjectContext } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col } from 'antd';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';

const { Text } = Typography;

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
];
const typeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
];
const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

function canEditTask(user, userRole, task) {
  if (!user || !userRole || !task) return false;
  if (userRole === 'admin' || userRole === 'manager') return true;
  if (userRole === 'member' && (user.id === task.reporter_id || user.id === task.assignee_id)) return true;
  return false;
}

export default function TaskDetailModal({ isOpen, onRequestClose, taskId }) {
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentValue, setEditingCommentValue] = useState('');
  // Set currentUser synchronously from localStorage
  const [currentUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user')) || null;
  });
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchTask();
    // eslint-disable-next-line
  }, [isOpen, taskId, selectedProject]);

  const fetchTask = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      setTask(null);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTask(data.item);
    console.log('Fetched task (modal):', data.item); // <-- LOGGING
    setLoading(false);
    // Fetch members for assignee select
    if (data.item && data.item.project_id) fetchMembers(data.item.project_id);
    // Set selectedProject if not set or mismatched
    if (data.item && data.item.project_id && (!selectedProject || selectedProject.id !== data.item.project_id)) {
      fetchAndSetProject(data.item.project_id);
    }
  };

  // Set userRole when currentUser and task are available
  useEffect(() => {
    if (!currentUser || !task) return;
    if (selectedProject && selectedProject.admin_id === currentUser.id) setUserRole('admin');
    else if (task.assignee_id === currentUser.id) setUserRole('member');
    else if (task.reporter_id === currentUser.id) setUserRole('member');
    else setUserRole(currentUser.role);
    console.log('Current user (modal):', currentUser); // <-- LOGGING
    console.log('User role (modal):', userRole); // <-- LOGGING
  }, [currentUser, task, selectedProject]);

  // Helper to fetch and set project in context
  const fetchAndSetProject = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedProject(data.project);
    }
  };

  // Set form fields when entering edit mode or when task changes and editing is true
  useEffect(() => {
    if (editing && task) {
      const values = {
        title: task.title,
        description: task.description,
        status: task.status,
        type: task.type,
        priority: task.priority,
        assignee_id: task.assignee_id,
        due_date: task.due_date ? dayjs(task.due_date) : null,
      };
      console.log('useEffect setting form values (modal):', values); // <-- LOGGING
      form.setFieldsValue(values);
    }
  }, [editing, task, form]);

  // Reset form fields when exiting edit mode or when task changes and not editing
  useEffect(() => {
    if (!editing && task) {
      form.resetFields();
    }
  }, [editing, task, form]);

  const handleSave = async (values) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const payload = { ...values };
    if (payload.due_date && payload.due_date.format) {
      payload.due_date = payload.due_date.format('YYYY-MM-DD');
    }
    const res = await fetch(`http://localhost:5000/items/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      fetchTask();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: commentInput })
    });
    if (res.ok) {
      setCommentInput('');
      fetchTask();
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentValue(comment.content);
  };

  const handleSaveEditComment = async (comment) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: editingCommentValue })
    });
    if (res.ok) {
      setEditingCommentId(null);
      setEditingCommentValue('');
      fetchTask();
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentValue('');
  };

  if (!isOpen) return null;
  if (loading || !task) return <Modal open={isOpen} onCancel={onRequestClose} footer={null}><Spin style={{ margin: 40 }} /></Modal>;
  // If task is loaded, render modal content. Edit button will only show if canEdit is true (requires currentUser and userRole)

  const canEdit = canEditTask(currentUser, userRole, task);

  return (
    <Modal open={isOpen} onCancel={onRequestClose} footer={null} width={800} bodyStyle={{ padding: 0 }}>
      {/* Accent Bar & Header */}
      <div style={{ borderTop: `6px solid ${getPriorityColor(task.priority)}`, background: '#fff', borderBottom: '1px solid #eee', padding: '24px 32px 16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 32, marginRight: 16 }}>{getTypeIcon(task.type)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{task.title}</h1>
            <Tag color={getStatusColor(task.status)} style={{ fontSize: 15, borderRadius: 6 }}>{task.status}</Tag>
            <Tag color={getPriorityColor(task.priority)} style={{ fontSize: 15, borderRadius: 6 }}>{task.priority || 'No priority'}</Tag>
            {task.due_date && (
              <Tag icon={<UserOutlined />} color="default" style={{ fontSize: 15, borderRadius: 6 }}>
                Due {dayjs(task.due_date).format('MMM D')}
              </Tag>
            )}
          </div>
          <div style={{ marginTop: 8, color: '#888', fontSize: 15 }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {task.assignee_name || <span style={{ color: '#bbb' }}>Unassigned</span>}
          </div>
        </div>
        {canEdit && !editing && (
          <Button type="primary" icon={<EditOutlined />} onClick={() => {
            setEditing(true);
            if (task) {
              const values = {
                title: task.title,
                description: task.description,
                status: task.status,
                type: task.type,
                priority: task.priority,
                assignee_id: task.assignee_id,
                due_date: task.due_date ? dayjs(task.due_date) : null,
              };
              form.setFieldsValue(values);
            }
          }} style={{ marginLeft: 16 }}>Edit</Button>
        )}
      </div>
      <Row gutter={[32, 32]} style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px 0 32px' }}>
        <Col xs={24} md={16}>
          {/* Description */}
          <Card title={<span>Description</span>} bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ minHeight: 60, color: task.description ? '#222' : '#bbb', fontSize: 16 }}>
              {task.description || <span>No description provided</span>}
            </div>
          </Card>
          {/* Subtasks (if epic) */}
          {task.type === 'epic' && task.subtasks && task.subtasks.length > 0 && (
            <Card title={<span>Subtasks ({task.subtasks.length})</span>} bordered={false} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {task.subtasks.map(subtask => (
                  <Card
                    key={subtask.id}
                    size="small"
                    hoverable
                    onClick={() => navigate(`/items/${subtask.id}`)}
                    style={{
                      background: '#fafcff',
                      borderLeft: '4px solid #1677ff',
                      marginBottom: 0,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Type Icon */}
                      <div style={{ minWidth: 28, textAlign: 'center' }}>{getTypeIcon(subtask.type)}</div>
                      {/* Title */}
                      <div style={{ flex: 2, fontWeight: 500, fontSize: 16 }}>{subtask.title}</div>
                      {/* Status */}
                      <Tag color={getStatusColor(subtask.status)} style={{ minWidth: 80, textAlign: 'center' }}>{subtask.status}</Tag>
                      {/* Priority */}
                      <Tag color={getPriorityColor(subtask.priority)} style={{ minWidth: 70, textAlign: 'center' }}>{subtask.priority || 'No priority'}</Tag>
                      {/* Due Date */}
                      <div style={{ minWidth: 90, color: '#888', fontSize: 14 }}>
                        {subtask.due_date ? dayjs(subtask.due_date).format('MMM D') : ''}
                      </div>
                      {/* Assignee */}
                      <div style={{ minWidth: 100, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {subtask.assignee_name ? (
                          <>
                            <Avatar size={20} style={{ background: '#eee', color: '#555', fontSize: 12 }} icon={<UserOutlined />} />
                            <span style={{ fontSize: 14 }}>{subtask.assignee_name}</span>
                          </>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: 14 }}>Unassigned</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
          {/* Comments Section */}
          <Card title={<span>Comments</span>} bordered={false}>
            <div style={{ display: 'flex', marginBottom: 24 }}>
              <Avatar src={currentUser?.avatar} icon={<UserOutlined />} style={{ marginRight: 12 }} />
              <div style={{ flex: 1 }}>
                <Input.TextArea
                  rows={3}
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button 
                    type="primary" 
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(task.comments || []).map(comment => (
                <div key={comment.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Avatar src={comment.author_avatar} icon={<UserOutlined />} />
                  <div style={{ background: '#f6f8fa', borderRadius: 12, padding: '12px 16px', minWidth: 120, maxWidth: 600 }}>
                    <div style={{ fontWeight: 500, color: '#222' }}>{comment.author_name}</div>
                    <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{dayjs(comment.created_at).format('MMM D, YYYY [at] h:mm A')}</div>
                    <div style={{ fontSize: 15 }}>{comment.content}</div>
                  </div>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && <div style={{ color: '#bbb', textAlign: 'center' }}>No comments yet</div>}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          {/* Parent Epic if this is a child */}
          {task.parent_epic && (
            <Card bordered={false} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {getTypeIcon('epic')}
                <span style={{ fontWeight: 500 }}>{task.parent_epic.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag color={getStatusColor(task.parent_epic.status)}>{task.parent_epic.status}</Tag>
                <Tag color={getPriorityColor(task.parent_epic.priority)}>{task.parent_epic.priority || 'No priority'}</Tag>
              </div>
            </Card>
          )}
          {/* Metadata */}
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500, color: '#888' }}>
              <Descriptions.Item label={<span><UserOutlined /> Assignee</span>}>
                {task.assignee_name || <span style={{ color: '#bbb' }}>Unassigned</span>}
              </Descriptions.Item>
              <Descriptions.Item label={<span><UserOutlined /> Reporter</span>}>
                {task.reporter_name}
              </Descriptions.Item>
              <Descriptions.Item label={<span>Created</span>}>
                {dayjs(task.created_at).format('MMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={<span>Updated</span>}>
                {dayjs(task.updated_at).format('MMM D, YYYY')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      {/* Edit Mode */}
      {editing && canEdit && task && (
        <div style={{ position: 'absolute', top: 80, left: 0, width: '100%', background: 'rgba(255,255,255,0.98)', zIndex: 10, padding: 32 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            style={{ maxWidth: 600, margin: '0 auto' }}
          >
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}> 
              <Input /> 
            </Form.Item>
            <Form.Item name="description" label="Description"> 
              <Input.TextArea rows={3} /> 
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}> 
              <Select options={statusOptions} /> 
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}> 
              <Select options={typeOptions} /> 
            </Form.Item>
            <Form.Item name="priority" label="Priority"> 
              <Select allowClear options={priorityOptions} /> 
            </Form.Item>
            <Form.Item name="assignee_id" label="Assignee"> 
              <Select allowClear options={members.map(m => ({ value: m.user_id, label: m.username || m.email }))} /> 
            </Form.Item>
            <Form.Item name="due_date" label="Due Date"> 
              <DatePicker /> 
            </Form.Item>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>Save</Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setEditing(false)} icon={<CloseOutlined />}>Cancel</Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
}