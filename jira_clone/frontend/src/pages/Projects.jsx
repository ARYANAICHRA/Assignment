import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Table, Card, Button, Spin, Alert, Typography } from 'antd';

const { Title } = Typography;

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects);
        } else {
          setError(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleSelect = (project) => {
    setSelectedProject(project);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span style={{ color: '#888' }}>{text}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type={selectedProject && selectedProject.id === record.id ? 'primary' : 'default'}
          onClick={() => handleSelect(record)}
        >
          {selectedProject && selectedProject.id === record.id ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>All Projects</Title>
      </Card>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
      ) : error ? (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />
      ) : (
        <Card bordered={false}>
          <Table
            dataSource={projects}
            columns={columns}
            rowKey="id"
            pagination={false}
            rowClassName={(record) => selectedProject && selectedProject.id === record.id ? 'ant-table-row-selected' : ''}
          />
        </Card>
      )}
    </div>
  );
}

export default Projects;
