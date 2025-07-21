import React, { useEffect, useState } from 'react';
import { Table, Button, message, Typography, Modal, List, Form, Input, Select, Alert, Avatar, Popconfirm, Space, Tag, Tabs, Spin, Empty } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberProject, setMemberProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // --- FIX: Remove reliance on JWT decoding for user info ---
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // The endpoint now returns projects the user is a member of.
        // We can filter here if we only want to show projects they ADMINISTER.
        // For now, showing all their projects is fine.
        setProjects(data.projects);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      message.success('Project deleted successfully.');
      fetchProjects();
    } else {
      const data = await res.json();
      message.error(data.error || 'Failed to delete project. You may not have permission.');
    }
  };

  // --- Member Management Functions ---
  const openMemberModal = (project) => {
    setMemberProject(project);
    setMemberModalOpen(true);
    fetchMembers(project.id);
  };
  
  const closeMemberModal = () => {
    setMemberModalOpen(false);
    form.resetFields();
  };

  const fetchMembers = async (projectId) => {
    setMemberLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setMembers(data.members || []);
    setMemberLoading(false);
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
    } else {
      setError(data.error || 'Failed to add member. You may not have permission.');
    }
  };

  const handleRemoveMember = async (userId) => {
    setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${memberProject.id}/members/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Member removed');
      fetchMembers(memberProject.id);
    } else {
      setError(data.error || 'Failed to remove member. You may not have permission.');
    }
  };

  const getRoleTag = (role) => {
    if (role === 'admin') return <Tag color="volcano">Admin</Tag>;
    if (role === 'manager') return <Tag color="blue">Manager</Tag>;
    if (role === 'visitor') return <Tag color="default">Visitor</Tag>;
    return <Tag color="cyan">Member</Tag>;
  };
  
  const projectColumns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button onClick={() => openMemberModal(record)}>Manage Members</Button>
          <Popconfirm title="Are you sure you want to delete this project?" onConfirm={() => handleDelete(record.id)}>
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // --- FIX: Use the 'items' prop for Ant Design Tabs ---
  const tabItems = [
    {
        key: 'projects',
        label: 'My Projects',
        children: (
            <Table
                dataSource={projects}
                columns={projectColumns}
                rowKey="id"
                loading={loading}
            />
        )
    },
    // You can add more tabs here in the future, like for Teams management
  ];

  return (
    <div style={{ padding: 32 }}>
      <Title level={3}>Project Management</Title>
      
      <Tabs defaultActiveKey="projects" items={tabItems} />

      <Modal
        open={memberModalOpen}
        onCancel={closeMemberModal}
        title={memberProject ? `Manage Members: ${memberProject.name}` : 'Manage Members'}
        footer={null}
        width={520}
        destroyOnHidden
      >
        <Form form={form} layout="inline" onFinish={handleAddMember} style={{ marginBottom: 16 }}>
          <Form.Item name="email" rules={[{ required: true }]}> 
            <Input placeholder="User Email" />
          </Form.Item>
          <Form.Item name="role" initialValue="member" rules={[{ required: true }]}> 
            <Select style={{ width: 120 }}>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="visitor">Visitor</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">Add</Button>
        </Form>
        
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
        {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 12 }} />}
        
        <List
          loading={memberLoading}
          bordered
          dataSource={members}
          renderItem={m => (
            <List.Item
              actions={[
                m.role !== 'admin' && (
                  <Popconfirm title="Remove member?" onConfirm={() => handleRemoveMember(m.user_id)}>
                    <Button type="link" icon={<DeleteOutlined />} danger size="small">Remove</Button>
                  </Popconfirm>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<Text strong>{m.username || m.email}</Text>}
                description={getRoleTag(m.role)}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default ProjectManagement;