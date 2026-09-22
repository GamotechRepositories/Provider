# Session Service

**Folder:** `session/`  
**Port:** `3004`  
**Production URL:** `https://session.dpbossking.com`

## Purpose

Owns session lifecycle and game event tracking. Stores current session state and historical events in MongoDB.

## Design rules

| Rule | Detail |
|------|--------|
| Session = current state | `sessions` collection |
| Events = historical timeline | `session_events` collection |
| Never mix the two | Separate collections, separate queries |
| External ID | `sessionToken` (between services/game) |
| Internal ID | `sessionId` (`_id`, inside Session Service only) |

## Flow

```
Launch Service  →  POST /sessions              (create)
Game            →  POST /sessions/validate     (validate)
Game            →  POST /sessions/events       (report events)
Admin           →  GET  /admin/sessions        (list, requires X-Admin-Key)
Admin           →  GET  /admin/sessions/track  (audit by token)
Admin           →  GET  /admin/sessions/:id    (detail + events)
```

## Endpoints

| Method | Route | Caller | Description |
|--------|-------|--------|-------------|
| POST | `/api/v1/sessions` | Launch Service (internal) | Create session |
| POST | `/api/v1/sessions/validate` | Game (via gateway) | Validate sessionToken |
| POST | `/api/v1/sessions/events` | Game (via gateway) | Record lifecycle event |
| GET | `/api/v1/admin/sessions` | Admin (via gateway) | List sessions (paginated) |
| GET | `/api/v1/admin/sessions/stats/by-operator` | Admin (via gateway) | Win/loss stats for an operator |
| GET | `/api/v1/admin/sessions/stats/by-game` | Admin (via gateway) | Win/loss stats for a game |
| GET | `/api/v1/admin/sessions/events/by-operator` | Admin (via gateway) | Round results for an operator |
| GET | `/api/v1/admin/sessions/events/by-game` | Admin (via gateway) | Round results for a game |
| GET | `/api/v1/admin/sessions/track` | Admin (via gateway) | Load session + events by token |
| GET | `/api/v1/admin/sessions/:sessionId` | Admin (via gateway) | Load session + events by ID |
| GET | `/health` | — | Health check |

All `/admin/*` routes require header `X-Admin-Key` matching `ADMIN_API_KEY`.

## MongoDB collections

### `sessions` — current state

```json
{
  "_id": "sessionId",
  "sessionToken": "abc123",
  "operatorId": "AAKDA-001",
  "playerId": "P1001",
  "playerUsername": "john_doe",
  "gameCode": "TEENPATTI",
  "status": "ACTIVE",
  "gameContext": {
    "tableId": "table_789",
    "currentRoundId": "round_001"
  },
  "lastEventId": "665g...",
  "expiresAt": "..."
}
```

### `session_events` — audit timeline

```json
{
  "_id": "665f...",
  "sessionId": "sessionId",
  "event": "TABLE_CREATED",
  "payload": { "tableId": "table_789" },
  "createdAt": "..."
}
```

## Internal query pattern

```
1. resolveSessionToken(sessionToken) → sessionId
2. Session.findById(sessionId)
3. SessionEvent.find({ sessionId }).sort({ createdAt: 1 })
```

## Game events

```bash
POST /api/v1/sessions/events
{
  "sessionToken": "abc123",
  "event": "ROUND_STARTED",
  "payload": {
    "roundId": "round_001",
    "betAmount": 100
  }
}
```

### Event types

| Event | Updates `gameContext` |
|-------|----------------------|
| `TABLE_CREATED` | `tableId` |
| `ROUND_CREATED` | `currentRoundId` |
| `ROUND_STARTED` | `currentRoundId` |
| `ROUND_ENDED` | — |
| `SESSION_ENDED` | `status` → ENDED |

## External vs internal responses

**External (game/launch)** — no internal IDs:
```json
{
  "sessionToken": "abc123",
  "status": "ACTIVE",
  "gameContext": { "tableId": "table_789", "currentRoundId": "round_001" }
}
```

**Internal/admin (track)** — IDs exposed:
```json
{
  "session": { "sessionId": "...", "sessionToken": "abc123", "lastEventId": "..." },
  "events": [{ "eventId": "...", "sessionId": "...", "event": "TABLE_CREATED" }]
}
```

