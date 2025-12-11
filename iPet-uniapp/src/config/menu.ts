export const services = [
    {
        id: 'emergency-card',
        label: '急救档案',
        icon: 'medal',
        path: '/pages/emergency/card',
        status: 'available',
        bgColor: '#fee2e2',
        iconColor: '#dc2626',
        defaultVisible: true
    },
    {
        id: 'hospital',
        label: '附近医院',
        icon: 'map',
        path: '',
        status: 'comingSoon',
        bgColor: '#dbeafe',
        iconColor: '#2563eb',
        defaultVisible: true
    },
    {
        id: 'insurance',
        label: '宠物保险',
        icon: 'shield',
        path: '',
        status: 'comingSoon',
        bgColor: '#dcfce7',
        iconColor: '#16a34a',
        defaultVisible: true
    },

    {
        id: 'consult',
        label: '在线问诊',
        icon: 'chat',
        path: '',
        status: 'comingSoon',
        bgColor: '#ffedd5',
        iconColor: '#ea580c',
        defaultVisible: true
    },
    {
        id: 'achievements',
        label: '成就系统',
        icon: 'medal',
        path: '',
        status: 'comingSoon',
        bgColor: '#ccfbf1',
        iconColor: '#0d9488',
        defaultVisible: false
    },
    {
        id: 'all-services',
        label: '全部服务',
        icon: 'grid',
        path: '/pages/summary/summary',
        status: 'available',
        bgColor: '#f3f4f6',
        iconColor: '#4b5563',
        defaultVisible: true
    }
]



export const appSettings = [


    {
        label: '隐私设置',
        icon: 'lock',
        path: '/pages/settings/privacy'
    },
    {
        label: '深色模式',
        icon: 'moon',
        isSwitch: true,
        switchValue: false
    }
]

export const helpFeedback = [
    {
        label: '常见问题',
        icon: 'question-circle',
        path: '/pages/help/faq'
    },

    {
        label: '关于我们',
        icon: 'info-circle',
        value: 'v0.0.1',
        path: '/pages/about/about'
    }
]
