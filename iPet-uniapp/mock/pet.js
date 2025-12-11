/**
 * Default mock pet data
 * Provides a default pet so the summary page can load health data
 */
export const pets = [
    {
        id: 'mock_pet_001',
        name: '小白',
        species: 'dog',
        breed: '柴犬',
        gender: 'male',
        birthday: '2022-03-15',
        weight: 12.5,
        avatar: '',
        createdAt: '2022-03-20T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        isActive: true
    },
    {
        id: 'mock_pet_002',
        name: '小黑',
        species: 'cat',
        breed: '英短',
        gender: 'female',
        birthday: '2023-06-01',
        weight: 4.2,
        avatar: '',
        createdAt: '2023-06-10T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        isActive: true
    }
]
