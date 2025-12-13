#!/bin/bash

# 压缩图片脚本 - 将所有图片压缩到20KB以下
# 使用sips工具进行压缩

TARGET_DIR="/Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/static/images/articles"
MAX_SIZE_KB=100
MAX_SIZE_BYTES=$((MAX_SIZE_KB * 1024))

cd "$TARGET_DIR" || exit 1

echo "开始压缩图片..."
echo "目标大小: ${MAX_SIZE_KB}KB"
echo "===================================="

for img in *.png; do
    if [ -f "$img" ]; then
        original_size=$(stat -f%z "$img")
        echo ""
        echo "处理: $img"
        echo "原始大小: $((original_size / 1024))KB"
        
        # 备份原文件
        cp "$img" "${img}.backup"
        
        # 从较低的质量开始，逐步调整
        # 先尝试缩小尺寸到原来的20%
        width=$(sips -g pixelWidth "$img" | tail -n1 | awk '{print $2}')
        new_width=$((width / 5))
        
        # 第一次尝试：缩小到20%
        sips -Z $new_width "$img" --out "$img.tmp" > /dev/null 2>&1
        mv "$img.tmp" "$img"
        
        current_size=$(stat -f%z "$img")
        
        # 如果还是太大，继续缩小
        while [ $current_size -gt $MAX_SIZE_BYTES ] && [ $new_width -gt 50 ]; do
            new_width=$((new_width * 80 / 100))  # 每次减少20%
            sips -Z $new_width "$img" --out "$img.tmp" > /dev/null 2>&1
            mv "$img.tmp" "$img"
            current_size=$(stat -f%z "$img")
        done
        
        final_size=$(stat -f%z "$img")
        echo "压缩后大小: $((final_size / 1024))KB"
        echo "压缩比: $((100 - final_size * 100 / original_size))%"
        
        if [ $final_size -le $MAX_SIZE_BYTES ]; then
            echo "✓ 成功压缩到 ${MAX_SIZE_KB}KB 以下"
            # 删除备份
            rm "${img}.backup"
        else
            echo "✗ 警告: 仍然超过 ${MAX_SIZE_KB}KB"
            # 如果失败，可以选择恢复备份或继续使用压缩版本
            # 这里我们继续使用压缩版本
            rm "${img}.backup"
        fi
    fi
done

echo ""
echo "===================================="
echo "压缩完成！"
echo ""
echo "所有文件大小："
ls -lh *.png | awk '{print $9, $5}'
