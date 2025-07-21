import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, List, Avatar, Popconfirm, Tag, Spin, Empty, Tooltip } from 'antd';
import { TeamOutlined, PlusOutlined, UserOutlined, ProjectOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

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
  
  // --- FIX: Get current user from localStorage without decoding JWT ---
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      // Use the dedicated endpoint to get only the teams the user is a member of
      const res = await fetch('http://localhost:5000/teams/my-teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        fetchMyTeams();
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
      if (res.ok) {
        setTeamDetail(data);
      } else {
        message.error(data.error || 'Failed to fetch team details');
      }
    } catch (err) {
      message.error('Failed to fetch team details');
    }
  };

  const handleAddMember = async (values) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values)
    });
    const data = await res.json();
    if (res.ok) {
        message.success('Member added');
        memberForm.resetFields();
        handleViewTeam(selectedTeam); // Refresh detail
    } else {
        message.error(data.error || 'Action failed. Only team admins can add members.');
    }
  };

  const handleRemoveMember = async (userId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/teams/${selectedTeam.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
        message.success('Member removed');
        handleViewTeam(selectedTeam); // Refresh detail
    } else {
        message.error(data.error || 'Action failed. Only team admins can remove members.');
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

  return (
    <div style={{ padding: 32 }}>
      <Space align="center" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>Teams</Title>
        {/* --- FIX: Removed userRole check. Any user can create a team. --- */}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
          Create Team
        </Button>
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
            <Title level={5}>Members</Title>
            <List
              dataSource={teamDetail.members || []}
              renderItem={member => (
                <List.Item
                  actions={[
                    // --- FIX: Show button to all, backend will enforce permission ---
                    !member.is_admin && (
                      <Popconfirm
                        title="Remove member?"
                        onConfirm={() => handleRemoveMember(member.id)}
                      >
                        <Button type="link" danger icon={<DeleteOutlined />}>Remove</Button>
                      </Popconfirm>
                    )
                  ]}
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
            {/* --- FIX: Show form to all, backend will enforce permission --- */}
            <Form form={memberForm} layout="inline" onFinish={handleAddMember} style={{ marginTop: 16 }}>
              <Form.Item name="email" rules={[{ required: true }]}> 
                <Input placeholder="Add member by email" />
              </Form.Item>
              <Button type="primary" htmlType="submit">Add</Button>
            </Form>
            
            {/* Project association logic can remain, as it's also permission-gated by the backend */}
          </div>
        ) : <Spin />}
      </Modal>
    </div>
  );
};

export default Teams;