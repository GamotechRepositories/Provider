# Launch API

## Request

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

## HMAC Signature

Both operator and provider sign the same payload using the shared secret (`sk_live_xxxx`) from AWS Secrets Manager (`apiSecretPath`).

```
Payload = {timestamp}\n{METHOD}\n{path}\n{rawBody}
Signature = HMAC-SHA256(secret, payload) as hex
```

Example for launch:

```
1725440000
POST
/api/v1/launch
{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR"}
```

## Generate signature (local dev)

```bash
node scripts/generate-signature.js POST /api/v1/launch 1725440000 sk_live_test '{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR"}'
```

## Validation flow

1. Read `X-API-Key`, `X-Timestamp`, `X-Signature` from headers
2. Fetch operator from operators API and match `X-API-Key`
3. Load secret from AWS Secrets Manager using `operator.apiSecretPath`
4. Build payload from timestamp + method + path + raw request body
5. Compare operator HMAC with provider HMAC — accept if they match

## Local secrets (.env)

```env
SECRETS_LOCAL={"gamotech/operators/AAKDA-001":"sk_live_test"}
```
