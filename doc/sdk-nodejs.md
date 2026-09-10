# Node.js SDK (Game Server)

**Package:** `@gamotech/game-sdk-nodejs`  
**Folder:** `sdks/nodejs/`  
**Runs on:** Node.js 18+ game server (Express, Fastify, etc.)

**API base URL:** `https://api.dpbossking.com/api/v1`

For browser session/events use [sdk-client.md](./sdk-client.md). For Java servers use [sdk-java.md](./sdk-java.md).

See also: [game-sdk.md](./game-sdk.md) · [sdk-client.md](./sdk-client.md) · [sdk-java.md](./sdk-java.md)

---

## Purpose

Server-side wallet operations:

- `getBalance` — fetch player balance
- `getPlayerProfile` — fetch player profile
- `debit` — deduct from wallet
- `credit` — add to wallet

`operatorId` is resolved from `sessionToken` on Provider — do **not** pass it.

---

## Install

```bash
npm install @gamotech/game-sdk-nodejs
```

---

## Quick start

```javascript
import { ProviderGameServerSDK } from "@gamotech/game-sdk-nodejs";

const wallet = new ProviderGameServerSDK({
  apiBaseUrl: process.env.PROVIDER_API_URL,
  gameServerKey: process.env.GAME_SERVER_API_KEY,
});

// Balance
const balance = await wallet.getBalance({ sessionToken });

// Debit
const debitResult = await wallet.debit({
  sessionToken,
  amount: 100,
  transactionId: "tx_abc123",
  roundId: "round_001",
  tableId: "table_001",
});

// Credit
const creditResult = await wallet.credit({
  sessionToken,
  amount: 200,
  transactionId: "tx_def456",
  roundId: "round_001",
});
```

---

## Express example

```javascript
import express from "express";
import { ProviderGameServerSDK } from "@gamotech/game-sdk-nodejs";

const app = express();
app.use(express.json());

const wallet = new ProviderGameServerSDK({
  gameServerKey: process.env.GAME_SERVER_API_KEY,
});

app.post("/api/bet", async (req, res) => {
  try {
    const { sessionToken, amount, roundId, transactionId } = req.body;
    const result = await wallet.debit({
      sessionToken,
      amount,
      transactionId,
      roundId,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});
```

---

## API

| Method | Required fields | Description |
|--------|-----------------|-------------|
| `getBalance({ sessionToken })` | `sessionToken` | Fetch player balance |
| `getPlayerProfile({ sessionToken })` | `sessionToken` | Fetch player profile |
| `debit({ sessionToken, amount, transactionId, ... })` | `sessionToken`, `amount`, `transactionId` | Debit wallet |
| `credit({ sessionToken, amount, transactionId, ... })` | `sessionToken`, `amount`, `transactionId` | Credit wallet |

Optional on debit/credit: `roundId`, `tableId`, and any extra fields forwarded to Provider.

---

## REST endpoints used

| Action | Method | Path |
|--------|--------|------|
| Get balance | POST | `/adapters/balance` |
| Debit | POST | `/adapters/debit` |
| Credit | POST | `/adapters/credit` |
| Player profile | POST | `/adapters/player-profile` |

Headers sent by SDK:

```http
Content-Type: application/json
X-Game-Server-Key: your-game-server-secret
Authorization: Bearer {sessionToken}
```

---

## Environment

```env
PROVIDER_API_URL=https://api.dpbossking.com/api/v1
GAME_SERVER_API_KEY=your-long-random-secret
```

`GAME_SERVER_API_KEY` must match the value set on Operator Adapter (`opa.dpbossking.com`).

**Never** expose `GAME_SERVER_API_KEY` to the browser.

---

## Errors

Throws `ProviderSDKError`:

| Property | Description |
|----------|-------------|
| `message` | Error description |
| `status` | HTTP status (if available) |
| `data` | Raw API response |

| Error | Fix |
|-------|-----|
| gameServerKey is required | Set `GAME_SERVER_API_KEY` on server |
| 401 on wallet | Wrong or missing `X-Game-Server-Key` |
| 404 integration | Operator integration not configured on OPA |
| Network error | Check `PROVIDER_API_URL` and connectivity |

---

## Publish (maintainers)

```bash
cd sdks/nodejs
npm publish --access public
```
