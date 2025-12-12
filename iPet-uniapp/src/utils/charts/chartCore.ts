/**
 * Core Chart Utilities
 * 
 * Extracts common logic for charts:
 * 1. Normalization (Data preparation)
 * 2. Scaling (Coordinate mapping)
 * 3. Path Generation (SVG d attributes)
 */

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface ChartPoint {
    x: number;
    y: number;
    value: number;
    index: number;
}

export interface ChartDomain {
    min: number;
    max: number;
    range: number;
}

export interface NormalizationOptions {
    targetLength?: number;
    fillStrategy?: 'zero' | 'null' | 'last';
    padDirection?: 'start' | 'end';
}

// ==========================================
// 2. Normalization (Data Logic)
// ==========================================

export const normalizeData = (
    rawData: any,
    options: NormalizationOptions = {}
): (number | null)[] => {
    let data: (number | null)[] = [];

    // 1. Extract array
    if (Array.isArray(rawData)) {
        data = rawData.map(d => {
            if (d === null || d === undefined) return null;
            const num = Number(d);
            return isNaN(num) ? null : num;
        });
    } else if (typeof rawData === 'object' && rawData !== null && Array.isArray(rawData.values)) {
        data = rawData.values.map((d: any) => {
            if (d === null || d === undefined) return null;
            const num = Number(d);
            return isNaN(num) ? null : num;
        });
    } else {
        return [];
    }

    // 2. No longer convert null to 0 - preserve null for missing data
    // (removed: data = data.map(d => isNaN(d) ? 0 : d))

    // 3. Padding/Truncation
    const { targetLength, fillStrategy = 'null', padDirection = 'start' } = options;

    if (targetLength && data.length !== targetLength) {
        if (data.length > targetLength) {
            // Truncate
            data = padDirection === 'start' ? data.slice(-targetLength) : data.slice(0, targetLength);
        } else {
            // Pad with null (not 0) by default
            const diff = targetLength - data.length;
            const fillValue = fillStrategy === 'zero' ? 0
                : (fillStrategy === 'last' ? (data[data.length - 1] ?? null) : null);
            const padding = new Array(diff).fill(fillValue);

            data = padDirection === 'start'
                ? [...padding, ...data]
                : [...data, ...padding];
        }
    }

    return data;
};

export const getDomain = (data: (number | null)[]): ChartDomain => {
    const validData = data.filter((d): d is number => typeof d === 'number' && !isNaN(d));

    if (validData.length === 0) {
        return { min: 0, max: 1, range: 1 };
    }

    let min = Math.min(...validData);
    let max = Math.max(...validData);
    let range = max - min;

    // Avoid flatline division by zero
    if (range === 0) {
        range = max === 0 ? 1 : Math.abs(max) * 0.2; // Add some buffer
        // Adjust min/max to center the line
        if (max !== 0) {
            min -= range / 2;
            max += range / 2;
        } else {
            max = 1; // 0 to 1 range
        }
    }

    return { min, max, range };
};

// ==========================================
// 3. Scale (Coordinate Logic)
// ==========================================

export const linearScale = (
    value: number,
    domain: ChartDomain,
    rangeMax: number,
    rangeMin: number = 0
): number => {
    // y = rangeMin + (value - domain.min) / domain.range * (rangeMax - rangeMin)
    // Note: For SVG Y-axis (0 is top), rangeMax usually 0, rangeMin usually height
    const normalized = (value - domain.min) / domain.range;
    return rangeMin + normalized * (rangeMax - rangeMin);
};

export const generatePoints = (
    data: (number | null)[],
    width: number,
    height: number,
    padding: { top?: number, bottom?: number, left?: number, right?: number } = {}
): ChartPoint[] => {
    if (!data.length) return [];

    // Filter out null values to calculate domain from valid data only
    const validValues = data.filter((d): d is number => d !== null && d !== undefined);
    if (validValues.length === 0) return [];

    const domain = getDomain(validValues);

    const pTop = padding.top || 0;
    const pBottom = padding.bottom || 0;
    const pLeft = padding.left || 0;
    const pRight = padding.right || 0;

    const availableHeight = height - pTop - pBottom;
    const availableWidth = width - pLeft - pRight;

    // SVG Coordinate System: y=0 is top. 
    // Value(min) -> height (bottom), Value(max) -> 0 (top)
    const yMax = pTop;
    const yMin = height - pBottom;

    // Generate points only for non-null values, but use original index for X positioning
    const points: ChartPoint[] = [];
    const totalPoints = data.length;

    data.forEach((d, i) => {
        // Skip null values - they represent missing data
        if (d === null || d === undefined) return;

        const x = totalPoints > 1
            ? pLeft + (i / (totalPoints - 1)) * availableWidth
            : pLeft + availableWidth / 2; // Center single point

        const y = linearScale(d, domain, yMax, yMin);

        points.push({ x, y, value: d, index: i });
    });

    return points;
};

// ==========================================
// 4. Path Generation (Rendering Logic)
// ==========================================

export const generateLinePath = (points: ChartPoint[], smooth: boolean = false): string => {
    if (!points.length) return '';
    if (points.length === 1) {
        // Dot or tiny line
        return `M${points[0].x},${points[0].y} L${points[0].x},${points[0].y}`;
    }

    if (!smooth) {
        // Polyline
        return 'M' + points.map(p => `${p.x},${p.y}`).join(' L');
    }

    // Bezier curve
    return points.reduce((acc, point, i, a) => {
        if (i === 0) return `M${point.x},${point.y}`;

        const cps = getControlPoint(a[i - 1], a[i - 2], point);
        const cpe = getControlPoint(point, a[i - 1], a[i + 1], true);

        return `${acc} C${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
    }, '');
};

export const generateAreaPath = (points: ChartPoint[], baselineY: number): string => {
    if (!points.length) return '';
    const linePath = points.map(p => `${p.x},${p.y}`).join(' L');
    const first = points[0];
    const last = points[points.length - 1];

    return `M${first.x},${baselineY} L${linePath} L${last.x},${baselineY} Z`;
};

// Helper for smoothing
const getControlPoint = (current: ChartPoint, previous: ChartPoint, next: ChartPoint, reverse?: boolean) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2;
    const o = {
        x: n.x - p.x,
        y: n.y - p.y
    };
    const angle = Math.atan2(o.y, o.x) + (reverse ? Math.PI : 0);
    const length = Math.sqrt(Math.pow(o.x, 2) + Math.pow(o.y, 2)) * smoothing;
    return {
        x: current.x + Math.cos(angle) * length,
        y: current.y + Math.sin(angle) * length
    };
};
