import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Typography, Spin } from 'antd';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTasks from '../components/ProjectTasks';
import ProjectBoard from './ProjectBoard';
import { ProjectContext } from '../context/ProjectContext';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedProject } = useContext(ProjectContext);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setSelectedProject(data.project); // Set in context
      }
      setLoading(false);
    };
    fetchProject();
    // Clear selectedProject on unmount if desired
    // return () => setSelectedProject(null);
  }, [id, setSelectedProject]);

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!project) return <div style={{ padding: 32 }}>Project not found.</div>;

  return (
    <Card style={{ minHeight: 600, margin: '0 auto', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>{project.name}</Title>
        <Paragraph type="secondary" style={{ marginTop: 4, color: '#888' }}>{project.description || 'No description provided.'}</Paragraph>
      </div>
      <Tabs defaultActiveKey="tasks" type="card">
        <TabPane tab="Tasks" key="tasks">
          <ProjectTasks />
        </TabPane>
        <TabPane tab="Members" key="members">
          <ProjectMembers />
        </TabPane>
        <TabPane tab="Board" key="board">
          <ProjectBoard />
        </TabPane>
        <TabPane tab="Progress" key="progress">
          <div style={{ padding: 24 }}>
            <h2>Progress</h2>
            <p>Progress charts and analytics will go here.</p>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
}

export default ProjectPage; 