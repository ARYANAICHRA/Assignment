import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';
import { Menu, Button, Select, Divider, Typography, message } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

function Sidebar({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setProjects(data.projects);
  };

  const handleProjectChange = (value) => {
    const project = projects.find(p => p.id === Number(value));
    setSelectedProject(project || null);
    // Do NOT navigate on project select
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleBoardsClick = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    } else {
      message.info('Please select a project first.');
    }
  };

  return (
    <div style={{ height: '100vh', background: '#001529', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: 1 }}>Jira Clone</Title>
      </div>
      <div style={{ padding: '0 16px 16px 16px' }}>
        <div style={{ color: '#bfbfbf', fontSize: 12, marginBottom: 4 }}>Project</div>
        <Select
          style={{ width: '100%' }}
          placeholder="Select Project"
          value={selectedProject ? selectedProject.id : undefined}
          onChange={handleProjectChange}
          optionLabelProp="label"
        >
          {projects.map(project => (
            <Option key={project.id} value={project.id} label={project.name}>{project.name}</Option>
          ))}
        </Select>
      </div>
      <Divider style={{ margin: '8px 0', borderColor: '#222' }} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname.startsWith('/projects/') ? '/boards' : location.pathname]}
        style={{ borderRight: 0, background: 'transparent', flex: 1 }}
        items={[
          {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: '/boards',
            icon: <AppstoreOutlined />,
            label: (
              <span
                style={{ color: selectedProject ? undefined : '#888', cursor: selectedProject ? 'pointer' : 'not-allowed' }}
                onClick={e => { e.preventDefault(); handleBoardsClick(); }}
              >
                Boards
              </span>
            ),
          },
          {
            key: '/profile',
            icon: <UserOutlined />,
            label: <Link to="/profile">Profile</Link>,
          },
        ]}
      />
      <Divider style={{ margin: '8px 0', borderColor: '#222' }} />
      <div style={{ padding: '0 16px 24px 16px', marginTop: 'auto' }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          danger
          block
          onClick={handleLogout}
          style={{ textAlign: 'left' }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
