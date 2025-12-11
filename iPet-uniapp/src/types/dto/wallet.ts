/**
 * Wallet & Transaction DTOs
 * 
 * 定义钱包和交易相关的类型，替换 any
 */

export interface WalletInfo {
    balance: number
    currency: string
    lastUpdated: number
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
    id: string
    amount: number
    type: TransactionType
    description: string
    timestamp: number
    status?: 'pending' | 'completed' | 'failed'
    metadata?: Record<string, unknown>
}
