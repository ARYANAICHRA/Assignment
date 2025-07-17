import React, { useEffect, useState, useContext } from 'react';
import { Modal, Descriptions, Button, Form, Input, Select, DatePicker, Tag, Spin, Alert, List, Avatar, Typography } from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { ProjectContext } from '../context/ProjectContext';

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
    <Modal open={isOpen} onCancel={onRequestClose} footer={null} title="Task Details" width={700}>
      {!editing ? (
        <>
          {/* Parent Epic if this is a child */}
          {task.parent_epic && (
            <div style={{ marginBottom: 24 }}>
              <h3>Parent Epic</h3>
              <Descriptions bordered size="small">
                <Descriptions.Item label="Title">{task.parent_epic.title}</Descriptions.Item>
                <Descriptions.Item label="Status">{task.parent_epic.status}</Descriptions.Item>
                <Descriptions.Item label="Priority">{task.parent_epic.priority}</Descriptions.Item>
                <Descriptions.Item label="Due Date">{task.parent_epic.due_date || '-'}</Descriptions.Item>
              </Descriptions>
            </div>
          )}
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Title" span={2}>{task.title}</Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>{task.description}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag>{task.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Type"><Tag>{task.type}</Tag></Descriptions.Item>
            <Descriptions.Item label="Priority"><Tag>{task.priority}</Tag></Descriptions.Item>
            <Descriptions.Item label="Assignee">{task.assignee_name || <Tag>Unassigned</Tag>}</Descriptions.Item>
            <Descriptions.Item label="Reporter">{task.reporter_name || <Tag>Unknown</Tag>}</Descriptions.Item>
            <Descriptions.Item label="Due Date">{task.due_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created At">{task.created_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{task.updated_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="Task ID">{task.id}</Descriptions.Item>
          </Descriptions>
          {/* Subtasks if this is an epic */}
          {task.type === 'epic' && task.subtasks && task.subtasks.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3>Subtasks</h3>
              <List
                dataSource={task.subtasks}
                renderItem={subtask => (
                  <List.Item>
                    <span style={{ fontWeight: 500 }}>{subtask.title}</span>
                    <Tag color={subtask.status === 'done' ? 'green' : subtask.status === 'inprogress' ? 'orange' : subtask.status === 'inreview' ? 'purple' : 'blue'}>{subtask.status}</Tag>
                    <Tag color={subtask.priority === 'High' ? 'red' : subtask.priority === 'Medium' ? 'orange' : subtask.priority === 'Critical' ? 'volcano' : 'blue'}>{subtask.priority || 'None'}</Tag>
                    <span style={{ marginLeft: 12, color: '#888' }}>{subtask.due_date ? dayjs(subtask.due_date).format('YYYY-MM-DD') : 'No due date'}</span>
                  </List.Item>
                )}
                locale={{ emptyText: <span style={{ color: '#bbb' }}>No subtasks</span> }}
              />
            </div>
          )}
          {canEdit && (
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => {
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
                console.log('Setting form values on edit (modal):', values); // <-- LOGGING
                form.setFieldsValue(values);
              }
            }} icon={<EditOutlined />}>Edit</Button>
          )}
        </>
      ) : (
        canEdit && task ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
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
            <div style={{ marginTop: 16 }}>
              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>Save</Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setEditing(false)} icon={<CloseOutlined />}>Cancel</Button>
            </div>
          </Form>
        ) : (
          <Alert type="error" message="You do not have permission to edit this item." showIcon style={{ marginTop: 16 }} />
        )
      )}
      {/* Comments Section */}
      <div style={{ marginTop: 32 }}>
        <h3>Comments</h3>
        <List
          dataSource={task.comments || []}
          renderItem={comment => (
            <List.Item
              actions={currentUser && comment.user_id === currentUser.id ? [
                editingCommentId === comment.id ? (
                  <>
                    <Button icon={<SaveOutlined />} size="small" onClick={() => handleSaveEditComment(comment)} />
                    <Button icon={<CloseOutlined />} size="small" onClick={handleCancelEditComment} />
                  </>
                ) : (
                  <Button icon={<EditOutlined />} size="small" onClick={() => handleEditComment(comment)} />
                )
              ] : []}
            >
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <div>
                <Text strong>{comment.author_name}:</Text> {editingCommentId === comment.id ? (
                  <Input.TextArea
                    value={editingCommentValue}
                    onChange={e => setEditingCommentValue(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />
                ) : (
                  comment.content
                )}
                <Text type="secondary"> ({comment.created_at})</Text>
              </div>
            </List.Item>
          )}
        />
        <Input.TextArea
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          placeholder="Add a comment..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ marginTop: 12 }}
        />
        <Button type="primary" onClick={handleAddComment} style={{ marginTop: 8 }}>Add Comment</Button>
      </div>
    </Modal>
  );
}