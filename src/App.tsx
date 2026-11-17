import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { animate, stagger } from 'animejs'
import {
  Activity, ArrowDown, ArrowRight, BookOpen, Check, ChevronRight,
  CircleHelp, Cpu, Play, Plus, RotateCcw, SkipForward, Trash2, Zap,
} from 'lucide-react'
import GanttChart from './components/GanttChart'
import ProcessQueue from './components/ProcessQueue'
import { calculateFCFS, formatNumber } from './lib/fcfs'
import type { ProcessInput } from './types'

const initialProcesses: ProcessInput[] = [
  { id: 'p1', name: 'P1', at: 0, bt: 3 },
  { id: 'p2', name: 'P2', at: 0, bt: 2 },
  { id: 'p3', name: 'P3', at: 2, bt: 4 },
  { id: 'p4', name: 'P4', at: 10, bt: 3 },
  { id: 'p5', name: 'P5', at: 12, bt: 2 },
]

const transition = { type: 'spring' as const, stiffness: 280, damping: 26 }

type QuizLevel = 'easy' | 'medium' | 'hard'
type QuizCase = { title: string; processes: { name: string; at: number; bt: number }[]; kind: 'order' | 'wt' | 'ct' | 'tat' | 'idle'; target?: string; question: string }
type QuizQuestion = QuizCase & { options: string[]; answer: number; explanation: string }

