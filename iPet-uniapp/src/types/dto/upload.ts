/**
 * Upload request DTOs aligned with iPet-BackEnd.
 */
export interface UploadBase64Dto {
    data: string;
    fileName?: string;
    mimeType?: string;
}
