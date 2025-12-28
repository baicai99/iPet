import React from 'react';
import { Card, Result, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const RecycleBinPage: React.FC = () => {
    return (
        <Card title="回收站">
            <Result
                icon={<DeleteOutlined />}
                title="回收站"
                subTitle="该功能用于超级管理员恢复软删除用户，接口尚未接入。"
                extra={<Button type="primary" disabled>恢复用户</Button>}
            />
        </Card>
    );
};

export default RecycleBinPage;