const quizBanks: Record<QuizLevel, QuizCase[]> = {
  easy: [
    { title: 'Kasus 1 · Urutan kedatangan', processes: [{ name: 'P1', at: 0, bt: 3 }, { name: 'P2', at: 1, bt: 2 }, { name: 'P3', at: 2, bt: 1 }], kind: 'order', question: 'Dalam urutan apa CPU menjalankan proses?' },
    { title: 'Kasus 2 · Waiting Time', processes: [{ name: 'P1', at: 0, bt: 4 }, { name: 'P2', at: 2, bt: 3 }], kind: 'wt', target: 'P2', question: 'Berapa Waiting Time (WT) proses P2?' },
    { title: 'Kasus 3 · Completion Time', processes: [{ name: 'P1', at: 0, bt: 2 }, { name: 'P2', at: 2, bt: 3 }], kind: 'ct', target: 'P2', question: 'Berapa Completion Time (CT) proses P2?' },
    { title: 'Kasus 4 · Turnaround Time', processes: [{ name: 'P1', at: 0, bt: 3 }, { name: 'P2', at: 1, bt: 2 }], kind: 'tat', target: 'P2', question: 'Berapa Turnaround Time (TAT) proses P2?' },
    { title: 'Kasus 5 · Kedatangan bersamaan', processes: [{ name: 'P1', at: 0, bt: 2 }, { name: 'P2', at: 0, bt: 4 }, { name: 'P3', at: 0, bt: 1 }], kind: 'order', question: 'Jika semua proses datang bersamaan, urutan mana yang dipakai sesuai urutan input?' },
  ],
  medium: [
    { title: 'Kasus 1 · Waiting Time', processes: [{ name: 'P1', at: 0, bt: 5 }, { name: 'P2', at: 1, bt: 3 }, { name: 'P3', at: 3, bt: 2 }], kind: 'wt', target: 'P3', question: 'Hitung Waiting Time proses P3.' },
    { title: 'Kasus 2 · Completion Time', processes: [{ name: 'P1', at: 0, bt: 3 }, { name: 'P2', at: 2, bt: 4 }, { name: 'P3', at: 4, bt: 2 }], kind: 'ct', target: 'P3', question: 'Kapan proses P3 selesai?' },
    { title: 'Kasus 3 · Turnaround Time', processes: [{ name: 'P1', at: 0, bt: 4 }, { name: 'P2', at: 1, bt: 2 }, { name: 'P3', at: 3, bt: 3 }], kind: 'tat', target: 'P2', question: 'Berapa Turnaround Time proses P2?' },
    { title: 'Kasus 4 · CPU Idle', processes: [{ name: 'P1', at: 3, bt: 2 }, { name: 'P2', at: 8, bt: 3 }, { name: 'P3', at: 9, bt: 1 }], kind: 'idle', question: 'Berapa total waktu CPU berada dalam kondisi idle?' },
    { title: 'Kasus 5 · Urutan proses', processes: [{ name: 'P1', at: 3, bt: 2 }, { name: 'P2', at: 1, bt: 4 }, { name: 'P3', at: 1, bt: 1 }], kind: 'order', question: 'Tentukan urutan eksekusi proses. Jika AT sama, ikuti urutan input.' },
    { title: 'Kasus 6 · Waiting Time', processes: [{ name: 'P1', at: 0, bt: 2 }, { name: 'P2', at: 0, bt: 5 }, { name: 'P3', at: 4, bt: 2 }], kind: 'wt', target: 'P3', question: 'Berapa Waiting Time proses P3?' },
    { title: 'Kasus 7 · Completion Time', processes: [{ name: 'P1', at: 2, bt: 3 }, { name: 'P2', at: 4, bt: 2 }, { name: 'P3', at: 4, bt: 4 }], kind: 'ct', target: 'P3', question: 'Berapa Completion Time proses P3?' },
    { title: 'Kasus 8 · Turnaround Time', processes: [{ name: 'P1', at: 0, bt: 2 }, { name: 'P2', at: 2, bt: 5 }, { name: 'P3', at: 3, bt: 2 }], kind: 'tat', target: 'P3', question: 'Hitung Turnaround Time proses P3.' },
    { title: 'Kasus 9 · Rata-rata WT', processes: [{ name: 'P1', at: 0, bt: 3 }, { name: 'P2', at: 1, bt: 2 }, { name: 'P3', at: 2, bt: 4 }], kind: 'wt', target: 'RATA', question: 'Berapa rata-rata Waiting Time seluruh proses?' },
    { title: 'Kasus 10 · CPU Idle', processes: [{ name: 'P1', at: 0, bt: 2 }, { name: 'P2', at: 6, bt: 2 }, { name: 'P3', at: 10, bt: 1 }], kind: 'idle', question: 'Berapa total waktu idle CPU selama seluruh proses?' },
  ],
  hard: [
    { title: 'Kasus 1 · AT sama dan berbeda', processes: [{ name: 'P1', at: 0, bt: 4 }, { name: 'P2', at: 2, bt: 3 }, { name: 'P3', at: 2, bt: 2 }, { name: 'P4', at: 5, bt: 1 }], kind: 'order', question: 'Tentukan urutan proses. P2 dan P3 datang bersamaan.' },
    { title: 'Kasus 2 · Waiting Time', processes: [{ name: 'P1', at: 0, bt: 6 }, { name: 'P2', at: 1, bt: 2 }, { name: 'P3', at: 1, bt: 4 }, { name: 'P4', at: 5, bt: 3 }], kind: 'wt', target: 'P4', question: 'Berapa Waiting Time proses P4?' },
    { title: 'Kasus 3 · Completion Time', processes: [{ name: 'P1', at: 2, bt: 4 }, { name: 'P2', at: 2, bt: 3 }, { name: 'P3', at: 5, bt: 2 }, { name: 'P4', at: 8, bt: 5 }], kind: 'ct', target: 'P4', question: 'Tentukan Completion Time proses P4.' },
    { title: 'Kasus 4 · CPU Idle dan antrean', processes: [{ name: 'P1', at: 3, bt: 2 }, { name: 'P2', at: 9, bt: 4 }, { name: 'P3', at: 9, bt: 2 }, { name: 'P4', at: 17, bt: 1 }], kind: 'idle', question: 'Hitung total waktu idle CPU dari awal sampai semua proses selesai.' },
    { title: 'Kasus 5 · Turnaround Time', processes: [{ name: 'P1', at: 0, bt: 5 }, { name: 'P2', at: 2, bt: 4 }, { name: 'P3', at: 2, bt: 3 }, { name: 'P4', at: 7, bt: 2 }], kind: 'tat', target: 'P3', question: 'Berapa Turnaround Time proses P3?' },
    { title: 'Kasus 6 · Rata-rata Waiting Time', processes: [{ name: 'P1', at: 0, bt: 4 }, { name: 'P2', at: 0, bt: 2 }, { name: 'P3', at: 3, bt: 5 }, { name: 'P4', at: 5, bt: 1 }], kind: 'wt', target: 'RATA', question: 'Berapa rata-rata Waiting Time keempat proses?' },
    { title: 'Kasus 7 · Urutan campuran', processes: [{ name: 'P1', at: 4, bt: 3 }, { name: 'P2', at: 0, bt: 5 }, { name: 'P3', at: 4, bt: 2 }, { name: 'P4', at: 1, bt: 4 }], kind: 'order', question: 'Bagaimana urutan eksekusi proses jika P1 dan P3 memiliki AT sama?' },
    { title: 'Kasus 8 · Completion Time', processes: [{ name: 'P1', at: 1, bt: 3 }, { name: 'P2', at: 1, bt: 5 }, { name: 'P3', at: 6, bt: 2 }, { name: 'P4', at: 6, bt: 4 }], kind: 'ct', target: 'P4', question: 'Berapa Completion Time proses P4?' },
    { title: 'Kasus 9 · Rata-rata TAT', processes: [{ name: 'P1', at: 0, bt: 3 }, { name: 'P2', at: 2, bt: 6 }, { name: 'P3', at: 2, bt: 2 }, { name: 'P4', at: 10, bt: 3 }], kind: 'tat', target: 'RATA', question: 'Hitung rata-rata Turnaround Time seluruh proses.' },
    { title: 'Kasus 10 · Analisis gabungan', processes: [{ name: 'P1', at: 2, bt: 5 }, { name: 'P2', at: 2, bt: 2 }, { name: 'P3', at: 6, bt: 4 }, { name: 'P4', at: 11, bt: 3 }, { name: 'P5', at: 11, bt: 2 }], kind: 'wt', target: 'P5', question: 'Berapa Waiting Time proses P5 setelah memperhatikan urutan kedatangan dan urutan input?' },
  ]
}

