import React, { useEffect, useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import ProjectList from '../components/ProjectList';
import CreateProjectModal from '../components/CreateProjectModal';

const { Title } = Typography;

function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setProjects(data.projects);
  };

  const handleProjectCreated = () => {
    setShowModal(false);
    fetchProjects();
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (project) => {
    window.location.href = `/projects/${project.id}`;
  };

  return (
    <div style={{ padding: 32 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Projects</Title>
        {user.role === 'admin' && (
          <Button type="primary" onClick={() => setShowModal(true)}>Create Project</Button>
        )}
      </Space>
      <Input.Search
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 24 }}
        allowClear
      />
      <ProjectList projects={filteredProjects} onSelect={handleSelect} />
      <CreateProjectModal
        visible={showModal}
        onProjectCreated={handleProjectCreated}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}

export default Projects;
