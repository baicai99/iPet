/**
 * Health request DTOs aligned with iPet-BackEnd.
 */
export interface CreateHealthRecordDto {
    petId: string;
    type: string;
    value: number;
    unit: string;
    date: string;
    notes?: string;
    source?: string;
    metadata?: Record<string, any>;
}

export type UpdateHealthRecordDto = Partial<CreateHealthRecordDto>;

export interface TogglePinDto {
    petId: string;
    metricKey: string;
    isPinned: boolean;
}

export interface CreateHealthScheduleDto {
    petId: string;
    type: string;
    date: Date | string;
    time?: string;
    repeat?: string;
    note?: string;
}
