# Game Developer Integration Guide

Simple guide for integrating your game with the Provider platform.

**API base URL:** `https://api.dpbossking.com/api/v1`

---

## 1. Big picture (30 seconds)

```
Operator launches player
        ↓
Your game opens with ?sessionToken=... in the URL
        ↓
Game CLIENT  →  validate session + track events
        ↓
Game SERVER  →  debit / credit / balance (real money)
        ↓
Provider     →  talks to operator wallet
```

**Two parts — never mix them:**

| Part | Runs where | Does what |
|------|------------|-----------|
| **Client** | Browser / game UI | Session + lifecycle events |
| **Server** | Your backend (Python, Java, Node, etc.) | Wallet: balance, debit, credit |

> Wallet must **never** run in the browser. Attackers can change JavaScript.  
> Your game server calls wallet APIs with a secret key.

---

## 2. Before you start (checklist)

Your platform admin must already have:

- [ ] Game registered with a `launchUrl` (where your game loads)
- [ ] Operator created and games enabled for that operator
- [ ] Operator integration saved on Provider (`opa.dpbossking.com`)
- [ ] Player launch working → URL contains `?sessionToken=...`

You need from admin:

- `operatorId` (e.g. `AAKDA-001`) — comes from session after validate
- `GAME_SERVER_API_KEY` — for your game server only (never in frontend)

---

## 3. Integration flow (step by step)

### Step 1 — Player arrives at your game

Operator redirects the player to:

```
https://your-game.com/?sessionToken=a1b2c3d4e5f6...
```

**You get:** only `sessionToken` in the URL.  
**You do NOT get:** `playerId`, `operatorId`, or balance in the URL.

---

### Step 2 — Validate session (client — first call)

Confirm the token is valid and load player info.

**SDK (web games):**

```javascript
import { ProviderGameSDK } from "@gamotech/game-sdk";

const sdk = new ProviderGameSDK({
  apiBaseUrl: "https://api.dpbossking.com/api/v1",
});

const session = await sdk.initFromUrl();
```

**Or REST:**

```http
POST /api/v1/sessions/validate
{ "sessionToken": "a1b2c3d4..." }
```

**You receive:**

```json
{
  "playerId": "P1001",
  "playerUsername": "john_doe",
  "operatorId": "AAKDA-001",
  "gameCode": "TEENPATTI",
  "currency": "INR",
  "status": "ACTIVE"
}
```

Use these values in your game UI. **Do not trust data from the URL.**

If validate fails → show error screen, do not start the game.

---

### Step 3 — Tell Provider the game started (client — events)

Send lifecycle events so Provider can track the session.

```javascript
await sdk.createTable({});                    // TABLE_CREATED
await sdk.createRound({ roundId: "round_1" }); // ROUND_CREATED
await sdk.startRound({ roundId: "round_1" });  // ROUND_STARTED
```

**Or REST:**

```http
POST /api/v1/sessions/events
{
  "sessionToken": "...",
  "event": "ROUND_STARTED",
  "roundId": "round_1"
}
```

These are **tracking events** — not wallet calls.

---

### Step 4 — Player places a bet (client → your server)

Browser calls **your** game API — not Provider wallet directly.

```javascript
await fetch("https://your-game-api.com/bet", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionToken: sdk.sessionToken,
    amount: 100,
    roundId: "round_1",
    transactionId: "debit_round_1",  // unique per debit
  }),
});
```

---

### Step 5 — Debit wallet (your server only)

Your server validates the bet (round exists, amount OK, not already debited), then calls Provider:

```http
POST /api/v1/adapters/debit
X-Game-Server-Key: your-secret-key
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "sessionToken": "...",
  "amount": 100,
  "transactionId": "debit_round_1",
  "roundId": "round_1"
}
```

Provider validates session, resolves `operatorId` and `playerId` from the session, then debits the operator wallet.

---

### Step 6 — Run your game logic

Cards, slots, rounds — whatever your game does.  
This runs on **your game server** (WebSocket, REST, etc.).

---

### Step 7 — Player wins → credit (your server only)

```http
POST /api/v1/adapters/credit
X-Game-Server-Key: your-secret-key
Authorization: Bearer {sessionToken}

{
  "sessionToken": "...",
  "amount": 200,
  "transactionId": "credit_round_1",
  "roundId": "round_1"
}
```

Use a **new unique** `transactionId` for every debit and credit.

---

### Step 8 — End round and session (client)

```javascript
await sdk.endRound({ roundId: "round_1", result: "WIN" });
await sdk.endSession({ reason: "PLAYER_LEFT" });
sdk.attachUnloadHandler(); // auto end on tab close
```

---

## 4. Flow diagram

```
┌──────────────┐
│   OPERATOR   │  POST /launch → launchUrl?sessionToken=...
└──────┬───────┘
       ▼
┌──────────────┐
│ GAME CLIENT  │
│              │  ① initFromUrl()        → validate session
│  (browser)   │  ② createTable/Round    → session events
│              │  ③ POST /your-api/bet   → ask server to debit
│              │  ⑧ endRound/endSession → session events
└──────┬───────┘
       │ your API
       ▼
┌──────────────┐
│ GAME SERVER  │
│              │  ④ validate bet rules
│  (any lang)  │  ⑤ POST .../debit       → Provider wallet
│              │  ⑥ game logic
│              │  ⑦ POST .../credit      → Provider wallet
└──────┬───────┘
       │ X-Game-Server-Key + sessionToken
       ▼
┌──────────────┐
│   PROVIDER   │  Session Service + Operator Adapter
└──────┬───────┘
       ▼
┌──────────────┐
│  OPERATOR    │  Real wallet (balance, debit, credit)
└──────────────┘
```

