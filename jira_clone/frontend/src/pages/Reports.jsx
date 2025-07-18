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

  useEffect(() => {
    if (!projectId) return;
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
  }, [projectId]);

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!report) return <div style={{ padding: 32 }}>No report data found.</div>;

  return (
    <Card style={{ maxWidth: 1000, margin: '32px auto', minHeight: 600 }}>
      <Title level={2}>Project Report: {report.project.name}</Title>
      <Paragraph type="secondary">{report.project.description || 'No description provided.'}</Paragraph>
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