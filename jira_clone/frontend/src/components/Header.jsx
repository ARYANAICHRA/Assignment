import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Avatar, Dropdown, Menu, Button, Typography } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';

const { Text } = Typography;

function getBreadcrumbs(location, selectedProject) {
  const path = location.pathname.split('/').filter(Boolean);
  const crumbs = [];
  if (path[0] === 'dashboard' || path.length === 0) {
    crumbs.push({ label: 'Dashboard', to: '/dashboard' });
  }
  if (path[0] === 'projects') {
    crumbs.push({ label: 'Projects', to: '/projects' });
    if (selectedProject) {
      crumbs.push({ label: selectedProject.name, to: '#' });
    }
  }
  if (path[0] === 'profile') {
    crumbs.push({ label: 'Profile', to: '/profile' });
  }
  return crumbs;
}

function Header({ setIsAuthenticated, isAuthenticated, selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const crumbs = getBreadcrumbs(location, selectedProject);

  const menu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" danger onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Text strong style={{ fontSize: 22, color: '#1677ff', letterSpacing: 1 }}>Jira Clone</Text>
        {isAuthenticated && selectedProject && (
          <span style={{ marginLeft: 8, padding: '2px 8px', background: '#e6f4ff', color: '#1677ff', borderRadius: 4, fontWeight: 500, fontSize: 14 }}>{selectedProject.name}</span>
        )}
        {isAuthenticated && (
          <Breadcrumb style={{ marginLeft: 24 }}>
            {crumbs.map((crumb, idx) => (
              <Breadcrumb.Item key={idx}>
                {crumb.to !== '#' ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isAuthenticated && user && user.username && (
          <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                {user.username ? user.username[0].toUpperCase() : '?'}
              </Avatar>
              <span style={{ fontWeight: 500, color: '#333' }}>{user.username || 'User'}</span>
              <DownOutlined style={{ fontSize: 12, color: '#888' }} />
            </Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

export default Header;
