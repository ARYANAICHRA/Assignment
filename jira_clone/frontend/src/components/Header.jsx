import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Avatar, Dropdown, Button, Badge } from 'antd';
import { UserOutlined, DownOutlined, BellOutlined } from '@ant-design/icons';
import NotificationModal from './NotificationModal';
import ProjectSearchModal from './ProjectSearchModal';
import { ProjectContext } from '../context/ProjectContext';

function getBreadcrumbItems(location, selectedProject) {
    const path = location.pathname.split('/').filter(Boolean);
    const items = [{ title: <Link to="/dashboard">Dashboard</Link> }];

    if (path[0] === 'projects' && path.length === 1) {
        items.push({ title: 'Projects' });
    }
    if (path[0] === 'projects' && selectedProject) {
        items[0] = { title: <Link to="/projects">Projects</Link> }; // Change base to Projects
        items.push({ title: selectedProject.name });
    }
    if (path[0] === 'teams') {
        items.push({ title: 'Teams' });
    }
    if (path[0] === 'profile') {
        items.push({ title: 'Profile' });
    }
     if (path[0] === 'project-management') {
        items.push({ title: 'Project Management' });
    }
    // If on dashboard, only show dashboard link
    if (path[0] === 'dashboard') {
        return [{ title: 'Dashboard' }];
    }
    
    return items;
}


function Header({ setIsAuthenticated, isAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject, currentUser } = useContext(ProjectContext);
  const [notifVisible, setNotifVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnread = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch('http://localhost:5000/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
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
  }, [isAuthenticated, notifVisible]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
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
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const breadcrumbItems = getBreadcrumbItems(location, selectedProject);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 32px', background: '#fff', boxShadow: '0 1px 4px #f0f1f2', position: 'fixed', top: 5, left: 0, right: 0, zIndex: 200 }}>
      <div>
        {/* --- FIX: Use the 'items' prop for Breadcrumb --- */}
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isAuthenticated && (
          <Button type="default" onClick={() => setSearchModalVisible(true)}>
            Search Projects
          </Button>
        )}
        {isAuthenticated && (
            <Badge count={unreadCount}>
                <Button shape="circle" icon={<BellOutlined />} onClick={() => setNotifVisible(true)} />
            </Badge>
        )}
        {isAuthenticated && currentUser && (
          // --- FIX: Use the 'menu' prop for Dropdown ---
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
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