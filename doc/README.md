# Provider Platform Documentation

## Services

| Service | Doc | Port | Folder |
|---------|-----|------|--------|
| API Gateway | [api-gateway.md](./api-gateway.md) | 3000 | `api/` |
| Launch Service | [launch-service.md](./launch-service.md) | 3001 | `launchService/` |
| Enabled Games Service | [enabled-games.md](./enabled-games.md) | 3002 | `enbledgames/` |
| Session Service | [session-service.md](./session-service.md) | 3004 | `session/` |
| Operator Adapter | [operator-adapter.md](./operator-adapter.md) | 3005 | `operatorAdapter/` |

## Game integration

Full end-to-end guide — operator onboarding, enabled games, launch (HMAC), and game client:

**[game-integration.md](./game-integration.md)**

## Platform flow

```
Operator
    │
    ▼
API Gateway (api.dpbossking.com)
    │
    ├── POST /launch ──────────► Launch Service ──► Session Service (create)
    ├── GET  /enabled-games ───► Enabled Games Service
    └── POST /sessions/* ──────► Session Service (validate / events / track)
    └── POST /adapters/* ──────► Operator Adapter (balance / debit / credit)
                                        │
                                        ▼
                                   MongoDB
    │
    ▼
Game opens launchUrl (?sessionToken=...)
    │
    ├── validate session
    ├── create table/round locally
    └── send events to Session Service
```

## Run all services locally

```bash
cd session && npm start        # :3004
cd launchService && npm start  # :3001
cd enbledgames && npm start    # :3002
cd operatorAdapter && npm start # :3005
cd api && npm start            # :3000
```

## External APIs (Operators / Games)

- Operators API: `https://admin.dpbossking.com/api/v1`
- Gateway: `https://api.dpbossking.com/api/v1`
