import React, { useState, useContext, useEffect } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { List, Form, Input, Select, Button, Alert, Typography, Tag, Space, Avatar, Popconfirm, message, Spin } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

const { Title, Text } = Typography;
const { confirm } = Modal;

function ProjectMembers() {
  const { 
    selectedProject, 
    projectMembers, 
    membersLoading, 
    hasProjectPermission
  } = useContext(ProjectContext);
  const { isAdmin } = useAuth();

  const [form] = Form.useForm();
  // State for form feedback is kept local
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roleUpdating, setRoleUpdating] = useState({}); // { userId: boolean }
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState({}); // { [requestId]: boolean }
  
  // --- FIX: All local 'fetchMembers' and 'fetchAdmin' functions have been removed ---
  // The context now handles this, making the component much simpler.

  useEffect(() => {
    if (hasProjectPermission('add_remove_members') && selectedProject) fetchJoinRequests();
    // eslint-disable-next-line
  }, [selectedProject]);

  const fetchJoinRequests = async () => {
    setRequestsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/join-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJoinRequests(data.requests || []);
      }
    } catch {
      setJoinRequests([]);
    }
    setRequestsLoading(false);
  };

  const handleRequestAction = async (requestId, action) => {
    setRequestActionLoading(l => ({ ...l, [requestId]: true }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/join-request/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJoinRequests(reqs => reqs.filter(r => r.id !== requestId));
        setSuccess(`Request ${action}ed successfully.`);
      } else {
        setError('Failed to update request');
      }
    } catch {
      setError('Network error');
    }
    setRequestActionLoading(l => ({ ...l, [requestId]: false }));
  };

  const handleAdd = async (values) => {
    setError(''); 
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: values.email, role: values.role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member added successfully. The list will update shortly.');
        form.resetFields();
        // NOTE: A more advanced implementation would trigger a refresh function from the context.
        // For now, the context will re-fetch if the selectedProject changes.
      } else {
        setError(data.error || 'Failed to add member');
      }
    } catch { 
      setError('A network error occurred.'); 
    }
  };

  const handleRemove = async (userId) => {
    setError(''); 
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Member removed successfully.');
        // The member list will update automatically if the context is set up to re-fetch.
      } else {
        setError(data.error || 'Failed to remove member');
      }
    } catch { 
      setError('A network error occurred.');
    }
  };

  const getRoleTag = (role) => {
    if (role === 'Project Owner') return <Tag color="volcano">Owner</Tag>;
    if (role === 'Project Contributor') return <Tag color="cyan">Contributor</Tag>;
    if (role === 'Project Visitor') return <Tag color="default">Visitor</Tag>;
    return <Tag color="default">Unknown</Tag>;
  };

  // Only show add/remove/change role UI if hasProjectPermission('add_remove_members')
  const canModifyMembers = hasProjectPermission('add_remove_members');

  // Role options for dropdown (user-facing)
  const roleOptions = [
    { value: 'Project Owner', label: 'Owner' },
    { value: 'Project Contributor', label: 'Contributor' }
  ];

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    setRoleUpdating(prev => ({ ...prev, [userId]: true }));
    const token = localStorage.getItem('token');
    const doChange = async () => {
      try {
        const res = await fetch(`http://localhost:5000/projects/${selectedProject.id}/members/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ role: newRole })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess('Role updated successfully.');
        } else {
          setError(data.error || 'Failed to update role');
        }
      } catch {
        setError('A network error occurred.');
      } finally {
        setRoleUpdating(prev => ({ ...prev, [userId]: false }));
      }
    };
    if (newRole === 'Project Owner') {
      confirm({
        title: 'Transfer Project Ownership',
        icon: <ExclamationCircleOutlined />,
        content: 'Are you sure you want to make this user the Project Owner? The current owner will be demoted to Contributor.',
        okText: 'Yes, Transfer',
        cancelText: 'Cancel',
        onOk: doChange
      });
    } else {
      doChange();
    }
  };

  if (!selectedProject) {
      return null; // Don't render if no project is selected
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Project Members</Title>
      
      {/* --- Pending Join Requests (admin/manager only) --- */}
      {canModifyMembers && joinRequests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Pending Join Requests</Title>
          {requestsLoading ? <Spin /> : (
            <List
              bordered
              dataSource={joinRequests}
              renderItem={req => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      type="primary"
                      loading={requestActionLoading[req.id]}
                      onClick={() => handleRequestAction(req.id, 'accept')}
                    >Accept</Button>,
                    <Button
                      size="small"
                      danger
                      loading={requestActionLoading[req.id]}
                      onClick={() => handleRequestAction(req.id, 'reject')}
                    >Reject</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong>{req.username || req.email}</Text>}
                    description={`Requested at ${new Date(req.created_at).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )}

      {/* --- Only admin/manager can see the add member form --- */}
      {canModifyMembers && (
        <Form form={form} layout="inline" onFinish={handleAdd} style={{ marginBottom: 8, flexWrap: 'nowrap', gap: 8 }}>
          <Form.Item name="email" rules={[{ required: true, message: 'Enter user email' }]} style={{ marginBottom: 0, flex: 1 }}> 
            <Input placeholder="User Email" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="role" initialValue="Project Contributor" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
            <Select style={{ width: 120 }}>
              <Select.Option value="Project Owner">Owner</Select.Option>
              <Select.Option value="Project Contributor">Contributor</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="small">Add Member</Button>
          </Form.Item>
        </Form>
      )}

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 12 }} />}
      
      <List
        loading={membersLoading}
        bordered
        dataSource={projectMembers}
        renderItem={member => (
          <List.Item
            actions={
              // Only admin/owner can remove, and not for owner unless admin
              (canModifyMembers && (isAdmin || member.role !== 'Project Owner')) ? [
                <Popconfirm title="Remove this member?" onConfirm={() => handleRemove(member.user_id)} okText="Remove" cancelText="Cancel">
                  <Button type="link" icon={<DeleteOutlined />} danger size="small">Remove</Button>
                </Popconfirm>
              ] : []
            }
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={<Text strong>{member.username || member.email}</Text>}
              description={
                // Only show dropdown for contributors (not for owner), or for admin
                (isAdmin || (canModifyMembers && member.role === 'Project Contributor')) ? (
                  <Space>
                    <Select
                      size="small"
                      value={member.role}
                      style={{ width: 110 }}
                      onChange={val => handleRoleChange(member.user_id, val)}
                      disabled={roleUpdating[member.user_id]}
                      options={roleOptions}
                    />
                    {roleUpdating[member.user_id] && <Spin size="small" />}
                    {getRoleTag(member.role)}
                  </Space>
                ) : getRoleTag(member.role)
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default ProjectMembers;