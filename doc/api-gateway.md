# API Gateway

**Folder:** `api/`  
**Port:** `3000`  
**Production URL:** `https://api.dpbossking.com`

## Purpose

Single entry point for all external clients (operators, games). The gateway has **no business logic** — it only proxies requests to the correct microservice and returns the response as-is.

## Architecture

```
Operator / Game
      │
      ▼
API Gateway (:3000)
      │
      ├──► Launch Service
      ├──► Enabled Games Service
      ├──► Session Service
      └──► Operator Adapter Service
```

## Routes

| Method | Gateway Route | Proxies To |
|--------|---------------|------------|
| POST | `/api/v1/launch` | Launch Service `/launch` |
| POST | `/api/v1/validate-operator` | Launch Service `/validate-operator` |
| GET | `/api/v1/enabled-games?operatorId=` | Enabled Games Service `/api/v1/enabled-games` |
| POST | `/api/v1/sessions/validate` | Session Service `/api/v1/sessions/validate` |
| POST | `/api/v1/sessions/events` | Session Service `/api/v1/sessions/events` |
| GET | `/api/v1/admin/sessions` | Session Service `/api/v1/admin/sessions` (requires `X-Admin-Key`) |
| GET | `/api/v1/admin/sessions/stats/by-operator` | Session Service win/loss stats by operator |
| GET | `/api/v1/admin/sessions/stats/by-game` | Session Service win/loss stats by game |
| GET | `/api/v1/admin/sessions/events/by-operator` | Session Service round results by operator |
| GET | `/api/v1/admin/sessions/events/by-game` | Session Service round results by game |
| GET | `/api/v1/admin/sessions/track?sessionToken=` | Session Service `/api/v1/admin/sessions/track` |
| GET | `/api/v1/admin/sessions/:sessionId` | Session Service `/api/v1/admin/sessions/:sessionId` |
| GET/POST/PUT/PATCH/DELETE | `/api/v1/integrations/*` | Operator Adapter integration CRUD |
| GET/POST | `/api/v1/adapters/player-profile` | Operator Adapter player profile |
| GET/POST | `/api/v1/adapters/balance` | Operator Adapter balance |
| POST | `/api/v1/adapters/debit` | Operator Adapter debit |
| POST | `/api/v1/adapters/credit` | Operator Adapter credit |

## Environment

```env
PORT=3000
LAUNCH_SERVICE_URL=http://localhost:3001
ENABLED_GAMES_SERVICE_URL=http://localhost:3002
SESSION_SERVICE_URL=http://localhost:3004
OPERATOR_ADAPTER_SERVICE_URL=http://localhost:3005
```

## Run locally

```bash
cd api && npm start
```

## Notes

- Launch routes forward `X-API-Key`, `X-Timestamp`, `X-Signature` headers and raw body unchanged (required for HMAC).
- Session routes forward `Authorization` header, `X-Admin-Key`, and body/query params.
- Admin session routes require `X-Admin-Key` matching Session Service `ADMIN_API_KEY`.
- Session creation (`POST /sessions`) is **internal only** — called by Launch Service, not exposed via gateway.
