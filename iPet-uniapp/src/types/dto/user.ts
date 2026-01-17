/**
 * User request DTOs aligned with iPet-BackEnd.
 */
export interface UpdateUserProfileDto {
    displayName?: string;
    avatar?: string | null;
    bio?: string;
    mbti?: string;
    tags?: string[];
}

export interface VerifyIdentityDto {
    realName: string;
    idCard: string;
}

export interface UpdateSettingsDto {
    settings: any;
}
