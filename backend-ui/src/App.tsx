import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './core/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/query';
import { ErrorBoundary } from './core/errors';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <AuthProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <AppRouter />
              </BrowserRouter>
            </ErrorBoundary>
          </AuthProvider>
        </AntdApp>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
