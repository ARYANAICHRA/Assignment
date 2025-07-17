import { BugOutlined, RocketOutlined, ProfileOutlined, FlagOutlined } from '@ant-design/icons';
import React from 'react';

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'orange';
    case 'Critical': return 'volcano';
    default: return 'blue';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'done': return 'green';
    case 'inprogress': return 'orange';
    case 'inreview': return 'purple';
    default: return 'blue';
  }
};

export const getTypeIcon = (type) => {
  switch (type) {
    case 'bug': return <span className="bg-red-100 text-red-600 p-1 rounded"><BugOutlined /></span>;
    case 'epic': return <span className="bg-purple-100 text-purple-600 p-1 rounded"><RocketOutlined /></span>;
    case 'story': return <span className="bg-blue-100 text-blue-600 p-1 rounded"><ProfileOutlined /></span>;
    case 'task':
    default: return <span className="bg-yellow-100 text-yellow-600 p-1 rounded"><FlagOutlined /></span>;
  }
}; 