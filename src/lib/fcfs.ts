import type { ProcessInput, ProcessResult, Segment } from '../types'

const colors = ['#3478b9', '#e99a43', '#45977d', '#8a79bd', '#d47772', '#4b9eaa', '#9a8b56']

export function calculateFCFS(processes: ProcessInput[]) {
  const sorted = processes
    .map((process, inputOrder) => ({ ...process, inputOrder }))
    .sort((a, b) => a.at - b.at || a.inputOrder - b.inputOrder)

  let clock = 0
  const results: ProcessResult[] = []
  const segments: Segment[] = []
  const events: { time: number; message: string; kind: 'arrival' | 'run' | 'idle' }[] = []
  let busy = 0

  sorted.forEach((process, index) => {
    if (clock < process.at) {
      segments.push({
        name: 'IDLE',
        start: clock,
        end: process.at,
        duration: process.at - clock,
        type: 'idle',
        color: '#dce4ea',
      })
      events.push({
        time: clock,
        message: `CPU berada dalam kondisi idle sampai proses berikutnya datang pada waktu ${process.at}.`,
        kind: 'idle',
      })
      clock = process.at
    }

    const start = clock
    const ct = start + process.bt
    const tat = ct - process.at
    const wt = tat - process.bt
    const rt = start - process.at

    results.push({ ...process, start, ct, tat, wt, rt })
    segments.push({
      name: process.name,
      start,
      end: ct,
      duration: process.bt,
      type: 'process',
      color: colors[process.inputOrder % colors.length],
    })
    events.push({
      time: process.at,
      message: `${process.name} datang pada waktu ${process.at} dengan Burst Time ${process.bt}.`,
      kind: 'arrival',
    })
    events.push({
      time: start,
      message: `CPU menjalankan ${process.name} dari waktu ${start} sampai ${ct}.`,
      kind: 'run',
    })
    clock = ct
    busy += process.bt
  })

  const firstArrival = Math.min(...processes.map((process) => process.at))
  const totalTime = clock - firstArrival
  const idleTime = segments.filter((segment) => segment.type === 'idle').reduce((sum, segment) => sum + segment.duration, 0)
  const avgWT = results.reduce((sum, process) => sum + process.wt, 0) / results.length
  const avgTAT = results.reduce((sum, process) => sum + process.tat, 0) / results.length
  const cpuUtilization = totalTime > 0 ? (busy / totalTime) * 100 : 0
  const throughput = totalTime > 0 ? results.length / totalTime : 0

  events.sort((a, b) => a.time - b.time || (a.kind === 'arrival' ? -1 : 1))

  return {
    results,
    segments,
    events,
    avgWT,
    avgTAT,
    cpuUtilization,
    throughput,
    idleTime,
    totalTime,
    busy,
    startTime: firstArrival,
    endTime: clock,
  }
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
}
