import { Injectable } from '@nestjs/common';

@Injectable()
export class InsightService {
    getTrendInsight(key: string, direction: string) {
        // Placeholder logic
        const insights: Record<string, string> = {
            up: '呈上升趋势',
            down: '呈下降趋势',
            stable: '保持稳定',
            flat: '保持稳定'
        };
        return {
            suggestion: insights[direction] || '暂无建议'
        };
    }

    getInsight(key: string) {
        return {
            title: '健康贴士',
            content: '保持良好的生活习惯对宠物的健康至关重要。'
        };
    }
}