function buildQuestions(level: QuizLevel): QuizQuestion[] {
  return quizBanks[level].map((item) => {
    const ordered = [...item.processes].sort((a, b) => a.at - b.at || item.processes.indexOf(a) - item.processes.indexOf(b))
    let time = 0, idle = 0
    const rows = ordered.map((p) => { const start = Math.max(time, p.at); idle += Math.max(0, p.at - time); const ct = start + p.bt; const row = { ...p, start, ct, wt: start - p.at, tat: ct - p.at }; time = ct; return row })
    let value: number | string
    if (item.kind === 'order') value = ordered.map(p => p.name).join(' → ')
    else if (item.kind === 'idle') value = idle
    else if (item.target === 'RATA') value = item.kind === 'wt' ? rows.reduce((a, r) => a + r.wt, 0) / rows.length : rows.reduce((a, r) => a + r.tat, 0) / rows.length
    else { const row = rows.find(r => r.name === item.target)!; value = item.kind === 'wt' ? row.wt : item.kind === 'ct' ? row.ct : row.tat }
    const numeric = typeof value === 'number'
    let raw: (string | number)[]
    if (numeric) {
      raw = [value, Number((Number(value) + 1).toFixed(2)), Number(Math.max(0, Number(value) - 1).toFixed(2)), Number((Number(value) + 2).toFixed(2))]
    } else {
      const names = ordered.map(p => p.name)
      const permutations = (items: string[]): string[][] => items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [item, ...rest]))
      raw = [value, ...permutations(names).filter(order => order.join(' → ') !== value).slice(0, 3).map(order => order.join(' → '))]
    }
    const unique = [...new Set(raw.map(v => numeric ? Number(Number(v).toFixed(2)) : v))]
    const options = unique.slice(0, 4).sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }))
    const normalizedValue = numeric
      ? Number(Number(value).toFixed(2))
      : value

    const answer = options.findIndex(
      v => String(v) === String(normalizedValue)
    )
    const display = (v: string | number): string =>
      numeric ? `${v} satuan waktu` : String(v)
    const explanation = numeric
      ? item.kind === 'idle' ? `CPU mulai bekerja saat proses pertama datang. Jeda sebelum proses berikutnya membuat total waktu idle ${display(value)}.`
        : item.target === 'RATA' ? `Jumlahkan nilai ${item.kind === 'wt' ? 'Waiting Time' : 'Turnaround Time'} semua proses, lalu bagi dengan ${rows.length}. Hasilnya ${display(value)}.`
          : `Dengan FCFS, proses ${item.target} mulai pada t=${rows.find(r => r.name === item.target)!.start} dan selesai pada t=${rows.find(r => r.name === item.target)!.ct}. Hasil perhitungannya ${display(value)}.`
      : `FCFS melayani proses berdasarkan Arrival Time. Jika Arrival Time sama, urutan input menjadi penentu. Urutannya adalah ${value}.`
    return { ...item, options: options.map(display), answer, explanation }
  })
}



