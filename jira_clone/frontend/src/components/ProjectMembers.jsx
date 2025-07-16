import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { List, Form, Input, Select, Button, Alert, Typography, Tag, Space, Avatar, Popconfirm, message } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function ProjectMembers() {
  const { selectedProject } = useContext(ProjectContext);
  const [members, setMembers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (selectedProject) {
      fetchMembers();
      fetchAdmin();
    }
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchAdmin = async () => {
    if (!selectedProject?.admin_id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/users/${selectedProject.admin_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.user);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
    }
  };

  const fetchMembers = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMembers(data.members);
      else setError(data.error || 'Failed to fetch members');
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleAdd = async (values) => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: values.email, role: values.role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member added');
        form.resetFields();
        fetchMembers();
      } else setError(data.error || 'Failed to add member');
    } catch { setError('Network error'); }
  };

  const handleRemove = async (uid) => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member removed');
        fetchMembers();
      } else setError(data.error || 'Failed to remove member');
    } catch { setError('Network error'); }
  };

  // Helper for role color
  const getRoleTag = (role, isAdmin) => {
    if (isAdmin) return <Tag color="gold">Admin</Tag>;
    if (role === 'admin') return <Tag color="volcano">Admin</Tag>;
    return <Tag color="blue">Member</Tag>;
  };

  // Check if current user is a member or admin
  const isMember = user && (
    (admin && user.id === admin.id) ||
    members.some(m => m.user_id === user.id)
  );

  if (!isMember) {
    return <div style={{ textAlign: 'center', color: '#888', margin: 32 }}>You are not a member of this project.</div>;
  }

  return selectedProject ? (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Project Members</Title>
      <Form form={form} layout="inline" onFinish={handleAdd} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item name="email" rules={[{ required: true, message: 'Enter user email' }]}> 
          <Input placeholder="User Email" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="role" initialValue="member" rules={[{ required: true }]}> 
          <Select style={{ width: 120 }}>
            <Select.Option value="manager">Manager</Select.Option>
            <Select.Option value="member">Member</Select.Option>
            <Select.Option value="viewer">Viewer</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Add</Button>
        </Form.Item>
      </Form>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 12 }} />}
      <List
        loading={loading}
        bordered
        dataSource={[
          ...(admin ? [{ ...admin, isAdmin: true }] : []),
          ...members.filter(m => !admin || m.user_id !== admin.id)
        ]}
        renderItem={m => (
          <List.Item
            actions={m.isAdmin ? [getRoleTag(null, true)] : [
              <Popconfirm title="Remove member?" onConfirm={() => handleRemove(m.user_id)} okText="Remove" cancelText="Cancel">
                <Button type="link" icon={<DeleteOutlined />} danger size="small">Remove</Button>
              </Popconfirm>
            ]}
            avatar={<Avatar style={{ backgroundColor: m.isAdmin ? '#faad14' : '#1890ff' }} icon={<UserOutlined />} />}
          >
            <Space direction="vertical" size={0}>
              <Text strong>{m.username || m.email}</Text>
              <span style={{ fontSize: 12, color: '#888' }}>{getRoleTag(m.role, m.isAdmin)}</span>
            </Space>
          </List.Item>
        )}
      />
    </div>
  ) : null;
}

export default ProjectMembers;