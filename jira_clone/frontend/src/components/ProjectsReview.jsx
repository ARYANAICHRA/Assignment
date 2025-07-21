import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Spin, Card, Typography, List, Tag } from 'antd';

const { Title, Text, Paragraph } = Typography;

function ProjectsReview() {
  // --- FIX: Use the central context for all project data ---
  const { 
    selectedProject, 
    setSelectedProject, 
    projectMembers, 
    myProjectRole,
    membersLoading
  } = useContext(ProjectContext);
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (e) {
        // Handle fetch error
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '32px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>All Projects</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {projects.map(project => {
          const isSelected = selectedProject && selectedProject.id === project.id;
          return (
            <Card 
              key={project.id} 
              hoverable
              title={project.name}
              onClick={() => setSelectedProject(project)}
              style={{ borderColor: isSelected ? '#1677ff' : undefined, borderWidth: isSelected ? '2px' : '1px' }}
            >
              <Paragraph type="secondary">{project.description || 'No description'}</Paragraph>
              
              {/* --- FIX: Display details only for the selected project using context data --- */}
              {isSelected && (
                <div style={{ marginTop: '16px' }}>
                  {membersLoading ? <Spin size="small" /> : (
                    <>
                      <Text strong>Your Role: </Text>
                      <Tag color="blue">{myProjectRole || 'Not a member'}</Tag>
                      <Title level={5} style={{ marginTop: '12px' }}>Members ({projectMembers.length})</Title>
                      <List
                        size="small"
                        dataSource={projectMembers}
                        renderItem={member => (
                          <List.Item>
                            <Text>{member.username}</Text> <Tag>{member.role}</Tag>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectsReview;