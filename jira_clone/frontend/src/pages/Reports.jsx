import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Table, Tag, List, Statistic, Row, Col, message } from 'antd';

const { Title, Paragraph } = Typography;

const statusColors = {
  done: 'green',
  inprogress: 'blue',
  inreview: 'orange',
  todo: 'default',
};

function Reports({ projectId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
    // eslint-disable-next-line
  }, [projectId]);

  // ✅ MOVED THIS HOOK TO THE TOP, BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (!projectId) return;
    // Only run this if the user has the correct permissions
    const myMemberInfo = members.find(m => m.user_id === user.id);
    const userRole = myMemberInfo?.role;
    if (user.email !== 'admin@example.com' && userRole !== 'Project Owner') {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/reports/project/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setReport(data.report);
        else message.error(data.error || 'Failed to fetch report');
      } catch {
        message.error('Failed to fetch report');
      }
      setLoading(false);
    };
    fetchReport();
    // eslint-disable-next-line
  }, [projectId, members]); // Added members dependency

  const fetchMembers = async () => {
    setMembersLoading(true);
    setMembersError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
      else setMembersError(data.error || 'Failed to fetch members');
    } catch (err) {
      setMembersError('Failed to fetch members');
    }
    setMembersLoading(false);
  };

  // Find the current user's project role
  const myMember = members.find(m => m.user_id === user.id);
  const myProjectRole = myMember?.role;

  // Debug log for report data
  console.log('Report data:', report);

  // Show loading or error for members fetch
  if (membersLoading) {
    return <Spin style={{ display: 'block', margin: '80px auto' }} tip="Loading members..." />;
  }
  if (membersError) {
    return <div style={{ padding: 32, color: '#ff4d4f' }}>{membersError}</div>;
  }
  if (!myProjectRole && user.email !== 'admin@example.com') {
    return <div style={{ padding: 32, color: '#faad14', fontWeight: 500 }}>You are not a member of this project.</div>;
  }
  // Allow admin and project owner
  if (user.email !== 'admin@example.com' && myProjectRole !== 'Project Owner') {
    return <div style={{ padding: 32, color: '#faad14', fontWeight: 500 }}>You do not have permission to view this report.<br/>Your role: <Tag>{myProjectRole}</Tag></div>;
  }

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!report) return <div style={{ padding: 32 }}>No report data found.</div>;

  return (
    <Card style={{ maxWidth: 1000, margin: '32px auto', minHeight: 600 }}>
      <Title level={2}>Project Report: {report.project.name}</Title>
      <Paragraph type="secondary">{report.project.description || 'No description provided.'}</Paragraph>
      <div style={{ marginBottom: 16 }}>
        <Tag color="blue">Your Role: {myProjectRole}</Tag>
      </div>
      <Row gutter={24} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}><Statistic title="Total Tasks" value={report.stats.total} /></Col>
        <Col xs={24} sm={12} md={6}><Statistic title="Done" value={report.stats.done} valueStyle={{ color: '#52c41a' }} /></Col>
        <Col xs={24} sm={12} md={6}><Statistic title="In Progress" value={report.stats.inprogress} valueStyle={{ color: '#1890ff' }} /></Col>
        <Col xs={24} sm={12} md={6}><Statistic title="To Do" value={report.stats.todo} valueStyle={{ color: '#888' }} /></Col>
      </Row>
      <Title level={4} style={{ marginTop: 24 }}>Members</Title>
      <List
        dataSource={report.members}
        renderItem={m => (
          <List.Item>
            <span style={{ fontWeight: 500 }}>{m.username || m.email}</span> <Tag>{m.role}</Tag>
          </List.Item>
        )}
        bordered
        style={{ marginBottom: 32 }}
      />
      <Title level={4}>Tasks</Title>
      <Table
        dataSource={report.tasks}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Title', dataIndex: 'title', key: 'title' },
          { title: 'Type', dataIndex: 'type', key: 'type' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusColors[s] || 'default'}>{s}</Tag> },
          { title: 'Assignee', dataIndex: 'assignee_id', key: 'assignee_id' },
          { title: 'Reporter', dataIndex: 'reporter_id', key: 'reporter_id' },
          { title: 'Due Date', dataIndex: 'due_date', key: 'due_date' },
        ]}
      />
    </Card>
  );
}

export default Reports;