import { AnimatePresence, motion } from 'motion/react'
import type { ProcessInput, ProcessResult } from '../types'

export default function ProcessQueue({
  processes,
  results,
  currentStep,
  isPlaying,
}: {
  processes: ProcessInput[]
  results: ProcessResult[]
  currentStep: number
  isPlaying: boolean
}) {
  const current = results[currentStep]
  const completed = results.slice(0, currentStep)
  const waiting = results.slice(currentStep + 1)

  return (
    <div className="queue-visual">
      <div className="queue-lane">
        <div className="lane-title"><span className="lane-dot waiting-dot" /> READY QUEUE <small>{waiting.length} menunggu</small></div>
        <div className="queue-items">
          <AnimatePresence mode="popLayout">
            {waiting.map((process) => (
              <motion.div
                layout
                key={process.id}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 340, damping: 25 }}
                className="queue-process waiting-process"
              >
                {process.name}<small>AT {process.at}</small>
              </motion.div>
            ))}
            {waiting.length === 0 && <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="queue-empty">Antrean kosong</motion.span>}
          </AnimatePresence>
        </div>
      </div>
      <motion.div className={`cpu-machine ${current && isPlaying ? 'cpu-active' : ''}`} animate={{ scale: current && isPlaying ? [1, 1.025, 1] : 1 }} transition={{ duration: 1.1, repeat: current && isPlaying ? Infinity : 0 }}>
        <div className="cpu-symbol">CPU</div>
        <div className="cpu-info">
          <b>{current ? current.name : 'Belum berjalan'}</b>
          <span>{current ? `Waktu ${current.start} sampai ${current.ct}` : 'Tekan Play untuk memulai'}</span>
        </div>
        <span className={`cpu-badge ${current ? 'running' : ''}`}>{current ? 'RUNNING' : 'READY'}</span>
      </motion.div>
      <div className="completed-row">
        <span className="lane-title"><span className="lane-dot done-dot" /> SELESAI <small>{completed.length} proses</small></span>
        <div className="completed-items">
          <AnimatePresence>
            {completed.map((process) => (
              <motion.span key={process.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="completed-chip">✓ {process.name}</motion.span>
            ))}
          </AnimatePresence>
          {completed.length === 0 && <span className="queue-empty">Belum ada proses selesai</span>}
        </div>
      </div>
    </div>
  )
}
