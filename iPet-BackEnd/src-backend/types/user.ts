/**
 * User-related types for iPet-BackEnd.
 */

export interface AccountInfo {
    id: string;
    displayName: string;
    avatar: string;
    uid: string;
    mbti?: string | null;
    bio?: string | null;
    gender?: 'male' | 'female' | null;
    theme?: 'light' | 'dark' | null;
    isVip?: boolean | null;
    vipLevel?: string | null;
    membership?: {
        level: string;
        expireAt: string;
    };
    updatedAt: number;
    deleted?: boolean;
    tags?: string[];
    [key: string]: any;
}

export interface UserStats {
    daysWithPet: number;
    recordCount: number;
    walkDistance: number;
    [key: string]: any;
}

export interface WalletInfo {
    balance: number;
    points: number;
    coupons: number;
    [key: string]: any;
}

export interface Transaction {
    id: number;
    title: string;
    date: string;
    amount: string;
    points: string;
    type?: string;
    [key: string]: any;
}

export interface UserState {
    token: string;
    tokenExpiresAt: number | null;
    accountInfo: AccountInfo;
    walletInfo: WalletInfo | null;
    transactionHistory: Transaction[];
}
