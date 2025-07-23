import React, { useEffect, useState } from 'react';
import { Table, Button, message, Typography, Modal, List, Form, Input, Select, Alert, Avatar, Popconfirm, Space, Tag, Tabs, Spin, Empty } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiFetch } from '../utils/api';

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
    try {
      const res = await apiFetch('http://localhost:5000/projects');
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
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Project deleted successfully.');
        fetchProjects();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to delete project. You may not have permission.');
      }
    } catch (error) {
      message.error('Failed to delete project. Please try again.');
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
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${projectId}/members`);
      const data = await res.json();
      setMembers(data.members || []);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleAddMember = async (values) => {
    setError(''); setSuccess('');
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${memberProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (error) {
      setError('Failed to add member. Please try again.');
    }
  };

  const handleRemoveMember = async (userId) => {
    setError(''); setSuccess('');
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${memberProject.id}/members/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member removed');
        fetchMembers(memberProject.id);
      } else {
        setError(data.error || 'Failed to remove member. You may not have permission.');
      }
    } catch (error) {
      setError('Failed to remove member. Please try again.');
    }
  };

  const getRoleTag = (role) => {
    if (role === 'Project Owner') return <Tag color="volcano">Project Owner</Tag>;
    if (role === 'Project Manager') return <Tag color="blue">Project Manager</Tag>;
    if (role === 'Project Contributor') return <Tag color="cyan">Project Contributor</Tag>;
    if (role === 'Project Visitor') return <Tag color="default">Project Visitor</Tag>;
    return <Tag color="default">Unknown</Tag>;
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
          <Form.Item name="role" initialValue="Project Contributor" rules={[{ required: true }]}> 
            <Select style={{ width: 160 }}>
              <Select.Option value="Project Owner">Project Owner</Select.Option>
              <Select.Option value="Project Manager">Project Manager</Select.Option>
              <Select.Option value="Project Contributor">Project Contributor</Select.Option>
              <Select.Option value="Project Visitor">Project Visitor</Select.Option>
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
                m.role !== 'Project Owner' && (
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