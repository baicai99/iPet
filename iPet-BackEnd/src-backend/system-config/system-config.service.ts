import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemConfigService {
    getMetricConfig() {
        // In a real app, this might come from a DB or a dynamic config service (e.g. LaunchDarkly)
        // For now, we return overrides for the frontend metadata
        return {
            weight: {
                recommendation: '同体型犬只保持一个月内波动不超过 5% 较为理想。',
                trendInsights: {
                    up: '建议适当减少零食摄入，增加运动量。',
                    down: '体重下降，请关注进食情况。',
                    stable: '体重保持稳定，继续保持！'
                }
            },
            body_fat: {
                recommendation: '一般建议 15%–25%，视品种与年龄略有差异。',
            },
            walk_duration: {
                trendInsights: {
                    up: '运动量保持不错，继续加油！',
                    down: '最近运动量不足，周末带它去公园跑跑吧！',
                    stable: '运动量稳定，保持规律很重要。'
                }
            }
        };
    }
}
