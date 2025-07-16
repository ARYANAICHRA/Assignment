import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, message, Typography } from 'antd';
import { jwtDecode } from 'jwt-decode';

const { Title } = Typography;

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

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
      // Only show projects where the current user is admin
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

  const columns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Are you sure to delete this project?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
          <Button danger>Delete</Button>
        </Popconfirm>
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
    </div>
  );
};

export default ProjectManagement; 