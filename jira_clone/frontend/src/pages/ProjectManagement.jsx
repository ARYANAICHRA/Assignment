import React, { useEffect, useState } from 'react';
import { Table, Button, message, Typography, Modal, List, Form, Input, Select, Alert, Avatar, Popconfirm, Space, Tag } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { UserOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberProject, setMemberProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let userId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.user_id || decoded.sub;
      } catch (e) {}
    }
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setProjects(data.projects.filter(p => p.admin_id === userId));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      message.success('Project deleted');
      fetchProjects();
    } else {
      message.error('Failed to delete project');
    }
  };

  // --- Member Management ---
  const openMemberModal = (project) => {
    setMemberProject(project);
    setMemberModalOpen(true);
    fetchMembers(project.id);
    fetchAdmin(project.admin_id);
  };
  const closeMemberModal = () => {
    setMemberModalOpen(false);
    setMemberProject(null);
    setMembers([]);
    setAdmin(null);
    setError('');
    setSuccess('');
  };
  const fetchMembers = async (projectId) => {
    setMemberLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setMembers(data.members);
    else setError(data.error || 'Failed to fetch members');
    setMemberLoading(false);
  };
  const fetchAdmin = async (adminId) => {
    if (!adminId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/users/${adminId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAdmin(data.user);
    } else {
      setAdmin(null);
    }
  };
  const handleAddMember = async (values) => {
    setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${memberProject.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: values.email, role: values.role })
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Member added');
      form.resetFields();
      fetchMembers(memberProject.id);
    } else setError(data.error || 'Failed to add member');
  };
  const handleRemoveMember = async (uid) => {
    setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${memberProject.id}/members/${uid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Member removed');
      fetchMembers(memberProject.id);
    } else setError(data.error || 'Failed to remove member');
  };
  const getRoleTag = (role, isAdmin) => {
    if (isAdmin) return <Tag color="gold">Admin</Tag>;
    if (role === 'admin') return <Tag color="volcano">Admin</Tag>;
    if (role === 'manager') return <Tag color="blue">Manager</Tag>;
    if (role === 'viewer') return <Tag color="default">Viewer</Tag>;
    return <Tag color="blue">Member</Tag>;
  };

  const columns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => openMemberModal(record)}>
            Manage Members
          </Button>
          <Popconfirm title="Are you sure to delete this project?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 32 }}>
      <Title level={3}>Project Management</Title>
      <Table
        dataSource={projects}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Modal
        open={memberModalOpen}
        onCancel={closeMemberModal}
        title={memberProject ? `Manage Members: ${memberProject.name}` : 'Manage Members'}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="inline" onFinish={handleAddMember} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
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
          loading={memberLoading}
          bordered
          dataSource={[
            ...(admin ? [{ ...admin, isAdmin: true }] : []),
            ...members.filter(m => !admin || m.user_id !== admin.id)
          ]}
          renderItem={m => (
            <List.Item
              actions={m.isAdmin ? [getRoleTag(null, true)] : [
                <Popconfirm title="Remove member?" onConfirm={() => handleRemoveMember(m.user_id)} okText="Remove" cancelText="Cancel">
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
      </Modal>
    </div>
  );
};

export default ProjectManagement; 