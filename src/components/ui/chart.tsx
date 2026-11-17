import * as React from 'react'
import { ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts'
import { cn } from '../../lib/utils'

type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>
const ChartContext = React.createContext<{ config: ChartConfig }>({ config: {} })

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className?: string
  children: React.ReactElement
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart="true" className={cn('w-full text-xs', className)}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  const { config } = React.useContext(ChartContext)
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{String(label ?? '')}</p>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? '')
        const meta = config[key]
        if (!item.value || key === 'offset') return null
        return (
          <div className="chart-tooltip-row" key={`${key}-${index}`}>
            <span className="chart-tooltip-dot" style={{ background: String(item.color || meta?.color || '#3478b9') }} />
            <span>{meta?.label ?? item.name ?? key}</span>
            <b>{String(item.value)} satuan</b>
          </div>
        )
      })}
    </div>
  )
}

export function ChartTooltip(props: TooltipProps<number, string>) {
  return <Tooltip content={<ChartTooltipContent {...props} />} cursor={{ fill: 'rgba(52,120,185,.05)' }} />
}
