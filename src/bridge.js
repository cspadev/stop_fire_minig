// Protocol between the host game and a minigame running in an iframe (version 1).
// Same contract as packages/protokol and docs/protokol.md in zimmerp-vse/minihry;
// change it there first, then here.
//
//   minigame -> host   { type: "READY",  version: 1 }
//   host -> minigame   { type: "INIT",   version?, level?, payload? }
//   minigame -> host   { type: "FINISH", version: 1, successRate, succesRate, payload? }
//   minigame -> host   { type: "ERROR",  version: 1, code, message }
//
// successRate is 0–1. succesRate (typo) carries the same value until the host
// switches to the correct name. ERROR codes: MISSING_PAYLOAD, INVALID_PAYLOAD,
// INVALID_RESULT, INTERNAL.
//
// Opened standalone (not in an iframe), INIT is taken from the URL: ?level=2&payload={"a":1}

export const PROTOCOL_VERSION = 1

// Host origins allowed to talk to the minigame, comma separated. Set as the Vercel
// environment variable VITE_ALLOWED_PARENT_ORIGINS. Empty = accept any parent (dev).
const allowedOrigins = (import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Origin of the first valid INIT; replies then go only there.
let parentOrigin = null

export function isEmbedded() {
  return window.parent !== window
}

function post(message) {
  if (isEmbedded()) {
    const target = parentOrigin ?? (allowedOrigins.length === 1 ? allowedOrigins[0] : '*')
    window.parent.postMessage(message, target)
  }
  return message
}

// Returns the INIT message if the event is a valid INIT from the parent window, else null.
export function readInit(event) {
  if (event.source !== window.parent) return null
  if (allowedOrigins.length && !allowedOrigins.includes(event.origin)) {
    console.warn('[minigame] ignoring message from origin', event.origin)
    return null
  }
  const d = event.data
  if (!d || typeof d !== 'object' || d.type !== 'INIT') return null
  if (event.origin !== 'null') parentOrigin = event.origin
  return d
}

export function initFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const init = { type: 'INIT' }
  const level = params.get('level')
  if (level !== null) init.level = Number(level)
  const payload = params.get('payload')
  if (payload !== null) {
    try { init.payload = JSON.parse(payload) } catch { init.payload = payload }
  }
  return init
}

export function sendReady() {
  return post({ type: 'READY', version: PROTOCOL_VERSION })
}

// Non-finite values go out as ERROR INVALID_RESULT; values outside 0–1 are clamped.
export function sendFinish(successRate, payload) {
  if (typeof successRate !== 'number' || !Number.isFinite(successRate)) {
    return sendError('INVALID_RESULT', `Invalid successRate: ${String(successRate)}`)
  }
  const rate = Math.min(1, Math.max(0, successRate))
  return post({
    type: 'FINISH',
    version: PROTOCOL_VERSION,
    successRate: rate,
    succesRate: rate,
    ...(payload !== undefined && { payload }),
  })
}

export function sendError(code, message) {
  return post({ type: 'ERROR', version: PROTOCOL_VERSION, code, message })
}
