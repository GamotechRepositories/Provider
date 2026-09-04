# Launch API

## Architecture

```
Operator → API Gateway (port 3000) → Launch Service (port 3001) → Operators API / AWS Secrets Manager
```

- **`api/`** — API gateway only (proxies requests)
- **`launchService/`** — launch microservice (validation + HMAC logic)

## Request (via API Gateway)

```bash
curl -X POST http://localhost:3000/api/v1/launch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 376f993698dbadb19257121d4ac7dcaf" \
  -H "X-Timestamp: 1725440000" \
  -H "X-Signature: <HMAC_SIGNATURE>" \
  -d '{
    "operatorId": "AAKDA-001",
    "playerId": "P1001",
    "gameCode": "TEENPATTI",
    "currency": "INR"
  }'
```

## Secret path (from operators API)

`apiSecretPath` is **not** sent in the launch request. It is resolved from the operators API using `operatorId`, then used to fetch the secret from AWS Secrets Manager.

## HMAC Signature

Both operator and provider sign the same payload using the shared secret from AWS Secrets Manager.

```
Payload = {timestamp}\n{METHOD}\n{path}\n{rawBody}
Signature = HMAC-SHA256(secret, payload) as hex
```

The `path` is the **gateway path** (e.g. `/api/v1/launch`), not the internal microservice path.

## Run locally

```bash
# Terminal 1 — launch microservice
cd launchService && npm start

# Terminal 2 — API gateway
cd api && npm start
```

## Generate signature (local dev)

```bash
node launchService/scripts/generate-signature.js POST /api/v1/launch 1725440000 <secret> '{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR"}'
```

## Environment

**API Gateway (`api/.env`)**
```env
PORT=3000
LAUNCH_SERVICE_URL=http://localhost:3001
```

**Launch Service (`launchService/.env`)**
```env
PORT=3001
OPERATOR_BASE_URL=https://gamotech-games.onrender.com/api/v1
AWS_REGION=ap-south-1
```
