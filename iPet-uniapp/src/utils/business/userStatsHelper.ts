import dayjs from 'dayjs'
import type { Pet } from '@shared/types/pet'
import type { HealthRecord } from '@shared/types/health'

const WALKING_SPEED_KMH = 4
const MINUTES_PER_HOUR = 60

export const toTimestamp = (value?: number | string | null): number | null => {
    if (value === undefined || value === null) {
        return null
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim()) {
        const numeric = Number(value)
        if (!Number.isNaN(numeric)) {
            return numeric
        }
        const parsed = dayjs(value)
        return parsed.isValid() ? parsed.valueOf() : null
    }
    return null
}

export const resolvePetReferenceDate = (pet?: Pet): number | null => {
    if (!pet) {
        return null
    }
    const references = [
        toTimestamp(pet.adoptionDate),
        toTimestamp(pet.birthTimestamp),
        toTimestamp(pet.birthday),
        toTimestamp(pet.createdAt)
    ].filter((timestamp): timestamp is number => typeof timestamp === 'number' && !Number.isNaN(timestamp))

    if (!references.length) {
        return null
    }
    return Math.min(...references)
}

/**
 * Calculate total days with all pets
 * Uses arrivalDate if available, falls back to birthday
 * @param pets - List of pets
 * @returns Total days with pets (sum of all pets' companionship days)
 */
export const calculateDaysWithPets = (pets: Pet[] = []): number => {
    if (!pets || pets.length === 0) {
        return 0
    }

    const now = Date.now()
    let totalDays = 0

    for (const pet of pets) {
        // ✅ Use arrivalDate if available, fallback to birthday
        const startDate = pet.arrivalDate || pet.birthday

        if (!startDate) {
            continue
        }

        const start = new Date(startDate).getTime()
        if (isNaN(start) || start > now) {
            continue
        }

        const diffMs = now - start
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        totalDays += Math.max(0, days)
    }

    return totalDays
}

export const calculateRecordCount = (records: HealthRecord[] = []): number =>
    records.filter(record => record && !record.deleted).length

export const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

export const calculateWalkDistance = (records: HealthRecord[] = []): number => {
    const total = records.reduce((sum, record) => {
        if (!record || record.deleted) {
            return sum
        }
        if (record.type === 'run_distance' || record.type === 'walk_distance') {
            return sum + toNumber(record.value)
        }
        if (record.type === 'walk_duration') {
            const minutes = toNumber(record.value)
            return sum + (minutes / MINUTES_PER_HOUR) * WALKING_SPEED_KMH
        }
        return sum
    }, 0)

    return Number(total.toFixed(1))
}
