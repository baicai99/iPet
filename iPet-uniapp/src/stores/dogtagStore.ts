/**
 * Dog Tag Store - 防走失狗牌状态管理
 * 
 * 使用 Options Store 写法（与 petStore 保持一致）
 * 职责：
 * - 管理狗牌列表与详情
 * - 管理线索列表与详情
 * - 提供 getters 给 UI 层
 */

import { defineStore } from 'pinia'
import { dogtagService } from '@/services/dogtagService'
import type {
    DogTag,
    DogTagStatus,
    DogTagListQuery,
    CreateDogTagDto,
    ClueEvent,
    ClueListQuery,
    ClueStatus,
    ReportClueDto
} from '@/types/dogtag'

// ============================================================================
// Types
// ============================================================================

interface DogTagState {
    /** 狗牌列表 */
    dogTags: DogTag[]
    /** 当前选中的狗牌ID */
    selectedTagId: string | null
    /** 线索列表 */
    clues: ClueEvent[]
    /** 当前选中的线索ID */
    selectedClueId: string | null
    /** 加载状态 */
    loading: boolean
    /** 错误信息 */
    error: string | null
    /** 上次刷新时间 */
    lastFetchedAt: number | null
}

// ============================================================================
// Store Definition
// ============================================================================

export const useDogTagStore = defineStore('dogtag', {
    state: (): DogTagState => ({
        dogTags: [],
        selectedTagId: null,
        clues: [],
        selectedClueId: null,
        loading: false,
        error: null,
        lastFetchedAt: null
    }),

    getters: {
        /**
         * 按状态分组的狗牌
         */
        dogTagsByStatus(state): Record<DogTagStatus, DogTag[]> {
            const result: Record<DogTagStatus, DogTag[]> = {
                active: [],
                paused: [],
                revoked: []
            }
            state.dogTags.forEach(tag => {
                result[tag.status].push(tag)
            })
            return result
        },

        /**
         * 生效中的狗牌列表
         */
        activeDogTags(state): DogTag[] {
            return state.dogTags.filter(tag => tag.status === 'active')
        },

        /**
         * 当前选中的狗牌
         */
        currentDogTag(state): DogTag | undefined {
            if (!state.selectedTagId) return undefined
            return state.dogTags.find(tag => tag.id === state.selectedTagId)
        },

        /**
         * 当前选中的线索
         */
        currentClue(state): ClueEvent | undefined {
            if (!state.selectedClueId) return undefined
            return state.clues.find(clue => clue.id === state.selectedClueId)
        },

        /**
         * 未读线索数量
         */
        unreadClueCount(state): number {
            return state.clues.filter(clue => clue.status === 'new').length
        },

        /**
         * 仅线索类型（排除扫码事件）
         */
        cluesOnly(state): ClueEvent[] {
            return state.clues.filter(clue => clue.type === 'clue')
        },

        /**
         * 仅扫码事件
         */
        scansOnly(state): ClueEvent[] {
            return state.clues.filter(clue => clue.type === 'scan')
        },

        /**
         * 按狗牌ID获取线索
         */
        getCluesByTagId: (state) => (tagId: string): ClueEvent[] => {
            return state.clues.filter(clue => clue.tagId === tagId)
        },

        /**
         * 按宠物ID获取狗牌
         */
        getDogTagsByPetId: (state) => (petId: string): DogTag[] => {
            return state.dogTags.filter(tag => tag.petId === petId)
        }
    },

    actions: {
        // =====================================================================
        // Dog Tag Actions
        // =====================================================================

        /**
         * 获取狗牌列表
         */
        async fetchDogTags(query?: DogTagListQuery) {
            this.loading = true
            this.error = null
            try {
                const response = await dogtagService.getDogTags(query)
                this.dogTags = response.items
                this.lastFetchedAt = Date.now()
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch dog tags'
                this.error = message
                console.error('[DogTagStore] fetchDogTags error:', err)
            } finally {
                this.loading = false
            }
        },

        /**
         * 生成新狗牌
         */
        async createDogTag(data: CreateDogTagDto): Promise<DogTag | null> {
            this.loading = true
            this.error = null
            try {
                const newTag = await dogtagService.generateDogTag(data)
                this.dogTags.unshift(newTag)
                return newTag
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to create dog tag'
                this.error = message
                console.error('[DogTagStore] createDogTag error:', err)
                throw err
            } finally {
                this.loading = false
            }
        },

        /**
         * 获取狗牌详情
         */
        async fetchDogTagDetail(tagId: string): Promise<DogTag | null> {
            this.loading = true
            this.error = null
            try {
                const tag = await dogtagService.getDogTagDetail(tagId)
                // 更新本地缓存
                const index = this.dogTags.findIndex(t => t.id === tagId)
                if (index !== -1) {
                    this.dogTags[index] = tag
                } else {
                    this.dogTags.push(tag)
                }
                this.selectedTagId = tagId
                return tag
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch dog tag detail'
                this.error = message
                console.error('[DogTagStore] fetchDogTagDetail error:', err)
                return null
            } finally {
                this.loading = false
            }
        },

        /**
         * 更新狗牌状态（暂停/恢复）
         */
        async updateDogTagStatus(tagId: string, status: 'active' | 'paused'): Promise<boolean> {
            this.loading = true
            this.error = null
            try {
                const updatedTag = await dogtagService.updateDogTagStatus(tagId, { status })
                const index = this.dogTags.findIndex(t => t.id === tagId)
                if (index !== -1) {
                    this.dogTags[index] = updatedTag
                }
                return true
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to update dog tag status'
                this.error = message
                console.error('[DogTagStore] updateDogTagStatus error:', err)
                return false
            } finally {
                this.loading = false
            }
        },

        /**
         * 作废狗牌（不可恢复）
         */
        async revokeDogTag(tagId: string): Promise<boolean> {
            this.loading = true
            this.error = null
            try {
                const updatedTag = await dogtagService.revokeDogTag(tagId)
                const index = this.dogTags.findIndex(t => t.id === tagId)
                if (index !== -1) {
                    this.dogTags[index] = updatedTag
                }
                return true
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to revoke dog tag'
                this.error = message
                console.error('[DogTagStore] revokeDogTag error:', err)
                return false
            } finally {
                this.loading = false
            }
        },

        /**
         * 选中狗牌
         */
        selectDogTag(tagId: string | null) {
            this.selectedTagId = tagId
        },

        // =====================================================================
        // Clue Actions
        // =====================================================================

        /**
         * 获取线索列表
         */
        async fetchClues(query?: ClueListQuery) {
            this.loading = true
            this.error = null
            try {
                const response = await dogtagService.getClues(query)
                this.clues = response.items
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch clues'
                this.error = message
                console.error('[DogTagStore] fetchClues error:', err)
            } finally {
                this.loading = false
            }
        },

        /**
         * 获取线索详情
         */
        async fetchClueDetail(clueId: string): Promise<ClueEvent | null> {
            this.loading = true
            this.error = null
            try {
                const clue = await dogtagService.getClueDetail(clueId)
                // 更新本地缓存
                const index = this.clues.findIndex(c => c.id === clueId)
                if (index !== -1) {
                    this.clues[index] = clue
                } else {
                    this.clues.push(clue)
                }
                this.selectedClueId = clueId
                // 自动标记为已查看
                if (clue.status === 'new') {
                    this.updateClueStatus(clueId, 'viewed')
                }
                return clue
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch clue detail'
                this.error = message
                console.error('[DogTagStore] fetchClueDetail error:', err)
                return null
            } finally {
                this.loading = false
            }
        },

        /**
         * 更新线索状态
         */
        async updateClueStatus(clueId: string, status: ClueStatus): Promise<boolean> {
            try {
                const updatedClue = await dogtagService.updateClueStatus(clueId, status)
                const index = this.clues.findIndex(c => c.id === clueId)
                if (index !== -1) {
                    this.clues[index] = updatedClue
                }
                return true
            } catch (err: unknown) {
                console.error('[DogTagStore] updateClueStatus error:', err)
                return false
            }
        },

        /**
         * 标记线索为已解决
         */
        async resolveClue(clueId: string): Promise<boolean> {
            return this.updateClueStatus(clueId, 'resolved')
        },

        /**
         * 举报线索
         */
        async reportClue(clueId: string, data: ReportClueDto): Promise<boolean> {
            this.loading = true
            this.error = null
            try {
                await dogtagService.reportClue(clueId, data)
                // 更新本地状态
                const index = this.clues.findIndex(c => c.id === clueId)
                if (index !== -1) {
                    this.clues[index].status = 'spam'
                }
                return true
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to report clue'
                this.error = message
                console.error('[DogTagStore] reportClue error:', err)
                return false
            } finally {
                this.loading = false
            }
        },

        /**
         * 选中线索
         */
        selectClue(clueId: string | null) {
            this.selectedClueId = clueId
        },

        // =====================================================================
        // Utility Actions
        // =====================================================================

        /**
         * 清空所有数据
         */
        reset() {
            this.dogTags = []
            this.selectedTagId = null
            this.clues = []
            this.selectedClueId = null
            this.loading = false
            this.error = null
            this.lastFetchedAt = null
        }
    },

    persist: {
        paths: ['dogTags', 'selectedTagId']
    } as any
})
