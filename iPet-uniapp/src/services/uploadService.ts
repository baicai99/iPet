import { APP_CONFIG } from '@/utils/config';
import { getAccessToken } from '@/utils/business/authStorage';

const BASE_URL = APP_CONFIG.API_BASE_URL;

const resolveUploadUrl = (type: string = 'common', customUrl?: string) => {
    if (customUrl) return customUrl;
    // Return the upload endpoint with type
    return `${BASE_URL}/uploads/${type}`;
}

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
                            const data = typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data;
                            const url = data?.url || data?.data?.url || data?.data?.path;
                            if (!url) {
                                throw new Error('Upload succeeded but no URL returned');
                            }
                            resolve(url);
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
    }
}
