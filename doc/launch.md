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
    "currency": "INR",
    "apiSecretPath": "gamotech/operators/AAKDA-001"
  }'
```

## Secret path (from request body)

`apiSecretPath` is sent in the request body. It is verified against `operator.apiSecretPath` from the operators API, then used to fetch the secret from AWS Secrets Manager.

## HMAC Signature

Both operator and provider sign the same payload using the shared secret (`sk_live_xxxx`) from AWS Secrets Manager.

```
Payload = {timestamp}\n{METHOD}\n{path}\n{rawBody}
Signature = HMAC-SHA256(secret, payload) as hex
```

Example for launch:

```
1725440000
POST
/api/v1/launch
{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR","apiSecretPath":"gamotech/operators/AAKDA-001"}
```

## Generate signature (local dev)

```bash
node scripts/generate-signature.js POST /api/v1/launch 1725440000 <secret> '{"operatorId":"AAKDA-001","playerId":"P1001","gameCode":"TEENPATTI","currency":"INR","apiSecretPath":"gamotech/operators/AAKDA-001"}'
```

## Validation flow

1. Read `apiSecretPath` from request body
2. Read `X-API-Key`, `X-Timestamp`, `X-Signature` from headers
3. Fetch operator from operators API and match `X-API-Key`
4. Verify body `apiSecretPath` matches `operator.apiSecretPath`
5. Load secret from AWS Secrets Manager using that path
6. Build HMAC payload from timestamp + method + path + raw body
7. Compare signatures — accept if they match

## Environment (.env)

```env
AWS_REGION=ap-south-1
```
