export type ProcessInput = {
  id: string
  name: string
  at: number
  bt: number
}

export type ProcessResult = ProcessInput & {
  start: number
  ct: number
  tat: number
  wt: number
  rt: number
  inputOrder: number
}

export type Segment = {
  name: string
  start: number
  end: number
  duration: number
  type: 'process' | 'idle'
  color: string
}
