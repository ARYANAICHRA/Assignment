import React, { useEffect, useState, useContext } from 'react';
import { Card, Tabs, List, Tag, Spin, Descriptions, message, Button } from 'antd';
import { ProjectOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';
import { ProjectContext } from '../context/ProjectContext.jsx';

function Profile() {
  // --- FIX: Use the central context to get the current user ---
  const { currentUser } = useContext(ProjectContext);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invActionLoading, setInvActionLoading] = useState({});

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        // Fetch all data concurrently for better performance
        const [tasksRes, projectsRes, teamsRes] = await Promise.all([
          fetch('http://localhost:5000/items/my-tasks', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/teams/my-teams', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();
        const teamsData = await teamsRes.json();

        setTasks(tasksData.tasks || []);
        setProjects(projectsData.projects || []);
        setTeams(teamsData.teams || []);

      } catch (err) {
        message.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchInvitations();
  }, [currentUser]);

  const fetchInvitations = async () => {
    setInvLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/my-invitations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      setInvitations([]);
    }
    setInvLoading(false);
  };

  const handleInvitationAction = async (inviteId, projectId, action) => {
    setInvActionLoading(l => ({ ...l, [inviteId]: true }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/invitation/${inviteId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setInvitations(inv => inv.filter(i => i.id !== inviteId));
        message.success(`Invitation ${action}ed successfully.`);
      } else {
        message.error('Failed to update invitation');
      }
    } catch {
      message.error('Network error');
    }
    setInvActionLoading(l => ({ ...l, [inviteId]: false }));
  };

  // --- FIX: Use the 'items' prop for Ant Design Tabs ---
  const tabItems = [
    {
      key: 'tasks',
      label: <span><CheckCircleOutlined /> My Tasks</span>,
      children: (
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
                  </>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'projects',
      label: <span><ProjectOutlined /> My Projects</span>,
      children: (
        <List
            dataSource={projects}
            renderItem={project => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<ProjectOutlined />}
                        title={project.name}
                    />
                </List.Item>
            )}
        />
      ),
    },
    {
        key: 'teams',
        label: <span><TeamOutlined /> My Teams</span>,
        children: (
          <List
              dataSource={teams}
              renderItem={team => (
                  <List.Item>
                      <List.Item.Meta
                          avatar={<TeamOutlined />}
                          title={team.name}
                      />
                  </List.Item>
              )}
          />
        ),
      },
  ];

  if (loading || !currentUser) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="Profile Info" bordered column={1}>
          <Descriptions.Item label="Username">{currentUser.username}</Descriptions.Item>
          <Descriptions.Item label="Email">{currentUser.email}</Descriptions.Item>
          {/* --- FIX: Removed the outdated global 'Role' display --- */}
        </Descriptions>
      </Card>
      {/* --- Pending Invitations --- */}
      {invitations.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Pending Project Invitations</h3>
          {invLoading ? <Spin /> : (
            <List
              bordered
              dataSource={invitations}
              renderItem={inv => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      type="primary"
                      loading={invActionLoading[inv.id]}
                      onClick={() => handleInvitationAction(inv.id, inv.project_id, 'accept')}
                    >Accept</Button>,
                    <Button
                      size="small"
                      danger
                      loading={invActionLoading[inv.id]}
                      onClick={() => handleInvitationAction(inv.id, inv.project_id, 'reject')}
                    >Reject</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<span>Project ID: {inv.project_id}</span>}
                    description={`Invited at ${new Date(inv.created_at).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}
      <Card>
        <Tabs defaultActiveKey="tasks" items={tabItems} />
      </Card>
    </div>
  );
}

export default Profile;