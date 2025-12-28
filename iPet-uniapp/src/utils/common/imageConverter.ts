/**
 * 图片格式转换工具
 * 用于将图片压缩以降低文件体积
 */

/**
 * 将图片压缩为 JPEG 格式
 * 使用 uni.compressImage API，输出格式由平台决定；本方法强制校验为 JPG/JPEG
 * @param tempFilePath - 临时文件路径（例如裁剪后的图片）
 * @param quality - 压缩质量 (0-100)，默认 80
 * @returns 压缩后的临时文件路径（.jpg/.jpeg）
 */
export async function convertToJpegSimple(
    tempFilePath: string,
    quality: number = 80
): Promise<string> {
    if (!tempFilePath) {
        throw new Error('tempFilePath is required');
    }

    try {
        // uni.compressImage 会智能压缩图片，输出格式由平台决定
        const result = await new Promise<{ tempFilePath: string }>((resolve, reject) => {
            uni.compressImage({
                src: tempFilePath,
                quality: Math.max(0, Math.min(100, quality)),
                success: (res) => resolve(res),
                fail: reject
            });
        });

        if (!/\.jpe?g$/i.test(result.tempFilePath)) {
            throw new Error('Avatar image must be JPG/JPEG');
        }

        console.log('[ImageConverter] Image compression successful:', {
            original: tempFilePath,
            compressed: result.tempFilePath,
            quality
        });

        return result.tempFilePath;

    } catch (error) {
        console.error('[ImageConverter] Image compression failed:', error);
        throw error;
    }
}
