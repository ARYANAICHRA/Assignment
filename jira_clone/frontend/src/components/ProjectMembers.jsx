import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { List, Form, Input, Select, Button, Alert, Typography, Tag, Space, Avatar, Popconfirm, message } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function ProjectMembers() {
  const { selectedProject } = useContext(ProjectContext);
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchMembers();
      fetchOwner();
    }
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchOwner = async () => {
    if (!selectedProject?.owner_id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/users/${selectedProject.owner_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwner(data.user);
      } else {
        setOwner(null);
      }
    } catch (err) {
      setOwner(null);
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
  const getRoleTag = (role, isOwner) => {
    if (isOwner) return <Tag color="gold">Owner</Tag>;
    if (role === 'admin') return <Tag color="volcano">Admin</Tag>;
    return <Tag color="blue">Member</Tag>;
  };

  return selectedProject ? (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Project Members</Title>
      <Form form={form} layout="inline" onFinish={handleAdd} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item name="email" rules={[{ required: true, message: 'Enter user email' }]}> 
          <Input placeholder="User Email" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="role" initialValue="member" rules={[{ required: true }]}> 
          <Select style={{ width: 120 }}>
            <Select.Option value="member">Member</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
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
          ...(owner ? [{ ...owner, isOwner: true }] : []),
          ...members
        ]}
        renderItem={m => (
          <List.Item
            actions={m.isOwner ? [getRoleTag(null, true)] : [
              <Popconfirm
                title="Remove this member?"
                onConfirm={() => handleRemove(m.user_id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />} style={{ padding: 0 }}>Remove</Button>
              </Popconfirm>,
              getRoleTag(m.role, false)
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: m.isOwner ? '#faad14' : '#1890ff' }} icon={<UserOutlined />} />}
              title={<Text strong>{m.username}</Text>}
              description={<Text type="secondary">{m.email}</Text>}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No members' }}
        style={{ background: '#fafafa', borderRadius: 4 }}
      />
    </div>
  ) : null;
}

export default ProjectMembers;