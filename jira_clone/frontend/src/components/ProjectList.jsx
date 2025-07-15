import React from 'react';
import { List, Card } from 'antd';

function ProjectList({ projects, onSelect }) {
  return (
    <List
      grid={{ gutter: 16, column: 3 }}
      dataSource={projects}
      renderItem={project => (
        <List.Item>
          <Card hoverable onClick={() => onSelect && onSelect(project)}>
            <Card.Meta title={project.name} description={project.description} />
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: 'No projects found.' }}
    />
  );
}

export default ProjectList; 