## Project structure

```
session/
├── config/
│   └── db.js
├── controllers/
│   ├── sessionController.js
│   └── adminSessionController.js
├── middleware/
│   └── adminAuth.js
├── models/
│   ├── Session.js
│   └── SessionEvent.js
├── routes/
│   ├── session.js
│   └── adminSession.js
└── services/
    ├── sessionService.js
    └── sessionAnalyticsService.js
```

## Admin APIs

All admin routes require:

```
X-Admin-Key: <ADMIN_API_KEY>
```

### List sessions

```
GET /api/v1/admin/sessions?page=1&limit=20&operatorId=AAKDA-001&status=ACTIVE
```

Query filters: `operatorId`, `playerId`, `gameCode`, `status`, `from`, `to`, `page`, `limit` (max 100).

```json
{
  "success": true,
  "sessions": [{ "sessionId": "...", "sessionToken": "...", "status": "ACTIVE" }],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### Track by sessionToken

```
GET /api/v1/admin/sessions/track?sessionToken=abc123
```

### Detail by sessionId

```
GET /api/v1/admin/sessions/665e1234abcd5678ef901234
```

Returns `{ success, session, events }` — same shape as track.

### Win/loss stats by operator

Uses `ROUND_ENDED` events where games send `payload.result` (`WIN`, `LOSS`, `DRAW`).

```
GET /api/v1/admin/sessions/stats/by-operator?operatorId=AAKDA-001&gameCode=POTLUDO&from=2026-09-01&to=2026-09-22
```

```json
{
  "success": true,
  "filters": { "operatorId": "AAKDA-001", "gameCode": "POTLUDO" },
  "summary": {
    "totalRounds": 120,
    "wins": 55,
    "losses": 60,
    "draws": 3,
    "unknown": 2,
    "totalPayout": 15000,
    "totalBet": 12000
  },
  "byPlayer": [
    {
      "playerId": "P1001",
      "playerUsername": "john_doe",
      "wins": 10,
      "losses": 8,
      "draws": 0,
      "unknown": 0,
      "totalRounds": 18,
      "totalPayout": 2000,
      "totalBet": 1800,
      "netPayout": 200
    }
  ]
}
```

### Win/loss stats by game

```
GET /api/v1/admin/sessions/stats/by-game?gameCode=POTLUDO&operatorId=AAKDA-001
```

Same response shape as operator stats.

### Round result events by operator

```
GET /api/v1/admin/sessions/events/by-operator?operatorId=AAKDA-001&result=WIN&page=1&limit=20
```

```json
{
  "success": true,
  "filters": { "operatorId": "AAKDA-001", "result": "WIN" },
  "events": [
    {
      "eventId": "...",
      "sessionId": "...",
      "operatorId": "AAKDA-001",
      "gameCode": "POTLUDO",
      "playerId": "P1001",
      "playerUsername": "john_doe",
      "event": "ROUND_ENDED",
      "roundId": "round_001",
      "result": "WIN",
      "payout": 200,
      "betAmount": 100,
      "createdAt": "2026-09-11T05:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 55, "totalPages": 3 }
}
```

### Round result events by game

```
GET /api/v1/admin/sessions/events/by-game?gameCode=POTLUDO&operatorId=AAKDA-001&result=LOSS
```

**Game must send on round end:**

```json
{
  "event": "ROUND_ENDED",
  "roundId": "round_001",
  "payload": { "result": "WIN", "payout": 200, "betAmount": 100 }
}
```

**Errors:** `401` invalid/missing key · `503` `ADMIN_API_KEY` not configured on server

## Environment

```env
PORT=3004
MONGO_URI=mongodb+srv://...
ADMIN_API_KEY=your-long-random-admin-secret
```

## Run locally

```bash
cd session && npm start
```

## Full game lifecycle

```
1. Launch Service → creates session
2. Game validates sessionToken
3. Game creates table/round locally
4. Game sends TABLE_CREATED event
5. Game sends ROUND_STARTED event
6. Game sends ROUND_ENDED event
7. Game sends SESSION_ENDED event
```

See **[game-integration.md](./game-integration.md)** for request/response examples and a complete client implementation guide.
