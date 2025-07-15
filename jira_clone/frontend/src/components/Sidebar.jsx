import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';
import CreateProjectForm from './CreateProjectForm';
import { Menu, Button, Modal, Select, Divider, Typography } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useContext(ProjectContext);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleProjectCreated = (project) => {
    setShowCreateModal(false);
    fetchProjects();
    setSelectedProject(project);
  };

  return (
    <div style={{ height: '100vh', background: '#001529', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: 1 }}>Jira Clone</Title>
        <Button type="primary" icon={<PlusOutlined />} shape="circle" onClick={() => setShowCreateModal(true)} />
      </div>
      <div style={{ padding: '0 16px 16px 16px' }}>
        <div style={{ color: '#bfbfbf', fontSize: 12, marginBottom: 4 }}>Project</div>
        <Select
          style={{ width: '100%' }}
          placeholder="Select Project"
          value={selectedProject ? selectedProject.id : undefined}
          onChange={handleProjectChange}
          optionLabelProp="label"
          dropdownStyle={{ zIndex: 1300 }}
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
        selectedKeys={[location.pathname]}
        style={{ borderRight: 0, background: 'transparent', flex: 1 }}
        items={[
          {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: '/projects',
            icon: <ProjectOutlined />,
            label: <Link to="/projects">Projects</Link>,
          },
          {
            key: '/board',
            icon: <AppstoreOutlined />,
            label: <Link to="/board">Board</Link>,
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
      <Modal
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        title={<span style={{ fontWeight: 600 }}>Create New Project</span>}
        footer={null}
        destroyOnClose
      >
        <CreateProjectForm onProjectCreated={handleProjectCreated} />
      </Modal>
    </div>
  );
}

export default Sidebar;
