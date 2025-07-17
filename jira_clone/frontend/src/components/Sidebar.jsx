import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';
import { Menu, Button, Select, Divider, Typography, message } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  MoreOutlined
} from '@ant-design/icons';
import CreateProjectModal from './CreateProjectModal';
import { jwtDecode } from "jwt-decode";
import { Dropdown, Menu as AntMenu } from 'antd';

const { Option } = Select;
const { Title } = Typography;

function Sidebar({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const token = localStorage.getItem('token');
  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch (e) {
      userRole = null;
    }
  }

  return (
    <div style={{ height: '100vh', background: '#001529', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: 1 }}>Jira Clone</Title>
        {/* Removed admin three-dot menu from header area */}
      </div>
      <div style={{ padding: '0 16px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#bfbfbf', fontSize: 12 }}>Projects</span>
          {userRole === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Button type="link" size="small" style={{ color: '#1677ff', fontWeight: 700, padding: 0 }} onClick={() => setShowCreateModal(true)}>
                +
              </Button>
              <Dropdown
                overlay={
                  <AntMenu>
                    <AntMenu.Item key="project-management" onClick={() => navigate('/project-management')}>
                      Project Management
                    </AntMenu.Item>
                  </AntMenu>
                }
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined style={{ fontSize: 16, color: '#bfbfbf' }} />}
                  style={{ padding: 0, height: 20 }}
                />
              </Dropdown>
            </div>
          )}
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
          {projects.map(project => (
            <div
              key={project.id}
              style={{
                padding: '6px 0 6px 8px',
                borderRadius: 4,
                background: location.pathname === `/projects/${project.id}` ? '#1677ff' : 'transparent',
                color: location.pathname === `/projects/${project.id}` ? '#fff' : '#bfbfbf',
                fontWeight: location.pathname === `/projects/${project.id}` ? 600 : 400,
                cursor: 'pointer',
                marginBottom: 2
              }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.name}
            </div>
          ))}
        </div>
      </div>
      <Divider style={{ margin: '8px 0', borderColor: '#222' }} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname.startsWith('/projects/') ? '/projects' : location.pathname]}
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
            label: <Link to="/boards">Boards</Link>,
          },
          {
            key: '/teams',
            icon: <UserOutlined />, // You can replace with Team icon if you have one
            label: <Link to="/teams">Teams</Link>,
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
