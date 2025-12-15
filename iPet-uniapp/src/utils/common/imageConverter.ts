/**
 * 图片格式转换工具
 * 用于将图片压缩以降低文件体积
 */

/**
 * 将图片压缩并转换为更小的体积
 * 使用 uni.compressImage API，这是跨平台最稳定的方案
 * @param tempFilePath - 临时文件路径（例如裁剪后的图片）
 * @param quality - 压缩质量 (0-100)，默认 80
 * @returns 压缩后的临时文件路径
 */
export async function convertToWebPSimple(
    tempFilePath: string,
    quality: number = 80
): Promise<string> {
    if (!tempFilePath) {
        throw new Error('tempFilePath is required');
    }

    try {
        // uni.compressImage 会智能压缩图片
        // 在支持的平台上可能输出 WebP，否则输出压缩的 JPG
        const result = await new Promise<{ tempFilePath: string }>((resolve, reject) => {
            uni.compressImage({
                src: tempFilePath,
                quality: Math.max(0, Math.min(100, quality)),
                success: (res) => resolve(res),
                fail: reject
            });
        });

        console.log('[ImageConverter] Image compression successful:', {
            original: tempFilePath,
            compressed: result.tempFilePath,
            quality
        });

        return result.tempFilePath;

    } catch (error) {
        console.error('[ImageConverter] Image compression failed, using original file:', error);
        // 压缩失败时，返回原文件路径
        return tempFilePath;
    }
}
