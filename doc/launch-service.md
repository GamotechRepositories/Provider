# Launch Service

**Folder:** `launchService/`  
**Port:** `3001` (local) / `3003` (production server)

## Purpose

Validates operator launch requests (HMAC + operator lookup), creates a session via Session Service, and returns `sessionToken` + `launchUrl`.

## Flow

```
API Gateway
      │
      ▼
Launch Service
  1. Validate HMAC signature
  2. Fetch operator from Operators API
  3. Fetch game from Games API
  4. Get secret from AWS Secrets Manager
  5. Call Session Service → create session
  6. Return launchUrl + sessionToken
```

## Endpoints (internal)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/launch` | Launch a game for a player |
| POST | `/validate-operator` | Validate operator credentials only |
| GET | `/health` | Health check |

## Launch request (via Gateway)

```bash
POST https://api.dpbossking.com/api/v1/launch

Headers:
  Content-Type: application/json
  X-API-Key: <operator apiKey>
  X-Timestamp: <unix timestamp>
  X-Signature: <HMAC-SHA256 hex>

Body:
{
  "operatorId": "AAKDA-001",
  "playerId": "P1001",
  "gameCode": "TEENPATTI",
  "currency": "INR"
}
```

## HMAC signature

```
Payload = {timestamp}\n{METHOD}\n{path}\n{rawBody}
Signature = HMAC-SHA256(secret, payload) as hex
```

- `path` must be the **gateway path**: `/api/v1/launch`
- Secret is fetched from AWS using `operator.apiSecretPath` from Operators API

## Success response

```json
{
  "success": true,
  "sessionToken": "abc123...",
  "expiresAt": "2026-09-05T16:00:00.000Z",
  "launchUrl": "https://www.doormart.shop/?sessionToken=abc123",
  "launch": {
    "operatorId": "AAKDA-001",
    "playerId": "P1001",
    "gameCode": "TEENPATTI",
    "gameName": "Teen Patti",
    "launchUrl": "https://www.doormart.shop/?sessionToken=abc123"
  }
}
```

## Project structure

```
launchService/
├── controllers/
│   ├── launchController.js
│   ├── validateOperatorController.js
│   └── helpers.js
├── routes/
│   ├── launch.js
│   └── validateOperator.js
├── services/
│   ├── operatorService.js
│   ├── operatorRepository.js
│   ├── gameRepository.js
│   ├── secretsService.js
│   └── sessionRepository.js
└── utils/
    ├── hmac.js
    └── buildLaunchUrl.js
```

## Environment

```env
PORT=3001
OPERATOR_BASE_URL=https://admin.dpbossking.com/api/v1
SESSION_SERVICE_URL=http://localhost:3004
TIMESTAMP_TOLERANCE_SECONDS=300
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

## Run locally

```bash
# Requires Session Service running
cd launchService && npm start
```

## Generate HMAC (dev)

```bash
node launchService/scripts/generate-signature.js POST /api/v1/launch <timestamp> <secret> '{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR"}'
```
