import React, { useEffect, useState } from 'react';
import { Table, Button, message, Typography, Modal, List, Form, Input, Select, Alert, Avatar, Popconfirm, Space, Tag, Tabs, Spin, Empty, Tooltip } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { UserOutlined, DeleteOutlined, TeamOutlined, ProjectOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberProject, setMemberProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [settingOwner, setSettingOwner] = useState(false);
  const [projectOwnerTeamId, setProjectOwnerTeamId] = useState(null);

  // Get user role from JWT
  let userRole = null;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch (e) {
      userRole = null;
    }
  }

  const fetchProjects = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let userId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.user_id || decoded.sub;
      } catch (e) {}
    }
    const res = await fetch('http://localhost:5000/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setProjects(data.projects.filter(p => p.admin_id === userId));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTeams();
    // Fetch current project owner team id
    if (projects && projects.length > 0) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject && currentProject.owner_team_id) {
        setProjectOwnerTeamId(currentProject.owner_team_id);
      }
    }
  }, [projects, currentProjectId]);

  const fetchTeams = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTeams(data.teams);
    } catch {}
  };

  const handleDelete = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      message.success('Project deleted');
      fetchProjects();
    } else {
      message.error('Failed to delete project');
    }
  };

  const handleViewTeam = async (team) => {
    setTeamModalVisible(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${team.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTeamDetail(data);
      else message.error(data.error || 'Failed to fetch team details');
    } catch (err) {
      message.error('Failed to fetch team details');
    }
  };

  const handleAddProjectToTeam = async (teamId, projectId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${teamId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Project associated with team');
        fetchTeams();
      } else {
        message.error(data.error || 'Failed to associate project');
      }
    } catch {
      message.error('Failed to associate project');
    }
  };

  const handleRemoveProjectFromTeam = async (teamId, projectId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${teamId}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Project disassociated from team');
        fetchTeams();
      } else {
        message.error(data.error || 'Failed to disassociate project');
      }
    } catch {
      message.error('Failed to disassociate project');
    }
  };

  // --- Member Management ---
  const openMemberModal = (project) => {
    setMemberProject(project);
    setMemberModalOpen(true);
    fetchMembers(project.id);
    fetchAdmin(project.admin_id);
  };
  const closeMemberModal = () => {
    setMemberModalOpen(false);
    setMemberProject(null);
    setMembers([]);
    setAdmin(null);
    setError('');
    setSuccess('');
  };
  const fetchMembers = async (projectId) => {
    setMemberLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setMembers(data.members);
    else setError(data.error || 'Failed to fetch members');
    setMemberLoading(false);
  };
  const fetchAdmin = async (adminId) => {
    if (!adminId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/users/${adminId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAdmin(data.user);
    } else {
      setAdmin(null);
    }
  };
  const handleAddMember = async (values) => {
    setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${memberProject.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: values.email, role: values.role })
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Member added');
      form.resetFields();
      fetchMembers(memberProject.id);
    } else setError(data.error || 'Failed to add member');
  };
  const handleRemoveMember = async (uid) => {
    setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${memberProject.id}/members/${uid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Member removed');
      fetchMembers(memberProject.id);
    } else setError(data.error || 'Failed to remove member');
  };
  const getRoleTag = (role, isAdmin) => {
    if (isAdmin) return <Tag color="gold">Admin</Tag>;
    if (role === 'admin') return <Tag color="volcano">Admin</Tag>;
    if (role === 'manager') return <Tag color="blue">Manager</Tag>;
    if (role === 'viewer') return <Tag color="default">Viewer</Tag>;
    return <Tag color="blue">Member</Tag>;
  };

  const handleSetOwnerTeam = async (teamId) => {
    setSettingOwner(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${currentProjectId}/owner_team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ team_id: teamId })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Owner team set for project');
        setProjectOwnerTeamId(teamId);
        fetchProjects();
      } else {
        message.error(data.error || 'Failed to set owner team');
      }
    } catch {
      message.error('Failed to set owner team');
    }
    setSettingOwner(false);
  };

  const columns = [
    { title: 'Project Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => openMemberModal(record)}>
            Manage Members
          </Button>
          <Popconfirm title="Are you sure to delete this project?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 32 }}>
      <Title level={3}>Project Management</Title>
      <Tabs defaultActiveKey="projects">
        <Tabs.TabPane tab="Projects" key="projects">
          <Table
            dataSource={projects}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
          <Modal
            open={memberModalOpen}
            onCancel={closeMemberModal}
            title={memberProject ? `Manage Members: ${memberProject.name}` : 'Manage Members'}
            footer={null}
            width={520}
            destroyOnClose
          >
            {userRole === 'admin' && (
              <Form form={form} layout="inline" onFinish={handleAddMember} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <Form.Item name="email" rules={[{ required: true, message: 'Enter user email' }]}> 
                  <Input placeholder="User Email" style={{ width: 180 }} />
                </Form.Item>
                <Form.Item name="role" initialValue="member" rules={[{ required: true }]}> 
                  <Select style={{ width: 120 }}>
                    <Select.Option value="manager">Manager</Select.Option>
                    <Select.Option value="member">Member</Select.Option>
                    <Select.Option value="viewer">Viewer</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">Add</Button>
                </Form.Item>
              </Form>
            )}
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
            {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 12 }} />}
            <List
              loading={memberLoading}
              bordered
              locale={{ emptyText: memberLoading ? <Spin /> : <Empty description="No members" /> }}
              dataSource={[
                ...(admin ? [{ ...admin, isAdmin: true }] : []),
                ...members.filter(m => !admin || m.user_id !== admin.id)
              ]}
              renderItem={m => (
                <List.Item
                  actions={m.isAdmin ? [getRoleTag(null, true)] : [
                    userRole === 'admin' && (
                      <Popconfirm title="Remove member?" onConfirm={() => handleRemoveMember(m.user_id)} okText="Remove" cancelText="Cancel">
                        <Button type="link" icon={<DeleteOutlined />} danger size="small">Remove</Button>
                      </Popconfirm>
                    )
                  ]}
                  avatar={<Avatar style={{ backgroundColor: m.isAdmin ? '#faad14' : '#1890ff' }} icon={<UserOutlined />} />}
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{m.username || m.email}</Text>
                    <span style={{ fontSize: 12, color: '#888' }}>{getRoleTag(m.role, m.isAdmin)}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Modal>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Teams" key="teams">
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <Space>
                    <TeamOutlined />
                    <Tooltip title="View team details">
                      <span
                        onClick={e => { e.preventDefault(); handleViewTeam(record); }}
                        style={{ fontWeight: 500, textDecoration: 'underline', color: '#1677ff', cursor: 'pointer' }}
                      >
                        {text}
                      </span>
                    </Tooltip>
                  </Space>
                )
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                render: (text) => text || <span style={{ color: '#aaa' }}>No description</span>
              },
              {
                title: 'Associated',
                key: 'associated',
                render: (_, record) => (
                  record.projects && record.projects.some(p => p.id === currentProjectId) ?
                    <Tag color="green">Associated</Tag> :
                    <Tag color="red">Not Associated</Tag>
                )
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Tooltip title="View team details">
                      <Button type="link" onClick={() => handleViewTeam(record)}>View</Button>
                    </Tooltip>
                    {userRole === 'admin' && (
                      record.projects && record.projects.some(p => p.id === currentProjectId) ? (
                        <Tooltip title="Remove this project from team">
                          <Popconfirm
                            title="Remove this project from team?"
                            onConfirm={() => handleRemoveProjectFromTeam(record.id, currentProjectId)}
                            okText="Remove"
                            cancelText="Cancel"
                          >
                            <Button type="link" icon={<DeleteOutlined />} danger>Remove</Button>
                          </Popconfirm>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Add this project to team">
                          <Button type="link" onClick={() => handleAddProjectToTeam(record.id, currentProjectId)}>Add</Button>
                        </Tooltip>
                      )
                    )}
                  </Space>
                )
              }
            ]}
            dataSource={teams}
            rowKey="id"
            bordered
            pagination={false}
            locale={{ emptyText: loading ? <Spin /> : <Empty description="No teams found" /> }}
          />
          <Modal
            title={teamDetail ? teamDetail.name : 'Team Detail'}
            open={teamModalVisible}
            onCancel={() => { setTeamModalVisible(false); setTeamDetail(null); }}
            footer={null}
            width={600}
          >
            {teamDetail ? (
              <div>
                <p><b>Description:</b> {teamDetail.description || <span style={{ color: '#aaa' }}>No description</span>}</p>
                <b>Members:</b>
                <ul>
                  {(teamDetail.members || []).map(member => (
                    <li key={member.id}>{member.username} ({member.email})</li>
                  ))}
                </ul>
                <b>Projects:</b>
                <ul>
                  {(teamDetail.projects || []).map(project => (
                    <li key={project.id}>{project.name}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 16 }}>
                  {projectOwnerTeamId === teamDetail.id ? (
                    <Tag color="blue">Owner Team</Tag>
                  ) : (
                    userRole === 'admin' && (
                      <Button type="primary" loading={settingOwner} onClick={() => handleSetOwnerTeam(teamDetail.id)}>
                        Set as Owner Team for this Project
                      </Button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888' }}><Spin /></div>
            )}
          </Modal>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default ProjectManagement; 