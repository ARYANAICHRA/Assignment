import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Row, Col, Card } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Paragraph } = Typography;

function Home({ isAuthenticated }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Header isAuthenticated={isAuthenticated} />
      <div style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #f9f0ff 100%)', minHeight: 400, padding: '64px 0 32px 0', textAlign: 'center' }}>
        <Title style={{ fontSize: 48, fontWeight: 800, color: '#1677ff', marginBottom: 16 }}>Welcome to Jira Clone</Title>
        <Paragraph style={{ fontSize: 20, color: '#333', maxWidth: 600, margin: '0 auto 32px auto' }}>
          A modern, collaborative project management tool inspired by Jira. Organize your work, manage teams, and track progress with ease.
        </Paragraph>
        <Button type="primary" size="large" style={{ marginRight: 16 }} onClick={() => navigate('/login')}>Login</Button>
        <Button size="large" onClick={() => navigate('/register')}>Register</Button>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 16px 32px 16px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32, color: '#222' }}>Why Choose Jira Clone?</Title>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false} style={{ textAlign: 'center', minHeight: 220 }}>
              <Title level={4} style={{ color: '#1677ff' }}>Kanban Boards</Title>
              <Paragraph>Visualize your workflow and move tasks across columns with a drag-and-drop interface.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false} style={{ textAlign: 'center', minHeight: 220 }}>
              <Title level={4} style={{ color: '#52c41a' }}>Team Collaboration</Title>
              <Paragraph>Invite team members, assign tasks, and collaborate in real time to get work done faster.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bordered={false} style={{ textAlign: 'center', minHeight: 220 }}>
              <Title level={4} style={{ color: '#faad14' }}>Progress Tracking</Title>
              <Paragraph>Track project progress, see activity feeds, and stay on top of deadlines and deliverables.</Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
      <Footer />
    </>
  );
}

export default Home;
