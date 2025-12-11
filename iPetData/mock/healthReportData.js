/**
 * 健康报告相关 Mock 数据
 * Health Report Mock Data
 */

// 步数历史数据 (最近30天)
export const stepHistory = [
    { date: '2025-11-01', steps: 8500, petId: 1 },
    { date: '2025-11-02', steps: 9200, petId: 1 },
    { date: '2025-11-03', steps: 7800, petId: 1 },
    { date: '2025-11-04', steps: 10500, petId: 1 },
    { date: '2025-11-05', steps: 8900, petId: 1 },
    { date: '2025-11-06', steps: 9600, petId: 1 },
    { date: '2025-11-07', steps: 8200, petId: 1 },
    { date: '2025-11-08', steps: 11000, petId: 1 },
    { date: '2025-11-09', steps: 9400, petId: 1 },
    { date: '2025-11-10', steps: 8700, petId: 1 },
    { date: '2025-11-11', steps: 9100, petId: 1 },
    { date: '2025-11-12', steps: 8500, petId: 1 },
    { date: '2025-11-13', steps: 9800, petId: 1 },
    { date: '2025-11-14', steps: 10200, petId: 1 },
    { date: '2025-11-15', steps: 8900, petId: 1 },
    { date: '2025-11-16', steps: 9300, petId: 1 },
    { date: '2025-11-17', steps: 8600, petId: 1 },
    { date: '2025-11-18', steps: 9700, petId: 1 },
    { date: '2025-11-19', steps: 10100, petId: 1 },
    { date: '2025-11-20', steps: 8800, petId: 1 },
    { date: '2025-11-21', steps: 9500, petId: 1 },
    { date: '2025-11-22', steps: 9000, petId: 1 },
    { date: '2025-11-23', steps: 8400, petId: 1 },
    { date: '2025-11-24', steps: 9900, petId: 1 },
    { date: '2025-11-25', steps: 10300, petId: 1 },
    { date: '2025-11-26', steps: 8700, petId: 1 },
    { date: '2025-11-27', steps: 9200, petId: 1 },
    { date: '2025-11-28', steps: 8900, petId: 1 },
    { date: '2025-11-29', steps: 9600, petId: 1 },
];

// 体重记录数据 (最近12个月)
export const weightHistory = [
    { date: '2024-12-01', weight: 25.2, petId: 1 },
    { date: '2025-01-01', weight: 25.5, petId: 1 },
    { date: '2025-02-01', weight: 25.8, petId: 1 },
    { date: '2025-03-01', weight: 26.0, petId: 1 },
    { date: '2025-04-01', weight: 26.2, petId: 1 },
    { date: '2025-05-01', weight: 26.5, petId: 1 },
    { date: '2025-06-01', weight: 26.8, petId: 1 },
    { date: '2025-07-01', weight: 27.0, petId: 1 },
    { date: '2025-08-01', weight: 27.2, petId: 1 },
    { date: '2025-09-01', weight: 27.5, petId: 1 },
    { date: '2025-10-01', weight: 27.8, petId: 1 },
    { date: '2025-11-01', weight: 28.0, petId: 1 },
    { date: '2025-11-15', weight: 28.2, petId: 1 },
    { date: '2025-11-29', weight: 28.5, petId: 1 },
];

// 疫苗接种记录
export const vaccineHistory = [
    {
        id: 1,
        petId: 1,
        name: '疫苗（狂犬）',
        date: '2024-03-15',
        nextDue: '2025-03-15',
        status: 'completed',
        veterinarian: '张医生',
        clinic: '爱宠动物医院'
    },
    {
        id: 2,
        petId: 1,
        name: '疫苗（多联）',
        date: '2024-04-10',
        nextDue: '2025-04-10',
        status: 'completed',
        veterinarian: '李医生',
        clinic: '爱宠动物医院'
    },
    {
        id: 3,
        petId: 1,
        name: '疫苗（多联）',
        date: '2024-05-20',
        nextDue: '2025-05-20',
        status: 'upcoming',
        veterinarian: '王医生',
        clinic: '宠物健康中心'
    },
];

// 就诊记录
export const medicalHistory = [
    {
        id: 1,
        petId: 1,
        date: '2025-10-15',
        reason: '常规体检',
        diagnosis: '健康状况良好',
        treatment: '无需治疗',
        veterinarian: '张医生',
        clinic: '爱宠动物医院',
        cost: 200,
        notes: '建议继续保持运动量'
    },
    {
        id: 2,
        petId: 1,
        date: '2025-09-08',
        reason: '皮肤过敏',
        diagnosis: '轻度皮肤过敏',
        treatment: '外用药膏 + 口服抗过敏药',
        veterinarian: '李医生',
        clinic: '爱宠动物医院',
        cost: 350,
        notes: '避免接触过敏源，一周后复查'
    },
    {
        id: 3,
        petId: 1,
        date: '2025-07-22',
        reason: '消化不良',
        diagnosis: '轻度肠胃炎',
        treatment: '益生菌 + 清淡饮食',
        veterinarian: '王医生',
        clinic: '宠物健康中心',
        cost: 280,
        notes: '注意饮食卫生'
    },
    {
        id: 4,
        petId: 1,
        date: '2025-06-05',
        reason: '牙齿清洁',
        diagnosis: '牙结石清理',
        treatment: '超声波洁牙',
        veterinarian: '赵医生',
        clinic: '爱宠动物医院',
        cost: 500,
        notes: '建议每年洁牙一次'
    },
];

// 健康报告模板数据
export const healthReportTemplate = {
    petId: 1,
    petName: 'Lucky',
    reportDate: '2025-11-29',
    timeRange: 'month', // week, month, year
    healthScore: 85,
    scoreBreakdown: {
        exercise: { score: 90, weight: 0.3, status: 'excellent' },
        weight: { score: 85, weight: 0.25, status: 'good' },
        vaccine: { score: 80, weight: 0.25, status: 'good' },
        medical: { score: 85, weight: 0.2, status: 'good' }
    },
    anomalies: [
        {
            type: 'weight',
            severity: 'warning',
            message: '本月体重增长 1.8%，略高于正常范围',
            date: '2025-11-29'
        }
    ],
    summary: {
        totalSteps: 268500,
        avgDailySteps: 9260,
        stepGoalRate: 92.6,
        weightChange: 0.5,
        weightChangePercent: 1.8,
        vaccinesCompleted: 2,
        vaccinesUpcoming: 1,
        medicalVisits: 1
    }
};
