import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, List, Button, Form, Input, Select, DatePicker, message, Row, Col, Tag, Avatar, Divider } from 'antd';
import dayjs from 'dayjs';
import { UserOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const allowedRoles = ['admin', 'manager', 'assignee', 'reporter', 'member'];

const ItemDetail = () => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [epic, setEpic] = useState(null);

  // Get current user and role
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/items/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch item details');
        const data = await res.json();
        setItem(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  useEffect(() => {
    // Fetch project members for assignee select
    const fetchUsers = async () => {
      if (!item || !item.item || !item.item.project_id) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${item.item.project_id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.members);
      }
    };
    fetchUsers();
  }, [item]);

  useEffect(() => {
    // Determine user role for edit permissions
    if (!item || !item.item || !currentUser.id) return setUserRole(null);
    const detail = item.item;
    if (detail.admin_id === currentUser.id) return setUserRole('admin');
    if (detail.assignee_id === currentUser.id) return setUserRole('assignee');
    if (detail.reporter_id === currentUser.id) return setUserRole('reporter');
    if (item.project_members && Array.isArray(item.project_members)) {
      const member = item.project_members.find(u => u.user_id === currentUser.id);
      if (member && member.role) return setUserRole(member.role);
    }
    setUserRole(null);
  }, [item, currentUser]);

  // Fetch subtasks (children)
  useEffect(() => {
    const fetchSubtasks = async () => {
      if (!item || !item.item) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/items/${item.item.id}/subtasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubtasks(data.subtasks || []);
      }
    };
    fetchSubtasks();
  }, [item]);

  // Fetch epic if this is a child
  useEffect(() => {
    const fetchEpic = async () => {
      if (!item || !item.item || !item.item.parent_id) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/items/${item.item.parent_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEpic(data.item);
      }
    };
    fetchEpic();
  }, [item]);

  useEffect(() => {
    // Set form values when item data is loaded
    if (item && item.item) {
      const detail = item.item;
      form.setFieldsValue({
        title: detail.title,
        description: detail.description,
        status: detail.status,
        type: detail.type,
        priority: detail.priority,
        assignee_id: detail.assignee_id,
        due_date: detail.due_date ? dayjs(detail.due_date) : null,
      });
    }
  }, [item, form]);

  const canEdit = allowedRoles.includes(userRole);

  const handleSave = async (values) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const payload = { ...values };
    if (payload.due_date && payload.due_date.format) {
      payload.due_date = payload.due_date.format('YYYY-MM-DD');
    }
    try {
      const res = await fetch(`http://localhost:5000/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update item');
      message.success('Item updated!');
      // Refresh item
      const updated = await res.json();
      setItem(updated);
    } catch (err) {
      message.error(err.message);
    }
    setSaving(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '2rem auto' }} />;
  if (error) return <Alert type="error" message={error} />;
  if (!item || !item.item) return <Alert type="warning" message="Item not found" />;

  const detail = item.item;
  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24 }}>
      <Row gutter={24}>
        <Col xs={24} md={16}>
          {/* Epic Card if this is a child */}
          {epic && (
            <Card title="Epic" style={{ marginBottom: 24 }} bordered={false}>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{epic.title}</div>
              <div style={{ color: '#888', marginBottom: 8 }}>{epic.description}</div>
              <Tag color="purple">Epic</Tag>
            </Card>
          )}
          <Card
            title={<span style={{ fontSize: 24, fontWeight: 700 }}>Task Details</span>}
            style={{ marginBottom: 24 }}
            bordered={false}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                title: detail.title,
                description: detail.description,
                status: detail.status,
                type: detail.type,
                priority: detail.priority,
                assignee_id: detail.assignee_id,
                due_date: detail.due_date ? dayjs(detail.due_date) : null,
              }}
              onFinish={handleSave}
              onValuesChange={() => form.submit()} // auto-save on change
              disabled={!canEdit}
            >
              <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}> <Input /> </Form.Item>
              <Form.Item name="description" label="Description"> <Input.TextArea rows={3} /> </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="status" label="Status" rules={[{ required: true }]}> <Select>
                    <Option value="todo">To Do</Option>
                    <Option value="inprogress">In Progress</Option>
                    <Option value="inreview">In Review</Option>
                    <Option value="done">Done</Option>
                  </Select> </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="type" label="Type" rules={[{ required: true }]}> <Select>
                    <Option value="task">Task</Option>
                    <Option value="bug">Bug</Option>
                    <Option value="feature">Feature</Option>
                    <Option value="epic">Epic</Option>
                  </Select> </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="priority" label="Priority"> <Select allowClear>
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                    <Option value="Critical">Critical</Option>
                  </Select> </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="assignee_id" label="Assignee"> <Select allowClear>
                    {users.map(u => (
                      <Option key={u.user_id} value={u.user_id}>{u.username || u.email}</Option>
                    ))}
                  </Select> </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="due_date" label="Due Date"> <DatePicker /> </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
          {/* Child Tasks Card */}
          {subtasks && subtasks.length > 0 && (
            <Card title="Child Tasks" style={{ marginBottom: 24 }} bordered={false}>
              <List
                dataSource={subtasks}
                renderItem={child => (
                  <List.Item>
                    <div style={{ fontWeight: 500 }}>{child.title}</div>
                    <Tag color={child.status === 'done' ? 'green' : child.status === 'inprogress' ? 'orange' : child.status === 'inreview' ? 'purple' : 'blue'}>{child.status}</Tag>
                    <Tag color={child.priority === 'High' ? 'red' : child.priority === 'Medium' ? 'orange' : child.priority === 'Critical' ? 'volcano' : 'blue'}>{child.priority || 'None'}</Tag>
                    <span style={{ marginLeft: 12, color: '#888' }}>{child.due_date ? dayjs(child.due_date).format('YYYY-MM-DD') : 'No due date'}</span>
                  </List.Item>
                )}
                locale={{ emptyText: <span style={{ color: '#bbb' }}>No child tasks</span> }}
              />
            </Card>
          )}
          {/* Comments Card */}
          {detail.comments && (
            <Card title="Comments" style={{ marginBottom: 24 }} bordered={false}>
              <List
                dataSource={detail.comments}
                renderItem={comment => (
                  <List.Item>
                    <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    <div>
                      <Text strong>{comment.author_name}:</Text> {comment.content} <Text type="secondary">({comment.created_at})</Text>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: <span style={{ color: '#bbb' }}>No comments</span> }}
              />
            </Card>
          )}
          {/* Attachments Card */}
          {detail.attachments && (
            <Card title="Attachments" style={{ marginBottom: 24 }} bordered={false}>
              <List
                dataSource={detail.attachments}
                renderItem={att => (
                  <List.Item>
                    <a href={att.url} target="_blank" rel="noopener noreferrer">{att.filename}</a>
                  </List.Item>
                )}
                locale={{ emptyText: <span style={{ color: '#bbb' }}>No attachments</span> }}
              />
            </Card>
          )}
        </Col>
        <Col xs={24} md={8}>
          <Card title="Task Info" bordered={false}>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Assignee: </Text>
              {detail.assignee_name ? (
                <span><Avatar icon={<UserOutlined />} style={{ marginRight: 6 }} />{detail.assignee_name}</span>
              ) : <Tag>Unassigned</Tag>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Reporter: </Text>
              {detail.reporter_name || <Tag>Unknown</Tag>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Created At: </Text>
              {detail.created_at ? dayjs(detail.created_at).format('YYYY-MM-DD HH:mm') : '-'}
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Updated At: </Text>
              {detail.updated_at ? dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
            </div>
            <Divider />
            <div>
              <Text strong>Task ID: </Text> {detail.id}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ItemDetail; 