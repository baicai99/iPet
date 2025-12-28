import type { TableProps, ColumnType as AntdColumnType } from 'antd/es/table';

export interface ColumnType<T = unknown> extends AntdColumnType<T> {
    // If true, this column is shown on mobile screens.
    // If false or undefined, it is hidden on mobile screens.
    primary?: boolean;
}

export interface DataTableProps<T = Record<string, unknown>> extends Omit<TableProps<T>, 'columns'> {
    columns: ColumnType<T>[];
    // If true, a "More" action is not automatically added on mobile.
    disableMobileMore?: boolean;
    // If true, clicking a row (or "More") opens a drawer with details.
    enableDrawerDetails?: boolean;
    // Custom render for the detail drawer content
    drawerContent?: (record: T) => React.ReactNode;
}
