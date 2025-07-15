import React from 'react';
import { Card } from 'antd';

function ProjectCard({ project, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ marginBottom: 16 }}>
      <Card.Meta title={project.name} description={project.description} />
    </Card>
  );
}

export default ProjectCard; 