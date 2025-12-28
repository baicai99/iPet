import React from 'react';
import { Space, Row, Col, Grid } from 'antd';

const { useBreakpoint } = Grid;

interface FilterBarProps {
    children: React.ReactNode;
    // actions (e.g. "Add User" button) to be displayed on the right
    actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, actions }) => {
    const screens = useBreakpoint();

    // Mobile: stack everything (xs)
    // Tablet/Desktop: inline (sm+)
    const isMobile = !screens.sm;

    return (
        <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} justify="space-between" align="middle">
                <Col xs={24} sm={24} md={16} lg={18}>
                    <Space direction={isMobile ? 'vertical' : 'horizontal'} wrap style={{ width: '100%' }}>
                        {children}
                    </Space>
                </Col>

                {actions && (
                    <Col xs={24} sm={24} md={8} lg={6} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <Space>{actions}</Space>
                    </Col>
                )}
            </Row>
        </div>
    );
};
