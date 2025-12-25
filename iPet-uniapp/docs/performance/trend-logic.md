# Trend Evaluation Logic

## Overview

To ensure consistency across the application, trend evaluation and formatting logic are consolidated into a centralized system. This provides a single source of truth for determining trend status, direction, and magnitude, as well as generating human-readable factual statements.

## Core Modules

### 1. Trend Evaluator
**Source**: `src/domain/trend/trendEvaluator.ts`

The `trendEvaluator` is the sole determinant for trend status. It processes raw metric data and returns a `TrendResult`.

**Responsibilities**:
- Calculating percentage changes between time periods (e.g., current period vs. previous period).
- Determining if a change is significant based on predefined thresholds.
- Assigning a direction (`UP`, `DOWN`, `STABLE`) and magnitude.

### 2. Trend Formatter
**Source**: `src/domain/trend/trendFormatter.ts`

The `trendFormatter` converts a `TrendResult` into authoritative, human-readable text.

**Key Method: `formatHeadline()`**:
- Generates a concise factual statement (e.g., "Weight has increased by 15% compared to last week").
- This method should be the ONLY source for factual trend headlines in the UI.

## Implementation Rules

### TrendCard
- **Usage**: Displays a summarized view of a metric's trend.
- **Rules**:
    - MUST use `formatHeadline()` for the main text.
    - Should not include advice or subjective interpretations.

### InsightBubble
- **Usage**: Provides deeper analysis and actionable advice.
- **Rules**:
    - Displays a combination of the `headline` (from `formatHeadline()`) and a separate `advice` string.
    - The `advice` is generated based on the trend result but kept as a distinct piece of information.

## Thresholds

The following thresholds are used to determine significant changes:
- **Major Increase/Decrease**: > 30%
- **Minor Increase/Decrease**: 10% - 30%
- **Stable**: < 10% (or defined on a per-metric basis in metadata)

## Benefits
- **Consistency**: Users see the same factual statements regardless of where the trend is displayed.
- **Maintainability**: Logic changes only need to be made in one place.
- **Scalability**: New metrics or display formats can easily consume the unified trend engine.
