import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, List, Avatar, Popconfirm, Tag, AutoComplete, Spin, Empty, Tooltip } from 'antd';
import { TeamOutlined, PlusOutlined, UserOutlined, ProjectOutlined, DeleteOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [memberForm] = Form.useForm();
  const [addingMember, setAddingMember] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [addingProject, setAddingProject] = useState(false);

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

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTeams(data.teams);
      else message.error(data.error || 'Failed to fetch teams');
    } catch (err) {
      message.error('Failed to fetch teams');
    }
    setLoading(false);
  };

  const handleCreateTeam = async (values) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  const handleAddMember = async (values) => {
    setAddingMember(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Member added');
        memberForm.resetFields();
        handleViewTeam(selectedTeam); // Refresh detail
      } else {
        message.error(data.error || 'Failed to add member');
      }
    } catch (err) {
      message.error('Failed to add member');
    }
    setAddingMember(false);
  };

  const handleRemoveMember = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Member removed');
        handleViewTeam(selectedTeam); // Refresh detail
      } else {
        message.error(data.error || 'Failed to remove member');
      }
    } catch (err) {
      message.error('Failed to remove member');
    }
  };

  const fetchProjectOptions = async (search) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects?search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjectOptions((data.projects || []).map(p => ({ value: p.id, label: p.name })));
      } else {
        setProjectOptions([]);
      }
    } catch {
      setProjectOptions([]);
    }
  };

  const handleAddProject = async (value) => {
    setAddingProject(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: value })
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Project associated');
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Failed to associate project');
      }
    } catch {
      message.error('Failed to associate project');
    }
    setAddingProject(false);
  };

  const handleRemoveProject = async (projectId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        message.success('Project disassociated');
        handleViewTeam(selectedTeam);
      } else {
        message.error(data.error || 'Failed to disassociate project');
      }
    } catch {
      message.error('Failed to disassociate project');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <TeamOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewTeam(record)}>View</Button>
      )
    }
  ];

  return (
    <div style={{ padding: 32 }}>
      <Title level={3}>Teams</Title>
      {userRole === 'admin' && (
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setShowModal(true)}>
          Create Team
        </Button>
      )}
      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        loading={loading}
        pagination={false}
        bordered
        locale={{ emptyText: loading ? <Spin /> : <Empty description="No teams found" /> }}
      />
      <Modal
        title="Create Team"
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTeam}>
          <Form.Item name="name" label="Team Name" rules={[{ required: true, message: 'Please enter a team name' }]}> 
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
        onCancel={() => { setDetailVisible(false); setTeamDetail(null); }}
        footer={null}
        width={600}
      >
        {teamDetail ? (
          <div>
            <p><b>Description:</b> {teamDetail.description || <span style={{ color: '#aaa' }}>No description</span>}</p>
            <Title level={5}>Members</Title>
            <List
              dataSource={teamDetail.members || []}
              locale={{ emptyText: <Empty description="No members" /> }}
              renderItem={member => (
                <List.Item
                  actions={userRole === 'admin' && !member.is_admin ? [
                    <Popconfirm
                      title="Remove member?"
                      onConfirm={() => handleRemoveMember(member.id)}
                      okText="Remove"
                      cancelText="Cancel"
                    >
                      <Button type="link" icon={<DeleteOutlined />} danger>Remove</Button>
                    </Popconfirm>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={member.username}
                    description={member.email}
                  />
                  {member.is_admin && <Tag color="blue">Admin</Tag>}
                </List.Item>
              )}
            />
            {userRole === 'admin' && (
              <Form form={memberForm} layout="inline" onFinish={handleAddMember} style={{ marginTop: 16 }}>
                <Form.Item name="email" rules={[{ required: true, message: 'Enter user email' }]}> 
                  <Input placeholder="Add member by email" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={addingMember}>Add Member</Button>
                </Form.Item>
              </Form>
            )}
            <Title level={5} style={{ marginTop: 24 }}>Associated Projects</Title>
            <List
              dataSource={teamDetail.projects || []}
              locale={{ emptyText: <Empty description="No projects" /> }}
              renderItem={project => (
                <List.Item
                  actions={userRole === 'admin' ? [
                    <Tooltip title="Remove project from team">
                      <Popconfirm
                        title="Remove project from team?"
                        onConfirm={() => handleRemoveProject(project.id)}
                        okText="Remove"
                        cancelText="Cancel"
                      >
                        <Button type="link" icon={<DeleteOutlined />} danger>Remove</Button>
                      </Popconfirm>
                    </Tooltip>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={<ProjectOutlined />}
                    title={<Tooltip title="Go to project"><Link to={`/projects/${project.id}`} style={{ textDecoration: 'underline', color: '#1677ff' }}>{project.name}</Link></Tooltip>}
                    description={project.description}
                  />
                </List.Item>
              )}
            />
            {userRole === 'admin' && (
              <div style={{ marginTop: 16 }}>
                <AutoComplete
                  style={{ width: 300 }}
                  options={projectOptions}
                  onSearch={fetchProjectOptions}
                  onSelect={handleAddProject}
                  placeholder="Add project by name or ID"
                  value={projectSearch}
                  onChange={setProjectSearch}
                  disabled={addingProject}
                />
                <Button type="primary" style={{ marginLeft: 8 }} loading={addingProject} disabled={!projectSearch} onClick={() => handleAddProject(projectSearch)}>
                  Add Project
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888' }}><Spin /></div>
        )}
      </Modal>
    </div>
  );
};

export default Teams; 