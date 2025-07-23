import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Row, Col, Card } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ArrowRightOutlined, TeamOutlined, DashboardOutlined, LineChartOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function Home() {
  const navigate = useNavigate();

  // Optionally, you can use AuthContext here if you want to redirect authenticated users
  // const { currentUser } = useAuth();
  // React.useEffect(() => {
  //   if (currentUser) {
  //     navigate('/dashboard');
  //   }
  // }, [currentUser, navigate]);

  const features = [
    {
      title: "Kanban Boards",
      description: "Visualize your workflow with intuitive drag-and-drop interface for seamless task management.",
      icon: <DashboardOutlined style={{ fontSize: 32, color: '#1677ff' }} />
    },
    {
      title: "Team Collaboration",
      description: "Real-time collaboration with team members through task assignments and comments.",
      icon: <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />
    },
    {
      title: "Progress Tracking",
      description: "Comprehensive analytics and reporting to track project milestones and productivity.",
      icon: <LineChartOutlined style={{ fontSize: 32, color: '#faad14' }} />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: 44 }}>
      <Header />
      
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2
        }}>
          <Title style={{ 
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            color: '#1a1a1a',
            marginBottom: 24,
            lineHeight: 1.2
          }}>
            Streamline Your Projects with <span style={{ color: '#1677ff' }}>Jira Clone</span>
          </Title>
          
          <Paragraph style={{ 
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#4a4a4a',
            maxWidth: 700,
            margin: '0 auto 40px auto',
            lineHeight: 1.6
          }}>
            A modern project management solution that helps teams plan, track, and deliver work efficiently.
          </Paragraph>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              type="primary" 
              size="large" 
              shape="round"
              style={{ 
                padding: '0 32px',
                height: 48,
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)'
              }}
              onClick={() => navigate('/login')}
            >
              Get Started <ArrowRightOutlined />
            </Button>
            <Button 
              size="large" 
              shape="round"
              style={{ 
                padding: '0 32px',
                height: 48,
                fontWeight: 500
              }}
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ 
        padding: '80px 24px',
        backgroundColor: '#fff'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ 
            textAlign: 'center',
            marginBottom: 60,
            color: '#1a1a1a',
            fontWeight: 600
          }}>
            Why Teams Love Jira Clone
          </Title>
          
          <Row gutter={[32, 48]} justify="center">
            {features.map((feature, index) => (
              <Col key={index} xs={24} sm={12} lg={8}>
                <Card 
                  bordered={false}
                  style={{ 
                    textAlign: 'center',
                    height: '100%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    borderRadius: 12,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                  hoverable
                  bodyStyle={{ padding: 32 }}
                >
                  <div style={{ marginBottom: 24 }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ 
                    marginBottom: 16,
                    color: '#1a1a1a',
                    fontWeight: 500
                  }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ 
                    color: '#666',
                    marginBottom: 0,
                    fontSize: 16
                  }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ 
            color: '#fff',
            marginBottom: 24,
            fontWeight: 600
          }}>
            Ready to Transform Your Workflow?
          </Title>
          <Paragraph style={{ 
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 40
          }}>
            Join thousands of teams who manage their projects efficiently with Jira Clone.
          </Paragraph>
          <Button 
            size="large" 
            shape="round"
            style={{ 
              padding: '0 40px',
              height: 50,
              fontWeight: 500,
              background: '#fff',
              color: '#1677ff',
              fontSize: 16
            }}
            onClick={() => navigate('/register')}
          >
            Sign Up Free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;