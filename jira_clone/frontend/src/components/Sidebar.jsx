import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Button, Divider, Typography, Input, List, Avatar } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import CreateProjectModal from './CreateProjectModal';
import { jwtDecode } from "jwt-decode";

const { Text } = Typography;

function Sidebar({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [search, setSearch] = useState('');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#f7f9fb', color: '#222', minHeight: '100%', borderRight: '1px solid #e6e8ec', boxShadow: '2px 0 8px #f0f1f2', width: 240, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Projects Section Header */}
      <div style={{ padding: '18px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#888', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>PROJECTS</Text>
        <Button
          type="text"
          icon={projectsOpen ? <UpOutlined /> : <DownOutlined />}
          size="small"
          onClick={() => setProjectsOpen(!projectsOpen)}
          style={{ color: '#888', fontSize: 16 }}
        />
      </div>
      {/* Create Project Button */}
      <div style={{ padding: '0 16px 8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          style={{ borderRadius: 6, fontWeight: 600, width: '100%' }}
          onClick={() => setShowCreateModal(true)}
        >
          Create project
        </Button>
      </div>
      {/* Project List */}
      {projectsOpen && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 0 8px' }}>
          <List
            itemLayout="horizontal"
            dataSource={projects}
            locale={{ emptyText: <span style={{ color: '#bbb' }}>No projects found</span> }}
            renderItem={project => (
              <List.Item
                key={project.id}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: location.pathname === `/projects/${project.id}` ? '#e0e7ff' : '#fff',
                  color: location.pathname === `/projects/${project.id}` ? '#1677ff' : '#222',
                  fontWeight: location.pathname === `/projects/${project.id}` ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: 2,
                  border: location.pathname === `/projects/${project.id}` ? '1.5px solid #a5b4fc' : '1px solid #e6e8ec',
                  boxShadow: location.pathname === `/projects/${project.id}` ? '0 2px 8px #e0e7ff' : '0 1px 2px #f0f1f2',
                  transition: 'all 0.18s',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f5ff'}
                onMouseLeave={e => e.currentTarget.style.background = location.pathname === `/projects/${project.id}` ? '#e0e7ff' : '#fff'}
                tabIndex={0}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#1677ff', fontWeight: 700 }}>{project.name[0]?.toUpperCase() || <FolderOpenOutlined />}</Avatar>}
                  title={<span style={{ fontWeight: 600 }}>{project.name}</span>}
                />
              </List.Item>
            )}
          />
          {/* Manage projects link */}
          <div style={{ padding: '8px 8px 0 8px', textAlign: 'center' }}>
            <Button
              type="link"
              style={{ color: '#1677ff', fontWeight: 600, fontSize: 13, padding: 0 }}
              icon={<FolderOpenOutlined />}
              onClick={() => navigate('/project-management')}
            >
              Manage projects
            </Button>
          </div>
        </div>
      )}
      <Divider style={{ margin: '8px 0', borderColor: '#e6e8ec' }} />
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname.startsWith('/projects/') ? '/projects' : location.pathname]}
        style={{ borderRight: 0, background: 'transparent', flex: 1 }}
        items={[
          {
            key: '/dashboard',
            icon: <DashboardOutlined style={{ color: '#1677ff' }} />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: '/teams',
            icon: <TeamOutlined style={{ color: '#1677ff' }} />, 
            label: <Link to="/teams">Teams</Link>,
          },
          {
            key: '/profile',
            icon: <UserOutlined style={{ color: '#1677ff' }} />, 
            label: <Link to="/profile">Profile</Link>,
          },
          {
            key: '/reports',
            icon: <FolderOpenOutlined style={{ color: '#1677ff' }} />, 
            label: <Link to="/reports/project/1">Reports</Link>, // Example: project 1, can be dynamic later
          },
        ]}
      />
      <Divider style={{ margin: '8px 0', borderColor: '#e6e8ec' }} />
      <div style={{ padding: '0 12px 20px 12px', marginTop: 'auto' }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          danger
          block
          onClick={handleLogout}
          style={{ textAlign: 'left', color: '#ff7875', fontWeight: 600 }}
        >
          Logout
        </Button>
      </div>
      <CreateProjectModal
        visible={showCreateModal}
        onProjectCreated={() => {
          setShowCreateModal(false);
          fetchProjects();
        }}
        onCancel={() => setShowCreateModal(false)}
      />
    </div>
  );
}

export default Sidebar;
