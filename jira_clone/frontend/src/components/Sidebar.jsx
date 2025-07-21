import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Button, Divider, Typography, Input, List, Avatar, Space } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  SearchOutlined
} from '@ant-design/icons';
import CreateProjectModal from './CreateProjectModal';
import { ProjectContext } from '../context/ProjectContext'; // Import context

const { Text } = Typography;

function Sidebar({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [search, setSearch] = useState('');
  
  // --- FIX: Get the current user from the context ---
  const { currentUser } = useContext(ProjectContext);

  useEffect(() => {
    // Only fetch projects if a user is logged in
    if (currentUser) {
        fetchProjects();
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setProjects(data.projects);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div style={{
      background: '#ffffff',
      minHeight: '100vh',
      width: 240,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      borderRight: '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: '1px 0 4px rgba(0, 0, 0, 0.02)'
    }}>
      {/* Projects Section */}
      <div style={{ padding: '16px 16px 0', flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <Text style={{ 
            color: '#6b7280', 
            fontWeight: 600, 
            fontSize: 12, 
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Projects
          </Text>
          <Button
            type="text"
            icon={projectsOpen ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
            size="small"
            onClick={() => setProjectsOpen(!projectsOpen)}
          />
        </div>

        {projectsOpen && (
          <>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="Search projects..."
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderRadius: 6 }}
                allowClear
              />
              {/* --- FIX: Removed 'user.role === admin' check --- */}
              {/* Any authenticated user can now create a project. */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                style={{ borderRadius: 6, width: '100%', backgroundColor: '#4f46e5', fontWeight: 500 }}
                onClick={() => setShowCreateModal(true)}
              >
                New Project
              </Button>
            </Space>

            <List
              itemLayout="horizontal"
              dataSource={filteredProjects}
              locale={{ emptyText: <span style={{ color: '#9ca3af', fontSize: 13 }}>No projects found</span> }}
              style={{ marginBottom: 8 }}
              renderItem={project => (
                <List.Item
                  key={project.id}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: location.pathname === `/projects/${project.id}` ? '#eef2ff' : 'transparent',
                    cursor: 'pointer',
                    marginBottom: 4,
                  }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size="small" 
                        style={{ 
                          backgroundColor: location.pathname === `/projects/${project.id}` ? '#4f46e5' : '#e5e7eb',
                          color: location.pathname === `/projects/${project.id}` ? 'white' : '#4b5563',
                          fontWeight: 600
                        }}
                      >
                        {project.name[0]?.toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <Text 
                        style={{ 
                          fontSize: 13,
                          color: location.pathname === `/projects/${project.id}` ? '#4f46e5' : '#111827',
                          fontWeight: location.pathname === `/projects/${project.id}` ? 600 : 500
                        }}
                        ellipsis
                      >
                        {project.name}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />

            {/* --- FIX: Removed 'user.role === admin' check --- */}
            {/* The management page enforces its own permissions. */}
            <Button
              type="text"
              size="small"
              style={{ color: '#4f46e5', fontWeight: 500, fontSize: 12, padding: '4px 8px', width: '100%', textAlign: 'left' }}
              icon={<FolderOpenOutlined style={{ fontSize: 12 }} />}
              onClick={() => navigate('/project-management')}
            >
              Manage projects
            </Button>
          </>
        )}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname.startsWith('/projects/') ? '/projects' : location.pathname]}
        style={{ 
          borderRight: 0,
          background: 'transparent',
          padding: '0 8px'
        }}
        items={[
          {
            key: '/dashboard',
            icon: <DashboardOutlined style={{ fontSize: 14 }} />,
            label: <Link to="/dashboard" style={{ fontSize: 13 }}>Dashboard</Link>,
            style: { borderRadius: 6, height: 36, marginBottom: 4 }
          },
          {
            key: '/teams',
            icon: <TeamOutlined style={{ fontSize: 14 }} />,
            label: <Link to="/teams" style={{ fontSize: 13 }}>Teams</Link>,
            style: { borderRadius: 6, height: 36, marginBottom: 4 }
          },
          {
            key: '/profile',
            icon: <UserOutlined style={{ fontSize: 14 }} />,
            label: <Link to="/profile" style={{ fontSize: 13 }}>Profile</Link>,
            style: { borderRadius: 6, height: 36, marginBottom: 4 }
          },
        ]}
      />

      <div style={{ 
        padding: '16px',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        marginTop: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 16
        }}>
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: '#4f46e5',
              color: 'white',
              marginRight: 8
            }}
            icon={<UserOutlined />}
          >
            {currentUser?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Text style={{ fontSize: 13, fontWeight: 500 }} ellipsis>
            {currentUser?.username || 'User'}
          </Text>
        </div>
        <Button
          type="text"
          size="small"
          icon={<LogoutOutlined style={{ fontSize: 14 }} />}
          danger
          block
          onClick={handleLogout}
          style={{ 
            textAlign: 'left',
            fontSize: 13,
            height: 32,
            color: '#ef4444'
          }}
        >
          Log out
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