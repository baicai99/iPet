import { APP_CONFIG } from '@/utils/config';
import { getAccessToken } from '@/utils/business/authStorage';
import type { UploadBase64Dto } from '@/types/dto/upload';

const BASE_URL = APP_CONFIG.API_BASE_URL;

const resolveUploadUrl = (type: string = 'common', customUrl?: string) => {
    if (customUrl) return customUrl;
    return `${BASE_URL}/uploads/${type}`;
};

const shouldRetryWithBase64 = (error: any): boolean => {
    if (!error) return false;
    const message = (error.errMsg || error.message || '').toLowerCase();
    return message.includes('not in domain list');
};

const getFileNameFromPath = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts.pop() || 'file';
};

const guessMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'bmp':
            return 'image/bmp';
        default:
            return 'application/octet-stream';
    }
};

const canUseFileSystem = (): boolean => typeof uni.getFileSystemManager === 'function';

const readFileAsBase64 = (filePath: string): Promise<string> => {
    const fsManager = canUseFileSystem() ? uni.getFileSystemManager() : null;
    if (!fsManager) {
        return Promise.reject(new Error('File system manager is not available'));
    }

    return new Promise<string>((resolve, reject) => {
        fsManager.readFile({
            filePath,
            encoding: 'base64',
            success: (res: { data: string }) => resolve(res.data),
            fail: reject
        });
    });
};

export interface UploadImageOptions {
    url?: string;
    type?: string;
    name?: string;
    formData?: Record<string, any>;
    header?: Record<string, any>;
    onProgress?: (progressEvent: UniApp.OnProgressUpdateResult) => void;
}

export const uploadService = {
    async uploadImage(filePath: string, options: UploadImageOptions = {}): Promise<string> {
        if (!filePath) {
            throw new Error('filePath is required');
        }

        const uploadUrl = resolveUploadUrl(options.type, options.url);
        const token = getAccessToken();

        try {
            return await uploadViaNative(filePath, uploadUrl, options, token);
        } catch (error: any) {
            if (shouldRetryWithBase64(error) && canUseFileSystem()) {
                console.warn('[uploadService] uploadFile blocked by domain whitelist, using base64 fallback', error);
                return uploadViaBase64(filePath, uploadUrl, options, token);
            }
            throw error;
        }
    }
};

const parseUploadResponse = (response: any): string => {
    const data = typeof response.data === 'string' ? JSON.parse(response.data || '{}') : response.data;
    const url = data?.url || data?.data?.url || data?.data?.path;
    if (!url) {
        throw new Error('Upload succeeded but no URL returned');
    }
    return url;
};

const uploadViaNative = (
    filePath: string,
    uploadUrl: string,
    options: UploadImageOptions,
    token: string
): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const uploadTask = uni.uploadFile({
            url: uploadUrl,
            filePath,
            name: options.name || 'file',
            formData: options.formData,
            header: {
                ...options.header,
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(parseUploadResponse(res));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${res.statusCode}: ${res.data}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });

        if (options.onProgress && uploadTask?.onProgressUpdate) {
            uploadTask.onProgressUpdate(options.onProgress);
        }
    });
};

const uploadViaBase64 = async (
    filePath: string,
    uploadUrl: string,
    options: UploadImageOptions,
    token: string
): Promise<string> => {
    const fallbackUrl = `${uploadUrl}/base64`;
    const fileName = getFileNameFromPath(filePath);
    const payload: UploadBase64Dto = {
        data: await readFileAsBase64(filePath),
        fileName,
        mimeType: guessMimeType(fileName)
    };

    return new Promise<string>((resolve, reject) => {
        uni.request({
            url: fallbackUrl,
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                ...options.header,
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            data: payload,
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(parseUploadResponse(res));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${res.statusCode}: ${JSON.stringify(res.data)}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};
