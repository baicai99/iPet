import { computed } from 'vue'
import MiniLineChart from '@/components/widgets/charts/MiniLineChart.vue'
import MiniBarChart from '@/components/widgets/charts/MiniBarChart.vue'

import MiniRangeSlider from '@/components/widgets/charts/MiniRangeSlider.vue'
import MiniStatus from '@/components/widgets/charts/MiniStatus.vue'
import MiniTimeline from '@/components/widgets/charts/MiniTimeline.vue'
import MiniStatusGrid from '@/components/widgets/charts/MiniStatusGrid.vue'
import DailyBarChart from '@/components/widgets/charts/DailyBarChart.vue'
import StatusGridChart from '@/components/widgets/charts/StatusGridChart.vue'

import RangeSliderChart from '@/components/widgets/charts/RangeSliderChart.vue'
import StatusIconChart from '@/components/widgets/charts/StatusIconChart.vue'
import TrendLineChart from '@/components/widgets/charts/TrendLineChart.vue'
import EventTimelineChart from '@/components/widgets/charts/EventTimelineChart.vue'

type ChartProps = Record<string, any>

const MINI_CHART_MAP = {
    trend_line: MiniLineChart,
    daily_bar: MiniBarChart,

    range_slider: MiniRangeSlider,
    status_icon: MiniStatus,
    event_timeline: MiniTimeline,
    state_grid: MiniStatusGrid
}

const DETAIL_CHART_MAP = {
    line: TrendLineChart,
    bar: DailyBarChart,
    grid: StatusGridChart,

    slider: RangeSliderChart,
    status: StatusIconChart,
    timeline: EventTimelineChart
}

const DEFAULT_MINI_TYPE = 'trend_line'
const DEFAULT_DETAIL_TYPE = 'line'

const chartDefaults: Record<string, ChartProps> = {

    range_slider: { height: 100 },
    status_icon: { size: 80 },
    event_timeline: { height: 120 },
    state_grid: { columns: 4 }
}

export function resolveChartAdapter(chartType: string, options: ChartProps = {}, variant: 'mini' | 'detail' = 'mini') {
    const type = chartType || (variant === 'mini' ? DEFAULT_MINI_TYPE : DEFAULT_DETAIL_TYPE)
    const map = variant === 'mini' ? MINI_CHART_MAP : DETAIL_CHART_MAP
    const component = map[type as keyof typeof map] || (variant === 'mini' ? MINI_CHART_MAP[DEFAULT_MINI_TYPE] : DETAIL_CHART_MAP[DEFAULT_DETAIL_TYPE])

    const defaults = chartDefaults[type] || {}
    const props = { ...defaults, ...(options || {}) }

    return { component, props }
}

export function useChartAdapter(chartType: string, options: ChartProps = {}, variant: 'mini' | 'detail' = 'mini') {
    const adapter = computed(() => resolveChartAdapter(chartType, options, variant))

    return {
        component: computed(() => adapter.value.component),
        props: computed(() => adapter.value.props)
    }
}
