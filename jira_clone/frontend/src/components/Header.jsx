import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Avatar, Dropdown, Menu, Button, Typography } from 'antd';
import { UserOutlined, DownOutlined, BellOutlined } from '@ant-design/icons';
import NotificationModal from './NotificationModal';

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
  if (path[0] === 'teams') {
    crumbs.push({ label: 'Teams', to: '/teams' });
  }
  return crumbs;
}

function Header({ setIsAuthenticated, isAuthenticated, selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifVisible, setNotifVisible] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (isAuthenticated) {
      const fetchUnread = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch('http://localhost:5000/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          setUnreadCount(Array.isArray(data) ? data.filter(n => !n.is_read).length : 0);
        } catch {
          setUnreadCount(0);
        }
      };
      fetchUnread();
    }
  }, [isAuthenticated, notifVisible]);

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 32px', background: '#fff', boxShadow: '0 1px 4px #f0f1f2', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <Breadcrumb style={{ fontSize: 15, color: '#888', fontWeight: 500, letterSpacing: 0.5 }}>
          {crumbs.map((crumb, idx) => (
            <Breadcrumb.Item key={idx} style={{ color: '#888' }}>
              {crumb.to !== '#' ? <Link to={crumb.to} style={{ color: '#1677ff' }}>{crumb.label}</Link> : <span style={{ color: '#222', fontWeight: 600 }}>{crumb.label}</span>}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isAuthenticated && (
          <Button type="text" onClick={() => setNotifVisible(true)} style={{ fontSize: 20, position: 'relative' }}>
            <BellOutlined />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: '#ff4d4f', color: '#fff', borderRadius: '50%', fontSize: 10, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
            )}
          </Button>
        )}
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
        <NotificationModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      </div>
    </div>
  );
}

export default Header;
