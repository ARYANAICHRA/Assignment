import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

function Footer() {
  return (
    <AntFooter style={{
      textAlign: 'center',
      background: '#f8fafc',
      padding: '10px 0',
      fontSize: 14,
      color: '#888',
      boxShadow: '0 -2px 8px #f0f1f2',
      border: 'none',
      minHeight: 40
    }}>
      <Text type="secondary">&copy; 2025 Jira Clone. All rights reserved.</Text>
    </AntFooter>
  );
}

export default Footer;