---

## 5. What to use (by role)

### Game client (frontend)

| Do | Don't |
|----|-------|
| Validate session | Call debit/credit |
| Send session events | Put server secret in frontend |
| Call your game server for bets | Trust URL params for playerId |

**Tool:** `@gamotech/game-sdk` (client) or REST

### Game server (backend)

| Do | Don't |
|----|-------|
| Validate game rules before wallet | Expose `GAME_SERVER_API_KEY` to client |
| Call Provider debit/credit/balance | Skip sessionToken on wallet calls |
| Use unique `transactionId` per operation | Reuse same transactionId |

**Tool:** REST in any language (Python, Java, Node, Go, …)  
**Optional:** `@gamotech/game-sdk/server` for Node only

---

## 6. API quick reference

### Client APIs (no secret needed)

| Action | Method | Path |
|--------|--------|------|
| Validate session | POST | `/sessions/validate` |
| Send event | POST | `/sessions/events` |

### Server APIs (need `X-Game-Server-Key`)

| Action | Method | Path |
|--------|--------|------|
| Get balance | POST | `/adapters/balance` |
| Debit | POST | `/adapters/debit` |
| Credit | POST | `/adapters/credit` |
| Player profile | POST | `/adapters/player-profile` |

`operatorId` is resolved from `sessionToken` — do not pass it in the URL.

---

## 7. Install SDK (web games only)

```bash
npm install @gamotech/game-sdk
```

```javascript
// Client (browser)
import { ProviderGameSDK } from "@gamotech/game-sdk";

// Server (Node only — optional)
import { ProviderGameServerSDK } from "@gamotech/game-sdk/server";
```

Non-JavaScript backends: use REST only (see section 8).

---

## 8. Server examples (pick your stack)

### Node / Express (MERN)

```javascript
const response = await fetch(
  `${PROVIDER_API}/adapters/debit`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Game-Server-Key": process.env.GAME_SERVER_API_KEY,
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ sessionToken, amount, transactionId, roundId }),
  }
);
```

### Python

```python
requests.post(
    f"{PROVIDER_API}/adapters/debit",
    json={"sessionToken": token, "amount": 100, "transactionId": "tx_1", "roundId": "r1"},
    headers={
        "X-Game-Server-Key": GAME_SERVER_KEY,
        "Authorization": f"Bearer {token}",
    },
)
```

### Java

```java
headers.set("X-Game-Server-Key", gameServerApiKey);
headers.setBearerAuth(sessionToken);
restTemplate.postForEntity(providerApi + "/adapters/debit", body, Map.class);
```

---

## 9. Environment variables

**Game client** (safe to expose):

```env
NEXT_PUBLIC_PROVIDER_API_URL=https://api.dpbossking.com/api/v1
```

**Game server** (keep secret):

```env
PROVIDER_API_URL=https://api.dpbossking.com/api/v1
GAME_SERVER_API_KEY=your-long-random-secret
```

**Must match** the same `GAME_SERVER_API_KEY` set on Operator Adapter (`opa.dpbossking.com`).

---

## 10. Rules (remember these)

1. **Validate session first** — before any gameplay.
2. **Wallet = server only** — debit, credit, balance never in browser.
3. **One sessionToken per launch** — read from URL query param.
4. **Unique transactionId** — every debit and credit gets its own id.
5. **Events ≠ wallet** — `ROUND_STARTED` is tracking; debit is money.
6. **End session** — call `SESSION_ENDED` when player leaves.
7. **Any backend language** — wallet is REST; SDK is optional for Node/web.

---

## 11. Common errors

| Error | Fix |
|-------|-----|
| Missing sessionToken | Player must come from operator launch URL |
| 401 on wallet | Missing or wrong `X-Game-Server-Key` |
| 404 integration | Admin must create operator integration on OPA for session's operator |
| Session expired | Player must re-launch from operator |

---

## 12. Related docs

- [game-integration.md](./game-integration.md) — full platform flow (operator + launch + session)
- [operator-adapter.md](./operator-adapter.md) — operator wallet config
- [session-service.md](./session-service.md) — session events detail

---

## 13. Minimal copy-paste starter (web game)

```javascript
import { ProviderGameSDK } from "@gamotech/game-sdk";

const sdk = new ProviderGameSDK({
  apiBaseUrl: "https://api.dpbossking.com/api/v1",
});

async function main() {
  const session = await sdk.initFromUrl();
  sdk.attachUnloadHandler();

  console.log("Player:", session.playerUsername, session.currency);

  await sdk.createTable({});
  const roundId = await sdk.createRound({});

  // Bet → your server handles debit
  const res = await fetch("/api/bet", {
    method: "POST",
    body: JSON.stringify({
      sessionToken: sdk.sessionToken,
      operatorId: sdk.operatorId,
      amount: 100,
      roundId,
      transactionId: `debit_${roundId}`,
    }),
  });

  if (!res.ok) throw new Error("Bet failed");

  await sdk.startRound({ roundId, betAmount: 100 });

  // ... your game ...

  await sdk.endRound({ roundId, result: "WIN" });
}

main().catch((err) => alert(err.message));
```

Your `/api/bet` route (server) calls Provider `/adapters/debit` with `sessionToken` + `GAME_SERVER_API_KEY`.