export default function App() {
  const [page, setPage] = useState<'home' | 'materi' | 'simulator' | 'hasil' | 'latihan'>('home')
  const [processes, setProcesses] = useState<ProcessInput[]>(initialProcesses)
  const [hasRun, setHasRun] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [quizLevel, setQuizLevel] = useState<QuizLevel>('easy')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizFinished, setQuizFinished] = useState(false)
  const quizQuestions = useMemo(() => buildQuestions(quizLevel), [quizLevel])
  const [error, setError] = useState('')
  const metricRef = useRef<HTMLDivElement>(null)

  const simulation = useMemo(() => {
    if (!processes.length || processes.some((p) => !Number.isInteger(p.at) || p.at < 0 || !Number.isInteger(p.bt) || p.bt < 1)) return null
    return calculateFCFS(processes)
  }, [processes])

  const invalidate = (next: ProcessInput[]) => {
    setProcesses(next)
    setHasRun(false)
    setIsPlaying(false)
    setCurrentStep(0)
    setError('')
  }

  useEffect(() => {
    if (!isPlaying || !simulation) return
    if (currentStep >= simulation.results.length - 1) {
      setIsPlaying(false)
      return
    }
    const timer = window.setTimeout(() => setCurrentStep((step) => step + 1), 1500)
    return () => window.clearTimeout(timer)
  }, [isPlaying, currentStep, simulation])

  useEffect(() => {
    if (hasRun && metricRef.current) {
      animate(metricRef.current.querySelectorAll('.metric-value'), {
        scale: [0.82, 1],
        opacity: [0, 1],
        delay: stagger(90),
        duration: 650,
        ease: 'outBack',
      })
    }
  }, [hasRun])

  const runSimulation = () => {
    if (!processes.length) return setError('Tambahkan minimal satu proses.')
    if (processes.some((p) => !Number.isInteger(p.at) || p.at < 0 || !Number.isInteger(p.bt) || p.bt < 1)) {
      return setError('Arrival Time harus bilangan bulat 0 atau lebih. Burst Time minimal 1.')
    }
    setError('')
    setCurrentStep(0)
    setHasRun(true)
    setIsPlaying(false)
    setPage('hasil')
  }

  const play = () => {
    if (!simulation) return
    if (currentStep >= simulation.results.length - 1) setCurrentStep(0)
    setIsPlaying(true)
  }

  const stepForward = () => {
    if (!simulation) return
    setIsPlaying(false)
    setCurrentStep((step) => Math.min(step + 1, simulation.results.length - 1))
  }

  const resetExample = () => {
    invalidate(initialProcesses.map((p) => ({ ...p })))
    setHasRun(true)
  }

  const addProcess = () => {
    if (processes.length >= 12) return setError('Maksimal 12 proses agar diagram tetap mudah dibaca.')
    const number = processes.length + 1
    invalidate([...processes, { id: `p${Date.now()}`, name: `P${number}`, at: 0, bt: 1 }])
  }

  const removeProcess = (id: string) => {
    const next = processes.filter((p) => p.id !== id).map((p, i) => ({ ...p, name: `P${i + 1}` }))
    invalidate(next)
  }

  const updateProcess = (id: string, field: 'at' | 'bt', value: string) => {
    const numeric = value === '' ? 0 : Number(value)
    invalidate(processes.map((p) => p.id === id ? { ...p, [field]: numeric } : p))
  }

  const currentQuiz = quizQuestions[quizIndex]
  const quizHasAnswered = quizAnswers[quizIndex] !== undefined
  const quizScore = quizQuestions.reduce(
    (total, question, index) => total + (quizAnswers[index] === question.answer ? 1 : 0),
    0
  )

  const answerQuiz = (optionIndex: number) => {
    if (quizHasAnswered || quizFinished) return
    setQuizAnswers((answers) => ({ ...answers, [quizIndex]: optionIndex }))
  }

  const continueQuiz = () => {
    if (!quizHasAnswered) return
    if (quizIndex === quizQuestions.length - 1) setQuizFinished(true)
    else setQuizIndex((index) => index + 1)
  }

  const restartQuiz = () => { setQuizIndex(0); setQuizAnswers({}); setQuizFinished(false) }
  const changeQuizLevel = (level: QuizLevel) => { setQuizLevel(level); setQuizIndex(0); setQuizAnswers({}); setQuizFinished(false) }

  const current = simulation?.results[currentStep]
  const waiting = simulation?.results.slice(currentStep + 1) ?? []
  const completed = simulation?.results.slice(0, currentStep) ?? []

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setPage("home")}><span className="brand-mark">F</span><span>FCFS <em>Learning Simulator</em></span></button>
        <nav>{[["home", "Beranda"], ["materi", "Materi"], ["simulator", "Simulator"], ["hasil", "Hasil"], ["latihan", "Latihan Soal"]].map(([key, label]) => <button key={key} className={page === key ? "nav-active" : ""} onClick={() => setPage(key as typeof page)}>{label}</button>)}</nav>
        <span className="team-tag">SISTEM OPERASI · KELOMPOK 5</span>
      </header>

      <main id="home">
        {page === "home" && <section className="hero-section">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: 'easeOut' }}>
            <div className="eyebrow"><span className="pulse-dot" /> MEDIA PEMBELAJARAN INTERAKTIF</div>
            <h1>Pahami cara kerja<br /><span>FCFS</span> dengan simulasi.</h1>
            <p>Pelajari bagaimana CPU melayani proses berdasarkan urutan kedatangan. Atur proses sendiri, jalankan simulasi, dan amati hasilnya secara langsung.</p>
            <div className="hero-actions"><button className="button primary-button" onClick={() => setPage("simulator")}>Mulai simulasi <ArrowRight size={15} /></button><button className="button soft-button" onClick={() => setPage("materi")}>Pelajari konsep</button></div>
            <div className="hero-note"><Check size={14} /> Bisa dicoba dengan data proses buatanmu sendiri</div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .94, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: .16, ...transition }}>
            <div className="visual-head"><span>CPU QUEUE</span><span className="live-indicator">● SIMULASI</span></div>
            <div className="hero-queue"><span>READY QUEUE</span><b className="hero-process orange-process">P1</b><b className="hero-process blue-process">P2</b><b className="hero-process neutral-process">P3</b></div>
            <div className="down-arrow"><ArrowDown size={22} /></div>
            <div className="hero-cpu"><div className="cpu-icon"><Cpu size={23} /></div><div><b>CPU</b><small>Menjalankan P1</small></div><span>RUNNING</span></div>
            <div className="visual-foot"><span>FIRST IN</span><i /><span>FIRST OUT</span></div>
          </motion.div>
          <div className="home-shortcuts">
            <button onClick={() => setPage("materi")}><BookOpen size={22} /><b>Pelajari Materi</b><span>Konsep dan rumus FCFS</span><ChevronRight size={17} /></button>
            <button onClick={() => setPage("simulator")}><Cpu size={22} /><b>Coba Simulator</b><span>Atur proses dan jalankan</span><ChevronRight size={17} /></button>
            <button onClick={() => { restartQuiz(); setPage("latihan") }}><CircleHelp size={22} /><b>Latihan Soal</b><span>Uji pemahaman dengan kasus</span><ChevronRight size={17} /></button>
          </div>
        </section>}

        {page === "materi" && <section className="section-block page-content" id="materi">
          <div className="section-heading"><div><div className="eyebrow">DASAR TEORI</div><h2>Apa itu FCFS?</h2></div><p>First Come First Served adalah algoritma penjadwalan CPU yang menjalankan proses sesuai urutan kedatangannya.</p></div>
          <div className="concept-grid">
            <motion.article className="concept-card" whileHover={{ y: -5 }} transition={transition}><span className="concept-number orange-bg">01</span><h3>First In, First Out</h3><p>Proses yang datang lebih dahulu akan mendapat giliran lebih dahulu.</p></motion.article>
            <motion.article className="concept-card" whileHover={{ y: -5 }} transition={transition}><span className="concept-number blue-bg">02</span><h3>Non-preemptive</h3><p>Proses yang sedang berjalan tidak dihentikan sampai proses tersebut selesai.</p></motion.article>
            <motion.article className="concept-card" whileHover={{ y: -5 }} transition={transition}><span className="concept-number green-bg">03</span><h3>Antrean Ready</h3><p>Proses yang belum mendapat CPU menunggu di belakang antrean.</p></motion.article>
          </div>
          <div className="formula-grid"><div><span>Completion Time</span><b>CT = Mulai + BT</b></div><div><span>Turnaround Time</span><b>TAT = CT − AT</b></div><div><span>Waiting Time</span><b>WT = TAT − BT</b></div><div><span>Response Time</span><b>RT = Mulai − AT</b></div></div>
        </section>}
        {page === "simulator" && <section className="section-block page-content" id="simulator">
          <div className="section-heading"><div><div className="eyebrow">COBA SENDIRI</div><h2>Simulator FCFS</h2></div><p>Masukkan data proses, lalu jalankan simulasi untuk melihat urutan eksekusi dan perhitungannya.</p></div>
          <div className="simulator-grid">
            <div className="panel input-panel">
              <div className="panel-heading"><div><span className="step-badge">01</span><h3>Data proses</h3></div><span className="muted-text">{processes.length} proses</span></div>
              <div className="table-scroll"><table className="process-table"><thead><tr><th>Proses</th><th>Arrival Time</th><th>Burst Time</th><th /></tr></thead><tbody>
                {processes.map((process) => <tr key={process.id}><td className="process-name">{process.name}</td><td><input aria-label={`Arrival Time ${process.name}`} type="number" min="0" step="1" value={process.at} onChange={(e) => updateProcess(process.id, 'at', e.target.value)} /></td><td><input aria-label={`Burst Time ${process.name}`} type="number" min="1" step="1" value={process.bt} onChange={(e) => updateProcess(process.id, 'bt', e.target.value)} /></td><td><button className="icon-button danger" aria-label={`Hapus ${process.name}`} onClick={() => removeProcess(process.id)}><Trash2 size={14} /></button></td></tr>)}
              </tbody></table></div>
              <div className="input-actions"><button className="button outline-button" onClick={addProcess}><Plus size={14} /> Tambah proses</button><button className="link-button" onClick={resetExample}>Muat contoh CJR</button></div>
              <div className="thin-divider" />
              <div className="run-actions"><button className="button primary-button stretch" onClick={runSimulation}>Jalankan simulasi <ArrowRight size={15} /></button><button className="button soft-button" onClick={resetExample}><RotateCcw size={14} /> Reset</button></div>
              <p className="helper-text">Jika dua proses memiliki waktu kedatangan sama, urutan input menjadi penentu. Proses dengan urutan input lebih awal dijalankan lebih dahulu.</p>
              {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="error-message">{error}</motion.div>}
            </div>

            <div className="panel rules-panel">
              <div className="panel-heading"><div><span className="step-badge blue-badge">02</span><h3>Aturan simulasi</h3></div><span className="status-tag">FCFS</span></div>
              <div className="rule-list">
                <div><i>1</i><p>Urutkan proses berdasarkan <b>Arrival Time</b>.</p></div>
                <div><i>2</i><p>Jika AT sama, gunakan urutan input sebagai penentu.</p></div>
                <div><i>3</i><p>Jalankan proses sampai selesai. CPU tidak melakukan interupsi.</p></div>
                <div><i>4</i><p>Jika belum ada proses yang datang, CPU berada dalam kondisi <b>idle</b>.</p></div>
              </div>
              <div className="tip-box"><Zap size={16} /><p><b>Perhatikan:</b> FCFS tidak memilih burst time terpendek. Urutan kedatangan tetap menjadi dasar pelayanan.</p></div>
            </div>
          </div>
        </section>}
        {page === "hasil" && <section className="section-block results-section page-content" id="hasil">
          <div className="section-heading"><div><div className="eyebrow">HASIL PERHITUNGAN</div><h2>Hasil simulasi</h2></div><span className="muted-text">{hasRun && simulation ? `${simulation.results.length} proses dianalisis` : 'Jalankan simulasi untuk melihat hasil'}</span></div>
          <AnimatePresence mode="wait">
            {!hasRun || !simulation ? (
              <motion.div className="empty-state" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Activity size={25} /><b>Belum ada hasil simulasi</b><span>Masukkan proses dan tekan tombol “Jalankan simulasi”.</span></motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
                <div className="metric-grid" ref={metricRef}>
                  <Metric label="Rata-rata Waiting Time" value={formatNumber(simulation.avgWT)} suffix="satuan waktu" />
                  <Metric label="Rata-rata Turnaround Time" value={formatNumber(simulation.avgTAT)} suffix="satuan waktu" />
                  <Metric label="CPU Utilization" value={`${formatNumber(simulation.cpuUtilization)}%`} suffix="persentase CPU sibuk" />
                  <Metric label="Throughput" value={formatNumber(simulation.throughput)} suffix="proses per satuan waktu" />
                </div>
                <div className="panel gantt-panel">
                  <div className="panel-heading"><div><span className="step-badge">03</span><h3>Diagram Gantt</h3></div><span className="muted-text">shadcn/ui Charts · Recharts</span></div>
                  <GanttChart segments={simulation.segments} />
                </div>
                <div className="panel queue-panel">
                  <div className="panel-heading"><div><span className="step-badge blue-badge">04</span><h3>Visualisasi antrean proses</h3></div><span className="muted-text">Motion.dev</span></div>
                  <div className="playback-bar">
                    <div><span className="playback-label">LANGKAH SIMULASI</span><b>{Math.min(currentStep + 1, simulation.results.length)} <small>/ {simulation.results.length}</small></b></div>
                    <div className="playback-controls">
                      <button className="button primary-button compact" onClick={play}><Play size={13} fill="currentColor" /> {isPlaying ? 'Berjalan...' : 'Play'}</button>
                      <button className="button outline-button compact" onClick={stepForward}><SkipForward size={13} /> Langkah</button>
                      <button className="icon-button" onClick={() => { setCurrentStep(0); setIsPlaying(false) }} aria-label="Ulangi simulasi"><RotateCcw size={14} /></button>
                    </div>
                  </div>
                  <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${((currentStep + 1) / simulation.results.length) * 100}%` }} /></div>
                  <ProcessQueue processes={processes} results={simulation.results} currentStep={currentStep} isPlaying={isPlaying} />
                  <div className="current-explanation"><span className="explain-icon"><Activity size={15} /></span><p>{current ? <><b>{current.name}</b> mulai pada waktu {current.start}, selesai pada waktu {current.ct}. {current.wt === 0 ? 'Proses tidak perlu menunggu.' : `Proses menunggu ${current.wt} satuan waktu.`}</> : 'Tekan Play atau Langkah untuk melihat proses.'}</p></div>
                </div>
                <div className="panel table-panel">
                  <div className="panel-heading"><div><span className="step-badge">05</span><h3>Tabel hasil per proses</h3></div><span className="muted-text">Satuan waktu</span></div>
                  <div className="table-scroll"><table className="result-table"><thead><tr><th>Proses</th><th>AT</th><th>BT</th><th>Mulai</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th></tr></thead><tbody>{simulation.results.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.at}</td><td>{p.bt}</td><td>{p.start}</td><td>{p.ct}</td><td>{p.tat}</td><td>{p.wt}</td><td>{p.rt}</td></tr>)}</tbody></table></div>
                </div>
                <div className="analysis-box"><b>Analisis hasil:</b> FCFS menjalankan proses berdasarkan urutan Arrival Time. {simulation.idleTime > 0 ? `CPU mengalami idle selama ${formatNumber(simulation.idleTime)} satuan waktu.` : 'Tidak terdapat waktu CPU idle.'} Rata-rata Waiting Time adalah {formatNumber(simulation.avgWT)} dan rata-rata Turnaround Time adalah {formatNumber(simulation.avgTAT)}. Pada FCFS non-preemptive, Response Time sama dengan Waiting Time.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>}
        {page === "latihan" && <section className="quiz-section page-content" id="kuis">
          <div className="quiz-intro">
            <div className="eyebrow">LATIHAN SOAL FCFS</div>
            <h2>Latih pemahamanmu, satu level demi satu level.</h2>
            <p>Pilih tingkat kesulitan. Setiap soal berisi studi kasus, pilihan jawaban, dan pembahasan setelah kamu menjawab.</p>
            <div className="quiz-levels">
              {([{ id: 'easy', name: 'Easy', count: 5, desc: 'Kenali konsep dasar', tone: 'easy' }, { id: 'medium', name: 'Medium', count: 10, desc: 'Latihan perhitungan', tone: 'medium' }, { id: 'hard', name: 'Hard', count: 10, desc: 'Kasus campuran', tone: 'hard' }] as const).map(level => <button key={level.id} className={`quiz-level-card ${level.tone} ${quizLevel === level.id ? 'level-active' : ''}`} onClick={() => changeQuizLevel(level.id)}><span className="level-topline">{level.name}</span><b>{level.count} soal</b><small>{level.desc}</small></button>)}
            </div>
          </div>

          <div className="quiz-card">
            {!quizFinished ? (
              <>
                <div className="quiz-progress-heading">
                  <span>{quizLevel.toUpperCase()} · SOAL {quizIndex + 1} DARI {quizQuestions.length}</span>
                  <b>{Math.round(((quizIndex + 1) / quizQuestions.length) * 100)}%</b>
                </div>
                <div className="quiz-progress"><span style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} /></div>
                <div className="quiz-question-meta"><span className="quiz-question-number">{String(quizIndex + 1).padStart(2, '0')}</span><span>PERTANYAAN LATIHAN</span></div>
                <div className="quiz-case">
                  <div className="quiz-case-title"><b>{currentQuiz.title}</b><span>DATA PROSES</span></div>
                  <div className="table-scroll"><table className="process-table quiz-data-table"><thead><tr><th>Proses</th><th>Arrival Time</th><th>Burst Time</th></tr></thead><tbody>
                    {currentQuiz.processes.map((process) => <tr key={process.name}><td className="process-name">{process.name}</td><td>{process.at}</td><td>{process.bt}</td></tr>)}
                  </tbody></table></div>
                  <div className="quiz-case-note">Gunakan aturan FCFS untuk menyelesaikan kasus di atas.</div>
                </div>
                <h3 className="quiz-question">{currentQuiz.question}</h3>
                <div className="quiz-options">
                  {currentQuiz.options.map((option, optionIndex) => {
                    const selected = quizAnswers[quizIndex] === optionIndex
                    const isCorrect = currentQuiz.answer === optionIndex
                    const optionClass = quizHasAnswered && isCorrect
                      ? 'quiz-option quiz-option-correct'
                      : quizHasAnswered && selected
                        ? 'quiz-option quiz-option-wrong'
                        : selected
                          ? 'quiz-option quiz-option-selected'
                          : 'quiz-option'
                    return (
                      <button
                        type="button"
                        key={option}
                        className={optionClass}
                        onClick={() => answerQuiz(optionIndex)}
                        disabled={quizHasAnswered}
                      >
                        <span className="quiz-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        <span className="quiz-option-text">{option}</span>
                        {quizHasAnswered && isCorrect && <Check size={18} />}
                      </button>
                    )
                  })}
                </div>
                {quizHasAnswered && (
                  <motion.div
                    className={`quiz-explanation ${quizAnswers[quizIndex] === currentQuiz.answer ? 'explanation-correct' : 'explanation-wrong'}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <b>{quizAnswers[quizIndex] === currentQuiz.answer ? 'Jawaban benar!' : 'Jawaban belum tepat'}</b>
                    <p>{currentQuiz.explanation}</p>
                  </motion.div>
                )}
                <div className="quiz-card-footer">
                  <span>{Object.keys(quizAnswers).length} dari {quizQuestions.length} soal dijawab</span>
                  <button className="button primary-button" type="button" onClick={continueQuiz} disabled={!quizHasAnswered}>
                    {quizIndex === quizQuestions.length - 1 ? 'Lihat nilai' : 'Soal berikutnya'} <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <motion.div className="quiz-result" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="quiz-result-icon"><Check size={28} /></div>
                <span className="quiz-result-label">LATIHAN SELESAI</span>
                <h3>{quizScore} dari {quizQuestions.length} jawaban benar</h3>
                <div className="quiz-score-track"><span style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }} /></div>
                <p>{quizScore === quizQuestions.length ? 'Hebat! Semua jawabanmu benar.' : quizScore >= quizQuestions.length * .7 ? 'Hasil bagus. Tinjau pembahasan untuk memperkuat pemahamanmu.' : 'Terus berlatih. Pelajari kembali konsep dan rumus FCFS, lalu coba lagi.'}</p>
                <button className="button primary-button" type="button" onClick={restartQuiz}><RotateCcw size={16} /> Ulangi latihan</button>
              </motion.div>
            )}
          </div>
        </section>}
      </main>
      <footer><button className="brand brand-button" onClick={() => setPage("home")}><span className="brand-mark">F</span><span>FCFS <em>Learning Simulator</em></span></button><span>Media Pembelajaran Sistem Operasi · Kelompok 5 · UNIMED 2026</span></footer>
    </div>
  )
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return <div className="metric-card"><span>{label}</span><b className="metric-value">{value}</b><small>{suffix}</small></div>
}