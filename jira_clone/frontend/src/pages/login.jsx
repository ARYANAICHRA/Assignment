import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title } = Typography;

function Login({ setIsAuthenticated }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        // Optionally store user info for header
        localStorage.setItem('user', JSON.stringify(data.user || {}));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
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
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24, color: '#1677ff' }}>Login to Jira Clone</Title>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="Email address" name="email" rules={[{ required: true, message: 'Please enter your email' }]}> 
              <Input type="email" autoFocus />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password' }]}> 
              <Input.Password />
            </Form.Item>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Login</Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </div>
        </Card>
      </div>
      <Footer />
    </>
  );
}

export default Login;
