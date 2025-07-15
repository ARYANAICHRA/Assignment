import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

function Footer() {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#fff', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
      <Text type="secondary">&copy; 2025 Jira Clone. All rights reserved.</Text>
    </AntFooter>
  );
}

export default Footer;
