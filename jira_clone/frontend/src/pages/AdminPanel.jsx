import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Divider, Card, List, Avatar, Tag, Spin, Space } from 'antd';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { TeamOutlined, PlusOutlined, UserOutlined, ProjectOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { Option } = Select;

function AdminPanel() {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [showManageProjectModal, setShowManageProjectModal] = useState(false);
  const [showAssignOwnerModal, setShowAssignOwnerModal] = useState(false);
  const [teamForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [assignOwnerForm] = Form.useForm();
  const [selectedTab, setSelectedTab] = useState('1');

  // Add state for team detail modal and related forms
  const [teamDetail, setTeamDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [memberForm] = Form.useForm();
  const [teamRoles, setTeamRoles] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const { isAdmin, currentUser, login } = useAuth();
  const [myRole, setMyRole] = useState(null);
  const [myPermissions, setMyPermissions] = useState([]);

  // Add state for user details modal
  const [userDetails, setUserDetails] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  // Add state for visitor team modal
  const [showVisitorTeamModal, setShowVisitorTeamModal] = useState(false);
  const [visitorTeamProject, setVisitorTeamProject] = useState(null);
  const [visitorTeamForm] = Form.useForm();

  // Effect to fetch all data on component mount or token change
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await fetchTeams();
      await fetchProjects();
      await fetchUsers();
      setLoading(false);
    };
    fetchAllData();
  }, [token]);

  // Effect to reset team form fields when the modal's visibility changes
  useEffect(() => {
    if (showTeamModal) {
      teamForm.resetFields();
      teamForm.setFieldsValue({ name: '', description: '' }); // Explicitly set empty values
    } else {
      setTimeout(() => teamForm.resetFields(), 300);
    }
  }, [showTeamModal, teamForm]);

  // Function to open the team creation modal and reset its form
  const openTeamModal = () => {
    setShowTeamModal(true);
    // Resetting and setting initial values will be handled by the useEffect above
    // when showTeamModal becomes true.
  };

  // Function to close the team creation modal
  const closeTeamModal = () => {
    setShowTeamModal(false);
  };

  // Fetches all teams from the backend
  const fetchTeams = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/teams/all');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      } else {
        message.error('Failed to fetch teams');
      }
    } catch {
      message.error('Network error fetching teams');
    }
  };

  // Fetches all projects from the backend
  const fetchProjects = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/projects/all');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        message.error('Failed to fetch projects');
      }
    } catch {
      message.error('Network error fetching projects');
    }
  };

  // Fetches all users from the backend
  const fetchUsers = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/users/all');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        message.error('Failed to fetch users');
      }
    } catch {
      message.error('Network error fetching users');
    }
  };

  // Fetches members for a specific team
  const fetchTeamMembers = async (teamId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/teams/${teamId}/members`);
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
      } else {
        message.error('Failed to fetch team members');
      }
    } catch {
      message.error('Network error fetching team members');
    }
  };

  // Fetches members for a specific project
  const fetchProjectMembers = async (projectId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setProjectMembers(data.members || []);
      } else {
        message.error('Failed to fetch project members');
      }
    } catch {
      message.error('Network error fetching project members');
    }
  };

  // Handles the creation of a new team
  const handleCreateTeam = async (values) => {
    console.log('Submitting team with values:', values); // Diagnostic log
    try {
      const res = await apiFetch('http://localhost:5000/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (res.ok) {
        message.success('Team created');
        setShowTeamModal(false); // Close modal on success
        fetchTeams(); // Refresh team list
      } else {
        message.error('Failed to create team');
      }
    } catch {
      message.error('Network error creating team');
    }
  };

  // Handles the deletion of a team
  const handleDeleteTeam = async (teamId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Team deleted');
        fetchTeams(); // Refresh team list
      } else {
        message.error('Failed to delete team');
      }
    } catch {
      message.error('Network error deleting team');
    }
  };

  // Handles the creation of a new project
  const handleCreateProject = async (values) => {
    try {
      const res = await apiFetch('http://localhost:5000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (res.ok) {
        message.success('Project created');
        setShowProjectModal(false); // Close modal on success
        fetchProjects(); // Refresh project list
      } else {
        message.error('Failed to create project');
      }
    } catch {
      message.error('Network error creating project');
    }
  };

  // Handles the deletion of a project
  const handleDeleteProject = async (projectId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Project deleted');
        fetchProjects(); // Refresh project list
      } else {
        message.error('Failed to delete project');
      }
    } catch {
      message.error('Network error deleting project');
    }
  };

  // Handles adding a user to a team
  const handleAddUserToTeam = async (userId, teamId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/teams/${teamId}`, { method: 'POST' });
      if (res.ok) {
        message.success('User added to team');
        fetchTeamMembers(teamId); // Refresh team members list
      } else {
        message.error('Failed to add user to team');
      }
    } catch {
      message.error('Network error adding user to team');
    }
  };

  // Handles removing a user from a team
  const handleRemoveUserFromTeam = async (userId, teamId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('User removed from team');
        fetchTeamMembers(teamId); // Refresh team members list
      } else {
        message.error('Failed to remove user from team');
      }
    } catch {
      message.error('Network error removing user from team');
    }
  };

  // Handles adding a user to a project
  const handleAddUserToProject = async (userId, projectId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/projects/${projectId}`, { method: 'POST' });
      if (res.ok) {
        message.success('User added to project');
        fetchProjectMembers(projectId); // Refresh project members list
      } else {
        message.error('Failed to add user to project');
      }
    } catch {
      message.error('Network error adding user to project');
    }
  };

  // Handles removing a user from a project
  const handleRemoveUserFromProject = async (userId, projectId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('User removed from project');
        fetchProjectMembers(projectId); // Refresh project members list
      } else {
        message.error('Failed to remove user from project');
      }
    } catch {
      message.error('Network error removing user from project');
    }
  };

  // Handles changing a user's role within a team
  const handleChangeTeamRole = async (userId, teamId, roleId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/teams/${teamId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      });
      if (res.ok) {
        message.success('Team role updated');
        fetchTeamMembers(teamId); // Refresh team members list
      } else {
        message.error('Failed to update team role');
      }
    } catch {
      message.error('Network error updating team role');
    }
  };

  // Handles changing a user's role within a project
  const handleChangeProjectRole = async (userId, projectId, roleId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/users/${userId}/projects/${projectId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      });
      if (res.ok) {
        message.success('Project role updated');
        fetchProjectMembers(projectId); // Refresh project members list
      } else {
        message.error('Failed to update project role');
      }
    } catch {
      message.error('Network error updating project role');
    }
  };

  // Handles assigning project ownership to a team
  const handleAssignProjectOwner = async (projectId, teamId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/projects/${projectId}/owner_team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId })
      });
      if (res.ok) {
        message.success('Project ownership assigned');
        setShowAssignOwnerModal(false); // Close modal on success
        fetchProjects(); // Refresh project list
      } else {
        message.error('Failed to assign project owner');
      }
    } catch {
      message.error('Network error assigning project owner');
    }
  };

  // Fetch team roles
  const fetchTeamRoles = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/roles/team');
      const data = await res.json();
      if (res.ok) {
        setTeamRoles(data.roles || []);
      } else {
        setTeamRoles([]);
      }
    } catch {
      setTeamRoles([]);
    }
  };

  // Fetch manager requests
  const fetchManagerRequests = async (teamId) => {
    setLoadingRequests(true);
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${teamId}/manager-requests`);
      const data = await res.json();
      if (res.ok) setManagerRequests(data.requests || []);
      else setManagerRequests([]);
    } catch {
      setManagerRequests([]);
    }
    setLoadingRequests(false);
  };

  // View team details
  const handleViewTeam = async (team) => {
    setSelectedTeam(team);
    setDetailVisible(true);
    fetchTeamRoles();
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${team.id}`);
      const data = await res.json();
      if (res.ok) {
        setTeamDetail(data);
      } else {
        message.error(data.error || 'Failed to fetch team details');
      }
      // Fetch my role in this team
      const roleRes = await apiFetch(`http://localhost:5000/teams/${team.id}/my-role`);
      const roleData = await roleRes.json();
      if (roleRes.ok) {
        setMyRole(roleData.role);
        setMyPermissions(roleData.permissions || []);
      } else {
        setMyRole(null);
        setMyPermissions([]);
      }
      // Fetch manager requests if admin or manager
      if (isAdmin || (data && data.manager_id === currentUser?.id)) {
        fetchManagerRequests(team.id);
      } else {
        setManagerRequests([]);
      }
    } catch (err) {
      message.error('Failed to fetch team details');
      setMyRole(null);
      setMyPermissions([]);
      setManagerRequests([]);
    }
  };

  // Change member role
  const handleChangeRole = async (userId, roleId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Role updated');
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Failed to update role');
      }
    } catch (err) {
      message.error('Failed to update role');
    }
  };

  // Add member
  const handleAddMember = async (values) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Member added');
        memberForm.resetFields();
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Action failed. Only team managers or users with the Manager role can add members.');
      }
    } catch (err) {
      message.error('Failed to add member');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/members/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        message.success('Member removed');
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Action failed. Only team managers or users with the Manager role can remove members.');
      }
    } catch (err) {
      message.error('Failed to remove member');
    }
  };

  // Request to be manager
  const handleRequestManager = async () => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/manager-request`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        message.success('Request submitted to become manager.');
      } else {
        message.error(data.error || 'Failed to submit request');
      }
    } catch {
      message.error('Failed to submit request');
    }
  };

  // Accept manager request
  const handleAcceptManagerRequest = async (requestId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/manager-requests/${requestId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        message.success('Manager role transferred.');
        if (managerRequests.find(r => r.id === requestId && r.user_id === currentUser?.id)) {
          const userRes = await apiFetch('http://localhost:5000/me');
          if (userRes.ok) {
            const userData = await userRes.json();
            login(userData, localStorage.getItem('token'));
          }
        }
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Failed to accept request');
      }
    } catch {
      message.error('Failed to accept request');
    }
  };

  // Reject manager request
  const handleRejectManagerRequest = async (requestId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/manager-requests/${requestId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        message.success('Request rejected.');
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Failed to reject request');
      }
    } catch {
      message.error('Failed to reject request');
    }
  };

  // Column definitions for the Teams table
  const teamColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button size="small" onClick={() => { setSelectedTeam(record); fetchTeamMembers(record.id); setShowManageTeamModal(true); }}>Manage</Button>
          <Popconfirm title="Delete this team?" onConfirm={() => handleDeleteTeam(record.id)} okText="Yes" cancelText="No">
            <Button size="small" danger style={{ marginLeft: 8 }}>Delete</Button>
          </Popconfirm>
        </>
      )
    },
  ];

  // Column definitions for the Projects table
  const handleRemoveAllVisitors = async (projectId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/projects/${projectId}/remove-visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        message.success('All visitors removed from project');
        fetchProjectMembers(projectId);
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to remove visitors');
      }
    } catch {
      message.error('Network error removing visitors');
    }
  };
  const projectColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { 
      title: 'Owning Team', 
      dataIndex: 'owner_team_id', 
      key: 'owner_team_id',
      render: (owner_team_id) => {
        const team = teams.find(t => t.id === owner_team_id);
        return team ? `${team.name}${team.description ? ' (' + team.description + ')' : ''}` : owner_team_id;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button size="small" onClick={() => { setSelectedProject(record); fetchProjectMembers(record.id); setShowManageProjectModal(true); }}>Manage</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => { setSelectedProject(record); setShowAssignOwnerModal(true); }}>Assign Owner</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => handleOpenVisitorTeamModal(record)}>Add Visitor Team</Button>
          <Popconfirm title="Are you sure you want to remove all visitors from this project?" onConfirm={() => handleRemoveAllVisitors(record.id)} okText="Remove" cancelText="Cancel">
            <Button size="small" icon={<EyeOutlined />} style={{ marginLeft: 8 }} danger>Remove All Visitors</Button>
          </Popconfirm>
          <Popconfirm title="Delete this project?" onConfirm={() => handleDeleteProject(record.id)} okText="Yes" cancelText="No">
            <Button size="small" danger style={{ marginLeft: 8 }}>Delete</Button>
          </Popconfirm>
        </>
      )
    },
  ];

  // Column definitions for the Users table
  const userColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.email !== 'admin@example.com' && (
            <Button size="small" onClick={() => handleShowUserDetails(record)}>Manage</Button>
          )}
          {record.email !== 'admin@example.com' && (
            <Popconfirm title="Delete this user?" onConfirm={() => handleDeleteUser(record.id)} okText="Delete" cancelText="Cancel">
              <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      )
    },
  ];

  // Function to delete a user
  const handleDeleteUser = async (userId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('User deleted');
        fetchUsers();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to delete user');
      }
    } catch {
      message.error('Network error deleting user');
    }
  };

  // Function to show user details (teams/projects)
  const handleShowUserDetails = async (user) => {
    try {
      const res = await apiFetch(`http://localhost:5000/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data.user);
        setShowUserDetailsModal(true);
      } else {
        message.error('Failed to fetch user details');
      }
    } catch {
      message.error('Network error fetching user details');
    }
  };

  const handleOpenVisitorTeamModal = (project) => {
    setVisitorTeamProject(project);
    setShowVisitorTeamModal(true);
    visitorTeamForm.resetFields();
  };
  const handleCloseVisitorTeamModal = () => {
    setShowVisitorTeamModal(false);
    setVisitorTeamProject(null);
  };
  const handleAddVisitorTeam = async (values) => {
    try {
      const res = await apiFetch(`http://localhost:5000/admin/projects/${visitorTeamProject.id}/visitor-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: values.team_id })
      });
      if (res.ok) {
        message.success('Team added as visitors');
        handleCloseVisitorTeamModal();
        fetchProjects();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to add visitor team');
      }
    } catch {
      message.error('Network error adding visitor team');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f6fa' }}>
      <Layout style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', minHeight: 'calc(100vh - 56px)', position: 'sticky', top: 56, zIndex: 2 }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedTab]}
            onClick={e => setSelectedTab(e.key)}
            style={{ height: '100%', borderRight: 0, paddingTop: 32 }}
            items={[
              { key: '1', label: <span style={{ fontWeight: 500 }}>Teams</span> },
              { key: '2', label: <span style={{ fontWeight: 500 }}>Projects</span> },
              { key: '3', label: <span style={{ fontWeight: 500 }}>Users</span> },
            ]}
          />
        </Sider>
        <Content style={{ padding: '32px 32px 0 32px', minHeight: 280, background: '#f4f6fa', overflow: 'auto' }}>
          {selectedTab === '1' && (
            <div style={{ padding: 0 }}>
              <Title level={3} style={{ margin: 0, marginBottom: 16 }}>Teams</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={openTeamModal} style={{ marginBottom: 16 }}>
                Create Team
              </Button>
              <Table
                columns={[
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
                  },
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button type="primary" ghost onClick={() => handleViewTeam(record)}>View Details</Button>
                        <Popconfirm
                          title="Are you sure you want to delete this team?"
                          onConfirm={() => handleDeleteTeam(record.id)}
                          okText="Delete"
                          cancelText="Cancel"
                        >
                          <Button type="primary" danger icon={<DeleteOutlined />}>Delete</Button>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
                dataSource={teams}
                rowKey="id"
                loading={loading}
              />
              <Modal
                title="Create Team"
                open={showTeamModal}
                onCancel={closeTeamModal}
                onOk={() => teamForm.submit()}
                okText="Create"
                destroyOnClose
              >
                <Form form={teamForm} layout="vertical" onFinish={handleCreateTeam}>
                  <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Form>
              </Modal>
              <Modal
                title={teamDetail ? teamDetail.name : 'Team Detail'}
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={600}
                destroyOnHidden
              >
                {teamDetail ? (
                  <div>
                    <p><b>Description:</b> {teamDetail.description || 'N/A'}</p>
                    {/* Manager requests for admin/manager */}
                    {(isAdmin || teamDetail.manager_id === currentUser?.id) && managerRequests.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <b>Manager Requests:</b>
                        <List
                          size="small"
                          loading={loadingRequests}
                          dataSource={managerRequests}
                          renderItem={req => (
                            <List.Item
                              actions={[
                                <Button size="small" type="primary" onClick={() => handleAcceptManagerRequest(req.id)}>Accept</Button>,
                                <Button size="small" danger onClick={() => handleRejectManagerRequest(req.id)}>Reject</Button>
                              ]}
                            >
                              <span>{req.username} ({req.email})</span>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}
                    <Title level={5}>Members</Title>
                    <List
                      dataSource={teamDetail.members || []}
                      renderItem={member => (
                        <List.Item
                          actions={[
                            (isAdmin || myRole === 'Manager' || (teamDetail && teamDetail.manager_id === currentUser?.id)) && (
                              member.id === currentUser?.id ? (
                                <Popconfirm
                                  title="Are you sure you want to exit this team?"
                                  onConfirm={() => handleRemoveMember(member.id)}
                                  okText="Exit"
                                  cancelText="Cancel"
                                >
                                  <Button type="link" danger icon={<DeleteOutlined />}>Exit Team</Button>
                                </Popconfirm>
                              ) : (
                                <Popconfirm
                                  title="Remove member?"
                                  onConfirm={() => handleRemoveMember(member.id)}
                                >
                                  <Button type="link" danger icon={<DeleteOutlined />}>Remove</Button>
                                </Popconfirm>
                              )
                            )
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={member.username}
                            description={
                              <>
                                {member.email}
                                {member.is_manager && (
                                  <Tag color="blue" style={{ marginLeft: 8, fontWeight: 500 }}>Manager</Tag>
                                )}
                              </>
                            }
                          />
                          {(isAdmin || myRole === 'Manager' || (teamDetail && teamDetail.manager_id === currentUser?.id)) && !member.is_manager && (
                            <Popconfirm
                              title={`Are you sure you want to set ${member.username} as the Team Manager? This will demote the current manager to member.`}
                              onConfirm={() => {
                                const managerRole = teamRoles.find(r => r.name === 'Team Manager');
                                if (managerRole) handleChangeRole(member.id, managerRole.id);
                              }}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button size="small" type="primary">Set as Manager</Button>
                            </Popconfirm>
                          )}
                        </List.Item>
                      )}
                    />
                    {(isAdmin || myRole === 'Manager' || (teamDetail && teamDetail.manager_id === currentUser?.id)) && (
                      <Form form={memberForm} layout="inline" onFinish={handleAddMember} style={{ marginTop: 16 }}>
                        <Form.Item name="email" rules={[{ required: true }]}>
                          <Input placeholder="Add member by email" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit">Add</Button>
                      </Form>
                    )}
                  </div>
                ) : <Spin />}
              </Modal>
            </div>
          )}
          {selectedTab === '2' && (
            <Card styles={{ body: { padding: 24 } }} style={{ marginBottom: 32, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}>
              <Title level={4} style={{ marginBottom: 16 }}>Projects Management</Title>
              <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setShowProjectModal(true)}>Create Project</Button>
              <Table dataSource={projects} columns={projectColumns} rowKey="id" loading={loading} size="middle" pagination={{ pageSize: 6 }} scroll={{ x: 600 }} />
            </Card>
          )}
          {selectedTab === '3' && (
            <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}>
              <Title level={4} style={{ marginBottom: 16 }}>Users Management</Title>
              <Table dataSource={users} columns={userColumns} rowKey="id" loading={loading} size="middle" pagination={{ pageSize: 8 }} scroll={{ x: 600 }} />
            </Card>
          )}

          {/* Create Project Modal */}
          <Modal
            title="Create Project"
            open={showProjectModal}
            onCancel={() => setShowProjectModal(false)}
            onOk={async () => {
              try {
                await projectForm.validateFields();
                projectForm.submit();
              } catch (e) {
                console.error("Project form validation failed:", e);
              }
            }}
            okText="Create"
            cancelText="Cancel"
            destroyOnHidden
          >
            {showProjectModal && (
              <Form form={projectForm} layout="vertical" onFinish={handleCreateProject} initialValues={{ name: '', description: '', owner_team_id: '' }}>
                <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please enter a project name' }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input />
                </Form.Item>
                <Form.Item name="owner_team_id" label="Owner Team" rules={[{ required: true, message: 'Please select an owner team' }]}>
                  <Select
                    showSearch
                    placeholder="Select a team"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {teams.map(t => (
                      <Option key={t.id} value={t.id}>{t.name} {t.description ? `(${t.description})` : ''}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            )}
          </Modal>

          {/* Manage Team Modal */}
          <Modal
            title={`Manage Team: ${selectedTeam?.name}`}
            open={showManageTeamModal}
            onCancel={() => setShowManageTeamModal(false)}
            footer={null}
          >
            <Title level={5}>Members</Title>
            <Table
              dataSource={teamMembers}
              columns={[
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Role', dataIndex: 'role', key: 'role' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Popconfirm title="Remove this user from team?" onConfirm={() => handleRemoveUserFromTeam(record.user_id, selectedTeam.id)} okText="Yes" cancelText="No">
                      <Button size="small" danger>Remove</Button>
                    </Popconfirm>
                  )
                }
              ]}
              rowKey="user_id"
              pagination={false}
            />
            <Title level={5} style={{ marginTop: 16 }}>Add User to Team</Title>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Select user"
              optionFilterProp="children"
              onSelect={userId => handleAddUserToTeam(userId, selectedTeam.id)}
            >
              {users.filter(u => !teamMembers.some(m => m.user_id === u.id)).map(u => (
                <Option key={u.id} value={u.id}>{u.username} ({u.email})</Option>
              ))}
            </Select>
          </Modal>

          {/* Manage Project Modal */}
          <Modal
            title={`Manage Project: ${selectedProject?.name}`}
            open={showManageProjectModal}
            onCancel={() => setShowManageProjectModal(false)}
            footer={null}
          >
            <Title level={5}>Members</Title>
            <Table
              dataSource={projectMembers}
              columns={[
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Role', dataIndex: 'role', key: 'role' },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Popconfirm title="Remove this user from project?" onConfirm={() => handleRemoveUserFromProject(record.user_id, selectedProject.id)} okText="Yes" cancelText="No">
                      <Button size="small" danger>Remove</Button>
                    </Popconfirm>
                  )
                }
              ]}
              rowKey="user_id"
              pagination={false}
            />
            <Title level={5} style={{ marginTop: 16 }}>Add User to Project</Title>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Select user"
              optionFilterProp="children"
              onSelect={userId => handleAddUserToProject(userId, selectedProject.id)}
            >
              {users.filter(u => !projectMembers.some(m => m.user_id === u.id)).map(u => (
                <Option key={u.id} value={u.id}>{u.username} ({u.email})</Option>
              ))}
            </Select>
          </Modal>

          {/* Assign Project Owner Modal */}
          <Modal
            title={`Assign Project Owner: ${selectedProject?.name}`}
            open={showAssignOwnerModal}
            onCancel={() => setShowAssignOwnerModal(false)}
            onOk={() => assignOwnerForm.submit()}
            okText="Assign"
            destroyOnHidden
          >
            {showAssignOwnerModal && (
              <Form form={assignOwnerForm} layout="vertical" onFinish={values => handleAssignProjectOwner(selectedProject.id, values.owner_team_id)} initialValues={{ owner_team_id: '' }}>
                <Form.Item name="owner_team_id" label="Owner Team" rules={[{ required: true, message: 'Please select an owner team' }]}>
                  <Select
                    showSearch
                    placeholder="Select a team"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {teams.map(t => (
                      <Option key={t.id} value={t.id}>{t.name} {t.description ? `(${t.description})` : ''}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            )}
          </Modal>

          {/* Visitor Team Modal */}
          <Modal
            title={`Add Visitor Team to Project: ${visitorTeamProject?.name || ''}`}
            open={showVisitorTeamModal}
            onCancel={handleCloseVisitorTeamModal}
            onOk={() => visitorTeamForm.submit()}
            okText="Add Visitor Team"
            destroyOnClose
          >
            <Form form={visitorTeamForm} layout="vertical" onFinish={handleAddVisitorTeam}>
              <Form.Item name="team_id" label="Select Team" rules={[{ required: true, message: 'Please select a team' }]}> 
                <Select placeholder="Select a team">
                  {teams.map(team => (
                    <Option key={team.id} value={team.id}>{team.name} {team.description ? `(${team.description})` : ''}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
      {/* User Details Modal */}
      <Modal
        title={userDetails ? `User Details: ${userDetails.username}` : 'User Details'}
        open={showUserDetailsModal}
        onCancel={() => setShowUserDetailsModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {userDetails ? (
          <div>
            <p><b>Email:</b> {userDetails.email}</p>
            <Divider />
            <Title level={5}>Teams</Title>
            <List
              dataSource={userDetails.teams}
              renderItem={team => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TeamOutlined />} />}
                    title={team.name}
                    description={<span>Role: <b>{team.role}</b>{team.manager_id === userDetails.id && <Tag color="blue" style={{ marginLeft: 8 }}>Manager</Tag>}</span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No teams' }}
            />
            <Divider />
            <Title level={5}>Projects</Title>
            <List
              dataSource={userDetails.projects}
              renderItem={project => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ProjectOutlined />} />}
                    title={project.name}
                    description={<span>Role: <b>{project.role}</b></span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No projects' }}
            />
          </div>
        ) : <Spin />}
      </Modal>
    </Layout>
  );
}

export default AdminPanel;
