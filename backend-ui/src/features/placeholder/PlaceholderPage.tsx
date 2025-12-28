import React from 'react';
import { Card, Typography } from 'antd';

interface PlaceholderPageProps {
    title?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => (
    <Card style={{ margin: 24 }}>
        <Typography.Title level={4}>{title || 'Work in Progress'}</Typography.Title>
        <Typography.Paragraph>This feature is currently under development.</Typography.Paragraph>
    </Card>
);

export default PlaceholderPage;
