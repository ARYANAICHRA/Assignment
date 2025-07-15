import React, { useEffect, useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTasks from '../components/ProjectTasks';
import { Row, Col, Card, Statistic, Progress, List, Spin, message } from 'antd';
import { CheckCircleOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';

function Dashboard() {
  const { selectedProject } = useContext(ProjectContext);
  const [stats, setStats] = useState({ projectCount: 0, taskCount: 0, teamCount: 0 });
  const [activity, setActivity] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [projectProgress, setProjectProgress] = useState({ completed: 0, in_progress: 0, todo: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        // Fetch stats
        const statsRes = await fetch('http://localhost:5000/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        // Fetch activity log
        const activityRes = await fetch('http://localhost:5000/activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivity(data.activity || []);
        }
        // Fetch my tasks
        const myTasksRes = await fetch('http://localhost:5000/my-tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myTasksRes.ok) {
          const data = await myTasksRes.json();
          setMyTasks(data.tasks || []);
        }
        // Fetch project progress
        if (selectedProject) {
          const progressRes = await fetch(`http://localhost:5000/projects/${selectedProject.id}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (progressRes.ok) {
            const data = await progressRes.json();
            setProjectProgress({
              ...data,
              total: data.total || 0
            });
          }
        } else {
          setProjectProgress({ completed: 0, in_progress: 0, todo: 0, total: 0 });
        }
      } catch (err) {
        message.error('Failed to load dashboard data');
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [selectedProject]);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#e6f4ff' }}>
            <Statistic title="Projects" value={stats.projectCount} prefix={<ProjectOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic title="Tasks" value={stats.taskCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: '#fffbe6' }}>
            <Statistic title="Teams" value={stats.teamCount} prefix={<TeamOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12}>
          <Card title="My Tasks" bordered={false}>
            <List
              dataSource={myTasks.slice(0, 6)}
              renderItem={task => (
                <List.Item>
                  <span>{task.title}</span>
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: task.status === 'done' ? '#f6ffed' : '#f0f0f0', color: task.status === 'done' ? '#52c41a' : '#888', fontWeight: 500, fontSize: 12 }}>{task.status}</span>
                </List.Item>
              )}
              locale={{ emptyText: 'No tasks assigned to you' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="Activity Feed" bordered={false}>
            <List
              dataSource={activity.slice(0, 8)}
              renderItem={log => (
                <List.Item>
                  <span style={{ fontWeight: 500 }}>{log.user}</span> {log.action} <span style={{ color: '#888' }}>{log.details}</span> <span style={{ color: '#bbb', fontSize: 12 }}>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                </List.Item>
              )}
              locale={{ emptyText: 'No recent activity' }}
            />
          </Card>
        </Col>
      </Row>
      {selectedProject && (
        <>
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={12}>
              <Card title="Project Progress" bordered={false}>
                <Progress
                  percent={projectProgress.total ? Math.round((projectProgress.completed / projectProgress.total) * 100) : 0}
                  status="active"
                  strokeColor="#1677ff"
                  showInfo
                />
                <div style={{ marginTop: 8, color: '#888' }}>{projectProgress.completed} of {projectProgress.total} tasks done</div>
                <div style={{ marginTop: 8, color: '#888' }}>In Progress: {projectProgress.in_progress} | Todo: {projectProgress.todo}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="Project Members" bordered={false}>
                <ProjectMembers />
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={24}>
              <Card title="Project Tasks" bordered={false}>
                <ProjectTasks />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default Dashboard;
