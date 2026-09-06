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
Launch Service  →  POST /sessions           (create)
Game            →  POST /sessions/validate  (validate)
Game            →  POST /sessions/events    (report events)
Admin           →  GET  /sessions/track      (audit)
```

## Endpoints

| Method | Route | Caller | Description |
|--------|-------|--------|-------------|
| POST | `/api/v1/sessions` | Launch Service (internal) | Create session |
| POST | `/api/v1/sessions/validate` | Game (via gateway) | Validate sessionToken |
| POST | `/api/v1/sessions/events` | Game (via gateway) | Record lifecycle event |
| GET | `/api/v1/sessions/track` | Admin (via gateway) | Load session + events |
| GET | `/health` | — | Health check |

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
│   └── sessionController.js
├── models/
│   ├── Session.js
│   └── SessionEvent.js
├── routes/
│   └── session.js
└── services/
    └── sessionService.js
```

## Environment

```env
PORT=3004
MONGO_URI=mongodb+srv://...
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
