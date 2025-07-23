import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Dropdown, Button, Badge, Typography } from 'antd';
import { UserOutlined, DownOutlined, BellOutlined } from '@ant-design/icons';
import NotificationModal from './NotificationModal';
import ProjectSearchModal from './ProjectSearchModal';
import { ProjectContext } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext'; // Use new AuthContext

const { Title } = Typography;

function Header() {
  const { currentUser, logout, isAdmin } = useAuth(); // Use AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject } = useContext(ProjectContext);
  const [notifVisible, setNotifVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const fetchUnread = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          setUnreadCount(0);
          return;
        }
        try {
          const res = await fetch('http://localhost:5000/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            logout();
            navigate('/login');
            return;
          }
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(Array.isArray(data) ? data.filter(n => !n.is_read).length : 0);
          }
        } catch {
          setUnreadCount(0);
        }
      };
      fetchUnread();
    }
  }, [currentUser, notifVisible]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- FIX: Define dropdown menu items as an array of objects ---
  const menuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">Profile</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span style={{ color: '#ef4444' }}>Logout</span>,
      danger: true,
    },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 32px', background: '#fff', boxShadow: '0 1px 4px #f0f1f2', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title level={3} style={{ margin: 0, color: '#1677ff', fontWeight: 700, letterSpacing: 1 }}>Jira Clone</Title>
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {currentUser && (
          <Button type="default" onClick={() => setSearchModalVisible(true)}>
            Search Projects
          </Button>
        )}
        {currentUser && (
            <Badge count={unreadCount}>
                <Button shape="circle" icon={<BellOutlined />} onClick={() => setNotifVisible(true)} />
            </Badge>
        )}
        {currentUser && (
          <Dropdown menu={{ items: menuItems, onClick: (info) => { if (info.key === 'logout') handleLogout(); } }} placement="bottomRight" trigger={["click"]}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                {currentUser.username ? currentUser.username[0].toUpperCase() : '?'}
              </Avatar>
              <span style={{ fontWeight: 500, color: '#333' }}>{currentUser.username || 'User'}</span>
              <DownOutlined style={{ fontSize: 12, color: '#888' }} />
            </Button>
          </Dropdown>
        )}
        <NotificationModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
        <ProjectSearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} />
      </div>
    </div>
  );
}

export default Header;