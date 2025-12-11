
export class CreateHealthScheduleDto {
    petId: string;
    type: string;
    date: Date;
    time?: string;
    repeat?: string;
    note?: string;
}
