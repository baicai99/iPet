/**
 * Dog Tag (防走失狗牌) related type definitions.
 * Based on PRD v0.9
 */

// ============================================================================
// Dog Tag Types
// ============================================================================

/**
 * Dog tag status
 * - active: 生效中，可正常扫码提交线索
 * - paused: 暂停，扫码显示"已停用"
 * - revoked: 作废，扫码显示"已作废"，不可恢复
 */
export type DogTagStatus = 'active' | 'paused' | 'revoked';

/**
 * Dog tag entity - 狗牌主体
 */
export interface DogTag {
    /** 狗牌唯一标识 */
    id: string;
    /** 关联宠物ID */
    petId: string;
    /** 狗牌名称（默认：宠物名 + 序号） */
    name: string;
    /** 狗牌状态 */
    status: DogTagStatus;
    /** 二维码图片URL（若后端生成） */
    qrCodeUrl?: string;
    /** 网页落地页URL */
    webUrl: string;
    /** 创建时间 (ISO 8601) */
    createdAt: string;
    /** 更新时间 (ISO 8601) */
    updatedAt: string;
    /** 最近扫码时间 (ISO 8601)，可能为空 */
    lastScannedAt?: string | null;
    /** 总扫码次数 */
    scanCount: number;
    /** 线索提交次数 */
    clueCount: number;
}

/**
 * Create dog tag request DTO
 */
export interface CreateDogTagDto {
    petId: string;
    name?: string; // 可选，不填则自动生成
}

/**
 * Update dog tag status request DTO
 */
export interface UpdateDogTagStatusDto {
    status: 'active' | 'paused'; // revoked 通过单独接口
}

// ============================================================================
// Clue/Event Types
// ============================================================================

/**
 * Clue event type
 * - scan: 仅扫码打开页面，弱通知
 * - clue: 提交了线索，强通知
 */
export type ClueEventType = 'scan' | 'clue';

/**
 * Clue status
 * - new: 新线索，未查看
 * - viewed: 已查看
 * - resolved: 已解决（宠物找回）
 * - spam: 疑似骚扰/垃圾
 */
export type ClueStatus = 'new' | 'viewed' | 'resolved' | 'spam';

/**
 * Clue event entity - 线索/事件
 */
export interface ClueEvent {
    /** 线索唯一标识 */
    id: string;
    /** 关联狗牌ID */
    tagId: string;
    /** 事件类型 */
    type: ClueEventType;
    /** 事件状态 */
    status: ClueStatus;
    /** 发生时间 (ISO 8601) */
    createdAt: string;
    /** 位置信息（线索类型必填） */
    location?: string | null;
    /** 经度 */
    longitude?: number | null;
    /** 纬度 */
    latitude?: number | null;
    /** 备注 */
    notes?: string | null;
    /** 图片URLs（最多3张） */
    photos?: string[];
    /** 拾获者选择的按钮类型 */
    finderAction?: 'seen' | 'controlled' | 'has_clue';
    /** 设备/UA信息（用于识别刷扫） */
    deviceInfo?: string | null;
    /** IP地址 */
    ipAddress?: string | null;
}

/**
 * Submit clue request DTO (H5 端使用)
 */
export interface SubmitClueDto {
    tagId: string;
    location: string;
    longitude?: number;
    latitude?: number;
    notes?: string;
    photos?: string[];
    finderAction: 'seen' | 'controlled' | 'has_clue';
}

/**
 * Report clue request DTO
 */
export interface ReportClueDto {
    reason: 'spam_scan' | 'fake_clue' | 'abuse' | 'other';
    description?: string;
}

// ============================================================================
// Pet Status Extension (用于寻狗场景)
// ============================================================================

/**
 * Pet status for lost/found scenarios
 * - normal: 正常状态
 * - lost: 走失中
 * - found: 已找回
 */
export type PetLostStatus = 'normal' | 'lost' | 'found';

/**
 * Pet info for H5 landing page display
 */
export interface PetPublicInfo {
    /** 宠物ID */
    id: string;
    /** 宠物名称 */
    name: string;
    /** 头像URL */
    avatar?: string | null;
    /** 品种 */
    breed?: string | null;
    /** 显著特征（毛色、体型、项圈等） */
    features?: string | null;
    /** 状态 */
    lostStatus: PetLostStatus;
}

// ============================================================================
// H5 Landing Page Types
// ============================================================================

/**
 * Dog tag public info (H5 landing page)
 */
export interface DogTagPublicInfo {
    /** 狗牌状态 */
    status: DogTagStatus;
    /** 宠物公开信息 */
    pet: PetPublicInfo;
    /** 主人联系方式提示（不暴露真实号码） */
    ownerHint?: string;
}

/**
 * Ad banner for H5 bottom area
 */
export interface AdBanner {
    id: string;
    imageUrl: string;
    title: string;
    subtitle?: string;
    linkUrl: string;
    /** 是否可关闭 */
    closable: boolean;
}

// ============================================================================
// List Query & Response Types
// ============================================================================

/**
 * Dog tag list query params
 */
export interface DogTagListQuery {
    petId?: string;
    status?: DogTagStatus;
    page?: number;
    pageSize?: number;
}

/**
 * Clue list query params
 */
export interface ClueListQuery {
    tagId?: string;
    type?: ClueEventType;
    status?: ClueStatus;
    page?: number;
    pageSize?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
