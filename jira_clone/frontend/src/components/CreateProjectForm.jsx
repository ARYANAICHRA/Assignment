import React, { useState, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Form, Input, Button, Alert, Typography } from 'antd';

const { Title } = Typography;

function CreateProjectForm({ onProjectCreated, open, onCancel }) {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSelectedProject } = useContext(ProjectContext);

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
        body: JSON.stringify({ name: values.name, description: values.description })
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
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 16 }}>Create New Project</Title>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Project Name" name="name" rules={[{ required: true, message: 'Please enter a project name' }]}> 
          <Input placeholder="Project name" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Description (optional)" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Create Project
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default CreateProjectForm;
