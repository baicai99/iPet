import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Table, Grid, Drawer, Dropdown, Button, Descriptions } from 'antd';
import { MoreOutlined, EyeOutlined } from '@ant-design/icons';
import type { DataTableProps, ColumnType } from './types';
import type { TablePaginationConfig } from 'antd';
import { useContainerHeight } from '@/shared/hooks';

const { useBreakpoint } = Grid;

// 抽屉内容组件 - memo 化防止不必要渲染
interface DrawerContentProps<T extends Record<string, unknown>> {
    record: T;
    columns: ColumnType<T>[];
}

const DrawerContent = <T extends Record<string, unknown>>({
    record,
    columns,
}: DrawerContentProps<T>) => {
    const items = useMemo(
        () =>
            columns.map((col, index) => ({
                key: (col.key as string) || (col.dataIndex as string) || `col-${index}`,
                label: col.title as React.ReactNode,
                children: col.render
                    ? col.render(record[col.dataIndex as keyof T], record, 0)
                    : (record[col.dataIndex as keyof T] as React.ReactNode),
            })),
        [record, columns]
    );

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

// memo 化组件，保留泛型类型
const MemoizedDrawerContent = React.memo(DrawerContent) as typeof DrawerContent;

export const DataTable = <T extends Record<string, unknown>>({
    columns,
    disableMobileMore = false,
    enableDrawerDetails = true,
    drawerContent,
    rowKey = 'id',
    onRow,
    size,
    ...tableProps
}: DataTableProps<T>) => {
    const screens = useBreakpoint();
    const isMobile = !screens.sm; // xs
    const tableRef = useRef<HTMLDivElement>(null);

    // State for detail drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<T | null>(null);

    // 动态计算表格高度
    const containerHeight = useContainerHeight(tableRef, {
        minHeight: 300,
        maxHeight: 800,
        bottomOffset: 120,
    });

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
        if (!isMobile || disableMobileMore || !enableDrawerDetails) return responsiveColumns;

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
    }, [responsiveColumns, isMobile, disableMobileMore, enableDrawerDetails, handleViewDetails]);



    // 智能虚拟化配置
    const virtualConfig = useMemo(() => {
        const dataSource = tableProps.dataSource || [];

        // 动态阈值
        const baseThreshold = isMobile ? 20 : 50;
        const estimatedRowHeight = 50;
        const visibleRows = containerHeight ? Math.floor(containerHeight / estimatedRowHeight) : 10;
        const dynamicThreshold = Math.ceil(visibleRows * 1.5);
        const threshold = Math.max(baseThreshold, dynamicThreshold);

        // 小数据量：不启用虚拟化
        if (dataSource.length < threshold) {
            return {
                scroll: { x: 'max-content' },
                virtual: false,
            };
        }

        // 大数据量：启用虚拟化
        return {
            scroll: {
                y: containerHeight || 500,
                x: 'max-content',
            },
            virtual: true,
        };
    }, [tableProps.dataSource, isMobile, containerHeight]);

    const mergedPagination: TablePaginationConfig | false | undefined =
        tableProps.pagination === false || tableProps.pagination == null
            ? tableProps.pagination
            : {
                placement: ['bottomCenter'] as TablePaginationConfig['placement'],
                showQuickJumper: true,
                ...tableProps.pagination,
            };

    const tableSize = size ?? (isMobile ? 'small' : 'middle');

    return (
        <div ref={tableRef}>
            <Table<T>
                columns={finalColumns}
                rowKey={rowKey}
                {...virtualConfig}
                size={tableSize}
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

            {enableDrawerDetails && (
                <Drawer
                    title="详细信息"
                    placement="bottom"
                    size="large"
                    onClose={() => setDrawerOpen(false)}
                    open={drawerOpen}
                >
                    {currentRow &&
                        (drawerContent ? (
                            drawerContent(currentRow)
                        ) : (
                            <MemoizedDrawerContent record={currentRow} columns={columns} />
                        ))}
                </Drawer>
            )}
        </div>
    );
};
