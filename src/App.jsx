import { useEffect, useRef, useState } from 'react'
import { config } from './config.js'
import { hasHost, readUrlParams, send, listen } from './bridge.js'

function Toast({ className }) {
  return (
    <svg className={className} viewBox="-32 -48 64 84" aria-hidden="true">
      <path d="M-28 -20 Q-28 -38 -12 -34 Q0 -44 12 -34 Q28 -38 28 -20 L28 24 Q28 32 20 32 L-20 32 Q-28 32 -28 24 Z" fill="#e9b56b" stroke="#a86a2c" strokeWidth="3" />
      <path d="M-19 -14 Q-19 -27 -8 -24 Q0 -32 8 -24 Q19 -27 19 -14 L19 18 Q19 23 14 23 L-14 23 Q-19 23 -19 18 Z" fill="#c8324a" />
      <circle cx="-6" cy="-6" r="3" fill="#e8657a" /><circle cx="8" cy="6" r="2.5" fill="#e8657a" />
    </svg>
  )
}

export default function App() {
  const [dev, setDev] = useState(false)
  const [init, setInit] = useState(null)
  const [log, setLog] = useState([])
  const [done, setDone] = useState(false)
  const started = useRef(Date.now())
  const urlParams = readUrlParams()

  const push = (dir, msg, origin) =>
    setLog((l) => [{ t: new Date().toLocaleTimeString('cs-CZ'), dir, msg, origin }, ...l].slice(0, 30))

  useEffect(() => {
    const stop = listen((msg, origin) => {
      push('in', msg, origin)
      if (msg.type === 'minigame:init') setInit(msg)
    })
    push('out', send('ready', { version: config.version }))
    return stop
  }, [])

  const sessionId = init?.sessionId ?? urlParams.sessionId ?? null

  const finish = () => {
    const score = Math.round(config.maxScore * (0.5 + Math.random() * 0.5))
    push('out', send('finished', { sessionId, score, maxScore: config.maxScore, durationMs: Date.now() - started.current }))
    setDone(true)
  }
  const abort = () => {
    push('out', send('aborted', { sessionId, reason: 'test' }))
    setDone(true)
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="toasts">
          <Toast className="toast t1" /><Toast className="toast t2" /><Toast className="toast t3" />
        </div>
        <p className="topic">{config.topic}</p>
        <h1>{config.name}</h1>
        <p className="teaser">{config.teaser}</p>
        <p className="status">Minihra se právě staví. Počítáme s ní na {config.expected}.</p>
        {done && <p className="done">Testovací výsledek byl odeslán hlavní hře.</p>}
      </section>

      <footer className="foot">
        <button type="button" className="devlink" onClick={() => setDev((d) => !d)} aria-expanded={dev}>
          {dev ? 'Skrýt technické informace' : 'Technické informace'}
        </button>
        <span className="ver">{config.id} · {config.version}</span>
      </footer>

      {dev && (
        <section className="dev" aria-label="Informace pro vývojáře">
          <div className="devrow">
            <div>
              <h2>Napojení na hlavní hru</h2>
              <p>{hasHost() ? 'Běží v iframe, host je připojen.' : 'Otevřeno samostatně, bez hosta. Zprávy se jen logují.'}</p>
            </div>
            <div className="actions">
              <button type="button" className="primary" onClick={finish}>Dokončit s testovacím skóre</button>
              <button type="button" onClick={abort}>Přerušit</button>
            </div>
          </div>

          <div className="devgrid">
            <div>
              <h3>Přijato přes postMessage (minigame:init)</h3>
              <pre>{init ? JSON.stringify(init, null, 2) : 'zatím nic'}</pre>
            </div>
            <div>
              <h3>Parametry z URL</h3>
              <pre>{Object.keys(urlParams).length ? JSON.stringify(urlParams, null, 2) : 'žádné'}</pre>
            </div>
          </div>

          <h3>Protokol</h3>
          <pre>{`host → minihra   minigame:init      { sessionId, playerId, lang, difficulty }
minihra → host   minigame:ready     { id, version }
minihra → host   minigame:finished  { id, sessionId, score, maxScore, durationMs }
minihra → host   minigame:aborted   { id, sessionId, reason }`}</pre>

          <h3>Log zpráv</h3>
          <ol className="log">
            {log.map((e, i) => (
              <li key={i}>
                <span className="t">{e.t}</span>
                <span className={'dir ' + e.dir}>{e.dir === 'in' ? 'host → ' : '→ host'}</span>
                <code>{JSON.stringify(e.msg)}</code>
                {e.origin && <span className="origin">{e.origin}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  )
}
