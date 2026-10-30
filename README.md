# Minigame placeholder

Stand-in for a CSpA minigame that is not built yet. Students see "under construction"; the host-game developer can open the technical panel from the footer, see what the host sent, and send a test result back. When the real minigame is ready, it replaces this code in the same repo and the URL stays the same.

## New minigame from this template

1. Copy this folder (or use GitHub's "Use this template") into a new repo named `minihra-<id>`.
2. Edit `src/config.js`: `id`, `name`, `teaser`, `topic`, `expected`.
3. Commit and push to GitHub under the cspadev account.
4. In Vercel (cspadev): Add New → Project → Import the repo. Keep defaults (framework: Vite).
   The stable address is `https://<project-name>.vercel.app`. Name the Vercel project
   the same as the repo so it stays recognisable.
5. Send that address to the host-game developer. Every push to `main` redeploys it.

## Run locally

```
npm install
npm run dev
```

## Protocol with the host game

The minigame runs inside an `<iframe>` in the host. Messages go through `window.postMessage`; every message is an object with a `type` string starting with `minigame:`.

| direction | type | payload |
| --- | --- | --- |
| host → minigame | `minigame:init` | `{ sessionId, playerId, lang, difficulty, ... }` |
| minigame → host | `minigame:ready` | `{ id, version }` |
| minigame → host | `minigame:finished` | `{ id, sessionId, score, maxScore, durationMs }` |
| minigame → host | `minigame:aborted` | `{ id, sessionId, reason }` |

Flow: the host loads the iframe → the minigame posts `ready` → the host posts `init` → the minigame plays → the minigame posts `finished` (or `aborted`) → the host closes the iframe and records the score.

Launch parameters may also be passed as URL query params (`?sessionId=..&playerId=..&lang=cs`) if the host prefers; the placeholder shows both.

Host-side sketch:

```js
const frame = document.querySelector('iframe')
window.addEventListener('message', (e) => {
  const m = e.data
  if (!m || typeof m.type !== 'string') return
  if (m.type === 'minigame:ready') {
    frame.contentWindow.postMessage({ type: 'minigame:init', sessionId, playerId, lang: 'cs', difficulty: 1 }, '*')
  }
  if (m.type === 'minigame:finished') saveScore(m)
  if (m.type === 'minigame:aborted') closeMinigame()
})
```

Replace `'*'` with the exact origins once both sides are deployed.

This protocol is a proposal; change it in `src/bridge.js` and here if the host already has a different contract.
