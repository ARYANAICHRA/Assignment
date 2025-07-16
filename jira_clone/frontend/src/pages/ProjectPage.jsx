import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Typography, Spin, Row, Col, Statistic, Progress } from 'antd';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTasks from '../components/ProjectTasks';
import ProjectBoard from './ProjectBoard';
import { ProjectContext } from '../context/ProjectContext';
import { Pie } from '@ant-design/plots';
import { UserOutlined as UserIcon } from '@ant-design/icons';
import { Card as AntCard } from 'antd';
import { CheckCircleTwoTone, ClockCircleTwoTone, UserOutlined, ExclamationCircleTwoTone, TeamOutlined, PieChartTwoTone } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedProject } = useContext(ProjectContext);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

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
  }, [id, setSelectedProject]);

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/projects/${id}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
      setTasksLoading(false);
    };
    fetchTasks();
  }, [id]);

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!project) return <div style={{ padding: 32 }}>Project not found.</div>;

  // Compute stats
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const totalTasks = tasks.length;
  const completed = statusCounts['done'] || 0;
  const inProgress = statusCounts['inprogress'] || 0;
  const inReview = statusCounts['inreview'] || 0;
  const todo = statusCounts['todo'] || 0;

  // Completion rate
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // Overdue tasks
  const now = new Date();
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length;

  // Unassigned tasks
  const unassigned = tasks.filter(t => !t.assignee_id).length;

  // Most active assignee
  const assigneeCounts = {};
  tasks.forEach(t => {
    if (t.assignee_id) {
      assigneeCounts[t.assignee_id] = (assigneeCounts[t.assignee_id] || 0) + 1;
    }
  });
  let mostActiveAssignee = null;
  let mostActiveCount = 0;
  for (const [assignee, count] of Object.entries(assigneeCounts)) {
    if (count > mostActiveCount) {
      mostActiveAssignee = assignee;
      mostActiveCount = count;
    }
  }
  // Find assignee details if available
  let mostActiveAssigneeName = mostActiveAssignee;
  if (mostActiveAssignee && tasks.length > 0) {
    const found = tasks.find(t => t.assignee_id === Number(mostActiveAssignee));
    if (found && found.assignee) {
      mostActiveAssigneeName = found.assignee.username || found.assignee.email || mostActiveAssignee;
    }
  }

  const pieData = [
    { type: 'To Do', value: todo },
    { type: 'In Progress', value: inProgress },
    { type: 'In Review', value: inReview },
    { type: 'Done', value: completed },
  ].filter(d => d.value > 0);

  // Debug logs
  console.log('tasks:', tasks);
  console.log('pieData:', pieData);

  const pieConfig = {
    appendPadding: 10,
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    innerRadius: 0.6,
    animation: true,
    label: {
      position: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 16,
        textAlign: 'center',
      },
    },
    legend: { position: 'bottom' },
    color: ['#1890ff', '#faad14', '#13c2c2', '#52c41a'],
    interactions: [{ type: 'element-active' }],
    statistic: {
      title: {
        style: { fontSize: 18 },
        content: 'Status',
      },
      content: false,
    },
  };

  return (
    <Card style={{ minHeight: 600, margin: '0 auto', maxWidth: 1200 }}>
      {/* Project name and description in vertical layout */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>{project.name}</Title>
        <Paragraph type="secondary" style={{ marginTop: 4, color: '#888', fontSize: 16 }}>{project.description || 'No description provided.'}</Paragraph>
      </div>
      <Tabs defaultActiveKey="tasks" type="card">
        <TabPane tab="Tasks" key="tasks">
          <ProjectTasks />
        </TabPane>
        <TabPane tab="Board" key="board">
          <ProjectBoard />
        </TabPane>
        <TabPane tab="Members" key="members">
          <ProjectMembers />
        </TabPane>
        <TabPane tab="Progress" key="progress">
          <div style={{ padding: 24 }}>
            <Title level={4} style={{ marginBottom: 24 }}>Project Overview</Title>
            <Row gutter={[24, 24]}>
              {/* Chart Card */}
              <Col xs={24} md={12}>
                <AntCard bordered style={{ height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px #f0f1f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <PieChartTwoTone twoToneColor="#1890ff" style={{ fontSize: 24, marginRight: 8 }} />
                    <span style={{ fontWeight: 600, fontSize: 18 }}>Task Status</span>
                  </div>
                  {tasksLoading ? (
                    <Spin />
                  ) : pieData.length > 0 ? (
                    <Pie {...pieConfig} style={{ height: 240, minHeight: 240 }} />
                  ) : (
                    <div style={{ color: '#bbb', textAlign: 'center', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      No task data to display chart.
                    </div>
                  )}
                </AntCard>
              </Col>
              {/* Stats Cards */}
              <Col xs={24} sm={12} md={6}>
                <AntCard bordered style={{ height: '100%', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <TeamOutlined style={{ color: '#1890ff', fontSize: 20, marginRight: 8 }} />
                    <span style={{ fontWeight: 500 }}>Total Tasks</span>
                  </div>
                  <Statistic value={totalTasks} valueStyle={{ fontSize: 22 }} />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard bordered style={{ height: '100%', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 20, marginRight: 8 }} />
                    <span style={{ fontWeight: 500 }}>Completion Rate</span>
                  </div>
                  <Progress percent={completionRate} status={completionRate === 100 ? 'success' : 'active'} showInfo style={{ width: '100%' }} />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard bordered style={{ height: '100%', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 20, marginRight: 8 }} />
                    <span style={{ fontWeight: 500 }}>Overdue Tasks</span>
                  </div>
                  <Statistic value={overdue} valueStyle={{ color: overdue > 0 ? '#fa541c' : undefined, fontSize: 22 }} />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard bordered style={{ height: '100%', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <ExclamationCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 20, marginRight: 8 }} />
                    <span style={{ fontWeight: 500 }}>Unassigned Tasks</span>
                  </div>
                  <Statistic value={unassigned} valueStyle={{ color: unassigned > 0 ? '#faad14' : undefined, fontSize: 22 }} />
                </AntCard>
              </Col>
              {mostActiveAssignee && (
                <Col xs={24} sm={12} md={6}>
                  <AntCard bordered style={{ height: '100%', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <UserOutlined style={{ color: '#1890ff', fontSize: 20, marginRight: 8 }} />
                      <span style={{ fontWeight: 500 }}>Most Active Assignee</span>
                    </div>
                    <Statistic value={mostActiveAssigneeName} valueStyle={{ fontSize: 18 }} />
                  </AntCard>
                </Col>
              )}
            </Row>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
}

export default ProjectPage;
