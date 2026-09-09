# Operator Adapter Service

**Folder:** `operatorAdapter/`  
**Port:** `3005`  
**Production URL:** proxied via `https://api.dpbossking.com/api/v1`

## Purpose

Stores per-operator integration configs (endpoints, auth, transport) and executes wallet/player operations against operator systems — supporting API, RabbitMQ, and Kafka transports.

## Architecture

```
Game / Wallet Service
        │
        ▼
API Gateway
        │
        ▼
Operator Adapter
  ├── Integration CRUD (MongoDB)
  └── Adapter Runtime
        ├── API transport
        ├── RabbitMQ transport
        └── Kafka transport
```

## Integration model

```json
{
  "operatorId": "AAKDA-001",
  "name": "Aakda",
  "adapter": "aakda-v1",
  "status": "ACTIVE",
  "environment": "PRODUCTION",
  "transport": { "type": "API", "api": { "baseUrl": "https://..." } },
  "auth": { "type": "HMAC", "hmac": { "secretRef": "..." } },
  "operations": {
    "playerProfile": { "method": "GET", "path": "/players/{playerId}" },
    "balance": { "method": "GET", "path": "/players/{playerId}/balance" },
    "debit": { "method": "POST", "path": "/wallet/debit" },
    "credit": {
      "transport": { "type": "KAFKA", "kafka": { "brokers": ["..."], "topic": "credit" } }
    }
  },
  "capabilities": {
    "supportsDebit": true,
    "supportsCredit": true,
    "asyncCredit": true
  }
}
```

Each operation can override `transport` — e.g. debit via API, credit via Kafka.

## Integration CRUD

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/integrations` | List integrations |
| GET | `/api/v1/integrations/:operatorId` | Get one |
| POST | `/api/v1/integrations` | Create |
| PUT | `/api/v1/integrations/:operatorId` | Update |
| PATCH | `/api/v1/integrations/:operatorId/status` | Update status |
| DELETE | `/api/v1/integrations/:operatorId` | Delete |

## Adapter runtime (execute operations)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/v1/adapters/:operatorId/player-profile` | Fetch player info |
| GET/POST | `/api/v1/adapters/:operatorId/balance` | Fetch balance |
| POST | `/api/v1/adapters/:operatorId/debit` | Debit wallet |
| POST | `/api/v1/adapters/:operatorId/credit` | Credit wallet |

### Debit / credit body (server only)

Requires `sessionToken` + `X-Game-Server-Key`. `playerId` is resolved from session.

```http
POST /api/v1/adapters/AAKDA-001/debit
X-Game-Server-Key: your-game-server-secret
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "sessionToken": "...",
  "amount": 100,
  "transactionId": "tx_abc123",
  "roundId": "round_001"
}
```

### Success — API transport

```json
{
  "success": true,
  "message": "Operation completed",
  "transport": "API",
  "async": false,
  "data": { "balance": 900 }
}
```

### Success — Kafka / RabbitMQ transport

```json
{
  "success": true,
  "message": "Operation queued",
  "transport": "KAFKA",
  "async": true,
  "data": { "queued": true, "topic": "credit-events" }
}
```

## Transport types

| Type | Use case | Required config |
|------|----------|-----------------|
| `API` | Sync REST calls | `transport.api.baseUrl`, `operations.*.path` |
| `RABBITMQ` | Async queue credit/debit | `transport.rabbitmq.url` + `exchange` or `queue` |
| `KAFKA` | Async event credit | `transport.kafka.brokers`, `topic` |

## Auth types

`NONE`, `API_KEY`, `BEARER`, `BASIC`, `HMAC`, `CUSTOM`

Secrets resolve from AWS Secrets Manager, or local dev via `env:MY_SECRET_VAR`.

## Environment

```env
PORT=3005
MONGO_URI=mongodb://localhost:27017/operatorAdapter
CORS_ORIGIN=https://gamotech-games.vercel.app,http://localhost:5173
SESSION_SERVICE_URL=http://localhost:3004
GAME_SERVER_API_KEY=your-long-random-secret
AWS_REGION=ap-south-1
```

## Run locally

```bash
cd operatorAdapter && npm install && npm start
```

Gateway env:

```env
OPERATOR_ADAPTER_SERVICE_URL=http://localhost:3005
```

## Project structure

```
operatorAdapter/
├── config/db.js
├── models/OperatorIntegration.js
├── services/
│   ├── operatorIntegrationService.js
│   ├── adapterExecutor.js
│   ├── authService.js
│   ├── secretsService.js
│   └── transports/
│       ├── apiTransport.js
│       ├── rabbitmqTransport.js
│       └── kafkaTransport.js
├── controllers/
│   ├── operatorIntegrationController.js
│   └── adapterController.js
└── routes/
    ├── operatorIntegration.js
    └── adapter.js
```
