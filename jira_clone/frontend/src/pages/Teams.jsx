import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, List, Avatar, Popconfirm, Tag, Spin, Empty, Tooltip, Select } from 'antd';
import { TeamOutlined, PlusOutlined, UserOutlined, ProjectOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [memberForm] = Form.useForm();
  const [myRole, setMyRole] = useState(null);
  const [myPermissions, setMyPermissions] = useState([]);
  const [teamRoles, setTeamRoles] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const { isAdmin, currentUser, login } = useAuth();

  useEffect(() => {
    fetchTeams();
  }, [isAdmin]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        res = await apiFetch('http://localhost:5000/teams/all');
      } else {
        res = await apiFetch('http://localhost:5000/teams/my-teams');
      }
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams || []);
      } else {
        message.error(data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      message.error('Failed to fetch teams');
    }
    setLoading(false);
  };

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

  const handleCreateTeam = async (values) => {
    try {
      const res = await apiFetch('http://localhost:5000/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Team created');
        setShowModal(false);
        form.resetFields();
        fetchTeams();
      } else {
        message.error(data.error || 'Failed to create team');
      }
    } catch (err) {
      message.error('Failed to create team');
    }
  };

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
        handleViewTeam(selectedTeam); // Refresh detail
      } else {
        message.error(data.error || 'Action failed. Only team managers or users with the Manager role can add members.');
      }
    } catch (err) {
      message.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/members/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        message.success('Member removed');
        handleViewTeam(selectedTeam); // Refresh detail
      } else {
        message.error(data.error || 'Action failed. Only team managers or users with the Manager role can remove members.');
      }
    } catch (err) {
      message.error('Failed to remove member');
    }
  };

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

  const handleAcceptManagerRequest = async (requestId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/teams/${selectedTeam.id}/manager-requests/${requestId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        message.success('Manager role transferred.');
        // If the current user is the new manager, update their context/localStorage
        if (managerRequests.find(r => r.id === requestId && r.user_id === currentUser?.id)) {
          // Fetch updated user info
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

  const columns = [
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
        <Button type="primary" ghost onClick={() => handleViewTeam(record)}>View Details</Button>
      )
    }
  ];

  // Only show create team button for firm admin
  const canCreateTeam = isAdmin;

  // Only show add/remove member UI if user is admin or manager of the team
  const canManageMembers = isAdmin || myRole === 'Manager' || (teamDetail && teamDetail.manager_id === currentUser?.id);
  // Only show role change dropdown if user has assign_team_role permission or is manager
  const canChangeRoles = canManageMembers || myPermissions.includes('assign_team_role');

  return (
    <div style={{ padding: 32 }}>
      <Space align="center" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>Teams</Title>
        {canCreateTeam && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
            Create Team
          </Button>
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Create Team"
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
        okText="Create"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTeam}>
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
            {/* Request to be manager button for non-manager, non-admin users */}
            {currentUser && !isAdmin && teamDetail.manager_id !== currentUser.id && (
              <Button type="dashed" style={{ marginBottom: 16 }} onClick={handleRequestManager}>
                Request to be Manager
              </Button>
            )}
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
                    (canManageMembers || isAdmin) && (
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
                  {canChangeRoles && !member.is_manager && (
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
            {canManageMembers && (
              <Form form={memberForm} layout="inline" onFinish={handleAddMember} style={{ marginTop: 16 }}>
                <Form.Item name="email" rules={[{ required: true }]}> 
                  <Input placeholder="Add member by email" />
                </Form.Item>
                <Button type="primary" htmlType="submit">Add</Button>
              </Form>
            )}
            {/* Project association logic can remain, as it's also permission-gated by the backend */}
          </div>
        ) : <Spin />}
      </Modal>
    </div>
  );
};

export default Teams;