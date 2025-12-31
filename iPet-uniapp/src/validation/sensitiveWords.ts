/**
 * Sensitive word filtering used in iPet-uniapp.
 */

export const SENSITIVE_WORDS = [
    // System/Admin related
    "admin",
    "root",
    "system",
    "administrator",

    // Harmful content (Chinese)
    "违规",
    "死",
    "杀",

    // Add more as needed
];

/**
 * Check if a string contains any sensitive words (case-insensitive)
 * @param text - The text to check
 * @returns true if the text contains sensitive words
 */
export const containsSensitiveWord = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    const lowerText = text.toLowerCase();
    return SENSITIVE_WORDS.some(word => lowerText.includes(word.toLowerCase()));
};

/**
 * Get the first sensitive word found in the text
 * @param text - The text to check
 * @returns The first sensitive word found, or null if none
 */
export const findSensitiveWord = (text: string): string | null => {
    if (!text || typeof text !== 'string') return null;
    const lowerText = text.toLowerCase();
    return SENSITIVE_WORDS.find(word => lowerText.includes(word.toLowerCase())) || null;
};

/**
 * Filter out sensitive words from text (replace with *)
 * @param text - The text to filter
 * @returns Filtered text with sensitive words replaced
 */
export const filterSensitiveWords = (text: string): string => {
    if (!text || typeof text !== 'string') return text;

    let result = text;
    for (const word of SENSITIVE_WORDS) {
        const regex = new RegExp(word, 'gi');
        result = result.replace(regex, '*'.repeat(word.length));
    }
    return result;
};
