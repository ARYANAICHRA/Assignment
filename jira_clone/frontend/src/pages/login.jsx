import React, { useState, useContext } from 'react'; // Import useContext
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ProjectContext } from '../context/ProjectContext'; // Import context
import { useAuth } from '../context/AuthContext'; // Use new AuthContext

const { Title } = Typography;

function LoginPage() { // Accept setIsAuthenticated as prop
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth(); // Get login function and isAdmin from AuthContext
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useContext(ProjectContext); // Use context
  const { currentUser } = useAuth();

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
      if (res.ok && data.token) {
        login(data.user, data.token); // Use data.token, not data.access_token
        // Redirect based on admin status
        if (data.user.email === 'admin@example.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    // The JSX for this component remains the same
    <>
      <Header />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 0 64px 0', // Extra bottom padding for footer
        background: '#f7f9fb',
      }}>
        <Card variant="outlined" style={{ borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2', width: 400, maxWidth: '90vw' }}>
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

export default LoginPage;