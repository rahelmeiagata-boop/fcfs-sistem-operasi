import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from './ui/chart'
import type { Segment } from '../types'

export default function GanttChart({ segments }: { segments: Segment[] }) {
  const data = segments.map((segment) => ({
    name: segment.name,
    offset: segment.start,
    [segment.type === 'idle' ? 'idle' : 'process']: segment.duration,
    start: segment.start,
    end: segment.end,
    fill: segment.color,
  }))

  const maxTime = Math.max(...segments.map((segment) => segment.end), 1)
  const config = {
    offset: { label: 'Waktu mulai', color: 'transparent' },
    process: { label: 'Durasi proses', color: '#3478b9' },
    idle: { label: 'CPU idle', color: '#dce4ea' },
  }

  return (
    <div className="gantt-wrap">
      <div className="gantt-caption">
        <span>WAKTU EKSEKUSI CPU</span>
        <span>{maxTime} satuan waktu</span>
      </div>
      <ChartContainer config={config} className="gantt-chart">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap="30%"
          margin={{ top: 5, right: 20, bottom: 5, left: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#edf1f5" />
          <XAxis
            type="number"
            domain={[0, maxTime]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#8797a5', fontSize: 10 }}
            allowDecimals={false}
          />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip />
          <Bar dataKey="offset" stackId="timeline" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="process"
            stackId="timeline"
            radius={[5, 5, 5, 5]}
            isAnimationActive
            animationDuration={850}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props
              if (!width || !height || !payload.process) return <g />
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} rx={5} fill={payload.fill} />
                  {width > 34 && (
                    <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
                      {payload.name}
                    </text>
                  )}
                </g>
              )
            }}
          />
          <Bar
            dataKey="idle"
            stackId="timeline"
            radius={[5, 5, 5, 5]}
            isAnimationActive
            animationDuration={850}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props
              if (!width || !height || !payload.idle) return <g />
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} rx={5} fill="#dce4ea" />
                  {width > 34 && (
                    <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fill="#64778a" fontSize="10" fontWeight="700">
                      IDLE
                    </text>
                  )}
                </g>
              )
            }}
          />
        </BarChart>
      </ChartContainer>
      <div className="gantt-legend">
        <span><i className="legend-process" /> Proses berjalan</span>
        <span><i className="legend-idle" /> CPU idle</span>
      </div>
      <div className="gantt-segment-list">
        {segments.map((segment, index) => (
          <div className="segment-chip" key={`${segment.name}-${index}`}>
            <i style={{ background: segment.color }} />
            <b>{segment.name}</b>
            <span>{segment.start}–{segment.end}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
