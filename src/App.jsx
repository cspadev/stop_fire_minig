import { useEffect, useRef, useState } from 'react'
import { config } from './config.js'
import { hasHost, readUrlParams, send, listen } from './bridge.js'

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
        <img className="ship" src="/navis-actuaria.png" alt="" width="242" height="181" />
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
        <span className="ver">{config.id} {config.version}</span>
        <img className="wordmark" src="/actuaria-logo.svg" alt="Actuaria" width="176" height="21" />
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
