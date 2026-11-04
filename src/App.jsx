import { useEffect, useState } from 'react'
import { config } from './config.js'
import { isEmbedded, readInit, initFromUrl, sendReady, sendFinish, sendError } from './bridge.js'

// READY goes out once per page load (React StrictMode runs effects twice in dev).
let readySent = false

export default function App() {
  const embedded = isEmbedded()
  const [dev, setDev] = useState(false)
  const [init, setInit] = useState(() => (embedded ? null : initFromUrl()))
  const [log, setLog] = useState([])
  const [done, setDone] = useState(false)
  const [rate, setRate] = useState('0.8')

  const push = (dir, msg, origin) =>
    setLog((l) => [{ t: new Date().toLocaleTimeString('cs-CZ'), dir, msg, origin }, ...l].slice(0, 30))

  useEffect(() => {
    if (!embedded) return
    const listener = (e) => {
      const msg = readInit(e)
      if (!msg) return
      push('in', msg, e.origin)
      // A new INIT starts a new round, even after FINISH.
      setInit(msg)
      setDone(false)
    }
    window.addEventListener('message', listener)
    if (!readySent) {
      readySent = true
      push('out', sendReady())
    }
    return () => window.removeEventListener('message', listener)
  }, [embedded])

  const finish = () => {
    push('out', sendFinish(Number(rate.replace(',', '.')), { placeholder: true, id: config.id }))
    setDone(true)
  }
  const fail = () => {
    push('out', sendError('INTERNAL', `Placeholder ${config.id}: test error`))
    setDone(true)
  }

  return (
    <main className="page">
      <section className="hero">
        <img className="ship" src="/navis-actuaria.png" alt="" width="242" height="181" />
        <p className="topic">{config.topic}</p>
        <h1>{config.name}</h1>
        <p className="teaser">{config.teaser}</p>
        <p className="status">Minihra ještě není hotová, zatím ji nejde hrát.{config.expected && ` Počítáme s ní na ${config.expected}.`}</p>
        {done && <p className="done">Testovací výsledek byl odeslán hlavní hře.</p>}
      </section>

      <footer className="foot">
        <button type="button" className="devlink" onClick={() => setDev((d) => !d)} aria-expanded={dev}>
          {dev ? 'Skrýt informace pro vývojáře' : 'Pro vývojáře'}
        </button>
        <span className="ver">{config.id} {config.version}</span>
        <img className="wordmark" src="/actuaria-logo.svg" alt="Actuaria" width="176" height="21" />
      </footer>

      {dev && (
        <section className="dev" aria-label="Informace pro vývojáře">
          <div className="devrow">
            <div>
              <h2>Napojení na hlavní hru</h2>
              <p>{embedded ? 'Běží v iframe, host je připojen.' : 'Otevřeno samostatně, bez hosta. INIT se bere z URL (?level=2&payload={…}), zprávy se jen logují.'}</p>
            </div>
            <div className="actions">
              <label className="rate">
                successRate
                <input type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
              </label>
              <button type="button" className="primary" onClick={finish}>Odeslat FINISH</button>
              <button type="button" onClick={fail}>Odeslat ERROR</button>
            </div>
          </div>

          <div>
            <h3>Přijatý INIT{embedded ? '' : ' (z URL)'}</h3>
            <pre>{init ? JSON.stringify(init, null, 2) : 'zatím nic'}</pre>
          </div>

          <h3>Protokol (verze 1)</h3>
          <pre>{`minihra → host   { type: "READY",  version: 1 }
host → minihra   { type: "INIT",   version?, level?, payload? }
minihra → host   { type: "FINISH", version: 1, successRate (0–1), succesRate, payload? }
minihra → host   { type: "ERROR",  version: 1, code, message }`}</pre>

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
