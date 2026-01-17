/**
 * Auth request DTOs aligned with iPet-BackEnd.
 */
export interface CreateUserDto {
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface UpgradeDto {
    email: string;
    password: string;
}

export interface GuestSessionRequestDto {
    deviceId?: string;
    origin?: string;
}
