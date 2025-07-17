import React, { useEffect, useState } from 'react';
import { Card, Avatar, Tabs, List, Tag, Spin, Row, Col, Descriptions, Button, message } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';

const { TabPane } = Tabs;

function Profile() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      // User info
      const userRes = await fetch('http://localhost:5000/me', { headers: { 'Authorization': `Bearer ${token}` } });
      const userData = await userRes.json();
      setUser(userData);
      // Tasks
      const tasksRes = await fetch('http://localhost:5000/items/my-tasks', { headers: { 'Authorization': `Bearer ${token}` } });
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
      // Projects
      const projectsRes = await fetch('http://localhost:5000/projects', { headers: { 'Authorization': `Bearer ${token}` } });
      const projectsData = await projectsRes.json();
      setProjects(projectsData.projects || []);
      // Teams
      const teamsRes = await fetch('http://localhost:5000/teams/my-teams', { headers: { 'Authorization': `Bearer ${token}` } });
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);
    } catch (err) {
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: 24 }}>
      <Card style={{ marginBottom: 32 }}>
        <Row gutter={32} align="middle">
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <Avatar size={96} icon={<UserOutlined />} style={{ background: '#1677ff', marginBottom: 16 }} />
            <div style={{ fontSize: 22, fontWeight: 600 }}>{user.username}</div>
            <div style={{ color: '#888', fontSize: 16 }}>{user.email}</div>
            <Tag color="blue" style={{ marginTop: 8 }}>{user.role}</Tag>
            <div style={{ color: '#aaa', marginTop: 8 }}>Joined {user.created_at ? dayjs(user.created_at).format('MMM D, YYYY') : ''}</div>
            <Button style={{ marginTop: 16 }} type="primary">Edit Profile</Button>
          </Col>
          <Col xs={24} md={18}>
            <Descriptions title="Profile Overview" column={2}>
              <Descriptions.Item label={<span><ProjectOutlined /> Projects</span>}>{projects.length}</Descriptions.Item>
              <Descriptions.Item label={<span><TeamOutlined /> Teams</span>}>{teams.length}</Descriptions.Item>
              <Descriptions.Item label={<span><CheckCircleOutlined /> Tasks</span>}>{tasks.length}</Descriptions.Item>
              <Descriptions.Item label={<span><ClockCircleOutlined /> Last Active</span>}>{user.updated_at ? dayjs(user.updated_at).format('MMM D, YYYY') : '-'}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>
      <Card>
        <Tabs defaultActiveKey="tasks">
          <TabPane tab={<span><CheckCircleOutlined /> Tasks</span>} key="tasks">
            <List
              itemLayout="horizontal"
              dataSource={tasks}
              renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getTypeIcon(task.type)}
                    title={<span style={{ fontWeight: 500 }}>{task.title}</span>}
                    description={
                      <>
                        <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                        <Tag color={getPriorityColor(task.priority)}>{task.priority || 'No priority'}</Tag>
                        <span style={{ marginLeft: 8, color: '#888' }}>Due: {task.due_date ? dayjs(task.due_date).format('MMM D, YYYY') : 'N/A'}</span>
                      </>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <span style={{ color: '#bbb' }}>No tasks found</span> }}
            />
          </TabPane>
          <TabPane tab={<span><ProjectOutlined /> Projects</span>} key="projects">
            <List
              itemLayout="horizontal"
              dataSource={projects}
              renderItem={project => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ProjectOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                    title={<span style={{ fontWeight: 500 }}>{project.name}</span>}
                    description={<span style={{ color: '#888' }}>{project.description}</span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: <span style={{ color: '#bbb' }}>No projects found</span> }}
            />
          </TabPane>
          <TabPane tab={<span><TeamOutlined /> Teams</span>} key="teams">
            <List
              itemLayout="horizontal"
              dataSource={teams}
              renderItem={team => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                    title={<span style={{ fontWeight: 500 }}>{team.name}</span>}
                    description={<span style={{ color: '#888' }}>{team.description}</span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: <span style={{ color: '#bbb' }}>No teams found</span> }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default Profile;
