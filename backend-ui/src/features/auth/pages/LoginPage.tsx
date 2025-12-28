import React from 'react';
import { Layout, Card, Typography, Grid } from 'antd';
import { LoginForm } from '../components/LoginForm';

// Note: In a real app we might use useNavigate from react-router-dom here
// but the prop is passed down or hook used inside the form/page.
// For now, we will simulate navigation or just log.
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const LoginPage: React.FC = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();

    const handleSuccess = () => {
        // Navigate to dashboard
        navigate('/dashboard');
    };

    // Responsive Styles
    const isMobile = !screens.md; // xs or sm

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: isMobile ? '20px' : '0',
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    };

    return (
        <Layout>
            <Content style={containerStyle}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Card style={cardStyle} bordered={false}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <img src="/vite.svg" alt="Logo" style={{ height: 40, marginBottom: 16 }} />
                            <Title level={3}>iPet Admin</Title>
                            <div style={{ color: '#666' }}>Sign in to your account</div>
                        </div>
                        <LoginForm onSuccess={handleSuccess} />
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default LoginPage;
