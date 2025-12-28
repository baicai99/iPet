import React from 'react';
import { Card, Typography, Statistic, Row, Col } from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    HeartOutlined,
    FileTextOutlined,
    RiseOutlined,
    EyeOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

/**
 * 仪表盘页面 - 临时占位
 * @description 由 Agent-5 实现完整功能
 */
const DashboardPage: React.FC = () => {
    return (
        <div>
            <Title level={4} style={{ marginBottom: 24 }}>仪表盘</Title>

            <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="用户总量"
                            value={1234}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="活跃用户"
                            value={567}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="健康记录"
                            value={8901}
                            prefix={<HeartOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="文章总量"
                            value={123}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="今日新增"
                            value={45}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>

                <Col xs={12} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="总浏览量"
                            value={56789}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 24 }}>
                <Title level={5}>📊 趋势图表区域</Title>
                <div style={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                    borderRadius: 8,
                }}>
                    <Typography.Text type="secondary">
                        📈 由 Agent-5 实现用户增长、健康记录趋势图
                    </Typography.Text>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
