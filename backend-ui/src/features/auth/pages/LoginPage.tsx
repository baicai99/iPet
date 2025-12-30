import React, { useEffect } from 'react';
import { Layout, Card, Typography, Grid } from 'antd';
import { LoginForm } from '../components/LoginForm';

// Note: In a real app we might use useNavigate from react-router-dom here
// but the prop is passed down or hook used inside the form/page.
// For now, we will simulate navigation or just log.
import { useNavigate, useParams } from 'react-router-dom';
import { refreshInitState, useInitState } from '@/core/init';
import { SKIP_INIT } from '@/core/config';

const { Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const LoginPage: React.FC = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const { entryPath } = useParams();
    const initState = useInitState();

    useEffect(() => {
        if (!SKIP_INIT) {
            refreshInitState();
        }
    }, []);

    useEffect(() => {
        if (SKIP_INIT) return;
        if (initState.loading) return;
        if (!initState.isInitialized) {
            navigate('/init', { replace: true });
        }
    }, [initState.loading, initState.isInitialized, navigate]);

    const handleSuccess = () => {
        // Navigate to dashboard
        const targetEntryPath = entryPath ?? initState.entryPath;
        if (targetEntryPath) {
            navigate(`/${targetEntryPath}/dashboard`, { replace: true });
            return;
        }
        navigate('/', { replace: true });
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
                    <Card style={cardStyle} variant="borderless">
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <img src="/vite.svg" alt="Logo" style={{ height: 40, marginBottom: 16 }} />
                            <Title level={3}>iPet 管理后台</Title>
                            <div style={{ color: '#666' }}>请使用管理员账号登录</div>
                        </div>
                        <LoginForm onSuccess={handleSuccess} />
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default LoginPage;
