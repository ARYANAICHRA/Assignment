import React, { useState, useContext, useEffect } from 'react';
import { Modal, Form, Input, Button, Alert, Typography, Select, Spin } from 'antd';
import { ProjectContext } from '../context/ProjectContext';

const { Title } = Typography;

function CreateProjectModal({ visible, onProjectCreated, onCancel }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSelectedProject, currentUser } = useContext(ProjectContext);
  const [userTeams, setUserTeams] = useState([]);
  const [allowedTeams, setAllowedTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Fetch teams for the dropdown
  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      const token = localStorage.getItem('token');
      try {
        let url = currentUser && currentUser.email === 'admin@example.com'
          ? 'http://localhost:5000/teams/all'
          : 'http://localhost:5000/teams/my-teams';
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUserTeams(data.teams || []);
        } else {
          setUserTeams([]);
        }
      } catch {
        setUserTeams([]);
      }
      setTeamsLoading(false);
    };
    if (visible && currentUser) fetchTeams();
  }, [visible, currentUser]);

  // Filter teams by create_project permission
  useEffect(() => {
    if (!userTeams.length) { setAllowedTeams([]); return; }
    if (currentUser && currentUser.email === 'admin@example.com') {
      setAllowedTeams(userTeams);
      console.log('ADMIN: userTeams for dropdown:', userTeams);
      return;
    }
    const filterTeams = async () => {
      const token = localStorage.getItem('token');
      const results = await Promise.all(userTeams.map(async (team) => {
        const res = await fetch(`http://localhost:5000/teams/${team.id}/my-role`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.permissions && data.permissions.includes('create_project')) {
          return team;
        }
        return null;
      }));
      setAllowedTeams(results.filter(Boolean));
      console.log('NON-ADMIN: allowedTeams for dropdown:', results.filter(Boolean));
    };
    filterTeams();
  }, [userTeams, currentUser]);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: values.name, description: values.description, owner_team_id: values.owner_team_id })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProject(data.project);
        onProjectCreated && onProjectCreated(data.project);
        form.resetFields();
        if (onCancel) onCancel();
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <Modal
      open={visible}
      title={<Title level={4} style={{ marginBottom: 0 }}>Create New Project</Title>}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Create"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Project Name" name="name" rules={[{ required: true, message: 'Please enter a project name' }]}> 
          <Input placeholder="Project name" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Description (optional)" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item label="Team" name="owner_team_id" rules={[{ required: true, message: 'Please select a team' }]}> 
          {teamsLoading ? <Spin /> : (
            <Select placeholder="Select a team" onChange={setSelectedTeam}>
              {allowedTeams.map(team => (
                <Select.Option key={team.id} value={team.id}>{team.name}</Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
      </Form>
    </Modal>
  );
}

export default CreateProjectModal;