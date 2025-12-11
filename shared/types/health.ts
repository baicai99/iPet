export interface HealthRecord {
    id: string;
    updatedAt: number;
    deleted?: boolean;
    petId: string;
    type: string;
    value: number;
    unit: string;
    date: string;
    notes?: string | null;
    source?: string | null;
    status?: 'pending' | 'synced' | 'failed' | null;
    label?: string | null;
    emoji?: string | null;
    gridValue?: number | null;
    metadata?: Record<string, any>;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}
