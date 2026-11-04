# Minigame placeholder

Stand-in for a CSpA minigame that is not built yet. Students see "Minihra ještě není hotová" (the game is not finished yet); the host-game developer can open the "Pro vývojáře" panel from the footer, see the INIT the host sent, and send a test FINISH or ERROR back. When the real minigame is ready, it replaces this code in the same repo and the URL stays the same.

## New minigame from this template

1. Create a repo under the cspadev account named exactly as the minigame ID from the
   Minihry overview (e.g. `0_cafe_mini_atitude`).
2. Copy this folder into it and edit `src/config.js`: `id`, `name`, `teaser`, `topic`, `expected`.
3. Commit and push to `main`.
4. In Vercel (cspadev): Add New → Project → Import the repo. Keep the defaults (framework: Vite).
   Name the project after the ID in lowercase with hyphens (e.g. `0-cafe-mini-atitude`):
   the address `https://<project>.vercel.app` cannot contain underscores.
   Once the host's address is known, add the environment variable
   `VITE_ALLOWED_PARENT_ORIGINS=https://<host-domain>` and redeploy.
5. Add the address to the Minihry overview and send it to the host-game developer. Every push to `main` redeploys it.

## Run locally

```
npm install
npm run dev
```

Opened outside an iframe, the placeholder takes INIT from the URL: `?level=2&payload={"a":1}`.

## Protocol with the host game (version 1)

Same contract as `packages/protokol` and `docs/protokol.md` in the minihry repo. The minigame runs inside an `<iframe>`; messages go through `window.postMessage`.

```
host game                          minigame
    |  <-------- READY -------------- |   loaded
    |  --------- INIT --------------> |   level + payload
    |  <-------- FINISH ------------- |   result
    |      or                         |
    |  <-------- ERROR -------------- |   cannot be played
```

| message | direction | fields |
| --- | --- | --- |
| `READY` | minigame → host | `{ type, version: 1 }` |
| `INIT` | host → minigame | `{ type, version?, level?, payload? }` |
| `FINISH` | minigame → host | `{ type, version: 1, successRate, succesRate, payload? }` |
| `ERROR` | minigame → host | `{ type, version: 1, code, message }` |

- `successRate` is 0–1. `succesRate` (typo from the developer's sorter_demo) carries the same value until the host switches to the correct name.
- `ERROR.code`: `MISSING_PAYLOAD`, `INVALID_PAYLOAD`, `INVALID_RESULT`, `INTERNAL`.
- The host may send a new `INIT` at any time, also after `FINISH`; the minigame starts again.
- The placeholder sends `FINISH` with `payload: { placeholder: true, id }` so the host can tell a test result from a real one.

Security: the minigame accepts messages only from its parent window, optionally only from `VITE_ALLOWED_PARENT_ORIGINS`, and after the first INIT replies only to that origin.
