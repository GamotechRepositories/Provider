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
    "playerProfile": { "method": "GET", "path": "/players/{playerId}", "timeoutMs": 10000 },
    "balance": { "method": "GET", "path": "/players/{playerId}/balance" },
    "debit": { "method": "POST", "path": "/wallet/debit" },
    "credit": {
      "transport": { "type": "KAFKA", "kafka": { "brokers": ["..."], "topic": "credit" } }
    }
  },
  "createdBy": "admin@provider.com",
  "updatedBy": "admin@provider.com",
  "publishedBy": "admin@provider.com",
  "capabilities": {
    "supportsDebit": true,
    "supportsCredit": true,
    "asyncCredit": true
  }
}
```

Each operation can override `transport` — e.g. debit via API, credit via Kafka.

Each operation can also define its own **auth**, **headers**, and **payload** so every URL can follow a different operator flow.

```json
{
  "operations": {
    "debit": {
      "method": "POST",
      "path": "wallet/debit",
      "auth": {
        "type": "BEARER",
        "bearer": { "tokenRef": "env:AAKDA_BEARER_TOKEN" }
      },
      "headers": {
        "X-Request-Source": "gamotech",
        "Authorization": {
          "valueRef": "env:AAKDA_BEARER_TOKEN",
          "prefix": "Bearer "
        }
      },
      "payload": {
        "static": { "currency": "INR" },
        "mapping": {
          "amount": "betAmount",
          "transactionId": "txnId",
          "playerId": "userId"
        },
        "template": {
          "gameCode": "{gameCode}",
          "roundId": "{roundId}"
        }
      }
    },
    "balance": {
      "method": "GET",
      "path": "wallet/balance/{playerId}",
      "headers": {
        "Authorization": "env:AAKDA_BEARER_TOKEN"
      }
    }
  }
}
```

**Payload fields**

| Field | Purpose |
|-------|---------|
| `payload.static` | Always send these fields |
| `payload.mapping` | Rename incoming fields (same as legacy `requestMapping`) |
| `payload.template` | Body template with placeholders like `{playerId}`, `{amount}` |

**Headers (dynamic)**

`headers` accepts any shape — object map or array:

```json
{
  "Authorization": {
    "valueRef": "env:AAKDA_BEARER_TOKEN",
    "prefix": "Bearer ",
    "suffix": ""
  },
  "X-Source": "gamotech",
  "X-Api-Key": "env:AAKDA_API_KEY"
}
```

Or array form:

```json
[
  { "name": "Authorization", "valueRef": "env:TOKEN", "prefix": "Bearer " },
  { "X-Custom": "literal-value" }
]
```

String values starting with `env:` or AWS secret paths are resolved at runtime. Any extra fields on header entries (e.g. `prefix`, `suffix`) are supported.

`auth.type` is a free-form string. Built-in presets: `NONE`, `API_KEY`, `BEARER`, `BASIC`, `HMAC`, `CUSTOM`. For anything else, use `auth.headers` or per-operation `headers`.

Operation-level `auth` overrides integration-level `auth` for that URL only.

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
| GET/POST | `/api/v1/adapters/player-profile` | Fetch player info |
| GET/POST | `/api/v1/adapters/balance` | Fetch balance |
| POST | `/api/v1/adapters/debit` | Debit wallet |
| POST | `/api/v1/adapters/credit` | Credit wallet |

`operatorId` is resolved from `sessionToken` — not required in the URL.

### Debit / credit body (server only)

Requires `sessionToken` + `X-Game-Server-Key`. `operatorId` and `playerId` are resolved from session.

```http
POST /api/v1/adapters/debit
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
  "operatorId": "AAKDA-001",
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

## Auth and secrets

`auth.type` enum: `NONE`, `API_KEY`, `BEARER`, `BASIC`, `HMAC`, `CUSTOM`.

`operations` is a dynamic map — add any operation key (`debit`, `balance`, custom flows).

`timeoutMs` on operations and `transport.api.timeoutMs` must be between `100` and `60000`.

Audit fields: `createdBy`, `updatedBy`, `publishedBy`.

Secrets resolve from AWS Secrets Manager, or local dev via `env:MY_SECRET_VAR`.

For custom operator flows, set `auth.type` to any label and define `auth.headers` or per-operation `headers` with `valueRef`.

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
