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
      └──► Session Service
```

## Routes

| Method | Gateway Route | Proxies To |
|--------|---------------|------------|
| POST | `/api/v1/launch` | Launch Service `/launch` |
| POST | `/api/v1/validate-operator` | Launch Service `/validate-operator` |
| GET | `/api/v1/enabled-games?operatorId=` | Enabled Games Service `/api/v1/enabled-games` |
| POST | `/api/v1/sessions/validate` | Session Service `/api/v1/sessions/validate` |
| POST | `/api/v1/sessions/events` | Session Service `/api/v1/sessions/events` |
| GET | `/api/v1/sessions/track?sessionToken=` | Session Service `/api/v1/sessions/track` |

## Environment

```env
PORT=3000
LAUNCH_SERVICE_URL=http://localhost:3001
ENABLED_GAMES_SERVICE_URL=http://localhost:3002
SESSION_SERVICE_URL=http://localhost:3004
```

## Run locally

```bash
cd api && npm start
```

## Notes

- Launch routes forward `X-API-Key`, `X-Timestamp`, `X-Signature` headers and raw body unchanged (required for HMAC).
- Session routes forward `Authorization` header and body/query params.
- Session creation (`POST /sessions`) is **internal only** — called by Launch Service, not exposed via gateway.
