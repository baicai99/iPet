import React, { useState, useMemo, useCallback } from 'react';
import { Table, Grid, Drawer, Dropdown, Button, Descriptions } from 'antd';
import { MoreOutlined, EyeOutlined } from '@ant-design/icons';
import type { DataTableProps, ColumnType } from './types';
import type { TablePaginationConfig } from 'antd';

const { useBreakpoint } = Grid;

export const DataTable = <T extends Record<string, unknown>>({
    columns,
    disableMobileMore = false,
    enableDrawerDetails = true,
    drawerContent,
    rowKey = 'id',
    onRow,
    ...tableProps
}: DataTableProps<T>) => {
    const screens = useBreakpoint();
    const isMobile = !screens.sm; // xs

    // State for detail drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<T | null>(null);

    // Filter columns for mobile
    const responsiveColumns = useMemo(() => {
        if (!isMobile) return columns;

        const visibleColumns = columns.filter((col) => col.primary);

        // If no columns are marked primary, default to the first one to avoid empty table
        if (visibleColumns.length === 0 && columns.length > 0) {
            return [columns[0]];
        }

        return visibleColumns;
    }, [columns, isMobile]);

    // Handle viewing details
    const handleViewDetails = useCallback((record: T) => {
        setCurrentRow(record);
        setDrawerOpen(true);
    }, []);

    // Add "More" action column for mobile if enabled
    const finalColumns = useMemo(() => {
        if (!isMobile || disableMobileMore) return responsiveColumns;

        const actionColumn: ColumnType<T> = {
            title: '操作',
            key: 'mobile-actions',
            primary: true,
            width: 60,
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'view',
                                label: '查看详情',
                                icon: <EyeOutlined />,
                                onClick: () => handleViewDetails(record),
                            },
                        ],
                    }}
                    trigger={['click']}
                >
                    <Button type="text" icon={<MoreOutlined />} size="small" />
                </Dropdown>
            ),
        };

        return [...responsiveColumns, actionColumn];
    }, [responsiveColumns, isMobile, disableMobileMore, handleViewDetails]);

    // Default Drawer Content Generator
    const renderDefaultDrawerContent = (record: T) => {
        const items = columns.map((col) => ({
            key: col.key as string || col.dataIndex as string || Math.random().toString(),
            label: col.title as React.ReactNode,
            children: col.render
                ? col.render(record[col.dataIndex as keyof T], record, 0)
                : (record[col.dataIndex as keyof T] as React.ReactNode),
        }));

        return (
            <Descriptions column={1} layout="vertical" bordered size="small">
                {items.map((item) => (
                    <Descriptions.Item key={item.key} label={item.label}>
                        {item.children as React.ReactNode}
                    </Descriptions.Item>
                ))}
            </Descriptions>
        );
    };

    const mergedPagination: TablePaginationConfig | false | undefined =
        tableProps.pagination === false || tableProps.pagination == null
            ? tableProps.pagination
            : {
                position: ['bottomCenter'] as TablePaginationConfig['position'],
                showQuickJumper: true,
                ...tableProps.pagination,
            };

    return (
        <>
            <Table<T>
                columns={finalColumns}
                rowKey={rowKey}
                scroll={{ x: 'max-content' }}
                size={isMobile ? 'small' : 'middle'}
                onRow={(record, index) => {
                    const existingOnRow = onRow ? onRow(record, index) : {};
                    return {
                        ...existingOnRow,
                        onClick: isMobile && enableDrawerDetails && !disableMobileMore
                            ? (e) => {
                                // Prevent triggering if clicked on the action button itself (though action is separate column)
                                // Just in case we want row clicking to open drawer
                                existingOnRow.onClick?.(e);
                            }
                            : existingOnRow.onClick,
                    };
                }}
                {...tableProps}
                pagination={mergedPagination}
            />

            <Drawer
                title="详细信息"
                placement="bottom"
                height="80vh"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                {currentRow && (
                    drawerContent ? drawerContent(currentRow) : renderDefaultDrawerContent(currentRow)
                )}
            </Drawer>
        </>
    );
};
