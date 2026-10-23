/**
 * DogTagService - 防走失狗牌 API 服务
 * 
 * 职责：
 * - 封装狗牌相关 API 调用
 * - 封装线索相关 API 调用
 * - Mock 数据支持（开发阶段）
 * 
 * API 前缀: /dogtags, /clues
 */

import request from '@/utils/common/request'
import type {
    DogTag,
    DogTagStatus,
    DogTagListQuery,
    CreateDogTagDto,
    UpdateDogTagStatusDto,
    ClueEvent,
    ClueListQuery,
    ClueStatus,
    ReportClueDto,
    DogTagPublicInfo,
    PaginatedResponse
} from '@/types/dogtag'

// ============================================================================
// Mock Data (开发阶段使用)
// ============================================================================

const MOCK_ENABLED = import.meta.env.VITE_MOCK === 'true'

const mockDogTags: DogTag[] = [
    {
        id: 'tag_001',
        petId: 'pet_001',
        name: '小黄的狗牌 #1',
        status: 'active',
        webUrl: 'https://ipet.zhengjiyuan.top/finddog-h5?tag=tag_001',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
        lastScannedAt: '2026-01-16T14:30:00Z',
        scanCount: 5,
        clueCount: 2
    },
    {
        id: 'tag_002',
        petId: 'pet_001',
        name: '小黄的狗牌 #2',
        status: 'paused',
        webUrl: 'https://ipet.zhengjiyuan.top/finddog-h5?tag=tag_002',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-14T16:00:00Z',
        lastScannedAt: null,
        scanCount: 0,
        clueCount: 0
    }
]

const mockClues: ClueEvent[] = [
    {
        id: 'clue_001',
        tagId: 'tag_001',
        type: 'clue',
        status: 'new',
        createdAt: '2026-01-16T14:30:00Z',
        location: '朝阳区望京SOHO T1',
        longitude: 116.4833,
        latitude: 39.9961,
        notes: '在楼下看到了，好像有点害怕，躲在花坛后面',
        photos: [],
        finderAction: 'seen'
    },
    {
        id: 'clue_002',
        tagId: 'tag_001',
        type: 'clue',
        status: 'viewed',
        createdAt: '2026-01-16T12:00:00Z',
        location: '望京西园三区门口',
        notes: '已经控制住了，在我这里',
        photos: [],
        finderAction: 'controlled'
    },
    {
        id: 'clue_003',
        tagId: 'tag_001',
        type: 'scan',
        status: 'viewed',
        createdAt: '2026-01-16T10:00:00Z',
        deviceInfo: 'iPhone 15 Pro'
    }
]

// ============================================================================
// Helper Functions
// ============================================================================

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// ============================================================================
// Dog Tag API
// ============================================================================

/**
 * 生成新狗牌
 */
