import type { User, UserDetail, GuestStats, PetType } from '@/api/types';

export const mockUsers: User[] = Array.from({ length: 50 }).map((_, index) => {
    const isGuest = Math.random() > 0.7;
    const isBanned = !isGuest && Math.random() > 0.9;

    return {
        id: `user-${index + 1}`,
        email: isGuest ? `guest_${index + 1}@example.com` : `user${index + 1}@example.com`,
        displayName: isGuest ? `游客 ${index + 1}` : `用户 ${index + 1}`,
        avatar: `https://i.pravatar.cc/150?u=user-${index + 1}`,
        isGuest,
        isBanned,
        bannedAt: isBanned ? new Date().toISOString() : undefined,
        bannedReason: isBanned ? '违反社区规范' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        lastActiveAt: new Date(Date.now() - Math.random() * 100000000).toISOString(),
        petsCount: Math.floor(Math.random() * 3),
    };
});

export const mockUserDetails: Record<string, UserDetail> = mockUsers.reduce((acc, user) => {
    const petsCount = user.petsCount;
    const pets = Array.from({ length: petsCount }).map((_, i) => ({
        id: `pet-${user.id}-${i}`,
        name: `Pet ${i + 1}`,
        type: (['dog', 'cat', 'other'][Math.floor(Math.random() * 3)]) as PetType,
        healthRecordsCount: Math.floor(Math.random() * 10),
    }));

    acc[user.id] = {
        ...user,
        healthRecordsCount: pets.reduce((sum, p) => sum + p.healthRecordsCount, 0),
        pets,
    };
    return acc;
}, {} as Record<string, UserDetail>);

export const mockGuestStats: GuestStats = {
    total: mockUsers.filter(u => u.isGuest).length,
    last7Days: Math.floor(mockUsers.filter(u => u.isGuest).length * 0.3),
    last30Days: Math.floor(mockUsers.filter(u => u.isGuest).length * 0.8),
};
