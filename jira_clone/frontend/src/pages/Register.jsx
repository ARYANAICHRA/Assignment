import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title } = Typography;

function Register() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState('visitor');

  const onFinish = async (values) => {
    setError('');
    setSuccess('');
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, email: values.email, password: values.password, role: role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 400, margin: '48px auto', padding: '0 16px' }}>
        <Card bordered style={{ borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24, color: '#1677ff' }}>Register for Jira Clone</Title>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please enter your username' }]}> 
              <Input autoFocus />
            </Form.Item>
            <Form.Item label="Email address" name="email" rules={[{ required: true, message: 'Please enter your email' }]}> 
              <Input type="email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password' }]}> 
              <Input.Password />
            </Form.Item>
            <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, message: 'Please confirm your password' }]}> 
              <Input.Password />
            </Form.Item>
            <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Please select a role' }]}>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="visitor">Visitor</option>
              </select>
            </Form.Item>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
            {success && <Alert message={success} type="success" showIcon style={{ marginBottom: 12 }} />}
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Register</Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </Card>
      </div>
      <Footer />
    </>
  );
}

export default Register;
