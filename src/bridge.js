// Protocol between the master game (host) and a minigame running in an iframe.
// Every message is a plain object with a `type` field prefixed "minigame:".
//
//   host  -> minigame   minigame:init      { sessionId, playerId, lang, difficulty, ... }
//   minigame -> host    minigame:ready     { id, version }
//   minigame -> host    minigame:finished  { id, sessionId, score, maxScore, durationMs }
//   minigame -> host    minigame:aborted   { id, sessionId, reason }
//
// Launch parameters may also arrive as URL query params (?playerId=..&lang=cs),
// which is handy when the host prefers a plain redirect over postMessage.

import { config } from './config.js'

const PREFIX = 'minigame:'

export function hasHost() {
  return window.parent && window.parent !== window
}

export function readUrlParams() {
  const out = {}
  new URLSearchParams(window.location.search).forEach((v, k) => { out[k] = v })
  return out
}

export function send(type, payload = {}) {
  const msg = { type: PREFIX + type, id: config.id, ...payload }
  if (hasHost()) window.parent.postMessage(msg, '*')
  return msg
}

// Calls onMessage(msg, origin) for every host message addressed to minigames.
export function listen(onMessage) {
  const handler = (e) => {
    const d = e.data
    if (d && typeof d.type === 'string' && d.type.startsWith(PREFIX)) onMessage(d, e.origin)
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}
