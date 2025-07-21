import React, { useEffect, useState, useContext } from 'react';
import { Modal, Input, Card, Typography, Button, Spin, message } from 'antd';
import { ProjectContext } from '../context/ProjectContext';

const { Title, Paragraph } = Typography;

export default function ProjectSearchModal({ visible, onClose }) {
  const { selectedProject, projectMembers, currentUser } = useContext(ProjectContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [requesting, setRequesting] = useState({}); // { [projectId]: boolean }
  const [requested, setRequested] = useState({}); // { [projectId]: true }
  const [memberOf, setMemberOf] = useState({}); // { [projectId]: true }

  useEffect(() => {
    if (visible) fetchProjects();
  }, [visible]);

  const fetchProjects = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/all-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        // Optionally, fetch join requests/invitations to update button state
      }
    } catch {}
    setLoading(false);
  };

  const handleRequest = async (projectId) => {
    setRequesting(r => ({ ...r, [projectId]: true }));
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/join-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRequested(r => ({ ...r, [projectId]: true }));
        message.success('Join request sent!');
      } else {
        message.error(data.error || 'Failed to send join request');
      }
    } catch {
      message.error('Network error');
    }
    setRequesting(r => ({ ...r, [projectId]: false }));
  };

  // Optionally, you could fetch user's pending requests and memberships to set requested/memberOf

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal
      title="Search Projects"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Input.Search
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 24 }}
      />
      {loading ? <Spin /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filtered.map(project => {
            const isMember = projectMembers.some(m => m.project_id === project.id && m.user_id === currentUser?.id);
            return (
              <Card key={project.id} title={project.name}>
                <Paragraph type="secondary">{project.description || 'No description'}</Paragraph>
                <Button
                  type="primary"
                  disabled={isMember || requested[project.id]}
                  loading={requesting[project.id]}
                  onClick={() => handleRequest(project.id)}
                  style={{ marginTop: 12 }}
                >
                  {isMember ? 'Already a Member' : requested[project.id] ? 'Request Pending' : 'Request to Join'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </Modal>
  );
} 