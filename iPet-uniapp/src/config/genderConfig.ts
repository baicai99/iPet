/**
 * Gender display configuration for UserProfileCard
 */

export interface GenderStyle {
    icon: string;
    color: string;
    lightBgClass: string;
    darkBgClass: string;
}

export const GENDER_STYLES: Record<string, GenderStyle> = {
    '男性': {
        icon: 'man',
        color: '#3b82f6',
        lightBgClass: 'gender-male-light',
        darkBgClass: 'gender-male-dark'
    },
    '女性': {
        icon: 'woman',
        color: '#ec4899',
        lightBgClass: 'gender-female-light',
        darkBgClass: 'gender-female-dark'
    },
    '沃尔玛购物袋': {
        icon: 'shopping-bag',
        color: '#f59e0b',
        lightBgClass: 'gender-bag-light',
        darkBgClass: 'gender-bag-dark'
    }
};

export const DEFAULT_GENDER_STYLE: GenderStyle = {
    icon: 'question-circle',
    color: '#9ca3af',
    lightBgClass: 'gender-unknown-light',
    darkBgClass: 'gender-unknown-dark'
};

/**
 * Get gender display style configuration
 * @param gender - The gender string
 * @returns GenderStyle configuration
 */
export const getGenderStyle = (gender?: string): GenderStyle => {
    if (!gender) return DEFAULT_GENDER_STYLE;
    return GENDER_STYLES[gender] || DEFAULT_GENDER_STYLE;
};

/**
 * Get gender background class based on theme
 * @param gender - The gender string
 * @param isDark - Whether dark theme is active
 * @returns CSS class name
 */
export const getGenderBgClass = (gender?: string, isDark: boolean = false): string => {
    const style = getGenderStyle(gender);
    return isDark ? style.darkBgClass : style.lightBgClass;
};