async function generateDogTag(data: CreateDogTagDto): Promise<DogTag> {
    if (MOCK_ENABLED) {
        await delay(500)
        const newTag: DogTag = {
            id: generateId('tag'),
            petId: data.petId,
            name: data.name || `狗牌 #${mockDogTags.length + 1}`,
            status: 'active',
            webUrl: `https://ipet.zhengjiyuan.top/finddog-h5?tag=${generateId('tag')}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastScannedAt: null,
            scanCount: 0,
            clueCount: 0
        }
        mockDogTags.push(newTag)
        return newTag
    }

    return request({
        url: '/dogtags',
        method: 'POST',
        data
    })
}

/**
 * 获取狗牌列表
 */
async function getDogTags(query?: DogTagListQuery): Promise<PaginatedResponse<DogTag>> {
    if (MOCK_ENABLED) {
        await delay(300)
        let filtered = [...mockDogTags]
        if (query?.petId) {
            filtered = filtered.filter(t => t.petId === query.petId)
        }
        if (query?.status) {
            filtered = filtered.filter(t => t.status === query.status)
        }
        return {
            items: filtered,
            total: filtered.length,
            page: query?.page || 1,
            pageSize: query?.pageSize || 20,
            hasMore: false
        }
    }

    return request({
        url: '/dogtags',
        method: 'GET',
        data: query
    })
}

/**
 * 获取狗牌详情
 */
async function getDogTagDetail(tagId: string): Promise<DogTag> {
    if (MOCK_ENABLED) {
        await delay(200)
        const tag = mockDogTags.find(t => t.id === tagId)
        if (!tag) throw new Error('Dog tag not found')
        return tag
    }

    return request({
        url: `/dogtags/${tagId}`,
        method: 'GET'
    })
}

/**
 * 更新狗牌状态（暂停/恢复）
 */
async function updateDogTagStatus(tagId: string, data: UpdateDogTagStatusDto): Promise<DogTag> {
    if (MOCK_ENABLED) {
        await delay(300)
        const tag = mockDogTags.find(t => t.id === tagId)
        if (!tag) throw new Error('Dog tag not found')
        tag.status = data.status
        tag.updatedAt = new Date().toISOString()
        return tag
    }

    return request({
        url: `/dogtags/${tagId}/status`,
        method: 'PATCH' as any,
        data
    })
}

/**
 * 作废狗牌（不可恢复）
 */
async function revokeDogTag(tagId: string): Promise<DogTag> {
    if (MOCK_ENABLED) {
        await delay(300)
        const tag = mockDogTags.find(t => t.id === tagId)
        if (!tag) throw new Error('Dog tag not found')
        tag.status = 'revoked'
        tag.updatedAt = new Date().toISOString()
        return tag
    }

    return request({
        url: `/dogtags/${tagId}/revoke`,
        method: 'POST'
    })
}

// ============================================================================
// Clue API
// ============================================================================

/**
 * 获取线索/事件列表
 */
async function getClues(query?: ClueListQuery): Promise<PaginatedResponse<ClueEvent>> {
    if (MOCK_ENABLED) {
        await delay(300)
        let filtered = [...mockClues]
        if (query?.tagId) {
            filtered = filtered.filter(c => c.tagId === query.tagId)
        }
        if (query?.type) {
            filtered = filtered.filter(c => c.type === query.type)
        }
        if (query?.status) {
            filtered = filtered.filter(c => c.status === query.status)
        }
        // Sort by createdAt desc
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return {
            items: filtered,
            total: filtered.length,
            page: query?.page || 1,
            pageSize: query?.pageSize || 20,
            hasMore: false
        }
    }

    return request({
        url: '/clues',
        method: 'GET',
        data: query
    })
}

/**
 * 获取线索详情
 */
async function getClueDetail(clueId: string): Promise<ClueEvent> {
    if (MOCK_ENABLED) {
        await delay(200)
        const clue = mockClues.find(c => c.id === clueId)
        if (!clue) throw new Error('Clue not found')
        return clue
    }

    return request({
        url: `/clues/${clueId}`,
        method: 'GET'
    })
}

/**
 * 更新线索状态
 */
async function updateClueStatus(clueId: string, status: ClueStatus): Promise<ClueEvent> {
    if (MOCK_ENABLED) {
        await delay(300)
        const clue = mockClues.find(c => c.id === clueId)
        if (!clue) throw new Error('Clue not found')
        clue.status = status
        return clue
    }

    return request({
        url: `/clues/${clueId}/status`,
        method: 'PATCH' as any,
        data: { status }
    })
}

/**
 * 举报线索
 */
async function reportClue(clueId: string, data: ReportClueDto): Promise<void> {
    if (MOCK_ENABLED) {
        await delay(300)
        const clue = mockClues.find(c => c.id === clueId)
        if (!clue) throw new Error('Clue not found')
        clue.status = 'spam'
        return
    }

    return request({
        url: `/clues/${clueId}/report`,
        method: 'POST',
        data
    })
}

// ============================================================================
// H5 Public API (无需登录)
// ============================================================================

/**
 * 获取狗牌公开信息（H5 落地页使用）
 */
async function getDogTagPublicInfo(tagId: string): Promise<DogTagPublicInfo> {
    if (MOCK_ENABLED) {
        await delay(200)
        const tag = mockDogTags.find(t => t.id === tagId)
        if (!tag) {
            return {
                status: 'revoked',
                pet: {
                    id: '',
                    name: '未知',
                    lostStatus: 'normal'
                }
            }
        }
        return {
            status: tag.status,
            pet: {
                id: tag.petId,
                name: '小黄',
                avatar: 'https://via.placeholder.com/200',
                breed: '金毛犬',
                features: '毛色金黄，体型中等，佩戴蓝色项圈',
                lostStatus: 'lost'
            },
            ownerHint: '主人会收到通知'
        }
    }

    return request({
        url: `/dogtags/${tagId}/public`,
        method: 'GET'
    })
}

// ============================================================================
// Export as service object
// ============================================================================

export const dogtagService = {
    // Dog Tag
    generateDogTag,
    getDogTags,
    getDogTagDetail,
    updateDogTagStatus,
    revokeDogTag,
    // Clue
    getClues,
    getClueDetail,
    updateClueStatus,
    reportClue,
    // H5 Public
    getDogTagPublicInfo
}

export default dogtagService
