import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Typography, Spin, Row, Col, Statistic, Progress } from 'antd';
import ProjectMembers from '../components/ProjectMembers';
import ProjectTasks from '../components/ProjectTasks';
import ProjectBoard from './ProjectBoard';
import { ProjectContext } from '../context/ProjectContext';
import { Pie } from '@ant-design/plots';
import { CheckCircleTwoTone, ClockCircleTwoTone, ExclamationCircleTwoTone, TeamOutlined, PieChartTwoTone, UserOutlined } from '@ant-design/icons';
import Reports from './Reports';

const { Title, Paragraph } = Typography;

function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const { setSelectedProject, hasPermission, myProjectRole } = useContext(ProjectContext);

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
        setSelectedProject(data.project);
      }
      setLoading(false);
    };
    fetchProject();
  }, [id, setSelectedProject]);

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/items/projects/${id}/items`, {
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

  // Stats calculations
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const totalTasks = tasks.length;
  const completed = statusCounts['done'] || 0;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const pieData = [
    { type: 'To Do', value: statusCounts['todo'] || 0 },
    { type: 'In Progress', value: statusCounts['inprogress'] || 0 },
    { type: 'In Review', value: statusCounts['inreview'] || 0 },
    { type: 'Done', value: completed },
  ].filter(d => d.value > 0);

  const pieConfig = {
    appendPadding: 10,
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: { position: 'bottom' },
    label: {
        type: 'inner',
        offset: '-50%',
        content: '{value}',
        style: { textAlign: 'center', fontSize: 14 },
    }
  };


  // --- Dynamically build the 'items' array for the Tabs component ---
  const tabItems = [
    {
      key: 'tasks',
      label: 'Tasks',
      children: <ProjectTasks />,
    },
    {
      key: 'board',
      label: 'Board',
      children: <ProjectBoard />,
    },
    {
      key: 'members',
      label: 'Members',
      children: <ProjectMembers />,
    },
    {
      key: 'progress',
      label: 'Progress',
      // --- FIX: The JSX for the progress tab content has been restored here ---
      children: (
        <div style={{ padding: 24 }}>
          <Title level={4} style={{ marginBottom: 24 }}>Project Overview</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card bordered={false} style={{ height: '100%' }}>
                <Title level={5}>Task Status</Title>
                {tasksLoading ? <Spin /> : pieData.length > 0 ? <Pie {...pieConfig} /> : "No task data."}
              </Card>
            </Col>
            <Col xs={24} md={12}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Card bordered={false}>
                            <Statistic title="Total Tasks" value={totalTasks} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card bordered={false}>
                             <Statistic title="Completed Tasks" value={completed} />
                        </Card>
                    </Col>
                    <Col span={24}>
                        <Card bordered={false}>
                            <Title level={5}>Completion Rate</Title>
                            <Progress percent={completionRate} />
                        </Card>
                    </Col>
                </Row>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  if (myProjectRole === 'admin' || myProjectRole === 'manager') {
    tabItems.push({
      key: 'reports',
      label: 'Reports',
      children: <Reports projectId={id} />,
    });
  }


  return (
    <Card style={{ minHeight: 600, margin: '0 auto', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>{project.name}</Title>
        <Paragraph type="secondary" style={{ marginTop: 4, color: '#888', fontSize: 16 }}>
          {project.description || 'No description provided.'}
        </Paragraph>
      </div>
      
      <Tabs 
        defaultActiveKey="tasks" 
        type="card"
        items={tabItems}
      />

    </Card>
  );
}

export default ProjectPage;