/**
 * Seeded Random Number Generator
 * Uses Linear Congruential Generator (LCG) algorithm for deterministic results
 */
export class SeededRandom {
    private seed: number

    constructor(seed: number | string) {
        if (typeof seed === 'string') {
            this.seed = this.hashString(seed)
        } else {
            this.seed = seed
        }
    }

    /**
     * Simple string hashing function
     */
    private hashString(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
        }
        return Math.abs(hash)
    }

    /**
     * Generate next random number between 0 (inclusive) and 1 (exclusive)
     */
    next(): number {
        // LCG constants (same as glibc's rand())
        const a = 1103515245
        const c = 12345
        const m = 2147483648

        this.seed = (a * this.seed + c) % m
        return this.seed / m
    }

    /**
     * Generate random float between min (inclusive) and max (exclusive)
     */
    float(min: number, max: number): number {
        return min + this.next() * (max - min)
    }

    /**
     * Generate random integer between min (inclusive) and max (inclusive)
     */
    int(min: number, max: number): number {
        return Math.floor(this.float(min, max + 1))
    }

    /**
     * Pick a random item from an array
     */
    choice<T>(array: T[]): T {
        if (array.length === 0) return undefined as any
        return array[this.int(0, array.length - 1)]
    }

    /**
     * Return true with probability p (0-1)
     */
    bool(probability: number = 0.5): boolean {
        return this.next() < probability
    }
}
